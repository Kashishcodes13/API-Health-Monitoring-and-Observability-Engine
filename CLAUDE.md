# API Health Engine
Next.js 15 (App Router, TypeScript), Supabase (Postgres, Realtime, Auth), Tailwind, Framer Motion, Recharts, Lucide.

STATUS: BACKEND DONE. Build the FRONTEND next. Do not rewrite backend files.

Tables: services, health_checks. View: incidents. Functions: dashboard_stats(), daily_uptime(p_service_id, p_days),
latency_buckets(p_service_id, p_hours, p_bucket_minutes), latency_distribution(p_service_id, p_hours).

Existing files: lib/types.ts, lib/supabase/{client,server,admin}.ts, lib/health/{probe,validate,run}.ts,
app/api/health-check/route.ts, app/actions/services.ts (addService, editService, deleteService, toggleService, checkNow).
app/page.tsx is a temporary connection test; replace it.

Health rules: status matches and <500ms healthy; >=500ms degraded; mismatch/error/5s timeout down. Emerald/amber/rose glow.

Rules:
- Never use the service role key in client code or NEXT_PUBLIC_ variables.
- Server Components by default; "use client" only when needed.
- Next.js 15: params and cookies() are async, always await.
- Give FULL files with exact paths. One feature at a time.

Next tasks: 1 layout+glass theme, 2 StatusCard, 3 dashboard page + stats, 4 realtime, 5 filter/search,
6 AddServiceModal + Check now, 7 services/[id] page (charts, uptime bar, incidents, headers),
8 login page then run sql/04_lockdown.sql and remove DEV_SKIP_AUTH, 9 deploy and run sql/05.
