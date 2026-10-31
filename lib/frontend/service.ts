import type { ServiceRow } from "./types";

/** Field names the backend form/columns use. Detected from real rows so we never guess wrong. */
export interface FieldKeys {
  name: string;
  url: string;
  method: string;
  expected_status: string;
  interval?: string;
  intervalValue?: number;
}

export const DEFAULT_KEYS: FieldKeys = {
  name: "name",
  url: "url",
  method: "method",
  expected_status: "expected_status",
};

const HTTP = ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"];
const URL_KEYS = ["url", "endpoint", "endpoint_url", "target_url", "api_url", "base_url", "health_url", "check_url", "uri", "link", "address"];
const NAME_KEYS = ["name", "title", "label", "service_name"];
const METHOD_KEYS = ["method", "http_method", "request_method"];
const EXPECT_KEYS = ["expected_status", "expected_status_code", "expected_code", "expect_status", "expected"];

type Row = Record<string, unknown>;
const isHttp = (v: unknown): v is string => typeof v === "string" && /^https?:\/\//i.test(v.trim());
const isMethod = (v: unknown) => typeof v === "string" && HTTP.includes(v.toUpperCase());
const isNum = (v: unknown) => typeof v === "number";

function findKey(o: Row, preferred: string[], test: (v: unknown) => boolean): string | undefined {
  for (const k of preferred) if (k in o && test(o[k])) return k;
  for (const [k, v] of Object.entries(o)) if (test(v)) return k;
  return undefined;
}

export function detectKeys(raw?: Row | null): FieldKeys {
  if (!raw) return { ...DEFAULT_KEYS };
  const expect =
    EXPECT_KEYS.find((k) => k in raw && isNum(raw[k])) ??
    Object.keys(raw).find((k) => /expect/i.test(k) && isNum(raw[k]));
  const interval = Object.keys(raw).find((k) => /interval|frequency|every|period/i.test(k) && isNum(raw[k]));
  return {
    name: NAME_KEYS.find((k) => typeof raw[k] === "string") ?? DEFAULT_KEYS.name,
    url: findKey(raw, URL_KEYS, isHttp) ?? DEFAULT_KEYS.url,
    method: METHOD_KEYS.find((k) => isMethod(raw[k])) ?? DEFAULT_KEYS.method,
    expected_status: expect ?? DEFAULT_KEYS.expected_status,
    interval,
    intervalValue: interval ? (raw[interval] as number) : undefined,
  };
}

/** Maps any raw `services` row to the UI shape, whatever the column names are. */
export function normalizeService(raw: Row): ServiceRow {
  const k = detectKeys(raw);
  const act = ["is_active", "active", "enabled", "is_enabled"].find((x) => typeof raw[x] === "boolean");
  const pau = ["paused", "is_paused"].find((x) => typeof raw[x] === "boolean");
  return {
    id: String(raw.id),
    name: String(raw[k.name] ?? "Untitled"),
    url: isHttp(raw[k.url]) ? (raw[k.url] as string) : "",
    method: (raw[k.method] as string | undefined) ?? "GET",
    expected_status: (raw[k.expected_status] as number | undefined) ?? 200,
    interval_seconds: k.interval ? (raw[k.interval] as number) : null,
    is_active: act ? (raw[act] as boolean) : pau ? !(raw[pau] as boolean) : true,
    created_at: raw.created_at as string | undefined,
  };
}

export function filterServices(services: ServiceRow[], q: string): ServiceRow[] {
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return services;
  return services.filter((s) => {
    const hay = `${s.name} ${s.url}`.toLowerCase();
    return terms.every((t) => hay.includes(t));
  });
}
