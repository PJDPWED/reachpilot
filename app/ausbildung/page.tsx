'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  Sparkles,
  Search,
  CheckSquare,
  Square,
  ExternalLink,
  Rocket,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Mail,
  Building2,
  MapPin,
  Phone,
} from 'lucide-react'
import type { AusbildungLead, AusbildungSearchResult } from '@/app/api/ausbildung/route'

// ─── Query Examples ────────────────────────────────────────────────────────────

const EXAMPLE_QUERIES = [
  '50 IT Ausbildung München',
  '30 Fachinformatiker Ausbildung Berlin',
  '20 Kaufmann Ausbildung Frankfurt',
  '40 Elektrotechnik Ausbildung Hamburg',
  '25 Mechatronik Ausbildung Köln',
]

// ─── Confidence Badge ──────────────────────────────────────────────────────────

function ConfidenceBadge({ level }: { level: 'high' | 'medium' | 'low' }) {
  const config = {
    high:   { label: 'High confidence', color: '#10b981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.30)' },
    medium: { label: 'Medium',          color: '#EAB308', bg: 'rgba(234,179,8,0.12)',  border: 'rgba(234,179,8,0.30)'  },
    low:    { label: 'Low',             color: '#f97316', bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.30)' },
  }
  const c = config[level]
  return (
    <span
      className="badge"
      style={{ background: c.bg, borderColor: c.border, color: c.color, fontSize: '10px' }}
    >
      {c.label}
    </span>
  )
}

// ─── Lead Row ──────────────────────────────────────────────────────────────────

