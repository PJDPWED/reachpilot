-- ============================================================
-- Fix: Enable RLS + allow service_role full access on all tables
-- ============================================================

-- 1. Enable RLS on all tables
ALTER TABLE public.gmail_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.replies      ENABLE ROW LEVEL SECURITY;

-- 2. Grant service_role bypass policies (full access)
CREATE POLICY "service_role full access" ON public.gmail_tokens
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role full access" ON public.campaigns
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role full access" ON public.leads
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role full access" ON public.logs
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role full access" ON public.replies
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 3. Fix Security Definer view (campaign_summary)
-- Drop and recreate without SECURITY DEFINER
DROP VIEW IF EXISTS public.campaign_summary;

CREATE VIEW public.campaign_summary
WITH (security_invoker = true)
AS
SELECT
  c.id,
  c.name,
  c.status,
  c.created_at,
  COUNT(l.id)                                          AS total_leads,
  COUNT(l.id) FILTER (WHERE l.status = 'sent')         AS sent,
  COUNT(l.id) FILTER (WHERE l.status = 'failed')       AS failed,
  COUNT(l.id) FILTER (WHERE l.status = 'replied')      AS replied
FROM campaigns c
LEFT JOIN leads l ON l.campaign_id = c.id
GROUP BY c.id, c.name, c.status, c.created_at;