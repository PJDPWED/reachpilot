'use client'

import { useEffect, useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { FadeIn, StaggerList, StaggerItem } from '@/components/animations/FadeIn'
import { CountUp } from '@/components/ui/CountUp'
import { EmptyState } from '@/components/ui/EmptyState'
import { motion } from 'framer-motion'
import {
  Send, XCircle, MessageSquare, Layers,
  TrendingUp, ThumbsUp, ThumbsDown, Minus,
  Activity, ArrowUpRight, Clock,
} from 'lucide-react'
import { formatRelative, truncate } from '@/utils/helpers'
import type { DashboardStats } from '@/types'
import Link from 'next/link'

function GlassStatCard({
  label, value, icon: Icon, accent, subtitle, delay = 0,
}: {
  label: string
  value: number
  icon: React.ElementType
  accent: string
  subtitle?: string
  delay?: number
}) {
  return (
    <FadeIn direction="up" delay={delay}>
      <div
        className="relative p-5 rounded-2xl overflow-hidden group cursor-default"
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
          backdropFilter: 'blur(20px)',
          transition: 'all 0.3s ease',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.055)'
          ;(e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.12)'
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.03)'
          ;(e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.07)'
        }}
      >
        {/* Top highlight */}
        <div className="absolute inset-x-0 top-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)' }} />

        {/* Icon */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
          style={{ background: `${accent}1a`, border: `1px solid ${accent}30` }}
        >
          <Icon size={17} style={{ color: accent }} />
        </div>

        {/* Value */}
        <div className="font-heading text-3xl text-white mb-1 tabular-nums">
          <CountUp end={value} duration={1.4} />
        </div>
        <div className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{label}</div>
        {subtitle && (
          <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{subtitle}</div>
        )}

        {/* Corner glow */}
        <div
          className="absolute -top-6 -right-6 w-20 h-20 rounded-full opacity-20 group-hover:opacity-40 transition-opacity"
          style={{ background: `radial-gradient(circle, ${accent}, transparent 70%)` }}
        />
      </div>
    </FadeIn>
  )
}

