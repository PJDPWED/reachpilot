'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AppShell } from '@/components/layout/AppShell'
import { StatusBadge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { FadeIn, StaggerList, StaggerItem } from '@/components/animations/FadeIn'
import { motion } from 'framer-motion'
import { Send, Upload, ChevronRight, Trash2, ArrowUpRight } from 'lucide-react'
import { formatDate } from '@/utils/helpers'
import toast from 'react-hot-toast'
import type { Campaign } from '@/types'

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)

  const fetchCampaigns = async () => {
    try {
      const res = await fetch('/api/campaigns')
      const json = await res.json()
      if (json.success) setCampaigns(json.data || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCampaigns() }, [])

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete campaign "${name}"? This cannot be undone.`)) return
    try {
      const res = await fetch(`/api/campaigns/${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.success) {
        setCampaigns((prev) => prev.filter((c) => c.id !== id))
        toast.success('Campaign deleted')
      } else {
        toast.error('Failed to delete campaign')
      }
    } catch {
      toast.error('Failed to delete campaign')
    }
  }

  const accentByStatus: Record<string, string> = {
    running: '#60a5fa',
    completed: '#34d399',
    failed: '#f87171',
    paused: '#fbbf24',
    pending: '#ffffff',
  }

  return (
    <AppShell>
      {/* Header */}
      <FadeIn direction="down" duration={0.5}>
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="font-heading text-3xl text-white mb-1">Campaigns</h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Manage and track your email outreach campaigns
            </p>
          </div>
          <Link
            href="/upload"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white"
            style={{
              background: '#ffffff',
              color: '#000000',
              boxShadow: '0 4px 16px rgba(255,255,255,0.10)',
            }}
          >
            <Upload size={13} />
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
                style={{ background: 'rgba(255,255,255,0.65)' }}
                animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.1, 0.8] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </div>
        </div>
      ) : campaigns.length === 0 ? (
        <FadeIn>
          <EmptyState
            icon={Send}
            title="No campaigns yet"
            description="Upload a leads file to create your first campaign and start your outreach."
            action={
              <Link
                href="/upload"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white"
                style={{
                  background: '#ffffff',
                  color: '#000000',
                  boxShadow: '0 4px 16px rgba(255,255,255,0.10)',
                }}
              >
                <Upload size={13} />
                Create Campaign
              </Link>
            }
          />
        </FadeIn>
      ) : (
        <StaggerList className="space-y-3">
          {campaigns.map((campaign) => {
            const accent = accentByStatus[campaign.status] || '#ffffff'
            const total = campaign.total_leads || 0
            const sent = campaign.sent_leads || 0
            const replied = campaign.replied_leads || 0
            const progress = total > 0 ? (sent / total) * 100 : 0

            return (
              <StaggerItem key={campaign.id}>
                <div
                  className="rounded-2xl overflow-hidden transition-all duration-200 group"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    backdropFilter: 'blur(20px)',
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLDivElement
                    el.style.background = 'rgba(255,255,255,0.05)'
                    el.style.borderColor = 'rgba(255,255,255,0.11)'
                    el.style.transform = 'translateY(-1px)'
                    el.style.boxShadow = '0 8px 32px rgba(0,0,0,0.3)'
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLDivElement
                    el.style.background = 'rgba(255,255,255,0.03)'
                    el.style.borderColor = 'rgba(255,255,255,0.07)'
                    el.style.transform = 'translateY(0)'
                    el.style.boxShadow = 'none'
                  }}
                >
                  {/* Top accent stripe */}
                  {campaign.status === 'running' && (
                    <div
                      className="h-px animate-shimmer"
                      style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }}
                    />
                  )}

                  <div className="flex items-center gap-4 p-5">
                    {/* Status stripe */}
                    <div
                      className="w-1 h-10 rounded-full shrink-0"
                      style={{ background: accent, boxShadow: `0 0 8px ${accent}60` }}
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 mb-1">
                        <h3 className="font-semibold text-white truncate">{campaign.name}</h3>
                        <StatusBadge status={campaign.status} />
                      </div>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        Created {formatDate(campaign.created_at)}
                      </p>
                    </div>

                    {/* Stats */}
                    <div className="hidden sm:flex items-center gap-6 text-center">
                      {[
                        { label: 'Leads',   value: total,   color: 'var(--text-secondary)' },
                        { label: 'Sent',    value: sent,    color: '#34d399' },
                        { label: 'Replied', value: replied, color: 'rgba(255,255,255,0.70)' },
                      ].map(({ label, value, color }) => (
                        <div key={label}>
                          <div className="text-base font-semibold tabular-nums" style={{ color }}>{value.toLocaleString()}</div>
                          <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{label}</div>
                        </div>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5">
                      <motion.button
                        onClick={(e) => { e.preventDefault(); handleDelete(campaign.id, campaign.name) }}
                        className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
                        style={{ color: 'var(--text-muted)' }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = '#f87171'}
                        onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)'}
                      >
                        <Trash2 size={13} />
                      </motion.button>
                      <Link
                        href={`/campaigns/${campaign.id}`}
                        className="w-8 h-8 flex items-center justify-center rounded-lg transition-all"
                        style={{
                          background: 'rgba(255,255,255,0.06)',
                          color: 'rgba(255,255,255,0.70)',
                          border: '1px solid rgba(255,255,255,0.12)',
                        }}
                        onMouseEnter={e => {
                          (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.10)'
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.06)'
                        }}
                      >
                        <ChevronRight size={14} />
                      </Link>
                    </div>
                  </div>

                  {/* Progress bar for running campaigns */}
                  {(campaign.status === 'running' || campaign.status === 'paused') && total > 0 && (
                    <div className="px-5 pb-4">
                      <div className="flex justify-between text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>
                        <span>Progress</span>
                        <span>{sent}/{total} sent</span>
                      </div>
                      <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: `linear-gradient(90deg, ${accent}, ${accent}aa)` }}
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </StaggerItem>
            )
          })}
        </StaggerList>
      )}
    </AppShell>
  )
}
