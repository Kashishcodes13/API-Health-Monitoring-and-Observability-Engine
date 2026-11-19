import type { CheckRow, ServiceRow } from "./types";
import { pickNum, pickStr } from "./status";

export const HOUR = 3_600_000;
export const nowMs = () => Date.now();
const ts = (c: CheckRow) => Date.parse(c.checked_at);
const up = (c: CheckRow) => c.status !== "down";
const hasLat = (c: CheckRow) => c.latency_ms != null && c.status !== "down";

export function latestByService(checks: CheckRow[]): Record<string, CheckRow> {
  const out: Record<string, CheckRow> = {};
  for (const c of checks) {
    const cur = out[c.service_id];
    if (!cur || ts(c) > ts(cur)) out[c.service_id] = c;
  }
  return out;
}

export function groupByService(checks: CheckRow[]): Record<string, CheckRow[]> {
  const out: Record<string, CheckRow[]> = {};
  for (const c of checks) (out[c.service_id] ??= []).push(c);
  for (const k of Object.keys(out)) out[k].sort((a, b) => ts(a) - ts(b));
  return out;
}

export interface Stats {
  total: number;
  healthy: number;
  degraded: number;
  down: number;
  avg: number | null;
  uptime: number | null;
}

export function computeStats(
  services: ServiceRow[],
  latest: Record<string, CheckRow>,
  checks: CheckRow[],
  now: number,
): Stats {
  let healthy = 0, degraded = 0, down = 0;
  for (const s of services) {
    if (s.is_active === false) continue;
    const c = latest[s.id];
    if (!c) continue;
    if (c.status === "healthy") healthy++;
    else if (c.status === "degraded") degraded++;
    else if (c.status === "down") down++;
  }
  const win = checks.filter((c) => ts(c) >= now - 24 * HOUR);
  const lat = win.filter(hasLat).map((c) => c.latency_ms as number);
  return {
    total: services.length,
    healthy,
    degraded,
    down,
    avg: lat.length ? lat.reduce((a, b) => a + b, 0) / lat.length : null,
    uptime: win.length ? (win.filter(up).length / win.length) * 100 : null,
  };
}

export interface Fleet {
  data: Record<string, number | null>[];
  series: { id: string; name: string }[];
}

/** Hourly average latency per service for the last `hours` hours (top N busiest services). */
export function fleetSeries(services: ServiceRow[], checks: CheckRow[], now: number, hours = 24, topN = 5): Fleet {
  const start = Math.floor((now - hours * HOUR) / HOUR) * HOUR;
  const n = hours + 1;
  const acc: Record<string, { sum: number; n: number }[]> = {};
  const counts: Record<string, number> = {};
  for (const c of checks) {
    const t = ts(c);
    if (!hasLat(c) || t < start) continue;
    const i = Math.floor((t - start) / HOUR);
    if (i < 0 || i >= n) continue;
    const row = (acc[c.service_id] ??= Array.from({ length: n }, () => ({ sum: 0, n: 0 })));
    row[i].sum += c.latency_ms as number;
    row[i].n += 1;
    counts[c.service_id] = (counts[c.service_id] ?? 0) + 1;
  }
  const names = new Map(services.map((s) => [s.id, s.name]));
  const series = Object.keys(counts)
    .filter((id) => names.has(id))
    .sort((a, b) => counts[b] - counts[a])
    .slice(0, topN)
    .map((id) => ({ id, name: names.get(id) as string }));
  const data = Array.from({ length: n }, (_, i) => {
    const row: Record<string, number | null> = { t: start + i * HOUR };
    for (const s of series) {
      const cell = acc[s.id]?.[i];
      row[s.id] = cell && cell.n ? Math.round(cell.sum / cell.n) : null;
    }
    return row;
  });
  return { data, series };
}

export function sparkValues(rows: CheckRow[] | undefined, n = 24): (number | null)[] {
  return (rows ?? []).slice(-n).map((c) => (hasLat(c) ? (c.latency_ms as number) : null));
}

export function bucketSeries(checks: CheckRow[], now: number, hours: number, bucketMin: number) {
  const bms = bucketMin * 60_000;
  const start = Math.floor((now - hours * HOUR) / bms) * bms;
  const map = new Map<number, { sum: number; n: number }>();
  for (const c of checks) {
    const t = ts(c);
    if (!hasLat(c) || t < start) continue;
    const key = start + Math.floor((t - start) / bms) * bms;
    const cell = map.get(key) ?? { sum: 0, n: 0 };
    cell.sum += c.latency_ms as number;
    cell.n += 1;
    map.set(key, cell);
  }
  return [...map.entries()].sort((a, b) => a[0] - b[0]).map(([t, v]) => ({ t, value: Math.round(v.sum / v.n) }));
}

const BINS: [string, number, number][] = [
  ["<100", 0, 100], ["100-250", 100, 250], ["250-500", 250, 500],
  ["500-1k", 500, 1000], ["1-2s", 1000, 2000], [">2s", 2000, Infinity],
];

export function distribution(checks: CheckRow[]) {
  const lat = checks.filter(hasLat).map((c) => c.latency_ms as number);
  if (!lat.length) return [];
  return BINS.map(([label, lo, hi]) => ({ label, value: lat.filter((v) => v >= lo && v < hi).length }));
}

