"use client";
import { memo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight, PauseCircle } from "lucide-react";
import type { CheckRow, ServiceRow } from "@/lib/frontend/types";
import { TONE, timeAgo } from "@/lib/frontend/status";
import { CheckNowButton } from "./CheckNowButton";
import { Sparkline } from "./Sparkline";

const SPARK = { healthy: "#22c55e", degraded: "#f59e0b", down: "#ef4444", unknown: "#64748b" } as const;

function StatusCardBase({
  service, check, spark = [], uptime = null, now,
}: { service: ServiceRow; check?: CheckRow; spark?: (number | null)[]; uptime?: number | null; now?: number }) {
  const paused = service.is_active === false;
  const status = paused ? "unknown" : (check?.status ?? "unknown");
  const tone = TONE[status];
  const showMs = check?.latency_ms != null && status !== "down";

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={`glass flex flex-col gap-3 rounded-xl p-4 transition-colors hover:border-text/25 ${status === "down" ? "glow-down" : status === "degraded" ? "glow-degraded" : ""}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="rounded-md bg-text/8 px-2 py-0.5 font-mono text-[11px] font-bold tracking-wide text-muted">
          {(service.method ?? "GET").toUpperCase()}
        </span>
        <span className={`inline-flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-wide ${tone.text}`}>
          {paused ? <PauseCircle className="size-3.5" /> : <span className="status-dot" />}
          {paused ? "Paused" : tone.label}
        </span>
      </div>

      <div className="min-w-0">
        <Link href={`/services/${service.id}`} className="block truncate text-[15px] font-semibold hover:text-brand-2">
          {service.name}
        </Link>
        <span className="block truncate font-mono text-xs text-muted">
          {service.url ? service.url.replace(/^https?:\/\//, "") : "no URL"}
        </span>
      </div>

      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="font-mono text-2xl font-semibold tracking-tight">
            {showMs ? check!.latency_ms : "—"}
            {showMs && <span className="ml-0.5 text-sm font-medium text-muted">ms</span>}
          </div>
          <div className="label-mono mt-0.5">{uptime == null ? "No uptime data" : `${uptime.toFixed(2)}% uptime`}</div>
        </div>
        <Sparkline values={spark} color={SPARK[status]} id={`s-${service.id.slice(0, 6)}`} className="h-10 w-28" />
      </div>

      {check?.error && status === "down" && (
        <p className="truncate rounded-md bg-down/10 px-2.5 py-1.5 font-mono text-[11px] text-down">{check.error}</p>
      )}

      <div className="mt-auto flex items-center justify-between border-t border-line pt-3">
        <span className="text-[11px] text-muted">
          {check ? `HTTP ${check.status_code ?? "n/a"} · ${timeAgo(check.checked_at, now)}` : "Waiting for first check"}
        </span>
        <div className="flex items-center gap-2">
          <CheckNowButton serviceId={service.id} />
          <Link href={`/services/${service.id}`} className="inline-flex items-center text-xs font-semibold text-brand-2 hover:underline">
            Details <ChevronRight className="size-3.5" />
          </Link>
        </div>
      </div>
    </motion.article>
  );
}

const sameSpark = (a?: (number | null)[], b?: (number | null)[]) =>
  a === b || (!!a && !!b && a.length === b.length && a.every((v, i) => v === b[i]));

/** Re-renders only when this card's own data changes, not on every realtime event for other services. */
export const StatusCard = memo(
  StatusCardBase,
  (p, n) => p.service === n.service && p.check === n.check && p.now === n.now && p.uptime === n.uptime && sameSpark(p.spark, n.spark),
);
