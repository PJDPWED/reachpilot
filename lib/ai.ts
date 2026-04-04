import { extractCompanyName, extractDomain } from '@/utils/helpers'
import type { GeneratedEmail, ClassifiedReply, GeneratedFollowUp } from '@/types'

// ─── Native Gemini REST Client ────────────────────────────────────────────────
// Uses Google's Generative Language API directly — stable v1 endpoint.
// Model priority: gemini-2.0-flash (fastest) → gemini-1.5-flash (fallback)

type GeminiModel =
  | 'gemini-2.0-flash'
  | 'gemini-1.5-flash'
  | 'gemini-1.5-pro'
  | 'gemini-2.0-flash-exp'

// Default fast model — widely available across all regions and free tiers
const DEFAULT_MODEL: GeminiModel = 'gemini-2.0-flash'
const FALLBACK_MODEL: GeminiModel = 'gemini-1.5-flash'

interface GeminiOptions {
  temperature?: number
  maxTokens?: number
  jsonMode?: boolean
  /** Override the model. Defaults to gemini-2.0-flash */
  model?: GeminiModel
}

async function callGeminiRaw(
  model: GeminiModel,
  systemPrompt: string,
  userPrompt: string,
  options: GeminiOptions = {}
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured. Add it to your .env.local file.')
  }

  // Use stable v1 endpoint — v1beta is for experimental features only
  const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`

  const body = {
    contents: [
      {
        role: 'user',
        parts: [{ text: userPrompt }],
      },
    ],
    systemInstruction: {
      parts: [{ text: systemPrompt }],
    },
    generationConfig: {
      temperature: options.temperature ?? 0.7,
      maxOutputTokens: options.maxTokens ?? 600,
      ...(options.jsonMode ? { responseMimeType: 'application/json' } : {}),
    },
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => '')
    if (response.status === 429) {
      throw new Error('QUOTA_EXCEEDED: Gemini API quota exceeded. Please try again later.')
    }
    throw new Error(`Gemini API error ${response.status}: ${errorText.slice(0, 300)}`)
  }

  const data = await response.json()

  // Check for content blocking
  const candidate = data.candidates?.[0]
  if (!candidate) {
    throw new Error('Gemini returned no candidates (possible safety filter)')
  }
  if (candidate.finishReason === 'SAFETY') {
    throw new Error('Gemini blocked the request due to safety filters')
  }
  if (candidate.finishReason === 'RECITATION') {
    throw new Error('Gemini blocked due to recitation policy')
  }

  const text = candidate.content?.parts?.[0]?.text
  if (!text) {
    throw new Error(`Gemini returned empty text. Finish reason: ${candidate.finishReason}`)
  }

  return text
}

async function callOpenRouter(
  systemPrompt: string,
  userPrompt: string,
  options: GeminiOptions = {}
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY not configured — add it to .env.local to enable fallback')
  }

  const models = [
    'google/gemini-2.0-flash-exp:free',
    'meta-llama/llama-3.2-11b-vision-instruct:free',
  ]

  let lastErr: Error | null = null
  for (const model of models) {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://rocketlead.app',
          'X-Title': 'Rocket Lead',
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: options.temperature ?? 0.7,
          max_tokens: options.maxTokens ?? 600,
          ...(options.jsonMode ? { response_format: { type: 'json_object' } } : {}),
        }),
      })

      if (!response.ok) {
        const txt = await response.text().catch(() => '')
        throw new Error(`OpenRouter ${model} error ${response.status}: ${txt.slice(0, 200)}`)
      }

      const data = await response.json()
      const text = data.choices?.[0]?.message?.content
      if (!text) throw new Error(`OpenRouter returned empty content from ${model}`)
      return text
    } catch (err) {
      lastErr = err as Error
      console.warn(`[OpenRouter] ${model} failed: ${(err as Error).message.slice(0, 80)}`)
    }
  }
  throw lastErr ?? new Error('All OpenRouter models failed')
}

/**
 * Calls Gemini with automatic model fallback.
 * Tries DEFAULT_MODEL (gemini-2.0-flash) first, falls back to FALLBACK_MODEL (gemini-1.5-flash).
 * If Gemini returns a 429 quota error, tries OpenRouter as a secondary fallback.
 */
async function callGemini(
  model: GeminiModel,
  systemPrompt: string,
  userPrompt: string,
  options: GeminiOptions = {}
): Promise<string> {
  try {
    return await callGeminiRaw(model, systemPrompt, userPrompt, options)
  } catch (err) {
    const msg = (err as Error).message || ''

    // Quota exceeded — try OpenRouter as fallback before giving up
    if (msg.includes('QUOTA_EXCEEDED')) {
      console.warn('[AI] Gemini quota exceeded — trying OpenRouter fallback')
      try {
        return await callOpenRouter(systemPrompt, userPrompt, options)
      } catch (orErr) {
        console.error('[AI] OpenRouter fallback also failed:', (orErr as Error).message)
        // Surface the original quota error (more actionable)
      }
    }

    // Fall back to gemini-1.5-flash for model-not-found errors
    const shouldFallback =
      msg.includes('404') ||
      msg.includes('not found') ||
      msg.includes('not supported')

    if (shouldFallback && model !== FALLBACK_MODEL) {
      console.warn(`[Gemini] ${model} failed (${msg.slice(0, 80)}), falling back to ${FALLBACK_MODEL}`)
      return await callGeminiRaw(FALLBACK_MODEL, systemPrompt, userPrompt, options)
    }
    throw err
  }
}

// ─── Email Generation ──────────────────────────────────────────────────────────

/**
 * Generates a high-conversion cold outreach email using Gemini.
 */
export async function generateEmail(
  recipientEmail: string,
  existingSubject?: string,
  existingBody?: string
): Promise<GeneratedEmail> {
  const companyName = extractCompanyName(recipientEmail)
  const domain = extractDomain(recipientEmail)

  const needsSubject = !existingSubject
  const needsBody = !existingBody || existingBody.trim().length < 50

  const systemPrompt = `You are an elite cold email copywriter with a 40%+ reply rate.
