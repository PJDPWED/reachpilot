import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase'
import type { DashboardStats } from '@/types'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const db = createServerSupabaseClient()

  const [
    campaignsRes,
    leadsRes,
    sentRes,
    failedRes,
    repliedRes,
    yesRes,
    noRes,
    neutralRes,
    logsRes,
  ] = await Promise.all([
    db.from('campaigns').select('id', { count: 'exact', head: true }),
    db.from('leads').select('id', { count: 'exact', head: true }),
    db.from('leads').select('id', { count: 'exact', head: true }).eq('status', 'sent'),
    db.from('leads').select('id', { count: 'exact', head: true }).eq('status', 'failed'),
    db.from('leads').select('id', { count: 'exact', head: true }).eq('status', 'replied'),
    db.from('replies').select('id', { count: 'exact', head: true }).eq('classification', 'YES'),
    db.from('replies').select('id', { count: 'exact', head: true }).eq('classification', 'NO'),
    db.from('replies').select('id', { count: 'exact', head: true }).eq('classification', 'NEUTRAL'),
    db
      .from('logs')
      .select('*, leads(email)')
      .order('timestamp', { ascending: false })
      .limit(20),
  ])

  const stats: DashboardStats = {
    totalCampaigns: campaignsRes.count || 0,
    totalLeads: leadsRes.count || 0,
    totalSent: sentRes.count || 0,
    totalFailed: failedRes.count || 0,
    totalReplies: repliedRes.count || 0,
    totalYes: yesRes.count || 0,
    totalNo: noRes.count || 0,
    totalNeutral: neutralRes.count || 0,
    recentLogs: logsRes.data || [],
  }

  return NextResponse.json({ success: true, data: stats })
}
export const dynamic = 'force-dynamic'
