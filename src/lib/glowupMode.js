// Set only on the glowup.melanie.studio Vercel project's env vars — the
// original melanie-portfolio project leaves this unset, so it keeps
// behaving exactly as it does today (portfolio-gate at "/", GlowUp at
// /routine) as a safety net behind the /routine* redirect. One shared
// codebase, no branch-forked copy of GlowUp to keep in sync by hand.
export const GLOWUP_STANDALONE = import.meta.env.VITE_GLOWUP_STANDALONE === 'true'
export const GLOWUP_BASE = GLOWUP_STANDALONE ? '' : '/routine'
// GLOWUP_BASE alone (empty string in standalone mode) isn't a valid path —
// use this for the calendar's own "home" link/route.
export const GLOWUP_HOME = GLOWUP_BASE || '/'
