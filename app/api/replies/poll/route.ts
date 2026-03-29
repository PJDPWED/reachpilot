import { NextRequest, NextResponse } from 'next/server'
import { pollForReplies } from '@/lib/gmail'
import { classifyReply } from '@/lib/ai'
import { createServerSupabaseClient } from '@/lib/supabase'
import { isCronAuthorized } from '@/utils/helpers'

/**
 * Called every 5 minutes by Vercel Cron.
 * Polls Gmail for new replies to sent emails.
 * Stores new replies and runs AI classification.
 */
export async function GET(req: NextRequest) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const db = createServerSupabaseClient()

  // Get the most recently used Gmail account
  const { data: tokenData } = await db
    .from('gmail_tokens')
    .select('user_email')
    .order('updated_at', { ascending: false })
    .limit(1)
    .single()

  if (!tokenData?.user_email) {
    return NextResponse.json({ success: false, error: 'No Gmail account connected.' })
  }

  const userEmail = tokenData.user_email

  // Get all sent leads with thread_ids that haven't been marked replied
  const { data: sentLeads } = await db
    .from('leads')
    .select('id, email, thread_id, subject')
    .in('status', ['sent', 'replied'])
    .not('thread_id', 'is', null)

  if (!sentLeads || sentLeads.length === 0) {
    return NextResponse.json({ success: true, data: { checked: 0, newReplies: 0 } })
  }

  // Get already-known reply message IDs to avoid duplicates
  const { data: knownReplies } = await db.from('replies').select('message_id')
  const knownMessageIds = new Set((knownReplies || []).map((r) => r.message_id))

  const threadIds = sentLeads
    .map((l) => l.thread_id!)
    .filter(Boolean)

  // Poll Gmail
  const replies = await pollForReplies(userEmail, threadIds)

  let newReplies = 0

  for (const reply of replies) {
    // Skip already processed replies
    if (knownMessageIds.has(reply.messageId)) continue

    // Find matching lead
    const lead = sentLeads.find((l) => l.thread_id === reply.threadId)
    if (!lead) continue

    // Classify reply with AI
    const classification = await classifyReply(reply.content)

    // Store reply
    const { data: savedReply } = await db
      .from('replies')
      .insert({
        lead_id: lead.id,
        message_id: reply.messageId,
        thread_id: reply.threadId,
        content: reply.content.slice(0, 10000),
        classification: classification.classification,
        follow_up_sent: false,
      })
      .select()
      .single()

    if (savedReply) {
      // Update lead status to replied
      await db.from('leads').update({ status: 'replied' }).eq('id', lead.id)

      // Log
      await db.from('logs').insert({
        lead_id: lead.id,
        event: `Reply received from ${lead.email} — classified as ${classification.classification}`,
        metadata: {
          classification: classification.classification,
          confidence: classification.confidence,
          reasoning: classification.reasoning,
        },
        timestamp: new Date().toISOString(),
      })

      newReplies++
    }
  }

  return NextResponse.json({
    success: true,
    data: {
      checked: sentLeads.length,
      newReplies,
    },
  })
}

export const POST = GET
export const dynamic = 'force-dynamic'
