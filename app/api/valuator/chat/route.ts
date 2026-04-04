import { NextRequest } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 60

const GEMINI_API_KEY = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY
const MODEL = 'gemini-2.0-flash'

export async function POST(req: NextRequest) {
  try {
    if (!GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: 'API key not configured' }), { status: 500 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const message = (formData.get('message') as string) || 'Analyze this CV for the German job market.'

    const parts: Array<{ text?: string; inline_data?: { mime_type: string; data: string } }> = []

    // If file is attached, encode it
    if (file) {
      const buffer = await file.arrayBuffer()
      const base64 = Buffer.from(buffer).toString('base64')
      const mimeType = file.type || 'application/pdf'
      parts.push({ inline_data: { mime_type: mimeType, data: base64 } })
    }

    const systemPrompt = file
      ? `You are a professional German career coach and CV expert. Analyze the provided CV for the German job market (Ausbildung/Arbeit).
Respond conversationally in English. Structure your response with clear sections:

**Gesamtbewertung (Overall Score):** X/100

**Stärken (Strengths):**
- List 3-5 specific strengths

**Schwächen (Weaknesses):**
- List 3-5 specific areas to improve

**ATS-Keywords fehlen (Missing ATS Keywords):**
- List 8-10 important German market keywords

**Deutschlandkompatibilität (German Market Fit):** X%
Brief explanation of cultural/format fit

**Wichtigste Empfehlungen (Top Recommendations):**
1. Most important change
2. Second change
3. Third change

Be specific, professional, and encouraging. Reference actual content from their CV.`
      : `You are a professional German career coach. The user is asking about CVs and German job market advice. Answer conversationally and helpfully. If they haven't uploaded a CV yet, encourage them to do so for personalized analysis.`

    parts.push({ text: `${systemPrompt}\n\nUser: ${message}` })

    // Use streaming endpoint
    const url = `https://generativelanguage.googleapis.com/v1/models/${MODEL}:streamGenerateContent?alt=sse&key=${GEMINI_API_KEY}`

    const geminiRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts, role: 'user' }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
      }),
    })

    if (!geminiRes.ok) {
      const errText = await geminiRes.text()
      if (geminiRes.status === 429) {
        // Quota exceeded — attempt OpenRouter fallback before returning an error
        const openRouterKey = process.env.OPENROUTER_API_KEY
        if (openRouterKey) {
          console.warn('[CV Chat] Gemini quota exceeded — trying OpenRouter fallback')
          try {
            const orModels = [
              'google/gemini-2.0-flash-exp:free',
              'meta-llama/llama-3.2-11b-vision-instruct:free',
            ]
            let orText: string | null = null
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
                    messages: [{ role: 'user', content: parts.map((p) => p.text || '').join('\n') }],
                    temperature: 0.7,
                    max_tokens: 2048,
                  }),
                })
                if (!orRes.ok) {
                  const t = await orRes.text().catch(() => '')
                  throw new Error(`OpenRouter ${orModel} error ${orRes.status}: ${t.slice(0, 200)}`)
                }
                const orData = await orRes.json()
                orText = orData.choices?.[0]?.message?.content || null
                if (orText) break
              } catch (orModelErr) {
                console.warn(`[CV Chat/OpenRouter] ${orModel} failed: ${(orModelErr as Error).message.slice(0, 80)}`)
              }
            }
            if (orText) {
              const encoder = new TextEncoder()
              const fallbackStream = new ReadableStream({
                start(controller) {
                  controller.enqueue(encoder.encode(orText!))
                  controller.close()
                },
              })
              return new Response(fallbackStream, {
                headers: {
                  'Content-Type': 'text/plain; charset=utf-8',
                  'Cache-Control': 'no-cache',
                  'X-Content-Type-Options': 'nosniff',
                },
              })
            }
          } catch (orErr) {
            console.error('[CV Chat] OpenRouter fallback failed:', (orErr as Error).message)
          }
        }
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
