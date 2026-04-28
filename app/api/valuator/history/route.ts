import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase'

// ─── GET /api/valuator/history ────────────────────────────────────────────────

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const db = createServerSupabaseClient()
  const { data, error } = await db
    .from('cv_evaluations')
    .select('id, score, grade, summary, language, file_name, created_at')
    .eq('user_email', session.userEmail)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, data: data ?? [] })
}

// ─── POST /api/valuator/history ───────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { score, grade, strengths, improvements, ausbildung_tips, summary, language, file_name } = body

    if (typeof score !== 'number' || !grade) {
      return NextResponse.json({ success: false, error: 'Invalid evaluation data' }, { status: 400 })
    }

    const db = createServerSupabaseClient()
    const { data, error } = await db
      .from('cv_evaluations')
      .insert({
        user_email: session.userEmail,
        score,
        grade,
        strengths: strengths ?? [],
        improvements: improvements ?? [],
        ausbildung_tips: ausbildung_tips ?? [],
        summary: summary ?? '',
        language: language ?? 'en',
        file_name: file_name ?? null,
      })
      .select('id, created_at')
      .single()

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ success: false, error: (err as Error).message }, { status: 500 })
  }
}

// ─── GET /api/valuator/history/[id] — full record ─────────────────────────────
// Handled via a separate dynamic route below

export const dynamic = 'force-dynamic'
