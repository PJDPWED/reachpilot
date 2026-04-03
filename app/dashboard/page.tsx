'use client'

import { useEffect, useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { FadeIn, StaggerList, StaggerItem } from '@/components/animations/FadeIn'
import { CountUp } from '@/components/ui/CountUp'
import { EmptyState } from '@/components/ui/EmptyState'
import { RocketHero } from '@/components/ui/RocketHero'
import { CooldownController } from '@/components/ui/CooldownController'
import { motion } from 'framer-motion'
import {
  Send, XCircle, MessageSquare, Layers,
  TrendingUp, ThumbsUp, ThumbsDown, Minus,
  Activity, ArrowUpRight, Clock, Zap,
} from 'lucide-react'
import { formatRelative, truncate } from '@/utils/helpers'
import type { DashboardStats } from '@/types'
import Link from 'next/link'

// ─── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({
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
      <motion.div
        className="relative pixel-surface overflow-hidden group cursor-default min-h-[120px]"
        style={{ padding: '20px' }}
        whileHover={{ borderColor: accent, y: -2 }}
        transition={{ duration: 0.1 }}
      >
        {/* Top accent bar */}
        <div
          className="absolute inset-x-0 top-0 h-[2px]"
          style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }}
        />

        {/* Corner accent */}
        <div
          className="absolute top-0 right-0 w-10 h-10"
          style={{ background: `linear-gradient(225deg, ${accent}20, transparent 70%)` }}
        />

        {/* Icon */}
        <div
          className="w-9 h-9 flex items-center justify-center mb-4 relative"
          style={{
            background: `${accent}15`,
            border: `2px solid ${accent}40`,
          }}
        >
          <Icon size={15} style={{ color: accent }} />
        </div>

        {/* Value */}
        <div
          className="text-3xl text-white mb-1 font-mono"
          style={{ letterSpacing: '0.06em' }}
        >
          <CountUp end={value} duration={1.4} pixel />
        </div>

        {/* Label */}
        <div
          className="tracking-widest uppercase font-mono"
          style={{ fontSize: '12px', color: 'rgba(255,255,255,0.30)', letterSpacing: '0.12em' }}
        >
          {label}
        </div>

        {subtitle && (
          <div
            className="mt-1 font-mono"
            style={{ fontSize: '13px', color: 'rgba(255,255,255,0.20)' }}
          >
            {subtitle}
          </div>
        )}

        {/* Glow on hover */}
        <div
          className="absolute -top-8 -right-8 w-20 h-20 rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-300"
          style={{ background: `radial-gradient(circle, ${accent}, transparent 70%)` }}
        />
      </motion.div>
    </FadeIn>
  )
}

