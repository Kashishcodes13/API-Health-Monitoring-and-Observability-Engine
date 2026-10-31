import type { CheckRow, ServiceRow } from "./types";

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
