"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight, Loader2, Plus, Radio, Search, ServerOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { CheckRow, ServiceRow, Status } from "@/lib/frontend/types";
import { normalizeCheck } from "@/lib/frontend/status";
import { filterServices } from "@/lib/frontend/service";
import {
  RANGES, RANGE_KEYS, bucketSeries, computeStats, groupByService, hourlySeries, latencyBands, latestByService,
  mergeSeries, parseBuckets, serviceUptime, sparkValues, type Fleet, type RangeKey,
} from "@/lib/frontend/analytics";
import { checkNowAction } from "@/lib/frontend/actions";
import { StatusCard } from "./StatusCard";
import { KpiTiles } from "./KpiTiles";
import { Topology } from "./Topology";
import { RecentLogs } from "./RecentLogs";
import { FleetChart } from "./ChartsLazy";

const PAGE_SIZE = 9;
const OVERVIEW_COUNT = 6;
const AUTO_MS = 60_000;   // auto-monitor interval
const FLUSH_MS = 800;     // realtime events are applied in ONE batch per window
const MAX_CHECKS = 2000;

const tabs = "glass flex rounded-lg p-0.5";
const tab = (on: boolean) =>
  `rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors ${on ? "bg-brand text-white" : "text-muted hover:text-text"}`;

