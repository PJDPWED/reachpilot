import Papa from 'papaparse'
import { isValidEmail } from '@/utils/helpers'
import type { ParsedLead } from '@/types'

// ─── Main Parser Entry Point ───────────────────────────────────────────────

/**
 * Parses uploaded file content into an array of ParsedLead objects.
 * Supports CSV, TXT (comma or newline separated), and JSON.
 * Skips invalid rows silently.
 */
export function parseFileContent(
  content: string,
  filename: string
): { leads: ParsedLead[]; skipped: number; errors: string[] } {
  const ext = filename.split('.').pop()?.toLowerCase()

  if (ext === 'json') {
    return parseJson(content)
  } else if (ext === 'csv') {
    return parseCsv(content)
  } else if (ext === 'txt') {
    return parseTxt(content)
  } else {
    // Try to detect format by content
    const trimmed = content.trim()
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      return parseJson(content)
    }
    if (trimmed.includes(',') && trimmed.split('\n')[0].toLowerCase().includes('email')) {
      return parseCsv(content)
    }
    return parseTxt(content)
  }
}

// ─── CSV Parser ────────────────────────────────────────────────────────────

function parseCsv(content: string): { leads: ParsedLead[]; skipped: number; errors: string[] } {
  const leads: ParsedLead[] = []
  const errors: string[] = []
  let skipped = 0

  const result = Papa.parse(content, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase(),
  })

  for (let i = 0; i < result.data.length; i++) {
    const row = result.data[i] as Record<string, string>

    // Flexible email column detection
    const email = findEmailValue(row)

    if (!email) {
      skipped++
      continue
    }

    if (!isValidEmail(email)) {
      errors.push(`Row ${i + 2}: Invalid email "${email}"`)
      skipped++
      continue
    }

    const subject = row['subject'] || row['Subject'] || row['SUBJECT'] || ''
    const body =
      row['body'] || row['Body'] || row['BODY'] || row['message'] || row['Message'] || ''

    leads.push({
      email: email.trim().toLowerCase(),
      subject: subject.trim() || undefined,
      body: body.trim() || undefined,
    })
  }

  return { leads, skipped, errors }
}

// ─── JSON Parser ───────────────────────────────────────────────────────────

function parseJson(content: string): { leads: ParsedLead[]; skipped: number; errors: string[] } {
  const leads: ParsedLead[] = []
  const errors: string[] = []
  let skipped = 0

  try {
    const parsed = JSON.parse(content)
    const items: unknown[] = Array.isArray(parsed) ? parsed : [parsed]

    for (let i = 0; i < items.length; i++) {
      const item = items[i] as Record<string, string>

      if (typeof item !== 'object' || item === null) {
        skipped++
        continue
      }

      const email = findEmailValue(item)

      if (!email) {
        skipped++
        continue
      }

      if (!isValidEmail(email)) {
        errors.push(`Item ${i + 1}: Invalid email "${email}"`)
        skipped++
        continue
      }

      const subject = item['subject'] || item['Subject'] || item['SUBJECT'] || ''
      const body = item['body'] || item['Body'] || item['BODY'] || item['message'] || ''

      leads.push({
        email: email.trim().toLowerCase(),
        subject: subject?.trim() || undefined,
        body: body?.trim() || undefined,
      })
    }
  } catch (err) {
    errors.push(`JSON parse error: ${(err as Error).message}`)
  }

  return { leads, skipped, errors }
}

// ─── TXT Parser ────────────────────────────────────────────────────────────

function parseTxt(content: string): { leads: ParsedLead[]; skipped: number; errors: string[] } {
  const leads: ParsedLead[] = []
  const errors: string[] = []
  let skipped = 0

  // Split by newlines, then try to detect inline CSV format per line
  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0)

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    if (!line || line.startsWith('#') || line.startsWith('//')) continue

    // Try to extract email from anywhere in the line
    const emailMatch = line.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/)
    if (!emailMatch) {
      skipped++
      continue
    }

    const email = emailMatch[0].toLowerCase()

    if (!isValidEmail(email)) {
      errors.push(`Line ${i + 1}: Invalid email "${email}"`)
      skipped++
      continue
    }

    // Try to parse as comma-separated: email,subject,body
    const parts = line.split(',').map((p) => p.trim())
    const emailIdx = parts.findIndex((p) => p.toLowerCase().includes('@'))

    let subject: string | undefined
    let body: string | undefined

    if (emailIdx !== -1 && parts.length > emailIdx + 1) {
      subject = parts[emailIdx + 1] || undefined
      body = parts.slice(emailIdx + 2).join(',').trim() || undefined
    }

    leads.push({ email, subject, body })
  }

  return { leads, skipped, errors }
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function findEmailValue(row: Record<string, string>): string | null {
  // Common email column names
  const emailKeys = ['email', 'email address', 'emailaddress', 'e-mail', 'mail', 'recipient', 'to']

  for (const key of Object.keys(row)) {
    if (emailKeys.includes(key.toLowerCase().trim())) {
      const val = row[key]?.trim()
      if (val) return val
    }
  }

  // Last resort: find any value that looks like an email
  for (const val of Object.values(row)) {
    if (typeof val === 'string' && isValidEmail(val.trim())) {
      return val.trim()
    }
  }

  return null
}

// ─── Duplicate Detection ───────────────────────────────────────────────────

export function deduplicateLeads(leads: ParsedLead[]): { unique: ParsedLead[]; duplicates: number } {
  const seen = new Set<string>()
  const unique: ParsedLead[] = []
  let duplicates = 0

  for (const lead of leads) {
    const key = lead.email.toLowerCase()
    if (seen.has(key)) {
      duplicates++
    } else {
      seen.add(key)
      unique.push(lead)
    }
  }

  return { unique, duplicates }
}
