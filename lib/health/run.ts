import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'
import { probe } from './probe'
import type { Service } from '@/lib/types'

export async function runChecks(opts: { serviceId?: string; force?: boolean } = {}) {
  const db = createAdminClient()
  let query = db.from('services').select('*').eq('is_active', true)
  if (opts.serviceId) query = query.eq('id', opts.serviceId)

  const { data, error } = await query
  if (error) throw new Error(error.message)

  const now = Date.now()
  const due = (data as Service[]).filter(
    (s) =>
      opts.force || opts.serviceId || !s.last_checked_at ||
      now - new Date(s.last_checked_at).getTime() >= s.interval_seconds * 1000 - 2000
  )

  const results = await Promise.all(
    due.map(async (service) => ({ service, result: await probe(service) }))
  )

  if (results.length > 0) {
    const { error: insertError } = await db.from('health_checks').insert(
      results.map(({ service, result }) => ({ service_id: service.id, ...result }))
    )
    if (insertError) throw new Error(insertError.message)

    await Promise.all(
      results.map(({ service, result }) =>
        db.from('services')
          .update({ last_checked_at: new Date().toISOString(), current_state: result.state })
          .eq('id', service.id)
      )
    )
  }

  return {
    checked: results.length,
    results: results.map(({ service, result }) => ({
      name: service.name, state: result.state, ms: result.response_time_ms, status: result.status_code,
    })),
  }
}
