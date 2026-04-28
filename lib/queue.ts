import { createServerSupabaseClient } from './supabase'
import { sendEmailWithFallback } from './email'
import { nextSendAt } from '@/utils/helpers'
import type { Lead } from '@/types'

const MAX_RETRIES = 3

// ─── Queue Initialization ──────────────────────────────────────────────────────

/**
 * Enqueues all pending leads for a campaign.
 * First lead sends immediately; each subsequent lead gets an 8–10 min random delay.
 */
export async function initializeCampaignQueue(
  campaignId: string,
  userEmail: string
): Promise<{ queued: number }> {
  const db = createServerSupabaseClient()

  const { data: leads, error } = await db
    .from('leads')
    .select('id')
    .eq('campaign_id', campaignId)
    .eq('status', 'pending')
    .order('created_at', { ascending: true })

  if (error) throw new Error(`Failed to fetch leads: ${error.message}`)
  if (!leads || leads.length === 0) return { queued: 0 }

  // Schedule sequentially: first sends now, each subsequent waits 8–10 min
  const now = new Date()
  let baseTime = now.getTime()

  const updates = leads.map((lead, index) => {
    const scheduledAt = new Date(baseTime)
    if (index < leads.length - 1) {
      baseTime += getRandomDelayMs()
    }
    return {
      id: lead.id,
      status: 'queued' as const,
      scheduled_at: scheduledAt.toISOString(),
    }
  })

  for (const update of updates) {
    await db
      .from('leads')
      .update({ status: update.status, scheduled_at: update.scheduled_at })
      .eq('id', update.id)
  }

  await db.from('campaigns').update({ status: 'running' }).eq('id', campaignId)

  await logEvent(null, `Campaign ${campaignId} started — ${leads.length} leads queued`, {
    campaign_id: campaignId,
    user_email: userEmail,
    total_leads: leads.length,
  })

  return { queued: leads.length }
}

