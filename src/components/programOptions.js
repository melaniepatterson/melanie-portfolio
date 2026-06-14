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

// Applies a program phase's step config (program_phase_steps rows for
// 'main'/active-night steps) to a routine period. Used by linear
// programs like Tretinoin Onboarding where each phase fully redefines
// the active-night routine (sandwich method, retinoid frequency, etc).
//
// Rebuilds steps.main from the current baseline (steps.off, or existing
// steps.main if already set), dropping any prior retinoid/buffer entries
// and exfoliants (which conflict with retinoid), then layers in the
// phase's moisturizer_buffer (if present) and retinoid step.
//
// Returns a patch object: { steps, tret_enabled?, tret_frequency?, tret_start_date? }
export function applyProgramPhase(phaseSteps, routinePeriod, { isFirstApplication } = {}) {
  const mainPhaseSteps = (phaseSteps || []).filter(s => s.time_of_day === 'main')
  const bufferStep   = mainPhaseSteps.find(s => s.step_key === 'moisturizer_buffer')
  const retinoidStep = mainPhaseSteps.find(s => s.step_key === 'retinoid')

  const currentSteps = routinePeriod?.steps || {}
  const base = (currentSteps.main?.length ? currentSteps.main : (currentSteps.off || []))
    .filter(s => s.categoryKey !== 'aha_bha_toner' && s.categoryKey !== 'retinoid' && s.categoryKey !== 'moisturizer_buffer')
    .map(s => ({ ...s, id: s.id.replace(/^(off|pm)_/, 'main_') }))

  const newMain = [...base]
  if (bufferStep) {
    newMain.push({
      id: 'main_moisturizer_buffer', categoryKey: 'moisturizer_buffer', label: bufferStep.label,
      optional: false, enabled: true, professionalOnly: false,
    })
  }
  if (retinoidStep) {
    newMain.push({
      id: 'main_retinoid', categoryKey: 'retinoid', label: retinoidStep.label,
      optional: false, enabled: true, professionalOnly: false,
    })
  }

  const patch = { steps: { ...currentSteps, main: newMain } }

  if (retinoidStep?.frequency) {
    patch.tret_enabled = true
    patch.tret_frequency = retinoidStep.frequency
    if (isFirstApplication) {
      patch.tret_start_date = new Date().toISOString().split('T')[0]
    }
  }

  return patch
}

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
