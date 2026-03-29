// ─── Database Types ────────────────────────────────────────────────────────

export type CampaignStatus = 'pending' | 'running' | 'paused' | 'completed' | 'failed'

export interface Campaign {
  id: string
  name: string
  status: CampaignStatus
  created_at: string
  // virtual counts joined in queries
  total_leads?: number
  sent_leads?: number
  failed_leads?: number
  replied_leads?: number
}

export type LeadStatus = 'pending' | 'queued' | 'sending' | 'sent' | 'failed' | 'replied'

export interface Lead {
  id: string
  campaign_id: string
  email: string
  subject: string | null
  body: string | null
  status: LeadStatus
  message_id: string | null
  thread_id: string | null
  scheduled_at: string | null
  sent_at: string | null
  retry_count: number
  created_at: string
}

export interface Log {
  id: string
  lead_id: string
  event: string
  metadata: Record<string, unknown> | null
  timestamp: string
  // joined
  lead?: Pick<Lead, 'email'>
}

export type ReplyClassification = 'YES' | 'NO' | 'NEUTRAL' | null

export interface Reply {
  id: string
  lead_id: string
  message_id: string
  thread_id: string
  content: string
  classification: ReplyClassification
  follow_up_sent: boolean
  created_at: string
  // joined
  lead?: Pick<Lead, 'email' | 'campaign_id'>
}

export interface GmailToken {
  id: string
  user_email: string
  access_token: string
  refresh_token: string
  expiry_date: number
  created_at: string
  updated_at: string
}

// ─── Parser Types ──────────────────────────────────────────────────────────

export interface ParsedLead {
  email: string
  subject?: string
  body?: string
}

export type ParsedLeadWithAI = Required<ParsedLead>

// ─── API Response Types ────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

// ─── Dashboard Stats ───────────────────────────────────────────────────────

export interface DashboardStats {
  totalCampaigns: number
  totalLeads: number
  totalSent: number
  totalFailed: number
  totalReplies: number
  totalYes: number
  totalNo: number
  totalNeutral: number
  recentLogs: Log[]
}

// ─── AI Types ─────────────────────────────────────────────────────────────

export interface GeneratedEmail {
  subject: string
  body: string
}

export interface ClassifiedReply {
  classification: 'YES' | 'NO' | 'NEUTRAL'
  confidence: number
  reasoning: string
}

export interface GeneratedFollowUp {
  subject: string
  body: string
}
