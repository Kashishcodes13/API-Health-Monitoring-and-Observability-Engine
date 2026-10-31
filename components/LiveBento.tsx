"use client";
/**
 * REAL monitoring on the landing page: your browser probes public APIs every few seconds
 * and measures the actual latency. Nothing here is sample data.
 */
import { useEffect, useState } from "react";
import { Gauge, Radio, ShieldCheck } from "lucide-react";
import { Sparkline } from "./Sparkline";
import { TONE } from "@/lib/frontend/status";
import type { Status } from "@/lib/frontend/types";

const TARGETS = [
  { name: "api.github.com", url: "https://api.github.com/rate_limit" },
  { name: "githubstatus.com", url: "https://www.githubstatus.com/api/v2/status.json" },
  { name: "jsonplaceholder.typicode.com", url: "https://jsonplaceholder.typicode.com/posts/1" },
];
const INTERVAL = 4000;
const KEEP = 30;
const ROUNDS = 24;

interface Sample { ms: number | null; status: Status; at: number }
interface Round { status: Status; avg: number | null }

async function probe(url: string): Promise<Sample> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 5000);
  const t0 = performance.now();
  try {
    const res = await fetch(`${url}${url.includes("?") ? "&" : "?"}_=${Date.now()}`, { cache: "no-store", signal: ctrl.signal });
    await res.arrayBuffer();
    const ms = Math.round(performance.now() - t0);
    if (!res.ok) return { ms: null, status: "down", at: Date.now() };
    return { ms, status: ms < 500 ? "healthy" : "degraded", at: Date.now() };
  } catch {
    return { ms: null, status: "down", at: Date.now() };
  } finally {
    clearTimeout(timer);
  }
}

const median = (a: number[]) => {
  if (!a.length) return null;
  const s = [...a].sort((x, y) => x - y);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
};

export function LiveBento() {
  const [series, setSeries] = useState<Sample[][]>(() => TARGETS.map(() => []));
  const [rounds, setRounds] = useState<Round[]>([]);
  const [now, setNow] = useState(0);

  useEffect(() => {
    let stop = false;
    let busy = false;
    const tick = async () => {
      if (busy || document.hidden) return;
      busy = true;
      const results = await Promise.all(TARGETS.map((t) => probe(t.url)));
      if (!stop) {
        setSeries((prev) => TARGETS.map((_, i) => [...(prev[i] ?? []), results[i]].slice(-KEEP)));
        const lat = results.filter((r) => r.ms != null).map((r) => r.ms as number);
        const status: Status = results.some((r) => r.status === "down") ? "down"
          : results.some((r) => r.status === "degraded") ? "degraded" : "healthy";
        setRounds((prev) => [...prev, { status, avg: lat.length ? lat.reduce((a, b) => a + b, 0) / lat.length : null }].slice(-ROUNDS));
        setNow(Date.now());
      }
      busy = false;
    };
    tick();
    const iv = setInterval(tick, INTERVAL);
    const clock = setInterval(() => setNow(Date.now()), 1000);
    return () => { stop = true; clearInterval(iv); clearInterval(clock); };
  }, []);

  const ready = rounds.length > 0;
  const uptime = ready ? (rounds.filter((r) => r.status !== "down").length / rounds.length) * 100 : null;
  const med = median(series.flatMap((s) => s.map((x) => x.ms).filter((v): v is number => v != null)));
  const barBg = { healthy: "bg-healthy/80", degraded: "bg-degraded", down: "bg-down", unknown: "bg-white/10" };

  return (
    <>
      <article className="glass-strong bento-card md:col-span-4 md:row-span-2">
        <div className="mb-5 flex items-center justify-between text-sm text-muted">
          <span className="flex items-center gap-2"><Radio className="size-4 text-brand-2" /> Live status</span>
          <span className="flex items-center gap-2 text-xs text-healthy"><span className="status-dot" /> probing every {INTERVAL / 1000}s</span>
        </div>
        <ul className="space-y-3">
          {TARGETS.map((t, i) => {
            const last = series[i].at(-1);
            const tone = TONE[last?.status ?? "unknown"];
            return (
              <li key={t.name} className={`glass rounded-2xl px-4 py-3 ${tone.text} ${tone.glow}`}>
                <div className="flex items-center justify-between gap-3">
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="status-dot" />
                    <span className="truncate font-mono text-sm text-text">{t.name}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-4 text-sm">
                    <span className="font-mono text-muted">{last ? (last.ms != null ? `${last.ms}ms` : "failed") : "probing…"}</span>
                    <span className="w-16 text-right font-medium">{last ? tone.label : ""}</span>
                  </span>
                </div>
                <Sparkline values={series[i].map((s) => s.ms)} className="mt-2 h-6 w-full" color="currentColor" />
              </li>
            );
          })}
        </ul>
        <p className="mt-5 text-sm text-muted">
          Real requests from your browser, measured live. Under 500 ms is healthy, 500 ms or more is degraded, and errors or a 5 s timeout mean down.
          {ready && now > 0 && ` Last round ${Math.max(0, Math.round((now - (series[0].at(-1)?.at ?? now)) / 1000))}s ago.`}
        </p>
      </article>

      <article className="glass bento-card md:col-span-2">
        <ShieldCheck className="mb-4 size-5 text-healthy" />
        <div className="text-4xl font-bold tracking-tight">{uptime == null ? "—" : `${uptime.toFixed(uptime === 100 ? 0 : 1)}%`}</div>
        <p className="mt-1 text-sm text-muted">Uptime this session</p>
        <div className="mt-4 flex gap-1" aria-hidden>
          {Array.from({ length: ROUNDS }).map((_, i) => {
            const r = rounds[i - (ROUNDS - rounds.length)];
            return <span key={i} className={`h-6 flex-1 rounded-sm ${r ? barBg[r.status] : barBg.unknown}`} />;
          })}
        </div>
      </article>

      <article className="glass bento-card md:col-span-2">
        <Gauge className="mb-4 size-5 text-brand-2" />
        <div className="text-4xl font-bold tracking-tight">{med == null ? "—" : med}<span className="text-xl text-muted">ms</span></div>
        <p className="text-sm text-muted">Median latency · live</p>
        <Sparkline values={rounds.map((r) => r.avg)} className="mt-3 h-12 w-full" />
      </article>
    </>
  );
}