export function dailyUptime(checks: CheckRow[], days: number, now: number) {
  const by = new Map<string, { ok: number; n: number }>();
  for (const c of checks) {
    const key = new Date(ts(c)).toISOString().slice(0, 10);
    const cell = by.get(key) ?? { ok: 0, n: 0 };
    cell.n += 1;
    if (up(c)) cell.ok += 1;
    by.set(key, cell);
  }
  return Array.from({ length: days }, (_, i) => {
    const day = new Date(now - (days - 1 - i) * 86_400_000).toISOString().slice(0, 10);
    const cell = by.get(day);
    return { day, pct: cell ? (cell.ok / cell.n) * 100 : null };
  });
}

/* ---------- chart time ranges (dashboard and service page share these) ---------- */
export type RangeKey = "1h" | "12h" | "24h" | "7d" | "30d";

/** `bucket` = minutes per point, chosen so every range draws roughly 60 to 170 points. */
export const RANGES: Record<RangeKey, { hours: number; bucket: number; label: string }> = {
  "1h": { hours: 1, bucket: 1, label: "1 hour" },
  "12h": { hours: 12, bucket: 10, label: "12 hours" },
  "24h": { hours: 24, bucket: 15, label: "24 hours" },
  "7d": { hours: 168, bucket: 60, label: "7 days" },
  "30d": { hours: 720, bucket: 360, label: "30 days" },
};
export const RANGE_KEYS = Object.keys(RANGES) as RangeKey[];

export interface BucketRow { t: number; value: number }

/** Reads rows from the latency_buckets() database function (column names are tolerated). */
export function parseBuckets(rows: unknown): BucketRow[] {
  if (!Array.isArray(rows)) return [];
  const out: BucketRow[] = [];
  for (const r of rows) {
    const t = Date.parse(pickStr(r, "bucket", "bucket_start", "ts", "time") ?? "");
    const v = pickNum(r, "avg_ms", "avg_latency_ms", "avg_latency", "avg");
    if (!Number.isNaN(t) && v != null) out.push({ t, value: Math.round(v) });
  }
  return out.sort((a, b) => a.t - b.t);
}

/** Joins one bucket list per service into chart rows (one row per timestamp). */
export function mergeSeries(parts: { id: string; name: string; rows: BucketRow[] }[]): Fleet {
  const live = parts.filter((p) => p.rows.length);
  const times = Array.from(new Set(live.flatMap((p) => p.rows.map((r) => r.t)))).sort((a, b) => a - b);
  const maps = live.map((p) => new Map(p.rows.map((r) => [r.t, r.value] as const)));
  const data = times.map((t) => {
    const row: Record<string, number | null> = { t };
    live.forEach((p, i) => { row[p.id] = maps[i].get(t) ?? null; });
    return row;
  });
  return { data, series: live.map((p) => ({ id: p.id, name: p.name })) };
}

/* ---------- KPI helpers ---------- */

/** Uptime % and average latency per hour for the last `hours` hours (null = no checks that hour). */
export function hourlySeries(checks: CheckRow[], now: number, hours = 24) {
  const start = Math.floor((now - hours * HOUR) / HOUR) * HOUR;
  const n = hours + 1;
  const ups = Array.from({ length: n }, () => ({ ok: 0, n: 0 }));
  const lats = Array.from({ length: n }, () => ({ sum: 0, n: 0 }));
  for (const c of checks) {
    const t = ts(c);
    if (t < start) continue;
    const i = Math.floor((t - start) / HOUR);
    if (i < 0 || i >= n) continue;
    ups[i].n += 1;
    if (up(c)) ups[i].ok += 1;
    if (hasLat(c)) { lats[i].sum += c.latency_ms as number; lats[i].n += 1; }
  }
  return {
    uptime: ups.map((b) => (b.n ? (b.ok / b.n) * 100 : null)),
    latency: lats.map((b) => (b.n ? Math.round(b.sum / b.n) : null)),
  };
}

export interface Band { label: string; count: number; pct: number; color: string }

/** Latency distribution for the last 24 hours in four readable bands. */
export function latencyBands(checks: CheckRow[], now: number): { bands: Band[]; total: number } {
  const lat = checks.filter((c) => ts(c) >= now - 24 * HOUR && hasLat(c)).map((c) => c.latency_ms as number);
  const defs: [string, number, number, string][] = [
    ["Under 100 ms", 0, 100, "#22c55e"],
    ["100 - 300 ms", 100, 300, "#3b82f6"],
    ["300 - 500 ms", 300, 500, "#a78bfa"],
    ["500 ms and above", 500, Infinity, "#f59e0b"],
  ];
  const total = lat.length;
  return {
    total,
    bands: defs.map(([label, lo, hi, color]) => {
      const count = lat.filter((v) => v >= lo && v < hi).length;
      return { label, count, pct: total ? (count / total) * 100 : 0, color };
    }),
  };
}

/** 24 hour uptime for one service, or null when it has no checks in that window. */
export function serviceUptime(rows: CheckRow[] | undefined, now: number): number | null {
  const win = (rows ?? []).filter((c) => ts(c) >= now - 24 * HOUR);
  return win.length ? (win.filter(up).length / win.length) * 100 : null;
}