Your emails are:
- Short (under 120 words for the body)
- Deeply personalized based on domain/company
- Problem-aware and solution-focused
- Conversational, not salesy
- Free of spam triggers (no "FREE", "CLICK HERE", "LIMITED TIME", etc.)
- Structured: hook → problem → value prop → soft CTA

You always output valid JSON with keys: "subject" and "body".
The body uses plain text only, no HTML or markdown.
Never write more than 3 short paragraphs.`

  const userPrompt =
    needsSubject && needsBody
      ? `Write a cold outreach email for a business at domain: ${domain}
Company name guess: ${companyName}
Context: We are "Big Reach PR" — we optimize Google Business Profiles to help local businesses rank higher in Google Maps, get more calls, and attract more customers.
Generate a compelling subject line and email body.`
      : needsBody
      ? `Improve and rewrite this email body for ${companyName} (${domain}).
Keep the subject: "${existingSubject}"
Context: Big Reach PR — Google Business Profile optimization for local businesses.
Existing body to improve: """${existingBody}"""`
      : `Generate a compelling subject line for this email to ${companyName} (${domain}).
Body: """${existingBody}"""
Context: Big Reach PR — Google Business Profile optimization.`

  const raw = await callGemini(DEFAULT_MODEL, systemPrompt, userPrompt, {
    temperature: 0.7,
    maxTokens: 600,
    jsonMode: true,
  })

  const parsed = JSON.parse(raw)

  return {
    subject:
      parsed.subject || existingSubject || 'Quick question about your Google presence',
    body: parsed.body || existingBody || '',
  }
}

// ─── Batch Email Generation ────────────────────────────────────────────────────

export async function generateEmailsForLeads(
  leads: { email: string; subject?: string; body?: string }[]
): Promise<{ email: string; subject: string; body: string }[]> {
  const results: { email: string; subject: string; body: string }[] = []

  for (const lead of leads) {
    const hasSubject = lead.subject && lead.subject.trim().length > 0
    const hasBody = lead.body && lead.body.trim().length > 50

    if (hasSubject && hasBody) {
      results.push({
        email: lead.email,
        subject: lead.subject!,
        body: lead.body!,
      })
      continue
    }

    try {
      const generated = await generateEmail(lead.email, lead.subject, lead.body)
      results.push({
        email: lead.email,
        subject: generated.subject,
        body: generated.body,
      })
    } catch (err) {
      console.error(`[AI/Gemini] Failed to generate email for ${lead.email}:`, err)
      // Graceful fallback — never block the campaign from starting
      results.push({
        email: lead.email,
        subject: lead.subject || 'Quick question about your Google presence',
        body: lead.body || defaultEmailBody(lead.email),
      })
    }
  }

  return results
}

function defaultEmailBody(email: string): string {
  const company = extractCompanyName(email)
  return `Hi,

