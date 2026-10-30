-- Run THIRD (optional but recommended): incident feed, chart buckets, distribution.

create or replace view incidents with (security_invoker = true) as
select service_id, checked_at, prev_state, state, status_code, error_message
from (
  select *, lag(state) over (partition by service_id order by checked_at) as prev_state
  from health_checks
) 
where prev_state is not null and prev_state <> state;

create or replace function latency_buckets(p_service_id uuid, p_hours int default 24, p_bucket_minutes int default 15)
returns table(bucket timestamptz, avg_ms numeric, max_ms int, checks bigint)
language sql stable as $$
  select to_timestamp(floor(extract(epoch from checked_at) / (p_bucket_minutes * 60)) * (p_bucket_minutes * 60)),
         round(avg(response_time_ms)),
         max(response_time_ms),
         count(*)
  from health_checks
  where service_id = p_service_id
    and checked_at >= now() - make_interval(hours => p_hours)
    and response_time_ms is not null
  group by 1 order by 1;
$$;

create or replace function latency_distribution(p_service_id uuid, p_hours int default 24)
returns table(range_label text, sort_order int, checks bigint)
language sql stable as $$
  select label, ord, count(*) from (
    select case
      when response_time_ms < 100  then '<100ms'
      when response_time_ms < 250  then '100-249ms'
      when response_time_ms < 500  then '250-499ms'
      when response_time_ms < 1000 then '500-999ms'
      when response_time_ms < 5000 then '1-5s'
      else '5s+' end as label,
    case
      when response_time_ms < 100  then 1
      when response_time_ms < 250  then 2
      when response_time_ms < 500  then 3
      when response_time_ms < 1000 then 4
      when response_time_ms < 5000 then 5
      else 6 end as ord
    from health_checks
    where service_id = p_service_id
      and checked_at >= now() - make_interval(hours => p_hours)
      and response_time_ms is not null
  ) x group by label, ord order by ord;
$$;
