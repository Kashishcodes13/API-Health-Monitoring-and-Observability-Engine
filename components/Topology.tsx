import type { CheckRow, ServiceRow } from "@/lib/frontend/types";

const COLOR = { healthy: "#22c55e", degraded: "#f59e0b", down: "#ef4444", unknown: "#64748b" } as const;
const short = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

/** Live map: the probe in the middle, one node per service, coloured by its latest result. */
export function Topology({ services, latest }: { services: ServiceRow[]; latest: Record<string, CheckRow> }) {
  const nodes = services.slice(0, 8);
  const cx = 210, cy = 128, rx = 150, ry = 78;
  return (
    <svg viewBox="0 0 420 256" className="h-auto w-full" role="img" aria-label="Service topology: probe connected to each monitored API" fontFamily="Inter, sans-serif">
      <rect x="0" y="0" width="420" height="256" rx="10" fill="rgba(7,11,22,0.55)" />
      {nodes.map((s, i) => {
        const a = -Math.PI / 2 + (i * 2 * Math.PI) / nodes.length;
        const x = cx + rx * Math.cos(a), y = cy + ry * Math.sin(a);
        const c = latest[s.id];
        const st = s.is_active === false ? "unknown" : (c?.status ?? "unknown");
        const up = Math.sin(a) < -0.3;
        const lab = Math.cos(a) > 0.35 ? "start" : Math.cos(a) < -0.35 ? "end" : "middle";
        const dx = lab === "start" ? 12 : lab === "end" ? -12 : 0;
        return (
          <g key={s.id}>
            <line x1={cx} y1={cy} x2={x} y2={y} stroke={COLOR[st]} strokeOpacity={st === "unknown" ? 0.3 : 0.7} strokeWidth={1.5}
              strokeDasharray={st === "down" ? "2 5" : "5 5"} className={st === "healthy" || st === "degraded" ? "animate-flow" : undefined} />
            <circle cx={x} cy={y} r={7} fill="#0d1426" stroke={COLOR[st]} strokeWidth={2.5} />
            <circle cx={x} cy={y} r={2.5} fill={COLOR[st]} />
            <text x={x + dx} y={y + (lab === "middle" ? (up ? -16 : 22) : -2)} textAnchor={lab} fontSize="10.5" fontWeight="600" fill="#e6ebf7">{short(s.name, 16)}</text>
            <text x={x + dx} y={y + (lab === "middle" ? (up ? -5 : 33) : 10)} textAnchor={lab} fontSize="9.5" fontFamily="JetBrains Mono, monospace" fill="#8a97b4">
              {st === "down" ? "down" : c?.latency_ms != null ? `${c.latency_ms} ms` : "no data"}
            </text>
          </g>
        );
      })}
      <circle cx={cx} cy={cy} r={26} fill="#121b31" stroke="rgba(244,63,94,0.55)" strokeWidth={2} />
      <circle cx={cx} cy={cy} r={34} fill="none" stroke="rgba(244,63,94,0.2)" strokeWidth={1} />
      <text x={cx} y={cy - 2} textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#e6ebf7">PROBE</text>
      <text x={cx} y={cy + 10} textAnchor="middle" fontSize="8.5" fontFamily="JetBrains Mono, monospace" fill="#8a97b4">engine</text>
      {nodes.length === 0 && (
        <text x={cx} y={cy + 62} textAnchor="middle" fontSize="11" fill="#8a97b4">Add an API to see it appear here</text>
      )}
    </svg>
  );
}
