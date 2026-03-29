import { google } from 'googleapis'
import { createServerSupabaseClient } from './supabase'
import type { GmailToken } from '@/types'

// ─── OAuth2 Client Factory ─────────────────────────────────────────────────

export function createOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!,
    `${process.env.NEXTAUTH_URL}/api/auth/callback/google`
  )
}

// ─── Token Management ──────────────────────────────────────────────────────

/** Save or update Gmail OAuth tokens for a user in the database */
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

/** Load Gmail OAuth tokens from database */
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

/** Get an authenticated OAuth2 client for a user, refreshing token if needed */
export async function getAuthenticatedClient(userEmail: string) {
  const tokens = await loadGmailTokens(userEmail)
  if (!tokens) throw new Error(`No Gmail tokens found for ${userEmail}`)

  const oauth2Client = createOAuth2Client()
  oauth2Client.setCredentials({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expiry_date: tokens.expiry_date,
  })

  // Auto-refresh handler — persists new tokens
  oauth2Client.on('tokens', async (newTokens) => {
    if (newTokens.access_token) {
      await saveGmailTokens(
        userEmail,
        newTokens.access_token,
        tokens.refresh_token, // refresh token doesn't change unless revoked
        newTokens.expiry_date ?? tokens.expiry_date
      )
    }
  })

  return oauth2Client
}

// ─── Email Sending ────────────────────────────────────────────────────────

export interface SendEmailOptions {
  userEmail: string
  to: string
  subject: string
  body: string
  replyToMessageId?: string
  threadId?: string
}

export interface SentEmailResult {
  messageId: string
  threadId: string
}

/** Send an email via Gmail API. Returns messageId and threadId. */
export async function sendEmail(options: SendEmailOptions): Promise<SentEmailResult> {
  const { userEmail, to, subject, body, replyToMessageId, threadId } = options

  const auth = await getAuthenticatedClient(userEmail)
  const gmail = google.gmail({ version: 'v1', auth })

  // Build RFC 2822 compliant email
  const emailLines: string[] = []
  emailLines.push(`To: ${to}`)
  emailLines.push(`Subject: ${subject}`)
  emailLines.push('Content-Type: text/plain; charset=UTF-8')
  emailLines.push('MIME-Version: 1.0')

  if (replyToMessageId) {
    emailLines.push(`In-Reply-To: ${replyToMessageId}`)
    emailLines.push(`References: ${replyToMessageId}`)
  }

  emailLines.push('')
  emailLines.push(body)

  const rawEmail = emailLines.join('\r\n')
  const encodedEmail = Buffer.from(rawEmail)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')

  const response = await gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw: encodedEmail,
      ...(threadId ? { threadId } : {}),
    },
  })

  if (!response.data.id || !response.data.threadId) {
    throw new Error('Gmail API returned incomplete message data')
  }

  return {
    messageId: response.data.id,
    threadId: response.data.threadId,
  }
}

// ─── Reply Detection ──────────────────────────────────────────────────────

export interface GmailMessage {
  id: string
  threadId: string
  snippet: string
  payload: {
    headers: { name: string; value: string }[]
    body?: { data?: string }
    parts?: { mimeType: string; body: { data?: string } }[]
  }
  internalDate: string
}

/** List all messages in a thread */
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

/** Check for new replies across all known thread IDs */
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

      // More than 1 message means there's a reply
      if (messages.length > 1) {
        // Get messages after the first (which is our outgoing)
        const replyMessages = messages.slice(1)

        for (const msg of replyMessages) {
          const headers = msg.payload?.headers || []
          const fromHeader = headers.find((h) => (h.name ?? '').toLowerCase() === 'from')
          const from = fromHeader?.value || 'unknown'

          // Extract body text
          const body = extractEmailBody(msg as unknown as GmailMessage)

          replies.push({
            threadId,
            messageId: msg.id!,
            content: body,
            from,
          })
        }
      }
    } catch {
      // Thread might be deleted or inaccessible — skip
      continue
    }
  }

  return replies
}

// ─── Body Extraction ──────────────────────────────────────────────────────

function extractEmailBody(message: GmailMessage): string {
  const payload = message.payload
  if (!payload) return ''

  // Try direct body first
  if (payload.body?.data) {
    return decodeBase64(payload.body.data)
  }

  // Try parts
  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        return decodeBase64(part.body.data)
      }
    }
    // Fall back to HTML
    for (const part of payload.parts) {
      if (part.mimeType === 'text/html' && part.body?.data) {
        const html = decodeBase64(part.body.data)
        return stripHtml(html)
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
    .replace(/\s+/g, ' ')
    .trim()
}

// ─── Gmail Profile ────────────────────────────────────────────────────────

export async function getGmailProfile(accessToken: string): Promise<{ email: string; name: string }> {
  const oauth2Client = createOAuth2Client()
  oauth2Client.setCredentials({ access_token: accessToken })

  const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client })
  const profile = await oauth2.userinfo.get()

  return {
    email: profile.data.email!,
    name: profile.data.name || profile.data.email!,
  }
}
