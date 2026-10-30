import { NextRequest, NextResponse } from 'next/server'
import { runChecks } from '@/lib/health/run'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

async function isAuthorized(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (process.env.CRON_SECRET && auth === `Bearer ${process.env.CRON_SECRET}`) return true
  if (process.env.DEV_SKIP_AUTH === 'true') return true
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  return !!data.user
}

async function handle(req: NextRequest, force: boolean) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    return NextResponse.json(await runChecks({ force }))
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// Scheduler calls (only services that are due)
export const GET = (req: NextRequest) => handle(req, false)

// Manual "check all now"
export const POST = (req: NextRequest) => handle(req, true)
