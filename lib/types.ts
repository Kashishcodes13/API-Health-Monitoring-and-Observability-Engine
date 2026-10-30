export type HealthState = 'healthy' | 'degraded' | 'down'

export interface Service {
  id: string
  name: string
  endpoint_url: string
  method: string
  expected_status: number
  interval_seconds: number
  custom_headers: Record<string, string>
  is_active: boolean
  created_at: string
  last_checked_at: string | null
  current_state: HealthState | 'unknown'
}

export interface HealthCheck {
  id: number
  service_id: string
  response_time_ms: number | null
  status_code: number | null
  state: HealthState
  error_message: string | null
  response_headers: Record<string, string> | null
  checked_at: string
}