function LeadRow({
  lead,
  selected,
  onToggle,
}: {
  lead: AusbildungLead
  selected: boolean
  onToggle: () => void
}) {
  const [emailOpen, setEmailOpen] = useState(false)

  return (
    <div
      className="rounded-xl overflow-hidden transition-all duration-150"
      style={{
        background: selected ? 'rgba(220,38,38,0.07)' : 'rgba(255,255,255,0.02)',
        border: `1px solid ${selected ? 'rgba(220,38,38,0.25)' : 'rgba(255,255,255,0.07)'}`,
      }}
    >
      {/* Main row */}
      <div className="flex items-start gap-3 p-4">
        {/* Select checkbox */}
        <button
          onClick={onToggle}
          className="mt-0.5 shrink-0 transition-colors"
          style={{ color: selected ? '#EF4444' : 'rgba(255,255,255,0.25)' }}
        >
          {selected
            ? <CheckSquare size={17} />
            : <Square size={17} />
          }
        </button>

        {/* Company info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span
                  style={{
                    fontFamily: 'var(--font-geist-sans)',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#fff',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {lead.company}
                </span>
                <ConfidenceBadge level={lead.confidence} />
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <span className="flex items-center gap-1" style={{ fontFamily: 'var(--font-geist-sans)', fontSize: '12.5px', color: 'rgba(255,255,255,0.45)' }}>
                  <Building2 size={11} />
                  {lead.position}
                </span>
                <span className="flex items-center gap-1" style={{ fontFamily: 'var(--font-geist-sans)', fontSize: '12.5px', color: 'rgba(255,255,255,0.45)' }}>
                  <MapPin size={11} />
                  {lead.city}
                </span>
                {lead.phone && (
                  <span className="flex items-center gap-1" style={{ fontFamily: 'var(--font-geist-mono)', fontSize: '11.5px', color: 'rgba(255,255,255,0.35)' }}>
                    <Phone size={11} />
                    {lead.phone}
                  </span>
                )}
              </div>

              {lead.description && (
                <p className="mt-1.5" style={{ fontFamily: 'var(--font-geist-sans)', fontSize: '12px', lineHeight: '1.5', color: 'rgba(255,255,255,0.35)' }}>
                  {lead.description}
                </p>
              )}
            </div>

            {/* Right: email + links */}
            <div className="flex items-center gap-2 shrink-0">
              {lead.sourceUrl && (
                <a
                  href={lead.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-ghost btn-xs"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink size={11} />
                  Source
                </a>
              )}
              {lead.website && (
                <a
                  href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-ghost btn-xs"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink size={11} />
                  Website
                </a>
              )}
            </div>
          </div>

          {/* Email address */}
          <div
            className="mt-2 flex items-center gap-2 px-2.5 py-1.5 rounded-lg"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', width: 'fit-content' }}
          >
            <Mail size={11} style={{ color: 'rgba(255,255,255,0.30)' }} />
            <span style={{ fontFamily: 'var(--font-geist-mono)', fontSize: '11.5px', color: 'rgba(255,255,255,0.55)' }}>
              {lead.email}
            </span>
          </div>
        </div>
      </div>

      {/* Email preview toggle */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <button
          className="w-full flex items-center justify-between px-4 py-2 transition-colors hover:bg-white/[0.02]"
          onClick={() => setEmailOpen((v) => !v)}
        >
          <span style={{ fontFamily: 'var(--font-geist-sans)', fontSize: '12px', color: 'rgba(255,255,255,0.30)' }}>
            Preview generated email
          </span>
          {emailOpen
            ? <ChevronUp size={12} style={{ color: 'rgba(255,255,255,0.25)' }} />
            : <ChevronDown size={12} style={{ color: 'rgba(255,255,255,0.25)' }} />
          }
        </button>

        <AnimatePresence>
          {emailOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.20, ease: [0.16, 1, 0.3, 1] }}
              style={{ overflow: 'hidden' }}
            >
              <div className="px-4 pb-4" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                <div
                  className="mt-3 p-3 rounded-lg"
                  style={{ background: 'rgba(0,0,0,0.40)', border: '1px solid rgba(255,255,255,0.07)' }}
                >
                  <div className="mb-2">
                    <span style={{ fontFamily: 'var(--font-geist-mono)', fontSize: '10px', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      Betreff:
                    </span>
                    <span style={{ fontFamily: 'var(--font-geist-sans)', fontSize: '12.5px', color: 'rgba(255,255,255,0.70)', marginLeft: '8px', fontWeight: 500 }}>
                      {lead.emailSubject}
                    </span>
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-geist-sans)',
                      fontSize: '12.5px',
                      lineHeight: '1.7',
                      color: 'rgba(255,255,255,0.50)',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {lead.emailBody}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function AusbildungAIPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [query, setQuery]           = useState('')
  const [loading, setLoading]       = useState(false)
  const [result, setResult]         = useState<AusbildungSearchResult | null>(null)
  const [selected, setSelected]     = useState<Set<string>>(new Set())
  const [deploying, setDeploying]   = useState(false)

  if (status === 'unauthenticated') {
    router.push('/auth/signin')
    return null
  }

  const handleSearch = async () => {
    if (!query.trim()) return
    setLoading(true)
    setResult(null)
    setSelected(new Set())

    try {
      const res = await fetch('/api/ausbildung', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Search failed')
      setResult(data.result)
      toast.success(`Found ${data.result.leads.length} leads`)
    } catch (err) {
      toast.error((err as Error).message || 'Search failed')
    } finally {
      setLoading(false)
    }
  }

  const toggleLead = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (!result) return
    if (selected.size === result.leads.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(result.leads.map((l) => l.id)))
    }
  }

  const handleDeploy = async () => {
    if (!result || selected.size === 0) return
    setDeploying(true)

    const leadsToAdd = result.leads.filter((l) => selected.has(l.id))

    try {
      // Build CSV-style payload for the existing upload/campaign system
      const csvRows = leadsToAdd.map((l) =>
        [l.email, l.emailSubject, l.emailBody.replace(/\n/g, ' ')].join(',')
      )
      const csvContent = ['email,subject,body', ...csvRows].join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const file = new File([blob], `ausbildung-leads-${Date.now()}.csv`, { type: 'text/csv' })

      const form = new FormData()
      form.append('file', file)

      const res = await fetch('/api/leads/upload', { method: 'POST', body: form })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'Failed to add leads to campaign')
      }

      toast.success(`${leadsToAdd.length} leads added to campaign queue`)
      router.push('/campaigns')
    } catch (err) {
      toast.error((err as Error).message || 'Deploy failed')
    } finally {
      setDeploying(false)
    }
  }

  const allSelected = result ? selected.size === result.leads.length : false
  const noneSelected = selected.size === 0

  return (
    <div className="min-h-screen" style={{ paddingLeft: '220px' }}>
      <div className="max-w-4xl mx-auto px-6 py-10">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-3">
            <div
              className="flex items-center justify-center w-9 h-9 rounded-xl"
              style={{ background: 'rgba(234,179,8,0.12)', border: '1px solid rgba(234,179,8,0.25)' }}
            >
              <Sparkles size={18} style={{ color: '#EAB308' }} />
            </div>
            <div>
              <h1 style={{ fontFamily: 'var(--font-geist-sans)', fontSize: '22px', fontWeight: 650, letterSpacing: '-0.035em', color: '#fff', lineHeight: 1 }}>
                Ausbildung AI
              </h1>
              <p className="mt-0.5" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', lineHeight: 1 }}>
                Real-time AI lead search · Review → Deploy workflow
              </p>
            </div>
          </div>
        </motion.div>

        {/* ── Search Input ───────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="glass-card p-5 mb-5"
        >
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search
                size={15}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'rgba(255,255,255,0.25)',
                  pointerEvents: 'none',
                }}
              />
              <input
                className="input"
                style={{ paddingLeft: '36px', height: '44px', fontSize: '14px' }}
                placeholder='e.g. "100 IT Ausbildung Hamburg" or "30 Mechatronik Berlin"'
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={!query.trim() || loading}
              className="btn-primary"
              style={{ height: '44px', minWidth: '120px' }}
            >
              {loading ? (
                <>
                  <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  Searching...
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  Search
                </>
              )}
            </button>
          </div>

          {/* Example chips */}
          <div className="flex items-center gap-1.5 flex-wrap mt-3">
            <span style={{ fontFamily: 'var(--font-geist-mono)', fontSize: '10px', color: 'rgba(255,255,255,0.20)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Try:
            </span>
            {EXAMPLE_QUERIES.map((q) => (
              <button
                key={q}
                onClick={() => setQuery(q)}
                className="px-2.5 py-1 rounded-md transition-all duration-100"
                style={{
                  fontFamily: 'var(--font-geist-mono)',
                  fontSize: '11px',
                  color: 'rgba(255,255,255,0.38)',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                {q}
              </button>
            ))}
          </div>
        </motion.div>

        {/* ── Loading State ──────────────────────────────────────────────── */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="glass-card p-10 flex flex-col items-center gap-4 mb-5"
            >
              <div
                className="flex items-center justify-center w-14 h-14 rounded-2xl"
                style={{ background: 'rgba(234,179,8,0.10)', border: '1px solid rgba(234,179,8,0.20)' }}
              >
                <Sparkles size={24} style={{ color: '#EAB308' }} className="animate-pulse-glow" />
              </div>
              <div className="text-center">
                <p style={{ fontFamily: 'var(--font-geist-sans)', fontSize: '14px', fontWeight: 500, color: '#fff', marginBottom: '4px' }}>
                  Gemini is searching the web...
                </p>
                <p style={{ fontFamily: 'var(--font-geist-sans)', fontSize: '12.5px', color: 'rgba(255,255,255,0.35)' }}>
                  Finding companies, extracting contact info, and writing emails
                </p>
              </div>
              {/* Progress shimmer */}
              <div className="w-64 h-1 shimmer rounded-full" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Results ────────────────────────────────────────────────────── */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Search notes / AI disclaimer */}
              {result.searchNotes && (
                <div
                  className="flex items-start gap-3 p-4 rounded-xl mb-4"
                  style={{
                    background: 'rgba(59,130,246,0.07)',
                    border: '1px solid rgba(59,130,246,0.18)',
                  }}
                >
                  <AlertTriangle size={14} style={{ color: '#60a5fa', flexShrink: 0, marginTop: '1px' }} />
                  <p style={{ fontFamily: 'var(--font-geist-sans)', fontSize: '12.5px', lineHeight: '1.6', color: 'rgba(255,255,255,0.50)' }}>
                    <strong style={{ color: '#93c5fd' }}>AI Note:</strong> {result.searchNotes}
                  </p>
                </div>
              )}

              {/* Controls bar */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={toggleAll}
                    className="btn-secondary btn-sm"
                  >
                    {allSelected ? <CheckSquare size={13} /> : <Square size={13} />}
                    {allSelected ? 'Deselect all' : 'Select all'}
                  </button>
                  <span style={{ fontFamily: 'var(--font-geist-mono)', fontSize: '12px', color: 'rgba(255,255,255,0.30)' }}>
                    {selected.size} / {result.leads.length} selected
                  </span>
                </div>

                {/* Deploy button */}
                <button
                  onClick={handleDeploy}
                  disabled={noneSelected || deploying}
                  className="btn-primary"
                >
                  {deploying ? (
                    <>
                      <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                        <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                      </svg>
                      Deploying...
                    </>
                  ) : (
                    <>
                      <Rocket size={13} />
                      Deploy {selected.size > 0 ? `${selected.size} Leads` : 'Selected'}
                    </>
                  )}
                </button>
              </div>

              {/* Lead cards */}
              <div className="space-y-2">
                {result.leads.map((lead, i) => (
                  <motion.div
                    key={lead.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: i * 0.03 }}
                  >
                    <LeadRow
                      lead={lead}
                      selected={selected.has(lead.id)}
                      onToggle={() => toggleLead(lead.id)}
                    />
                  </motion.div>
                ))}
              </div>

              {/* Bottom deploy CTA */}
              {result.leads.length > 5 && (
                <div className="mt-5 flex justify-end">
                  <button
                    onClick={handleDeploy}
                    disabled={noneSelected || deploying}
                    className="btn-primary btn-lg"
                  >
                    <Rocket size={15} />
                    Deploy {selected.size > 0 ? `${selected.size}` : ''} Selected to Campaign
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
