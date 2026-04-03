/**
 * Unified email sender with automatic fallback.
 *
 * Priority order:
 *   1. Gmail API (authenticated user's account)
 *   2. Resend API (if RESEND_API_KEY is set)
 *
 * If Gmail fails, the system automatically switches to Resend and logs which
 * provider was used. Configure RESEND_API_KEY and RESEND_FROM_EMAIL in .env.local.
 */

import { sendEmail as sendViaGmail } from './gmail'
import type { SendEmailOptions, SentEmailResult } from './gmail'

export interface SendResult extends SentEmailResult {
  provider: 'gmail' | 'resend'
}

// ─── Unified Sender ────────────────────────────────────────────────────────────

export async function sendEmailWithFallback(
  options: SendEmailOptions
): Promise<SendResult> {
  // ── Attempt Gmail first ────────────────────────────────────────────────────
  try {
    const result = await sendViaGmail(options)
    return { ...result, provider: 'gmail' }
  } catch (gmailErr) {
    const gmailMsg = (gmailErr as Error).message

    console.warn(
      `[Email] Gmail failed for ${options.to}: ${gmailMsg}`
    )

    // Don't fall back for auth/permission errors — those need human intervention
    if (
      gmailMsg.includes('Re-authenticate') ||
      gmailMsg.includes('re-authenticate') ||
      gmailMsg.includes('No Gmail tokens') ||
      gmailMsg.includes('missing refresh_token') ||
      gmailMsg.includes('Missing refresh token')
    ) {
      throw new Error(`Gmail auth error — ${gmailMsg}`)
    }

    // ── Attempt Resend fallback ──────────────────────────────────────────────
    const resendKey = process.env.RESEND_API_KEY
    if (!resendKey) {
      // No fallback configured — propagate the original Gmail error
      throw new Error(`Gmail failed (${gmailMsg}) and no RESEND_API_KEY configured`)
    }

    console.info(`[Email] Falling back to Resend for ${options.to}`)

    try {
      const result = await sendViaResend(options, resendKey)
      console.info(`[Email] Sent via Resend (fallback) to ${options.to}`)
      return { ...result, provider: 'resend' }
    } catch (resendErr) {
      const resendMsg = (resendErr as Error).message
      throw new Error(
        `Both providers failed for ${options.to}. ` +
          `Gmail: ${gmailMsg} | Resend: ${resendMsg}`
      )
    }
  }
}

// ─── Resend Provider ───────────────────────────────────────────────────────────

async function sendViaResend(
  options: SendEmailOptions,
  apiKey: string
): Promise<SentEmailResult> {
  // Resend requires a verified domain. Use RESEND_FROM_EMAIL or fall back to
  // the user's email (only works if domain is verified in Resend dashboard).
  const fromEmail =
    process.env.RESEND_FROM_EMAIL ||
    `outreach@${options.userEmail.split('@')[1]}` ||
    options.userEmail

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [options.to],
      subject: options.subject,
      text: options.body,
      reply_to: options.userEmail,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'unknown')
    let reason = `HTTP ${response.status}`
    if (response.status === 401) reason = 'Invalid Resend API key'
    if (response.status === 403) reason = 'Resend domain not verified'
    if (response.status === 422) reason = 'Invalid email format or unverified domain'
    if (response.status === 429) reason = 'Resend rate limit exceeded'
    throw new Error(`Resend API error (${reason}): ${errorText.slice(0, 200)}`)
  }

  const data = await response.json()

  if (!data.id) {
    throw new Error(`Resend returned no message ID: ${JSON.stringify(data)}`)
  }

  return {
    messageId: data.id,
    threadId: data.id, // Resend has no thread concept
  }
}
