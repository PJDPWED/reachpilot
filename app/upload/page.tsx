'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useRouter } from 'next/navigation'
import { AppShell } from '@/components/layout/AppShell'
import { Spinner } from '@/components/ui/Spinner'
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ChevronRight,
  X,
  Table,
} from 'lucide-react'
import { cn, isValidEmail } from '@/utils/helpers'
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

export default function UploadPage() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [campaignName, setCampaignName] = useState('')
  const [generateAI, setGenerateAI] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<UploadResult | null>(null)
  const [step, setStep] = useState<'upload' | 'preview' | 'done'>('upload')

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

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      const json = await res.json()

      if (!json.success) {
        toast.error(json.error || 'Failed to parse file')
        return
      }

      setResult(json.data)
      setStep('preview')
    } catch {
      toast.error('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleCreateCampaign = async () => {
    if (!file || !campaignName.trim()) {
      toast.error('Please enter a campaign name')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('campaignName', campaignName.trim())
      formData.append('generateAI', String(generateAI))

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      const json = await res.json()

      if (!json.success) {
        toast.error(json.error || 'Failed to create campaign')
        return
      }

      setResult(json.data)
      setStep('done')
      toast.success(`Campaign created with ${json.data.totalLeads} leads!`)
    } catch {
      toast.error('Failed to create campaign')
    } finally {
      setUploading(false)
    }
  }

  const reset = () => {
    setFile(null)
    setResult(null)
    setCampaignName('')
    setStep('upload')
  }

  return (
    <AppShell>
      <div className="animate-slide-up max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Upload Leads</h1>
          <p className="text-gray-500 text-sm mt-1">
            Upload a CSV, TXT, or JSON file to create a new campaign
          </p>
        </div>

        {/* Steps */}
        <div className="flex items-center gap-2 mb-8">
          {['upload', 'preview', 'done'].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={cn(
                  'flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold',
                  step === s
                    ? 'bg-brand-600 text-white'
                    : ['preview', 'done'].includes(step) && i < ['upload', 'preview', 'done'].indexOf(step)
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 text-gray-400'
                )}
              >
                {['preview', 'done'].includes(step) && i < ['upload', 'preview', 'done'].indexOf(step) ? (
                  <CheckCircle2 size={14} />
                ) : (
                  i + 1
                )}
              </div>
              <span className={cn('text-sm', step === s ? 'text-gray-900 font-medium' : 'text-gray-400')}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </span>
              {i < 2 && <ChevronRight size={14} className="text-gray-300 ml-1" />}
            </div>
          ))}
        </div>

        {/* Step 1: Upload */}
        {step === 'upload' && (
          <div className="space-y-5">
            {/* Dropzone */}
            <div
              {...getRootProps()}
              className={cn(
                'border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all',
                isDragActive
                  ? 'border-brand-400 bg-brand-50/50'
                  : file
                  ? 'border-green-300 bg-green-50/30'
                  : 'border-gray-200 hover:border-brand-300 hover:bg-brand-50/20'
              )}
            >
              <input {...getInputProps()} />
              {file ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <FileText size={22} className="text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{file.name}</p>
                    <p className="text-sm text-gray-400">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setFile(null) }}
                    className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1"
                  >
                    <X size={12} /> Remove
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                    <Upload size={22} className="text-gray-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-700">
                      {isDragActive ? 'Drop it here!' : 'Drop your file here'}
                    </p>
                    <p className="text-sm text-gray-400 mt-1">or click to browse · CSV, TXT, JSON · max 5MB</p>
                  </div>
                </div>
              )}
            </div>

            {/* File format hint */}
            <div className="card p-4">
              <div className="flex items-start gap-3">
                <Table size={16} className="text-brand-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Expected format</p>
                  <div className="space-y-1 text-xs text-gray-500 font-mono">
                    <p className="bg-gray-50 rounded px-2 py-1">email,subject,body</p>
                    <p className="bg-gray-50 rounded px-2 py-1">john@business.com,Hello,Your message...</p>
                    <p className="text-gray-400 mt-1 font-sans">
                      Only <code className="text-brand-600">email</code> is required — AI generates subject & body automatically
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handlePreview}
              disabled={!file || uploading}
              className="btn-primary w-full justify-center py-3"
            >
              {uploading ? <Spinner size={16} className="text-white" /> : <ChevronRight size={16} />}
              {uploading ? 'Parsing file...' : 'Preview & Continue'}
            </button>
          </div>
        )}

        {/* Step 2: Preview */}
        {step === 'preview' && result && (
          <div className="space-y-5 animate-slide-up">
            {/* Parse summary */}
            <div className="card p-5">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-600">{result.totalLeads}</div>
                  <div className="text-xs text-gray-500 mt-0.5">Valid leads</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-yellow-500">{result.duplicates}</div>
                  <div className="text-xs text-gray-500 mt-0.5">Duplicates removed</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-400">{result.skipped}</div>
                  <div className="text-xs text-gray-500 mt-0.5">Skipped rows</div>
                </div>
              </div>
            </div>

            {/* Errors */}
            {result.errors.length > 0 && (
              <div className="card p-4 border-yellow-100 bg-yellow-50/50">
                <div className="flex items-start gap-2">
                  <AlertCircle size={15} className="text-yellow-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-yellow-700">Parse warnings</p>
                    <ul className="mt-1 space-y-0.5">
                      {result.errors.slice(0, 5).map((err, i) => (
                        <li key={i} className="text-xs text-yellow-600">{err}</li>
                      ))}
                      {result.errors.length > 5 && (
                        <li className="text-xs text-yellow-500">+ {result.errors.length - 5} more</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Leads preview */}
            <div className="card overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
                <p className="text-sm font-medium text-gray-700">Preview (first {result.leads.length})</p>
                <span className="text-xs text-gray-400">{result.totalLeads} total</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-400 border-b border-gray-50">
                      <th className="text-left px-4 py-2.5 font-medium">Email</th>
                      <th className="text-left px-4 py-2.5 font-medium">Subject</th>
                      <th className="text-left px-4 py-2.5 font-medium">Body</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {result.leads.slice(0, 10).map((lead, i) => (
                      <tr key={i} className="hover:bg-gray-50/50">
                        <td className="px-4 py-2.5 text-gray-800 font-mono text-xs">{lead.email}</td>
                        <td className="px-4 py-2.5 text-gray-600 text-xs">
                          {lead.subject ? (
                            lead.subject.slice(0, 35) + (lead.subject.length > 35 ? '…' : '')
                          ) : (
                            <span className="text-brand-400 flex items-center gap-1">
                              <Sparkles size={11} /> AI will generate
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-gray-500 text-xs">
                          {lead.body ? (
                            lead.body.slice(0, 40) + (lead.body.length > 40 ? '…' : '')
                          ) : (
                            <span className="text-brand-400 flex items-center gap-1">
                              <Sparkles size={11} /> AI will generate
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {result.leads.length > 10 && (
                  <p className="text-xs text-gray-400 text-center py-2">
                    + {result.totalLeads - 10} more leads
                  </p>
                )}
              </div>
            </div>

            {/* Campaign config */}
            <div className="card p-5 space-y-4">
              <h3 className="font-semibold text-gray-900">Create Campaign</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
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

              <div className="flex items-center justify-between p-3 bg-brand-50 rounded-lg">
                <div className="flex items-start gap-2">
                  <Sparkles size={16} className="text-brand-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-brand-800">AI Email Generation</p>
                    <p className="text-xs text-brand-600">
                      GPT-4o will generate subject + body for leads missing them
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setGenerateAI(!generateAI)}
                  className={cn(
                    'relative inline-flex h-5 w-9 rounded-full transition-colors',
                    generateAI ? 'bg-brand-600' : 'bg-gray-200'
                  )}
                >
                  <span
                    className={cn(
                      'inline-block w-4 h-4 bg-white rounded-full shadow transform transition-transform mt-0.5',
                      generateAI ? 'translate-x-4' : 'translate-x-0.5'
                    )}
                  />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button onClick={reset} className="btn-secondary">
                Back
              </button>
              <button
                onClick={handleCreateCampaign}
                disabled={!campaignName.trim() || uploading}
                className="btn-primary flex-1 justify-center py-3"
              >
                {uploading ? <Spinner size={16} className="text-white" /> : <CheckCircle2 size={16} />}
                {uploading ? 'Creating campaign...' : `Create Campaign with ${result.totalLeads} Leads`}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Done */}
        {step === 'done' && result?.campaign && (
          <div className="text-center py-12 animate-slide-up">
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={28} className="text-green-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Campaign Created!</h2>
            <p className="text-gray-500 text-sm mb-8">
              <strong>{result.totalLeads}</strong> leads are ready.
              {generateAI && ' AI has generated emails for all leads.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => router.push(`/campaigns/${result.campaign!.id}`)}
                className="btn-primary"
              >
                View Campaign & Start Sending
              </button>
              <button onClick={reset} className="btn-secondary">
                Upload Another File
              </button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
