"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw } from "lucide-react";

const STATES = ["all", "healthy", "degraded", "down"];

/** Filters for the execution log, plus a gentle auto-refresh that keeps the table current. */
export function LogControls({ services, state, service }: { services: { id: string; name: string }[]; state: string; service: string }) {
  const router = useRouter();
  const [auto, setAuto] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!auto) return;
    const iv = setInterval(() => { if (!document.hidden) router.refresh(); }, 15_000);
    return () => clearInterval(iv);
  }, [auto, router]);

  const href = (over: Record<string, string>) => {
    const p = new URLSearchParams({ state, service, ...over });
    if (p.get("state") === "all") p.delete("state");
    if (!p.get("service") || p.get("service") === "all") p.delete("service");
    const q = p.toString();
    return q ? `/logs?${q}` : "/logs";
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="glass flex rounded-lg p-0.5" role="tablist" aria-label="Filter by health">
        {STATES.map((s) => (
          <Link key={s} href={href({ state: s })} scroll={false} role="tab" aria-selected={s === state}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${s === state ? "bg-brand text-white" : "text-muted hover:text-text"}`}>
            {s}
          </Link>
        ))}
      </div>
      <select value={service || "all"} aria-label="Filter by service" onChange={(e) => router.push(href({ service: e.target.value }))}
        className="input-glass w-auto max-w-56 py-2 text-xs">
        <option value="all">All services</option>
        {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select>
      <button type="button" onClick={() => { setBusy(true); router.refresh(); setTimeout(() => setBusy(false), 600); }}
        className="btn-soft py-2! text-xs!">
        {busy ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />} Refresh
      </button>
      <button type="button" onClick={() => setAuto((a) => !a)} aria-pressed={auto}
        className={`glass rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${auto ? "text-brand-2" : "text-muted"}`}>
        Auto-refresh {auto ? "on" : "off"}
      </button>
    </div>
  );
}
