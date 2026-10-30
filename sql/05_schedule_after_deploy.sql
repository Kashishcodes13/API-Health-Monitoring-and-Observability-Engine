-- Run AFTER deploying. Enable pg_cron and pg_net first (Database > Extensions).
-- Replace the URL and secret.
select cron.schedule('run-health-checks', '* * * * *', $$
  select net.http_get(
    url := 'https://YOUR-APP.vercel.app/api/health-check',
    headers := '{"Authorization": "Bearer YOUR_CRON_SECRET"}'::jsonb
  );
$$);

select cron.schedule('prune-health-checks', '0 3 * * *',
  $$ delete from health_checks where checked_at < now() - interval '30 days' $$);
