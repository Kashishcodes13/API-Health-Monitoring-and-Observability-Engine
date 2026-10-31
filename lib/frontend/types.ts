// Frontend-only view types. Adjust field names here if your tables differ.
export type Status = "healthy" | "degraded" | "down" | "unknown";

export interface ServiceRow {
  id: string;
  name: string;
  url: string;
  method?: string | null;
  expected_status?: number | null;
  interval_seconds?: number | null;
  is_active?: boolean | null;
  created_at?: string;
}

export interface CheckRow {
  id?: string | number;
  service_id: string;
  status: Status;
  status_code?: number | null;
  latency_ms?: number | null;
  error?: string | null;
  checked_at: string;
  response_headers?: Record<string, string> | null;
}

export interface IncidentRow {
  service_id: string;
  checked_at: string;
  prev_state: string;
  state: string;
  status_code?: number | null;
  error_message?: string | null;
}
