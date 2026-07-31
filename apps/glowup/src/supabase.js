import { createClient } from '@supabase/supabase-js'
import { demoClient } from './demoClient'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Read-only demo build (see apps/glowup/src/demoClient.js) — every one of
// the app's ~50 write call sites imports this single export, so swapping
// it here is enough to make the whole app read-only with zero changes
// anywhere else.
export const supabase = import.meta.env.VITE_GLOWUP_DEMO === 'true'
  ? demoClient
  : createClient(supabaseUrl, supabaseAnonKey)

// The one deliberate real write in demo mode (logging a ?ref= visit) needs
// the actual Supabase client regardless of demo mode. Outside demo mode
// `supabase` already is the real client, so this just aliases it rather
// than creating a second connection.
export const realSupabase = import.meta.env.VITE_GLOWUP_DEMO === 'true'
  ? createClient(supabaseUrl, supabaseAnonKey)
  : supabase
