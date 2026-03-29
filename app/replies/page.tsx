'use client'

import { useEffect, useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { StatusBadge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { Modal } from '@/components/ui/Modal'
import {
  Inbox,
  ThumbsUp,
  ThumbsDown,
  Minus,
  Sparkles,
  Send,
  Eye,
  RefreshCw,
} from 'lucide-react'
import { formatRelative, truncate } from '@/utils/helpers'
import toast from 'react-hot-toast'

interface ReplyWithLead {
  id: string
  lead_id: string
  message_id: string
  thread_id: string
  content: string
  classification: 'YES' | 'NO' | 'NEUTRAL' | null
  follow_up_sent: boolean
  created_at: string
  leads: {
    email: string
    subject: string
    campaign_id: string
    campaigns: { name: string }
  } | null
}

const classificationConfig = {
  YES: { label: 'Interested', icon: ThumbsUp, color: 'text-green-600', bg: 'bg-green-50' },
  NO: { label: 'Not Interested', icon: ThumbsDown, color: 'text-red-500', bg: 'bg-red-50' },
  NEUTRAL: { label: 'Neutral', icon: Minus, color: 'text-gray-500', bg: 'bg-gray-100' },
}

export default function RepliesPage() {
  const [replies, setReplies] = useState<ReplyWithLead[]>([])
  const [loading, setLoading] = useState(true)
  const [pollingLoading, setPollingLoading] = useState(false)
  const [selectedReply, setSelectedReply] = useState<ReplyWithLead | null>(null)
  const [followUpLoading, setFollowUpLoading] = useState<string | null>(null)
  const [followUpPreview, setFollowUpPreview] = useState<{ subject: string; body: string } | null>(null)
  const [filter, setFilter] = useState<'ALL' | 'YES' | 'NO' | 'NEUTRAL'>('ALL')

  const fetchReplies = async () => {
    try {
      const res = await fetch('/api/replies')
      const json = await res.json()
      if (json.success) setReplies(json.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReplies()
  }, [])

  const handlePollReplies = async () => {
    setPollingLoading(true)
    try {
      const res = await fetch('/api/replies/poll', { method: 'POST' })
      const json = await res.json()
      if (json.success) {
        toast.success(`Checked ${json.data.checked} threads · ${json.data.newReplies} new replies`)
        await fetchReplies()
      } else {
        toast.error(json.error || 'Poll failed')
      }
    } finally {
      setPollingLoading(false)
    }
  }

  const handleViewFollowUp = async (reply: ReplyWithLead) => {
    setSelectedReply(reply)
    setFollowUpPreview(null)
    try {
      const res = await fetch(`/api/replies/${reply.id}/followup`)
      const json = await res.json()
      if (json.success) setFollowUpPreview(json.data)
    } catch {
      toast.error('Failed to generate preview')
    }
  }

  const handleSendFollowUp = async (replyId: string) => {
    setFollowUpLoading(replyId)
    try {
      const res = await fetch(`/api/replies/${replyId}/followup`, { method: 'POST' })
      const json = await res.json()
      if (json.success) {
        toast.success('Follow-up sent!')
        setReplies((prev) => prev.map((r) => (r.id === replyId ? { ...r, follow_up_sent: true } : r)))
        setSelectedReply(null)
      } else {
        toast.error(json.error || 'Failed to send follow-up')
      }
    } finally {
      setFollowUpLoading(null)
    }
  }

  const filtered = filter === 'ALL' ? replies : replies.filter((r) => r.classification === filter)
  const yesCount = replies.filter((r) => r.classification === 'YES').length
  const noCount = replies.filter((r) => r.classification === 'NO').length
  const neutralCount = replies.filter((r) => r.classification === 'NEUTRAL').length

  return (
    <AppShell>
      <div className="animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Replies Inbox</h1>
            <p className="text-gray-500 text-sm mt-1">AI-classified replies with suggested follow-ups</p>
          </div>
          <button
            onClick={handlePollReplies}
            disabled={pollingLoading}
            className="btn-secondary"
          >
            {pollingLoading ? (
              <Spinner size={14} />
            ) : (
              <RefreshCw size={14} />
            )}
            Check for replies
          </button>
        </div>

        {/* Classification summary */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { key: 'YES', count: yesCount, ...classificationConfig.YES },
            { key: 'NO', count: noCount, ...classificationConfig.NO },
            { key: 'NEUTRAL', count: neutralCount, ...classificationConfig.NEUTRAL },
          ].map(({ key, count, label, icon: Icon, color, bg }) => (
            <button
              key={key}
              onClick={() => setFilter(filter === key ? 'ALL' : key as 'YES' | 'NO' | 'NEUTRAL')}
              className={`card p-4 text-left transition-all ${
                filter === key ? 'ring-2 ring-brand-400' : 'hover:shadow-md'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center`}>
                  <Icon size={15} className={color} />
                </div>
                {filter === key && (
                  <span className="text-xs text-brand-500 font-medium">Filtered</span>
                )}
              </div>
              <div className="text-2xl font-bold text-gray-900">{count}</div>
              <div className="text-xs text-gray-500">{label}</div>
            </button>
          ))}
        </div>

        {/* Replies list */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner size={24} />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title={filter === 'ALL' ? 'No replies yet' : `No ${filter} replies`}
            description={
              filter === 'ALL'
                ? 'Click "Check for replies" to poll Gmail for new replies to your sent campaigns.'
                : `No replies classified as ${filter.toLowerCase()}.`
            }
            action={
              filter !== 'ALL' ? (
                <button onClick={() => setFilter('ALL')} className="btn-secondary">
                  Show all replies
                </button>
              ) : undefined
            }
          />
        ) : (
          <div className="space-y-3">
            {filtered.map((reply) => {
              const cls = reply.classification
              const config = cls ? classificationConfig[cls] : null
              const Icon = config?.icon

              return (
                <div key={reply.id} className="card p-5">
                  <div className="flex items-start gap-4">
                    {/* Classification badge */}
                    <div className={`shrink-0 w-9 h-9 rounded-xl ${config?.bg || 'bg-gray-50'} flex items-center justify-center`}>
                      {Icon ? (
                        <Icon size={16} className={config?.color || 'text-gray-400'} />
                      ) : (
                        <Minus size={16} className="text-gray-400" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1 flex-wrap">
                        <span className="text-sm font-semibold text-gray-800">
                          {reply.leads?.email || 'Unknown'}
                        </span>
                        {cls && <StatusBadge status={cls} label={config?.label} />}
                        {reply.follow_up_sent && (
                          <span className="badge bg-brand-50 text-brand-600">
                            <Send size={10} className="mr-1" /> Follow-up sent
                          </span>
                        )}
                      </div>
                      {reply.leads?.campaigns?.name && (
                        <p className="text-xs text-gray-400 mb-2">
                          Campaign: {reply.leads.campaigns.name}
                        </p>
                      )}
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {truncate(reply.content, 200)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-gray-400">{formatRelative(reply.created_at)}</span>
                      <button
                        onClick={() => setSelectedReply(reply)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-300 hover:text-brand-500 hover:bg-brand-50"
                        title="View full reply"
                      >
                        <Eye size={14} />
                      </button>
                      {reply.classification === 'YES' && !reply.follow_up_sent && (
                        <button
                          onClick={() => handleViewFollowUp(reply)}
                          className="btn-primary py-1.5 text-xs"
                        >
                          <Sparkles size={12} />
                          AI Follow-up
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Reply detail / follow-up modal */}
      {selectedReply && (
        <Modal
          isOpen={!!selectedReply}
          onClose={() => { setSelectedReply(null); setFollowUpPreview(null) }}
          title={`Reply from ${selectedReply.leads?.email || 'Unknown'}`}
          size="xl"
        >
          <div className="space-y-5">
            {/* Original reply */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Reply Content
              </label>
              <div className="mt-2 p-4 bg-gray-50 rounded-xl text-sm text-gray-700 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                {selectedReply.content}
              </div>
            </div>

            {/* AI Follow-up preview (for YES replies) */}
            {selectedReply.classification === 'YES' && !selectedReply.follow_up_sent && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles size={14} className="text-brand-500" />
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    AI-Generated Follow-up
                  </label>
                </div>

                {!followUpPreview ? (
                  <div className="flex items-center gap-2 text-sm text-gray-400 p-4">
                    <Spinner size={14} />
                    Generating follow-up with GPT-4o...
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="p-4 bg-brand-50/50 rounded-xl border border-brand-100">
                      <div className="text-xs font-medium text-brand-600 mb-1">Subject</div>
                      <div className="text-sm font-semibold text-gray-800">{followUpPreview.subject}</div>
                    </div>
                    <div className="p-4 bg-brand-50/50 rounded-xl border border-brand-100">
                      <div className="text-xs font-medium text-brand-600 mb-1">Body</div>
                      <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                        {followUpPreview.body}
                      </div>
                    </div>
                    <button
                      onClick={() => handleSendFollowUp(selectedReply.id)}
                      disabled={!!followUpLoading}
                      className="btn-primary w-full justify-center"
                    >
                      {followUpLoading === selectedReply.id ? (
                        <Spinner size={14} className="text-white" />
                      ) : (
                        <Send size={14} />
                      )}
                      Send this Follow-up
                    </button>
                  </div>
                )}
              </div>
            )}

            {selectedReply.follow_up_sent && (
              <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-lg text-sm">
                <Send size={14} />
                Follow-up already sent for this reply.
              </div>
            )}
          </div>
        </Modal>
      )}
    </AppShell>
  )
}
