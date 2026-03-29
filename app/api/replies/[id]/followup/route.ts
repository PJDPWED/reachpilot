import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase'
import { generateFollowUp } from '@/lib/ai'
import { sendEmail } from '@/lib/gmail'

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const db = createServerSupabaseClient()

  // Get reply with lead info
  const { data: reply, error } = await db
    .from('replies')
    .select(`*, leads(email, subject, thread_id, message_id)`)
    .eq('id', params.id)
    .single()

  if (error || !reply) {
    return NextResponse.json({ success: false, error: 'Reply not found' }, { status: 404 })
  }

  if (reply.follow_up_sent) {
    return NextResponse.json({ success: false, error: 'Follow-up already sent' }, { status: 409 })
  }

  const lead = reply.leads as { email: string; subject: string; thread_id: string; message_id: string }

  if (!lead) {
    return NextResponse.json({ success: false, error: 'Lead data not found' }, { status: 404 })
  }

  // Generate AI follow-up
  const followUp = await generateFollowUp(lead.email, lead.subject || '', reply.content)

  // Send follow-up via Gmail
  const result = await sendEmail({
    userEmail: session.userEmail,
    to: lead.email,
    subject: followUp.subject,
    body: followUp.body,
    replyToMessageId: reply.message_id,
    threadId: lead.thread_id,
  })

  // Mark follow-up as sent
  await db.from('replies').update({ follow_up_sent: true }).eq('id', params.id)

  // Log
  await db.from('logs').insert({
    lead_id: reply.lead_id,
    event: `AI follow-up sent to ${lead.email}`,
    metadata: {
      subject: followUp.subject,
      message_id: result.messageId,
    },
    timestamp: new Date().toISOString(),
  })

  return NextResponse.json({
    success: true,
    data: {
      subject: followUp.subject,
      body: followUp.body,
      messageId: result.messageId,
    },
  })
}

// GET: just generate preview without sending
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const db = createServerSupabaseClient()

  const { data: reply, error } = await db
    .from('replies')
    .select(`*, leads(email, subject)`)
    .eq('id', params.id)
    .single()

  if (error || !reply) {
    return NextResponse.json({ success: false, error: 'Reply not found' }, { status: 404 })
  }

  const lead = reply.leads as { email: string; subject: string }
  const followUp = await generateFollowUp(lead.email, lead.subject || '', reply.content)

  return NextResponse.json({ success: true, data: followUp })
}
