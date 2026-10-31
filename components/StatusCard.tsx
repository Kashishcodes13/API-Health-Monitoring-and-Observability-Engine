"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { ExternalLink, PauseCircle } from "lucide-react";
import type { CheckRow, ServiceRow } from "@/lib/frontend/types";
import { TONE, timeAgo } from "@/lib/frontend/status";
import { CheckNowButton } from "./CheckNowButton";

export function StatusCard({ service, check }: { service: ServiceRow; check?: CheckRow }) {
  const paused = service.is_active === false;
  const status = paused ? "unknown" : (check?.status ?? "unknown");
  const tone = TONE[status];

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 260, damping: 26 }}
      className={`glass relative flex flex-col gap-4 rounded-3xl p-5 ${tone.glow} ${tone.text}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link href={`/services/${service.id}`} className="block truncate font-semibold text-text hover:underline">
            {service.name}
          </Link>
          <a
            href={service.url}
            target="_blank"
            rel="noreferrer noopener"
            className="mt-0.5 inline-flex max-w-full items-center gap-1 truncate font-mono text-xs text-muted hover:text-white"
          >
            <span className="truncate">{service.url}</span>
            <ExternalLink className="size-3 shrink-0" />
          </a>
        </div>
        <span className="flex shrink-0 items-center gap-2 text-xs font-medium">
          {paused ? <PauseCircle className="size-4" /> : <span className="status-dot" />}
          {paused ? "Paused" : tone.label}
        </span>
      </div>

      <div className="flex items-end justify-between">
        <div>
          <div className="font-mono text-3xl font-semibold tracking-tight text-text">
            {check?.latency_ms != null && status !== "down" ? check.latency_ms : "—"}
            {check?.latency_ms != null && status !== "down" && <span className="ml-1 text-sm text-muted">ms</span>}
          </div>
          <div className="mt-1 text-xs text-muted">
            {check ? `HTTP ${check.status_code ?? "n/a"} · ${timeAgo(check.checked_at)}` : "Waiting for first check"}
          </div>
        </div>
        <CheckNowButton serviceId={service.id} />
      </div>

      {check?.error && status === "down" && (
        <p className="truncate rounded-lg bg-down/10 px-3 py-1.5 font-mono text-xs text-down">{check.error}</p>
      )}
    </motion.article>
  );
}
