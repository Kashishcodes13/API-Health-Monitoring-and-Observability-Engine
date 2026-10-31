# API Health Engine: frontend pack (tasks 1-9)

Unzip into your project root. Files overwrite `app/page.tsx` and `app/layout.tsx`/`app/globals.css`.
No backend files are included or changed.

## Install
    npm i framer-motion recharts lucide-react @supabase/ssr @supabase/supabase-js

## Assumptions (change only if wrong)
- `lib/supabase/client.ts` exports `createClient()`; `lib/supabase/server.ts` exports async `createClient()`.
- Tailwind v4 (`@import "tailwindcss"`). On v3 the `@theme`/`@utility` blocks must be converted.
- `lib/frontend/actions.ts` is the ONLY file that calls your server actions. It assumes:
  addService({name,url,method,expected_status}), checkNow(id), toggleService(id, active), deleteService(id).
  If yours take FormData or other args, edit that one file.
- Column names: services(id,name,url,method,expected_status,is_active,created_at),
  health_checks(service_id,state,status_code,response_time_ms,error_message,checked_at) (mapped in normalizeCheck).
  Types live in `lib/frontend/types.ts`. RPC/view columns are read defensively (see `lib/frontend/status.ts`).
- Realtime must be enabled on `health_checks` and `services` (Supabase > Database > Replication).
- Next 16: `proxy.ts` replaces `middleware.ts`.

## Task map
1 layout + glass theme + landing + wave | 2 components/StatusCard.tsx | 3 app/dashboard (stats + paging ?page=&q=)
4 realtime in DashboardClient | 5 search (server) + status filter (client) | 6 AddServiceModal + CheckNowButton
7 app/services/[id] | 8 login/register + proxy.ts + /auth/signout | 9 deploy.

## Task 8 order
1. Register and log in with DEV_SKIP_AUTH unset. 2. Run sql/04_lockdown.sql. 3. Delete DEV_SKIP_AUTH from env and the 3-line check in proxy.ts.
## Task 9
Set env vars on host (service role key server-only, never NEXT_PUBLIC_), deploy, then run sql/05.
