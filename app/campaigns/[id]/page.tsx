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
  Send, XCircle, MessageSquare, Sparkles, Eye,
  Activity, Zap,
} from 'lucide-react'
import { formatDateTime, formatRelative, truncate } from '@/utils/helpers'
import toast from 'react-hot-toast'
import type { Campaign, Lead, Log } from '@/types'

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
        toast.error(json.error)
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

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-24">
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full"
                style={{ background: 'var(--accent)' }}
                animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.1, 0.8] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
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

  return (
    <AppShell>
      {/* Header */}
      <FadeIn direction="down" duration={0.4}>
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-start gap-3">
            <motion.button
              onClick={() => router.back()}
              className="mt-1 w-8 h-8 flex items-center justify-center rounded-xl transition-colors"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-muted)' }}
              whileHover={{ scale: 1.05, background: 'rgba(255,255,255,0.09)' as string }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft size={14} />
            </motion.button>
            <div>
              <div className="flex items-center gap-2.5 mb-1">
                <h1 className="font-heading text-2xl text-white">{campaign.name}</h1>
                <StatusBadge status={campaign.status} />
              </div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {leads.length} leads · Created {formatDateTime(campaign.created_at)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <motion.button
              onClick={fetchData}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors"
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
          { label: 'Sent',    value: sentCount,    icon: Send,        color: '#34d399', delay: 0 },
          { label: 'Failed',  value: failedCount,  icon: XCircle,     color: '#f87171', delay: 0.06 },
          { label: 'Replies', value: repliedCount, icon: MessageSquare, color: '#a78bfa', delay: 0.12 },
          { label: 'Pending', value: pendingCount, icon: Clock,       color: '#60a5fa', delay: 0.18 },
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
                <div className="font-heading text-xl text-white">{value}</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</div>
              </div>
            </div>
          </FadeIn>
        ))}
      </div>

      {/* Progress */}
      {leads.length > 0 && (
        <FadeIn delay={0.2}>
          <div
            className="p-5 rounded-2xl mb-5"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Zap size={13} style={{ color: 'var(--accent-light)' }} />
                <span className="text-sm font-medium text-white">Overall Progress</span>
              </div>
              <span className="text-sm tabular-nums" style={{ color: 'var(--text-muted)' }}>
                {sentCount}/{leads.length} sent · {Math.round(progress)}%
              </span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg, #6366f1, #8b5cf6)' }}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
            {pendingCount > 0 && (
              <div className="flex items-center gap-1.5 mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
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
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <div
              className="flex items-center justify-between px-4 py-3.5"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="flex items-center gap-2">
                <Send size={13} style={{ color: 'var(--accent-light)' }} />
                <h3 className="text-sm font-semibold text-white">Leads</h3>
              </div>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{leads.length} total</span>
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: '380px' }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    {['Email', 'Status', 'Time', ''].map((h) => (
                      <th key={h} className="text-left px-4 py-2.5 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
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
                      onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(255,255,255,0.02)'}
                      onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}
                    >
                      <td className="px-4 py-2.5 text-xs font-mono max-w-[130px] truncate" style={{ color: 'var(--text-secondary)' }}>
                        {lead.email}
                      </td>
                      <td className="px-4 py-2.5">
                        <StatusBadge status={lead.status} size="sm" />
                      </td>
                      <td className="px-4 py-2.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                        {lead.sent_at
                          ? formatRelative(lead.sent_at)
                          : lead.scheduled_at
                          ? formatRelative(lead.scheduled_at)
                          : '—'}
                      </td>
                      <td className="px-4 py-2.5">
                        <motion.button
                          onClick={() => setSelectedLead(lead)}
                          className="w-6 h-6 flex items-center justify-center rounded-lg"
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
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <div
              className="flex items-center justify-between px-4 py-3.5"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="flex items-center gap-2">
                <Activity size={13} style={{ color: 'var(--accent-light)' }} />
                <h3 className="text-sm font-semibold text-white">Activity Log</h3>
              </div>
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: autoRefresh ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.04)',
                  border: autoRefresh ? '1px solid rgba(99,102,241,0.25)' : '1px solid rgba(255,255,255,0.06)',
                  color: autoRefresh ? 'var(--accent-light)' : 'var(--text-muted)',
                }}
              >
                <RefreshCw size={10} className={autoRefresh ? 'animate-spin' : ''} />
                {autoRefresh ? 'Live' : 'Auto'}
              </button>
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: '380px' }}>
              {logs.length === 0 ? (
                <div className="px-4 py-10 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                  No activity yet. Start the campaign to see logs.
                </div>
              ) : (
                <StaggerList>
                  {logs.map((log) => (
                    <StaggerItem key={log.id}>
                      <div
                        className="flex items-start gap-3 px-4 py-3"
                        style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                      >
                        <div
                          className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                          style={{ background: 'var(--accent)', boxShadow: '0 0 4px var(--accent)' }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                            {truncate(log.event, 80)}
                          </p>
                        </div>
                        <span className="text-xs shrink-0" style={{ color: 'var(--text-muted)' }}>
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
        onClose={() => setSelectedLead(null)}
        title={selectedLead ? `Email to ${selectedLead.email}` : ''}
        size="lg"
      >
        {selectedLead && (
          <div className="space-y-4">
            <div>
              <label
                className="block text-xs font-semibold uppercase tracking-widest mb-2"
                style={{ color: 'var(--text-muted)' }}
              >
                Subject
              </label>
              <p className="text-sm font-medium text-white">
                {selectedLead.subject || <span className="text-sm italic" style={{ color: 'var(--text-muted)' }}>No subject</span>}
              </p>
            </div>
            <div>
              <label
                className="block text-xs font-semibold uppercase tracking-widest mb-2"
                style={{ color: 'var(--text-muted)' }}
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
                {selectedLead.body || <span className="italic" style={{ color: 'var(--text-muted)' }}>No body</span>}
              </div>
            </div>
            <div
              className="flex items-center gap-3 pt-3"
              style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
            >
              <StatusBadge status={selectedLead.status} />
              {selectedLead.sent_at && (
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Sent {formatDateTime(selectedLead.sent_at)}
                </span>
              )}
              {selectedLead.retry_count > 0 && (
                <span className="text-xs" style={{ color: '#f87171' }}>
                  {selectedLead.retry_count} retries
                </span>
              )}
            </div>
          </div>
        )}
      </Modal>
    </AppShell>
  )
}
