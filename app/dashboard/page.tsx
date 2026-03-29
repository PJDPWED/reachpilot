'use client'

import { useEffect, useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { Send, CheckCircle2, XCircle, MessageSquare, TrendingUp, Layers, ThumbsUp, ThumbsDown, Minus } from 'lucide-react'
import { formatRelative, truncate } from '@/utils/helpers'
import { Spinner } from '@/components/ui/Spinner'
import type { DashboardStats } from '@/types'
import Link from 'next/link'

interface StatCardProps {
  label: string
  value: number
  icon: React.ReactNode
  color: string
  subtitle?: string
}

function StatCard({ label, value, icon, color, subtitle }: StatCardProps) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          {icon}
        </div>
      </div>
      <div className="text-2xl font-bold text-gray-900 tabular-nums">{value.toLocaleString()}</div>
      <div className="text-sm text-gray-500 mt-0.5">{label}</div>
      {subtitle && <div className="text-xs text-gray-400 mt-1">{subtitle}</div>}
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
      <div className="animate-slide-up">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Overview of your outreach activity</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner size={24} />
          </div>
        ) : stats ? (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard
                label="Campaigns"
                value={stats.totalCampaigns}
                icon={<Layers size={18} className="text-brand-600" />}
                color="bg-brand-50"
              />
              <StatCard
                label="Emails Sent"
                value={stats.totalSent}
                icon={<Send size={18} className="text-green-600" />}
                color="bg-green-50"
                subtitle={`${stats.totalLeads} total leads`}
              />
              <StatCard
                label="Failed"
                value={stats.totalFailed}
                icon={<XCircle size={18} className="text-red-500" />}
                color="bg-red-50"
              />
              <StatCard
                label="Replies"
                value={stats.totalReplies}
                icon={<MessageSquare size={18} className="text-purple-600" />}
                color="bg-purple-50"
              />
            </div>

            {/* Reply breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
              <div className="card p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">Interested (YES)</span>
                  <ThumbsUp size={16} className="text-green-500" />
                </div>
                <div className="text-3xl font-bold text-green-600">{stats.totalYes}</div>
                {stats.totalReplies > 0 && (
                  <div className="text-xs text-gray-400 mt-1">
                    {Math.round((stats.totalYes / stats.totalReplies) * 100)}% of replies
                  </div>
                )}
                <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-400 rounded-full"
                    style={{
                      width: stats.totalReplies
                        ? `${(stats.totalYes / stats.totalReplies) * 100}%`
                        : '0%',
                    }}
                  />
                </div>
              </div>

              <div className="card p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">Not Interested (NO)</span>
                  <ThumbsDown size={16} className="text-red-400" />
                </div>
                <div className="text-3xl font-bold text-red-500">{stats.totalNo}</div>
                {stats.totalReplies > 0 && (
                  <div className="text-xs text-gray-400 mt-1">
                    {Math.round((stats.totalNo / stats.totalReplies) * 100)}% of replies
                  </div>
                )}
                <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-400 rounded-full"
                    style={{
                      width: stats.totalReplies
                        ? `${(stats.totalNo / stats.totalReplies) * 100}%`
                        : '0%',
                    }}
                  />
                </div>
              </div>

              <div className="card p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">Neutral</span>
                  <Minus size={16} className="text-gray-400" />
                </div>
                <div className="text-3xl font-bold text-gray-500">{stats.totalNeutral}</div>
                {stats.totalReplies > 0 && (
                  <div className="text-xs text-gray-400 mt-1">
                    {Math.round((stats.totalNeutral / stats.totalReplies) * 100)}% of replies
                  </div>
                )}
                <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gray-300 rounded-full"
                    style={{
                      width: stats.totalReplies
                        ? `${(stats.totalNeutral / stats.totalReplies) * 100}%`
                        : '0%',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Delivery rate */}
            {stats.totalLeads > 0 && (
              <div className="card p-5 mb-8">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">Delivery Rate</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {stats.totalSent} sent out of {stats.totalLeads} total leads
                    </p>
                  </div>
                  <div className="text-2xl font-bold text-brand-600">
                    {Math.round((stats.totalSent / stats.totalLeads) * 100)}%
                  </div>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-500 rounded-full transition-all duration-700"
                    style={{ width: `${(stats.totalSent / stats.totalLeads) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Recent logs */}
            <div className="card">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                <h3 className="font-semibold text-gray-900">Activity Feed</h3>
                <Link href="/campaigns" className="text-xs text-brand-600 hover:text-brand-700 font-medium">
                  View campaigns →
                </Link>
              </div>
              {stats.recentLogs.length === 0 ? (
                <div className="px-5 py-8 text-center text-sm text-gray-400">
                  No activity yet. Start a campaign to see logs here.
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {stats.recentLogs.map((log) => (
                    <div key={log.id} className="flex items-start gap-3 px-5 py-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-brand-300 mt-2 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700">{truncate(log.event, 90)}</p>
                      </div>
                      <span className="text-xs text-gray-400 shrink-0 mt-0.5">
                        {formatRelative(log.timestamp)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-20 text-gray-400">Failed to load stats</div>
        )}
      </div>
    </AppShell>
  )
}
