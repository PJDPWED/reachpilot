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

  let processed = 0
  let errors = 0

  for (const lead of dueLeads as Lead[]) {
    const campaignData = (lead as Lead & { campaigns?: { status: string } }).campaigns
    if (campaignData?.status === 'paused') continue

    // Mark as sending to prevent duplicate processing
    await db.from('leads').update({ status: 'sending' }).eq('id', lead.id)

    try {
      const result = await sendEmailWithFallback({
        userEmail,
        to: lead.email,
        subject: lead.subject!,
        body: lead.body!,
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

      if (newRetryCount >= MAX_RETRIES) {
        // Permanent failure
        await db
          .from('leads')
          .update({ status: 'failed', retry_count: newRetryCount })
          .eq('id', lead.id)

        await logEvent(
          lead.id,
          `[FAILED] ${lead.email} — permanently failed after ${newRetryCount} attempts`,
          {
            error: errMsg,
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
          .update({ status: 'queued', retry_count: newRetryCount, scheduled_at: retryAt })
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