I came across ${company} and noticed there might be an opportunity to improve your Google Business Profile ranking.

Most local businesses lose customers daily simply because competitors appear higher in Google Maps searches. We help businesses like yours dominate those results.

Would you be open to a quick 10-minute call to see if we can help? No commitment needed.

Best,
The Big Reach PR Team`
}

// ─── Reply Classification ──────────────────────────────────────────────────────

export async function classifyReply(replyContent: string): Promise<ClassifiedReply> {
  const systemPrompt = `You are an expert sales reply analyzer.
Classify an email reply as one of three categories:
- YES: The recipient is interested, wants to learn more, asks questions about the offer, or agrees to a call
- NO: The recipient explicitly declines, says they're not interested, unsubscribes, or is rude
- NEUTRAL: Out-of-office replies, ambiguous responses, or unclear intent

Output valid JSON with keys:
- "classification": "YES", "NO", or "NEUTRAL"
- "confidence": 0.0 to 1.0
- "reasoning": brief explanation (max 15 words)`

  const userPrompt = `Classify this reply:\n"""\n${replyContent.slice(0, 1500)}\n"""`

  try {
    const raw = await callGemini(DEFAULT_MODEL, systemPrompt, userPrompt, {
      temperature: 0.1,
      maxTokens: 150,
      jsonMode: true,
    })

    const parsed = JSON.parse(raw)

    return {
      classification: parsed.classification || 'NEUTRAL',
      confidence: parsed.confidence || 0.5,
      reasoning: parsed.reasoning || '',
    }
  } catch (err) {
    console.error('[AI/Gemini] Reply classification failed:', err)
    return { classification: 'NEUTRAL', confidence: 0, reasoning: 'Classification failed' }
  }
}

// ─── Follow-up Generation ──────────────────────────────────────────────────────

export async function generateFollowUp(
  recipientEmail: string,
  originalSubject: string,
  replyContent: string
): Promise<GeneratedFollowUp> {
  const companyName = extractCompanyName(recipientEmail)
  const domain = extractDomain(recipientEmail)

  const systemPrompt = `You are a world-class B2B sales closer specializing in local business growth.
You are writing a follow-up email to a prospect who replied positively to your outreach.
Your company is "Big Reach PR" — you optimize Google Business Profiles (GBP) for local businesses.

The follow-up must:
1. Acknowledge their interest warmly (personalized, not generic)
2. Show authority: explain the specific ROI of GBP optimization for their type of business
3. Include ONE compelling data point or insight about local search behavior
4. Present a clear, low-friction next step (book a call, reply to schedule)
5. Be 150-200 words maximum
6. Sound human, premium, and confident — not pushy

Output valid JSON with keys: "subject" and "body".`

  const userPrompt = `Write a follow-up email for this prospect:
- Company: ${companyName}
- Domain: ${domain}
- Original subject: "${originalSubject}"
- Their reply: """${replyContent.slice(0, 800)}"""

Make the follow-up highly persuasive and tailored to their business type based on the domain.`

  try {
    const raw = await callGemini(DEFAULT_MODEL, systemPrompt, userPrompt, {
      temperature: 0.7,
      maxTokens: 600,
      jsonMode: true,
    })

    const parsed = JSON.parse(raw)

    return {
      subject: parsed.subject || `Re: ${originalSubject}`,
      body: parsed.body || '',
    }
  } catch (err) {
    console.error('[AI/Gemini] Follow-up generation failed:', err)
    return {
      subject: `Re: ${originalSubject}`,
      body: defaultFollowUpBody(companyName),
    }
  }
}

function defaultFollowUpBody(companyName: string): string {
  return `Hi,

