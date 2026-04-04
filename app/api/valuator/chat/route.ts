import { NextRequest } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 60

const GEMINI_API_KEY = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY
const MODEL = 'gemini-2.0-flash'

// ─── Language Detection ───────────────────────────────────────────────────────

function detectLanguage(text: string): 'de' | 'fr' | 'en' {
  const lower = text.toLowerCase()
  const germanWords = ['ausbildung', 'lebenslauf', 'kenntnisse', 'berufserfahrung', 'ausbildungsplatz', 'bewerbung', 'stellenangebot', 'arbeitgeber', 'praktikum', 'schulabschluss']
  const frenchWords = ['expérience', 'compétences', 'formation', 'emploi', 'entreprise', 'poste', 'candidature', 'lettre de motivation', 'curriculum']

  const germanMatches = germanWords.filter(w => lower.includes(w)).length
  const frenchMatches = frenchWords.filter(w => lower.includes(w)).length

  if (germanMatches >= frenchMatches && germanMatches > 0) return 'de'
  if (frenchMatches > 0) return 'fr'
  return 'en'
}

// ─── Evaluation Trigger Detection ────────────────────────────────────────────

function isEvaluationRequest(message: string, hasFile: boolean): boolean {
  if (hasFile) return true
  const lower = message.toLowerCase()
  return /evaluate|score|analys[ei]|bewerten|bewertung|analyse|analyser|évaluer|noter/.test(lower)
}

// ─── Build Structured Evaluation System Prompt ───────────────────────────────

function buildEvaluationSystemPrompt(language: 'de' | 'fr' | 'en'): string {
  const langInstructions = {
    en: 'Respond in English.',
    de: 'Antworte auf Deutsch.',
    fr: 'Réponds en français.',
  }

  return `You are a professional German career coach and CV expert specializing in the German Ausbildung and job market. ${langInstructions[language]}

IMPORTANT: You MUST respond with ONLY a valid JSON object — no markdown, no explanation, no extra text before or after.

Analyze the CV and return exactly this JSON structure:
{
  "type": "evaluation",
  "score": <integer 0-100>,
  "grade": "<letter grade: A+, A, B+, B, C+, C, D, F>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "improvements": ["<improvement 1>", "<improvement 2>", "<improvement 3>"],
  "ausbildung_tips": ["<tip 1>", "<tip 2>", "<tip 3>"],
  "summary": "<2-3 sentence overall summary>",
  "language": "${language}"
}

Scoring criteria:
- Work experience relevance (25%)
- German market formatting (20%)
- ATS keyword coverage (20%)
- Clarity and structure (15%)
- Language and presentation (10%)
- Ausbildung/cultural fit (10%)

Grade mapping: 90-100=A+, 80-89=A, 70-79=B+, 60-69=B, 50-59=C+, 40-49=C, 30-39=D, 0-29=F

Be specific, reference actual CV content in your feedback. Output ONLY the JSON, nothing else.`
}

// ─── Ollama Fallback ──────────────────────────────────────────────────────────

async function tryOllamaFallback(content: string, isEvaluation: boolean, language: 'de' | 'fr' | 'en'): Promise<string | null> {
  const ollamaBase = process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
  const ollamaModel = process.env.OLLAMA_MODEL || 'qwen2.5-coder:14b'
  const systemPrompt = isEvaluation
    ? buildEvaluationSystemPrompt(language)
    : `You are a professional German career coach. Answer conversationally and helpfully about CVs and the German job market.`

  try {
    const res = await fetch(`${ollamaBase}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: ollamaModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content },
        ],
        temperature: 0.7,
        max_tokens: 2048,
        stream: false,
      }),
      signal: AbortSignal.timeout(30000),
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.choices?.[0]?.message?.content || null
  } catch {
    return null
  }
}

// ─── OpenRouter Fallback ──────────────────────────────────────────────────────

async function tryOpenRouterFallback(content: string, isEvaluation: boolean, language: 'de' | 'fr' | 'en'): Promise<string | null> {
  const openRouterKey = process.env.OPENROUTER_API_KEY
  if (!openRouterKey) return null

  const systemPrompt = isEvaluation
    ? buildEvaluationSystemPrompt(language)
    : `You are a professional German career coach. Answer conversationally and helpfully about CVs and the German job market.`

  const orModels = [
    'google/gemini-2.0-flash-exp:free',
    'meta-llama/llama-3.2-11b-vision-instruct:free',
  ]

  for (const orModel of orModels) {
    try {
      const orRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openRouterKey}`,
          'HTTP-Referer': 'https://rocketlead.app',
          'X-Title': 'Rocket Lead',
        },
        body: JSON.stringify({
          model: orModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content },
          ],
          temperature: 0.7,
          max_tokens: 2048,
        }),
      })
      if (!orRes.ok) continue
      const orData = await orRes.json()
      const text = orData.choices?.[0]?.message?.content || null
      if (text) return text
    } catch {
      console.warn(`[CV Chat/OpenRouter] ${orModel} failed`)
    }
  }
  return null
}

