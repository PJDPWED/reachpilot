'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AppShell } from '@/components/layout/AppShell'
import { StatusBadge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { FadeIn, StaggerList, StaggerItem } from '@/components/animations/FadeIn'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play, Pause, ArrowLeft, RefreshCw, Clock,
  Send, XCircle, MessageSquare, Eye,
  Activity, Zap, Shield, AlertTriangle, CheckCircle2,
} from 'lucide-react'
import { formatDateTime, formatRelative, truncate } from '@/utils/helpers'
import toast from 'react-hot-toast'
import type { Campaign, Lead, Log } from '@/types'
import type { SpamAnalysis } from '@/lib/ai'

interface CampaignData {
  campaign: Campaign
  leads: Lead[]
  logs: Log[]
}

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [data, setData] = useState<CampaignData | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [spamResult, setSpamResult] = useState<SpamAnalysis | null>(null)
  const [spamLoading, setSpamLoading] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/campaigns/${id}`)
      const json = await res.json()
      if (json.success) setData(json.data)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    if (!autoRefresh) return
    const interval = setInterval(fetchData, 15000)
    return () => clearInterval(interval)
  }, [autoRefresh, fetchData])

  const handleStart = async () => {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/campaigns/${id}/start`, { method: 'POST' })
      const json = await res.json()
      if (json.success) {
        toast.success(json.data.message)
        setAutoRefresh(true)
        await fetchData()
      } else {
        toast.error(json.error || 'Failed to start campaign')
      }
    } finally {
      setActionLoading(false)
    }
  }

  const handlePauseResume = async (action: 'pause' | 'resume') => {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/campaigns/${id}/pause`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success(`Campaign ${action === 'pause' ? 'paused' : 'resumed'}`)
        await fetchData()
      }
    } finally {
      setActionLoading(false)
    }
  }

  const handleSpamCheck = async (lead: Lead) => {
    if (!lead.subject || !lead.body) {
      toast.error('Lead has no subject or body to check')
      return
    }
    setSpamLoading(true)
    setSpamResult(null)
    try {
      const res = await fetch('/api/spam-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: lead.subject, body: lead.body }),
      })
      const json = await res.json()
      if (json.success) {
        setSpamResult(json.data)
      } else {
        toast.error('Spam check failed: ' + json.error)
      }
    } finally {
      setSpamLoading(false)
    }
  }

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-32">
          <div className="flex flex-col items-center gap-4">
            <div className="flex gap-1">
              {[0, 1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  style={{ width: 4, height: 4, background: 'var(--accent)', imageRendering: 'pixelated' }}
                  animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
                />
              ))}
            </div>
          </div>
        </div>
      </AppShell>
    )
  }

  if (!data) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-24">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Campaign not found</p>
        </div>
      </AppShell>
    )
  }

  const { campaign, leads, logs } = data
  const sentCount = leads.filter((l) => l.status === 'sent' || l.status === 'replied').length
  const failedCount = leads.filter((l) => l.status === 'failed').length
  const repliedCount = leads.filter((l) => l.status === 'replied').length
  const pendingCount = leads.filter((l) => ['pending', 'queued'].includes(l.status)).length
  const progress = leads.length > 0 ? (sentCount / leads.length) * 100 : 0

  const spamColor = spamResult
    ? spamResult.level === 'safe'
      ? '#34d399'
      : spamResult.level === 'warning'
      ? '#fbbf24'
      : '#f87171'
    : 'var(--text-muted)'

  return (
    <AppShell>
      {/* Header */}
      <FadeIn direction="down" duration={0.4}>
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-start gap-3">
            <motion.button
              onClick={() => router.back()}
              className="mt-1 w-8 h-8 flex items-center justify-center rounded-xl transition-colors"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: 'var(--text-muted)',
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft size={14} />
            </motion.button>
            <div>
              <div className="flex items-center gap-2.5 mb-1">
                <h1
                  className="text-2xl text-white"
                  style={{ fontFamily: "'Calistoga', serif" }}
                >
                  {campaign.name}
                </h1>
                <StatusBadge status={campaign.status} />
              </div>
              <p
                className="text-xs"
                style={{ color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}
              >
                {leads.length} leads · {formatDateTime(campaign.created_at)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <motion.button
              onClick={fetchData}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: 'var(--text-secondary)',
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
            >
              <RefreshCw size={12} className={autoRefresh ? 'animate-spin' : ''} />
              Refresh
            </motion.button>

            {campaign.status === 'pending' && (
              <motion.button
                onClick={handleStart}
                disabled={actionLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
                style={{
                  background: 'linear-gradient(135deg, #6366f1, #7c3aed)',
                  boxShadow: '0 4px 16px rgba(99,102,241,0.35)',
                  opacity: actionLoading ? 0.7 : 1,
                }}
                whileHover={!actionLoading ? { scale: 1.02 } : {}}
                whileTap={!actionLoading ? { scale: 0.97 } : {}}
              >
                {actionLoading ? (
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Play size={13} />
                )}
                Start Campaign
              </motion.button>
            )}

            {campaign.status === 'running' && (
              <motion.button
                onClick={() => handlePauseResume('pause')}
                disabled={actionLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
                style={{
                  background: 'rgba(251,191,36,0.1)',
                  border: '1px solid rgba(251,191,36,0.25)',
                  color: '#fbbf24',
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
              >
                {actionLoading ? (
                  <div className="w-3.5 h-3.5 border-2 border-yellow-300/30 border-t-yellow-300 rounded-full animate-spin" />
                ) : (
                  <Pause size={13} />
                )}
                Pause
              </motion.button>
            )}

            {campaign.status === 'paused' && (
              <motion.button
                onClick={() => handlePauseResume('resume')}
                disabled={actionLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
                style={{
                  background: 'linear-gradient(135deg, #6366f1, #7c3aed)',
                  boxShadow: '0 4px 16px rgba(99,102,241,0.35)',
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
              >
                {actionLoading ? (
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Play size={13} />
                )}
                Resume
              </motion.button>
            )}
          </div>
        </div>
      </FadeIn>

      {/* Stat pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Sent',    value: sentCount,    icon: Send,          color: '#34d399', delay: 0    },
          { label: 'Failed',  value: failedCount,  icon: XCircle,       color: '#f87171', delay: 0.06 },
          { label: 'Replies', value: repliedCount, icon: MessageSquare, color: '#a78bfa', delay: 0.12 },
          { label: 'Pending', value: pendingCount, icon: Clock,         color: '#60a5fa', delay: 0.18 },
        ].map(({ label, value, icon: Icon, color, delay }) => (
          <FadeIn key={label} delay={delay} direction="up">
            <div
              className="flex items-center gap-3 p-4 rounded-2xl"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
              }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: `${color}1a`, border: `1px solid ${color}30` }}
              >
                <Icon size={15} style={{ color }} />
              </div>
              <div>
                <div
                  className="text-xl text-white"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {value}
                </div>
                <div
                  className="text-[10px] uppercase tracking-widest"
                  style={{ color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {label}
                </div>
              </div>
            </div>
          </FadeIn>
        ))}
      </div>

      {/* Progress bar */}
      {leads.length > 0 && (
        <FadeIn delay={0.2}>
          <div
            className="p-5 rounded-2xl mb-5"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Zap size={13} style={{ color: 'var(--accent-light)' }} />
                <span
                  className="text-sm font-medium text-white"
                  style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', letterSpacing: '0.06em', textTransform: 'uppercase' }}
                >
                  Overall Progress
                </span>
              </div>
              <span
                className="text-sm"
                style={{ color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}
              >
                {sentCount}/{leads.length} · {Math.round(progress)}%
              </span>
            </div>
            {/* Pixel progress bar */}
            <div
              className="h-2 overflow-hidden"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 2,
              }}
            >
              <motion.div
                className="h-full"
                style={{
                  background: 'repeating-linear-gradient(90deg, #6366f1 0px, #6366f1 8px, #8b5cf6 8px, #8b5cf6 16px)',
                  backgroundSize: '16px 100%',
                  borderRadius: 1,
                }}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
            {pendingCount > 0 && (
              <div
                className="flex items-center gap-1.5 mt-2 text-xs"
                style={{ color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}
              >
                <Clock size={11} />
                ~{Math.round((pendingCount * 9) / 60)}h remaining at 8–10 min/email
              </div>
            )}
          </div>
        </FadeIn>
      )}

      {/* Leads + Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Leads table */}
        <FadeIn delay={0.25}>
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
            }}
          >
            <div
              className="flex items-center justify-between px-4 py-3.5"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2" style={{ background: '#34d399', imageRendering: 'pixelated' }} />
                <Send size={13} style={{ color: 'var(--accent-light)' }} />
                <h3
                  className="text-sm font-semibold text-white"
                  style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', letterSpacing: '0.05em', textTransform: 'uppercase' }}
                >
                  Leads
                </h3>
              </div>
              <span
                className="text-xs px-2 py-0.5"
                style={{
                  color: 'var(--text-muted)',
                  fontFamily: "'JetBrains Mono', monospace",
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 3,
                }}
              >
                {leads.length}
              </span>
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: '380px' }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    {['Email', 'Status', 'Time', ''].map((h) => (
                      <th
                        key={h}
                        className="text-left px-4 py-2.5"
                        style={{
                          color: 'var(--text-muted)',
                          fontSize: '10px',
                          fontFamily: "'JetBrains Mono', monospace",
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                          fontWeight: 600,
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => (
                    <tr
                      key={lead.id}
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                      onMouseEnter={(e) =>
                        ((e.currentTarget as HTMLTableRowElement).style.background =
                          'rgba(255,255,255,0.02)')
                      }
                      onMouseLeave={(e) =>
                        ((e.currentTarget as HTMLTableRowElement).style.background = 'transparent')
                      }
                    >
                      <td
                        className="px-4 py-2.5 max-w-[130px] truncate"
                        style={{ color: 'var(--text-secondary)', fontSize: '11px', fontFamily: "'JetBrains Mono', monospace" }}
                      >
                        {lead.email}
                      </td>
                      <td className="px-4 py-2.5">
                        <StatusBadge status={lead.status} size="sm" />
                      </td>
                      <td
                        className="px-4 py-2.5 text-xs"
                        style={{ color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}
                      >
                        {lead.sent_at
                          ? formatRelative(lead.sent_at)
                          : lead.scheduled_at
                          ? formatRelative(lead.scheduled_at)
                          : '—'}
                      </td>
                      <td className="px-4 py-2.5">
                        <motion.button
                          onClick={() => { setSelectedLead(lead); setSpamResult(null) }}
                          className="w-6 h-6 flex items-center justify-center rounded"
                          style={{ color: 'var(--text-muted)' }}
                          whileHover={{ scale: 1.2, color: 'var(--accent-light)' as string }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <Eye size={12} />
                        </motion.button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </FadeIn>

        {/* Activity log */}
        <FadeIn delay={0.3}>
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
            }}
          >
            <div
              className="flex items-center justify-between px-4 py-3.5"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 animate-pixel-blink"
                  style={{
                    background: campaign.status === 'running' ? '#34d399' : 'var(--text-muted)',
                    imageRendering: 'pixelated',
                  }}
                />
                <Activity size={13} style={{ color: 'var(--accent-light)' }} />
                <h3
                  className="text-sm font-semibold text-white"
                  style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', letterSpacing: '0.05em', textTransform: 'uppercase' }}
                >
                  Activity Log
                </h3>
              </div>
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all"
                style={{
                  background: autoRefresh ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)',
                  border: autoRefresh
                    ? '1px solid rgba(99,102,241,0.3)'
                    : '1px solid rgba(255,255,255,0.06)',
                  color: autoRefresh ? 'var(--accent-light)' : 'var(--text-muted)',
                  fontFamily: "'JetBrains Mono', monospace",
                  borderRadius: 3,
                }}
              >
                <RefreshCw size={10} className={autoRefresh ? 'animate-spin' : ''} />
                {autoRefresh ? 'LIVE' : 'AUTO'}
              </button>
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: '380px' }}>
              {logs.length === 0 ? (
                <div className="px-4 py-12 text-center">
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    No activity yet. Start the campaign.
                  </p>
                </div>
              ) : (
                <StaggerList>
                  {logs.map((log) => (
                    <StaggerItem key={log.id}>
                      <div
                        className="flex items-start gap-3 px-4 py-3"
                        style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                      >
                        {/* Status pixel */}
                        <div
                          className="w-1.5 h-1.5 mt-1.5 shrink-0"
                          style={{
                            background: log.event.includes('[FAILED]')
                              ? '#f87171'
                              : log.event.includes('[RETRY')
                              ? '#fbbf24'
                              : log.event.includes('sent')
                              ? '#34d399'
                              : 'var(--accent)',
                            imageRendering: 'pixelated',
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <p
                            className="text-xs leading-relaxed"
                            style={{
                              color: log.event.includes('[FAILED]')
                                ? '#f87171'
                                : log.event.includes('[RETRY')
                                ? '#fbbf24'
                                : 'var(--text-secondary)',
                            }}
                          >
                            {truncate(log.event, 85)}
                          </p>
                        </div>
                        <span
                          className="text-xs shrink-0"
                          style={{ color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}
                        >
                          {formatRelative(log.timestamp)}
                        </span>
                      </div>
                    </StaggerItem>
                  ))}
                </StaggerList>
              )}
            </div>
          </div>
        </FadeIn>
      </div>

      {/* Lead detail modal */}
      <Modal
        isOpen={!!selectedLead}
        onClose={() => { setSelectedLead(null); setSpamResult(null) }}
        title={selectedLead ? `Email to ${selectedLead.email}` : ''}
        size="lg"
      >
        {selectedLead && (
          <div className="space-y-4">
            {/* Subject */}
            <div>
              <label
                className="block mb-1.5"
                style={{
                  color: 'var(--text-muted)',
                  fontSize: '10px',
                  fontFamily: "'JetBrains Mono', monospace",
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  fontWeight: 600,
                }}
              >
                Subject
              </label>
              <p className="text-sm font-medium text-white">
                {selectedLead.subject || (
                  <span className="italic" style={{ color: 'var(--text-muted)' }}>
                    No subject
                  </span>
                )}
              </p>
            </div>

            {/* Body */}
            <div>
              <label
                className="block mb-1.5"
                style={{
                  color: 'var(--text-muted)',
                  fontSize: '10px',
                  fontFamily: "'JetBrains Mono', monospace",
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  fontWeight: 600,
                }}
              >
                Body
              </label>
              <div
                className="p-4 rounded-xl text-sm leading-relaxed whitespace-pre-wrap max-h-52 overflow-y-auto"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  color: 'var(--text-secondary)',
                }}
              >
                {selectedLead.body || (
                  <span className="italic" style={{ color: 'var(--text-muted)' }}>
                    No body
                  </span>
                )}
              </div>
            </div>

            {/* Spam score */}
            <div
              className="rounded-xl overflow-hidden"
              style={{ border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <div
                className="flex items-center justify-between px-4 py-3"
                style={{ background: 'rgba(255,255,255,0.03)', borderBottom: spamResult ? '1px solid rgba(255,255,255,0.06)' : 'none' }}
              >
                <div className="flex items-center gap-2">
                  <Shield size={13} style={{ color: spamResult ? spamColor : 'var(--text-muted)' }} />
                  <span
                    className="text-xs font-semibold"
                    style={{
                      color: spamResult ? spamColor : 'var(--text-secondary)',
                      fontFamily: "'JetBrains Mono', monospace",
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}
                  >
                    Spam Score
                    {spamResult && (
                      <span className="ml-2">
                        [{spamResult.score}/100 — {spamResult.level.toUpperCase()}]
                      </span>
                    )}
                  </span>
                </div>
                <motion.button
                  onClick={() => handleSpamCheck(selectedLead)}
                  disabled={spamLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium"
                  style={{
                    background: 'rgba(99,102,241,0.12)',
                    border: '1px solid rgba(99,102,241,0.25)',
                    color: 'var(--accent-light)',
                    fontFamily: "'JetBrains Mono', monospace",
                    borderRadius: 4,
                    opacity: spamLoading ? 0.6 : 1,
                  }}
                  whileHover={!spamLoading ? { scale: 1.02 } : {}}
                  whileTap={!spamLoading ? { scale: 0.97 } : {}}
                >
                  {spamLoading ? (
                    <div className="w-3 h-3 border border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                  ) : (
                    <Zap size={11} />
                  )}
                  {spamLoading ? 'Analyzing...' : 'Check'}
                </motion.button>
              </div>

              <AnimatePresence>
                {spamResult && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="px-4 py-3"
                    style={{ background: 'rgba(255,255,255,0.015)' }}
                  >
                    {spamResult.triggers.length === 0 ? (
                      <div className="flex items-center gap-2 text-xs" style={{ color: '#34d399' }}>
                        <CheckCircle2 size={12} />
                        Clean — no spam triggers detected
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="space-y-1">
                          {spamResult.triggers.map((t, i) => (
                            <div key={i} className="flex items-start gap-2 text-xs" style={{ color: '#f87171' }}>
                              <AlertTriangle size={10} className="mt-0.5 shrink-0" />
                              {t}
                            </div>
                          ))}
                        </div>
                        {spamResult.suggestions.length > 0 && (
                          <div className="mt-2 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                            {spamResult.suggestions.map((s, i) => (
                              <div key={i} className="flex items-start gap-2 text-xs mb-1" style={{ color: '#fbbf24' }}>
                                <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>→</span>
                                {s}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Status footer */}
            <div
              className="flex items-center gap-3 pt-3"
              style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
            >
              <StatusBadge status={selectedLead.status} />
              {selectedLead.sent_at && (
                <span
                  className="text-xs"
                  style={{ color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}
                >
                  Sent {formatDateTime(selectedLead.sent_at)}
                </span>
              )}
              {selectedLead.retry_count > 0 && (
                <span
                  className="text-xs"
                  style={{ color: '#f87171', fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {selectedLead.retry_count}x retried
                </span>
              )}
            </div>
          </div>
        )}
      </Modal>
    </AppShell>
  )
}
