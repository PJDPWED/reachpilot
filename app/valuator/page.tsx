'use client'

import { useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import {
  FileSearch,
  Upload,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Download,
  RotateCcw,
  Star,
  Zap,
  Shield,
  Target,
} from 'lucide-react'
import type { CVAnalysis } from '@/app/api/valuator/route'

// ─── Score Ring ───────────────────────────────────────────────────────────────

function ScoreRing({ score, size = 96 }: { score: number; size?: number }) {
  const r = (size - 10) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ

  const color =
    score >= 80 ? '#10b981' :
    score >= 60 ? '#EAB308' :
    score >= 40 ? '#f97316' :
    '#EF4444'

  const grade =
    score >= 90 ? 'A' :
    score >= 80 ? 'A-' :
    score >= 70 ? 'B' :
    score >= 60 ? 'C' :
    score >= 50 ? 'D' : 'F'

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Track */}
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={6}
        />
        {/* Progress */}
        <motion.circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={color} strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          style={{ filter: `drop-shadow(0 0 6px ${color}88)` }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <motion.span
          className="font-bold leading-none"
          style={{
            fontFamily: 'var(--font-geist-mono)',
            fontSize: size > 80 ? '22px' : '16px',
            color,
            letterSpacing: '-0.04em',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          {score}
        </motion.span>
        <span
          style={{
            fontFamily: 'var(--font-geist-mono)',
            fontSize: '11px',
            color: 'rgba(255,255,255,0.35)',
          }}
        >
          {grade}
        </span>
      </div>
    </div>
  )
}

// ─── Section Score Bar ─────────────────────────────────────────────────────────

function SectionScore({
  name,
  score,
  feedback,
  priority,
}: {
  name: string
  score: number
  feedback: string
  priority: string
}) {
  const [open, setOpen] = useState(false)

  const priorityColors: Record<string, string> = {
    critical: '#EF4444',
    high:     '#f97316',
    medium:   '#EAB308',
    low:      '#10b981',
  }
  const color = priorityColors[priority] || '#6b7280'
  const pct = `${score}%`

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      <button
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
        onClick={() => setOpen((v) => !v)}
      >
        {/* Name + priority */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span
              style={{
                fontFamily: 'var(--font-geist-sans)',
                fontSize: '13px',
                fontWeight: 500,
                color: '#fff',
              }}
            >
              {name}
            </span>
            <span
              className="badge"
              style={{
                background: `${color}18`,
                borderColor: `${color}40`,
                color,
                fontSize: '10px',
                padding: '2px 6px',
              }}
            >
              {priority}
            </span>
          </div>
          {/* Bar */}
          <div className="progress-track" style={{ height: '3px' }}>
            <motion.div
              className="progress-fill-red"
              style={{ background: color, width: pct }}
              initial={{ width: '0%' }}
              animate={{ width: pct }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            />
          </div>
        </div>

        {/* Score + chevron */}
        <div className="flex items-center gap-2 shrink-0">
          <span
            style={{
              fontFamily: 'var(--font-geist-mono)',
              fontSize: '13px',
              fontWeight: 600,
              color,
            }}
          >
            {score}
          </span>
          {open
            ? <ChevronUp size={13} style={{ color: 'rgba(255,255,255,0.30)' }} />
            : <ChevronDown size={13} style={{ color: 'rgba(255,255,255,0.30)' }} />
          }
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div
              className="px-4 pb-3"
              style={{
                borderTop: '1px solid rgba(255,255,255,0.05)',
                paddingTop: '12px',
                fontFamily: 'var(--font-geist-sans)',
                fontSize: '13px',
                lineHeight: '1.6',
                color: 'rgba(255,255,255,0.55)',
              }}
            >
              {feedback}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function CVValuatorPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState<CVAnalysis | null>(null)
  const [activeTab, setActiveTab] = useState<'analysis' | 'rewrite'>('analysis')

  // Redirect if unauthenticated
  if (status === 'unauthenticated') {
    router.push('/auth/signin')
    return null
  }

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles[0]) {
      setFile(acceptedFiles[0])
      setAnalysis(null)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  })

  const handleAnalyze = async () => {
    if (!file) return
    setLoading(true)
    setAnalysis(null)

    try {
      const form = new FormData()
      form.append('cv', file)

      const res = await fetch('/api/valuator', { method: 'POST', body: form })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Analysis failed')

      setAnalysis(data.analysis)
      toast.success('CV analysis complete')
    } catch (err) {
      toast.error((err as Error).message || 'Analysis failed')
    } finally {
      setLoading(false)
    }
  }

  const downloadRewrite = () => {
    if (!analysis) return
    const blob = new Blob([analysis.rewrittenCV], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'Lebenslauf_Optimiert.txt'
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Optimized CV downloaded')
  }

  return (
    <div className="min-h-screen" style={{ paddingLeft: '220px' }}>
      <div className="max-w-4xl mx-auto px-6 py-10">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-3">
            <div
              className="flex items-center justify-center w-9 h-9 rounded-xl"
              style={{
                background: 'rgba(220,38,38,0.12)',
                border: '1px solid rgba(220,38,38,0.25)',
              }}
            >
              <FileSearch size={18} style={{ color: '#EF4444' }} />
            </div>
            <div>
              <h1
                className="leading-none"
                style={{
                  fontFamily: 'var(--font-geist-sans)',
                  fontSize: '22px',
                  fontWeight: 650,
                  letterSpacing: '-0.035em',
                  color: '#fff',
                }}
              >
                CV Valuator
              </h1>
              <p
                className="mt-0.5 leading-none"
                style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)' }}
              >
                AI-powered German market CV analysis + optimized rewrite
              </p>
            </div>
          </div>
        </motion.div>

        {/* ── Upload Zone ────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="glass-card p-6 mb-5"
        >
          <div
            {...getRootProps()}
            className="rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-3 py-10 cursor-pointer transition-all duration-200"
            style={{
              borderColor: isDragActive
                ? 'rgba(220,38,38,0.60)'
                : file
                ? 'rgba(16,185,129,0.40)'
                : 'rgba(255,255,255,0.10)',
              background: isDragActive
                ? 'rgba(220,38,38,0.05)'
                : 'rgba(255,255,255,0.02)',
            }}
          >
            <input {...getInputProps()} />

            {file ? (
              <>
                <div
                  className="flex items-center justify-center w-12 h-12 rounded-xl"
                  style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.30)' }}
                >
                  <CheckCircle size={22} style={{ color: '#10b981' }} />
                </div>
                <div className="text-center">
                  <p style={{ fontFamily: 'var(--font-geist-sans)', fontSize: '14px', fontWeight: 500, color: '#fff' }}>
                    {file.name}
                  </p>
                  <p style={{ fontFamily: 'var(--font-geist-mono)', fontSize: '11px', color: 'rgba(255,255,255,0.30)', marginTop: '4px' }}>
                    {(file.size / 1024).toFixed(1)} KB · Click or drag to replace
                  </p>
                </div>
              </>
            ) : (
              <>
                <div
                  className="flex items-center justify-center w-12 h-12 rounded-xl"
                  style={{
                    background: isDragActive ? 'rgba(220,38,38,0.15)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${isDragActive ? 'rgba(220,38,38,0.35)' : 'rgba(255,255,255,0.08)'}`,
                  }}
                >
                  <Upload size={22} style={{ color: isDragActive ? '#EF4444' : 'rgba(255,255,255,0.30)' }} />
                </div>
                <div className="text-center">
                  <p style={{ fontFamily: 'var(--font-geist-sans)', fontSize: '14px', fontWeight: 500, color: '#fff' }}>
                    {isDragActive ? 'Drop your CV here' : 'Drop your CV or click to upload'}
                  </p>
                  <p style={{ fontFamily: 'var(--font-geist-mono)', fontSize: '11px', color: 'rgba(255,255,255,0.28)', marginTop: '4px' }}>
                    PDF · DOC · DOCX · TXT · Max 10MB
                  </p>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={handleAnalyze}
              disabled={!file || loading}
              className="btn-primary btn-lg flex-1"
            >
              {loading ? (
                <>
                  <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  Analyzing with Gemini AI...
                </>
              ) : (
                <>
                  <Zap size={15} />
                  Analyze CV
                </>
              )}
            </button>
            {(file || analysis) && (
              <button
                className="btn-ghost btn-lg"
                onClick={() => { setFile(null); setAnalysis(null) }}
              >
                <RotateCcw size={14} />
                Reset
              </button>
            )}
          </div>
        </motion.div>

        {/* ── Results ────────────────────────────────────────────────────── */}
        <AnimatePresence>
          {analysis && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Tab switcher */}
              <div
                className="flex gap-1 p-1 rounded-xl mb-5"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  width: 'fit-content',
                }}
              >
                {(['analysis', 'rewrite'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-150"
                    style={{
                      fontFamily: 'var(--font-geist-sans)',
                      fontSize: '13px',
                      background: activeTab === tab ? 'rgba(255,255,255,0.10)' : 'transparent',
                      color: activeTab === tab ? '#fff' : 'rgba(255,255,255,0.40)',
                      border: activeTab === tab ? '1px solid rgba(255,255,255,0.14)' : '1px solid transparent',
                    }}
                  >
                    {tab === 'analysis' ? '📊 Analysis' : '✨ Optimized CV'}
                  </button>
                ))}
              </div>

              {/* ── Analysis Tab ── */}
              {activeTab === 'analysis' && (
                <div className="space-y-5">
                  {/* Score overview */}
                  <div className="glass-card p-6">
                    <div className="flex items-start gap-6">
                      <ScoreRing score={analysis.overallScore} size={100} />

                      <div className="flex-1 min-w-0">
                        <p
                          className="mb-3"
                          style={{
                            fontFamily: 'var(--font-geist-sans)',
                            fontSize: '14px',
                            lineHeight: '1.6',
                            color: 'rgba(255,255,255,0.65)',
                          }}
                        >
                          {analysis.summary}
                        </p>

                        {/* Mini stats */}
                        <div className="grid grid-cols-3 gap-3">
                          {[
                            { label: 'German Market', value: `${analysis.germanMarketFit.score}%`, icon: Target, color: '#EF4444' },
                            { label: 'ATS Keywords', value: `${analysis.atsKeywords.present.length} found`, icon: Shield, color: '#EAB308' },
                            { label: 'Sections', value: `${analysis.sections.length} reviewed`, icon: Star, color: '#10b981' },
                          ].map(({ label, value, icon: Icon, color }) => (
                            <div
                              key={label}
                              className="rounded-lg p-3 flex items-center gap-2"
                              style={{
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.07)',
                              }}
                            >
                              <Icon size={14} style={{ color, flexShrink: 0 }} />
                              <div>
                                <div style={{ fontFamily: 'var(--font-geist-mono)', fontSize: '12px', fontWeight: 600, color: '#fff' }}>
                                  {value}
                                </div>
                                <div style={{ fontFamily: 'var(--font-geist-mono)', fontSize: '9.5px', color: 'rgba(255,255,255,0.28)', marginTop: '1px' }}>
                                  {label}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Strengths & Weaknesses */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="glass-card p-5">
                      <h3 className="section-label mb-3">Strengths</h3>
                      <ul className="space-y-2">
                        {analysis.strengths.map((s, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <CheckCircle size={13} style={{ color: '#10b981', flexShrink: 0, marginTop: '2px' }} />
                            <span style={{ fontFamily: 'var(--font-geist-sans)', fontSize: '13px', color: 'rgba(255,255,255,0.60)', lineHeight: '1.5' }}>
                              {s}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="glass-card p-5">
                      <h3 className="section-label mb-3">Weaknesses</h3>
                      <ul className="space-y-2">
                        {analysis.weaknesses.map((w, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <XCircle size={13} style={{ color: '#EF4444', flexShrink: 0, marginTop: '2px' }} />
                            <span style={{ fontFamily: 'var(--font-geist-sans)', fontSize: '13px', color: 'rgba(255,255,255,0.60)', lineHeight: '1.5' }}>
                              {w}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* German Market Fit */}
                  <div className="glass-card-gold p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="section-label" style={{ color: 'rgba(234,179,8,0.70)' }}>German Market Fit</h3>
                      <span style={{ fontFamily: 'var(--font-geist-mono)', fontSize: '20px', fontWeight: 700, color: '#FDE047', letterSpacing: '-0.04em' }}>
                        {analysis.germanMarketFit.score}%
                      </span>
                    </div>
                    <div className="progress-track mb-4">
                      <motion.div
                        className="progress-fill-gold"
                        initial={{ width: '0%' }}
                        animate={{ width: `${analysis.germanMarketFit.score}%` }}
                        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="section-label mb-2" style={{ color: 'rgba(16,185,129,0.60)' }}>Positives</p>
                        {analysis.germanMarketFit.positives.map((p, i) => (
                          <p key={i} style={{ fontFamily: 'var(--font-geist-sans)', fontSize: '12.5px', color: 'rgba(255,255,255,0.50)', lineHeight: '1.6' }}>
                            + {p}
                          </p>
                        ))}
                      </div>
                      <div>
                        <p className="section-label mb-2" style={{ color: 'rgba(239,68,68,0.60)' }}>Issues</p>
                        {analysis.germanMarketFit.issues.map((issue, i) => (
                          <p key={i} style={{ fontFamily: 'var(--font-geist-sans)', fontSize: '12.5px', color: 'rgba(255,255,255,0.50)', lineHeight: '1.6' }}>
                            − {issue}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Section-by-section scores */}
                  <div className="glass-card p-5">
                    <h3 className="section-label mb-4">Section Audit</h3>
                    <div className="space-y-2">
                      {analysis.sections.map((section, i) => (
                        <SectionScore key={i} {...section} />
                      ))}
                    </div>
                  </div>

                  {/* ATS Keywords */}
                  <div className="glass-card p-5">
                    <h3 className="section-label mb-4">ATS Keywords</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="section-label mb-2" style={{ color: 'rgba(16,185,129,0.60)' }}>Present</p>
                        <div className="flex flex-wrap gap-1.5">
                          {analysis.atsKeywords.present.map((k, i) => (
                            <span key={i} className="badge badge-green">{k}</span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="section-label mb-2" style={{ color: 'rgba(239,68,68,0.60)' }}>Missing</p>
                        <div className="flex flex-wrap gap-1.5">
                          {analysis.atsKeywords.missing.map((k, i) => (
                            <span key={i} className="badge badge-red">{k}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Rewrite Tab ── */}
              {activeTab === 'rewrite' && (
                <div className="space-y-5">
                  {/* What changed */}
                  <div className="glass-card-gold p-5">
                    <h3 className="section-label mb-3" style={{ color: 'rgba(234,179,8,0.60)' }}>
                      What the AI changed & why
                    </h3>
                    <div
                      style={{
                        fontFamily: 'var(--font-geist-sans)',
                        fontSize: '13px',
                        lineHeight: '1.7',
                        color: 'rgba(255,255,255,0.60)',
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {analysis.rewriteSummary}
                    </div>
                  </div>

                  {/* The CV */}
                  <div className="glass-card p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="section-label">Optimized Lebenslauf (German Standard)</h3>
                      <button onClick={downloadRewrite} className="btn-gold btn-sm">
                        <Download size={13} />
                        Download .txt
                      </button>
                    </div>
                    <div className="code-block" style={{ fontSize: '12px', lineHeight: '1.65', maxHeight: '600px', overflowY: 'auto' }}>
                      {analysis.rewrittenCV}
                    </div>
                  </div>

                  {/* Tip */}
                  <div
                    className="flex items-start gap-3 p-4 rounded-xl"
                    style={{
                      background: 'rgba(59,130,246,0.08)',
                      border: '1px solid rgba(59,130,246,0.20)',
                    }}
                  >
                    <AlertTriangle size={15} style={{ color: '#60a5fa', flexShrink: 0, marginTop: '1px' }} />
                    <p style={{ fontFamily: 'var(--font-geist-sans)', fontSize: '12.5px', lineHeight: '1.6', color: 'rgba(255,255,255,0.50)' }}>
                      <strong style={{ color: '#93c5fd' }}>Next step:</strong> Add a professional headshot (Bewerbungsfoto)
                      before submitting. German employers expect a photo on the Lebenslauf. Format in Word or use
                      Canva with the downloaded text.
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
