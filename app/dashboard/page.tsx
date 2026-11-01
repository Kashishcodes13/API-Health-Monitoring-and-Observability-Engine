import type { Metadata } from "next";
import { requireUser } from "@/lib/frontend/auth";
import type { CheckRow } from "@/lib/frontend/types";
import { normalizeCheck, sinceIso } from "@/lib/frontend/status";
import { detectKeys, normalizeService } from "@/lib/frontend/service";
import { latestByService, nowMs } from "@/lib/frontend/analytics";
import { DashboardClient } from "@/components/DashboardClient";
import { AddServiceModal } from "@/components/AddServiceModal";

export const metadata: Metadata = { title: "Dashboard" };

const COLS = "service_id,checked_at,state,status_code,response_time_ms,error_message";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const initialPage = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);
  const initialQ = (sp.q ?? "").slice(0, 60);

  const { supabase } = await requireUser();
  const serverNow = nowMs();

  const [svcRes, chkRes] = await Promise.all([
    supabase.from("services").select("*").order("created_at", { ascending: false }).limit(500),
    supabase.from("health_checks").select(COLS).gte("checked_at", sinceIso(24)).order("checked_at", { ascending: false }).limit(1500),
  ]);

  const rawServices = (svcRes.data ?? []) as Record<string, unknown>[];
  const services = rawServices.map(normalizeService);
  const keys = detectKeys(rawServices[0]);

  let checks: CheckRow[] = ((chkRes.data ?? []) as unknown[]).map(normalizeCheck);

  // services with no check in the last 24h still need their latest status
  const have = new Set(checks.map((c) => c.service_id));
  const extra = await Promise.all(
    services.filter((s) => !have.has(s.id)).map(async (s) => {
      const { data } = await supabase.from("health_checks").select(COLS).eq("service_id", s.id)
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

  const loadError = svcRes.error?.message ?? chkRes.error?.message;

  return (
    <main>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-muted">Live status of every endpoint you monitor.</p>
        </div>
        <AddServiceModal keys={keys} />
      </div>

      {loadError && (
        <p role="alert" className="mb-4 rounded-xl bg-down/10 px-4 py-3 text-sm text-down">
          Could not load data: {loadError}
        </p>
      )}

      <DashboardClient
        services={services}
        initialChecks={checks}
        serverNow={serverNow}
        initialQ={initialQ}
        initialPage={initialPage}
      />
    </main>
  );
}