// ─── Stream text as plain response ───────────────────────────────────────────

function textToStreamResponse(text: string): Response {
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(text))
      controller.close()
    },
  })
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    if (!GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: 'API key not configured' }), { status: 500 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const message = (formData.get('message') as string) || 'Analyze this CV for the German job market.'

    // Detect language from message + file name
    const langSample = `${message} ${file?.name || ''}`
    const language = detectLanguage(langSample)
    const isEvaluation = isEvaluationRequest(message, !!file)

    const parts: Array<{ text?: string; inline_data?: { mime_type: string; data: string } }> = []

    // If file is attached, encode it
    if (file) {
      const buffer = await file.arrayBuffer()
      const base64 = Buffer.from(buffer).toString('base64')
      const mimeType = file.type || 'application/pdf'
      parts.push({ inline_data: { mime_type: mimeType, data: base64 } })
    }

    const systemPrompt = isEvaluation
      ? buildEvaluationSystemPrompt(language)
      : `You are a professional German career coach. The user is asking about CVs and German job market advice. Answer conversationally and helpfully. If they haven't uploaded a CV yet, encourage them to do so for personalized analysis.`

    parts.push({ text: `${systemPrompt}\n\nUser: ${message}` })

    // ── Ollama-first mode ──────────────────────────────────────────────────
    if (process.env.OLLAMA_ENABLED === 'true') {
      const userContent = parts.map(p => p.text || '').join('\n')
      const ollamaText = await tryOllamaFallback(userContent, isEvaluation, language)
      if (ollamaText) return textToStreamResponse(ollamaText)
      // Fall through to Gemini
    }

    // Use streaming endpoint
    const url = `https://generativelanguage.googleapis.com/v1/models/${MODEL}:streamGenerateContent?alt=sse&key=${GEMINI_API_KEY}`

    const geminiRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts, role: 'user' }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
          ...(isEvaluation ? { responseMimeType: 'application/json' } : {}),
        },
      }),
    })

    if (!geminiRes.ok) {
      const errText = await geminiRes.text()
      if (geminiRes.status === 429) {
        // Quota exceeded — attempt Ollama first, then OpenRouter
        console.warn('[CV Chat] Gemini quota exceeded — trying Ollama then OpenRouter fallback')

        const userContent = parts.map(p => p.text || '').join('\n')

        // Try Ollama
        if (process.env.OLLAMA_BASE_URL) {
          const ollamaText = await tryOllamaFallback(userContent, isEvaluation, language)
          if (ollamaText) return textToStreamResponse(ollamaText)
        }

        // Try OpenRouter
        const orText = await tryOpenRouterFallback(userContent, isEvaluation, language)
        if (orText) return textToStreamResponse(orText)

        return new Response(
          JSON.stringify({ error: 'QUOTA_EXCEEDED', message: 'API quota exceeded. Please try again in a moment.' }),
          { status: 429, headers: { 'Content-Type': 'application/json' } }
        )
      }
      return new Response(
        JSON.stringify({ error: 'GEMINI_ERROR', message: `Gemini API error: ${geminiRes.status}` }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Forward the SSE stream directly to the client
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        const reader = geminiRes.body!.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            buffer = lines.pop() || ''

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6).trim()
                if (data === '[DONE]') continue
                try {
                  const parsed = JSON.parse(data)
                  const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text
                  if (text) {
                    controller.enqueue(encoder.encode(text))
                  }
                } catch {
                  // skip malformed chunk
                }
              }
            }
          }
        } finally {
          controller.close()
          reader.releaseLock()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (err) {
    console.error('[CV Chat] Error:', err)
    return new Response(
      JSON.stringify({ error: 'INTERNAL_ERROR', message: (err as Error).message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
