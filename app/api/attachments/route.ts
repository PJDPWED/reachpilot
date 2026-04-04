import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
const ALLOWED_TYPES: Record<string, string> = {
  'application/pdf':           'pdf',
  'image/jpeg':                'jpg',
  'image/png':                 'png',
  'image/webp':                'webp',
  'application/msword':        'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'File too large (max 10MB)' },
        { status: 400 }
      )
    }

    const mimeType = file.type
    if (!ALLOWED_TYPES[mimeType]) {
      return NextResponse.json(
        {
          success: false,
          error: `Unsupported file type "${mimeType}". Allowed: PDF, JPG, PNG, WEBP, DOC, DOCX.`,
        },
        { status: 400 }
      )
    }

    const db = createServerSupabaseClient()
    const ext = ALLOWED_TYPES[mimeType]
    const userSlug = (session.userEmail ?? 'unknown').replace(/[^a-z0-9]/gi, '_')
    const timestamp = Date.now()
    // sanitize original filename
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80)
    const storagePath = `${userSlug}/${timestamp}_${safeName}`

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const { error: uploadError } = await db.storage
      .from('campaign-attachments')
      .upload(storagePath, buffer, {
        contentType: mimeType,
        upsert: false,
      })

    if (uploadError) {
      console.error('[Attachments] Storage upload error:', uploadError)
      return NextResponse.json(
        { success: false, error: `Storage upload failed: ${uploadError.message}` },
        { status: 500 }
      )
    }

    const { data: publicUrlData } = db.storage
      .from('campaign-attachments')
      .getPublicUrl(storagePath)

    return NextResponse.json({
      success: true,
      data: {
        url: publicUrlData.publicUrl,
        filename: file.name,
        mimeType,
        size: file.size,
        storagePath,
      },
    })
  } catch (err) {
    console.error('[Attachments] Error:', err)
    return NextResponse.json(
      { success: false, error: (err as Error).message },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { storagePath } = await req.json()
    if (!storagePath || typeof storagePath !== 'string') {
      return NextResponse.json({ success: false, error: 'storagePath required' }, { status: 400 })
    }

    // Security: only allow deleting own files (path starts with user slug)
    const userSlug = (session.userEmail ?? '').replace(/[^a-z0-9]/gi, '_')
    if (!storagePath.startsWith(userSlug + '/')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const db = createServerSupabaseClient()
    const { error } = await db.storage
      .from('campaign-attachments')
      .remove([storagePath])

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: (err as Error).message },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'