function getRandomDelayMs(): number {
  const min = 8 * 60 * 1000  // 8 minutes
  const max = 10 * 60 * 1000 // 10 minutes
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// ─── Queue Processor ───────────────────────────────────────────────────────────

/**
 * Processes up to 5 due emails across all running campaigns.
 * Called every minute by Vercel Cron.
 */
export async function processQueue(
  userEmail: string
): Promise<{ processed: number; errors: number }> {
  const db = createServerSupabaseClient()

  const { data: dueLeads, error } = await db
    .from('leads')
    .select('*, campaigns(status)')
    .eq('status', 'queued')
    .lte('scheduled_at', new Date().toISOString())
    .order('scheduled_at', { ascending: true })
    .limit(5)

  if (error) {
    console.error('[Queue] Failed to fetch due leads:', error)
    return { processed: 0, errors: 0 }
  }

  if (!dueLeads || dueLeads.length === 0) return { processed: 0, errors: 0 }

  // Pre-fetch campaign attachments (keyed by campaign_id to avoid N+1 queries)
  const campaignIds = [...new Set(dueLeads.map((l) => (l as Lead).campaign_id))]
  const campaignAttachments: Record<string, import('@/types').CampaignAttachment[]> = {}
  for (const cid of campaignIds) {
    const { data: camp } = await db
      .from('campaigns')
      .select('attachments')
      .eq('id', cid)
      .single()
    if (camp?.attachments) {
      campaignAttachments[cid] = camp.attachments as import('@/types').CampaignAttachment[]
    }
  }

  let processed = 0
  let errors = 0

  for (const lead of dueLeads as Lead[]) {
    const campaignData = (lead as Lead & { campaigns?: { status: string } }).campaigns
    if (campaignData?.status === 'paused') continue

    // Mark as sending to prevent duplicate processing
    await db.from('leads').update({ status: 'sending' }).eq('id', lead.id)

    // Map campaign attachments to AttachmentInput format
    const atts = (campaignAttachments[lead.campaign_id] ?? []).map((a) => ({
      url: a.url,
      filename: a.filename,
      mimeType: a.mimeType,
    }))

    try {
      const result = await sendEmailWithFallback({
        userEmail,
        to: lead.email,
        subject: lead.subject!,
        body: lead.body!,
        ...(atts.length > 0 ? { attachments: atts } : {}),
      })

      await db
        .from('leads')
        .update({
          status: 'sent',
          message_id: result.messageId,
          thread_id: result.threadId,
          sent_at: new Date().toISOString(),
          retry_count: lead.retry_count,
        })
        .eq('id', lead.id)

      await logEvent(
        lead.id,
        `Email sent to ${lead.email} via ${result.provider.toUpperCase()}`,
        {
          message_id: result.messageId,
          thread_id: result.threadId,
          provider: result.provider,
        }
      )

      processed++
    } catch (err) {
      const errMsg = (err as Error).message
      console.error(`[Queue] Send failed for ${lead.email}:`, errMsg)

      const newRetryCount = (lead.retry_count || 0) + 1

      // Classify the error into a human-readable label
      const classifiedError = classifyEmailError(errMsg)

      if (newRetryCount >= MAX_RETRIES) {
        // Permanent failure
        await db
          .from('leads')
          .update({ status: 'failed', retry_count: newRetryCount, last_error: classifiedError })
          .eq('id', lead.id)

        await logEvent(
          lead.id,
          `[FAILED] ${lead.email} — permanently failed after ${newRetryCount} attempts: ${classifiedError}`,
          {
            error: errMsg,
            classified: classifiedError,
            email: lead.email,
            retry_count: newRetryCount,
            final: true,
          }
        )
      } else {
        // Requeue with 2-minute backoff
        const retryAt = new Date(Date.now() + 2 * 60 * 1000).toISOString()
        await db
          .from('leads')
          .update({ status: 'queued', retry_count: newRetryCount, scheduled_at: retryAt, last_error: classifiedError })
          .eq('id', lead.id)

        await logEvent(
          lead.id,
          `[RETRY ${newRetryCount}/${MAX_RETRIES}] ${lead.email} — ${errMsg.slice(0, 120)}`,
          {
            error: errMsg,
            email: lead.email,
            retry_count: newRetryCount,
            retry_at: retryAt,
          }
        )
      }

      errors++
    }
  }

  await checkCampaignCompletion(db)

  return { processed, errors }
}

// ─── Campaign Completion ───────────────────────────────────────────────────────

async function checkCampaignCompletion(
  db: ReturnType<typeof createServerSupabaseClient>
) {
  const { data: runningCampaigns } = await db
    .from('campaigns')
    .select('id')
    .eq('status', 'running')

  if (!runningCampaigns) return

  for (const campaign of runningCampaigns) {
    const { data: pendingLeads } = await db
      .from('leads')
      .select('id')
      .eq('campaign_id', campaign.id)
      .in('status', ['pending', 'queued', 'sending'])

    if (!pendingLeads || pendingLeads.length === 0) {
      await db
        .from('campaigns')
        .update({ status: 'completed' })
        .eq('id', campaign.id)

      await logEvent(null, `Campaign ${campaign.id} completed`, {
        campaign_id: campaign.id,
      })
    }
  }
}

// ─── Pause / Resume ────────────────────────────────────────────────────────────

export async function pauseCampaign(campaignId: string): Promise<void> {
  const db = createServerSupabaseClient()
  await db.from('campaigns').update({ status: 'paused' }).eq('id', campaignId)
  await logEvent(null, `Campaign ${campaignId} paused`, { campaign_id: campaignId })
}

export async function resumeCampaign(campaignId: string): Promise<void> {
  const db = createServerSupabaseClient()
  await db.from('campaigns').update({ status: 'running' }).eq('id', campaignId)
  await logEvent(null, `Campaign ${campaignId} resumed`, { campaign_id: campaignId })
}

// ─── Error Classification ──────────────────────────────────────────────────────

/**
 * Turns a raw error message from Gmail/Resend into a short human-readable label
 * that can be stored as `last_error` on the lead and shown in the UI.
 */
export function classifyEmailError(msg: string): string {
  const m = msg.toLowerCase()

  // Gmail errors
  if (m.includes('no gmail tokens') || m.includes('sign in with google')) return 'Gmail: Not authenticated'
  if (m.includes('re-authenticate') || m.includes('re-auth')) return 'Gmail: Re-authentication required'
  if (m.includes('missing refresh token') || m.includes('missing_refresh_token')) return 'Gmail: Missing refresh token — re-login'
  if (m.includes('token refresh failed') || m.includes('invalid_grant')) return 'Gmail: Token expired — re-login'
  if (m.includes('insufficient permissions') || m.includes('403')) return 'Gmail: Insufficient permissions'
  if (m.includes('rate limit exceeded') && m.includes('gmail')) return 'Gmail: Rate limit — slow down sending'
  if (m.includes('daily') && m.includes('quota')) return 'Gmail: Daily quota exceeded'
  if (m.includes('gmail') && m.includes('400')) return 'Gmail: Malformed email message'
  if (m.includes('gmail api error')) {
    const match = msg.match(/gmail api error[^:]*: (.{0,80})/i)
    return `Gmail: ${match?.[1] ?? 'Unknown error'}`
  }

  // Resend errors
  if (m.includes('invalid resend api key') || (m.includes('resend') && m.includes('401'))) return 'Resend: Invalid API key'
  if (m.includes('resend domain not verified') || (m.includes('resend') && m.includes('403'))) return 'Resend: Domain not verified'
  if (m.includes('resend') && m.includes('422')) return 'Resend: Invalid email or unverified domain'
  if (m.includes('resend') && m.includes('429')) return 'Resend: Rate limit exceeded'
  if (m.includes('resend api error')) {
    const match = msg.match(/resend api error[^:]*: (.{0,80})/i)
    return `Resend: ${match?.[1] ?? 'Unknown error'}`
  }

  // Both failed
  if (m.includes('both providers failed')) {
    // Try to extract Gmail and Resend parts
    const gmailMatch = msg.match(/gmail:\s*(.+?)(?:\s*\||\s*resend:|$)/i)
    if (gmailMatch) return `Gmail & Resend failed — ${gmailMatch[1].slice(0, 60)}`
    return 'All providers failed — check Gmail auth & Resend config'
  }

  // Network / timeout
  if (m.includes('fetch failed') || m.includes('econnrefused')) return 'Network error — server unreachable'
  if (m.includes('timeout') || m.includes('timed out')) return 'Timeout — server too slow'

  // Fallback: first 80 chars of raw message
  return msg.slice(0, 80)
}

// ─── Logging ───────────────────────────────────────────────────────────────────

export async function logEvent(
  leadId: string | null,
  event: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  const db = createServerSupabaseClient()
  try {
    await db.from('logs').insert({
      lead_id: leadId,
      event,
      metadata: metadata ?? null,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    // Never let logging failures break the main flow
    console.error('[Queue] Failed to log event:', err)
  }
}
