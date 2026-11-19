import { Gauge, Server, ShieldAlert, ShieldCheck } from "lucide-react";
import type { Stats } from "@/lib/frontend/analytics";
import { Sparkline } from "./Sparkline";

const tile = "glass flex flex-col gap-2 rounded-xl p-4";

export function KpiTiles({
  stats, uptimeSpark, latencySpark,
}: { stats: Stats; uptimeSpark: (number | null)[]; latencySpark: (number | null)[] }) {
  const { total, healthy, degraded, down, avg, uptime } = stats;
  const counted = healthy + degraded + down;
  const w = (n: number) => (counted ? `${(n / counted) * 100}%` : "0%");

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <article className={tile}>
        <div className="flex items-center justify-between"><span className="label-mono">Overall system health</span><ShieldCheck className="size-4 text-healthy" /></div>
        <div className="text-3xl font-bold tracking-tight">{uptime == null ? "—" : `${uptime.toFixed(2)}%`}</div>
        <div className="text-xs text-muted">Uptime · last 24 hours</div>
        <Sparkline values={uptimeSpark} color="#22c55e" id="kpi-up" className="mt-auto h-9 w-full" />
      </article>

      <article className={tile}>
        <div className="flex items-center justify-between"><span className="label-mono">Monitored endpoints</span><Server className="size-4 text-brand-2" /></div>
        <div className="text-3xl font-bold tracking-tight">{total}</div>
        <div className="text-xs text-muted">Active nodes</div>
        <div className="mt-auto">
          <div className="flex h-2 overflow-hidden rounded-full bg-text/10" role="img" aria-label={`${healthy} healthy, ${degraded} degraded, ${down} down`}>
            <span className="bg-healthy transition-all duration-500" style={{ width: w(healthy) }} />
            <span className="bg-degraded transition-all duration-500" style={{ width: w(degraded) }} />
            <span className="bg-down transition-all duration-500" style={{ width: w(down) }} />
          </div>
          <div className="mt-2 flex gap-3 font-mono text-[11px] text-muted">
            <span><b className="text-healthy">{healthy}</b> OK</span>
            <span><b className="text-degraded">{degraded}</b> Degraded</span>
            <span><b className="text-down">{down}</b> Down</span>
          </div>
        </div>
      </article>

      <article className={tile}>
        <div className="flex items-center justify-between"><span className="label-mono">Avg latency</span><Gauge className="size-4 text-accent" /></div>
        <div className="text-3xl font-bold tracking-tight">
          {avg == null ? "—" : Math.round(avg)}<span className="ml-1 text-base font-medium text-muted">ms</span>
        </div>
        <div className="text-xs text-muted">Mean · last 24 hours</div>
        <Sparkline values={latencySpark} color="#60a5fa" id="kpi-lat" className="mt-auto h-9 w-full" />
      </article>

      <article className={`${tile} ${down > 0 ? "glow-down" : ""}`}>
        <div className="flex items-center justify-between">
          <span className="label-mono">Active incidents</span>
          <ShieldAlert className={`size-4 ${down > 0 ? "text-down" : "text-muted"}`} />
        </div>
        <div className={`text-3xl font-bold tracking-tight ${down > 0 ? "text-down" : ""}`}>{down}</div>
        <div className="text-xs text-muted">{down > 0 ? `${down} service${down === 1 ? "" : "s"} failing right now` : "All services responding"}</div>
        <span className={`mt-auto inline-flex w-fit items-center gap-1.5 rounded-md px-2 py-1 font-mono text-[11px] font-semibold uppercase ${down > 0 ? "bg-down/15 text-down" : "bg-healthy/12 text-healthy"}`}>
          <span className="status-dot" /> {down > 0 ? "Attention needed" : "Operational"}
        </span>
      </article>
    </div>
  );
}
