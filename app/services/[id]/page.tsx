import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, Globe, ListTree } from "lucide-react";
import { requireUser } from "@/lib/frontend/auth";
import type { CheckRow, IncidentRow } from "@/lib/frontend/types";
import { TONE, normalizeCheck, pickNum, pickStr, sinceIso, timeAgo } from "@/lib/frontend/status";
import { normalizeService } from "@/lib/frontend/service";
import { bucketSeries, dailyUptime, distribution, nowMs } from "@/lib/frontend/analytics";
import { DistributionChart, LatencyChart } from "@/components/ChartsLazy";
import { ServiceActions } from "@/components/ServiceActions";
import { HistoryTable } from "@/components/HistoryTable";
import { Pagination } from "@/components/Pagination";
import { LocalTime } from "@/components/LocalTime";

export const metadata: Metadata = { title: "Service" };

const RANGES = {
  "24h": { hours: 24, bucket: 30 },
  "7d": { hours: 168, bucket: 240 },
  "30d": { hours: 720, bucket: 720 },
} as const;
type RangeKey = keyof typeof RANGES;
const STATES = ["all", "healthy", "degraded", "down"] as const;
const HIST_PAGE = 15;
const COLS = "service_id,checked_at,state,status_code,response_time_ms,error_message";

const isUuid = (s: string) => /^[0-9a-f-]{32,36}$/i.test(s);

