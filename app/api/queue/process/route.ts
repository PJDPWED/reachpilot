import { NextRequest, NextResponse } from 'next/server'
import { processQueue } from '@/lib/queue'
import { createServerSupabaseClient } from '@/lib/supabase'
import { isCronAuthorized } from '@/utils/helpers'

/**
 * Called every minute by Vercel Cron.
 * Processes due emails from the queue.
 */
export async function GET(req: NextRequest) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  // Find the stored user email for gmail tokens
  const db = createServerSupabaseClient()
  const { data: token } = await db
    .from('gmail_tokens')
    .select('user_email')
    .order('updated_at', { ascending: false })
    .limit(1)
    .single()

  if (!token?.user_email) {
    return NextResponse.json({
      success: false,
      error: 'No Gmail account connected. Please sign in with Google first.',
    })
  }

  try {
    const result = await processQueue(token.user_email)
    return NextResponse.json({ success: true, data: result })
  } catch (err) {
    console.error('[Queue/Process] Error:', err)
    return NextResponse.json(
      { success: false, error: (err as Error).message },
      { status: 500 }
    )
  }
}

// Also allow POST for manual triggering
export const POST = GET
export const dynamic = 'force-dynamic'
