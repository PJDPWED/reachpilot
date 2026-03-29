-- ============================================================
-- ReachPilot — Supabase PostgreSQL Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Gmail Tokens ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS gmail_tokens (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email    TEXT NOT NULL UNIQUE,
  access_token  TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expiry_date   BIGINT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Campaigns ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS campaigns (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name       TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending', 'running', 'paused', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS campaigns_status_idx ON campaigns(status);

-- ─── Leads ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS leads (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id  UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  email        TEXT NOT NULL,
  subject      TEXT,
  body         TEXT,
  status       TEXT NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending', 'queued', 'sending', 'sent', 'failed', 'replied')),
  message_id   TEXT,
  thread_id    TEXT,
  scheduled_at TIMESTAMPTZ,
  sent_at      TIMESTAMPTZ,
  retry_count  INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS leads_campaign_id_idx  ON leads(campaign_id);
CREATE INDEX IF NOT EXISTS leads_status_idx       ON leads(status);
CREATE INDEX IF NOT EXISTS leads_scheduled_at_idx ON leads(scheduled_at);
CREATE INDEX IF NOT EXISTS leads_thread_id_idx    ON leads(thread_id);

-- ─── Logs ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS logs (
  id        UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id   UUID REFERENCES leads(id) ON DELETE SET NULL,
  event     TEXT NOT NULL,
  metadata  JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS logs_lead_id_idx  ON logs(lead_id);
CREATE INDEX IF NOT EXISTS logs_timestamp_idx ON logs(timestamp DESC);

-- ─── Replies ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS replies (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id         UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  message_id      TEXT NOT NULL UNIQUE,
  thread_id       TEXT NOT NULL,
  content         TEXT NOT NULL,
  classification  TEXT CHECK (classification IN ('YES', 'NO', 'NEUTRAL')),
  follow_up_sent  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS replies_lead_id_idx        ON replies(lead_id);
CREATE INDEX IF NOT EXISTS replies_classification_idx ON replies(classification);
CREATE INDEX IF NOT EXISTS replies_thread_id_idx      ON replies(thread_id);

-- ─── Row Level Security (disable for service role access) ────────────────

ALTER TABLE gmail_tokens DISABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns    DISABLE ROW LEVEL SECURITY;
ALTER TABLE leads        DISABLE ROW LEVEL SECURITY;
ALTER TABLE logs         DISABLE ROW LEVEL SECURITY;
ALTER TABLE replies      DISABLE ROW LEVEL SECURITY;

-- ─── Helpful view: Campaign summary ──────────────────────────────────────

CREATE OR REPLACE VIEW campaign_summary AS
SELECT
  c.id,
  c.name,
  c.status,
  c.created_at,
  COUNT(l.id)                                          AS total_leads,
  COUNT(l.id) FILTER (WHERE l.status IN ('sent', 'replied')) AS sent_leads,
  COUNT(l.id) FILTER (WHERE l.status = 'failed')       AS failed_leads,
  COUNT(l.id) FILTER (WHERE l.status = 'replied')      AS replied_leads
FROM campaigns c
LEFT JOIN leads l ON l.campaign_id = c.id
GROUP BY c.id;
