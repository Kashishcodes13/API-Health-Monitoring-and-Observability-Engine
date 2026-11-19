"use client";
import Link from "next/link";
import type { CheckRow, ServiceRow } from "@/lib/frontend/types";
import { TONE, codeTone } from "@/lib/frontend/status";

/** Compact table of the newest checks across all services. */
export function RecentLogs({ rows, services }: { rows: CheckRow[]; services: ServiceRow[] }) {
  const byId = new Map(services.map((s) => [s.id, s]));
  if (!rows.length) return <p className="py-10 text-center text-sm text-muted">No executions yet. Results appear here live.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-120 text-left text-xs">
        <thead>
          <tr className="label-mono">
            <th className="px-2 pb-2 font-semibold">Time</th><th className="px-2 pb-2 font-semibold">Method</th>
            <th className="px-2 pb-2 font-semibold">Endpoint</th><th className="px-2 pb-2 font-semibold">Status</th>
            <th className="px-2 pb-2 font-semibold">Latency</th>
          </tr>
        </thead>
        <tbody className="font-mono">
          {rows.map((r, i) => {
            const s = byId.get(r.service_id);
            const t = TONE[r.status];
            return (
              <tr key={`${r.service_id}-${r.checked_at}-${i}`} className="border-t border-line">
                <td className="whitespace-nowrap px-2 py-2 text-muted" suppressHydrationWarning>{new Date(r.checked_at).toLocaleTimeString()}</td>
                <td className="px-2 py-2"><span className="rounded bg-text/8 px-1.5 py-0.5 text-[10px] font-bold text-muted">{(s?.method ?? "GET").toUpperCase()}</span></td>
                <td className="max-w-44 truncate px-2 py-2">
                  <Link href={`/services/${r.service_id}`} className="hover:text-brand-2">{s?.name ?? "Unknown"}</Link>
                </td>
                <td className="px-2 py-2"><span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${codeTone(r.status_code)}`}>{r.status_code ?? "ERR"}</span></td>
                <td className={`whitespace-nowrap px-2 py-2 ${t.text}`}>{r.latency_ms != null && r.status !== "down" ? `${r.latency_ms} ms` : t.label}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
