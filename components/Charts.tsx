"use client";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export interface Point { label: string; value: number }

const axis = { stroke: "#8b93ad", fontSize: 11, tickLine: false, axisLine: false } as const;
const tip = {
  contentStyle: {
    background: "rgba(11,16,32,0.92)", border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 12, fontSize: 12, color: "#e7eaf4",
  },
  cursor: { stroke: "rgba(255,255,255,0.15)" },
} as const;

export function LatencyChart({ data }: { data: Point[] }) {
  if (!data.length) return <Empty />;
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ left: -12, right: 8, top: 8 }}>
        <defs>
          <linearGradient id="lat" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.5} />
            <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
        <XAxis dataKey="label" {...axis} minTickGap={32} />
        <YAxis {...axis} unit="ms" />
        <Tooltip {...tip} formatter={(v) => [`${Math.round(Number(v))} ms`, "Avg latency"]} />
        <Area type="monotone" dataKey="value" stroke="#22d3ee" strokeWidth={2} fill="url(#lat)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function DistributionChart({ data }: { data: Point[] }) {
  if (!data.length) return <Empty />;
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ left: -12, right: 8, top: 8 }}>
        <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
        <XAxis dataKey="label" {...axis} />
        <YAxis {...axis} allowDecimals={false} />
        <Tooltip {...tip} cursor={{ fill: "rgba(255,255,255,0.05)" }} formatter={(v) => [String(v), "Checks"]} />
        <Bar dataKey="value" fill="#6366f1" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function Empty() {
  return <div className="grid h-65 place-items-center text-sm text-muted">Not enough data yet</div>;
}
