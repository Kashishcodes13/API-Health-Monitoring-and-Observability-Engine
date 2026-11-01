"use client";
import { memo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, PauseCircle } from "lucide-react";
import type { CheckRow, ServiceRow } from "@/lib/frontend/types";
import { TONE, timeAgo } from "@/lib/frontend/status";
import { CheckNowButton } from "./CheckNowButton";
import { Sparkline } from "./Sparkline";

const SPARK = { healthy: "#10b981", degraded: "#f59e0b", down: "#f43f5e", unknown: "#94a3b8" } as const;
const PILL = { healthy: "bg-healthy/10", degraded: "bg-degraded/10", down: "bg-down/10", unknown: "bg-text/5" } as const;

function StatusCardBase({
  service, check, spark = [], now,
}: { service: ServiceRow; check?: CheckRow; spark?: (number | null)[]; now?: number }) {
  const paused = service.is_active === false;
  const status = paused ? "unknown" : (check?.status ?? "unknown");
  const tone = TONE[status];
  const showMs = check?.latency_ms != null && status !== "down";

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 260, damping: 26 }}
      className={`glass relative flex flex-col gap-3 overflow-hidden rounded-3xl p-5 pl-6 ${tone.glow} ${tone.text}`}
    >
      <span aria-hidden className="absolute inset-y-4 left-0 w-1.5 rounded-r-full bg-current opacity-80" />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link href={`/services/${service.id}`} className="group inline-flex max-w-full items-center gap-1 font-semibold text-text">
            <span className="truncate group-hover:text-brand">{service.name}</span>
            <ArrowUpRight className="size-4 shrink-0 text-muted transition group-hover:text-brand" />
          </Link>
          <span className="mt-0.5 block truncate font-mono text-xs text-muted">
            {service.url ? service.url.replace(/^https?:\/\//, "") : "no URL"}
          </span>
        </div>
        <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${PILL[status]}`}>
          {paused ? <PauseCircle className="size-3.5" /> : <span className="status-dot" />}
          {paused ? "Paused" : tone.label}
        </span>
      </div>

      <Sparkline values={spark} color={SPARK[status]} id={`s-${service.id.slice(0, 6)}`} />

      <div className="flex items-end justify-between">
        <div>
          <div className="font-mono text-3xl font-semibold tracking-tight text-text">
            {showMs ? check!.latency_ms : "—"}
            {showMs && <span className="ml-1 text-sm font-medium text-muted">ms</span>}
          </div>
          <div className="mt-1 text-xs text-muted">
            {check ? `HTTP ${check.status_code ?? "n/a"} · ${timeAgo(check.checked_at, now)}` : "Waiting for first check"}
          </div>
        </div>
        <CheckNowButton serviceId={service.id} />
      </div>

      {check?.error && status === "down" && (
        <p className="truncate rounded-xl bg-down/8 px-3 py-1.5 font-mono text-xs text-down">{check.error}</p>
      )}
    </motion.article>
  );
}

const sameSpark = (a?: (number | null)[], b?: (number | null)[]) =>
  a === b || (!!a && !!b && a.length === b.length && a.every((v, i) => v === b[i]));

/** Re-renders only when this card's own data changes, not on every realtime event for other services. */
export const StatusCard = memo(
  StatusCardBase,
  (p, n) => p.service === n.service && p.check === n.check && p.now === n.now && sameSpark(p.spark, n.spark),
);