export function DashboardClient({
  mode, title, subtitle, addSlot, services, initialChecks, serverNow, initialQ, initialPage,
}: {
  mode: "overview" | "services";
  title: string;
  subtitle: string;
  addSlot?: React.ReactNode;
  services: ServiceRow[];
  initialChecks: CheckRow[];
  serverNow: number;
  initialQ: string;
  initialPage: number;
}) {
  const router = useRouter();
  const overview = mode === "overview";
  const [checks, setChecks] = useState(initialChecks);
  const [filter, setFilter] = useState<Status | "all">("all");
  const [query, setQuery] = useState(initialQ);
  const [page, setPage] = useState(initialPage);
  const [live, setLive] = useState(false);
  const [auto, setAuto] = useState(true);
  const [running, setRunning] = useState(false);
  const [now, setNow] = useState(serverNow);
  const [range, setRange] = useState<RangeKey>("24h");
  const [chart, setChart] = useState<{ fleet: Fleet; loading: boolean }>({ fleet: { data: [], series: [] }, loading: true });

  const idsRef = useRef(new Set<string>());
  const activeRef = useRef<ServiceRow[]>([]);
  const liveRef = useRef(false);
  const bufRef = useRef<CheckRow[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => setChecks(initialChecks), [initialChecks]);
  useEffect(() => {
    idsRef.current = new Set(services.map((s) => s.id));
    activeRef.current = services.filter((s) => s.is_active !== false);
  }, [services]);
  useEffect(() => { liveRef.current = live; }, [live]);

  // keep "x ago" labels and chart windows moving
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 10_000);
    return () => clearInterval(t);
  }, []);

  // Realtime: every new health check lands here, applied in one batch per 800 ms.
  useEffect(() => {
    const supabase = createClient();
    const flush = () => {
      timerRef.current = null;
      const rows = bufRef.current;
      bufRef.current = [];
      if (!rows.length) return;
      setChecks((prev) => {
        const seen = new Set(prev.map((c) => `${c.service_id}|${c.checked_at}`));
        const fresh = rows.filter((r) => !seen.has(`${r.service_id}|${r.checked_at}`));
        return fresh.length ? [...fresh.reverse(), ...prev].slice(0, MAX_CHECKS) : prev;
      });
      setNow(Date.now());
    };
    const channel = supabase
      .channel(`board-live-${mode}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "health_checks" }, (payload) => {
        const row = normalizeCheck(payload.new);
        if (!idsRef.current.has(row.service_id)) return;
        bufRef.current.push(row);
        if (!timerRef.current) timerRef.current = setTimeout(flush, FLUSH_MS);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "services" }, () => router.refresh())
      .subscribe((s) => setLive(s === "SUBSCRIBED"));
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      supabase.removeChannel(channel);
    };
  }, [router, mode]);

  // Auto-monitor: probes every active service on a timer while the page is open.
  useEffect(() => {
    if (!auto) return;
    let cancelled = false;
    let busy = false;
    const run = async () => {
      if (busy || document.hidden) return;
      busy = true;
      setRunning(true);
      try {
        const list = [...activeRef.current];
        for (let i = 0; i < list.length && !cancelled; i += 4) {
          await Promise.allSettled(list.slice(i, i + 4).map((s) => checkNowAction(s.id)));
        }
        if (!liveRef.current && !cancelled) router.refresh(); // fallback if realtime is not connected
      } finally {
        busy = false;
        if (!cancelled) setRunning(false);
      }
    };
    const first = setTimeout(run, 1500);
    const iv = setInterval(run, AUTO_MS);
    return () => { cancelled = true; clearTimeout(first); clearInterval(iv); };
  }, [auto, router]);

  const latest = useMemo(() => latestByService(checks), [checks]);
  const grouped = useMemo(() => groupByService(checks), [checks]);
  const stats = useMemo(() => computeStats(services, latest, checks, now), [services, latest, checks, now]);
  const hourly = useMemo(() => hourlySeries(checks, now), [checks, now]);
  const bands = useMemo(() => latencyBands(checks, now), [checks, now]);
  const recent = useMemo(
    () => [...checks].sort((a, b) => Date.parse(b.checked_at) - Date.parse(a.checked_at)).slice(0, 6),
    [checks],
  );

  // ---- latency chart: the busiest active services (max 5), series come from the database per range ----
  const chartServices = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of checks) counts[c.service_id] = (counts[c.service_id] ?? 0) + 1;
    return services
      .filter((s) => s.is_active !== false)
      .sort((a, b) => (counts[b.id] ?? 0) - (counts[a.id] ?? 0))
      .slice(0, 5);
  }, [services, checks]);
  const chartKey = chartServices.map((s) => s.id).join(",");
  const chartSvcRef = useRef(chartServices);
  const checksRef = useRef(checks);
  useEffect(() => { chartSvcRef.current = chartServices; checksRef.current = checks; });

  useEffect(() => {
    if (!overview) return;
    let cancelled = false;
    const cfg = RANGES[range];
    const load = async (first: boolean) => {
      const list = chartSvcRef.current;
      if (first) setChart((p) => ({ ...p, loading: true }));
      const supabase = createClient();
      const at = Date.now();
      const parts = await Promise.all(
        list.map(async (s) => {
          const { data, error } = await supabase.rpc("latency_buckets", {
            p_service_id: s.id, p_hours: cfg.hours, p_bucket_minutes: cfg.bucket,
          });
          // database function unavailable: fall back to the checks already loaded
          const rows = error
            ? bucketSeries(checksRef.current.filter((c) => c.service_id === s.id), at, cfg.hours, cfg.bucket)
            : parseBuckets(data);
          const from = at - cfg.hours * 3_600_000 - cfg.bucket * 60_000;
          return { id: s.id, name: s.name, rows: rows.filter((r) => r.t >= from) };
        }),
      );
      if (!cancelled) setChart({ fleet: mergeSeries(parts), loading: false });
    };
    load(true);
    const iv = setInterval(() => { if (!document.hidden) load(false); }, 30_000);
    return () => { cancelled = true; clearInterval(iv); };
  }, [overview, range, chartKey]);

  // ---- services list: filter, search, page ----
  const filtered = useMemo(
    () => filterServices(services, query).filter((s) => filter === "all" || latest[s.id]?.status === filter),
    [services, query, filter, latest],
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const shown = useMemo(
    () => (overview ? filtered.slice(0, OVERVIEW_COUNT) : filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)),
    [overview, filtered, safePage],
  );
  const sparks = useMemo(() => {
    const o: Record<string, (number | null)[]> = {};
    for (const s of shown) o[s.id] = sparkValues(grouped[s.id]);
    return o;
  }, [shown, grouped]);
  const uptimes = useMemo(() => {
    const o: Record<string, number | null> = {};
    for (const s of shown) o[s.id] = serviceUptime(grouped[s.id], now);
    return o;
  }, [shown, grouped, now]);

  // shareable URL for the services page (search and page) without a server round-trip
  useEffect(() => {
    if (overview) return;
    const p = new URLSearchParams();
    if (query.trim()) p.set("q", query.trim());
    if (safePage > 1) p.set("page", String(safePage));
    const qs = p.toString();
    window.history.replaceState(null, "", qs ? `/services?${qs}` : "/services");
  }, [overview, query, safePage]);

  const counts: Record<string, number> = { all: services.length, healthy: stats.healthy, degraded: stats.degraded, down: stats.down };
  const filters: { key: Status | "all"; label: string }[] = [
    { key: "all", label: "All" }, { key: "healthy", label: "Healthy" }, { key: "degraded", label: "Degraded" }, { key: "down", label: "Down" },
  ];
  const pageBtn = "glass grid h-9 min-w-9 place-items-center rounded-lg px-3 text-sm transition-colors hover:border-text/30 disabled:opacity-40";

  return (
    <div className="space-y-6">
      {/* header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
          <p className="mt-1 text-sm text-muted">{subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`glass inline-flex items-center gap-2 rounded-lg px-3 py-2 font-mono text-[11px] font-bold uppercase ${live ? "text-healthy" : "text-muted"}`} title="Realtime connection">
            <span className={live ? "status-dot" : "inline-block size-2 rounded-full bg-muted"} /> {live ? "Live" : "Connecting"}
          </span>
          <button type="button" onClick={() => setAuto((a) => !a)} aria-pressed={auto}
            title={`Probe every service every ${AUTO_MS / 1000}s while this page is open`}
            className={`glass inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${auto ? "text-brand-2" : "text-muted"}`}>
            {running ? <Loader2 className="size-3.5 animate-spin" /> : <Radio className="size-3.5" />}
            Auto-monitor {auto ? "on" : "off"}
          </button>
          {addSlot}
        </div>
      </div>

      {overview && (
        <>
          <KpiTiles stats={stats} uptimeSpark={hourly.uptime} latencySpark={hourly.latency} />

          <div className="grid gap-4 xl:grid-cols-3">
            <section className="glass rounded-xl p-5 xl:col-span-2">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-bold">API response time overview</h2>
                  <p className="label-mono mt-1">Average latency · last {RANGES[range].label}</p>
                </div>
                <div className={tabs} role="tablist" aria-label="Chart time range">
                  {RANGE_KEYS.map((r) => (
                    <button key={r} type="button" role="tab" aria-selected={range === r} onClick={() => setRange(r)} className={tab(range === r)}>{r}</button>
                  ))}
                </div>
              </div>
              <FleetChart data={chart.fleet.data} series={chart.fleet.series} range={range} loading={chart.loading}
                windowMs={RANGES[range].hours * 3_600_000} now={now} />
            </section>

            <section className="glass flex flex-col rounded-xl p-5">
              <h2 className="font-bold">API latency distribution</h2>
              <p className="label-mono mt-1">Checks analysed · {bands.total.toLocaleString()}</p>
              <ul className="mt-5 flex flex-1 flex-col justify-center gap-5">
                {bands.bands.map((b) => (
                  <li key={b.label}>
                    <div className="mb-1.5 flex items-baseline justify-between text-xs">
                      <span className="text-text">{b.label}</span>
                      <span className="font-mono text-muted">{b.count.toLocaleString()} · {Math.round(b.pct)}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-text/10">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${b.pct}%`, background: b.color }} />
                    </div>
                  </li>
                ))}
              </ul>
              <p className="mt-5 rounded-lg bg-text/5 px-3 py-2 font-mono text-[11px] text-muted">Degraded threshold · 500 ms</p>
            </section>
          </div>
        </>
      )}

      {/* services */}
      <section id="services" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {overview ? (
            <h2 className="text-lg font-bold">Monitored services</h2>
          ) : (
            <div className="relative w-full sm:w-80">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
              <input value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }}
                placeholder="Search name or URL…" aria-label="Search services" className="input-glass pl-9" />
            </div>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <div className={tabs} role="tablist" aria-label="Filter by status">
              {filters.map((f) => (
                <button key={f.key} type="button" role="tab" aria-selected={filter === f.key}
                  onClick={() => { setFilter(f.key); setPage(1); }} className={tab(filter === f.key)}>
                  {f.label} <span className="ml-1 font-mono opacity-70">{counts[f.key]}</span>
                </button>
              ))}
            </div>
            {overview && (
              <Link href="/services" className="inline-flex items-center gap-1 text-xs font-semibold text-brand-2 hover:underline">
                View all services <ArrowRight className="size-3.5" />
              </Link>
            )}
          </div>
        </div>

        {shown.length === 0 ? (
          <div className="glass grid place-items-center gap-3 rounded-xl px-6 py-14 text-center text-muted">
            <span className="grid size-12 place-items-center rounded-xl bg-brand/12 text-brand"><ServerOff className="size-6" /></span>
            {services.length === 0 ? (
              <>
                <p className="text-lg font-semibold text-text">Add your first API</p>
                <p className="max-w-sm text-sm">Only you can see the APIs you add. Paste a URL and monitoring starts right away.</p>
                <button type="button" className="btn-primary mt-2" onClick={() => window.dispatchEvent(new Event("open-add-service"))}>
                  <Plus className="size-4" /> Add service
                </button>
              </>
            ) : (
              <p>{query || filter !== "all" ? "No services match your search or filter." : "Nothing to show."}</p>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <AnimatePresence initial={false}>
              {shown.map((s) => (
                <StatusCard key={s.id} service={s} check={latest[s.id]} spark={sparks[s.id]} uptime={uptimes[s.id]} now={now} />
              ))}
            </AnimatePresence>
          </div>
        )}

        {!overview && totalPages > 1 && (
          <nav aria-label="Pagination" className="flex items-center justify-center gap-2 pt-2">
            <button className={pageBtn} disabled={safePage <= 1} onClick={() => setPage(safePage - 1)} aria-label="Previous page"><ChevronLeft className="size-4" /></button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((n) => n === 1 || n === totalPages || Math.abs(n - safePage) <= 1)
              .map((n, i, arr) => (
                <span key={n} className="flex items-center gap-2">
                  {i > 0 && n - arr[i - 1] > 1 && <span className="text-muted">…</span>}
                  <button onClick={() => setPage(n)} aria-current={n === safePage ? "page" : undefined}
                    className={`${pageBtn} ${n === safePage ? "bg-brand! border-brand! text-white!" : "text-muted"}`}>{n}</button>
                </span>
              ))}
            <button className={pageBtn} disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)} aria-label="Next page"><ChevronRight className="size-4" /></button>
          </nav>
        )}
        {!overview && (
          <p className="text-center text-xs text-muted">
            {filtered.length} service{filtered.length === 1 ? "" : "s"} · page {safePage} of {totalPages}
          </p>
        )}
      </section>

      {overview && (
        <div className="grid gap-4 xl:grid-cols-5">
          <section className="glass rounded-xl p-5 xl:col-span-2">
            <h2 className="font-bold">System topology</h2>
            <p className="label-mono mb-3 mt-1">Live connectivity · colour = latest status</p>
            <Topology services={services} latest={latest} />
          </section>
          <section className="glass rounded-xl p-5 xl:col-span-3">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <h2 className="font-bold">Recent executions</h2>
                <p className="label-mono mt-1">Newest checks across your services</p>
              </div>
              <Link href="/logs" className="inline-flex items-center gap-1 text-xs font-semibold text-brand-2 hover:underline">
                View all logs <ArrowRight className="size-3.5" />
              </Link>
            </div>
            <RecentLogs rows={recent} services={services} />
          </section>
        </div>
      )}
    </div>
  );
}
