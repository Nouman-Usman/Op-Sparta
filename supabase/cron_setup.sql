-- =============================================================================
-- Supabase Cron Setup — Auto-publish scheduled Instagram posts
-- =============================================================================
-- Run this once in: Supabase Dashboard → SQL Editor
--
-- Before running, replace the two placeholders:
--   • <YOUR_APP_URL>   → your production domain, e.g. https://op-sparta.vercel.app
--   • <YOUR_CRON_SECRET> → the value of CRON_SECRET in your .env / Vercel env vars
--
-- Prerequisites (enable once in Dashboard → Database → Extensions):
--   • pg_cron
--   • pg_net
-- =============================================================================

-- Step 1: Enable extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Step 2: Store the app URL and cron secret as database settings
--         so the cron body does not hardcode sensitive values.
ALTER DATABASE postgres
  SET app.site_url   = '<YOUR_APP_URL>';

ALTER DATABASE postgres
  SET app.cron_secret = '<YOUR_CRON_SECRET>';

-- Step 3: Remove existing job if re-running this script
SELECT cron.unschedule('publish-scheduled-posts')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'publish-scheduled-posts'
);

-- Step 4: Schedule the cron job — runs every 15 minutes
SELECT cron.schedule(
  'publish-scheduled-posts',         -- unique job name
  '*/15 * * * *',                    -- every 15 minutes
  $$
  SELECT net.http_get(
    url              := current_setting('app.site_url') || '/api/cron/publish-scheduled',
    headers          := jsonb_build_object(
                          'Authorization',
                          'Bearer ' || current_setting('app.cron_secret')
                        ),
    timeout_milliseconds := 20000
  ) AS request_id;
  $$
);

-- =============================================================================
-- Verification queries (run separately to confirm setup)
-- =============================================================================

-- List all scheduled cron jobs:
-- SELECT * FROM cron.job;

-- Check recent job run history:
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 20;

-- Check pg_net request results (async):
-- SELECT * FROM net._http_response ORDER BY created DESC LIMIT 10;
