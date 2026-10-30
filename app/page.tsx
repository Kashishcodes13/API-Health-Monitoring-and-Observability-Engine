import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await createClient()
  const { data, error } = await supabase.from('services').select('*')

  return (
    <main style={{ padding: 40 }}>
      <h1>Supabase connection test</h1>
      <pre>
        {error ? 'ERROR: ' + error.message : 'Connected! Rows found: ' + data?.length}
      </pre>
    </main>
  )
}
