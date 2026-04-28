-- ─── Migration 003: CV Evaluations + Lead Error Column ───────────────────────
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query → Run)

-- ─── 1. Add last_error column to leads table ─────────────────────────────────
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS last_error TEXT DEFAULT NULL;

COMMENT ON COLUMN leads.last_error IS
  'Human-readable error from the last send attempt (Gmail/Resend specific message). Populated by the queue processor on failure.';

-- ─── 2. Create cv_evaluations table ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cv_evaluations (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email    TEXT        NOT NULL,
  score         INTEGER     NOT NULL CHECK (score >= 0 AND score <= 100),
  grade         TEXT        NOT NULL,
  strengths     JSONB       NOT NULL DEFAULT '[]',
  improvements  JSONB       NOT NULL DEFAULT '[]',
  ausbildung_tips JSONB     NOT NULL DEFAULT '[]',
  summary       TEXT        NOT NULL DEFAULT '',
  language      TEXT        NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'de', 'fr')),
  file_name     TEXT        DEFAULT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast per-user history queries
CREATE INDEX IF NOT EXISTS idx_cv_evaluations_user_email
  ON cv_evaluations (user_email, created_at DESC);

-- ─── 3. Row Level Security ────────────────────────────────────────────────────
ALTER TABLE cv_evaluations ENABLE ROW LEVEL SECURITY;

-- Service role bypass (used by API routes with SUPABASE_SERVICE_ROLE_KEY)
CREATE POLICY IF NOT EXISTS "service_role_all" ON cv_evaluations
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ─── 4. Storage bucket for campaign attachments (if not yet created) ─────────
-- Run this only if the bucket doesn't exist yet:
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('campaign-attachments', 'campaign-attachments', true)
-- ON CONFLICT DO NOTHING;
