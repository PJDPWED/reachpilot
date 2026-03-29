import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const db = createServerSupabaseClient()
  const { id } = params

  const [campaignRes, leadsRes, logsRes] = await Promise.all([
    db.from('campaigns').select('*').eq('id', id).single(),
    db.from('leads').select('*').eq('campaign_id', id).order('created_at', { ascending: true }),
    db
      .from('logs')
      .select('*, leads(email)')
      .not('lead_id', 'is', null)
      .order('timestamp', { ascending: false })
      .limit(100),
  ])

  if (campaignRes.error) {
    return NextResponse.json({ success: false, error: campaignRes.error.message }, { status: 404 })
  }

  // Filter logs to this campaign's leads
  const leadIds = new Set((leadsRes.data || []).map((l) => l.id))
  const campaignLogs = (logsRes.data || []).filter((log) => log.lead_id && leadIds.has(log.lead_id))

  return NextResponse.json({
    success: true,
    data: {
      campaign: campaignRes.data,
      leads: leadsRes.data || [],
      logs: campaignLogs,
    },
  })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const db = createServerSupabaseClient()
  const { error } = await db.from('campaigns').delete().eq('id', params.id)

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

export const dynamic = 'force-dynamic'
