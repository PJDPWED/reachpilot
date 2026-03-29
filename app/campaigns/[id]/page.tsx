'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AppShell } from '@/components/layout/AppShell'
import { StatusBadge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { Modal } from '@/components/ui/Modal'
import {
  Play,
  Pause,
  ArrowLeft,
  RefreshCw,
  Clock,
  Send,
  XCircle,
  MessageSquare,
  Sparkles,
  Eye,
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

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    if (!autoRefresh) return
    const interval = setInterval(fetchData, 15000) // refresh every 15s when auto-refresh is on
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
        <div className="flex items-center justify-center py-20">
          <Spinner size={24} />
        </div>
      </AppShell>
    )
  }

  if (!data) {
    return (
      <AppShell>
        <div className="text-center py-20 text-gray-400">Campaign not found</div>
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
      <div className="animate-slide-up">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-start gap-4">
            <button
              onClick={() => router.back()}
              className="mt-1 w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold text-gray-900">{campaign.name}</h1>
                <StatusBadge status={campaign.status} />
              </div>
              <p className="text-sm text-gray-500">{leads.length} leads · Created {formatDateTime(campaign.created_at)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchData}
              className="btn-secondary"
              title="Refresh"
            >
              <RefreshCw size={14} className={autoRefresh ? 'animate-spin' : ''} />
            </button>

            {campaign.status === 'pending' && (
              <button
                onClick={handleStart}
                disabled={actionLoading}
                className="btn-primary"
              >
                {actionLoading ? <Spinner size={14} className="text-white" /> : <Play size={14} />}
                Start Campaign
              </button>
            )}

            {campaign.status === 'running' && (
              <button
                onClick={() => handlePauseResume('pause')}
                disabled={actionLoading}
                className="btn-secondary"
              >
                {actionLoading ? <Spinner size={14} /> : <Pause size={14} />}
                Pause
              </button>
            )}

            {campaign.status === 'paused' && (
              <button
                onClick={() => handlePauseResume('resume')}
                disabled={actionLoading}
                className="btn-primary"
              >
                {actionLoading ? <Spinner size={14} className="text-white" /> : <Play size={14} />}
                Resume
              </button>
            )}
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Sent', value: sentCount, icon: Send, color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'Failed', value: failedCount, icon: XCircle, color: 'text-red-500', bg: 'bg-red-50' },
            { label: 'Replies', value: repliedCount, icon: MessageSquare, color: 'text-purple-600', bg: 'bg-purple-50' },
            { label: 'Pending', value: pendingCount, icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="card p-4 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
                <Icon size={16} className={color} />
              </div>
              <div>
                <div className="text-xl font-bold text-gray-900">{value}</div>
                <div className="text-xs text-gray-500">{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Progress */}
        {leads.length > 0 && (
          <div className="card p-5 mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium text-gray-700">Overall Progress</span>
              <span className="text-gray-500 tabular-nums">{sentCount}/{leads.length} sent</span>
            </div>
            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-500 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>{Math.round(progress)}% complete</span>
              {pendingCount > 0 && (
                <span className="flex items-center gap-1">
                  <Clock size={11} />
                  ~{Math.round((pendingCount * 9) / 60)}h remaining (at 8-10 min/email)
                </span>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Leads table */}
          <div className="card">
            <div className="px-4 py-3.5 border-b border-gray-50 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Leads</h3>
              <span className="text-xs text-gray-400">{leads.length} total</span>
            </div>
            <div className="overflow-y-auto max-h-96">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-400 border-b border-gray-50">
                    <th className="text-left px-4 py-2.5 font-medium">Email</th>
                    <th className="text-left px-4 py-2.5 font-medium">Status</th>
                    <th className="text-left px-4 py-2.5 font-medium">Scheduled</th>
                    <th className="px-4 py-2.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {leads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-2.5 text-xs font-mono text-gray-700 max-w-[140px] truncate">
                        {lead.email}
                      </td>
                      <td className="px-4 py-2.5">
                        <StatusBadge status={lead.status} />
                      </td>
                      <td className="px-4 py-2.5 text-xs text-gray-400">
                        {lead.sent_at
                          ? formatRelative(lead.sent_at)
                          : lead.scheduled_at
                          ? formatRelative(lead.scheduled_at)
                          : '—'}
                      </td>
                      <td className="px-4 py-2.5">
                        <button
                          onClick={() => setSelectedLead(lead)}
                          className="text-gray-300 hover:text-brand-500"
                        >
                          <Eye size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Activity log */}
          <div className="card">
            <div className="px-4 py-3.5 border-b border-gray-50 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Activity Log</h3>
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`text-xs flex items-center gap-1 px-2 py-1 rounded-md transition-colors ${
                  autoRefresh
                    ? 'bg-brand-50 text-brand-600'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <RefreshCw size={10} className={autoRefresh ? 'animate-spin' : ''} />
                {autoRefresh ? 'Live' : 'Auto-refresh'}
              </button>
            </div>
            <div className="overflow-y-auto max-h-96 divide-y divide-gray-50">
              {logs.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-gray-400">
                  No activity yet. Start the campaign to see logs.
                </div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 px-4 py-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-300 mt-1.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-700">{truncate(log.event, 80)}</p>
                    </div>
                    <span className="text-xs text-gray-400 shrink-0">
                      {formatRelative(log.timestamp)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Lead detail modal */}
      {selectedLead && (
        <Modal
          isOpen={!!selectedLead}
          onClose={() => setSelectedLead(null)}
          title={`Email to ${selectedLead.email}`}
          size="lg"
        >
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Subject</label>
              <p className="mt-1 text-sm text-gray-800 font-medium">
                {selectedLead.subject || <span className="text-gray-400 italic">No subject</span>}
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Body</label>
              <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                {selectedLead.body || <span className="text-gray-400 italic">No body</span>}
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2 border-t border-gray-100 text-xs text-gray-400">
              <StatusBadge status={selectedLead.status} />
              {selectedLead.sent_at && <span>Sent {formatDateTime(selectedLead.sent_at)}</span>}
              {selectedLead.retry_count > 0 && (
                <span className="text-red-400">{selectedLead.retry_count} retries</span>
              )}
            </div>
          </div>
        </Modal>
      )}
    </AppShell>
  )
}
