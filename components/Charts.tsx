"use client";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, LabelList, ReferenceLine,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import type { RangeKey } from "@/lib/frontend/analytics";

export interface Point { label: string; value: number }
export interface TimePoint { t: number; value: number }

const GRID = "rgba(148,163,184,0.12)";
const AXIS = { stroke: "#8a97b4", fontSize: 11, tickLine: false, axisLine: false, tickMargin: 8 } as const;
export const PALETTE = ["#60a5fa", "#f472b6", "#a78bfa", "#34d399", "#fbbf24"];

const fmtMs = (v: number) => (v >= 1000 ? `${+(v / 1000).toFixed(1)}s` : `${Math.round(v)}`);

/** Round, evenly spaced y ticks that always include the 500 ms threshold line. */
function niceAxis(dataMax: number) {
  const top = Math.max(dataMax * 1.15, 600);
  const step = [50, 100, 200, 250, 500, 1000, 2000, 5000].find((s) => top / s <= 5) ?? 10000;
  const max = Math.ceil(top / step) * step;
  return { max, ticks: Array.from({ length: Math.round(max / step) + 1 }, (_, i) => i * step) };
}

/** X-axis label that suits the range: clock time, weekday + hour, or calendar date. */
function fmtAxis(t: number, range: RangeKey) {
  const d = new Date(t);
  if (range === "30d") return d.toLocaleDateString([], { month: "short", day: "numeric" });
  if (range === "7d") return d.toLocaleString([], { weekday: "short", hour: "numeric" });
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
const fmtFull = (t: number) =>
  new Date(t).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

/* ---------- shared tooltip ---------- */
interface TipItem { name?: string | number; value?: number | string | null; color?: string; stroke?: string; fill?: string; payload?: { fill?: string } }
interface TipProps {
  active?: boolean;
  payload?: readonly TipItem[];
  label?: string | number;
  title?: (l: string | number) => string;
  unit?: string;
}

function ChartTooltip({ active, payload, label, title, unit = "ms" }: TipProps) {
  const rows = (payload ?? []).filter((p) => p.value != null);
  if (!active || rows.length === 0) return null;
  return (
    <div className="glass-strong min-w-40 rounded-xl px-3.5 py-2.5 text-xs">
      {label !== undefined && <div className="label-mono mb-1.5">{title ? title(label) : String(label)}</div>}
      <ul className="space-y-1">
        {rows.map((r, i) => (
          <li key={i} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2 text-text">
              <span className="size-2 rounded-full" style={{ background: r.color ?? r.stroke ?? r.fill ?? r.payload?.fill ?? "#60a5fa" }} />
              {r.name}
            </span>
            <span className="font-mono font-semibold text-text">{Math.round(Number(r.value)).toLocaleString()}{unit ? ` ${unit}` : ""}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const Threshold = () => (
  <ReferenceLine y={500} stroke="#f59e0b" strokeDasharray="5 5" strokeOpacity={0.75}
    label={{ value: "500 ms degraded", position: "insideTopRight", fill: "#fbbf24", fontSize: 10 }} />
);

/* ---------- single-service latency (detail page) ---------- */
export function LatencyChart({ data, range = "24h" }: { data: TimePoint[]; range?: RangeKey }) {
  if (!data.length) return <Empty />;
  const ax = niceAxis(Math.max(...data.map((d) => d.value)));
  return (
    <ResponsiveContainer width="100%" height={270}>
      <AreaChart data={data} margin={{ left: -8, right: 12, top: 14, bottom: 0 }}>
        <defs>
          <linearGradient id="latFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.32} />
            <stop offset="100%" stopColor="#60a5fa" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="latStroke" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#f43f5e" />
            <stop offset="100%" stopColor="#60a5fa" />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={GRID} strokeDasharray="3 6" vertical={false} />
        <XAxis dataKey="t" type="number" scale="time" domain={["dataMin", "dataMax"]} tickFormatter={(t) => fmtAxis(Number(t), range)} {...AXIS} minTickGap={48} />
        <YAxis {...AXIS} tickFormatter={fmtMs} domain={[0, ax.max]} ticks={ax.ticks} width={44} />
        <Threshold />
        <Tooltip cursor={{ stroke: "#60a5fa", strokeOpacity: 0.3, strokeWidth: 1.5 }} content={<ChartTooltip title={(l) => fmtFull(Number(l))} />} />
        <Area name="Avg latency" type="monotone" dataKey="value" stroke="url(#latStroke)" strokeWidth={3}
          fill="url(#latFill)" dot={data.length <= 30 ? { r: 3, strokeWidth: 0, fill: "#60a5fa" } : false}
          activeDot={{ r: 5, stroke: "#0d1426", strokeWidth: 2, fill: "#60a5fa" }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/* ---------- latency distribution (detail page) ---------- */
const BIN_COLOR: Record<string, string> = {
  "<100": "#22c55e", "100-250": "#4ade80", "250-500": "#86efac",
  "500-1k": "#f59e0b", "1-2s": "#fb7185", ">2s": "#ef4444",
};

export function DistributionChart({ data }: { data: Point[] }) {
  if (!data.length) return <Empty />;
  return (
    <ResponsiveContainer width="100%" height={270}>
      <BarChart data={data} margin={{ left: -18, right: 6, top: 20, bottom: 0 }} barCategoryGap="22%">
        <CartesianGrid stroke={GRID} strokeDasharray="3 6" vertical={false} />
        <XAxis dataKey="label" {...AXIS} />
        <YAxis {...AXIS} allowDecimals={false} width={36} />
        <Tooltip cursor={{ fill: "rgba(148,163,184,0.08)" }} content={<ChartTooltip unit="checks" />} />
        <Bar name="Checks" dataKey="value" radius={[7, 7, 2, 2]}>
          {data.map((d) => <Cell key={d.label} fill={BIN_COLOR[d.label] ?? "#60a5fa"} />)}
          <LabelList dataKey="value" position="top" fill="#8a97b4" fontSize={11} formatter={(v: unknown) => (Number(v) > 0 ? String(v) : "")} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ---------- fleet latency (dashboard): one line per service, fits the data it has ---------- */
export function FleetChart({
  data, series, range = "24h", loading = false, windowMs = 24 * 3_600_000, now = 0,
}: {
  data: Record<string, number | null>[];
  series: { id: string; name: string }[];
  range?: RangeKey;
  loading?: boolean;
  windowMs?: number;
  now?: number;
}) {
  if (!series.length) {
    return loading
      ? <div className="skeleton h-72" />
      : <Empty text="No checks in this period yet. Lines appear here as results arrive." />;
  }
  const first = Number(data[0].t);
  const last = Number(data[data.length - 1].t);
  const start = Math.max(first, now ? now - windowMs : first);
  const [x0, x1] = last > start ? [start, last] : [start - 60_000, last + 60_000];
  const sparse = data.length <= 30;
  const partial = last - first < windowMs * 0.85;
  const ax = niceAxis(Math.max(0, ...data.flatMap((r) => series.map((s) => Number(r[s.id] ?? 0)))));
  return (
    <div className={loading ? "opacity-60 transition-opacity" : "transition-opacity"}>
      <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={data} margin={{ left: -8, right: 12, top: 14, bottom: 0 }}>
          <defs>
            {series.map((s, i) => (
              <linearGradient key={s.id} id={`fleet-${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={PALETTE[i % PALETTE.length]} stopOpacity={0.2} />
                <stop offset="100%" stopColor={PALETTE[i % PALETTE.length]} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid stroke={GRID} strokeDasharray="3 6" vertical={false} />
          <XAxis dataKey="t" type="number" scale="time" domain={[x0, x1]} allowDataOverflow tickFormatter={(t) => fmtAxis(Number(t), range)} {...AXIS} minTickGap={56} />
          <YAxis {...AXIS} tickFormatter={fmtMs} domain={[0, ax.max]} ticks={ax.ticks} width={44} />
          <Threshold />
          <Tooltip cursor={{ stroke: "#60a5fa", strokeOpacity: 0.3, strokeWidth: 1.5 }} content={<ChartTooltip title={(l) => fmtFull(Number(l))} />} />
          {series.map((s, i) => (
            <Area key={s.id} name={s.name} dataKey={s.id} type="monotone" stroke={PALETTE[i % PALETTE.length]} strokeWidth={2.25}
              fill={`url(#fleet-${i})`} connectNulls isAnimationActive={false}
              dot={sparse ? { r: 3, strokeWidth: 0, fill: PALETTE[i % PALETTE.length] } : false}
              activeDot={{ r: 5, stroke: "#0d1426", strokeWidth: 2 }} />
          ))}
        </AreaChart>
      </ResponsiveContainer>
      <ul className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        {series.map((s, i) => (
          <li key={s.id} className="inline-flex items-center gap-2 rounded-md bg-text/5 px-2.5 py-1 text-text">
            <span className="size-2 rounded-full" style={{ background: PALETTE[i % PALETTE.length] }} />
            {s.name}
          </li>
        ))}
        {partial && <li className="text-muted">Data since {fmtFull(first)}. The chart fills in as history builds up.</li>}
      </ul>
    </div>
  );
}

function Empty({ text = "Not enough data yet" }: { text?: string }) {
  return (
    <div className="grid h-56 place-items-center rounded-xl border border-dashed border-line px-6 text-center text-sm text-muted">
      {text}
    </div>
  );
}
