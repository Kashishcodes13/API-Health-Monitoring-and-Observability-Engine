'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { runChecks } from '@/lib/health/run'
import { validateEndpoint } from '@/lib/health/validate'

async function requireUser() {
  if (process.env.DEV_SKIP_AUTH === 'true') return
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  if (!data.user) throw new Error('Not authenticated')
}

function parseServiceForm(formData: FormData) {
  const name = String(formData.get('name') ?? '').trim()
  const url = String(formData.get('endpoint_url') ?? '').trim()
  const method = String(formData.get('method') ?? 'GET').toUpperCase()
  const expected = Number(formData.get('expected_status') ?? 200)
  const interval = Math.max(30, Number(formData.get('interval_seconds') ?? 60))
  const rawHeaders = String(formData.get('custom_headers') ?? '').trim()

  if (!name) return { error: 'Name is required' }
  const urlError = validateEndpoint(url)
  if (urlError) return { error: urlError }
  if (!['GET', 'HEAD', 'POST'].includes(method)) return { error: 'Method must be GET, HEAD or POST' }
  if (!Number.isInteger(expected) || expected < 100 || expected > 599) return { error: 'Invalid expected status' }

  let headers: Record<string, string> = {}
  if (rawHeaders) {
    try { headers = JSON.parse(rawHeaders) } catch { return { error: 'Custom headers must be valid JSON' } }
  }
  return {
    values: { name, endpoint_url: url, method, expected_status: expected, interval_seconds: interval, custom_headers: headers },
  }
}

export async function addService(formData: FormData) {
  await requireUser()
  const parsed = parseServiceForm(formData)
  if ('error' in parsed) return { error: parsed.error }

  const supabase = await createClient()
  const { data, error } = await supabase.from('services').insert(parsed.values).select('id').single()
  if (error) return { error: error.message }

  await runChecks({ serviceId: data.id }) // first probe right away
  revalidatePath('/')
  return { ok: true }
}

export async function editService(id: string, formData: FormData) {
  await requireUser()
  const parsed = parseServiceForm(formData)
  if ('error' in parsed) return { error: parsed.error }

  const supabase = await createClient()
  const { error } = await supabase.from('services').update(parsed.values).eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/')
  revalidatePath(`/services/${id}`)
  return { ok: true }
}

export async function deleteService(id: string) {
  await requireUser()
  const supabase = await createClient()
  const { error } = await supabase.from('services').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/')
  return { ok: true }
}

export async function toggleService(id: string, isActive: boolean) {
  await requireUser()
  const supabase = await createClient()
  const { error } = await supabase.from('services').update({ is_active: isActive }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/')
  return { ok: true }
}

export async function checkNow(serviceId?: string) {
  await requireUser()
  const result = await runChecks({ serviceId, force: true })
  revalidatePath('/')
  return result
}
