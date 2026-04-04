import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CVAnalysis {
  overallScore: number             // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  summary: string
  strengths: string[]
  weaknesses: string[]
  germanMarketFit: {
    score: number
    issues: string[]
    positives: string[]
  }
  sections: {
    name: string
    score: number
    feedback: string
    priority: 'critical' | 'high' | 'medium' | 'low'
  }[]
  atsKeywords: {
    present: string[]
    missing: string[]
  }
  rewrittenCV: string              // Full optimized CV in German business standard
  rewriteSummary: string           // What was changed and why
}

// ─── Gemini Helper ────────────────────────────────────────────────────────────

async function callGeminiWithFile(
  base64Data: string,
  mimeType: string,
  fileName: string
): Promise<CVAnalysis> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured')

  const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${apiKey}`

  const systemInstructions = `You are a world-class German HR consultant and CV optimization expert with 15+ years
of experience helping international candidates (especially from Morocco and North Africa) break into the
German job market. You specialize in Ausbildung (vocational training) applications, dual-study programs,
and entry-level corporate positions.

You understand:
- German CV (Lebenslauf) standards: reverse-chronological, photo expected, personal details upfront
- Ausbildung application requirements: clear school grades, language certifications, motivation
- German corporate culture: precision, qualifications over personality, formal tone
- ATS (Applicant Tracking System) optimization for German HR software (Haufe, Rexx, SAP HR)
- B1/B2/C1 German language requirement expectations

Your analysis must be thorough, brutally honest, and actionable.
Your rewritten CV must be in German, professionally formatted, and ready to submit.`

  const userPrompt = `Analyze this CV file completely and return a JSON response.

The CV is named: "${fileName}"

Perform a complete audit and return ONLY valid JSON (no markdown, no code blocks) with this exact structure:
{
  "overallScore": <0-100 integer>,
  "grade": "<A|B|C|D|F>",
  "summary": "<2-3 sentence executive summary of the CV quality>",
  "strengths": ["<strength 1>", "<strength 2>", ...],
  "weaknesses": ["<weakness 1>", "<weakness 2>", ...],
  "germanMarketFit": {
    "score": <0-100>,
    "issues": ["<issue that would hurt German applications>", ...],
    "positives": ["<factor that helps with German employers>", ...]
  },
  "sections": [
    {
      "name": "<section name e.g. Personal Information, Work Experience, Education, Skills, Languages>",
      "score": <0-100>,
      "feedback": "<specific, actionable feedback>",
      "priority": "<critical|high|medium|low>"
    }
  ],
  "atsKeywords": {
    "present": ["<keyword found>", ...],
    "missing": ["<important keyword missing>", ...]
  },
  "rewrittenCV": "<Complete rewritten CV in German, professionally formatted for Ausbildung/entry-level German jobs. Use standard German CV format: Persönliche Daten, Ausbildung/Bildung, Berufserfahrung, Kenntnisse, Sprachen, Hobbys. Plain text, use newlines and dashes for formatting.>",
  "rewriteSummary": "<Bullet-pointed summary of all major changes made and why each was necessary>"
}`

  const body = {
    contents: [
      {
        role: 'user',
        parts: [
          {
            inline_data: {
              mime_type: mimeType,
              data: base64Data,
            },
          },
          { text: userPrompt },
        ],
      },
    ],
    systemInstruction: {
      parts: [{ text: systemInstructions }],
    },
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 8192,
      responseMimeType: 'application/json',
    },
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const err = await response.text().catch(() => 'unknown')
    throw new Error(`Gemini API error ${response.status}: ${err.slice(0, 200)}`)
  }

  const data = await response.json()
  const candidate = data.candidates?.[0]

  if (!candidate) throw new Error('Gemini returned no candidates')
  if (candidate.finishReason === 'SAFETY') throw new Error('Gemini blocked by safety filter')

  const text = candidate.content?.parts?.[0]?.text
  if (!text) throw new Error('Gemini returned empty response')

  // Strip markdown code fences if present
  const clean = text.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim()
  return JSON.parse(clean) as CVAnalysis
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    // Auth check
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse multipart form
    const formData = await req.formData()
    const file = formData.get('cv') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No CV file provided' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Unsupported file type. Upload PDF, Word (.doc/.docx), or plain text.' },
        { status: 400 }
      )
    }

    // Size limit: 10MB
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Maximum 10MB allowed.' },
        { status: 400 }
      )
    }

    // Convert to base64 for Gemini inline_data
    const arrayBuffer = await file.arrayBuffer()
    const base64Data = Buffer.from(arrayBuffer).toString('base64')

    // Analyze with Gemini
    const analysis = await callGeminiWithFile(base64Data, file.type, file.name)

    return NextResponse.json({ analysis }, { status: 200 })
  } catch (err) {
    const message = (err as Error).message || 'Unknown error'
    console.error('[CV Valuator API]', message)

    if (message.includes('JSON')) {
      return NextResponse.json(
        { error: 'AI returned malformed data. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// Max duration for Vercel — large files + AI analysis can take up to 60s
export const maxDuration = 60
export const runtime = 'nodejs'
