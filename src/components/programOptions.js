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

// Contextual notes shown on specific Phase 2 options based on the skin
// type someone indicated in their profile. These are informational only —
// the option remains fully selectable either way, never disabled.
export const SKIN_TYPE_NOTES = {
  oily: {
    facial_oil: "Since you indicated oily skin: facial oils can feel counterintuitive, but a light, non-comedogenic oil can actually help balance oil production for some people. There's no wrong answer here — still your call.",
    hydrating_serum: "Since you indicated oily skin: it's a common myth that oily skin doesn't need hydration — skipping it can actually trigger more oil production. A lightweight, water-based serum is usually a good fit.",
  },
  dry: {
    exfoliant: "Since you indicated dry skin: exfoliating acids can be more drying for some people. Starting with a gentler formula or less frequent use is common — but it's still worth trying if you're curious.",
  },
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
export function applyProgramPhase(phaseSteps, routinePeriod, { isFirstApplication, startDate } = {}) {
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
      notes: bufferStep.notes || null,
    })
  }
  if (retinoidStep) {
    newMain.push({
      id: 'main_retinoid', categoryKey: 'retinoid', label: retinoidStep.label,
      optional: false, enabled: true, professionalOnly: false,
      notes: retinoidStep.notes || null,
    })
  }

  const patch = { steps: { ...currentSteps, main: newMain } }

  if (retinoidStep?.frequency) {
    const effectiveStartDate = startDate || new Date().toISOString().split('T')[0]
    patch.tret_enabled = true
    patch.tret_frequency = retinoidStep.frequency // kept for display/back-compat (current segment)
    patch.active_name = retinoidStep.label.toLowerCase()

    if (isFirstApplication) {
      patch.tret_start_date = effectiveStartDate
      patch.tret_frequency_history = [{ start_date: effectiveStartDate, frequency: retinoidStep.frequency }]
    } else {
      // Append a new segment — past dates keep rendering under the
      // previous frequency's pattern, only dates from today onward
      // use the new one.
      const existing = routinePeriod?.tretFrequencyHistory?.length
        ? routinePeriod.tretFrequencyHistory
        : (routinePeriod?.tretStartDate ? [{ start_date: routinePeriod.tretStartDate, frequency: routinePeriod.tretFrequency }] : [])
      patch.tret_frequency_history = [...existing, { start_date: effectiveStartDate, frequency: retinoidStep.frequency }]
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

// Counts days within [phaseStartedAt, today] where a treatment caused
// a 'pause' (pre-treatment) or 'recovery'/'pca' (post-treatment) night —
// i.e. days where an active-night program step (like retinoid) wouldn't
// have been applied. Used to extend a program phase's effective duration
// so treatments don't fast-track someone through a tolerance ramp.
export function countTreatmentPauseDays(phaseStartedAt, today, treatments, allTypes) {
  const start = new Date(phaseStartedAt + 'T00:00:00')
  const end = new Date(today + 'T00:00:00')
  if (start > end) return 0

  let count = 0
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    // The treatment day itself is not a "routine pause" — only the pre/post windows are
    let hit = false
    for (const [tk, entries] of Object.entries(treatments)) {
      for (const tv of (Array.isArray(entries) ? entries : [entries])) {
        const td = new Date(tk + 'T00:00:00')
        const cfg = allTypes[tv.type] || { pre: 3, post: 3, pca: false }
        const diff = Math.round((d - td) / 86400000)
        if ((diff >= -cfg.pre && diff <= -1) || (diff >= 1 && diff <= cfg.post)) { hit = true; break }
      }
      if (hit) break
    }
    if (hit) count++
  }
  return count
}
