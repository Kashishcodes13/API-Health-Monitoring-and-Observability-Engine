import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, Globe, ListTree } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { CheckRow, IncidentRow, ServiceRow } from "@/lib/frontend/types";
import { TONE, normalizeCheck, pickNum, pickStr, timeAgo } from "@/lib/frontend/status";
import { DistributionChart, LatencyChart, type Point } from "@/components/Charts";
import { ServiceActions } from "@/components/ServiceActions";

export const metadata: Metadata = { title: "Service" };

const isUuid = (s: string) => /^[0-9a-f-]{32,36}$/i.test(s);

export default async function ServicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) notFound();

  const supabase = await createClient();
  const { data: service } = await supabase.from("services").select("*").eq("id", id).maybeSingle();
  if (!service) notFound();
  const svc = service as ServiceRow;

  const [latestRes, uptimeRes, bucketsRes, distRes, incRes] = await Promise.all([
    supabase.from("health_checks").select("*").eq("service_id", id).order("checked_at", { ascending: false }).limit(1),
    supabase.rpc("daily_uptime", { p_service_id: id, p_days: 30 }),
    supabase.rpc("latency_buckets", { p_service_id: id, p_hours: 24, p_bucket_minutes: 30 }),
    supabase.rpc("latency_distribution", { p_service_id: id, p_hours: 24 }),
    supabase.from("incidents").select("*").eq("service_id", id).order("checked_at", { ascending: false }).limit(10),
  ]);

  const latest: CheckRow | null = latestRes.data?.[0] ? normalizeCheck(latestRes.data[0]) : null;
  const status = svc.is_active === false ? "unknown" : (latest?.status ?? "unknown");
  const tone = TONE[status];

  const uptimeDays = ((uptimeRes.data ?? []) as unknown[]).map((r) => ({
    day: pickStr(r, "day", "date", "bucket") ?? "",
    pct: pickNum(r, "uptime_pct", "uptime_percent", "uptime", "pct"),
  }));
  const uptimeAvg = uptimeDays.filter((d) => d.pct != null);
  const overall = uptimeAvg.length ? uptimeAvg.reduce((a, d) => a + (d.pct ?? 0), 0) / uptimeAvg.length : null;

  const latency: Point[] = ((bucketsRes.data ?? []) as unknown[]).flatMap((r) => {
    const t = pickStr(r, "bucket", "bucket_start", "ts", "time");
    const v = pickNum(r, "avg_latency_ms", "avg_ms", "avg_latency", "avg");
    return t && v != null
      ? [{ label: new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), value: v }]
      : [];
  });

  const dist: Point[] = ((distRes.data ?? []) as unknown[]).flatMap((r) => {
    const label = pickStr(r, "bucket", "range", "label") ?? (pickNum(r, "bucket_ms", "bucket") ?? "").toString();
    const v = pickNum(r, "count", "checks", "n", "total");
    return label && v != null ? [{ label, value: v }] : [];
  });

  const incidents = (incRes.data ?? []) as IncidentRow[];
  const headers = latest?.response_headers ? Object.entries(latest.response_headers) : [];
  const barColor = (p: number | null) =>
    p == null ? "bg-white/10" : p >= 99.9 ? "bg-healthy/85" : p >= 95 ? "bg-degraded" : "bg-down";

  return (
    <main className="mx-auto max-w-6xl px-5 py-6">
      <Link href="/dashboard" className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted transition hover:text-white">
        <ArrowLeft className="size-4" /> Back to dashboard
      </Link>

      <header className={`glass-strong mb-4 flex flex-wrap items-center justify-between gap-4 rounded-3xl p-6 ${tone.glow} ${tone.text}`}>
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
          <h2 className="mb-3 font-semibold">Latency · last 24h</h2>
          <LatencyChart data={latency} />
        </section>

        <section className="glass bento-card md:col-span-2">
          <h2 className="mb-3 font-semibold">Distribution</h2>
          <DistributionChart data={dist} />
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
                  <li key={i} className="rounded-xl bg-white/4 px-3.5 py-2.5 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className={`flex items-center gap-2 font-medium ${to.text}`}>
                        <span className="size-2 rounded-full bg-current" />
                        {inc.prev_state} → {inc.state}
                      </span>
                      <span className="font-mono text-xs text-muted">{timeAgo(inc.checked_at)}</span>
                    </div>
                    <div className="mt-1 font-mono text-xs text-muted">
                      {new Date(inc.checked_at).toLocaleString()}
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
                <div key={k} className="grid grid-cols-[10rem_1fr] gap-3 rounded-lg bg-white/4 px-3 py-1.5">
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