function ReplyBar({
  label, count, total, color, icon: Icon,
}: {
  label: string; count: number; total: number; color: string; icon: React.ElementType
}) {
  const pct = total > 0 ? (count / total) * 100 : 0
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon size={13} style={{ color }} />
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-heading text-lg text-white">{count}</span>
          {total > 0 && (
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {Math.round(pct)}%
            </span>
          )}
        </div>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.2, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/dashboard/stats')
        const json = await res.json()
        if (json.success) setStats(json.data)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  return (
    <AppShell>
      {/* Header */}
      <FadeIn direction="down" duration={0.5}>
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="font-heading text-3xl text-white mb-1">Dashboard</h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Overview of your outreach activity
            </p>
          </div>
          <Link
            href="/upload"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white"
            style={{
              background: 'linear-gradient(135deg, #6366f1, #7c3aed)',
              boxShadow: '0 4px 16px rgba(99,102,241,0.35)',
            }}
          >
            <Send size={13} />
            New Campaign
            <ArrowUpRight size={12} className="opacity-70" />
          </Link>
        </div>
      </FadeIn>

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
      ) : stats ? (
        <>
          {/* Stats grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <GlassStatCard label="Campaigns"  value={stats.totalCampaigns} icon={Layers}        accent="#6366f1" delay={0}    />
            <GlassStatCard label="Emails Sent" value={stats.totalSent}      icon={Send}          accent="#34d399" delay={0.07} subtitle={`${stats.totalLeads} total leads`} />
            <GlassStatCard label="Failed"       value={stats.totalFailed}    icon={XCircle}       accent="#f87171" delay={0.14} />
            <GlassStatCard label="Replies"      value={stats.totalReplies}   icon={MessageSquare} accent="#a78bfa" delay={0.21} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
            {/* Reply breakdown */}
            <FadeIn delay={0.25} className="lg:col-span-2">
              <div
                className="p-5 rounded-2xl"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  backdropFilter: 'blur(20px)',
                }}
              >
                <div className="flex items-center gap-2 mb-5">
                  <TrendingUp size={15} style={{ color: 'var(--accent-light)' }} />
                  <h3 className="text-sm font-semibold text-white">Reply Breakdown</h3>
                </div>
                <div className="space-y-4">
                  <ReplyBar label="Interested"     count={stats.totalYes}     total={stats.totalReplies} color="#34d399" icon={ThumbsUp}   />
                  <ReplyBar label="Not Interested"  count={stats.totalNo}      total={stats.totalReplies} color="#f87171" icon={ThumbsDown} />
                  <ReplyBar label="Neutral"          count={stats.totalNeutral} total={stats.totalReplies} color="#94a3b8" icon={Minus}      />
                </div>
              </div>
            </FadeIn>

            {/* Delivery rate */}
            <FadeIn delay={0.3}>
              <div
                className="p-5 rounded-2xl h-full flex flex-col"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  backdropFilter: 'blur(20px)',
                }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <Activity size={15} style={{ color: 'var(--accent-light)' }} />
                  <h3 className="text-sm font-semibold text-white">Delivery Rate</h3>
                </div>

                {stats.totalLeads > 0 ? (
                  <>
                    {/* Radial-style big number */}
                    <div className="flex-1 flex flex-col items-center justify-center py-4">
                      <div className="relative w-28 h-28 mb-4">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="7" />
                          <motion.circle
                            cx="50" cy="50" r="42"
                            fill="none"
                            stroke="url(#grad)"
                            strokeWidth="7"
                            strokeLinecap="round"
                            strokeDasharray={`${2 * Math.PI * 42}`}
                            initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
                            animate={{ strokeDashoffset: 2 * Math.PI * 42 * (1 - stats.totalSent / stats.totalLeads) }}
                            transition={{ duration: 1.5, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                          />
                          <defs>
                            <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor="#6366f1" />
                              <stop offset="100%" stopColor="#8b5cf6" />
                            </linearGradient>
                          </defs>
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="font-heading text-2xl text-white">
                            {Math.round((stats.totalSent / stats.totalLeads) * 100)}%
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
                        {stats.totalSent} sent of {stats.totalLeads} leads
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <p className="text-sm text-center" style={{ color: 'var(--text-muted)' }}>No data yet</p>
                  </div>
                )}
              </div>
            </FadeIn>
          </div>

          {/* Activity Feed */}
          <FadeIn delay={0.35}>
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
                backdropFilter: 'blur(20px)',
              }}
            >
              <div
                className="flex items-center justify-between px-5 py-4"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div className="flex items-center gap-2">
                  <Clock size={14} style={{ color: 'var(--accent-light)' }} />
                  <h3 className="text-sm font-semibold text-white">Activity Feed</h3>
                </div>
                <Link
                  href="/campaigns"
                  className="flex items-center gap-1 text-xs font-medium"
                  style={{ color: 'var(--accent-light)' }}
                >
                  View campaigns <ArrowUpRight size={11} />
                </Link>
              </div>

              {stats.recentLogs.length === 0 ? (
                <div className="px-5 py-10 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                  No activity yet. Start a campaign to see logs here.
                </div>
              ) : (
                <StaggerList>
                  {stats.recentLogs.map((log) => (
                    <StaggerItem key={log.id}>
                      <div
                        className="flex items-start gap-3 px-5 py-3"
                        style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                      >
                        <div
                          className="w-1.5 h-1.5 rounded-full mt-2 shrink-0"
                          style={{ background: 'var(--accent)', boxShadow: '0 0 6px var(--accent)' }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                            {truncate(log.event, 90)}
                          </p>
                        </div>
                        <span className="text-xs shrink-0 mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          {formatRelative(log.timestamp)}
                        </span>
                      </div>
                    </StaggerItem>
                  ))}
                </StaggerList>
              )}
            </div>
          </FadeIn>
        </>
      ) : (
        <EmptyState
          icon={Activity}
          title="Failed to load stats"
          description="Could not connect to the database. Check your Supabase configuration."
        />
      )}
    </AppShell>
  )
}