Thanks for getting back to me — great to hear from you!

To give you a quick overview: businesses that optimize their Google Business Profile see an average of 70% more calls and 35% more direction requests within 90 days.

For ${companyName}, we'd audit your current profile, identify ranking gaps against competitors, and implement proven optimizations — all within 2 weeks.

Would you have 15 minutes this week for a quick call? I can show you exactly where you're losing customers right now.

Looking forward to connecting,
The Big Reach PR Team`
}

// ─── Spam Score Checker ────────────────────────────────────────────────────────

export interface SpamAnalysis {
  score: number       // 0 (clean) – 100 (definitely spam)
  level: 'safe' | 'warning' | 'danger'
  triggers: string[]
  suggestions: string[]
}

/**
 * Analyzes an email for spam triggers using Gemini.
 * Falls back to a heuristic check if Gemini is unavailable.
 */
export async function analyzeSpamScore(
  subject: string,
  body: string
): Promise<SpamAnalysis> {
  const systemPrompt = `You are a deliverability expert who analyzes cold emails for spam triggers.
Score the email from 0 (clean) to 100 (high spam risk).

Check for:
- Spam trigger words (FREE, URGENT, GUARANTEED, CLICK NOW, etc.)
- ALL CAPS sections
- Excessive punctuation (!!!, ???)
- Over-promotional language
- Lack of personalization
- Aggressive CTAs

Output valid JSON:
- "score": integer 0-100
- "level": "safe" (0-30), "warning" (31-60), or "danger" (61-100)
- "triggers": array of specific issues found (max 5 strings)
- "suggestions": array of specific improvements (max 5 strings)`

  const userPrompt = `Analyze this email:
Subject: "${subject}"
Body:
"""
${body.slice(0, 2000)}
"""`

  try {
    const raw = await callGemini('gemini-1.5-flash', systemPrompt, userPrompt, {
      temperature: 0.1,
      maxTokens: 400,
      jsonMode: true,
    })

    const parsed = JSON.parse(raw)

    return {
      score: Math.max(0, Math.min(100, Number(parsed.score) || 0)),
      level: parsed.level || 'safe',
      triggers: Array.isArray(parsed.triggers) ? parsed.triggers.slice(0, 5) : [],
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions.slice(0, 5) : [],
    }
  } catch {
    return heuristicSpamScore(subject, body)
  }
}

function heuristicSpamScore(subject: string, body: string): SpamAnalysis {
  const combined = `${subject} ${body}`.toUpperCase()
  const SPAM_WORDS = [
    'FREE', 'URGENT', 'CLICK HERE', 'ACT NOW', 'LIMITED TIME',
    'GUARANTEED', 'WINNER', 'PRIZE', 'DISCOUNT', 'BUY NOW',
    '100%', 'MILLION', 'BILLION', 'RISK FREE', 'NO OBLIGATION',
  ]

  const found = SPAM_WORDS.filter((w) => combined.includes(w))
  const capsRatio =
    (combined.match(/[A-Z]/g) || []).length / Math.max(combined.length, 1)
  const excessivePunct = (combined.match(/[!?]{2,}/g) || []).length

  let score = found.length * 15 + Math.round(capsRatio * 30) + excessivePunct * 10
  score = Math.min(100, score)

  return {
    score,
    level: score > 60 ? 'danger' : score > 30 ? 'warning' : 'safe',
    triggers: [
      ...found.map((w) => `Contains spam word: "${w}"`),
      ...(capsRatio > 0.3 ? ['Excessive use of ALL CAPS'] : []),
      ...(excessivePunct > 0 ? ['Excessive punctuation (!!!  ???)'] : []),
    ].slice(0, 5),
    suggestions:
      score > 30
        ? [
            'Replace promotional words with conversational language',
            'Reduce use of capital letters',
            'Ask a question instead of making a demand',
          ]
        : [],
  }
}
