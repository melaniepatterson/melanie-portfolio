// Called by a pg_net trigger (see sync_waitlist_approval()) whenever a
// waitlist row's status flips to 'active'. Creates the auth user (if they
// don't already have one) and sends Supabase's "Invite user" email, which
// carries the "You're in" copy set in the Auth email templates.
// Not publicly meant to be called directly — gated by a shared secret since
// this function creates real auth users and sends real email.

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const secret = req.headers.get('x-webhook-secret') ?? ''
  if (!secret || secret !== Deno.env.get('APPROVE_TESTER_SECRET')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  try {
    const { email } = await req.json()
    if (!email || typeof email !== 'string') {
      return new Response(JSON.stringify({ error: 'email required' }), { status: 400 })
    }

    const supabaseUrl        = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    // Calling the GoTrue invite endpoint directly rather than through
    // supabase-js's admin.inviteUserByEmail() — that SDK helper throws an
    // opaque AuthRetryableFetchError against this project (version-mismatch
    // bug between esm.sh's resolved supabase-js and this project's API key
    // format), even though the same service-role key works fine for every
    // other raw admin call.
    const redirectTo = encodeURIComponent('https://www.melanie.studio/routine')
    const inviteResp = await fetch(`${supabaseUrl}/auth/v1/invite?redirect_to=${redirectTo}`, {
      method: 'POST',
      headers: {
        apikey: supabaseServiceKey,
        Authorization: `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    })

    if (!inviteResp.ok) {
      const body = await inviteResp.text()
      // Someone re-approved (or re-triggered) an already-registered tester —
      // they already have an account and can just sign in, not an error.
      if (inviteResp.status === 422 && body.toLowerCase().includes('already been registered')) {
        return new Response(JSON.stringify({ ok: true, alreadyRegistered: true }), { status: 200 })
      }
      console.error('invite endpoint error:', inviteResp.status, body)
      return new Response(JSON.stringify({ error: body, status: inviteResp.status }), { status: 500 })
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 })
  } catch (err) {
    console.error('approve-tester error:', err instanceof Error ? JSON.stringify(err, Object.getOwnPropertyNames(err)) : err)
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), { status: 500 })
  }
})
