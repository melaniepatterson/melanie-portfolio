// ─── SHARED PROGRAM STEP MAPPING ──────────────────────────────
// Maps program_phase_options.step_key -> INGREDIENT_CATEGORIES key + label
// used to build routine_periods step entries.
export const STEP_KEY_MAP = {
  toner:           { categoryKey: 'toner',           label: 'Toner' },
  vitamin_c:       { categoryKey: 'treatment_serum', label: 'Vitamin C Serum' },
  hydrating_serum: { categoryKey: 'watery_serum',    label: 'Hydrating Serum' },
  exfoliant:       { categoryKey: 'aha_bha_toner',   label: 'Exfoliant (AHA/BHA)' },
  eye_cream:       { categoryKey: 'eye_cream',       label: 'Eye Cream' },
  facial_oil:      { categoryKey: 'face_oil',        label: 'Facial Oil' },
}

// Step keys that introduce a new active ingredient — only one
// can be selected at a time so the user isn't ramping multiple
// actives simultaneously.
export const ACTIVE_STEP_KEYS = new Set(['vitamin_c', 'exfoliant'])

// Given a list of chosen program_phase_options rows, build step entries
// to append to a routine_periods.steps object. Returns { am: [...], pm: [...] }
// (pm entries should also be mirrored into 'off' by the caller, since
// that's the key the calendar reads for non-retinoid PM days).
export function buildStepEntries(chosenOptions) {
  const am = []
  const pm = []
  for (const opt of chosenOptions) {
    if (opt.is_skip_option) continue
    const map = STEP_KEY_MAP[opt.step_key]
    if (!map) continue
    const base = {
      categoryKey: map.categoryKey,
      label: map.label,
      optional: false,
      enabled: true,
      professionalOnly: false,
    }
    if (opt.time_of_day === 'am' || opt.time_of_day === 'both') {
      am.push({ ...base, id: `am_${opt.step_key}` })
    }
    if (opt.time_of_day === 'pm' || opt.time_of_day === 'both') {
      pm.push({ ...base, id: `pm_${opt.step_key}` })
    }
  }
  return { am, pm }
}
