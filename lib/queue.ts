import { createServerSupabaseClient } from './supabase'
import { sendEmail } from './gmail'
import { nextSendAt } from '@/utils/helpers'
import type { Lead } from '@/types'

const MAX_RETRIES = 3

// ─── Queue Initialization ──────────────────────────────────────────────────

/**
 * Enqueues all pending leads for a campaign.
 * Sets the first lead to send immediately, subsequent leads get random delays.
 */
export async function initializeCampaignQueue(
  campaignId: string,
  userEmail: string
): Promise<{ queued: number }> {
  const db = createServerSupabaseClient()

  // Get all pending leads for the campaign
  const { data: leads, error } = await db
    .from('leads')
    .select('id')
    .eq('campaign_id', campaignId)
    .eq('status', 'pending')
    .order('created_at', { ascending: true })

  if (error) throw new Error(`Failed to fetch leads: ${error.message}`)
  if (!leads || leads.length === 0) return { queued: 0 }

  // Schedule them sequentially with 8–10 min gaps
  // First lead sends immediately; each subsequent lead waits a random 8-10 min after the previous
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

  // Batch update
  for (const update of updates) {
    await db
      .from('leads')
      .update({ status: update.status, scheduled_at: update.scheduled_at })
      .eq('id', update.id)
  }

  // Update campaign status
  await db.from('campaigns').update({ status: 'running' }).eq('id', campaignId)

  // Log
  await logEvent(null, `Campaign ${campaignId} started — ${leads.length} leads queued`, {
    campaign_id: campaignId,
    user_email: userEmail,
  })

  return { queued: leads.length }
}

function getRandomDelayMs(): number {
  const min = 8 * 60 * 1000 // 8 min
  const max = 10 * 60 * 1000 // 10 min
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// ─── Queue Processor ───────────────────────────────────────────────────────

/**
 * Processes one batch of due emails across all running campaigns.
 * Called every minute by Vercel Cron.
 * Returns the number of emails processed.
 */
export async function processQueue(userEmail: string): Promise<{ processed: number; errors: number }> {
  const db = createServerSupabaseClient()

  // Find leads that are queued and due
  const { data: dueleads, error } = await db
    .from('leads')
    .select('*, campaigns(status)')
    .eq('status', 'queued')
    .lte('scheduled_at', new Date().toISOString())
    .order('scheduled_at', { ascending: true })
    .limit(5) // Process max 5 per cron tick to avoid timeouts

  if (error) {
    console.error('[Queue] Failed to fetch due leads:', error)
    return { processed: 0, errors: 0 }
  }

  if (!dueleads || dueleads.length === 0) return { processed: 0, errors: 0 }

  let processed = 0
  let errors = 0

  for (const lead of dueleads as Lead[]) {
    // Skip if campaign is paused
    const campaignData = (lead as Lead & { campaigns?: { status: string } }).campaigns
    if (campaignData?.status === 'paused') continue

    await db.from('leads').update({ status: 'sending' }).eq('id', lead.id)

    try {
      const result = await sendEmail({
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

      await logEvent(lead.id, `Email sent to ${lead.email}`, {
        message_id: result.messageId,
        thread_id: result.threadId,
      })

      processed++
    } catch (err) {
      const errMsg = (err as Error).message
      console.error(`[Queue] Failed to send to ${lead.email}:`, errMsg)

      const newRetryCount = (lead.retry_count || 0) + 1

      if (newRetryCount >= MAX_RETRIES) {
        await db
          .from('leads')
          .update({ status: 'failed', retry_count: newRetryCount })
          .eq('id', lead.id)

        await logEvent(lead.id, `Email failed permanently after ${MAX_RETRIES} retries`, {
          error: errMsg,
          email: lead.email,
        })
      } else {
        // Retry after 2 minutes
        const retryAt = new Date(Date.now() + 2 * 60 * 1000).toISOString()
        await db
          .from('leads')
          .update({ status: 'queued', retry_count: newRetryCount, scheduled_at: retryAt })
          .eq('id', lead.id)

        await logEvent(lead.id, `Email failed, retry ${newRetryCount}/${MAX_RETRIES} scheduled`, {
          error: errMsg,
          email: lead.email,
        })
      }

      errors++
    }
  }

  // Check if campaigns are now complete
  await checkCampaignCompletion(db)

  return { processed, errors }
}

// ─── Campaign Completion Check ────────────────────────────────────────────

async function checkCampaignCompletion(db: ReturnType<typeof createServerSupabaseClient>) {
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
    }
  }
}

// ─── Pause / Resume ───────────────────────────────────────────────────────

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

// ─── Logging ──────────────────────────────────────────────────────────────

export async function logEvent(
  leadId: string | null,
  event: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  const db = createServerSupabaseClient()
  await db.from('logs').insert({
    lead_id: leadId,
    event,
    metadata: metadata ?? null,
    timestamp: new Date().toISOString(),
  })
}
