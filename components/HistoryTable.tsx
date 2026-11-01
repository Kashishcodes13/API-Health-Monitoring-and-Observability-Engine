import type { CheckRow } from "@/lib/frontend/types";
import { TONE } from "@/lib/frontend/status";
import { LocalTime } from "./LocalTime";

export function HistoryTable({ rows }: { rows: CheckRow[] }) {
  if (rows.length === 0) {
    return <p className="py-8 text-center text-sm text-muted">No checks recorded in this period.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-136 text-left text-sm">
        <thead className="text-xs uppercase tracking-wide text-muted">
          <tr>
            <th className="px-3 py-2 font-medium">Time</th>
            <th className="px-3 py-2 font-medium">State</th>
            <th className="px-3 py-2 font-medium">HTTP</th>
            <th className="px-3 py-2 font-medium">Latency</th>
            <th className="px-3 py-2 font-medium">Error</th>
          </tr>
        </thead>
        <tbody className="font-mono text-xs">
          {rows.map((r, i) => {
            const t = TONE[r.status];
            return (
              <tr key={`${r.checked_at}-${i}`} className="border-t border-text/8">
                <td className="whitespace-nowrap px-3 py-2.5 text-muted"><LocalTime iso={r.checked_at} /></td>
                <td className={`px-3 py-2.5 font-medium ${t.text}`}>
                  <span className="inline-flex items-center gap-2"><span className="size-2 rounded-full bg-current" />{t.label}</span>
                </td>
                <td className="px-3 py-2.5">{r.status_code ?? "n/a"}</td>
                <td className="px-3 py-2.5">{r.latency_ms != null ? `${Math.round(r.latency_ms)} ms` : "—"}</td>
                <td className="max-w-64 truncate px-3 py-2.5 text-down">{r.error ?? ""}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
