import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { pauseCampaign, resumeCampaign } from '@/lib/queue'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const action = body.action as 'pause' | 'resume'

  if (action === 'pause') {
    await pauseCampaign(params.id)
    return NextResponse.json({ success: true, data: { status: 'paused' } })
  }

  if (action === 'resume') {
    await resumeCampaign(params.id)
    return NextResponse.json({ success: true, data: { status: 'running' } })
  }

  return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
}
