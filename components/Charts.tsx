"use client";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, LabelList, Pie, PieChart,
  ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

export interface Point { label: string; value: number }
export interface TimePoint { t: number; value: number }

const GRID = "rgba(15,23,42,0.07)";
const AXIS = { stroke: "#94a3b8", fontSize: 11, tickLine: false, axisLine: false, tickMargin: 8 } as const;
export const PALETTE = ["#6366f1", "#06b6d4", "#8b5cf6", "#10b981", "#f59e0b"];

const fmtMs = (v: number) => (v >= 1000 ? `${+(v / 1000).toFixed(1)}s` : `${Math.round(v)}`);
const yMax = (dataMax: number) => Math.max(Math.ceil((dataMax * 1.18) / 50) * 50, 600);

function fmtTime(t: number, range: "24h" | "7d" | "30d") {
  const d = new Date(t);
  return range === "24h"
    ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString([], { month: "short", day: "numeric" });
}

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
    <div className="glass-strong min-w-36 rounded-2xl px-3.5 py-2.5 text-xs">
      {label !== undefined && (
        <div className="mb-1.5 font-medium text-muted">{title ? title(label) : String(label)}</div>
      )}
      <ul className="space-y-1">
        {rows.map((r, i) => (
          <li key={i} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2 text-text">
              <span className="size-2 rounded-full" style={{ background: r.color ?? r.stroke ?? r.fill ?? r.payload?.fill ?? "#6366f1" }} />
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
  <ReferenceLine y={500} stroke="#d97706" strokeDasharray="5 5" strokeOpacity={0.7}
    label={{ value: "500 ms · degraded", position: "insideTopRight", fill: "#b45309", fontSize: 10 }} />
);

/* ---------- single-service latency (detail page) ---------- */
export function LatencyChart({ data, range = "24h" }: { data: TimePoint[]; range?: "24h" | "7d" | "30d" }) {
  if (!data.length) return <Empty />;
  return (
    <ResponsiveContainer width="100%" height={270}>
      <AreaChart data={data} margin={{ left: -8, right: 12, top: 14, bottom: 0 }}>
        <defs>
          <linearGradient id="latFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="latStroke" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={GRID} strokeDasharray="3 6" vertical={false} />
        <XAxis dataKey="t" type="number" scale="time" domain={["dataMin", "dataMax"]} tickFormatter={(t) => fmtTime(Number(t), range)} {...AXIS} minTickGap={48} />
        <YAxis {...AXIS} tickFormatter={fmtMs} domain={[0, yMax]} width={44} />
        <Threshold />
        <Tooltip cursor={{ stroke: "#6366f1", strokeOpacity: 0.25, strokeWidth: 1.5 }}
          content={<ChartTooltip title={(l) => new Date(Number(l)).toLocaleString()} />} />
        <Area name="Avg latency" type="monotone" dataKey="value" stroke="url(#latStroke)" strokeWidth={3}
          fill="url(#latFill)" activeDot={{ r: 5, stroke: "#fff", strokeWidth: 2, fill: "#6366f1" }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/* ---------- latency distribution (detail page) ---------- */
const BIN_COLOR: Record<string, string> = {
  "<100": "#10b981", "100-250": "#34d399", "250-500": "#6ee7b7",
  "500-1k": "#f59e0b", "1-2s": "#fb7185", ">2s": "#e11d48",
};

export function DistributionChart({ data }: { data: Point[] }) {
  if (!data.length) return <Empty />;
  return (
    <ResponsiveContainer width="100%" height={270}>
      <BarChart data={data} margin={{ left: -18, right: 6, top: 20, bottom: 0 }} barCategoryGap="22%">
        <CartesianGrid stroke={GRID} strokeDasharray="3 6" vertical={false} />
        <XAxis dataKey="label" {...AXIS} />
        <YAxis {...AXIS} allowDecimals={false} width={36} />
        <Tooltip cursor={{ fill: "rgba(99,102,241,0.07)", radius: 8 }} content={<ChartTooltip unit="checks" />} />
        <Bar name="Checks" dataKey="value" radius={[9, 9, 3, 3]}>
          {data.map((d) => <Cell key={d.label} fill={BIN_COLOR[d.label] ?? "#6366f1"} />)}
          <LabelList dataKey="value" position="top" fill="#64748b" fontSize={11} formatter={(v) => (Number(v) > 0 ? String(v) : "")} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ---------- fleet latency (dashboard) ---------- */
export function FleetChart({
  data,
  series,
}: {
  data: Record<string, number | null>[];
  series: { id: string; name: string }[];
}) {
  if (!series.length) {
    return <Empty text="Waiting for checks. Lines appear here as results arrive." />;
  }
  return (
    <div>
      <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={data} margin={{ left: -8, right: 12, top: 14, bottom: 0 }}>
          <defs>
            {series.map((s, i) => (
              <linearGradient key={s.id} id={`fleet-${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={PALETTE[i % PALETTE.length]} stopOpacity={0.22} />
                <stop offset="100%" stopColor={PALETTE[i % PALETTE.length]} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid stroke={GRID} strokeDasharray="3 6" vertical={false} />
          <XAxis dataKey="t" type="number" scale="time" domain={["dataMin", "dataMax"]} tickFormatter={(t) => fmtTime(Number(t), "24h")} {...AXIS} minTickGap={48} />
          <YAxis {...AXIS} tickFormatter={fmtMs} domain={[0, yMax]} width={44} />
          <Threshold />
          <Tooltip cursor={{ stroke: "#6366f1", strokeOpacity: 0.25, strokeWidth: 1.5 }}
            content={<ChartTooltip title={(l) => new Date(Number(l)).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} />} />
          {series.map((s, i) => (
            <Area key={s.id} name={s.name} dataKey={s.id} type="monotone" stroke={PALETTE[i % PALETTE.length]} strokeWidth={2.5}
              fill={`url(#fleet-${i})`} connectNulls isAnimationActive={false}
              dot={false} activeDot={{ r: 5, stroke: "#fff", strokeWidth: 2 }} />
          ))}
        </AreaChart>
      </ResponsiveContainer>
      <ul className="mt-3 flex flex-wrap gap-2 text-xs">
        {series.map((s, i) => (
          <li key={s.id} className="inline-flex items-center gap-2 rounded-full bg-text/5 px-3 py-1 text-text">
            <span className="size-2 rounded-full" style={{ background: PALETTE[i % PALETTE.length] }} />
            {s.name}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------- status mix donut (dashboard) ---------- */
export function StatusDonut({ healthy, degraded, down }: { healthy: number; degraded: number; down: number }) {
  const total = healthy + degraded + down;
  const rows = [
    { name: "Healthy", value: healthy, color: "#10b981" },
    { name: "Degraded", value: degraded, color: "#f59e0b" },
    { name: "Down", value: down, color: "#f43f5e" },
  ];
  const data = rows.filter((d) => d.value > 0);
  return (
    <div>
      <div className="relative mx-auto h-44 max-w-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={total ? data : [{ name: "none", value: 1, color: "#e2e8f0" }]} dataKey="value" innerRadius={58} outerRadius={80}
              paddingAngle={total ? 5 : 0} cornerRadius={8} stroke="none" isAnimationActive={false}>
              {(total ? data : [{ name: "none", value: 1, color: "#e2e8f0" }]).map((d) => <Cell key={d.name} fill={d.color} />)}
            </Pie>
            {total > 0 && <Tooltip content={<ChartTooltip unit="" />} />}
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div className="text-center">
            <div className="text-3xl font-bold leading-none text-text">{total}</div>
            <div className="mt-1 text-[11px] uppercase tracking-wide text-muted">monitored</div>
          </div>
        </div>
      </div>
      <ul className="mt-4 space-y-2">
        {rows.map((r) => (
          <li key={r.name} className="flex items-center gap-3 text-sm">
            <span className="size-2.5 rounded-full" style={{ background: r.color }} />
            <span className="text-text">{r.name}</span>
            <span className="ml-auto font-mono text-muted">{r.value}</span>
            <span className="w-10 text-right font-mono text-xs text-muted">{total ? Math.round((r.value / total) * 100) : 0}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Empty({ text = "Not enough data yet" }: { text?: string }) {
  return (
    <div className="grid h-56 place-items-center rounded-2xl border border-dashed border-text/10 bg-text/3 px-6 text-center text-sm text-muted">
      {text}
    </div>
  );
}
