-- Remove the scheduled cron job
SELECT cron.unschedule('publish-scheduled-posts');

-- Verify it was removed
SELECT * FROM cron.job WHERE jobname = 'publish-scheduled-posts';
