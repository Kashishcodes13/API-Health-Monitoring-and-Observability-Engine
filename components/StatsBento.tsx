import { Activity, CheckCircle2, Gauge, TriangleAlert, XCircle } from "lucide-react";
import { pickNum } from "@/lib/frontend/status";

export function StatsBento({ stats }: { stats: unknown }) {
  const s = Array.isArray(stats) ? stats[0] : stats;
  const total = pickNum(s, "total_services", "total", "services");
  const healthy = pickNum(s, "healthy", "healthy_count", "up");
  const degraded = pickNum(s, "degraded", "degraded_count");
  const down = pickNum(s, "down", "down_count");
  const avg = pickNum(s, "avg_latency_ms", "avg_latency", "average_latency");
  const uptime = pickNum(s, "uptime_pct", "uptime_percent", "uptime", "uptime_24h");
  const v = (n: number | null) => (n == null ? "—" : n.toLocaleString());

  return (
    <div className="bento-grid">
      <article className="glass-strong bento-card md:col-span-2 md:row-span-2">
        <Activity className="mb-4 size-5 text-brand-2" />
        <div className="text-5xl font-bold tracking-tight text-gradient">
          {uptime == null ? "—" : `${uptime.toFixed(2)}%`}
        </div>
        <p className="mt-2 text-sm text-muted">Overall uptime</p>
        <div className="mt-6 text-sm text-muted">
          Tracking <span className="font-semibold text-text">{v(total)}</span> services
        </div>
      </article>

      <article className="glass bento-card text-healthy glow-healthy md:col-span-2">
        <CheckCircle2 className="mb-3 size-5" />
        <div className="text-4xl font-bold text-text">{v(healthy)}</div>
        <p className="text-sm text-muted">Healthy</p>
      </article>
      <article className="glass bento-card text-degraded glow-degraded md:col-span-2">
        <TriangleAlert className="mb-3 size-5" />
        <div className="text-4xl font-bold text-text">{v(degraded)}</div>
        <p className="text-sm text-muted">Degraded</p>
      </article>
      <article className="glass bento-card text-down glow-down md:col-span-2">
        <XCircle className="mb-3 size-5" />
        <div className="text-4xl font-bold text-text">{v(down)}</div>
        <p className="text-sm text-muted">Down</p>
      </article>
      <article className="glass bento-card md:col-span-2">
        <Gauge className="mb-3 size-5 text-brand" />
        <div className="text-4xl font-bold">
          {avg == null ? "—" : Math.round(avg)}
          <span className="ml-1 text-lg text-muted">ms</span>
        </div>
        <p className="text-sm text-muted">Avg latency</p>
      </article>
    </div>
  );
}
