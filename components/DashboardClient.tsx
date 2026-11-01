"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Loader2, Plus, Radio, Search, ServerOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { CheckRow, ServiceRow, Status } from "@/lib/frontend/types";
import { normalizeCheck } from "@/lib/frontend/status";
import { filterServices } from "@/lib/frontend/service";
import { computeStats, fleetSeries, groupByService, latestByService, sparkValues } from "@/lib/frontend/analytics";
import { checkNowAction } from "@/lib/frontend/actions";
import { StatusCard } from "./StatusCard";
import { StatsBento } from "./StatsBento";
import { FleetChart, StatusDonut } from "./ChartsLazy";

const PAGE_SIZE = 9;
const AUTO_MS = 60_000;   // auto-monitor interval
const FLUSH_MS = 800;     // realtime events are applied in ONE batch per window
const MAX_CHECKS = 2000;

const FILTERS: { key: Status | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "healthy", label: "Healthy" },
  { key: "degraded", label: "Degraded" },
  { key: "down", label: "Down" },
];

export function DashboardClient({
  services,
  initialChecks,
  serverNow,
  initialQ,
  initialPage,
}: {
  services: ServiceRow[];
  initialChecks: CheckRow[];
  serverNow: number;
  initialQ: string;
  initialPage: number;
}) {
  const router = useRouter();
  const [checks, setChecks] = useState(initialChecks);
  const [filter, setFilter] = useState<Status | "all">("all");
  const [query, setQuery] = useState(initialQ);
  const [page, setPage] = useState(initialPage);
  const [live, setLive] = useState(false);
  const [auto, setAuto] = useState(true);
  const [running, setRunning] = useState(false);
  const [now, setNow] = useState(serverNow);

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

  // Realtime: every new health check lands here instantly.
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
      .channel("dashboard-live")
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
  }, [router]);

  // Auto-monitor: probes every active service on a timer while the dashboard is open.
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
  const fleet = useMemo(() => fleetSeries(services, checks, now), [services, checks, now]);

  const filtered = useMemo(
    () => filterServices(services, query).filter((s) => filter === "all" || latest[s.id]?.status === filter),
    [services, query, filter, latest],
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = useMemo(() => filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE), [filtered, safePage]);
  const sparks = useMemo(() => {
    const o: Record<string, (number | null)[]> = {};
    for (const s of pageItems) o[s.id] = sparkValues(grouped[s.id]);
    return o;
  }, [pageItems, grouped]);

  // shareable URL without a server round-trip
  useEffect(() => {
    const p = new URLSearchParams();
    if (query.trim()) p.set("q", query.trim());
    if (safePage > 1) p.set("page", String(safePage));
    const qs = p.toString();
    window.history.replaceState(null, "", qs ? `/dashboard?${qs}` : "/dashboard");
  }, [query, safePage]);

  const btn = "glass grid h-9 min-w-9 place-items-center rounded-xl px-3 text-sm transition hover:border-brand/40 disabled:opacity-40";

  return (
    <>
      <StatsBento stats={stats} />

      <div className="bento-grid mt-4">
        <section className="glass bento-card md:col-span-4">
          <h2 className="mb-3 font-semibold">Latency · last 24h</h2>
          <FleetChart data={fleet.data} series={fleet.series} />
        </section>
        <section className="glass bento-card md:col-span-2">
          <h2 className="mb-3 font-semibold">Status mix</h2>
          <StatusDonut healthy={stats.healthy} degraded={stats.degraded} down={stats.down} />
        </section>
      </div>

      <section className="mt-8">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative lg:w-80">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <input
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1); }}
              placeholder="Search name or URL…"
              aria-label="Search services"
              className="input-glass pl-10"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="glass flex rounded-2xl p-1" role="tablist" aria-label="Filter by status">
              {FILTERS.map((f) => (
                <button key={f.key} role="tab" aria-selected={filter === f.key}
                  onClick={() => { setFilter(f.key); setPage(1); }}
                  className={`rounded-xl px-3 py-1.5 text-xs transition ${filter === f.key ? "bg-white text-brand shadow-sm" : "text-muted hover:text-text"}`}>
                  {f.label}
                </button>
              ))}
            </div>
            <button onClick={() => setAuto((a) => !a)} aria-pressed={auto}
              title={`Probe every service every ${AUTO_MS / 1000}s while this page is open`}
              className={`glass inline-flex items-center gap-2 rounded-2xl px-3.5 py-2 text-xs transition ${auto ? "text-brand-2" : "text-muted"}`}>
              {running ? <Loader2 className="size-3.5 animate-spin" /> : <Radio className="size-3.5" />}
              Auto-monitor {auto ? "on" : "off"}
            </button>
            <span className={`flex items-center gap-1.5 text-xs ${live ? "text-healthy" : "text-muted"}`} title="Realtime connection">
              <span className={live ? "status-dot" : "inline-block size-2 rounded-full bg-muted"} /> {live ? "Live" : "Connecting"}
            </span>
          </div>
        </div>

        {pageItems.length === 0 ? (
          <div className="glass grid place-items-center gap-3 rounded-3xl px-6 py-16 text-center text-muted">
            <span className="grid size-14 place-items-center rounded-2xl bg-brand/10 text-brand"><ServerOff className="size-7" /></span>
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
              {pageItems.map((s) => (
                <StatusCard key={s.id} service={s} check={latest[s.id]} spark={sparks[s.id]} now={now} />
              ))}
            </AnimatePresence>
          </div>
        )}

        {totalPages > 1 && (
          <nav aria-label="Pagination" className="mt-6 flex items-center justify-center gap-2">
            <button className={btn} disabled={safePage <= 1} onClick={() => setPage(safePage - 1)} aria-label="Previous page">
              <ChevronLeft className="size-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((n) => n === 1 || n === totalPages || Math.abs(n - safePage) <= 1)
              .map((n, i, arr) => (
                <span key={n} className="flex items-center gap-2">
                  {i > 0 && n - arr[i - 1] > 1 && <span className="text-muted">…</span>}
                  <button onClick={() => setPage(n)} aria-current={n === safePage ? "page" : undefined}
                    className={`${btn} ${n === safePage ? "bg-brand! border-brand! text-white!" : "text-muted"}`}>
                    {n}
                  </button>
                </span>
              ))}
            <button className={btn} disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)} aria-label="Next page">
              <ChevronRight className="size-4" />
            </button>
          </nav>
        )}
        <p className="mt-4 text-center text-xs text-muted">
          {filtered.length} service{filtered.length === 1 ? "" : "s"} · page {safePage} of {totalPages}
        </p>
      </section>
    </>
  );
}
