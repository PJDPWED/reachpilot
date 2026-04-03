'use client'

import { useEffect, useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { StatusBadge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { Modal } from '@/components/ui/Modal'
import { FadeIn, StaggerList, StaggerItem } from '@/components/animations/FadeIn'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Inbox, ThumbsUp, ThumbsDown, Minus,
  Sparkles, Send, Eye, RefreshCw,
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

const classConfig = {
  YES:     { label: 'Interested',      icon: ThumbsUp,   color: '#34d399', bg: 'rgba(52,211,153,0.10)',  border: 'rgba(52,211,153,0.2)'  },
  NO:      { label: 'Not Interested',  icon: ThumbsDown, color: '#f87171', bg: 'rgba(248,113,113,0.10)', border: 'rgba(248,113,113,0.2)' },
  NEUTRAL: { label: 'Neutral',         icon: Minus,      color: '#94a3b8', bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.15)' },
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

  useEffect(() => { fetchReplies() }, [])

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
  const counts = {
    YES:     replies.filter((r) => r.classification === 'YES').length,
    NO:      replies.filter((r) => r.classification === 'NO').length,
    NEUTRAL: replies.filter((r) => r.classification === 'NEUTRAL').length,
  }

  return (
    <AppShell>
      {/* Header */}
      <FadeIn direction="down" duration={0.5}>
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="font-heading text-3xl text-white mb-1">Replies Inbox</h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              AI-classified replies with suggested follow-ups
            </p>
          </div>
          <motion.button
            onClick={handlePollReplies}
            disabled={pollingLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.09)',
              color: 'var(--text-secondary)',
            }}
            whileHover={{ scale: 1.02, background: 'rgba(255,255,255,0.08)' as string }}
            whileTap={{ scale: 0.97 }}
          >
            <RefreshCw size={13} className={pollingLoading ? 'animate-spin' : ''} />
            {pollingLoading ? 'Checking...' : 'Check for replies'}
          </motion.button>
        </div>
      </FadeIn>

      {/* Classification filter cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {(Object.entries(classConfig) as [keyof typeof classConfig, typeof classConfig[keyof typeof classConfig]][]).map(([key, cfg], i) => {
          const Icon = cfg.icon
          const isActive = filter === key
          return (
            <FadeIn key={key} delay={i * 0.07}>
              <motion.button
                onClick={() => setFilter(isActive ? 'ALL' : key)}
                className="relative w-full text-left p-4 rounded-2xl transition-all overflow-hidden"
                style={{
                  background: isActive ? cfg.bg : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${isActive ? cfg.border : 'rgba(255,255,255,0.07)'}`,
                }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
                  >
                    <Icon size={14} style={{ color: cfg.color }} />
                  </div>
                  <AnimatePresence>
                    {isActive && (
                      <motion.span
                        className="text-xs font-medium px-2 py-0.5 rounded-full"
                        style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                      >
                        Active
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
                <div className="font-heading text-2xl text-white mb-0.5">{counts[key]}</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{cfg.label}</div>
              </motion.button>
            </FadeIn>
          )
        })}
      </div>

      {/* Replies list */}
      {loading ? (
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
      ) : filtered.length === 0 ? (
        <FadeIn>
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
                <button
                  onClick={() => setFilter('ALL')}
                  className="px-4 py-2 rounded-xl text-sm font-medium"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  Show all replies
                </button>
              ) : undefined
            }
          />
        </FadeIn>
      ) : (
        <StaggerList className="space-y-3">
          {filtered.map((reply) => {
            const cls = reply.classification
            const cfg = cls ? classConfig[cls] : null
            const Icon = cfg?.icon

            return (
              <StaggerItem key={reply.id}>
                <div
                  className="rounded-2xl p-5 transition-all duration-200"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    backdropFilter: 'blur(20px)',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.05)'
                    ;(e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.10)'
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.03)'
                    ;(e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.07)'
                  }}
                >
                  <div className="flex items-start gap-4">
                    {/* Classification icon */}
                    <div
                      className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center mt-0.5"
                      style={{
                        background: cfg?.bg || 'rgba(255,255,255,0.05)',
                        border: `1px solid ${cfg?.border || 'rgba(255,255,255,0.08)'}`,
                      }}
                    >
                      {Icon ? (
                        <Icon size={14} style={{ color: cfg?.color || 'var(--text-muted)' }} />
                      ) : (
                        <Minus size={14} style={{ color: 'var(--text-muted)' }} />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 mb-1 flex-wrap">
                        <span className="text-sm font-semibold text-white">
                          {reply.leads?.email || 'Unknown'}
                        </span>
                        {cls && <StatusBadge status={cls} label={cfg?.label} />}
                        {reply.follow_up_sent && (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{ background: 'rgba(99,102,241,0.12)', color: 'var(--accent-light)', border: '1px solid rgba(99,102,241,0.2)' }}
                          >
                            <Send size={9} />
                            Follow-up sent
                          </span>
                        )}
                      </div>
                      {reply.leads?.campaigns?.name && (
                        <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
                          {reply.leads.campaigns.name}
                        </p>
                      )}
                      <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                        {truncate(reply.content, 200)}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {formatRelative(reply.created_at)}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <motion.button
                          onClick={() => setSelectedReply(reply)}
                          className="w-8 h-8 flex items-center justify-center rounded-xl"
                          style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            color: 'var(--text-muted)',
                          }}
                          whileHover={{ scale: 1.1, color: 'var(--accent-light)' as string }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <Eye size={12} />
                        </motion.button>
                        {reply.classification === 'YES' && !reply.follow_up_sent && (
                          <motion.button
                            onClick={() => handleViewFollowUp(reply)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white"
                            style={{
                              background: 'linear-gradient(135deg, #6366f1, #7c3aed)',
                              boxShadow: '0 2px 10px rgba(99,102,241,0.3)',
                            }}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                          >
                            <Sparkles size={10} />
                            AI Follow-up
                          </motion.button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </StaggerItem>
            )
          })}
        </StaggerList>
      )}

      {/* Reply modal */}
      <Modal
        isOpen={!!selectedReply}
        onClose={() => { setSelectedReply(null); setFollowUpPreview(null) }}
        title={selectedReply ? `Reply from ${selectedReply.leads?.email || 'Unknown'}` : ''}
        size="xl"
      >
        {selectedReply && (
          <div className="space-y-5">
            {/* Reply content */}
            <div>
              <label
                className="block text-xs font-semibold uppercase tracking-widest mb-2"
                style={{ color: 'var(--text-muted)' }}
              >
                Reply Content
              </label>
              <div
                className="p-4 rounded-xl text-sm leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  color: 'var(--text-secondary)',
                }}
              >
                {selectedReply.content}
              </div>
            </div>

            {/* AI follow-up */}
            {selectedReply.classification === 'YES' && !selectedReply.follow_up_sent && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles size={13} style={{ color: 'var(--accent-light)' }} />
                  <label
                    className="text-xs font-semibold uppercase tracking-widest"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    AI-Generated Follow-up
                  </label>
                </div>

                {!followUpPreview ? (
                  <div className="flex items-center gap-2.5 py-5 px-4 rounded-xl text-sm" style={{ background: 'rgba(255,255,255,0.02)', color: 'var(--text-muted)' }}>
                    <div className="w-4 h-4 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
                    Generating follow-up with Gemini...
                  </div>
                ) : (
                  <div className="space-y-3">
                    {[
                      { label: 'Subject', value: followUpPreview.subject },
                      { label: 'Body',    value: followUpPreview.body    },
                    ].map(({ label, value }) => (
                      <div
                        key={label}
                        className="p-4 rounded-xl"
                        style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)' }}
                      >
                        <div className="text-xs font-semibold mb-1.5" style={{ color: 'var(--accent-light)' }}>{label}</div>
                        <div className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                          {value}
                        </div>
                      </div>
                    ))}
                    <motion.button
                      onClick={() => handleSendFollowUp(selectedReply.id)}
                      disabled={!!followUpLoading}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white"
                      style={{
                        background: 'linear-gradient(135deg, #6366f1, #7c3aed)',
                        boxShadow: '0 4px 16px rgba(99,102,241,0.35)',
                        opacity: followUpLoading ? 0.7 : 1,
                      }}
                      whileHover={!followUpLoading ? { scale: 1.01 } : {}}
                      whileTap={!followUpLoading ? { scale: 0.98 } : {}}
                    >
                      {followUpLoading === selectedReply.id ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Send size={13} />
                      )}
                      Send this Follow-up
                    </motion.button>
                  </div>
                )}
              </div>
            )}

            {selectedReply.follow_up_sent && (
              <div
                className="flex items-center gap-2.5 p-3.5 rounded-xl text-sm"
                style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', color: '#34d399' }}
              >
                <Send size={13} />
                Follow-up already sent for this reply.
              </div>
            )}
          </div>
        )}
      </Modal>
    </AppShell>
  )
}
