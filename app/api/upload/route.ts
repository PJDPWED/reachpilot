import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { parseFileContent, deduplicateLeads } from '@/lib/parser'
import { generateEmailsForLeads } from '@/lib/ai'
import { createServerSupabaseClient } from '@/lib/supabase'
import { z } from 'zod'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const campaignName = formData.get('campaignName') as string | null
    const generateAI = formData.get('generateAI') === 'true'
    const attachmentsRaw = formData.get('attachments') as string | null
    let attachments: unknown[] = []
    if (attachmentsRaw) {
      try { attachments = JSON.parse(attachmentsRaw) } catch { /* ignore malformed */ }
    }

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ success: false, error: 'File too large (max 5MB)' }, { status: 400 })
    }

    const allowedExtensions = ['csv', 'txt', 'json']
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (!ext || !allowedExtensions.includes(ext)) {
      return NextResponse.json(
        { success: false, error: 'Unsupported file type. Use CSV, TXT, or JSON.' },
        { status: 400 }
      )
    }

    const content = await file.text()

    // Parse file
    const { leads: parsedLeads, skipped, errors } = parseFileContent(content, file.name)

    if (parsedLeads.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid leads found in file', details: errors },
        { status: 422 }
      )
    }

    // Deduplicate
    const { unique: uniqueLeads, duplicates } = deduplicateLeads(parsedLeads)

    // AI generation (if requested — can be done in background after campaign create)
    let processedLeads = uniqueLeads
    if (generateAI) {
      processedLeads = await generateEmailsForLeads(uniqueLeads)
    }

    // If campaignName is provided, persist to DB immediately
    if (campaignName && campaignName.trim().length > 0) {
      const name = z
        .string()
        .min(1)
        .max(100)
        .parse(campaignName.trim())

      const db = createServerSupabaseClient()

      // Create campaign
      const { data: campaign, error: campaignError } = await db
        .from('campaigns')
        .insert({
          name,
          status: 'pending',
          ...(attachments.length > 0 ? { attachments } : {}),
        })
        .select()
        .single()

      if (campaignError || !campaign) {
        throw new Error(`Failed to create campaign: ${campaignError?.message}`)
      }

      // Insert leads
      const leadsToInsert = processedLeads.map((lead) => ({
        campaign_id: campaign.id,
        email: lead.email,
        subject: (lead as { subject?: string }).subject || null,
        body: (lead as { body?: string }).body || null,
        status: 'pending',
        retry_count: 0,
      }))

      const { error: leadsError } = await db.from('leads').insert(leadsToInsert)

      if (leadsError) {
        // Rollback campaign
        await db.from('campaigns').delete().eq('id', campaign.id)
        throw new Error(`Failed to insert leads: ${leadsError.message}`)
      }

      return NextResponse.json({
        success: true,
        data: {
          campaign,
          totalLeads: processedLeads.length,
          skipped,
          duplicates,
          errors,
          leads: processedLeads.slice(0, 20), // preview
        },
      })
    }

    // Return preview only (no DB persistence)
    return NextResponse.json({
      success: true,
      data: {
        totalLeads: processedLeads.length,
        skipped,
        duplicates,
        errors,
        leads: processedLeads.slice(0, 50),
      },
    })
  } catch (err) {
    console.error('[Upload] Error:', err)
    return NextResponse.json(
      { success: false, error: (err as Error).message },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'
