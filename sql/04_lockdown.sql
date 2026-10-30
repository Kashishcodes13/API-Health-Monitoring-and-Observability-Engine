-- Run LAST, only after the login page works and you created a user in
-- Supabase > Authentication > Users. Then remove DEV_SKIP_AUTH from .env.local.
drop policy "dev all services" on services;
drop policy "dev all checks" on health_checks;

create policy "auth read services"  on services for select to authenticated using (true);
create policy "auth write services" on services for all    to authenticated using (true) with check (true);
create policy "auth read checks"    on health_checks for select to authenticated using (true);
-- No write policy on health_checks: only the probe engine (service role) inserts.
