-- Run FIRST. Skip if you already created these tables.
create table services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  endpoint_url text not null,
  method text not null default 'GET',
  expected_status int not null default 200,
  interval_seconds int not null default 60,
  custom_headers jsonb not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table health_checks (
  id bigint generated always as identity primary key,
  service_id uuid not null references services(id) on delete cascade,
  response_time_ms int,
  status_code int,
  state text not null check (state in ('healthy','degraded','down')),
  error_message text,
  response_headers jsonb,
  checked_at timestamptz not null default now()
);

create index on health_checks (service_id, checked_at desc);

alter table services enable row level security;
alter table health_checks enable row level security;

-- Testing policies; replaced by 04_lockdown.sql later
create policy "dev all services" on services for all using (true) with check (true);
create policy "dev all checks" on health_checks for all using (true) with check (true);

alter publication supabase_realtime add table health_checks;
alter publication supabase_realtime add table services;
