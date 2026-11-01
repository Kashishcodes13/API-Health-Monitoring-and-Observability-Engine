-- =====================================================================
-- 06: PRIVATE PER USER  (run once in Supabase > SQL Editor)
-- After this, every signed-in user can see and change ONLY their own services,
-- and only the health checks that belong to those services. Anonymous users see nothing.
-- The server-side probe uses the service role key, which bypasses RLS, so it keeps working.
-- =====================================================================

-- 1) Ownership column. New rows created in a signed-in session get the user's id automatically.
alter table public.services
  add column if not exists user_id uuid references auth.users (id) on delete cascade default auth.uid();
create index if not exists services_user_id_idx on public.services (user_id);

-- 2) EXISTING rows have no owner yet. Replace the id below with YOURS
--    (Authentication > Users > copy the "User UID"), remove the leading "--", then run:
-- update public.services set user_id = 'PASTE-YOUR-USER-UID-HERE' where user_id is null;

-- 3) Turn on row level security
alter table public.services enable row level security;
alter table public.health_checks enable row level security;

-- 4) Remove every old policy on these two tables (an old "allow all authenticated" policy
--    would otherwise still let every user see everyone's data; policies are OR-ed together).
do $$
declare r record;
begin
  for r in
    select policyname, tablename from pg_policies
    where schemaname = 'public' and tablename in ('services', 'health_checks')
  loop
    execute format('drop policy %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

-- 5) Policies: services belong to their owner
create policy "services_select_own" on public.services
  for select to authenticated using (user_id = auth.uid());
create policy "services_insert_own" on public.services
  for insert to authenticated with check (user_id = auth.uid());
create policy "services_update_own" on public.services
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "services_delete_own" on public.services
  for delete to authenticated using (user_id = auth.uid());

-- 6) Policies: checks are readable only through a service you own. Nobody but the server writes them.
create policy "checks_select_own" on public.health_checks
  for select to authenticated
  using (exists (select 1 from public.services s where s.id = health_checks.service_id and s.user_id = auth.uid()));

-- 7) Privileges: signed-out (anon) role gets nothing
revoke all on public.services from anon;
revoke all on public.health_checks from anon;
grant select, insert, update, delete on public.services to authenticated;
grant select on public.health_checks to authenticated;
revoke insert, update, delete on public.health_checks from authenticated;

-- 8) Views and functions must run with the CALLER's rights, otherwise they can read everyone's rows
do $$
begin
  if to_regclass('public.incidents') is not null then
    execute 'alter view public.incidents set (security_invoker = true)';
    execute 'revoke all on public.incidents from anon';
    execute 'grant select on public.incidents to authenticated';
  end if;
end $$;

do $$
declare r record;
begin
  for r in
    select p.oid::regprocedure as sig
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in ('dashboard_stats', 'daily_uptime', 'latency_buckets', 'latency_distribution')
  loop
    execute format('alter function %s security invoker', r.sig);
    execute format('revoke all on function %s from public, anon', r.sig);
    execute format('grant execute on function %s to authenticated', r.sig);
  end loop;
end $$;

-- 9) Realtime respects these policies: a user only receives events for rows they are allowed to read.

-- ---------------------------------------------------------------------
-- VERIFY (run these separately after the above):
--   set role anon;          select count(*) from public.services;   -- must fail: permission denied
--   reset role;
--   select tablename, rowsecurity from pg_tables where tablename in ('services','health_checks'); -- both true
--   select proname, prosecdef from pg_proc where proname in
--     ('dashboard_stats','daily_uptime','latency_buckets','latency_distribution'); -- prosecdef must be false
-- ---------------------------------------------------------------------