// ─── Reply Bar ──────────────────────────────────────────────────────────────────

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
          <div style={{ width: 6, height: 6, background: color, imageRendering: 'pixelated' }} />
          <Icon size={11} style={{ color }} />
          <span style={{ fontFamily: "'VT323', monospace", fontSize: '16px', color: 'rgba(255,255,255,0.55)', letterSpacing: '0.04em' }}>
            {label.toUpperCase()}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span style={{ fontFamily: "'VT323', monospace", fontSize: '22px', color: '#fff', letterSpacing: '0.06em' }}>
            {count}
          </span>
          {total > 0 && (
            <span style={{ fontFamily: "'VT323', monospace", fontSize: '14px', color: 'rgba(255,255,255,0.25)' }}>
              {Math.round(pct)}%
            </span>
          )}
        </div>
      </div>
      <div
        style={{
          height: 6,
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <motion.div
          style={{ height: '100%', background: color, imageRendering: 'pixelated' }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.2, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </div>
  )
}

// ─── Dashboard Page ─────────────────────────────────────────────────────────────

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
      <FadeIn direction="down" duration={0.4}>
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1
              className="text-white leading-none mb-1 font-sans"
              style={{ fontSize: '2.8rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}
            >
              COMMAND CENTER
            </h1>
            <p
              className="tracking-widest uppercase font-sans"
              style={{ fontSize: '13px', color: 'rgba(255,0,0,0.55)', letterSpacing: '0.14em' }}
            >
              // OUTREACH INTELLIGENCE DASHBOARD
            </p>
          </div>
          <Link
            href="/upload"
            className="flex items-center gap-2 px-5 py-2.5 relative overflow-hidden group"
            style={{
              background: '#FF0000',
              border: '2px solid #FF0000',
              color: '#000',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '18px',
              letterSpacing: '0.10em',
              textTransform: 'uppercase',
              fontWeight: 700,
              transition: 'all 0.1s steps(2)',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLAnchorElement).style.background = '#FFCE00'
              ;(e.currentTarget as HTMLAnchorElement).style.borderColor = '#FFCE00'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLAnchorElement).style.background = '#FF0000'
              ;(e.currentTarget as HTMLAnchorElement).style.borderColor = '#FF0000'
            }}
          >
            <Send size={13} className="relative z-10" />
            <span className="relative z-10">NEW CAMPAIGN</span>
            <ArrowUpRight size={12} className="opacity-70 relative z-10" />
          </Link>
        </div>
      </FadeIn>

      {/* Hero */}
      <RocketHero />

      {loading ? (
        <div className="flex items-center justify-center py-28">
          <div className="flex flex-col items-center gap-4">
            <div className="flex gap-1.5">
              {[0, 1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  style={{ width: 6, height: 6, background: '#FF0000', imageRendering: 'pixelated' }}
                  animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.3, 0.8] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                />
              ))}
            </div>
            <span
              className="tracking-widest uppercase animate-pixel-flicker"
              style={{ fontFamily: "'VT323', monospace", fontSize: '16px', color: 'rgba(255,0,0,0.55)', letterSpacing: '0.14em' }}
            >
              LOADING STATS...
            </span>
          </div>
        </div>
      ) : stats ? (
        <>
          {/* Cooldown Controller */}
          <FadeIn delay={0.1}>
            <div className="mb-5">
              <CooldownController
                cooldownUntil={null}
                onSend={() => {}}
                isSending={false}
                campaignStatus="pending"
              />
            </div>
          </FadeIn>

          {/* Stats grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-5">
            <StatCard label="CAMPAIGNS" value={stats.totalCampaigns} icon={Layers}       accent="#FF0000" delay={0}    />
            <StatCard label="SENT"      value={stats.totalSent}      icon={Send}         accent="#FFCE00" delay={0.07}  subtitle={`OF ${stats.totalLeads} LEADS`} />
            <StatCard label="FAILED"    value={stats.totalFailed}    icon={XCircle}      accent="#ff4400" delay={0.14}  />
            <StatCard label="REPLIES"   value={stats.totalReplies}   icon={MessageSquare} accent="#ffffff" delay={0.21} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
            {/* Reply breakdown */}
            <FadeIn delay={0.25} className="lg:col-span-2">
              <div className="pixel-surface h-full" style={{ padding: '20px' }}>
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <div style={{ width: 6, height: 6, background: '#FFCE00', imageRendering: 'pixelated' }} />
                    <TrendingUp size={13} style={{ color: '#FFCE00' }} />
                    <span style={{ fontFamily: "'VT323', monospace", fontSize: '14px', color: '#FFCE00', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                      REPLY BREAKDOWN
                    </span>
                  </div>
                  {stats.totalReplies > 0 && (
                    <span
                      style={{
                        fontFamily: "'VT323', monospace",
                        fontSize: '14px',
                        color: '#FFCE00',
                        background: 'rgba(255,206,0,0.08)',
                        border: '2px solid rgba(255,206,0,0.3)',
                        padding: '1px 8px',
                      }}
                    >
                      {stats.totalReplies} TOTAL
                    </span>
                  )}
                </div>
                <div className="space-y-4">
                  <ReplyBar label="Interested"     count={stats.totalYes}     total={stats.totalReplies} color="#FFCE00" icon={ThumbsUp}   />
                  <ReplyBar label="Not Interested" count={stats.totalNo}      total={stats.totalReplies} color="#FF0000" icon={ThumbsDown} />
                  <ReplyBar label="Neutral"        count={stats.totalNeutral} total={stats.totalReplies} color="rgba(255,255,255,0.35)" icon={Minus} />
                </div>

                {stats.totalReplies > 0 && stats.totalYes > 0 && (
                  <motion.div
                    className="mt-5 p-3 flex items-center gap-3"
                    style={{ background: 'rgba(255,206,0,0.06)', border: '2px solid rgba(255,206,0,0.20)' }}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    <Zap size={13} style={{ color: '#FFCE00' }} />
                    <span style={{ fontFamily: "'VT323', monospace", fontSize: '16px', color: '#FFCE00', letterSpacing: '0.06em' }}>
                      {Math.round((stats.totalYes / stats.totalReplies) * 100)}% POSITIVE REPLY RATE
                    </span>
                  </motion.div>
                )}
              </div>
            </FadeIn>

            {/* Delivery ring */}
            <FadeIn delay={0.3}>
              <div className="pixel-surface h-full flex flex-col" style={{ padding: '20px' }}>
                <div className="flex items-center gap-2 mb-4">
                  <div style={{ width: 6, height: 6, background: '#FF0000', imageRendering: 'pixelated' }} />
                  <Activity size={13} style={{ color: '#FF0000' }} />
                  <span style={{ fontFamily: "'VT323', monospace", fontSize: '14px', color: '#FF0000', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                    DELIVERY
                  </span>
                </div>

                {stats.totalLeads > 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center py-4">
                    <div className="relative w-28 h-28 mb-4">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,0,0,0.10)" strokeWidth="8" />
                        <motion.circle
                          cx="50" cy="50" r="42"
                          fill="none"
                          stroke="url(#rl-grad)"
                          strokeWidth="8"
                          strokeLinecap="square"
                          strokeDasharray={`${2 * Math.PI * 42}`}
                          initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
                          animate={{ strokeDashoffset: 2 * Math.PI * 42 * (1 - stats.totalSent / stats.totalLeads) }}
                          transition={{ duration: 1.5, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        />
                        <defs>
                          <linearGradient id="rl-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#FF0000" />
                            <stop offset="100%" stopColor="#FFCE00" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span
                          className="text-white"
                          style={{ fontFamily: "'VT323', monospace", fontSize: '2rem', letterSpacing: '0.06em' }}
                        >
                          {Math.round((stats.totalSent / stats.totalLeads) * 100)}
                          <span style={{ fontSize: '1.2rem', color: 'rgba(255,255,255,0.35)' }}>%</span>
                        </span>
                      </div>
                    </div>
                    <p style={{ fontFamily: "'VT323', monospace", fontSize: '15px', color: 'rgba(255,255,255,0.30)', textAlign: 'center', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                      <span style={{ color: 'rgba(255,255,255,0.65)' }}>{stats.totalSent}</span>
                      {' '}OF{' '}
                      <span style={{ color: 'rgba(255,255,255,0.65)' }}>{stats.totalLeads}</span>
                      {' '}DELIVERED
                    </p>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center gap-2">
                    <div style={{ width: 6, height: 6, background: 'rgba(255,255,255,0.10)', imageRendering: 'pixelated' }} />
                    <p style={{ fontFamily: "'VT323', monospace", fontSize: '15px', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase' }}>
                      NO DATA YET
                    </p>
                  </div>
                )}
              </div>
            </FadeIn>
          </div>

          {/* Activity Feed */}
          <FadeIn delay={0.35}>
            <div className="pixel-surface overflow-hidden">
              <div
                className="flex items-center justify-between px-5 py-4"
                style={{ borderBottom: '2px solid rgba(255,0,0,0.18)' }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 animate-pixel-blink" style={{ background: '#FF0000', imageRendering: 'pixelated' }} />
                  <Clock size={12} style={{ color: '#FF0000' }} />
                  <span style={{ fontFamily: "'VT323', monospace", fontSize: '14px', color: '#FF0000', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                    ACTIVITY LOG
                  </span>
                </div>
                <Link
                  href="/campaigns"
                  className="flex items-center gap-1"
                  style={{ fontFamily: "'VT323', monospace", fontSize: '14px', color: 'rgba(255,206,0,0.6)', letterSpacing: '0.08em', textTransform: 'uppercase' }}
                >
                  VIEW CAMPAIGNS <ArrowUpRight size={10} />
                </Link>
              </div>

              {stats.recentLogs.length === 0 ? (
                <div className="px-5 py-12 text-center">
                  <div className="w-4 h-4 mx-auto mb-3 animate-pixel-blink" style={{ background: 'rgba(255,0,0,0.15)', imageRendering: 'pixelated' }} />
                  <p style={{ fontFamily: "'VT323', monospace", fontSize: '17px', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    NO ACTIVITY YET. START A CAMPAIGN.
                  </p>
                </div>
              ) : (
                <StaggerList>
                  {stats.recentLogs.map((log) => (
                    <StaggerItem key={log.id}>
                      <div
                        className="flex items-start gap-3 px-5 py-3"
                        style={{ borderBottom: '1px solid rgba(255,0,0,0.08)' }}
                        onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,0,0,0.03)'}
                        onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}
                      >
                        <div
                          className="mt-1.5 shrink-0"
                          style={{
                            width: 6, height: 6,
                            imageRendering: 'pixelated',
                            background: log.event.includes('[FAILED]')
                              ? '#FF0000'
                              : log.event.includes('[RETRY')
                              ? '#FFCE00'
                              : 'rgba(255,255,255,0.4)',
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <p
                            style={{
                              fontFamily: "'VT323', monospace",
                              fontSize: '16px',
                              color: log.event.includes('[FAILED]')
                                ? '#FF0000'
                                : log.event.includes('[RETRY')
                                ? '#FFCE00'
                                : 'rgba(255,255,255,0.50)',
                              letterSpacing: '0.03em',
                            }}
                          >
                            {truncate(log.event, 90)}
                          </p>
                        </div>
                        <span
                          className="shrink-0 mt-0.5"
                          style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: 'rgba(255,255,255,0.20)' }}
                        >
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
          title="FAILED TO LOAD STATS"
          description="Could not connect to Supabase. Check your environment configuration."
        />
      )}
    </AppShell>
  )
}
