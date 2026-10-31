import type { CheckRow, Status } from "./types";

export const TONE: Record<Status, { text: string; glow: string; label: string }> = {
  healthy: { text: "text-healthy", glow: "glow-healthy", label: "Healthy" },
  degraded: { text: "text-degraded", glow: "glow-degraded", label: "Degraded" },
  down: { text: "text-down", glow: "glow-down", label: "Down" },
  unknown: { text: "text-muted", glow: "", label: "No data" },
};

/** First defined numeric value among candidate keys (RPC column names may vary). */
export function pickNum(obj: unknown, ...keys: string[]): number | null {
  if (!obj || typeof obj !== "object") return null;
  const o = obj as Record<string, unknown>;
  for (const k of keys) {
    const v = o[k];
    if (v !== undefined && v !== null && !Number.isNaN(Number(v))) return Number(v);
  }
  return null;
}

export function pickStr(obj: unknown, ...keys: string[]): string | null {
  if (!obj || typeof obj !== "object") return null;
  const o = obj as Record<string, unknown>;
  for (const k of keys) if (typeof o[k] === "string") return o[k] as string;
  return null;
}

export function timeAgo(iso?: string | null): string {
  if (!iso) return "never";
  const s = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export function fmtDuration(sec?: number | null): string {
  if (sec == null) return "ongoing";
  if (sec < 60) return `${Math.round(sec)}s`;
  if (sec < 3600) return `${Math.round(sec / 60)}m`;
  return `${(sec / 3600).toFixed(1)}h`;
}

/** Maps a raw health_checks row (state / response_time_ms / error_message) to the UI shape. */
export function normalizeCheck(raw: unknown): CheckRow {
  const r = (raw ?? {}) as Record<string, unknown>;
  const st = String(r.state ?? r.status ?? "unknown").toLowerCase();
  const status: Status = st === "healthy" || st === "degraded" || st === "down" ? st : "unknown";
  return {
    id: r.id as string | number | undefined,
    service_id: String(r.service_id),
    status,
    status_code: (r.status_code as number | null) ?? null,
    latency_ms: pickNum(r, "response_time_ms", "latency_ms"),
    error: (r.error_message as string | null) ?? (r.error as string | null) ?? null,
    checked_at: String(r.checked_at),
    response_headers: (r.response_headers as Record<string, string> | null) ?? null,
  };
}
