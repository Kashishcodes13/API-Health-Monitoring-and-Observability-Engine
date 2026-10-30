import type { HealthState } from '@/lib/types'

export interface ProbeResult {
  response_time_ms: number | null
  status_code: number | null
  state: HealthState
  error_message: string | null
  response_headers: Record<string, string> | null
}

interface ProbeTarget {
  endpoint_url: string
  method: string
  expected_status: number
  custom_headers: Record<string, string>
}

export async function probe(s: ProbeTarget): Promise<ProbeResult> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 5000)
  const start = performance.now()

  try {
    const res = await fetch(s.endpoint_url, {
      method: s.method,
      headers: s.custom_headers,
      signal: controller.signal,
      cache: 'no-store',
    })
    const ms = Math.round(performance.now() - start)
    const headers: Record<string, string> = {}
    res.headers.forEach((v, k) => (headers[k] = v))

    let state: HealthState
    let error: string | null = null
    if (res.status !== s.expected_status) {
      state = 'down'
      error = `Expected ${s.expected_status}, got ${res.status}`
    } else {
      state = ms >= 500 ? 'degraded' : 'healthy'
    }
    return { response_time_ms: ms, status_code: res.status, state, error_message: error, response_headers: headers }
  } catch (e: any) {
    const timedOut = e?.name === 'AbortError'
    return {
      response_time_ms: timedOut ? 5000 : null,
      status_code: null,
      state: 'down',
      error_message: timedOut ? 'Timeout after 5000 ms' : e?.message ?? 'Request failed',
      response_headers: null,
    }
  } finally {
    clearTimeout(timer)
  }
}
