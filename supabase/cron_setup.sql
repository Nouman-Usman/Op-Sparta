
-- =============================================================================
-- Supabase Cron Setup — Auto-publish scheduled Instagram posts
-- =============================================================================
-- Run this once in: Supabase Dashboard → SQL Editor
--
-- BEFORE RUNNING: fill in the two values below.
--   APP_URL     → your production domain, e.g. https://op-sparta.vercel.app
--   CRON_SECRET → the value of CRON_SECRET in your .env / Vercel env vars
--
-- Prerequisites (enable once in Dashboard → Database → Extensions):
--   • pg_cron
--   • pg_net
-- =============================================================================

-- ❶ Enable extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ❷ Remove any existing job before re-scheduling
SELECT cron.unschedule('publish-scheduled-posts')
FROM cron.job
WHERE jobname = 'publish-scheduled-posts';

-- ❸ Schedule — every minute for timely publishing
SELECT cron.schedule(
  'publish-scheduled-posts',
  '* * * * *',
  $$
  SELECT net.http_get(
    url                  := 'https://sparta-ai-aut.vercel.app/api/cron/publish-scheduled',
    headers              := '{"Authorization": "Bearer J_X8QEmO66RH0yXrhDVIVktHd9KRO1JDsmQCOYkd3JgW2zMTsBC0vynny9hDd0HA"}'::jsonb,
    timeout_milliseconds := 30000
  ) AS request_id;
  $$
);

-- =============================================================================
-- Verification (run these separately after setup)
-- =============================================================================
-- Confirm job is registered:
--   SELECT jobid, jobname, schedule, active FROM cron.job;
--
-- Watch recent run history:
--   SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 20;
--
-- Inspect async HTTP responses from pg_net:
--   SELECT id, status_code, content FROM net._http_response ORDER BY created DESC LIMIT 10;
