import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/frontend/auth";
import { normalizeService } from "@/lib/frontend/service";
import { BADGE, TONE, codeTone, normalizeCheck, urlPath } from "@/lib/frontend/status";
import { CHECK_COLS } from "@/lib/frontend/data";
import { LocalTime } from "@/components/LocalTime";
import { LogControls } from "@/components/LogControls";
import { Pagination } from "@/components/Pagination";

export const metadata: Metadata = { title: "Execution Logs" };
const PAGE = 25;
const STATES = ["healthy", "degraded", "down"];
const isUuid = (s: string) => /^[0-9a-f-]{32,36}$/i.test(s);

export default async function LogsPage({ searchParams }: { searchParams: Promise<{ page?: string; state?: string; service?: string }> }) {
  const sp = await searchParams;
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);
  const state = STATES.includes(sp.state ?? "") ? (sp.state as string) : "all";
  const service = sp.service && isUuid(sp.service) ? sp.service : "";
  const from = (page - 1) * PAGE;
  const { supabase } = await requireUser();

  let q = supabase.from("health_checks").select(CHECK_COLS, { count: "exact" })
    .order("checked_at", { ascending: false }).range(from, from + PAGE - 1);
  if (state !== "all") q = q.eq("state", state);
  if (service) q = q.eq("service_id", service);

  const [svcRes, logRes] = await Promise.all([supabase.from("services").select("*").limit(500), q]);
  const services = ((svcRes.data ?? []) as Record<string, unknown>[]).map(normalizeService);
  const byId = new Map(services.map((s) => [s.id, s]));
  const rows = ((logRes.data ?? []) as unknown[]).map(normalizeCheck);
  const total = logRes.count ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE));
  if (total > 0 && page > pages) {
    const p = new URLSearchParams();
    if (state !== "all") p.set("state", state);
    if (service) p.set("service", service);
    if (pages > 1) p.set("page", String(pages));
    redirect(p.toString() ? `/logs?${p}` : "/logs");
  }
  const shownFrom = total === 0 ? 0 : from + 1;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Execution Logs</h1>
        <p className="mt-1 text-sm text-muted">Every probe, newest first. This table refreshes itself every 15 seconds.</p>
      </div>

      <LogControls services={services.map((s) => ({ id: s.id, name: s.name }))} state={state} service={service} />

      <section className="glass rounded-xl p-5">
        {rows.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted">No executions match these filters yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-200 text-left text-sm">
              <thead>
                <tr className="label-mono">
                  {["Timestamp", "Service", "Method", "Endpoint", "Status", "Latency", "Health", "Error"].map((h) => (
                    <th key={h} className="px-3 pb-2 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="font-mono text-xs">
                {rows.map((r, i) => {
                  const s = byId.get(r.service_id);
                  const t = TONE[r.status];
                  return (
                    <tr key={`${r.service_id}-${r.checked_at}-${i}`} className="border-t border-line transition-colors hover:bg-text/3">
                      <td className="whitespace-nowrap px-3 py-2.5 text-muted"><LocalTime iso={r.checked_at} /></td>
                      <td className="px-3 py-2.5 font-sans text-sm font-semibold"><Link href={`/services/${r.service_id}`} className="hover:text-brand-2">{s?.name ?? "Deleted service"}</Link></td>
                      <td className="px-3 py-2.5"><span className="rounded bg-text/8 px-1.5 py-0.5 text-[10px] font-bold text-muted">{(s?.method ?? "GET").toUpperCase()}</span></td>
                      <td className="max-w-56 truncate px-3 py-2.5 text-muted">{urlPath(s?.url)}</td>
                      <td className="px-3 py-2.5"><span className={`rounded px-1.5 py-0.5 text-[11px] font-bold ${codeTone(r.status_code)}`}>{r.status_code ?? "ERR"}</span></td>
                      <td className="whitespace-nowrap px-3 py-2.5">{r.latency_ms != null ? `${Math.round(r.latency_ms)} ms` : "—"}</td>
                      <td className="px-3 py-2.5"><span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${BADGE[r.status]}`}>{t.label}</span></td>
                      <td className="max-w-64 truncate px-3 py-2.5 text-down">{r.error ?? ""}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
          <span>Showing {shownFrom.toLocaleString()}–{Math.min(from + PAGE, total).toLocaleString()} of {total.toLocaleString()}</span>
        </div>
        <Pagination page={Math.min(page, pages)} totalPages={pages} basePath="/logs" params={{ state: state === "all" ? "" : state, service }} />
      </section>
    </div>
  );
}
