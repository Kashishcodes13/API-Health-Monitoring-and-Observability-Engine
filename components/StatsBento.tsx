import { CheckCircle2, Gauge, TriangleAlert, XCircle } from "lucide-react";
import type { Stats } from "@/lib/frontend/analytics";

function Ring({ pct }: { pct: number | null }) {
  const r = 52, c = 2 * Math.PI * r;
  const v = pct == null ? 0 : Math.max(0, Math.min(100, pct));
  return (
    <div className="relative mx-auto size-36">
      <svg viewBox="0 0 120 120" className="size-full -rotate-90">
        <defs>
          <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#4f46e5" />
            <stop offset="55%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
        <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(15,23,42,0.08)" strokeWidth="11" />
        <circle cx="60" cy="60" r={r} fill="none" stroke="url(#ring)" strokeWidth="11" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - v / 100)} style={{ transition: "stroke-dashoffset 0.8s ease" }} />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="text-2xl font-bold tracking-tight text-text">{pct == null ? "—" : `${pct.toFixed(1)}%`}</div>
          <div className="text-[10px] uppercase tracking-wide text-muted">uptime</div>
        </div>
      </div>
    </div>
  );
}

const tiles = [
  { key: "healthy", label: "Healthy", Icon: CheckCircle2, cls: "text-healthy glow-healthy", chip: "bg-healthy/10" },
  { key: "degraded", label: "Degraded", Icon: TriangleAlert, cls: "text-degraded glow-degraded", chip: "bg-degraded/10" },
  { key: "down", label: "Down", Icon: XCircle, cls: "text-down glow-down", chip: "bg-down/10" },
] as const;

export function StatsBento({ stats }: { stats: Stats }) {
  const { total, avg, uptime } = stats;
  return (
    <div className="bento-grid">
      <article className="glass-strong bento-card md:col-span-2 md:row-span-2">
        <p className="text-sm font-medium text-muted">Overall uptime · 24h</p>
        <div className="mt-3"><Ring pct={uptime} /></div>
        <p className="mt-4 text-center text-sm text-muted">
          Tracking <span className="font-semibold text-text">{total}</span> service{total === 1 ? "" : "s"}
        </p>
      </article>

      {tiles.map(({ key, label, Icon, cls, chip }) => (
        <article key={key} className={`glass bento-card md:col-span-2 ${cls}`}>
          <span className={`mb-3 grid size-10 place-items-center rounded-xl ${chip}`}><Icon className="size-5" /></span>
          <div className="text-4xl font-bold tracking-tight text-text">{stats[key]}</div>
          <p className="text-sm text-muted">{label}</p>
        </article>
      ))}

      <article className="glass bento-card md:col-span-2">
        <span className="mb-3 grid size-10 place-items-center rounded-xl bg-brand/10 text-brand"><Gauge className="size-5" /></span>
        <div className="text-4xl font-bold tracking-tight text-text">
          {avg == null ? "—" : Math.round(avg)}
          <span className="ml-1 text-lg font-medium text-muted">ms</span>
        </div>
        <p className="text-sm text-muted">Avg latency · 24h</p>
      </article>
    </div>
  );
}
