-- Run SECOND.
alter table services add column if not exists last_checked_at timestamptz;
alter table services add column if not exists current_state text not null default 'unknown';

create or replace function daily_uptime(p_service_id uuid, p_days int default 7)
returns table(day date, total bigint, up bigint, uptime_pct numeric)
language sql stable as $$
  select (checked_at at time zone 'utc')::date,
         count(*),
         count(*) filter (where state <> 'down'),
         round(100.0 * count(*) filter (where state <> 'down') / count(*), 2)
  from health_checks
  where service_id = p_service_id
    and checked_at >= now() - make_interval(days => p_days)
  group by 1 order by 1;
$$;

create or replace function dashboard_stats()
returns json language sql stable as $$
  select json_build_object(
    'total_services',   (select count(*) from services where is_active),
    'active_incidents', (select count(*) from services where is_active and current_state = 'down'),
    'avg_latency_ms',   (select round(avg(response_time_ms)) from health_checks
                         where checked_at >= now() - interval '1 hour' and response_time_ms is not null),
    'uptime_pct_24h',   (select round(100.0 * count(*) filter (where state <> 'down') / nullif(count(*),0), 2)
                         from health_checks where checked_at >= now() - interval '24 hours')
  );
$$;

insert into services (name, endpoint_url, expected_status) values
  ('HTTPBin OK',   'https://httpbin.org/status/200', 200),
  ('HTTPBin Slow', 'https://httpbin.org/delay/1',    200),
  ('HTTPBin Down', 'https://httpbin.org/status/500', 200),
  ('GitHub API',   'https://api.github.com',         200);
