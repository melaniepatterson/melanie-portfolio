import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// This function must be called with the user's own access token.
// It verifies the token, then deletes all of that user's data,
// logs a minimal deletion record, and deletes the auth user.

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const supabaseUrl        = Deno.env.get('SUPABASE_URL')               ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')  ?? ''
    const supabaseAnonKey    = Deno.env.get('SUPABASE_ANON_KEY')          ?? ''

    // Verify the caller's identity using their own token
    const authHeader = req.headers.get('Authorization') ?? ''
    const token = authHeader.replace('Bearer ', '')

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    })
    const { data: userData, error: userErr } = await userClient.auth.getUser()
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }
    const userId = userData.user.id

    // Admin client for everything else
    const admin = createClient(supabaseUrl, supabaseServiceKey)

    // Delete all user-owned data, table by table.
    // Order matters where foreign keys exist (children before parents).
    const tables = [
      'user_program_phase_history',     // references user_programs
      'user_program_phase_selections',  // references user_programs
      'user_programs',
      'routine_periods',
      'extras_periods',
      'shower_periods',
      'treatments',
      'custom_treatment_types',
      'products',                       // user's own products (is_catalog=false rows)
      'user_flags',
    ]

    for (const table of tables) {
      const col = table === 'user_program_phase_history' || table === 'user_program_phase_selections'
        ? null // handled via subquery below
        : table === 'user_flags' ? 'user_id' : 'user_id'

      if (table === 'user_program_phase_history' || table === 'user_program_phase_selections') {
        // Delete rows whose user_program_id belongs to this user
        const { data: ups } = await admin.from('user_programs').select('id').eq('user_id', userId)
        const ids = (ups || []).map(u => u.id)
        if (ids.length) {
          await admin.from(table).delete().in('user_program_id', ids)
        }
        continue
      }

      if (table === 'products') {
        // Only delete the user's own products, never catalog products
        await admin.from('products').delete().eq('user_id', userId).eq('is_catalog', false)
        continue
      }

      await admin.from(table).delete().eq(col, userId)
    }

    // Delete the profile row
    await admin.from('profiles').delete().eq('id', userId)

    // Log the deletion — no personal data, just proof an account existed
    await admin.from('account_deletion_log').insert({
      user_id: userId,
      reason: 'user_requested',
    })

    // Finally, delete the auth user itself
    const { error: deleteErr } = await admin.auth.admin.deleteUser(userId)
    if (deleteErr) throw deleteErr

    return new Response(JSON.stringify({ message: 'Account deleted' }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : JSON.stringify(err)
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
