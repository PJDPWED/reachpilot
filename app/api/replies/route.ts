import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const db = createServerSupabaseClient()

  const { data, error } = await db
    .from('replies')
    .select(`
      *,
      leads (
        email,
        subject,
        campaign_id,
        campaigns (name)
      )
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, data: data || [] })
}

export const dynamic = 'force-dynamic'
