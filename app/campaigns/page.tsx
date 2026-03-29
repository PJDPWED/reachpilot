'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AppShell } from '@/components/layout/AppShell'
import { StatusBadge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { Send, Upload, ChevronRight, Trash2 } from 'lucide-react'
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

  useEffect(() => {
    fetchCampaigns()
  }, [])

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

  return (
    <AppShell>
      <div className="animate-slide-up">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Campaigns</h1>
            <p className="text-gray-500 text-sm mt-1">Manage and track your email campaigns</p>
          </div>
          <Link href="/upload" className="btn-primary">
            <Upload size={15} />
            New Campaign
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner size={24} />
          </div>
        ) : campaigns.length === 0 ? (
          <EmptyState
            icon={Send}
            title="No campaigns yet"
            description="Upload a file to create your first campaign and start sending outreach emails."
            action={
              <Link href="/upload" className="btn-primary">
                <Upload size={15} />
                Create Campaign
              </Link>
            }
          />
        ) : (
          <div className="space-y-3">
            {campaigns.map((campaign) => (
              <div key={campaign.id} className="card hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4 p-5">
                  {/* Status indicator */}
                  <div
                    className={`w-2 h-10 rounded-full shrink-0 ${
                      campaign.status === 'running'
                        ? 'bg-blue-400'
                        : campaign.status === 'completed'
                        ? 'bg-green-400'
                        : campaign.status === 'failed'
                        ? 'bg-red-400'
                        : campaign.status === 'paused'
                        ? 'bg-yellow-400'
                        : 'bg-gray-200'
                    }`}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-gray-900 truncate">{campaign.name}</h3>
                      <StatusBadge status={campaign.status} />
                    </div>
                    <p className="text-xs text-gray-400">{formatDate(campaign.created_at)}</p>
                  </div>

                  {/* Stats */}
                  <div className="hidden sm:flex items-center gap-6 text-center">
                    <div>
                      <div className="text-lg font-bold text-gray-800">
                        {(campaign.total_leads || 0).toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-400">Leads</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-green-600">
                        {(campaign.sent_leads || 0).toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-400">Sent</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-purple-600">
                        {(campaign.replied_leads || 0).toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-400">Replied</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        handleDelete(campaign.id, campaign.name)
                      }}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                    <Link
                      href={`/campaigns/${campaign.id}`}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                    >
                      <ChevronRight size={16} />
                    </Link>
                  </div>
                </div>

                {/* Progress bar for running campaigns */}
                {campaign.status === 'running' && campaign.total_leads && campaign.total_leads > 0 && (
                  <div className="px-5 pb-4">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Progress</span>
                      <span>
                        {campaign.sent_leads || 0}/{campaign.total_leads} sent
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-400 rounded-full transition-all"
                        style={{
                          width: `${((campaign.sent_leads || 0) / campaign.total_leads) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
