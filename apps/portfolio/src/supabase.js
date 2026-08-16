import { createClient } from "@supabase/supabase-js";

// This app's own Supabase project — separate from GlowUp's (see
// .env.local), since they're different products with different data.
const supabaseUrl = import.meta.env.VITE_PORTFOLIO_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_PORTFOLIO_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
