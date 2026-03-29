import OpenAI from 'openai'
import type { GeneratedEmail, ClassifiedReply, GeneratedFollowUp } from '@/types'
import { extractCompanyName, extractDomain } from '@/utils/helpers'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

// ─── Email Generation ──────────────────────────────────────────────────────

/**
 * Generates a high-conversion cold outreach email.
 * Called when a lead has no subject/body or needs improvement.
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

  const userPrompt = needsSubject && needsBody
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

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
    response_format: { type: 'json_object' },
    max_tokens: 600,
  })

  const raw = completion.choices[0].message.content || '{}'
  const parsed = JSON.parse(raw)

  return {
    subject: parsed.subject || existingSubject || 'Quick question about your Google presence',
    body: parsed.body || existingBody || '',
  }
}

// ─── Batch Email Generation ────────────────────────────────────────────────

/**
 * Generates emails for multiple leads.
 * Skips leads that already have both subject and body.
 */
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
      console.error(`[AI] Failed to generate email for ${lead.email}:`, err)
      // Fallback to defaults
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

// ─── Reply Classification ──────────────────────────────────────────────────

/**
 * Classifies an email reply as YES (interested), NO (not interested), or NEUTRAL.
 */
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

  const userPrompt = `Classify this reply:
"""
${replyContent.slice(0, 1500)}
"""`

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' },
      max_tokens: 150,
    })

    const raw = completion.choices[0].message.content || '{}'
    const parsed = JSON.parse(raw)

    return {
      classification: parsed.classification || 'NEUTRAL',
      confidence: parsed.confidence || 0.5,
      reasoning: parsed.reasoning || '',
    }
  } catch (err) {
    console.error('[AI] Reply classification failed:', err)
    return { classification: 'NEUTRAL', confidence: 0, reasoning: 'Classification failed' }
  }
}

// ─── Follow-up Generation ─────────────────────────────────────────────────

/**
 * Generates a highly persuasive follow-up email for an interested lead.
 * Uses the lead's domain to tailor the message.
 */
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
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
      max_tokens: 600,
    })

    const raw = completion.choices[0].message.content || '{}'
    const parsed = JSON.parse(raw)

    return {
      subject: parsed.subject || `Re: ${originalSubject}`,
      body: parsed.body || '',
    }
  } catch (err) {
    console.error('[AI] Follow-up generation failed:', err)
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
