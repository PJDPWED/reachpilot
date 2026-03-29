import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { initializeCampaignQueue } from '@/lib/queue'
import { generateEmailsForLeads } from '@/lib/ai'
import { createServerSupabaseClient } from '@/lib/supabase'

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const db = createServerSupabaseClient()
  const campaignId = params.id

  // Verify campaign exists and is in a startable state
  const { data: campaign, error: campaignError } = await db
    .from('campaigns')
    .select('*')
    .eq('id', campaignId)
    .single()

  if (campaignError || !campaign) {
    return NextResponse.json({ success: false, error: 'Campaign not found' }, { status: 404 })
  }

  if (['running', 'completed'].includes(campaign.status)) {
    return NextResponse.json(
      { success: false, error: `Campaign is already ${campaign.status}` },
      { status: 409 }
    )
  }

  // Get all pending leads
  const { data: leads, error: leadsError } = await db
    .from('leads')
    .select('*')
    .eq('campaign_id', campaignId)
    .eq('status', 'pending')

  if (leadsError || !leads || leads.length === 0) {
    return NextResponse.json({ success: false, error: 'No pending leads found' }, { status: 422 })
  }

  // Check for leads missing subject or body — generate with AI
  const needsAI = leads.filter(
    (l) => !l.subject || !l.body || l.subject.trim() === '' || l.body.trim() === ''
  )

  if (needsAI.length > 0) {
    const generated = await generateEmailsForLeads(needsAI)

    // Update leads with generated content
    for (const gen of generated) {
      const lead = needsAI.find((l) => l.email === gen.email)
      if (lead) {
        await db
          .from('leads')
          .update({ subject: gen.subject, body: gen.body })
          .eq('id', lead.id)
      }
    }
  }

  // Initialize the queue
  const { queued } = await initializeCampaignQueue(campaignId, session.userEmail)

  return NextResponse.json({
    success: true,
    data: {
      campaignId,
      queued,
      message: `Campaign started. ${queued} emails queued with 8-10 minute intervals.`,
    },
  })
}

export const dynamic = 'force-dynamic'
