import type { createClient } from "@/lib/supabase/server";
import type { CheckRow } from "./types";
import { normalizeCheck, sinceIso } from "./status";
import { detectKeys, normalizeService } from "./service";
import { latestByService, nowMs } from "./analytics";

type Db = Awaited<ReturnType<typeof createClient>>;
export const CHECK_COLS = "service_id,checked_at,state,status_code,response_time_ms,error_message";

/**
 * Everything the dashboard and the services page need, in as few queries as possible:
 * the user's services (RLS keeps it to their own) and the last 24 hours of checks, trimmed for the browser.
 */
export async function loadBoardData(supabase: Db) {
  const serverNow = nowMs();
  const [svcRes, chkRes] = await Promise.all([
    supabase.from("services").select("*").order("created_at", { ascending: false }).limit(500),
    supabase.from("health_checks").select(CHECK_COLS).gte("checked_at", sinceIso(24)).order("checked_at", { ascending: false }).limit(1500),
  ]);

  const rawServices = (svcRes.data ?? []) as Record<string, unknown>[];
  const services = rawServices.map(normalizeService);
  const keys = detectKeys(rawServices[0]);

  let checks: CheckRow[] = ((chkRes.data ?? []) as unknown[]).map(normalizeCheck);

  // services with no check in the last 24h still need their latest status
  const have = new Set(checks.map((c) => c.service_id));
  const extra = await Promise.all(
    services.filter((s) => !have.has(s.id)).map(async (s) => {
      const { data } = await supabase.from("health_checks").select(CHECK_COLS).eq("service_id", s.id)
        .order("checked_at", { ascending: false }).limit(1);
      return data?.[0] ? normalizeCheck(data[0]) : null;
    }),
  );
  checks = [...checks, ...extra.filter((c): c is CheckRow => c !== null)];

  // Ship only what the browser needs: no empty fields, and an error message only for each service's latest check.
  const newest = latestByService(checks);
  checks = checks.map((c) => {
    const o: CheckRow = { service_id: c.service_id, status: c.status, checked_at: c.checked_at };
    if (c.latency_ms != null) o.latency_ms = c.latency_ms;
    if (c.status_code != null) o.status_code = c.status_code;
    if (c.error && newest[c.service_id] === c) o.error = c.error;
    return o;
  });

  return { services, keys, checks, serverNow, loadError: svcRes.error?.message ?? chkRes.error?.message };
}
