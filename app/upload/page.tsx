'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useRouter } from 'next/navigation'
import { AppShell } from '@/components/layout/AppShell'
import { FadeIn } from '@/components/animations/FadeIn'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload, FileText, CheckCircle2, AlertCircle,
  Sparkles, ChevronRight, X, Table, ArrowRight,
} from 'lucide-react'
import { cn } from '@/utils/helpers'
import toast from 'react-hot-toast'

interface ParsedLead {
  email: string
  subject?: string
  body?: string
}

interface UploadResult {
  totalLeads: number
  skipped: number
  duplicates: number
  errors: string[]
  leads: ParsedLead[]
  campaign?: { id: string; name: string }
}

const STEPS = ['Upload', 'Preview', 'Done'] as const
type Step = 'upload' | 'preview' | 'done'

export default function UploadPage() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [campaignName, setCampaignName] = useState('')
  const [generateAI, setGenerateAI] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<UploadResult | null>(null)
  const [step, setStep] = useState<Step>('upload')

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0])
      setResult(null)
      setStep('upload')
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'text/plain': ['.txt'],
      'application/json': ['.json'],
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024,
    onDropRejected: () => toast.error('Invalid file. Please use CSV, TXT, or JSON (max 5MB).'),
  })

  const handlePreview = async () => {
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('generateAI', 'false')
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const json = await res.json()
      if (!json.success) { toast.error(json.error || 'Failed to parse file'); return }
      setResult(json.data)
      setStep('preview')
    } catch {
      toast.error('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleCreateCampaign = async () => {
    if (!file || !campaignName.trim()) { toast.error('Please enter a campaign name'); return }
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('campaignName', campaignName.trim())
      formData.append('generateAI', String(generateAI))
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const json = await res.json()
      if (!json.success) { toast.error(json.error || 'Failed to create campaign'); return }
      setResult(json.data)
      setStep('done')
      toast.success(`Campaign created with ${json.data.totalLeads} leads!`)
    } catch {
      toast.error('Failed to create campaign')
    } finally {
      setUploading(false)
    }
  }

  const reset = () => { setFile(null); setResult(null); setCampaignName(''); setStep('upload') }

  const stepIndex = { upload: 0, preview: 1, done: 2 }[step]

  return (
    <AppShell>
      <div className="max-w-3xl">
        <FadeIn direction="down" duration={0.5}>
          <div className="mb-8">
            <h1 className="font-heading text-3xl text-white mb-1">Upload Leads</h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Upload a CSV, TXT, or JSON file to create a new outreach campaign
            </p>
          </div>
        </FadeIn>

        {/* Step indicator */}
        <FadeIn delay={0.1}>
          <div className="flex items-center gap-0 mb-8">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center">
                <div className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300"
                    style={{
                      background: i < stepIndex ? 'rgba(52,211,153,0.15)' : i === stepIndex ? '#ffffff' : 'rgba(255,255,255,0.06)',
                      border: i < stepIndex ? '1px solid rgba(52,211,153,0.4)' : i === stepIndex ? 'none' : '1px solid rgba(255,255,255,0.1)',
                      color: i < stepIndex ? '#34d399' : i === stepIndex ? '#000000' : 'var(--text-muted)',
                      boxShadow: i === stepIndex ? '0 4px 12px rgba(255,255,255,0.20)' : 'none',
                    }}
                  >
                    {i < stepIndex ? <CheckCircle2 size={13} /> : i + 1}
                  </div>
                  <span
                    className="text-sm font-medium transition-colors"
                    style={{ color: i === stepIndex ? '#fff' : i < stepIndex ? '#34d399' : 'var(--text-muted)' }}
                  >
                    {s}
                  </span>
                </div>
                {i < 2 && (
                  <div
                    className="w-10 h-px mx-3"
                    style={{ background: i < stepIndex ? 'rgba(52,211,153,0.4)' : 'rgba(255,255,255,0.08)' }}
                  />
                )}
              </div>
            ))}
          </div>
        </FadeIn>

        <AnimatePresence mode="wait">
          {/* STEP 1 — Upload */}
          {step === 'upload' && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ type: 'spring', stiffness: 200, damping: 25 }}
              className="space-y-4"
            >
              {/* Dropzone */}
              <div
                {...getRootProps()}
                className="relative rounded-2xl cursor-pointer transition-all duration-200 overflow-hidden"
                style={{
                  background: isDragActive
                    ? 'rgba(255,255,255,0.04)'
                    : file
                    ? 'rgba(52,211,153,0.05)'
                    : 'rgba(255,255,255,0.03)',
                  border: `2px dashed ${isDragActive ? 'rgba(255,255,255,0.35)' : file ? 'rgba(52,211,153,0.4)' : 'rgba(255,255,255,0.10)'}`,
                  padding: '48px 32px',
                }}
              >
                <input {...getInputProps()} />

                {/* Hover highlight */}
                <div
                  className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity"
                  style={{ background: 'rgba(255,255,255,0.02)', pointerEvents: 'none' }}
                />

                <div className="flex flex-col items-center gap-4 relative z-10">
                  <AnimatePresence mode="wait">
                    {file ? (
                      <motion.div
                        key="file"
                        className="flex flex-col items-center gap-3"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                      >
                        <div
                          className="w-14 h-14 rounded-2xl flex items-center justify-center"
                          style={{ background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.25)' }}
                        >
                          <FileText size={24} style={{ color: '#34d399' }} />
                        </div>
                        <div className="text-center">
                          <p className="font-semibold text-white">{file.name}</p>
                          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                            {(file.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); setFile(null) }}
                          className="flex items-center gap-1 text-xs transition-colors"
                          style={{ color: 'var(--text-muted)' }}
                          onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = '#f87171'}
                          onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)'}
                        >
                          <X size={11} /> Remove file
                        </button>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="empty"
                        className="flex flex-col items-center gap-3"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <motion.div
                          className="w-14 h-14 rounded-2xl flex items-center justify-center"
                          style={{
                            background: isDragActive ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.05)',
                            border: `1px solid ${isDragActive ? 'rgba(255,255,255,0.20)' : 'rgba(255,255,255,0.08)'}`,
                          }}
                          animate={isDragActive ? { scale: [1, 1.05, 1] } : {}}
                          transition={{ duration: 0.5, repeat: Infinity }}
                        >
                          <Upload size={22} style={{ color: isDragActive ? 'rgba(255,255,255,0.70)' : 'var(--text-muted)' }} />
                        </motion.div>
                        <div className="text-center">
                          <p className="font-medium text-white">
                            {isDragActive ? 'Release to upload' : 'Drop your file here'}
                          </p>
                          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                            or click to browse · CSV, TXT, JSON · max 5MB
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Format hint */}
              <div
                className="p-4 rounded-2xl"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: 'rgba(255,255,255,0.06)' }}
                  >
                    <Table size={13} style={{ color: 'rgba(255,255,255,0.70)' }} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white mb-2">Expected format</p>
                    <div className="space-y-1.5 text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                      <div
                        className="px-2.5 py-1.5 rounded-lg"
                        style={{ background: 'rgba(255,255,255,0.04)' }}
                      >
                        email,subject,body
                      </div>
                      <div
                        className="px-2.5 py-1.5 rounded-lg"
                        style={{ background: 'rgba(255,255,255,0.04)' }}
                      >
                        john@company.com,Hello John,Your message...
                      </div>
                    </div>
                    <p className="text-xs mt-2 font-sans" style={{ color: 'var(--text-muted)' }}>
                      Only <code className="text-red-400 font-mono">email</code> is required —{' '}
                      <span style={{ color: 'rgba(255,255,255,0.70)' }}>AI generates subject &amp; body automatically</span>
                    </p>
                  </div>
                </div>
              </div>

              <motion.button
                onClick={handlePreview}
                disabled={!file || uploading}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold"
                style={{
                  background: '#ffffff',
                  color: '#000000',
                  boxShadow: '0 4px 20px rgba(255,255,255,0.12)',
                  opacity: !file || uploading ? 0.5 : 1,
                  cursor: !file || uploading ? 'not-allowed' : 'pointer',
                }}
                whileHover={file && !uploading ? { scale: 1.01 } : {}}
                whileTap={file && !uploading ? { scale: 0.98 } : {}}
              >
                {uploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    Parsing file...
                  </>
                ) : (
                  <>
                    Preview & Continue
                    <ChevronRight size={15} />
                  </>
                )}
              </motion.button>
            </motion.div>
          )}

          {/* STEP 2 — Preview */}
          {step === 'preview' && result && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ type: 'spring', stiffness: 200, damping: 25 }}
              className="space-y-4"
            >
              {/* Parse summary */}
              <div
                className="grid grid-cols-3 gap-px rounded-2xl overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.06)' }}
              >
                {[
                  { label: 'Valid leads',        value: result.totalLeads, color: '#34d399' },
                  { label: 'Duplicates removed', value: result.duplicates,  color: '#fbbf24' },
                  { label: 'Skipped rows',       value: result.skipped,     color: '#94a3b8' },
                ].map(({ label, value, color }) => (
                  <div
                    key={label}
                    className="text-center py-5"
                    style={{ background: 'rgba(10,10,20,0.8)' }}
                  >
                    <div className="font-heading text-3xl mb-1" style={{ color }}>{value}</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</div>
                  </div>
                ))}
              </div>

              {/* Warnings */}
              {result.errors.length > 0 && (
                <div
                  className="flex items-start gap-3 p-4 rounded-2xl"
                  style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)' }}
                >
                  <AlertCircle size={15} style={{ color: '#fbbf24' }} className="shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#fbbf24' }}>Parse warnings</p>
                    <ul className="mt-1 space-y-0.5">
                      {result.errors.slice(0, 5).map((err, i) => (
                        <li key={i} className="text-xs" style={{ color: 'rgba(251,191,36,0.7)' }}>{err}</li>
                      ))}
                      {result.errors.length > 5 && (
                        <li className="text-xs" style={{ color: 'rgba(251,191,36,0.5)' }}>
                          + {result.errors.length - 5} more
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              )}

              {/* Leads preview table */}
              <div
                className="rounded-2xl overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <div
                  className="flex items-center justify-between px-4 py-3"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <p className="text-sm font-medium text-white">Preview</p>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{result.totalLeads} total</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        {['Email', 'Subject', 'Body'].map((h) => (
                          <th key={h} className="text-left px-4 py-2.5 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.leads.slice(0, 10).map((lead, i) => (
                        <tr
                          key={i}
                          style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                          onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(255,255,255,0.02)'}
                          onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}
                        >
                          <td className="px-4 py-2.5 text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>{lead.email}</td>
                          <td className="px-4 py-2.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
                            {lead.subject ? (
                              lead.subject.slice(0, 35) + (lead.subject.length > 35 ? '…' : '')
                            ) : (
                              <span className="flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.70)' }}>
                                <Sparkles size={10} /> AI will generate
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                            {lead.body ? (
                              lead.body.slice(0, 40) + (lead.body.length > 40 ? '…' : '')
                            ) : (
                              <span className="flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.70)' }}>
                                <Sparkles size={10} /> AI will generate
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {result.totalLeads > 10 && (
                    <p className="text-xs text-center py-3" style={{ color: 'var(--text-muted)' }}>
                      + {result.totalLeads - 10} more leads
                    </p>
                  )}
                </div>
              </div>

              {/* Campaign config */}
              <div
                className="p-5 rounded-2xl space-y-4"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <h3 className="text-sm font-semibold text-white">Campaign Settings</h3>

                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    Campaign name
                  </label>
                  <input
                    type="text"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    placeholder="e.g. Q1 Local Business Outreach"
                    className="input"
                  />
                </div>

                {/* AI toggle */}
                <div
                  className="flex items-center justify-between p-4 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}
                >
                  <div className="flex items-start gap-2.5">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: 'rgba(255,255,255,0.08)' }}
                    >
                      <Sparkles size={13} style={{ color: 'rgba(255,255,255,0.70)' }} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">AI Email Generation</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        Gemini generates subject + body for leads missing them
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setGenerateAI(!generateAI)}
                    className="relative flex-shrink-0 w-10 h-5.5 rounded-full transition-colors duration-200"
                    style={{
                      background: generateAI ? '#ffffff' : 'rgba(255,255,255,0.12)',
                      width: '40px',
                      height: '22px',
                    }}
                  >
                    <motion.span
                      className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm"
                      animate={{ x: generateAI ? 20 : 2 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={reset}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  Back
                </button>
                <motion.button
                  onClick={handleCreateCampaign}
                  disabled={!campaignName.trim() || uploading}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold"
                  style={{
                    background: '#ffffff',
                    color: '#000000',
                    boxShadow: '0 4px 20px rgba(255,255,255,0.12)',
                    opacity: !campaignName.trim() || uploading ? 0.5 : 1,
                    cursor: !campaignName.trim() || uploading ? 'not-allowed' : 'pointer',
                  }}
                  whileHover={campaignName.trim() && !uploading ? { scale: 1.01 } : {}}
                  whileTap={campaignName.trim() && !uploading ? { scale: 0.98 } : {}}
                >
                  {uploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      Creating campaign...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={15} />
                      Create Campaign with {result.totalLeads} Leads
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* STEP 3 — Done */}
          {step === 'done' && result?.campaign && (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 25 }}
              className="flex flex-col items-center py-16 text-center"
            >
              {/* Success icon */}
              <motion.div
                className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6 relative"
                style={{
                  background: 'rgba(52,211,153,0.12)',
                  border: '1px solid rgba(52,211,153,0.3)',
                  boxShadow: '0 0 40px rgba(52,211,153,0.2)',
                }}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, delay: 0.3 }}
                >
                  <CheckCircle2 size={36} style={{ color: '#34d399' }} />
                </motion.div>
              </motion.div>

              <motion.h2
                className="font-heading text-3xl text-white mb-3"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                Campaign Created!
              </motion.h2>

              <motion.p
                className="text-sm mb-10 max-w-sm leading-relaxed"
                style={{ color: 'var(--text-secondary)' }}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <strong className="text-white">{result.totalLeads}</strong> leads are ready to send.
                {generateAI && ' AI has generated personalised emails for all leads.'}
              </motion.p>

              <motion.div
                className="flex flex-col sm:flex-row gap-3"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <button
                  onClick={() => router.push(`/campaigns/${result.campaign!.id}`)}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold"
                  style={{
                    background: '#ffffff',
                    color: '#000000',
                    boxShadow: '0 4px 20px rgba(255,255,255,0.12)',
                  }}
                >
                  View Campaign & Start Sending
                  <ArrowRight size={14} />
                </button>
                <button
                  onClick={reset}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  Upload Another File
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppShell>
  )
}
