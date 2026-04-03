import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// ─── Class Name Utility ────────────────────────────────────────────────────

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ─── Email Validation ──────────────────────────────────────────────────────

const EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim())
}

// ─── Random Delay ─────────────────────────────────────────────────────────

/** Returns a random delay in milliseconds between min and max minutes */
export function randomDelayMs(minMinutes = 8, maxMinutes = 10): number {
  const min = minMinutes * 60 * 1000
  const max = maxMinutes * 60 * 1000
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/** Returns a random delay in seconds between min and max minutes */
export function randomDelaySeconds(minMinutes = 8, maxMinutes = 10): number {
  return Math.floor(randomDelayMs(minMinutes, maxMinutes) / 1000)
}

/** Returns the Date object at which the next email should be sent */
export function nextSendAt(minMinutes = 8, maxMinutes = 10): Date {
  const delay = randomDelayMs(minMinutes, maxMinutes)
  return new Date(Date.now() + delay)
}

// ─── Domain Extraction ────────────────────────────────────────────────────

export function extractDomain(email: string): string {
  const parts = email.split('@')
  return parts.length === 2 ? parts[1] : ''
}

export function extractCompanyName(email: string): string {
  const domain = extractDomain(email)
  if (!domain) return 'your company'
  // strip TLD (.com, .io, .co, .net, etc.)
  const withoutTld = domain.replace(/\.[^.]+$/, '')
  // remove www.
  const clean = withoutTld.replace(/^www\./, '')
  // capitalize first letter
  return clean.charAt(0).toUpperCase() + clean.slice(1)
}

// ─── Formatting ────────────────────────────────────────────────────────────

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatRelative(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = Date.now()
  const diff = now - d.getTime()

  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (minutes > 0) return `${minutes}m ago`
  return 'just now'
}

// ─── Status Colors ─────────────────────────────────────────────────────────

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    pending: 'bg-gray-100 text-gray-600',
    queued: 'bg-blue-100 text-blue-600',
    sending: 'bg-yellow-100 text-yellow-600',
    sent: 'bg-green-100 text-green-600',
    failed: 'bg-red-100 text-red-600',
    replied: 'bg-red-100 text-red-600',
    running: 'bg-blue-100 text-blue-600',
    paused: 'bg-yellow-100 text-yellow-600',
    completed: 'bg-green-100 text-green-600',
    YES: 'bg-green-100 text-green-600',
    NO: 'bg-red-100 text-red-600',
    NEUTRAL: 'bg-gray-100 text-gray-600',
  }
  return map[status] ?? 'bg-gray-100 text-gray-600'
}

// ─── Truncation ────────────────────────────────────────────────────────────

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength - 3) + '...'
}

// ─── Cron Auth ────────────────────────────────────────────────────────────

export function isCronAuthorized(request: Request): boolean {
  const authHeader = request.headers.get('authorization')
  const secret = process.env.CRON_SECRET
  if (!secret) return true // allow in dev if not set
  return authHeader === `Bearer ${secret}`
}