export default async function ServicePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ range?: string; hpage?: string; state?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const range: RangeKey = sp.range && sp.range in RANGES ? (sp.range as RangeKey) : "24h";
  const rg = RANGES[range];
  const state = (STATES as readonly string[]).includes(sp.state ?? "") ? (sp.state as string) : "all";
  const hpage = Math.max(1, Number.parseInt(sp.hpage ?? "1", 10) || 1);
  const hFrom = (hpage - 1) * HIST_PAGE;
  const link = (over: Record<string, string>) => {
    const p = new URLSearchParams({ range, state, ...over });
    if (p.get("state") === "all") p.delete("state");
    if (p.get("range") === "24h") p.delete("range");
    if (p.get("hpage") === "1") p.delete("hpage");
    const q = p.toString();
    return q ? `/services/${id}?${q}` : `/services/${id}`;
  };

  const { supabase } = await requireUser();
  if (!isUuid(id)) notFound();

  const { data: service } = await supabase.from("services").select("*").eq("id", id).maybeSingle();
  if (!service) notFound();
  const svc = normalizeService(service as Record<string, unknown>);
  const now = nowMs();

  let histQ = supabase
    .from("health_checks")
    .select("*", { count: "exact" })
    .eq("service_id", id)
    .gte("checked_at", sinceIso(rg.hours))
    .order("checked_at", { ascending: false })
    .range(hFrom, hFrom + HIST_PAGE - 1);
  if (state !== "all") histQ = histQ.eq("state", state);

  const [latestRes, uptimeRes, rangeRes, incRes, histRes] = await Promise.all([
    supabase.from("health_checks").select("*").eq("service_id", id).order("checked_at", { ascending: false }).limit(1),
    supabase.rpc("daily_uptime", { p_service_id: id, p_days: 30 }),
    supabase.from("health_checks").select(COLS).eq("service_id", id).gte("checked_at", sinceIso(rg.hours))
      .order("checked_at", { ascending: false }).limit(3000),
    supabase.from("incidents").select("*").eq("service_id", id).order("checked_at", { ascending: false }).limit(10),
    histQ,
  ]);

  const latest: CheckRow | null = latestRes.data?.[0] ? normalizeCheck(latestRes.data[0]) : null;
  const status = svc.is_active === false ? "unknown" : (latest?.status ?? "unknown");
  const tone = TONE[status];

  // charts are computed from raw checks so they work whatever the RPC column names are
  const rangeChecks = ((rangeRes.data ?? []) as unknown[]).map(normalizeCheck);
  const latency = bucketSeries(rangeChecks, now, rg.hours, rg.bucket);
  const dist = distribution(rangeChecks);

  let uptimeDays = ((uptimeRes.data ?? []) as unknown[]).map((r) => ({
    day: pickStr(r, "day", "date", "bucket") ?? "",
    pct: pickNum(r, "uptime_pct", "uptime_percent", "uptime", "pct"),
  }));
  if (!uptimeDays.some((d) => d.pct != null)) {
    const { data } = await supabase.from("health_checks").select(COLS).eq("service_id", id)
      .gte("checked_at", sinceIso(720)).order("checked_at", { ascending: false }).limit(4000);
    uptimeDays = dailyUptime(((data ?? []) as unknown[]).map(normalizeCheck), 30, now);
  }
  const withData = uptimeDays.filter((d) => d.pct != null);
  const overall = withData.length ? withData.reduce((a, d) => a + (d.pct ?? 0), 0) / withData.length : null;

  const history = ((histRes.data ?? []) as unknown[]).map(normalizeCheck);
  const histTotal = histRes.count ?? 0;
  const histPages = Math.max(1, Math.ceil(histTotal / HIST_PAGE));
  const incidents = (incRes.data ?? []) as IncidentRow[];
  const headers = latestRes.data?.[0]?.response_headers
    ? Object.entries(latestRes.data[0].response_headers as Record<string, unknown>)
    : [];
  const barColor = (p: number | null) =>
    p == null ? "bg-text/10" : p >= 99.9 ? "bg-healthy/85" : p >= 95 ? "bg-degraded" : "bg-down";

  return (
    <main className="mx-auto max-w-6xl px-5 py-6">
      <Link href="/dashboard" className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted transition hover:text-text">
        <ArrowLeft className="size-4" /> Back to dashboard
      </Link>

      <header className={`glass-strong mb-6 flex flex-wrap items-center justify-between gap-4 rounded-3xl p-6 ${tone.glow} ${tone.text}`}>
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <span className="status-dot" />
            <h1 className="truncate text-2xl font-bold text-text">{svc.name}</h1>
            <span className="text-sm font-medium">{svc.is_active === false ? "Paused" : tone.label}</span>
          </div>
          <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs text-muted">
            <span className="inline-flex items-center gap-1"><Globe className="size-3" />{svc.method ?? "GET"} {svc.url}</span>
            <span className="inline-flex items-center gap-1"><Clock className="size-3" />last check {timeAgo(latest?.checked_at)}</span>
          </p>
        </div>
        <ServiceActions id={svc.id} active={svc.is_active !== false} />
      </header>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">History</h2>
        <div className="glass flex rounded-2xl p-1" role="tablist" aria-label="Time range">
          {(Object.keys(RANGES) as RangeKey[]).map((r) => (
            <Link key={r} href={link({ range: r, hpage: "1" })} scroll={false}
              className={`rounded-xl px-3.5 py-1.5 text-xs transition ${r === range ? "bg-white text-brand shadow-sm" : "text-muted hover:text-text"}`}>
              {r === "24h" ? "24 hours" : r === "7d" ? "7 days" : "30 days"}
            </Link>
          ))}
        </div>
      </div>

      <div className="bento-grid">
        <section className="glass bento-card md:col-span-6">
          <div className="mb-4 flex items-end justify-between">
            <h2 className="font-semibold">Uptime · last 30 days</h2>
            <span className="text-2xl font-bold text-gradient">{overall == null ? "—" : `${overall.toFixed(2)}%`}</span>
          </div>
          <div className="flex gap-1" role="img" aria-label="Daily uptime for the last 30 days">
            {uptimeDays.length === 0 ? (
              <p className="text-sm text-muted">No uptime data yet.</p>
            ) : (
              uptimeDays.map((d, i) => (
                <span key={i} title={`${d.day}: ${d.pct == null ? "no data" : d.pct.toFixed(2) + "%"}`}
                  className={`h-10 flex-1 rounded-sm transition hover:opacity-70 ${barColor(d.pct)}`} />
              ))
            )}
          </div>
        </section>

        <section className="glass bento-card md:col-span-4">
          <h2 className="mb-3 font-semibold">Latency · last {range}</h2>
          <LatencyChart data={latency} range={range} />
        </section>

        <section className="glass bento-card md:col-span-2">
          <h2 className="mb-3 font-semibold">Distribution</h2>
          <DistributionChart data={dist} />
        </section>

        <section className="glass bento-card md:col-span-6">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-semibold">Check log <span className="ml-1 text-sm font-normal text-muted">({histTotal.toLocaleString()} checks)</span></h2>
            <div className="flex gap-1.5 text-xs">
              {STATES.map((st) => (
                <Link key={st} href={link({ state: st, hpage: "1" })} scroll={false}
                  className={`rounded-lg px-2.5 py-1 capitalize transition ${st === state ? "bg-white text-brand shadow-sm" : "text-muted hover:text-text"}`}>
                  {st}
                </Link>
              ))}
            </div>
          </div>
          <HistoryTable rows={history} />
          <Pagination page={Math.min(hpage, histPages)} totalPages={histPages} basePath={`/services/${id}`} pageKey="hpage"
            params={{ range: range === "24h" ? "" : range, state: state === "all" ? "" : state }} />
        </section>

        <section className="glass bento-card md:col-span-3 md:row-span-2">
          <h2 className="mb-4 font-semibold">State changes</h2>
          {incidents.length === 0 ? (
            <p className="text-sm text-muted">No state changes recorded yet.</p>
          ) : (
            <ul className="space-y-2.5">
              {incidents.map((inc, i) => {
                const to = TONE[(["healthy", "degraded", "down"].includes(inc.state) ? inc.state : "unknown") as keyof typeof TONE];
                return (
                  <li key={i} className="rounded-xl bg-text/5 px-3.5 py-2.5 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className={`flex items-center gap-2 font-medium ${to.text}`}>
                        <span className="size-2 rounded-full bg-current" />
                        {inc.prev_state} → {inc.state}
                      </span>
                      <span className="font-mono text-xs text-muted">{timeAgo(inc.checked_at)}</span>
                    </div>
                    <div className="mt-1 font-mono text-xs text-muted">
                      <LocalTime iso={inc.checked_at} />
                      {inc.status_code ? ` · HTTP ${inc.status_code}` : ""}
                      {inc.error_message ? ` · ${inc.error_message}` : ""}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="glass bento-card md:col-span-3 md:row-span-2">
          <h2 className="mb-4 flex items-center gap-2 font-semibold"><ListTree className="size-4 text-brand-2" />Response headers</h2>
          {headers.length === 0 ? (
            <p className="text-sm text-muted">No headers recorded for the latest check.</p>
          ) : (
            <dl className="max-h-80 space-y-1.5 overflow-auto font-mono text-xs">
              {headers.map(([k, v]) => (
                <div key={k} className="grid grid-cols-[10rem_1fr] gap-3 rounded-lg bg-text/5 px-3 py-1.5">
                  <dt className="truncate text-brand-2">{k}</dt>
                  <dd className="break-all text-muted">{String(v)}</dd>
                </div>
              ))}
            </dl>
          )}
        </section>
      </div>
    </main>
  );
}
