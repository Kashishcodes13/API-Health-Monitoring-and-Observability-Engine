import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, ShieldAlert } from "lucide-react";
import { requireUser } from "@/lib/frontend/auth";
import { normalizeService } from "@/lib/frontend/service";
import { BADGE, TONE, asStatus, codeTone, normalizeCheck, timeAgo } from "@/lib/frontend/status";
import { nowMs } from "@/lib/frontend/analytics";
import { CHECK_COLS } from "@/lib/frontend/data";
import { LocalTime } from "@/components/LocalTime";
import { Pagination } from "@/components/Pagination";

export const metadata: Metadata = { title: "Incidents" };
const PAGE = 20;

interface Change { service_id: string; checked_at: string; prev_state: string; state: string; status_code?: number | null; error_message?: string | null }

export default async function IncidentsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const sp = await searchParams;
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);
  const from = (page - 1) * PAGE;
  const { supabase } = await requireUser();
  const now = nowMs();

  const [svcRes, incRes] = await Promise.all([
    supabase.from("services").select("*").limit(500),
    supabase.from("incidents").select("*", { count: "exact" }).order("checked_at", { ascending: false }).range(from, from + PAGE - 1),
  ]);
  const services = ((svcRes.data ?? []) as Record<string, unknown>[]).map(normalizeService);
  const byId = new Map(services.map((s) => [s.id, s]));
  const changes = (incRes.data ?? []) as Change[];
  const total = incRes.count ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE));
  if (total > 0 && page > pages) redirect(pages > 1 ? `/incidents?page=${pages}` : "/incidents");

  // which services are failing right now (latest check says down)
  const active = (
    await Promise.all(
      services.filter((s) => s.is_active !== false).slice(0, 60).map(async (s) => {
        const { data } = await supabase.from("health_checks").select(CHECK_COLS).eq("service_id", s.id)
          .order("checked_at", { ascending: false }).limit(1);
        const c = data?.[0] ? normalizeCheck(data[0]) : null;
        return c && c.status === "down" ? { s, c } : null;
      }),
    )
  ).filter((x): x is NonNullable<typeof x> => x !== null);

  // when did each of them go down? (most recent transition into "down")
  const since = new Map<string, string>();
  if (active.length) {
    const { data } = await supabase.from("incidents").select("service_id,checked_at").eq("state", "down")
      .in("service_id", active.map((a) => a.s.id)).order("checked_at", { ascending: false });
    for (const r of (data ?? []) as { service_id: string; checked_at: string }[]) if (!since.has(r.service_id)) since.set(r.service_id, r.checked_at);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Incidents</h1>
        <p className="mt-1 text-sm text-muted">Services failing right now, and every time one of your APIs changed state.</p>
      </div>

      <section aria-label="Active incidents" className="space-y-3">
        <h2 className="label-mono">Active incidents · {active.length}</h2>
        {active.length === 0 ? (
          <div className="glass glow-healthy flex items-center gap-3 rounded-xl p-5 text-healthy">
            <CheckCircle2 className="size-6 shrink-0" />
            <div><div className="font-semibold">All clear</div><div className="text-sm text-muted">No service is down right now.</div></div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {active.map(({ s, c }) => (
              <Link key={s.id} href={`/services/${s.id}`} className="glass glow-down block rounded-xl p-4 transition-transform hover:-translate-y-0.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-2 font-semibold"><ShieldAlert className="size-4 text-down" />{s.name}</span>
                  <span className="rounded bg-down/15 px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-down">Down</span>
                </div>
                <div className="mt-1 truncate font-mono text-xs text-muted">{s.url.replace(/^https?:\/\//, "")}</div>
                {c.error && <p className="mt-3 truncate rounded-md bg-down/10 px-2.5 py-1.5 font-mono text-[11px] text-down">{c.error}</p>}
                <div className="mt-3 text-xs text-muted">
                  {since.has(s.id) ? `Down since ${timeAgo(since.get(s.id), now)}` : "Down since its first check"} · last check {timeAgo(c.checked_at, now)}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section aria-label="State changes" className="glass rounded-xl p-5">
        <div className="mb-4 flex items-baseline justify-between gap-3">
          <h2 className="font-bold">State changes</h2>
          <span className="label-mono">{total.toLocaleString()} total</span>
        </div>
        {changes.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted">No state changes recorded yet. They appear when a service switches between healthy, degraded and down.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-160 text-left text-sm">
              <thead>
                <tr className="label-mono"><th className="px-3 pb-2 font-semibold">Time</th><th className="px-3 pb-2 font-semibold">Service</th><th className="px-3 pb-2 font-semibold">Change</th><th className="px-3 pb-2 font-semibold">HTTP</th><th className="px-3 pb-2 font-semibold">Detail</th></tr>
              </thead>
              <tbody>
                {changes.map((r, i) => {
                  const svc = byId.get(r.service_id);
                  const a = asStatus(r.prev_state), b = asStatus(r.state);
                  return (
                    <tr key={`${r.service_id}-${r.checked_at}-${i}`} className="border-t border-line">
                      <td className="whitespace-nowrap px-3 py-3 font-mono text-xs text-muted"><LocalTime iso={r.checked_at} /></td>
                      <td className="px-3 py-3"><Link href={`/services/${r.service_id}`} className="font-semibold hover:text-brand-2">{svc?.name ?? "Deleted service"}</Link></td>
                      <td className="px-3 py-3">
                        <span className="inline-flex items-center gap-2">
                          <span className={`rounded px-2 py-0.5 font-mono text-[10px] font-bold uppercase ${BADGE[a]}`}>{TONE[a].label}</span>
                          <span className="text-muted">→</span>
                          <span className={`rounded px-2 py-0.5 font-mono text-[10px] font-bold uppercase ${BADGE[b]}`}>{TONE[b].label}</span>
                        </span>
                      </td>
                      <td className="px-3 py-3"><span className={`rounded px-1.5 py-0.5 font-mono text-[11px] font-bold ${codeTone(r.status_code)}`}>{r.status_code ?? "ERR"}</span></td>
                      <td className="max-w-72 truncate px-3 py-3 font-mono text-xs text-muted">{r.error_message ?? ""}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={Math.min(page, pages)} totalPages={pages} basePath="/incidents" />
      </section>
    </div>
  );
}
