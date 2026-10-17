import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)
  const url = Deno.env.get('SUPABASE_URL')
  const anon = Deno.env.get('SUPABASE_ANON_KEY') ?? Deno.env.get('SUPABASE_PUBLISHABLE_KEY')
  const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const auth = req.headers.get('Authorization')
  if (!url || !anon || !service || !auth) return json({ error: 'Unavailable' }, 401)

  const userClient = createClient(url, anon, { global: { headers: { Authorization: auth } } })
  const { data: { user } } = await userClient.auth.getUser()
  if (!user) return json({ error: 'Unauthorized' }, 401)

  const admin = createClient(url, service)
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return json({ error: 'Forbidden' }, 403)

  const body = await req.json().catch(() => null) as { fullName?: string; organisation?: string; email?: string } | null
  const name = String(body?.fullName ?? '').trim()
  const org = String(body?.organisation ?? '').trim()
  const email = String(body?.email ?? '').trim().toLowerCase()
  if (name.length < 2 || name.length > 80 || org.length < 2 || org.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: 'Check the name, organisation, and email.' }, 400)
  }

  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, { data: { full_name: name } })
  if (error || !data.user) return json({ error: 'The account could not be created.' }, 400)
  await admin.from('profiles').update({ full_name: name, organisation: org }).eq('id', data.user.id)
  return json({ ok: true })
})
