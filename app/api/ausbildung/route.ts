import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AusbildungLead {
  id: string
  company: string
  position: string
  city: string
  email: string
  phone?: string
  website?: string
  sourceUrl?: string
  description?: string
  emailSubject: string
  emailBody: string
  confidence: 'high' | 'medium' | 'low'   // how confident the AI is about this data
}

export interface AusbildungSearchResult {
  query: string
  totalFound: number
  leads: AusbildungLead[]
  searchNotes: string   // AI notes on what it found / limitations
}

// ─── Gemini Search Grounding ──────────────────────────────────────────────────
// Uses Gemini 1.5 Pro with Google Search grounding tool enabled.
// This allows real-time web search during generation.

async function searchWithGemini(
  userQuery: string,
  senderName: string,
  senderEmail: string
): Promise<AusbildungSearchResult> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured')

  // Use gemini-1.5-pro with googleSearch grounding tool
  // Search Grounding requires v1beta — keep for this route only
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`

  const systemInstruction = `You are an AI lead-generation specialist for Rocket Lead Deutschland.
Your job is to search the web for German Ausbildung (vocational training) companies that match the user's request,
then generate a structured list of leads WITH pre-written cold outreach emails.

The sender is: ${senderName} (${senderEmail}) — a Moroccan professional applying for German Ausbildung positions.

Guidelines:
- Find real company names, real cities, and best available contact information
- For companies where you can't find a direct HR email, use the general contact pattern (info@domain.de, bewerbung@domain.de, hr@domain.de)
- Generate professional German cold-outreach emails tailored to each company
- Emails must be in German, formal (Sie-Form), 120-180 words
- Subject lines should be specific to the company and position
- Mark confidence as: high (found direct email), medium (inferred email), low (no email found, best guess)
- NEVER invent company names. If fewer leads found, return fewer with honest notes.

Output ONLY valid JSON, no markdown, no code blocks.`

  const userPrompt = `User's search request: "${userQuery}"

Search the web right now for real German companies matching this request.

Return JSON with this exact structure:
{
  "query": "${userQuery}",
  "totalFound": <integer>,
  "searchNotes": "<honest notes about what you found, limitations, data quality>",
  "leads": [
    {
      "id": "<uuid-style string>",
      "company": "<real company name>",
      "position": "<specific Ausbildung position>",
      "city": "<German city>",
      "email": "<best contact email>",
      "phone": "<phone if found, else omit>",
      "website": "<company website URL>",
      "sourceUrl": "<URL where you found this info>",
      "description": "<1-2 sentence company description>",
      "emailSubject": "<German subject line for cold outreach>",
      "emailBody": "<Full German email body, 120-180 words, Sie-Form, professional>",
      "confidence": "<high|medium|low>"
    }
  ]
}

Find as many leads as possible, up to the number the user requested. Be thorough.`

  const body = {
    contents: [
      {
        role: 'user',
        parts: [{ text: userPrompt }],
      },
    ],
    systemInstruction: {
      parts: [{ text: systemInstruction }],
    },
    tools: [
      {
        googleSearch: {},
      },
    ],
    generationConfig: {
      temperature: 0.20,
      maxOutputTokens: 8192,
    },
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    if (response.status === 429) {
      const quotaError = new Error('QUOTA_EXCEEDED') as Error & { isQuotaExceeded: boolean }
      quotaError.isQuotaExceeded = true
      throw quotaError
    }
    const err = await response.text().catch(() => 'unknown')
    throw new Error(`Gemini API error ${response.status}: ${err.slice(0, 300)}`)
  }

  const data = await response.json()
  const candidate = data.candidates?.[0]

  if (!candidate) throw new Error('Gemini returned no candidates')
  if (candidate.finishReason === 'SAFETY') throw new Error('Gemini blocked by safety filter')

  const text = candidate.content?.parts?.[0]?.text
  if (!text) throw new Error('Gemini returned empty response')

  // Strip markdown fences
  const stripped = text
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/gi, '')
    .trim()

  // Find outermost JSON object
  const start = stripped.indexOf('{')
  const end = stripped.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('No JSON object found in Gemini response')
  }

  let parsed: AusbildungSearchResult
  try {
    parsed = JSON.parse(stripped.slice(start, end + 1)) as AusbildungSearchResult
  } catch (parseErr) {
    throw new Error(`Gemini returned malformed JSON: ${(parseErr as Error).message}`)
  }

  // Ensure each lead has a stable ID
  parsed.leads = parsed.leads.map((lead, idx) => ({
    ...lead,
    id: lead.id || `lead-${Date.now()}-${idx}`,
  }))

  return parsed
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { query } = body

    if (!query || typeof query !== 'string' || query.trim().length < 5) {
      return NextResponse.json(
        { error: 'Please provide a search query (e.g. "50 IT Ausbildung Hamburg")' },
        { status: 400 }
      )
    }

    const senderName = session.user?.name || 'Bewerber'
    const senderEmail = session.userEmail || session.user?.email || ''

    const result = await searchWithGemini(query.trim(), senderName, senderEmail)

    return NextResponse.json({ result }, { status: 200 })
  } catch (err) {
    const message = (err as Error).message || 'Search failed'
    console.error('[Ausbildung API]', message)

    if (message === 'QUOTA_EXCEEDED' || (err as { isQuotaExceeded?: boolean }).isQuotaExceeded) {
      return NextResponse.json(
        { error: 'QUOTA_EXCEEDED', message: 'API quota exceeded. Please try again in a moment.' },
        { status: 429 }
      )
    }

    if (message.includes('JSON')) {
      return NextResponse.json(
        { error: 'AI returned malformed data. Try rephrasing your query.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export const maxDuration = 60
export const runtime = 'nodejs'
