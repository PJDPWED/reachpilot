import { google } from 'googleapis'
import { createServerSupabaseClient } from './supabase'
import type { GmailToken } from '@/types'

// ─── OAuth2 Client Factory ─────────────────────────────────────────────────────

export function createOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!,
    `${process.env.NEXTAUTH_URL}/api/auth/callback/google`
  )
}

// ─── Token Management ──────────────────────────────────────────────────────────

export async function saveGmailTokens(
  userEmail: string,
  accessToken: string,
  refreshToken: string,
  expiryDate: number
): Promise<void> {
  const db = createServerSupabaseClient()
  await db
    .from('gmail_tokens')
    .upsert(
      {
        user_email: userEmail,
        access_token: accessToken,
        refresh_token: refreshToken,
        expiry_date: expiryDate,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_email' }
    )
    .throwOnError()
}

export async function loadGmailTokens(userEmail: string): Promise<GmailToken | null> {
  const db = createServerSupabaseClient()
  const { data, error } = await db
    .from('gmail_tokens')
    .select('*')
    .eq('user_email', userEmail)
    .single()

  if (error || !data) return null
  return data as GmailToken
}

/**
 * Returns an authenticated OAuth2 client for a user.
 * Forces a token refresh if the access token is expired or about to expire.
 */
export async function getAuthenticatedClient(userEmail: string) {
  const tokens = await loadGmailTokens(userEmail)
  if (!tokens) {
    throw new Error(
      `No Gmail tokens found for ${userEmail}. ` +
        'Please sign in with Google and grant Gmail access.'
    )
  }

  if (!tokens.refresh_token) {
    throw new Error(
      `Missing refresh token for ${userEmail}. ` +
        'Please sign out and re-authenticate with Google (ensure offline access is granted).'
    )
  }

  const oauth2Client = createOAuth2Client()
  oauth2Client.setCredentials({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expiry_date: tokens.expiry_date,
  })

  // Auto-persist refreshed tokens
  oauth2Client.on('tokens', async (newTokens) => {
    if (newTokens.access_token) {
      await saveGmailTokens(
        userEmail,
        newTokens.access_token,
        tokens.refresh_token, // refresh_token is stable unless user revokes
        newTokens.expiry_date ?? tokens.expiry_date
      ).catch((err) =>
        console.error('[Gmail] Failed to persist refreshed tokens:', err)
      )
    }
  })

  // Pro-actively refresh if token expires within the next 5 minutes
  const fiveMinutes = 5 * 60 * 1000
  const isExpiredOrExpiring =
    !tokens.expiry_date || tokens.expiry_date - Date.now() < fiveMinutes

  if (isExpiredOrExpiring) {
    try {
      const { credentials } = await oauth2Client.refreshAccessToken()
      oauth2Client.setCredentials(credentials)
      if (credentials.access_token) {
        await saveGmailTokens(
          userEmail,
          credentials.access_token,
          tokens.refresh_token,
          (credentials.expiry_date as number) ?? tokens.expiry_date
        )
      }
    } catch (err) {
      const msg = (err as Error).message || String(err)
      throw new Error(
        `Gmail token refresh failed for ${userEmail}: ${msg}. ` +
          'The user may need to re-authenticate.'
      )
    }
  }

  return oauth2Client
}

// ─── Email Sending ─────────────────────────────────────────────────────────────

export interface AttachmentInput {
  /** Publicly accessible URL (e.g. Supabase Storage signed URL) */
  url: string
  /** Filename to use in the email (e.g. "Lebenslauf_Omar.pdf") */
  filename: string
  /** MIME type (e.g. "application/pdf", "image/jpeg") */
  mimeType: string
}

export interface SendEmailOptions {
  userEmail: string
  to: string
  subject: string
  body: string
  replyToMessageId?: string
  threadId?: string
  /** Optional array of file attachments */
  attachments?: AttachmentInput[]
}

export interface SentEmailResult {
  messageId: string
  threadId: string
}

// ─── MIME Builder Helpers ──────────────────────────────────────────────────────

function encodeWordIfNeeded(str: string): string {
  // RFC 2047 encode if non-ASCII characters present
  if (/[^\x00-\x7F]/.test(str)) {
    return `=?UTF-8?B?${Buffer.from(str, 'utf-8').toString('base64')}?=`
  }
  return str
}

/**
 * Downloads a file from a URL and returns its base64 content.
 */
async function fetchAttachmentAsBase64(url: string): Promise<string> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch attachment from ${url}: HTTP ${response.status}`)
  }
  const buffer = await response.arrayBuffer()
  return Buffer.from(buffer).toString('base64')
}

/**
 * Builds a MIME multipart/mixed message with the text body + file attachments.
 * Returns the full raw RFC 2822 message string.
 */
async function buildMimeMultipart(options: {
  from: string
  to: string
  subject: string
  body: string
  date: string
  replyToMessageId?: string
  attachments: AttachmentInput[]
}): Promise<string> {
  const boundary = `==RocketLead_${Date.now()}_${Math.random().toString(36).slice(2)}`

  const lines: string[] = []

  // ── Outer headers ────────────────────────────────────────────────────────
  lines.push(`From: ${options.from}`)
  lines.push(`To: ${options.to}`)
  lines.push(`Subject: ${encodeWordIfNeeded(options.subject)}`)
  lines.push(`Date: ${options.date}`)
  lines.push('MIME-Version: 1.0')
  lines.push(`Content-Type: multipart/mixed; boundary="${boundary}"`)

  if (options.replyToMessageId) {
    lines.push(`In-Reply-To: ${options.replyToMessageId}`)
    lines.push(`References: ${options.replyToMessageId}`)
  }

  lines.push('')  // blank line before body

  // ── Text part ────────────────────────────────────────────────────────────
  lines.push(`--${boundary}`)
  lines.push('Content-Type: text/plain; charset=UTF-8')
  lines.push('Content-Transfer-Encoding: quoted-printable')
  lines.push('')
  lines.push(options.body)
  lines.push('')

  // ── Attachment parts ─────────────────────────────────────────────────────
  for (const att of options.attachments) {
    try {
      const base64Data = await fetchAttachmentAsBase64(att.url)
      const encodedFilename = encodeWordIfNeeded(att.filename)

      lines.push(`--${boundary}`)
      lines.push(`Content-Type: ${att.mimeType}; name="${encodedFilename}"`)
      lines.push('Content-Transfer-Encoding: base64')
      lines.push(`Content-Disposition: attachment; filename="${encodedFilename}"`)
      lines.push('')

      // Chunk base64 into 76-char lines (RFC 2045 requirement)
      const chunks = base64Data.match(/.{1,76}/g) || []
      lines.push(...chunks)
      lines.push('')
    } catch (err) {
      // Log but don't fail the entire email — skip this attachment
      console.warn(`[Gmail] Skipping attachment "${att.filename}":`, (err as Error).message)
    }
  }

  // ── Close boundary ───────────────────────────────────────────────────────
  lines.push(`--${boundary}--`)

  return lines.join('\r\n')
}

/**
 * Sends an email via Gmail API.
 * Supports plain text (no attachments) and MIME multipart (with attachments).
 * Builds fully RFC 2822 / RFC 2045 compliant messages.
 */
export async function sendEmail(options: SendEmailOptions): Promise<SentEmailResult> {
  const { userEmail, to, subject, body, replyToMessageId, threadId, attachments = [] } = options

  const auth = await getAuthenticatedClient(userEmail)
  const gmail = google.gmail({ version: 'v1', auth })

  const dateStr = new Date().toUTCString()
  let rawEmail: string

  if (attachments.length > 0) {
    // ── MIME multipart/mixed (attachments present) ───────────────────────
    rawEmail = await buildMimeMultipart({
      from: userEmail,
      to,
      subject,
      body,
      date: dateStr,
      replyToMessageId,
      attachments,
    })
  } else {
    // ── Simple text/plain (no attachments) ──────────────────────────────
    const emailLines: string[] = []

    emailLines.push(`From: ${userEmail}`)
    emailLines.push(`To: ${to}`)
    emailLines.push(`Subject: ${encodeWordIfNeeded(subject)}`)
    emailLines.push(`Date: ${dateStr}`)
    emailLines.push('MIME-Version: 1.0')
    emailLines.push('Content-Type: text/plain; charset=UTF-8')
    emailLines.push('Content-Transfer-Encoding: 8bit')

    if (replyToMessageId) {
      emailLines.push(`In-Reply-To: ${replyToMessageId}`)
      emailLines.push(`References: ${replyToMessageId}`)
    }

    emailLines.push('')
    emailLines.push(body)

    rawEmail = emailLines.join('\r\n')
  }

  // URL-safe base64 encoding required by Gmail API
  const encodedEmail = Buffer.from(rawEmail, 'utf-8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')

  let response
  try {
    response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedEmail,
        ...(threadId ? { threadId } : {}),
      },
    })
  } catch (err) {
    const msg = (err as { message?: string }).message || String(err)

    // Translate Google API errors into human-readable messages
    if (msg.includes('401') || msg.includes('invalid_grant')) {
      throw new Error(
        `Gmail authentication failed for ${userEmail}: Invalid or expired credentials. ` +
          'Re-authenticate with Google.'
      )
    }
    if (msg.includes('403') || msg.includes('insufficientPermissions')) {
      throw new Error(
        `Gmail permission denied for ${userEmail}: The Gmail send scope may be missing. ` +
          'Re-authenticate and grant all requested permissions.'
      )
    }
    if (msg.includes('429') || msg.includes('rateLimitExceeded')) {
      throw new Error(
        `Gmail rate limit exceeded for ${userEmail}. ` +
          'Too many emails sent in a short period. Slow down sending rate.'
      )
    }
    if (msg.includes('400') || msg.includes('invalid')) {
      throw new Error(
        `Gmail rejected the email to ${to}: Malformed message (${msg}).`
      )
    }
    if (msg.includes('dailyLimitExceeded') || msg.includes('quotaExceeded')) {
      throw new Error(
        `Gmail daily sending quota exceeded for ${userEmail}. ` +
          'Try again tomorrow or use a different account.'
      )
    }
    throw new Error(`Gmail API error sending to ${to}: ${msg}`)
  }

  if (!response.data.id || !response.data.threadId) {
    throw new Error(
      `Gmail API returned incomplete response for ${to} — no messageId or threadId.`
    )
  }

  return {
    messageId: response.data.id,
    threadId: response.data.threadId,
  }
}

// ─── Reply Detection ───────────────────────────────────────────────────────────

export interface GmailMessage {
  id: string
  threadId: string
  snippet: string
  payload: {
    headers: { name: string; value: string }[]
    body?: { data?: string }
    parts?: { mimeType: string; body: { data?: string }; parts?: { mimeType: string; body: { data?: string } }[] }[]
  }
  internalDate: string
}

export async function getThreadMessages(
  userEmail: string,
  threadId: string
): Promise<GmailMessage[]> {
  const auth = await getAuthenticatedClient(userEmail)
  const gmail = google.gmail({ version: 'v1', auth })

  const thread = await gmail.users.threads.get({
    userId: 'me',
    id: threadId,
    format: 'full',
  })

  return (thread.data.messages || []) as unknown as GmailMessage[]
}

export async function pollForReplies(
  userEmail: string,
  threadIds: string[]
): Promise<{ threadId: string; messageId: string; content: string; from: string }[]> {
  if (threadIds.length === 0) return []

  const auth = await getAuthenticatedClient(userEmail)
  const gmail = google.gmail({ version: 'v1', auth })

  const replies: { threadId: string; messageId: string; content: string; from: string }[] = []

  for (const threadId of threadIds) {
    try {
      const thread = await gmail.users.threads.get({
        userId: 'me',
        id: threadId,
        format: 'full',
      })

      const messages = thread.data.messages || []
      if (messages.length <= 1) continue

      // Get all messages after the first (our outgoing)
      const replyMessages = messages.slice(1)

      for (const msg of replyMessages) {
        const headers = msg.payload?.headers || []
        const fromHeader = headers.find(
          (h) => (h.name ?? '').toLowerCase() === 'from'
        )
        const from = fromHeader?.value || 'unknown'

        const body = extractEmailBody(msg as unknown as GmailMessage)

        replies.push({
          threadId,
          messageId: msg.id!,
          content: body,
          from,
        })
      }
    } catch {
      // Thread may be deleted or inaccessible — skip silently
      continue
    }
  }

  return replies
}

// ─── Body Extraction ───────────────────────────────────────────────────────────

function extractEmailBody(message: GmailMessage): string {
  const payload = message.payload
  if (!payload) return message.snippet || ''

  // Direct body
  if (payload.body?.data) {
    return decodeBase64(payload.body.data)
  }

  if (payload.parts) {
    // text/plain preferred
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        return decodeBase64(part.body.data)
      }
    }
    // Nested multipart
    for (const part of payload.parts) {
      if (part.mimeType?.startsWith('multipart/') && part.parts) {
        for (const nested of part.parts) {
          if (nested.mimeType === 'text/plain' && nested.body?.data) {
            return decodeBase64(nested.body.data)
          }
        }
      }
    }
    // text/html fallback
    for (const part of payload.parts) {
      if (part.mimeType === 'text/html' && part.body?.data) {
        return stripHtml(decodeBase64(part.body.data))
      }
    }
  }

  return message.snippet || ''
}

function decodeBase64(encoded: string): string {
  const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/')
  return Buffer.from(base64, 'base64').toString('utf-8')
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

// ─── Gmail Profile ─────────────────────────────────────────────────────────────

export async function getGmailProfile(
  accessToken: string
): Promise<{ email: string; name: string }> {
  const oauth2Client = createOAuth2Client()
  oauth2Client.setCredentials({ access_token: accessToken })

  const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client })
  const profile = await oauth2.userinfo.get()

  return {
    email: profile.data.email!,
    name: profile.data.name || profile.data.email!,
  }
}
