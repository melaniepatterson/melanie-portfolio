/**
 * GlowUpCalendar.jsx
 * ─────────────────────────────────────────────────────────────
 * Melanie's glow-up routine + treatment calendar. Fully Supabase-backed
 * (Postgres + Auth) — all data loads and persists via `supabase.from(...)`.
 *
 * ARCHITECTURE
 *   - routineHistory: array of routine periods, each with a startDate.
 *     The calendar finds the most recent period whose startDate <= any
 *     given date and uses those settings to render that day.
 *     Periods can be added (going forward) OR edited in place.
 *   - treatments: one-off treatment events (peels, electrolysis, etc.)
 *   - customTypes: user-defined treatment type definitions
 *
 * STYLING
 *   All colors live in the T object, imported from ./theme.
 *
 * USAGE
 *   import GlowUpCalendar from './components/GlowUpCalendar'
 *   <GlowUpCalendar />
 * ─────────────────────────────────────────────────────────────
 */

import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import GlowUpLoader from './GlowUpLoader'
import { LoadError } from './ErrorBoundary'
import Onboarding from './Onboarding'
import ProgramAdvancement, { Phase2Picker } from './ProgramAdvancement'
import BetaSurvey from './BetaSurvey'
import { applyProgramPhase, buildStepEntries } from './programOptions'
import { todayInTz, nowInTz, detectTimezone } from './timezone'
import { fmtDate, fmtDateTime } from './dateFormat'
import { programCardColor, programMidColor } from './programColors'
import SideMenu from './SideMenu'
import T from './theme'
import ProductForm from './shared/ProductForm'
import GlowUpLogo from './GlowUpWordmark'
import { useConfirm, useAlert } from './shared/useConfirm'
import Btn from './shared/Btn'
import AccentWord from './shared/AccentWord'
import StarRating from './shared/StarRating'
import FeedbackPanel from './shared/FeedbackPanel'

// ─── DESIGN TOKENS ───────────────────────────────────────────

// ─── CONSTANTS ───────────────────────────────────────────────
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

// Ingredient/category taxonomy — maps to routine structure flags
// scope: 'face' = face routine products, 'body' = shower/body products, 'both' = either
const ACTIVE_CATEGORIES = {
  retinoid:    { label: 'Retinoids',              routineFlag: 'tret',        scope: 'face' },
  aha:         { label: 'AHAs',                   routineFlag: 'azelaic',     scope: 'face' },
  bha:         { label: 'BHAs',                   routineFlag: 'bha',         scope: 'both' },
  vitamin_c:   { label: 'Vitamin C',              routineFlag: 'vitamin_c',   scope: 'face' },
  bp:          { label: 'Benzoyl peroxide',        routineFlag: 'bp',          scope: 'body' },
  physical:    { label: 'Physical exfoliation',   routineFlag: 'physical',    scope: 'body' },
  niacinamide: { label: 'Niacinamide',            routineFlag: 'niacinamide', scope: 'face' },
}

const BASE_TYPES = {
  peel: {
    label: 'Chemical peel',
    area: 'face', pre: 7, post: 10, pca: true,
    avoidPre:  ['retinoid','aha','bha','vitamin_c','bp','physical'],
    avoidPost: ['retinoid','aha','bha','vitamin_c','bp','physical'],
    avoidPreNote:  'Stop all actives 7 days before your peel.',
    avoidPostNote: 'Use Recovery products only for 10 days post-peel. No other actives until fully healed.',
  },
  facial: {
    label: 'Facial',
    area: 'face', pre: 2, post: 2, pca: false,
    avoidPre:  ['retinoid','aha','bha'],
    avoidPost: ['retinoid','aha','bha'],
    avoidPreNote:  'Skip retinoids and exfoliating acids 2 days before.',
    avoidPostNote: 'Give skin 2 days before reintroducing actives.',
  },
  microderm: {
    label: 'Microdermabrasion',
    area: 'face', pre: 5, post: 5, pca: false,
    avoidPre:  ['retinoid','aha','bha','physical'],
    avoidPost: ['retinoid','aha','bha','physical'],
    avoidPreNote:  'No exfoliants or retinoids 5 days before.',
    avoidPostNote: 'Skin barrier is compromised — no actives or physical exfoliation for 5 days.',
  },
  electrolysis: {
    label: 'Electrolysis',
    area: 'both', pre: 7, post: 7, pca: false,
    avoidPre:  ['retinoid'],
    avoidPost: ['retinoid'],
    avoidPreNote:  'Pause retinoids 7 days before (increases skin sensitivity at treatment sites).',
    avoidPostNote: 'Wait 7 days before restarting retinoids on treated areas.',
  },
  laser: {
    label: 'Laser hair removal',
    area: 'both', pre: 7, post: 7, pca: false,
    avoidPre:  ['retinoid','aha','bha','bp'],
    avoidPost: ['retinoid','aha','bha','bp'],
    avoidPreNote:  'Stop retinoids and acids 7 days before — they increase photosensitivity and burn risk.',
    avoidPostNote: 'No actives for 7 days post-laser. Skin is highly sensitized.',
  },
  dermaplaning: {
    label: 'Dermaplaning',
    area: 'face', pre: 3, post: 3, pca: false,
    avoidPre:  ['retinoid','aha','bha'],
    avoidPost: ['retinoid','aha','bha'],
    avoidPreNote:  'No retinoids or acids 3 days before — skin will be too sensitized.',
    avoidPostNote: 'Wait 3 days before reintroducing actives post-dermaplaning.',
  },
  botox: {
    label: 'Botox / filler',
    area: 'face', pre: 0, post: 3, pca: false,
    avoidPre:  [],
    avoidPost: ['retinoid'],
    avoidPreNote:  '',
    avoidPostNote: 'Avoid applying retinoids near treatment sites for 3 days.',
  },
  led: {
    label: 'LED therapy',
    area: 'both', pre: 0, post: 0, pca: false,
    avoidPre:  [],
    avoidPost: [],
    avoidPreNote:  '',
    avoidPostNote: '',
  },
  microneedling: {
    label: 'Microneedling (professional)', area: 'face', pre: 7, post: 14, pca: false,
    avoidPre:  ['retinoid','aha','bha','vitamin_c','bp'],
    avoidPost: ['retinoid','aha','bha','vitamin_c','bp'],
    avoidPreNote:  'Stop all actives 7 days before — skin must be in baseline condition.',
    avoidPostNote: 'No actives for 14 days post-microneedling. Skin barrier is compromised.',
  },
  microneedling_home: {
    label: 'Microneedling (at home)', area: 'face', pre: 3, post: 7, pca: false,
    avoidPre:  ['retinoid','aha','bha','vitamin_c'],
    avoidPost: ['retinoid','aha','bha','vitamin_c'],
    avoidPreNote:  'Stop actives 3 days before home microneedling.',
    avoidPostNote: 'No actives for 7 days after — treat like a mini professional session.',
  },
    hydrafacial: {
    label: 'HydraFacial',
    area: 'face', pre: 3, post: 3, pca: false,
    avoidPre:  ['retinoid','aha','bha'],
    avoidPost: ['retinoid','aha','bha'],
    avoidPreNote:  'Skip retinoids and acids 3 days before.',
    avoidPostNote: 'No actives for 3 days — skin is freshly exfoliated.',
  },
}

const TRET_FREQUENCIES = [
  { key: '2x-232',      label: '2× per week',       description: '1 on → 2 off → 1 on → 3 off, rolling weekly cycle' },
  { key: 'alternating', label: 'Every other night',  description: '1 on → 1 off, repeating'          },
  { key: '5x',          label: '5× per week',        description: '2 on → 1 off → 3 on → 1 off, repeating' },
  { key: 'nightly',     label: 'Every night',        description: 'Every single night'               },
]


// Main active options for the evening treatment dropdown
const MAIN_ACTIVE_OPTIONS = [
  { value: 'tretinoin',     label: 'Tretinoin (prescription)' },
  { value: 'adapalene',     label: 'Adapalene (Differin)' },
  { value: 'retinol',       label: 'Retinol' },
  { value: 'retinaldehyde', label: 'Retinaldehyde' },
  { value: 'tazarotene',    label: 'Tazarotene (prescription)' },
  { value: 'other',         label: 'Other (type below)' },
]

// Secondary evening actives — toggled on/off in routine setup
// nights: 'off' = only on non-main-active nights | 'main' = only on active nights | 'all' = every night
const AVAILABLE_SECONDARY_ACTIVES = [
  { key: 'bha',          label: 'Exfoliating acids (AHA / BHA)', stepKey: 'pm_bha',  defaultNights: 'off'  },
  { key: 'azelaic',      label: 'Azelaic acid',           stepKey: 'pm_azelaic',        defaultNights: 'off'  },
  { key: 'peptides',     label: 'Peptides',               stepKey: 'pm_peptides',       defaultNights: 'all'  },
  { key: 'niacinamide',  label: 'Niacinamide (PM)',       stepKey: 'pm_niacinamide_pm', defaultNights: 'all'  },
  { key: 'pha',          label: 'PHAs (gentle acids)',    stepKey: 'pm_pha',            defaultNights: 'off'  },
]

// ─── STEP TAXONOMY ───────────────────────────────────────────
// Steps are application-order positions in the routine.
// Ingredient tagging lives on the product, not the step.
// dayTypes: am / main (active nights) / off / recovery / pause

const INGREDIENT_CATEGORIES = {
  micellar_water: {
    label: 'Micellar / cleansing water', order: 1,
    dayTypes: { am: true, main: true, off: true, recovery: true, pause: true },
    optional: true,
    forms: ['Micellar water', 'Cleansing water', 'Other'],
    productCategories: ['micellar water', 'cleansing water'],
  },
  oil_cleanser: {
    label: 'Cleansing balm / oil', order: 2,
    dayTypes: { am: false, main: true, off: true, recovery: true, pause: true },
    optional: true,
    forms: ['Cleansing oil', 'Cleansing balm', 'Cleansing butter', 'Other'],
    productCategories: ['cleansing oil', 'cleansing balm', 'cleansing oil / balm'],
  },
  cleanser: {
    label: 'Water-based cleanser', order: 3,
    dayTypes: { am: true, main: true, off: true, recovery: true, pause: true },
    optional: false,
    forms: ['Gel cleanser', 'Foam cleanser', 'Cream cleanser', 'Other'],
    productCategories: ['cleanser', 'face wash'],
  },
  aha_bha_toner: {
    label: 'Exfoliant toner (AHA / BHA)', order: 4,
    dayTypes: { am: false, main: false, off: true, recovery: false, pause: false },
    optional: true,
    forms: ['AHA toner (glycolic)', 'AHA toner (lactic)', 'BHA toner (salicylic)', 'Mixed AHA+BHA', 'PHA toner', 'Other'],
    productCategories: ['aha toner', 'bha toner', 'exfoliant toner'],
  },
  toner: {
    label: 'Toner', order: 5,
    dayTypes: { am: true, main: true, off: true, recovery: true, pause: true },
    optional: true,
    forms: ['Hydrating toner', 'Softening toner', 'Balancing toner', 'Other'],
    productCategories: ['toner'],
  },
  essence: {
    label: 'Essence', order: 6,
    dayTypes: { am: true, main: true, off: true, recovery: true, pause: true },
    optional: true,
    forms: ['Hydrating essence', 'Fermented essence', 'Treatment essence', 'Other'],
    productCategories: ['essence'],
  },
  watery_serum: {
    label: 'Watery serum', order: 7,
    dayTypes: { am: true, main: true, off: true, recovery: true, pause: true },
    optional: true,
    forms: ['Hyaluronic acid serum', 'Niacinamide serum', 'Snail mucin', 'Centella serum', 'Vitamin C powder (mix-in)', 'Other watery serum'],
    productCategories: ['serum', 'hyaluronic acid', 'niacinamide', 'snail mucin'],
    ingredientCategories: ['hyaluronic_acid', 'niacinamide', 'snail_mucin', 'centella'],
  },
  treatment_serum: {
    label: 'Treatment serum', order: 8,
    dayTypes: { am: true, main: true, off: true, recovery: false, pause: false },
    optional: true,
    forms: ['Vitamin C serum', 'Peptide serum', 'Tranexamic acid', 'Alpha arbutin', 'Retinol serum', 'Bakuchiol', 'Other treatment serum'],
    productCategories: ['serum', 'vitamin c', 'peptides'],
    ingredientCategories: ['vitamin_c', 'peptides', 'tranexamic_acid', 'alpha_arbutin', 'kojic_acid', 'bakuchiol', 'antioxidant'],
  },
  moisturizer_buffer: {
    label: 'Moisturizer (buffer layer)', order: 8.25,
    dayTypes: { am: false, main: true, off: false, recovery: false, pause: false },
    optional: true,
    forms: ['Same as your regular moisturizer'],
    productCategories: ['moisturizer', 'lotion', 'barrier cream'],
  },
  retinoid: {
    label: 'Retinoid', order: 8.5,
    dayTypes: { am: false, main: true, off: false, recovery: false, pause: false },
    optional: false,
    forms: ['Tretinoin (prescription)', 'Adapalene', 'Retinol', 'Retinaldehyde', 'Tazarotene', 'Other retinoid'],
    productCategories: ['retinoid', 'retinol', 'tretinoin'],
    ingredientCategories: ['retinoid'],
  },
  spot_treatment: {
    label: 'Spot treatment', order: 9,
    dayTypes: { am: true, main: false, off: true, recovery: false, pause: false },
    optional: true,
    forms: ['Benzoyl peroxide', 'Azelaic acid', 'Salicylic acid spot treatment', 'Sulfur treatment', 'Other'],
    productCategories: ['spot treatment', 'azelaic acid', 'benzoyl peroxide'],
    ingredientCategories: ['benzoyl_peroxide', 'azelaic_acid', 'bha', 'aha'],
  },
  eye_cream: {
    label: 'Eye cream / treatment', order: 10,
    dayTypes: { am: true, main: true, off: true, recovery: true, pause: true },
    optional: true,
    forms: ['Eye cream', 'Eye gel', 'Eye serum', 'Other'],
    productCategories: ['eye cream', 'eye gel'],
  },
  moisturizer: {
    label: 'Moisturizer', order: 11,
    dayTypes: { am: true, main: true, off: true, recovery: true, pause: true },
    optional: false,
    forms: ['Gel moisturizer', 'Cream moisturizer', 'Lotion', 'Gel-cream', 'Barrier cream', 'Other'],
    productCategories: ['moisturizer', 'lotion', 'barrier cream'],
  },
  face_oil: {
    label: 'Face oil', order: 12,
    dayTypes: { am: false, main: true, off: true, recovery: 'professional', pause: true },
    optional: true,
    forms: ['Rosehip oil', 'Squalane', 'Jojoba oil', 'Marula oil', 'Argan oil', 'Other'],
    productCategories: ['face oil', 'facial oil', 'oil'],
  },
  occlusive: {
    label: 'Occlusive / slug', order: 13,
    dayTypes: { am: false, main: true, off: true, recovery: true, pause: true },
    optional: true,
    forms: ['Petrolatum / Vaseline', 'Lanolin', 'Plant-based occlusive', 'Other'],
    productCategories: ['occlusive', 'petrolatum'],
  },
  spf: {
    label: 'SPF', order: 14,
    dayTypes: { am: true, main: false, off: false, recovery: true, pause: true },
    optional: false,
    forms: ['Chemical SPF', 'Mineral SPF', 'Hybrid SPF', 'Tinted SPF', 'Other'],
    productCategories: ['spf', 'sunscreen', 'sun protection'],
  },
}



function getDefaultSteps(dayType) {
  return Object.entries(INGREDIENT_CATEGORIES)
    .filter(([, cat]) => {
      const dt = cat.dayTypes[dayType]
      return dt === true || dt === 'professional'
    })
    .sort(([, a], [, b]) => a.order - b.order)
    .map(([key, cat]) => ({
      id: `${dayType}_${key}`,
      categoryKey: key,
      label: cat.label,
      optional: cat.optional,
      enabled: !cat.optional, // required steps on by default; optional steps off
      professionalOnly: cat.dayTypes[dayType] === 'professional',
    }))
}

function getPeriodSteps(period, dayType) {
  if (period?.steps?.[dayType]) return period.steps[dayType]
  return getDefaultSteps(dayType)
}

function getStepsForDayType(period, dayType) {
  return getPeriodSteps(period, dayType)
    .filter(s => s.enabled)
    .sort((a, b) => {
      const orderA = INGREDIENT_CATEGORIES[a.categoryKey]?.order ?? 99
      const orderB = INGREDIENT_CATEGORIES[b.categoryKey]?.order ?? 99
      return orderA - orderB
    })
}



const NIGHTS_OPTIONS = [
  { key: 'main', label: 'Active nights'  },
  { key: 'off',  label: 'Off nights'     },
  { key: 'all',  label: 'Every night'    },
]

// Simpler frequency options for secondary actives when no retinoid is in use
const EVENING_FREQ_SIMPLE = [
  { key: 'all',       label: 'Every night'       },
  { key: 'alternate', label: 'Every other night'  },
  { key: 'few',       label: '2–3× per week'     },
]

// Which secondary actives are not recommended on which nights
const SECONDARY_INCOMPATIBILITIES = {
  bha:     { main: 'Using exfoliating acids on the same nights as a retinoid increases irritation and sensitivity. Most derms recommend alternating.' },
  pha:     { main: 'PHAs combined with retinoids may increase irritation, especially while building tolerance. Consider using on separate nights.' },
  azelaic: {}, // azelaic acid is generally compatible with retinoids
  peptides:{}, // peptides are broadly compatible
  niacinamide: {}, // niacinamide is compatible with most actives
}

const DEFAULT_PERIOD = {
  startDate:         '',
  activeName:        'retinoid',
  tretEnabled:       false,
  tretFrequency:     '2x-232',
  tretStartDate:     '',
  secondaryActives:  AVAILABLE_SECONDARY_ACTIVES.map(a => ({ key: a.key, enabled: false, nights: a.defaultNights })),
}

// ─── HELPERS ─────────────────────────────────────────────────
function dateKey(dt) {
  return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`
}


// Returns the date string for the day before a given date string
function getPeriodStatus(p, today) {
  if (!today) { today = new Date(); today.setHours(0,0,0,0) }
  const start = new Date(p.startDate + 'T00:00:00')
  const end   = p.endDate ? new Date(p.endDate + 'T00:00:00') : null
  if (start > today) return 'upcoming'
  if (!end || end >= today) return 'current'
  return 'past'
}

function dayBefore(dateStr) {
  const dt = new Date(dateStr + 'T00:00:00')
  dt.setDate(dt.getDate() - 1)
  return dateKey(dt)
}

// Detects overlap between a candidate period and all others in a history array.
// Excludes the period being edited (matched by excludeId for daily, excludeStartDate for routine).
// Returns the conflicting period or null.
function detectOverlap({ startDate, endDate, excludeId, excludeStartDate, excludeStartDates }, history) {
  const candidateEnd = endDate || '9999-12-31'
  const excludeSet = new Set([excludeStartDate, ...(excludeStartDates || [])].filter(Boolean))
  for (const p of history) {
    if (excludeId && p.id === excludeId) continue
    if (excludeSet.has(p.startDate)) continue
    const pEnd = p.endDate || '9999-12-31'
    // Overlap: candidate starts before p ends AND candidate ends after p starts
    const overlaps = startDate <= pEnd && candidateEnd >= p.startDate
    if (overlaps) return p
  }
  return null
}



// If a manual edit changed tretFrequency/tretStartDate such that it no
// longer matches the most recent history segment, treat it as a deliberate
// override and reset history to a single fresh segment from the new date.
// Otherwise, preserve the existing multi-segment history (e.g. from a
// program's phase progression) unchanged.
function reconcileTretFrequencyHistory(form) {
  if (!form.tretEnabled || !form.tretStartDate) return []
  const history = form.tretFrequencyHistory || []
  const last = history[history.length - 1]
  if (last && last.frequency === form.tretFrequency) return history
  return [{ start_date: form.tretStartDate, frequency: form.tretFrequency }]
}

export function getActivePeriod(dt, history) {
  const key = dateKey(dt)
  const sorted = [...history].sort((a, b) => a.startDate.localeCompare(b.startDate))
  let active = null
  for (const p of sorted) { if (p.startDate <= key) active = p }
  return active
}

function getTretBhaStatus(dt, period) {
  if (!period?.tretEnabled) return null

  // Frequency history: an array of { start_date, frequency } segments.
  // Each segment governs dates from its start_date until the next
  // segment's start_date. This preserves history when a program
  // advances to a new frequency — past dates keep rendering under
  // whatever frequency was actually active at the time.
  const history = (period.tretFrequencyHistory && period.tretFrequencyHistory.length)
    ? period.tretFrequencyHistory
    : (period.tretStartDate ? [{ start_date: period.tretStartDate, frequency: period.tretFrequency }] : [])

  if (!history.length) return null
  const sorted = [...history].sort((a, b) => a.start_date.localeCompare(b.start_date))

  let segment = null
  for (const seg of sorted) {
    const segStart = new Date(seg.start_date + 'T00:00:00')
    if (!isNaN(segStart) && dt >= segStart) segment = seg
  }
  if (!segment) return null

  const segStart = new Date(segment.start_date + 'T00:00:00')
  const daysIn = Math.round((dt - segStart) / 86400000)
  const dow    = dt.getDay()
  switch (segment.frequency) {
    case 'nightly':     return 'tret'
    case 'alternating': return daysIn % 2 === 0 ? 'tret' : (period.secondaryActives !== undefined ? 'rest' : (period.bhaEnabled ? 'bha' : 'rest'))
    case '5x': {
      // 2 on → 1 off → 3 on → 1 off pattern (days 2 and 6 are off)
      const cycle5 = daysIn % 7
      const isOn5 = cycle5 !== 2 && cycle5 !== 6
      return isOn5 ? 'tret' : (period.secondaryActives !== undefined ? 'rest' : (period.bhaEnabled ? 'bha' : 'rest'))
    }
    case '2x-232': {
      // 1 on → 2 off → 1 on → 3 off (days 0 and 3 are tret, zero-indexed)
      const cycle = daysIn % 7
      if (cycle === 0 || cycle === 3) return 'tret'
      if (period.secondaryActives !== undefined) return 'rest'
      return period.bhaEnabled ? 'bha' : 'rest'
    }
    default: return null
  }
}


// Standalone AHA/BHA schedule for users in the AHA/BHA Onboarding program
// (without tret — on tret nights bha is handled inside getTretBhaStatus)
// Phase 1 (freq 1): Saturday only
// Phase 2 (freq 2): Tuesday + Saturday
// Phase 3 (freq 3): Monday + Wednesday + Saturday
function getBhaStatus(dt, period) {
  if (!period?.bhaEnabled || period?.tretEnabled) return null
  const freq     = period.bhaFrequency || 1
  const startDay = period.bhaStartDay ?? 6
  const dow      = dt.getDay()
  const d1 = startDay % 7
  const d2 = (startDay + 3) % 7
  const d3 = (startDay + 2) % 7
  const d4 = (startDay + 4) % 7
  if (freq === 1 && dow === d1) return 'bha'
  if (freq === 2 && (dow === d1 || dow === d2)) return 'bha'
  if (freq >= 3 && (dow === d1 || dow === d3 || dow === d4)) return 'bha'
  return null
}

function getDayInfo(dt, treatments, allTypes, routineHistory) {
  const key = dateKey(dt)

  // Treatments is now { [dateKey]: TreatmentEntry[] }
  // Check if this day itself has treatments
  const dayEntries = treatments[key]
  if (dayEntries?.length) {
    // Use most severe type (prefer face treatments over body for determining status)
    const faceEntry = dayEntries.find(e => e.area === 'face' || e.area === 'both')
    const primary = faceEntry || dayEntries[0]
    return { status: primary.type, isTreatment: true, allTreatments: dayEntries }
  }

  // Check if this day falls within pre/post window of any treatment on any other day
  for (const [tk, entries] of Object.entries(treatments)) {
    for (const tv of (entries || [])) {
      const td   = new Date(tk + 'T00:00:00')
      const cfg  = {
        pre:  tv.pre  ?? allTypes[tv.type]?.pre  ?? 3,
        post: tv.post ?? allTypes[tv.type]?.post ?? 3,
        pca:  allTypes[tv.type]?.pca ?? false,
      }
      const diff = Math.round((dt - td) / 86400000)
      if (diff >= -cfg.pre && diff <= -1)    return { status: 'pause',    isTreatment: false }
      if (diff >= 1 && diff <= cfg.post)     return { status: cfg.pca ? 'pca' : 'recovery', isTreatment: false, activeTreatmentType: tv.type }
    }
  }

  const period  = getActivePeriod(dt, routineHistory)
  const tretBha = getTretBhaStatus(dt, period)
  if (tretBha && tretBha !== 'rest') return { status: tretBha, isTreatment: false }
  const bha = getBhaStatus(dt, period)
  if (bha) return { status: bha, isTreatment: false }
  return { status: 'none', isTreatment: false }
}

// ─── UI PRIMITIVES ───────────────────────────────────────────
function Badge({ colorKey, label }) {
  const c = T[colorKey] || T.custom
  return (
    <span style={{ fontSize: 'clamp(7px, 1.5vw, 9px)', fontWeight: 600, padding: '1px 6px', borderRadius: T.radius.pill, background: T.white, color: c.text, border: 'none', display: 'inline-block', lineHeight: 1.5, whiteSpace: 'nowrap', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '0.02em' }}>
      {label}
    </span>
  )
}


function SectionLabel({ children, style }) {
  return <div style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, marginTop: 14, paddingTop: 12, borderTop: `0.5px solid ${T.hairline}`, ...style }}>{children}</div>
}

function FieldLabel({ children, htmlFor }) {
  const Tag = htmlFor ? 'label' : 'div'
  return <Tag htmlFor={htmlFor} style={{ fontSize: 11, color: T.textLight, marginBottom: 3, display: 'block' }}>{children}</Tag>
}

function TextInput({ id, value, onChange, placeholder, width = 140 }) {
  return <input id={id} type="text" value={value} onChange={onChange} placeholder={placeholder} style={{ width, fontSize: 12, padding: '5px 2px', border: 'none', borderBottom: `1px solid ${T.darkGreen}`, borderRadius: 0, background: 'transparent', color: T.darkGreen, outline: 'none' }} />
}

function NumberInput({ id, value, onChange, min = 0, max = 14, width = 60 }) {
  return <input id={id} type="number" value={value} onChange={onChange} min={min} max={max} style={{ width, fontSize: 12, padding: '5px 2px', border: 'none', borderBottom: `1px solid ${T.darkGreen}`, borderRadius: 0, background: 'transparent', color: T.darkGreen, outline: 'none' }} />
}

function DateInput({ id, value, onChange, disabled = false }) {
  return <input id={id} type="date" value={value} onChange={onChange} disabled={disabled} style={{ fontSize: 12, padding: '5px 2px', border: 'none', borderBottom: `1px solid ${T.darkGreen}`, borderRadius: 0, background: 'transparent', color: disabled ? T.textMuted : T.darkGreen, outline: 'none', cursor: disabled ? 'not-allowed' : 'auto' }} />
}

// ─── CONFLICT MESSAGE ────────────────────────────────────────
function ConflictMessage({ conflict, onEditConflict }) {
  const endLabel = conflict.endDate ? ` → ${conflict.endDate}` : ' (active, no end date)'
  const itemCount = conflict.items ? ` · ${conflict.items.length} item${conflict.items.length !== 1 ? 's' : ''}` : ''
  return (
    <div style={{
      background: '#FCEBEB', border: '0.5px solid #E24B4A',
      borderRadius: 0, padding: '10px 14px', marginBottom: 10,
    }}>
      <div style={{ fontSize: 12, fontWeight: 500, color: '#791F1F', marginBottom: 6 }}>
        Date conflict — overlaps with another period
      </div>
      <div style={{ fontSize: 11, color: '#9F1239', marginBottom: 8, lineHeight: 1.6 }}>
        Conflicts with period from <strong>{conflict.startDate}</strong>{endLabel}{itemCount}.
        Edit that period first to resolve the overlap.
      </div>
      <button
        onClick={() => onEditConflict(conflict)}
        style={{
          fontSize: 11, padding: '4px 12px', borderRadius: 0,
          border: '0.5px solid #E24B4A', background: 'transparent',
          color: '#791F1F', cursor: 'pointer', fontWeight: 500,
        }}
      >
        Edit conflicting period →
      </button>
    </div>
  )
}


// ─── TREATMENT CONFLICT DETECTION ───────────────────────────
// Returns an array of conflict objects for a proposed treatment on `proposedKey`.
// Checks: other-treatment windows, tret-start proximity (ALL periods, not just active).
function detectTreatmentConflicts(proposedKey, proposedType, allTypes, treatments, routineHistory) {
  const conflicts = []
  const proposedDt = new Date(proposedKey + 'T00:00:00')
  const cfg = allTypes[proposedType]
  if (!cfg) return conflicts

  // (a) Proposed date falls inside an existing treatment's pre/post window
  for (const [tk, entries] of Object.entries(treatments)) {
    if (tk === proposedKey) continue
    for (const tv of (entries || [])) {
      const td = new Date(tk + 'T00:00:00')
      const ec = { pre: tv.pre ?? allTypes[tv.type]?.pre ?? 3, post: tv.post ?? allTypes[tv.type]?.post ?? 3 }
      const diff = Math.round((proposedDt - td) / 86400000)
      if (diff >= -ec.pre && diff <= ec.post) {
        const dir = diff < 0 ? `${Math.abs(diff)}d before` : `${diff}d after`
        conflicts.push({
          kind: 'treatment',
          message: `Falls inside ${allTypes[tv.type]?.label || tv.type} window (${tk})`,
          detail: `That treatment needs ${ec.pre} days before + ${ec.post} days after clear. You're ${dir} it.`
        })
      }
    }
  }

  // (b) An existing treatment falls inside this treatment's own pre-window
  for (const [tk, entries] of Object.entries(treatments)) {
    if (tk === proposedKey) continue
    for (const tv of (entries || [])) {
      const td = new Date(tk + 'T00:00:00')
      const diffExisting = Math.round((td - proposedDt) / 86400000)
      if (diffExisting < 0 && diffExisting >= -cfg.pre) {
        conflicts.push({
          kind: 'treatment',
          message: `Pre-treatment window conflicts with ${allTypes[tv.type]?.label || tv.type} (${tk})`,
          detail: `This treatment needs ${cfg.pre} days clear before it. That treatment is ${Math.abs(diffExisting)} days prior.`
        })
      }
    }
  }

  // (c) Check ALL routine periods for tret start date proximity — not just active period.
  // This catches the case where tret isn't active yet on the proposed date.
  for (const period of (routineHistory || [])) {
    if (!period.tretEnabled || !period.tretStartDate) continue
    const tretStart = new Date(period.tretStartDate + 'T00:00:00')
    const daysToTret = Math.round((tretStart - proposedDt) / 86400000)

    // Treatment is BEFORE tret start — does recovery bleed into tret?
    if (daysToTret > 0 && daysToTret <= cfg.post) {
      conflicts.push({
        kind: 'tret',
        message: `Recovery window overlaps ${period.activeName || 'Tretinoin'} start (${period.tretStartDate})`,
        detail: `This treatment needs ${cfg.post} days recovery. Your retinoid starts in ${daysToTret} days — you won't be healed in time.`
      })
    }

    // Treatment is AFTER tret start — does it fall inside tret's required pre-pause?
    if (daysToTret < 0 && daysToTret >= -cfg.pre) {
      conflicts.push({
        kind: 'tret',
        message: `Too close to ${period.activeName || 'Tretinoin'} start (${period.tretStartDate})`,
        detail: `This treatment needs ${cfg.pre} days retinoid pause before it. Your retinoid started ${Math.abs(daysToTret)} days ago — not enough time.`
      })
    }

    // Treatment is BEFORE tret start but its pre-window extends before the treatment date
    // and tret is already running — meaning tret wasn't paused in time
    if (daysToTret > 0 && daysToTret > cfg.post) {
      // Far enough away — no conflict
    }
  }

  return conflicts
}

// TreatmentConflictBlock — scheduling conflicts + ingredient conflicts + safe date
function TreatmentConflictBlock({ conflicts, ingredientConflicts, safeDate, treatmentLabel }) {
  const hasScheduling = conflicts.length > 0
  const hasIngredients = ingredientConflicts && (ingredientConflicts.pre.length > 0 || ingredientConflicts.post.length > 0)
  const blocked = hasScheduling

  return (
    <div style={{ background: blocked ? '#FCEBEB' : '#FFFBEB', border: `0.5px solid ${blocked ? '#E24B4A' : '#FCD34D'}`, borderRadius: 0, padding: '12px 14px', marginBottom: 12 }}>

      {/* Scheduling conflicts — block save */}
      {hasScheduling && (
        <div style={{ marginBottom: hasIngredients ? 12 : 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#791F1F', marginBottom: 8 }}>
            Cannot save — {conflicts.length} scheduling conflict{conflicts.length > 1 ? 's' : ''}
          </div>
          {conflicts.map((c, i) => (
            <div key={i} style={{ marginBottom: i < conflicts.length - 1 ? 8 : 0 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#9F1239' }}>{c.message}</div>
              <div style={{ fontSize: 11, color: '#7F1D1D', marginTop: 2, lineHeight: 1.5 }}>{c.detail}</div>
            </div>
          ))}
          {safeDate && (
            <div style={{ fontSize: 11, fontWeight: 600, color: '#166534', marginTop: 10, padding: '6px 10px', background: '#DCFCE7', borderRadius: 0, border: '0.5px solid #4ADE80' }}>
              ✓ Earliest safe date: {safeDate}
            </div>
          )}
          <div style={{ fontSize: 11, color: '#9F1239', marginTop: 8, paddingTop: 8, borderTop: '0.5px solid #FECACA' }}>
            Adjust the treatment date to resolve the conflict before saving.
          </div>
        </div>
      )}

      {/* Ingredient / product conflicts — informational, don't block */}
      {hasIngredients && (
        <div style={{ borderTop: hasScheduling ? '0.5px solid #FCA5A5' : 'none', paddingTop: hasScheduling ? 10 : 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#92400E', marginBottom: 8 }}>
            {hasScheduling ? 'Also: ' : ''}Routine adjustments needed for {treatmentLabel}
          </div>

          {ingredientConflicts.pre.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#78350F', marginBottom: 3 }}>
                Pause {ingredientConflicts.preDays}d before:
              </div>
              {(() => {
                // Merge aha + bha into one "Exfoliating acids (AHA / BHA)" line
                const cats = ingredientConflicts.pre
                const hasAHA = cats.includes('aha'), hasBHA = cats.includes('bha')
                const merged = hasBHA && hasAHA
                  ? [...cats.filter(c => c !== 'aha' && c !== 'bha'), 'aha_bha']
                  : cats
                const getLabel = c => c === 'aha_bha' ? 'Exfoliating acids (AHA / BHA)' : (ACTIVE_CATEGORIES[c]?.label || c)
                return merged.map(cat => (
                  <div key={cat} style={{ fontSize: 11, color: '#92400E', padding: '2px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#F59E0B', flexShrink: 0 }} />
                    {getLabel(cat)}
                  </div>
                ))
              })()}
              {ingredientConflicts.preNote && (
                <div style={{ fontSize: 10, color: '#78350F', marginTop: 4, fontStyle: 'italic' }}>{ingredientConflicts.preNote}</div>
              )}
            </div>
          )}

          {ingredientConflicts.post.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#78350F', marginBottom: 3 }}>
                Avoid {ingredientConflicts.postDays}d after:
              </div>
              {(() => {
                const cats = ingredientConflicts.post
                const hasAHA = cats.includes('aha'), hasBHA = cats.includes('bha')
                const merged = hasBHA && hasAHA
                  ? [...cats.filter(c => c !== 'aha' && c !== 'bha'), 'aha_bha']
                  : cats
                const getLabel = c => c === 'aha_bha' ? 'Exfoliating acids (AHA / BHA)' : (ACTIVE_CATEGORIES[c]?.label || c)
                return merged.map(cat => (
                  <div key={cat} style={{ fontSize: 11, color: '#92400E', padding: '2px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#F59E0B', flexShrink: 0 }} />
                    {getLabel(cat)}
                  </div>
                ))
              })()}
              {ingredientConflicts.postNote && (
                <div style={{ fontSize: 10, color: '#78350F', marginTop: 4, fontStyle: 'italic' }}>{ingredientConflicts.postNote}</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* No scheduling conflict but has ingredient notes — show safe date context */}
      {!hasScheduling && hasIngredients && safeDate && (
        <div style={{ fontSize: 11, color: '#92400E', marginTop: 10, paddingTop: 8, borderTop: '0.5px solid #FDE68A' }}>
          You can save this date — just remember to pause the listed actives beforehand.
        </div>
      )}
    </div>
  )
}


// Returns which ACTIVE_CATEGORIES are present in the user's current routine
// Checks routine structure (tretEnabled, bhaEnabled) + shower items + currentlyUsing products
function getActiveRoutineFlags(period, showerHistory, proposedDt, products = {}) {
  const flags = new Set()

  // Skincare routine flags
  if (period?.tretEnabled)  flags.add('tret')
  if (period?.bhaEnabled)   flags.add('bha')
  if (period?.bhaEnabled)   flags.add('azelaic')

  // Secondary actives flags from new system
  for (const sa of (period?.secondaryActives || [])) {
    if (!sa.enabled) continue
    if (sa.key === 'bha')       flags.add('bha')
    if (sa.key === 'azelaic') flags.add('azelaic')
    if (sa.key === 'pha')     flags.add('aha')
  }

  // Products marked as currentlyUsing — count even if not assigned to a step
  for (const product of Object.values(products)) {
    if (!product.currentlyUsing) continue
    const cat = (product.category || '').toLowerCase()
    if (cat === 'tretinoin' || (product.name + ' ' + (product.notes||'')).toLowerCase().match(/retinol|retinoid|retinal|adapalene|tazarotene|vitamin a/)) flags.add('tret')
    if (cat === 'bha') flags.add('bha')
    if (cat === 'azelaic acid')           flags.add('azelaic')
    if (cat === 'body wash' || (product.name + ' ' + (product.notes||'')).toLowerCase().includes('benzoyl')) flags.add('bp')
    if (cat === 'serum' && (product.name + ' ' + (product.notes||'')).toLowerCase().includes('vitamin c')) flags.add('vitamin_c')
  }

  // Shower routine flags — check item labels for keywords
  const showerPeriod = getActiveShowerPeriod(proposedDt, showerHistory || [])
  for (const item of (showerPeriod?.items || [])) {
    const l = (item.label + ' ' + (item.note || '')).toLowerCase()
    if (l.includes('benzoyl') || l.includes('bp wash') || l.includes('bp '))  flags.add('bp')
    if (l.includes('salicylic') || l.includes('bha'))                            flags.add('bha')
    if (l.includes('glycolic') || l.includes('lactic') || l.includes('aha'))   flags.add('aha')
    if (l.includes('scrub') || l.includes('physical') || l.includes('exfoliat')) flags.add('physical')
    if (l.includes('niacinamide'))                                              flags.add('niacinamide')
    if (l.includes('vitamin c') || l.includes('ascorbic'))                      flags.add('vitamin_c')
  }

  return flags
}

// Given a treatment config and current routine flags, returns which active
// categories in avoidPre or avoidPost are actually present in the routine.
// treatmentArea: 'face' | 'body' | 'both' — filters out irrelevant scope conflicts.
function getRoutineConflicts(avoidList, routineFlags, treatmentArea = 'face') {
  return (avoidList || []).filter(cat => {
    const catDef = ACTIVE_CATEGORIES[cat]
    if (!catDef) return false
    // Scope filtering: 'both' matches any area
    if (catDef.scope === 'body' && treatmentArea === 'face') return false
    if (catDef.scope === 'face' && treatmentArea === 'body') return false
    // 'both' scoped items (like BHA) conflict with both face and body treatments
    return routineFlags.has(catDef.routineFlag || cat)
  })
}

// Finds the earliest safe date (no scheduling conflicts AND routine is manageable)
function findSafeDate(proposedKey, proposedType, allTypes, treatments, routineHistory) {
  const cfg = allTypes[proposedType]
  if (!cfg) return null
  // Search up to 60 days forward for a clean window
  const start = new Date(proposedKey + 'T00:00:00')
  for (let offset = 1; offset <= 60; offset++) {
    const candidate = new Date(start)
    candidate.setDate(candidate.getDate() + offset)
    const candidateKey = dateKey(candidate)
    const conflicts = detectTreatmentConflicts(candidateKey, proposedType, allTypes, treatments, routineHistory)
    if (conflicts.length === 0) return candidateKey
  }
  return null // no safe date found in 60 days
}

// ─── ROUTINE PERIOD FORM ─────────────────────────────────────
// Used for both initial setup, adding new periods, and editing existing ones.
// lockStartDate=true when editing — prevents accidental date change.
// ─── CURRENT ROUTINE SUMMARY ──────────────────────────────────
// Shows what's already in the routine being carried forward —
// surfaced prominently so users can see what they're building on
// top of (e.g. after graduating a program) before editing further.
function CurrentRoutineSummary({ steps }) {
  if (!steps) return null
  const am = (steps.am || []).filter(s => s.enabled)
  const pm = (steps.off || steps.pm || []).filter(s => s.enabled)
  if (!am.length && !pm.length) return null

  const sortByOrder = (a, b) => (INGREDIENT_CATEGORIES[a.categoryKey]?.order ?? 99) - (INGREDIENT_CATEGORIES[b.categoryKey]?.order ?? 99)

  return (
    <div style={{ background: T.surfaceMuted, borderRadius: T.radius.modal, padding: '14px 16px', marginBottom: 14 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>
        Your current routine
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: T.textLight, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>☀ Morning (AM)</div>
          {am.length === 0 && <div style={{ fontSize: 11, color: T.textLight }}>—</div>}
          {[...am].sort(sortByOrder).map(s => (
            <div key={s.id} style={{ fontSize: 12, color: T.darkGreen, marginBottom: 3 }}>{s.label}</div>
          ))}
        </div>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: T.textLight, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>☾ Evening (PM)</div>
          {pm.length === 0 && <div style={{ fontSize: 11, color: T.textLight }}>—</div>}
          {[...pm].sort(sortByOrder).map(s => (
            <div key={s.id} style={{ fontSize: 12, color: T.darkGreen, marginBottom: 3 }}>{s.label}</div>
          ))}
        </div>
      </div>
      <div style={{ fontSize: 11, color: T.textMuted, marginTop: 10, lineHeight: 1.6 }}>
        This carries forward into your new routine. Adjust anything below to build on top of it.
      </div>
    </div>
  )
}

export function RoutinePeriodForm({ initial = {}, onSave, onCancel, isFirst = false, lockStartDate = false, allPeriods = [], onEditConflict, products = {}, onSaveProduct, userId }) {
  const catalogProducts = Object.fromEntries(Object.entries(products).filter(([, p]) => p._isCatalog))
  const [form, setForm] = useState({ ...DEFAULT_PERIOD, ...initial, products: initial?.products || {} })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const setProductAssignment = (stepKey, productId) => setForm(f => ({ ...f, products: { ...(f.products||{}), [stepKey]: productId } }))
  const [openStep, setOpenStep] = useState(null)
  const [addingProd, setAddingProd] = useState(false)
  const [showProducts, setShowProducts] = useState(false)

  // Detect overlap — exclude self AND the currently active period (which will be auto-ended on save)
  const wouldAutoEnd = (form.startDate && !lockStartDate)
    ? getActivePeriod(new Date(form.startDate + 'T00:00:00'), allPeriods)
    : null
  const conflict = form.startDate
    ? detectOverlap(
        {
          startDate: form.startDate, endDate: form.endDate,
          excludeStartDate: initial?.startDate,
          excludeStartDates: wouldAutoEnd ? [wouldAutoEnd.startDate] : [],
        },
        allPeriods
      )
    : null

  const canSave = form.startDate.length > 0 && !conflict

  return (
    <div style={{ background: T.white, borderRadius: T.radius.modal, padding: '16px 18px', marginBottom: 14 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: T.darkGreen, marginBottom: 4 }}>
        {isFirst ? 'Skincare routine' : lockStartDate ? `Skincare routine — editing from ${fmtDate(initial.startDate)}` : 'Skincare routine'}
      </div>
      {!isFirst && !lockStartDate && (
        <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 12 }}>Past months stay accurate. This adds a new period; it doesn't overwrite history.</div>
      )}
      {lockStartDate && (
        <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 12 }}>You can edit the start date — if it overlaps with another period you'll be prompted to resolve it first.</div>
      )}

      <div style={{ marginBottom: 10 }}>
        <FieldLabel htmlFor="rp-start-date">{isFirst ? 'Routine start date' : 'Effective from'}</FieldLabel>
        <DateInput id="rp-start-date" value={form.startDate} onChange={e => set('startDate', e.target.value)} />
      </div>

      {conflict && <ConflictMessage conflict={conflict} onEditConflict={onEditConflict} />}

      {!isFirst && <CurrentRoutineSummary steps={initial?.steps} />}

      <SectionLabel style={{ borderTop: 'none', paddingTop: 0 }}>What does your skincare routine consist of?</SectionLabel>
      <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 12, lineHeight: 1.6, background: T.surfaceMuted, borderRadius: T.radius.card, padding: '10px 12px' }}>
        Your morning and evening steps — from cleanse to SPF, actives, and treatments. Toggle on what you use and we'll build your calendar around it.
      </div>

      {/* Retinoid toggle */}
      <div style={{ marginBottom: 4, padding: '10px 12px', borderRadius: T.radius.card, background: form.tretEnabled ? T.green : T.surfaceMuted }}>
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
          <input type="checkbox" checked={form.tretEnabled} onChange={e => set('tretEnabled', e.target.checked)} style={{ width: 14, height: 14, marginTop: 2, cursor: 'pointer', accentColor: T.darkGreen }} />
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.darkGreen }}>Retinoid (vitamin A)</div>
            <div style={{ fontSize: 11, color: T.textMuted }}>Tretinoin, adapalene, retinol, retinaldehyde, and more — prescription or over the counter</div>
          </div>
        </label>
      </div>
      {form.tretEnabled && (
        <div style={{ marginLeft: 12, marginBottom: 8, paddingLeft: 12 }}>
          <div style={{ marginBottom: 8, marginTop: 8 }}>
            <FieldLabel htmlFor="rp-active-name">Which one?</FieldLabel>
            <select
              id="rp-active-name"
              value={MAIN_ACTIVE_OPTIONS.find(o => o.value === form.activeName) ? form.activeName : 'tretinoin'}
              onChange={e => set('activeName', e.target.value)}
              style={{ fontSize: 12, padding: '5px 8px', border: 'none', borderRadius: T.radius.card, background: T.surfaceMuted, color: T.darkGreen }}
            >
              {MAIN_ACTIVE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          {(form.activeName === 'other' || !MAIN_ACTIVE_OPTIONS.find(o => o.value === form.activeName)) && (
            <div style={{ marginBottom: 8 }}>
              <FieldLabel htmlFor="rp-active-custom">Name it</FieldLabel>
              <TextInput id="rp-active-custom" value={MAIN_ACTIVE_OPTIONS.find(o => o.value === form.activeName) ? '' : form.activeName} onChange={e => set('activeName', e.target.value)} placeholder="e.g. clindamycin, azelaic" width={200} />
            </div>
          )}
          <div style={{ marginBottom: 8 }}>
            <FieldLabel htmlFor="rp-tret-start">When did you start?</FieldLabel>
            <DateInput id="rp-tret-start" value={form.tretStartDate} onChange={e => set('tretStartDate', e.target.value)} />
          </div>
          <FieldLabel>How often?</FieldLabel>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 6, marginBottom: 6 }}>
            {TRET_FREQUENCIES.map(f => (
              <button key={f.key} onClick={() => set('tretFrequency', f.key)} aria-pressed={form.tretFrequency === f.key} style={{ border: 'none', borderRadius: T.radius.card, padding: '8px 10px', cursor: 'pointer', background: form.tretFrequency === f.key ? T.green : T.surfaceMuted, textAlign: 'left' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.darkGreen }}>{f.label}</div>
                <div style={{ fontSize: 10, color: T.textLight }}>{f.description}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Other evening actives */}
      {form.tretEnabled && (
        <div style={{ fontSize: 11, color: T.textMuted, margin: '8px 0 6px', paddingLeft: 2 }}>
          <strong style={{ color: T.darkGreen }}>Active nights</strong> = nights you use your main evening treatment. <strong style={{ color: T.darkGreen }}>Off nights</strong> = the other evenings.
        </div>
      )}
      {AVAILABLE_SECONDARY_ACTIVES.map(def => {
        const sa = (form.secondaryActives || []).find(a => a.key === def.key) || { key: def.key, enabled: false, nights: def.defaultNights }
        const enabled = sa.enabled
        const showNightsOptions = form.tretEnabled
        const incompatWarning = enabled && showNightsOptions ? SECONDARY_INCOMPATIBILITIES[def.key]?.[sa.nights] : null
        return (
          <div key={def.key} style={{ marginBottom: 4, padding: '10px 12px', borderRadius: T.radius.card, background: enabled ? T.green : T.surfaceMuted }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
              <input type="checkbox" checked={enabled} onChange={e => {
                const base = form.secondaryActives || AVAILABLE_SECONDARY_ACTIVES.map(a => ({ key: a.key, enabled: false, nights: a.defaultNights }))
                set('secondaryActives', base.map(a => a.key === def.key ? { ...a, enabled: e.target.checked } : a))
              }} style={{ width: 14, height: 14, marginTop: 2, cursor: 'pointer', accentColor: T.darkGreen }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: T.darkGreen }}>{def.label}</div>
                {enabled && showNightsOptions && (
                  <div style={{ marginTop: 6 }}>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      {NIGHTS_OPTIONS.map(n => {
                        const isIncompat = !!SECONDARY_INCOMPATIBILITIES[def.key]?.[n.key]
                        return (
                          <button key={n.key} onClick={e => {
                            e.preventDefault()
                            const base = form.secondaryActives || []
                            set('secondaryActives', base.map(a => a.key === def.key ? { ...a, nights: n.key } : a))
                          }} style={{ fontSize: 10, padding: '2px 8px', borderRadius: T.radius.pill, cursor: 'pointer', border: 'none', background: sa.nights === n.key ? T.white : 'transparent', fontWeight: sa.nights === n.key ? 600 : 400, color: isIncompat ? '#92400E' : (sa.nights === n.key ? T.darkGreen : T.textLight), whiteSpace: 'nowrap' }}>
                            {n.label}{isIncompat ? ' ⚠' : ''}
                          </button>
                        )
                      })}
                    </div>
                    {incompatWarning && (
                      <div style={{ fontSize: 10, color: '#92400E', background: '#FFFBEB', borderRadius: T.radius.card, padding: '5px 8px', marginTop: 5, lineHeight: 1.5 }}>
                        ⚠ {incompatWarning}
                      </div>
                    )}
                  </div>
                )}
                {enabled && !showNightsOptions && (
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 6, justifyContent: 'flex-end' }}>
                    {EVENING_FREQ_SIMPLE.map(n => (
                      <button key={n.key} onClick={e => {
                        e.preventDefault()
                        const base = form.secondaryActives || []
                        set('secondaryActives', base.map(a => a.key === def.key ? { ...a, nights: n.key } : a))
                      }} style={{ fontSize: 10, padding: '2px 8px', borderRadius: T.radius.pill, cursor: 'pointer', border: 'none', background: sa.nights === n.key ? T.white : 'transparent', fontWeight: sa.nights === n.key ? 600 : 400, color: sa.nights === n.key ? T.darkGreen : T.textLight, whiteSpace: 'nowrap' }}>
                        {n.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </label>
          </div>
        )
      })}



      <SectionLabel style={{ borderTop: 'none' }}>Product assignments (optional)</SectionLabel>
      <div style={{ marginBottom: 8 }}>
        <Btn onClick={() => setShowProducts(s => !s)} style={{ fontSize: 11, padding: '4px 10px', marginBottom: 8 }}>{showProducts ? 'Hide products' : 'Assign products to steps'}</Btn>
        {showProducts && (
          <div>
            <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 8 }}>Assign products to each routine step. Unassigned steps will be faded in the day flyout.</div>
            {/* Product assignment split by routine section.
                If `form.steps` was carried over from an existing routine
                (e.g. a graduated program baseline via `initial`), use it so
                added steps like Toner/Eye Cream/Vitamin C show up here too.
                Otherwise fall back to the generic defaults. */}
            {[
              { section: 'Morning', steps: (form.steps?.am?.length ? form.steps.am : getDefaultSteps('am')) },
              { section: form.activeName ? `Active nights (${form.activeName})` : 'Active nights', steps: getDefaultSteps('main') },
              { section: 'Off nights', steps: [
                ...(form.steps?.off?.length ? form.steps.off : getDefaultSteps('off')),
                ...(form.secondaryActives||[]).filter(sa => sa.enabled && (sa.nights==='off'||sa.nights==='all')).map(sa => {
                  const d = AVAILABLE_SECONDARY_ACTIVES.find(a=>a.key===sa.key)
                  return d ? { id: 'off_' + d.stepKey, categoryKey: d.stepKey, label: d.label, optional: true, enabled: true } : null
                }).filter(Boolean),
              ]},
              { section: 'Recovery days', steps: getDefaultSteps('recovery') },
              { section: 'Pause nights', steps: getDefaultSteps('pause') },
            ].map(({ section, steps }) => (
              <div key={section}>
                <div style={{ fontSize: 10, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '10px 0 6px' }}>{section}</div>
                {steps.filter((s, i, arr) => arr.findIndex(x => (x.id||x.key) === (s.id||s.key)) === i).map(step => {
              const sid = step.id || step.key
              const pid = form.products?.[sid]
              const prod = pid ? products[pid] : null
              const isOpen = openStep === sid
              return (
                <div key={sid} style={{ marginBottom: 6 }}>
                  <div onClick={() => setOpenStep(isOpen ? null : sid)}
                    role="button" tabIndex={0} aria-expanded={isOpen}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpenStep(isOpen ? null : sid) } }}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: T.radius.card, border: 'none', cursor: 'pointer', background: isOpen ? T.green : T.surfaceMuted }}>
                    <div style={{ fontSize: 11, fontWeight: 500, color: T.darkGreen, flex: 1 }}>{step.label}</div>
                    {prod ? (
                      <span style={{ fontSize: 11, color: T.textMuted }}>{prod.name}</span>
                    ) : (
                      <span style={{ fontSize: 11, color: T.textLight, fontStyle: 'italic' }}>Unassigned</span>
                    )}
                    <span style={{ fontSize: 10, color: T.textLight }}>{isOpen ? '▲' : '▼'}</span>
                  </div>
                  {isOpen && (
                    addingProd ? (
                      <ProductForm
                        onSave={(p) => { onSaveProduct?.(p); setProductAssignment(step.key, p.id); setAddingProd(false) }}
                        onCancel={() => setAddingProd(false)}
                        userId={userId}
                        catalogProducts={catalogProducts}
                      />
                    ) : (
                      <ProductPicker
                        stepKey={sid}
                        categoryKey={step.categoryKey}
                        currentProductId={pid}
                        products={products}
                        onSelect={(id) => { setProductAssignment(sid, id); setOpenStep(null) }}
                        onAddNew={() => setAddingProd(true)}
                        onClose={() => setOpenStep(null)}
                      />
                    )
                  )}
                </div>
              )
            })}
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ paddingTop: 12, marginTop: 18, display: 'flex', gap: 8 }}>
        <Btn variant="primary" onClick={() => canSave && onSave(form)} disabled={!canSave}>
          {lockStartDate ? 'Save changes' : 'Save routine'}
        </Btn>
        <Btn onClick={onCancel}>Cancel</Btn>
      </div>
    </div>
  )
}

// ─── TREATMENT SELECTOR PANEL ────────────────────────────────
function TreatmentSelectorPanel({ selector, treatments, allTypes, customTypes, setCustomTypes, onApply, onRemove, onClose, routineHistory, showerHistory, products }) {
  const [confirmDialog, confirm] = useConfirm()
  const existingEntries = treatments[selector.key] || []
  // When editingDbId is set, we're editing a specific entry; otherwise adding new
  const editingEntry = selector.editingDbId ? existingEntries.find(e => e._dbId === selector.editingDbId) : null
  const existing = editingEntry // alias for legacy compat
  const [selType,     setSelType]     = useState(existing?.type       || null)
  const [timeOfDay,   setTimeOfDay]   = useState(existing?.timeOfDay  || 'am')
  const [treatArea,   setTreatArea]   = useState(existing?.area || (existing?.type && allTypes[existing?.type]?.area) || 'face')
  const [customPre,   setCustomPre]   = useState(existing?.pre  ?? (existing?.type ? (allTypes[existing.type]?.pre ?? 0) : 0))
  const [customPost,  setCustomPost]  = useState(existing?.post ?? (existing?.type ? (allTypes[existing.type]?.post ?? 0) : 0))
  const [newName, setNewName] = useState('')
  const [newPre,  setNewPre]  = useState(3)
  const [newPost, setNewPost] = useState(3)
  const [dateKey, setDateKey] = useState(selector.key) // editable date

  function addCustomType() {
    if (!newName.trim()) return
    const key = 'custom-' + newName.toLowerCase().replace(/\s+/g, '-')
    setCustomTypes(ct => ({ ...ct, [key]: { label: newName.trim(), pre: newPre, post: newPost, pca: false } }))
    setNewName(''); setNewPre(3); setNewPost(3)
  }

  // Compute conflicts and ingredient needs whenever a type or date is selected
  const conflicts = selType
    ? detectTreatmentConflicts(dateKey, selType, allTypes, treatments, routineHistory || [])
    : []

  const ingredientConflicts = (() => {
    if (!selType) return null
    const cfg = allTypes[selType]
    if (!cfg) return null
    const dateObj = new Date(dateKey + 'T00:00:00')
    const activePeriod = getActivePeriod(dateObj, routineHistory || [])
    const routineFlags = getActiveRoutineFlags(activePeriod, showerHistory || [], dateObj, products || {})
    const area = treatArea || cfg.area || 'face'
    const preConflicts  = getRoutineConflicts(cfg.avoidPre  || [], routineFlags, area)
    const postConflicts = getRoutineConflicts(cfg.avoidPost || [], routineFlags, area)
    if (!preConflicts.length && !postConflicts.length) return null
    return {
      pre:      preConflicts,
      post:     postConflicts,
      preDays:  cfg.pre,
      postDays: cfg.post,
      preNote:  cfg.avoidPreNote  || '',
      postNote: cfg.avoidPostNote || '',
    }
  })()

  const safeDate = conflicts.length > 0
    ? findSafeDate(dateKey, selType, allTypes, treatments, routineHistory || [])
    : null

  const hasAnyConflict = conflicts.length > 0 || !!ingredientConflicts

  return (
    <div style={{ background: T.white, border: `0.5px solid ${T.hairline}`, borderRadius: 0, padding: '16px 18px', marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.text, flexShrink: 0 }}>
          {editingEntry ? 'Edit treatment' : existingEntries.length > 0 ? 'Add another treatment' : 'Add treatment'}
        </div>
        <input
          type="date"
          value={dateKey}
          onChange={e => setDateKey(e.target.value)}
          style={{ fontSize: 12, padding: '4px 6px', border: 'none', borderBottom: `1px solid ${T.hairline}`, borderRadius: 0, background: 'transparent', color: T.text, fontFamily: 'inherit', outline: 'none', cursor: 'pointer' }}
        />
      </div>

      {/* Disclaimer */}
      <div style={{ fontSize: 11, color: T.textMuted, lineHeight: 1.7, padding: '8px 10px', background: T.surfaceMuted, border: `0.5px solid ${T.hairline}`, marginBottom: 12 }}>
        ⚠️ Treatments pause active ingredients (retinoids, exfoliants, vitamin C) during pre-treatment and recovery windows. If you're on a program, your timer pauses too and resumes where it left off. Always consult your dermatologist before scheduling a treatment.
      </div>

      {/* Existing treatments on this day */}
      {existingEntries.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>
            Already logged this day
          </div>
          {existingEntries.map(e => (
            <div key={e._dbId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '6px 0', borderTop: `0.5px solid ${T.hairline}` }}>
              <div style={{ fontSize: 12, color: T.text }}>
                {allTypes[e.type]?.label || e.type}
                <span style={{ color: T.textMuted, marginLeft: 6 }}>{e.area} · {e.timeOfDay === 'am' ? 'Morning (AM)' : 'Evening (PM)'}</span>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => onRemove(e._dbId)}
                  aria-label={`Remove ${allTypes[e.type]?.label || e.type}`}
                  style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: T.textLight, fontSize: 16, padding: '0 4px', lineHeight: 1 }}>×</button>
              </div>
            </div>
          ))}
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 6, marginBottom: 12 }}>
        {Object.entries(allTypes).map(([k, v]) => (
          <button key={k} onClick={() => { setSelType(k); setTreatArea(v.area || 'face'); setCustomPre(v.pre ?? 0); setCustomPost(v.post ?? 0) }} aria-pressed={selType === k} style={{ border: `0.5px solid ${selType === k ? T.pinkDeep : T.hairline}`, borderRadius: 0, padding: '8px 10px', cursor: 'pointer', background: selType === k ? T.pink : T.white, textAlign: 'left' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{v.label}</div>
            <div style={{ fontSize: 10, color: T.textLight }}>Pause exfoliants & retinoids {v.pre} days before</div>
            <div style={{ fontSize: 10, color: T.textLight }}>Recovery for {v.post} days after</div>
          </button>
        ))}
      </div>

      {/* Conflict block — scheduling + ingredient conflicts */}
      {(conflicts.length > 0 || ingredientConflicts) && (
        <TreatmentConflictBlock
          conflicts={conflicts}
          ingredientConflicts={ingredientConflicts}
          safeDate={safeDate}
          treatmentLabel={allTypes[selType]?.label || selType}
        />
      )}

      <div style={{ marginBottom: 10 }}>
        <FieldLabel>Time of day</FieldLabel>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setTimeOfDay('am')} aria-pressed={timeOfDay === 'am'} style={{ padding: '5px 16px', borderRadius: 0, border: `0.5px solid ${timeOfDay === 'am' ? T.pinkDeep : T.hairline}`, background: timeOfDay === 'am' ? T.pink : 'transparent', fontSize: 12, fontWeight: timeOfDay === 'am' ? 500 : 400, cursor: 'pointer', color: T.text }}>Morning (AM)</button>
          <button onClick={() => setTimeOfDay('pm')} aria-pressed={timeOfDay === 'pm'} style={{ padding: '5px 16px', borderRadius: 0, border: `0.5px solid ${timeOfDay === 'pm' ? T.pinkDeep : T.hairline}`, background: timeOfDay === 'pm' ? T.pink : 'transparent', fontSize: 12, fontWeight: timeOfDay === 'pm' ? 500 : 400, cursor: 'pointer', color: T.text }}>Evening (PM)</button>
        </div>
      </div>
      <div style={{ marginBottom: 10 }}>
        <FieldLabel>Treatment area</FieldLabel>
        <div style={{ display: 'flex', gap: 6 }}>
          {[{key:'face',label:'Face'},{key:'body',label:'Body'},{key:'both',label:'Both'}].map(a => (
            <button key={a.key} onClick={() => setTreatArea(a.key)} aria-pressed={treatArea === a.key} style={{ padding: '5px 14px', borderRadius: 0, border: `0.5px solid ${treatArea === a.key ? T.pinkDeep : T.hairline}`, background: treatArea === a.key ? T.pink : 'transparent', fontSize: 12, fontWeight: treatArea === a.key ? 500 : 400, cursor: 'pointer', color: T.text }}>{a.label}</button>
          ))}
        </div>
        <div style={{ fontSize: 10, color: T.textLight, marginTop: 4 }}>
          Body products (BP wash, body salicylic) only conflict with body treatments.
        </div>
      </div>
      {selType && (
        <div style={{ marginBottom: 10, padding: '10px 12px', background: T.surfaceMuted, borderRadius: 0, border: `0.5px solid ${T.hairline}` }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: T.text, marginBottom: 8 }}>Pause and recovery window</div>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <div>
              <FieldLabel htmlFor="tw-pre">Days before — pause exfoliants & retinoids</FieldLabel>
              <div style={{ fontSize: 10, color: T.textLight, marginBottom: 4 }}>How many days before this treatment should you stop using actives (retinoids, acids, etc.)?</div>
              <NumberInput id="tw-pre" value={customPre} onChange={e => setCustomPre(+e.target.value)} min={0} max={30} width={70} />
            </div>
            <div>
              <FieldLabel htmlFor="tw-post">Days after — recovery period</FieldLabel>
              <div style={{ fontSize: 10, color: T.textLight, marginBottom: 4 }}>How many days of recovery before resuming your normal routine?</div>
              <NumberInput id="tw-post" value={customPost} onChange={e => setCustomPost(+e.target.value)} min={0} max={30} width={70} />
            </div>
          </div>
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', borderTop: `0.5px solid ${T.hairline}`, paddingTop: 10, marginTop: 4 }}>
        <Btn variant="primary" onClick={() => { if (selType && conflicts.length === 0) onApply(selType, false, timeOfDay, treatArea, customPre, customPost, dateKey) }} disabled={!selType || conflicts.length > 0}>Save</Btn>
        {conflicts.length > 0 && safeDate && <div style={{ fontSize: 11, color: '#166534', padding: '4px 0' }}>Move to {new Date(safeDate + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} to save.</div>}
        <Btn onClick={onClose}>Cancel</Btn>
        {editingEntry && <Btn variant="danger" onClick={async () => { if (await confirm({ title: 'Remove this treatment?', message: 'This cannot be undone.' })) onRemove(editingEntry._dbId) }}>Remove treatment</Btn>}
      </div>
      <SectionLabel>Add a new treatment type</SectionLabel>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div><FieldLabel htmlFor="tt-name">Name</FieldLabel><TextInput id="tt-name" value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. LED therapy" /></div>
        <div><FieldLabel htmlFor="tt-pre">Days before — pause exfoliants & retinoids</FieldLabel><NumberInput id="tt-pre" value={newPre} onChange={e => setNewPre(+e.target.value)} /></div>
        <div><FieldLabel htmlFor="tt-post">Days after — recovery period</FieldLabel><NumberInput id="tt-post" value={newPost} onChange={e => setNewPost(+e.target.value)} /></div>
        <Btn variant="secondary" onClick={addCustomType}>Add</Btn>
      </div>
      {confirmDialog}
    </div>
  )
}




// Grouped presets for the Extras editor — pre-fills the label field
const EXTRAS_PRESETS = [
  {
    group: 'Growth & serums',
    items: ['Brow serum', 'Lash serum', 'Scalp serum', 'Hair growth oil (castor oil, rosemary, etc.)'],
  },
  {
    group: 'Eye & lip',
    items: ['Under-eye patches', 'Eye mask', 'Lip mask / overnight treatment', 'Lip balm (SPF)'],
  },
  {
    group: 'Skin tools',
    items: ['Face massage', 'Gua sha', 'Face roller', 'LED device', 'Microcurrent device'],
  },
  {
    group: 'Body',
    items: ['Body oil', 'Body AHA/BHA treatment (leave-on)', 'Stretch mark treatment', 'Nail treatment'],
  },
  {
    group: 'Wellness',
    items: ['Supplements (collagen, biotin, zinc, etc.)'],
  },
]

// ─── EXTRAS ─────────────────────────────────────────────────
// Generates a unique id for new daily items
function uid() { return crypto.randomUUID() }

// Active daily period helper — same pattern as getActivePeriod
export function getActiveDailyPeriod(dt, history) {
  const key = dateKey(dt)
  const sorted = [...history].sort((a, b) => a.startDate.localeCompare(b.startDate))
  let active = null
  for (const p of sorted) {
    if (p.startDate <= key && (!p.endDate || p.endDate >= key)) active = p
  }
  return active
}

const TIME_OF_DAY_OPTIONS = [
  { key: 'both', label: 'AM + PM' },
  { key: 'am',   label: 'AM only' },
  { key: 'pm',   label: 'PM only' },
]

// DraggableItem — single draggable row with long-press-to-drag on mobile
// Supports optional frequency, weekStartDay, timeOfDay props for Extras
function DraggableItem({ item, index, total, onRemove, isDragging, onDragStart, onDragEnter, onDragEnd, onLongPress, onFreqChange, onWeekStartChange, onTimeChange, freqOptions, onNoteChange }) {
  const ref = useRef(null)
  const longPressTimer = useRef(null)
  const [pressing, setPressing] = useState(false)

  function handleTouchStart(e) {
    setPressing(true)
    longPressTimer.current = setTimeout(() => { setPressing(false); onLongPress(index) }, 500)
  }
  function handleTouchEnd() { setPressing(false); clearTimeout(longPressTimer.current) }

  return (
    <div
      ref={ref}
      draggable
      onDragStart={() => onDragStart(index)}
      onDragEnter={() => onDragEnter(index)}
      onDragEnd={onDragEnd}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 8,
        padding: '7px 8px', marginBottom: 3, borderRadius: 0,
        border: `0.5px solid ${isDragging ? T.pinkDeep : T.hairline}`,
        background: isDragging ? T.pink : pressing ? T.surfaceMuted : T.white,
        cursor: isDragging ? 'grabbing' : 'grab',
        transition: 'background 0.1s, border-color 0.1s',
        opacity: isDragging ? 0.6 : 1, userSelect: 'none',
      }}
    >
      <div style={{ fontSize: 14, color: T.textLight, flexShrink: 0, cursor: 'grab', paddingTop: 1 }}>⠿</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: T.text, marginBottom: 1 }}>{item.label}</div>
        {onNoteChange ? (
          <input
            type="text"
            value={item.note || ''}
            onChange={e => onNoteChange(index, e.target.value)}
            placeholder="Add a note..."
            onClick={e => e.stopPropagation()}
            style={{ fontSize: 11, color: T.textMuted, background: 'transparent', border: 'none', borderBottom: `0.5px solid ${T.hairline}`, outline: 'none', width: '100%', padding: '1px 0', marginBottom: 2, cursor: 'text' }}
          />
        ) : (
          item.note && <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 2 }}>{item.note}</div>
        )}
        {item.productName && <div style={{ fontSize: 10, color: T.textLight, marginBottom: 3 }}>↗ {item.productName}</div>}
        {/* Frequency picker — only shown when onFreqChange provided */}
        {onFreqChange && (
          <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginBottom: 2 }}>
            {(freqOptions || SHOWER_FREQUENCIES).map(f => (
              <button key={f.key} onClick={e => { e.stopPropagation(); onFreqChange(index, f.key) }}
                aria-pressed={(item.frequency||'daily') === f.key}
                style={{ fontSize: 9, padding: '1px 5px', borderRadius: 0, cursor: 'pointer', border: `0.5px solid ${(item.frequency||'daily') === f.key ? T.pinkDeep : T.hairline}`, background: (item.frequency||'daily') === f.key ? T.pink : 'transparent', color: (item.frequency||'daily') === f.key ? T.text : T.textLight, whiteSpace: 'nowrap' }}>
                {f.label}
              </button>
            ))}
          </div>
        )}
        {/* Cycle start day — only for non-daily/alternate frequencies */}
        {onWeekStartChange && item.frequency && item.frequency !== 'daily' && (
          <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'center', marginBottom: 2 }}>
            <span style={{ fontSize: 9, color: T.textLight }}>cycle starts:</span>
            {DAYS.map((d, i) => (
              <button key={i} onClick={e => { e.stopPropagation(); onWeekStartChange(index, i) }}
                aria-pressed={(item.weekStartDay ?? 1) === i}
                style={{ fontSize: 9, padding: '1px 4px', borderRadius: 0, cursor: 'pointer', border: `0.5px solid ${(item.weekStartDay ?? 1) === i ? T.orange : T.hairline}`, background: (item.weekStartDay ?? 1) === i ? T.orangeLight : 'transparent', color: (item.weekStartDay ?? 1) === i ? '#9A3412' : T.textLight }}>
                {d}
              </button>
            ))}
          </div>
        )}
        {/* AM/PM toggle */}
        {onTimeChange && (
          <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            {TIME_OF_DAY_OPTIONS.map(t => (
              <button key={t.key} onClick={e => { e.stopPropagation(); onTimeChange(index, t.key) }}
                aria-pressed={(item.timeOfDay||'both') === t.key}
                style={{ fontSize: 9, padding: '1px 5px', borderRadius: 0, cursor: 'pointer', border: `0.5px solid ${(item.timeOfDay||'both') === t.key ? T.pinkDeep : T.hairline}`, background: (item.timeOfDay||'both') === t.key ? T.pink : 'transparent', color: (item.timeOfDay||'both') === t.key ? T.text : T.textLight }}>
                {t.label}
              </button>
            ))}
          </div>
        )}
      </div>
      <button onClick={() => onRemove(index)}
        style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: T.textLight, fontSize: 14, padding: '0 2px', flexShrink: 0, paddingTop: 1 }}
        aria-label={`Remove ${item.label}`}>×</button>
    </div>
  )
}

// DailyEditor — add/remove/reorder extras items, set start/end date
export function DailyEditor({ initial, onSave, onCancel, lockStartDate = false, allPeriods = [], onEditConflict, products = {}, onSaveProduct, userId }) {
  const catalogProducts = Object.fromEntries(Object.entries(products).filter(([, p]) => p._isCatalog))
  const [startDate,    setStartDate]    = useState(initial?.startDate    || '')
  const [endDate,      setEndDate]      = useState(initial?.endDate      || '')
  const [items, setItems] = useState(initial?.items || [])
  const [newLabel,       setNewLabel]       = useState('')
  const [newNote,        setNewNote]        = useState('')
  const [newFreq,        setNewFreq]        = useState('daily')
  const [newTimeOfDay,   setNewTimeOfDay]   = useState('both')
  const [presetSearch,   setPresetSearch]   = useState('')
  const [showPresets,    setShowPresets]    = useState(false)
  const [dragFrom,  setDragFrom]  = useState(null)
  const [dragOver,  setDragOver]  = useState(null)

  const conflict = null // end dates are set automatically on save

  function addItem() {
    if (!newLabel.trim()) return
    setItems(it => [...it, { id: uid(), label: newLabel.trim(), note: newNote.trim(), frequency: newFreq, weekStartDay: 1, timeOfDay: newTimeOfDay }])
    setNewLabel(''); setNewNote('')
  }

  function removeItem(i) { setItems(it => it.filter((_, idx) => idx !== i)) }

  function handleDragStart(i) { setDragFrom(i) }
  function handleDragEnter(i) { setDragOver(i) }
  function handleDragEnd() {
    if (dragFrom !== null && dragOver !== null && dragFrom !== dragOver) {
      setItems(it => {
        const next = [...it]
        const [moved] = next.splice(dragFrom, 1)
        next.splice(dragOver, 0, moved)
        return next
      })
    }
    setDragFrom(null); setDragOver(null)
  }

  function handleLongPress(i) { setDragFrom(i) }
  function handleFreqChange(i, freq) { setItems(it => it.map((x, idx) => idx === i ? { ...x, frequency: freq } : x)) }
  function handleWeekStartChange(i, day) { setItems(it => it.map((x, idx) => idx === i ? { ...x, weekStartDay: day } : x)) }
  function handleTimeChange(i, tod) { setItems(it => it.map((x, idx) => idx === i ? { ...x, timeOfDay: tod } : x)) }
  function handleNoteChange(i, note) { setItems(it => it.map((x, idx) => idx === i ? { ...x, note } : x)) }

  function handleSave() {
    if (!startDate || conflict || items.length === 0) return
    onSave({ startDate, endDate: endDate || null, items, id: initial?.id || uid(), createdAt: initial?.createdAt })
  }

  return (
    <div style={{ background: T.white, border: `0.5px solid ${T.hairline}`, borderRadius: 0, padding: '14px 16px', marginBottom: 10 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 4 }}>
        {initial?.id ? `Extras — editing from ${fmtDate(initial?.startDate)}` : 'Extras'}
      </div>
      <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 10, lineHeight: 1.6, background: T.surfaceMuted, borderRadius: 0, padding: '8px 12px' }}>
        The little things that make a big difference — growth serums, eye patches, leave-on body treatments, tools, supplements, and more.
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
        <div>
          <FieldLabel htmlFor="daily-start">Start date</FieldLabel>
          <DateInput id="daily-start" value={startDate} onChange={e => setStartDate(e.target.value)} />
        </div>
        <div>
          <FieldLabel htmlFor="daily-end">End date (leave blank if still active)</FieldLabel>
          <DateInput id="daily-end" value={endDate} onChange={e => setEndDate(e.target.value)} />
        </div>
      </div>

      {conflict && <ConflictMessage conflict={conflict} onEditConflict={onEditConflict} />}

      {/* Item list */}
      <div style={{ marginBottom: 10 }}>
        <FieldLabel>Items — long press on mobile to drag and reorder</FieldLabel>
        {items.length === 0 && (
          <div style={{ fontSize: 12, color: T.textLight, fontStyle: 'italic', padding: '6px 0' }}>No items yet — add one below</div>
        )}
        {items.map((item, i) => (
          <div key={item.id}>
            <DraggableItem
              item={item}
              index={i}
              total={items.length}
              onRemove={removeItem}
              isDragging={dragFrom === i}
              onDragStart={handleDragStart}
              onDragEnter={handleDragEnter}
              onDragEnd={handleDragEnd}
              onLongPress={handleLongPress}
              onFreqChange={handleFreqChange}
              onWeekStartChange={handleWeekStartChange}
              onTimeChange={handleTimeChange}
              onNoteChange={handleNoteChange}
              freqOptions={EXTRAS_FREQUENCIES}
            />
            {/* Product slot — tappable row matching skincare pattern */}
            {(() => {
              const prod = item.productId ? products[item.productId] : null
              const isOpen = !!item._pickingProduct
              return (
                <div style={{ marginLeft: 8, marginBottom: 4 }}>
                  <div
                    onClick={() => setItems(it => it.map((x,idx) => idx===i ? {...x,_pickingProduct:!x._pickingProduct} : x))}
                    role="button" tabIndex={0} aria-expanded={isOpen}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setItems(it => it.map((x,idx) => idx===i ? {...x,_pickingProduct:!x._pickingProduct} : x)) } }}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 0, cursor: 'pointer', background: isOpen ? T.pink : 'transparent', border: `0.5px solid ${isOpen ? T.pinkDeep : T.hairline}`, marginBottom: isOpen ? 4 : 0 }}
                  >
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: T.pinkDeep, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {prod ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {prod.imageUrl && <img src={prod.imageUrl} alt="" style={{ width: 44, height: 44, borderRadius: T.radius.card, objectFit: 'cover', flexShrink: 0 }} onError={e => e.target.style.display='none'} />}
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 11, fontWeight: 500, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{prod.name}</div>
                            {prod.brand && <div style={{ fontSize: 10, color: T.textMuted }}>{prod.brand}</div>}
                            {prod.effectiveness > 0 && <StarRating value={prod.effectiveness} size={9} />}
                          </div>
                        </div>
                      ) : (
                        <span style={{ fontSize: 11, color: T.textLight, fontStyle: 'italic' }}>Tap to assign product</span>
                      )}
                    </div>
                    {prod && <button onClick={e => { e.stopPropagation(); setItems(it => it.map((x,idx) => idx===i ? {...x,productId:null} : x)) }} aria-label="Remove assigned product" style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: T.textLight, fontSize: 13, padding: '0 2px', lineHeight: 1 }}>×</button>}
                    <span style={{ fontSize: 10, color: T.textLight, flexShrink: 0 }}>{isOpen ? '▲' : '▼'}</span>
                  </div>
                  {isOpen && (
                    <ProductPicker
                      stepKey="other"
                      currentProductId={item.productId}
                      products={products}
                      onSelect={(pid) => setItems(it => it.map((x,idx) => idx===i ? {...x,productId:pid,_pickingProduct:false} : x))}
                      onAddNew={() => setItems(it => it.map((x,idx) => idx===i ? {...x,_addingProduct:true,_pickingProduct:false} : x))}
                      onClose={() => setItems(it => it.map((x,idx) => idx===i ? {...x,_pickingProduct:false} : x))}
                    />
                  )}
                  {item._addingProduct && (
                    <ProductForm
                      onSave={(p) => { onSaveProduct?.(p); setItems(it => it.map((x,idx) => idx===i ? {...x,productId:p.id,_addingProduct:false} : x)) }}
                      onCancel={() => setItems(it => it.map((x,idx) => idx===i ? {...x,_addingProduct:false} : x))}
                      userId={userId}
                      catalogProducts={catalogProducts}
                    />
                  )}
                </div>
              )
            })()}
          </div>
        ))}
      </div>

      {/* Add new item */}
      <div style={{ borderTop: `0.5px solid ${T.hairline}`, paddingTop: 10 }}>
        {/* Preset picker */}
        <div style={{ marginBottom: 8 }}>
          <button
            onClick={() => setShowPresets(s => !s)}
            style={{ fontSize: 11, color: T.pinkDeep, border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, marginBottom: showPresets ? 6 : 0 }}
          >
            {showPresets ? '▲ Hide suggestions' : '▼ Browse suggestions'}
          </button>
          {showPresets && (
            <div style={{ border: `0.5px solid ${T.hairline}`, borderRadius: 0, overflow: 'hidden', marginBottom: 8 }}>
              <input
                type="text"
                value={presetSearch}
                onChange={e => setPresetSearch(e.target.value)}
                placeholder="Search suggestions..."
                style={{ width: '100%', fontSize: 12, padding: '7px 10px', border: 'none', borderBottom: `0.5px solid ${T.hairline}`, background: T.white, color: T.text, boxSizing: 'border-box' }}
              />
              <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                {EXTRAS_PRESETS.map(group => {
                  const filtered = group.items.filter(item =>
                    !presetSearch || item.toLowerCase().includes(presetSearch.toLowerCase())
                  )
                  if (!filtered.length) return null
                  return (
                    <div key={group.group}>
                      <div style={{ fontSize: 10, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '6px 10px 3px', background: T.surfaceMuted }}>{group.group}</div>
                      {filtered.map(item => (
                        <div
                          key={item}
                          onClick={() => { setNewLabel(item); setShowPresets(false); setPresetSearch('') }}
                          style={{ fontSize: 12, padding: '6px 10px', cursor: 'pointer', color: T.text, borderBottom: `0.5px solid ${T.hairline}` }}
                          onMouseEnter={e => e.currentTarget.style.background = T.pink}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          {item}
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div><FieldLabel htmlFor="daily-item">Item</FieldLabel><TextInput id="daily-item" value={newLabel} onChange={e => setNewLabel(e.target.value)} placeholder="e.g. Minoxidil" width={110} /></div>
        <div><FieldLabel htmlFor="daily-note">Note</FieldLabel><TextInput id="daily-note" value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="optional" width={90} /></div>
        <div>
          <FieldLabel htmlFor="daily-freq">How often</FieldLabel>
          <select id="daily-freq" value={newFreq} onChange={e => setNewFreq(e.target.value)} style={{ fontSize: 12, padding: '5px 8px', border: `0.5px solid ${T.hairline}`, borderRadius: 0, background: T.white, color: T.text }}>
            {EXTRAS_FREQUENCIES.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
          </select>
        </div>
        <div>
          <FieldLabel>When</FieldLabel>
          <div style={{ display: 'flex', gap: 4 }}>
            {TIME_OF_DAY_OPTIONS.map(t => (
              <button key={t.key} onClick={() => setNewTimeOfDay(t.key)} aria-pressed={newTimeOfDay === t.key} style={{ fontSize: 10, padding: '5px 8px', borderRadius: 0, cursor: 'pointer', border: `0.5px solid ${newTimeOfDay === t.key ? T.pinkDeep : T.hairline}`, background: newTimeOfDay === t.key ? T.pink : 'transparent', color: newTimeOfDay === t.key ? T.text : T.textLight }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <Btn variant="secondary" onClick={addItem}>Add</Btn>
        </div>{/* end flex row */}
      </div>{/* end add item section */}

      <div style={{ borderTop: `0.5px solid ${T.hairline}`, paddingTop: 10, marginTop: 10, display: 'flex', gap: 8 }}>
        <Btn variant="primary" onClick={handleSave} disabled={!startDate || !!conflict || items.length === 0}>Save</Btn>
        <Btn onClick={onCancel}>Cancel</Btn>
      </div>
    </div>
  )
}

// DailySection (Extras) — renders extras active today, filtered by frequency + AM/PM tab
// Returns null when nothing is scheduled for that day+tab — no empty section shown
function DailySection({ dt, dailyHistory, onEditDaily, tab, products, onUpdateDailyItemProduct, accentColor }) {
  const period = getActiveDailyPeriod(dt, dailyHistory)
  const allItems = period?.items || []
  const [openItemId, setOpenItemId] = useState(null)

  // Filter: frequency match AND timeOfDay match for current tab
  const activeItems = allItems.filter(item => {
    const freqMatch = isShowerItemActive(dt, item, period?.startDate)
    const tod = item.timeOfDay || 'both'
    const tabMatch = !tab || tod === 'both' || tod === tab
    return freqMatch && tabMatch
  })

  // Always show the header — only hide items section when nothing matches today's tab
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Extras</div>
        <button onClick={onEditDaily} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 11, color: T.textLight, padding: '0 2px' }} aria-label="Edit extras">Edit</button>
      </div>
      {activeItems.length === 0 && (
        <div style={{ fontSize: 11, color: T.textMuted, fontStyle: 'italic', paddingBottom: 4 }}>
          {allItems.length === 0 ? 'No extras added — tap Edit to set up.' : 'No extras scheduled for today.'}
        </div>
      )}
      {activeItems.map(item => {
        const prod = item.productId ? products?.[item.productId] : null
        const isOpen = openItemId === item.id
        return (
          <div key={item.id} style={{ borderBottom: `0.5px solid ${T.hairline}`, paddingBottom: 6, marginBottom: 6 }}>
            {/* Item header row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: T.text, flex: 1 }}>{item.label}</div>
              {item.note && <div style={{ fontSize: 11, color: T.textMuted }}>{item.note}</div>}
            </div>
            {/* Product slot — matches skincare renderSteps pattern */}
            <div
              onClick={() => setOpenItemId(isOpen ? null : item.id)}
              role="button" tabIndex={0} aria-expanded={isOpen}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpenItemId(isOpen ? null : item.id) } }}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: `0.5px solid ${T.hairline}`, cursor: 'pointer', opacity: prod ? 1 : 0.45 }}
            >
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: T.pinkDeep, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                {prod ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    {prod.imageUrl && <img src={prod.imageUrl} alt="" style={{ width: 44, height: 44, borderRadius: T.radius.card, objectFit: 'cover', flexShrink: 0 }} onError={e => e.target.style.display='none'} />}
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 11, fontWeight: 500, color: T.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{prod.name}</div>
                      {prod.brand && <div style={{ fontSize: 10, color: T.textLight }}>{prod.brand}</div>}
                      {prod.effectiveness > 0 && <StarRating value={prod.effectiveness} size={9} />}
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: 11, color: T.textLight, fontStyle: 'italic' }}>Tap to assign product</div>
                )}
              </div>
              <div style={{ fontSize: 10, color: T.textLight, flexShrink: 0 }}>{isOpen ? '▲' : '▼'}</div>
            </div>
            {isOpen && (
              <ProductPicker
                stepKey="extras"
                currentProductId={item.productId}
                products={products}
                onSelect={(pid) => { onUpdateDailyItemProduct?.(period.id, item.id, pid); setOpenItemId(null) }}
                onClose={() => setOpenItemId(null)}
                accentColor={accentColor}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}


// ProductPicker — shown when clicking a step in the flyout
// Lets user pick from existing products or add a new one
function ProductPicker({ stepKey, currentProductId, products, onSelect, onAddNew, onClose, categoryKey, accentColor = T.darkGreen }) {
  // Derive categoryKey from stepKey if not passed directly (e.g. 'main_cleanser' → 'cleanser')
  const derivedCategoryKey = categoryKey || (stepKey ? stepKey.replace(/^(am|main|off|recovery|pause|nr)_/, '') : null)
  const ingredientCat = derivedCategoryKey ? INGREDIENT_CATEGORIES[derivedCategoryKey] : null
  const [search, setSearch] = useState('')
  const [showAll, setShowAll] = useState(false)

  // Match by ingredient_category OR product category (old system fallback)
  const stepDef = derivedCategoryKey ? INGREDIENT_CATEGORIES[derivedCategoryKey] : null
  const catLabel = stepDef ? stepDef.label : null
  const filtered = Object.values(products).filter(p => {
    if (showAll) return !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.brand || '').toLowerCase().includes(search.toLowerCase())
    const matchIngredient = !stepDef || (
      (stepDef.ingredientCategories && stepDef.ingredientCategories.includes(p.ingredient_category)) ||
      (stepDef.productCategories && stepDef.productCategories.some(cat => (p.category || '').toLowerCase().includes(cat))) ||
      (!p.ingredient_category && !p.category)
    )
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.brand || '').toLowerCase().includes(search.toLowerCase())
    return matchIngredient && matchSearch
  })

  return (
    <div style={{ background: T.white, border: `0.5px solid ${T.hairline}`, borderRadius: 0, padding: '12px 14px', marginTop: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 500, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Select product</div>
        <button onClick={onClose} aria-label="Close product picker" style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 14, color: T.textLight }}>×</button>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
        <TextInput value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." width={140} />
        <Btn variant={showAll ? 'active' : 'default'} onClick={() => setShowAll(s => !s)} style={{ fontSize: 11, padding: '4px 8px' }}>All categories</Btn>
      </div>

      {catLabel && !showAll && (
        <div style={{ fontSize: 10, color: T.textMuted, marginBottom: 6, fontStyle: 'italic' }}>
          Showing {catLabel} products · <span role="button" tabIndex={0} style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setShowAll(true)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setShowAll(true) } }}>show all</span>
        </div>
      )}
      {filtered.length === 0 && (
        <div style={{ fontSize: 11, color: T.textLight, fontStyle: 'italic', marginBottom: 8 }}>
          {catLabel ? `No ${catLabel.toLowerCase()} products yet — add one in the product library, or tap show all` : 'No products added yet'}
        </div>
      )}

      <div style={{ maxHeight: 180, overflowY: 'auto', marginBottom: 8 }}>
        {currentProductId && (
          <div
            onClick={() => onSelect(null)}
            role="button" tabIndex={0}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(null) } }}
            style={{ padding: '6px 8px', borderRadius: 0, fontSize: 12, cursor: 'pointer', color: T.treatment.text, marginBottom: 3, background: T.treatment.bg }}
          >
            Remove assignment
          </div>
        )}
        {filtered.map(p => {
          const isSelected = p.id === currentProductId
          return (
          <div
            key={p.id}
            onClick={() => onSelect(p.id)}
            role="button" tabIndex={0} aria-label={p.name}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(p.id) } }}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '6px 8px', borderRadius: 0, fontSize: 12, cursor: 'pointer', marginBottom: 2,
              background: isSelected ? accentColor : 'transparent',
              border: `0.5px solid ${isSelected ? accentColor : 'transparent'}`,
            }}
          >
            {/* Thumbnail */}
            {p.imageUrl ? (
              <img src={p.imageUrl} alt="" style={{ width: 32, height: 32, borderRadius: T.radius.card, objectFit: 'cover', flexShrink: 0 }} onError={e => e.target.style.display='none'} />
            ) : (
              <div style={{ width: 32, height: 32, borderRadius: T.radius.card, background: isSelected ? 'rgba(255,255,255,0.25)' : T.surfaceMuted, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: isSelected ? T.white : T.textLight }}>◻</div>
            )}
            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 500, color: isSelected ? T.white : T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 1 }}>
                {p.brand && <span style={{ fontSize: 10, color: isSelected ? 'rgba(255,255,255,0.75)' : T.textMuted }}>{p.brand}</span>}
                {p.brand && p.category && <span style={{ fontSize: 10, color: isSelected ? 'rgba(255,255,255,0.6)' : T.textLight }}>·</span>}
                {p.category && <span style={{ fontSize: 10, color: isSelected ? 'rgba(255,255,255,0.6)' : T.textLight }}>{p.category}</span>}
              </div>
              {p.effectiveness > 0 && <StarRating value={p.effectiveness} size={9} />}
            </div>
          </div>
          )
        })}
      </div>

      <Btn variant="secondary" onClick={onAddNew} style={{ width: '100%', textAlign: 'center', fontSize: 11 }}>
        + Add new product
      </Btn>
    </div>
  )
}

// ProductLibrary — browse all products




// Grouped presets for the Shower routine editor
const SHOWER_PRESETS = [
  {
    group: 'Cleanse',
    items: [
      'Body wash',
      'Acne / clarifying body wash',

    ],
  },
  {
    group: 'Exfoliate',
    items: [
      'Body scrub (physical)',
      'Exfoliating mitt / gloves',
    ],
  },
  {
    group: 'Hair wash',
    items: [
      'Shampoo',
      'Clarifying shampoo',
      'Dandruff shampoo',
      'Co-wash',
      'Conditioner',
      'Deep conditioner',
    ],
  },
  {
    group: 'Hair treatments',
    items: [
      'Hair mask',
      'Oil treatment (castor, argan, jojoba, etc.)',
      'Bond builder',
      'Protein treatment',
      'Apple cider vinegar rinse',
      'DIY hair treatment (rice water, rosemary, etc.)',
    ],
  },
  {
    group: 'Scalp',
    items: [
      'Scalp scrub',
    ],
  },
  {
    group: 'Shave & prep',
    items: [
      'Shave routine',
      'Self-tanner prep wash',
    ],
  },
]

// ─── SHOWER ROUTINE ──────────────────────────────────────────
const SHOWER_FREQUENCIES = [
  { key: 'daily',     label: 'Every shower',   daysOn: 7 },
  { key: 'alternate', label: 'Every other day', daysOn: null },
  { key: '3x',        label: '3× per week',    daysOn: 3 },
  { key: '2x',        label: '2× per week',    daysOn: 2 },
  { key: '1x',        label: '1× per week',    daysOn: 1 },
]

const EXTRAS_FREQUENCIES = [
  { key: 'daily',     label: 'Every day',      daysOn: 7 },
  { key: 'alternate', label: 'Every other day', daysOn: null },
  { key: '3x',        label: '3× per week',    daysOn: 3 },
  { key: '2x',        label: '2× per week',    daysOn: 2 },
  { key: '1x',        label: '1× per week',    daysOn: 1 },
]

// Is a shower item active on a given date, based on period start + item frequency?
function isShowerItemActive(dt, item, periodStartDate) {
  if (!periodStartDate) return false
  const start = new Date(periodStartDate + 'T00:00:00')
  // Offset daysIn so cycles align to item's own weekStartDay (default Mon=1)
  const weekStartDay = item?.weekStartDay ?? 1
  const startDow = start.getDay()
  const offset = (startDow - weekStartDay + 7) % 7
  const rawDaysIn = Math.round((dt - start) / 86400000)
  const daysIn = rawDaysIn + offset
  if (rawDaysIn < 0) return false

  const freq = item?.frequency || 'daily' // default to daily if missing

  switch (freq) {
    case 'daily':     return true
    case 'alternate': return daysIn % 2 === 0
    case '3x': {
      // 3 on, 4 off in a 7-day cycle — days 0, 2, 4
      const c = daysIn % 7
      return c === 0 || c === 2 || c === 4
    }
    case '2x': {
      // 2 on, 5 off in a 7-day cycle — days 0, 3
      const c = daysIn % 7
      return c === 0 || c === 3
    }
    case '1x': {
      // 1 on, 6 off in a 7-day cycle — day 0
      return daysIn % 7 === 0
    }
    default: return true // unknown frequency = show every day
  }
}

export function getActiveShowerPeriod(dt, history) {
  const key = dateKey(dt)
  const sorted = [...history].sort((a, b) => a.startDate.localeCompare(b.startDate))
  let active = null
  for (const p of sorted) {
    if (p.startDate <= key && (!p.endDate || p.endDate >= key)) active = p
  }
  return active
}

// DraggableShowerItem — like DraggableItem but shows frequency badge
function DraggableShowerItem({ item, index, onRemove, onFreqChange, onWeekStartChange, isDragging, onDragStart, onDragEnter, onDragEnd, onLongPress }) {
  const longPressTimer = useRef(null)
  const [pressing, setPressing] = useState(false)

  function handleTouchStart() {
    setPressing(true)
    longPressTimer.current = setTimeout(() => { setPressing(false); onLongPress(index) }, 500)
  }
  function handleTouchEnd() { setPressing(false); clearTimeout(longPressTimer.current) }

  const freq = SHOWER_FREQUENCIES.find(f => f.key === item.frequency) || SHOWER_FREQUENCIES[0]

  return (
    <div
      draggable
      onDragStart={() => onDragStart(index)}
      onDragEnter={() => onDragEnter(index)}
      onDragEnd={onDragEnd}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '7px 8px', marginBottom: 3,
        borderRadius: 0, border: `0.5px solid ${isDragging ? T.pinkDeep : T.hairline}`,
        background: isDragging ? T.pink : pressing ? T.surfaceMuted : T.white,
        cursor: isDragging ? 'grabbing' : 'grab', opacity: isDragging ? 0.6 : 1, userSelect: 'none',
      }}
    >
      <div style={{ fontSize: 14, color: T.textLight, flexShrink: 0 }}>⠿</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: T.text, marginBottom: 3 }}>{item.label}</div>
                {item.note && <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 2 }}>{item.note}</div>}
        {item._linkedProduct && <div style={{ fontSize: 10, color: T.textLight, marginBottom: 2 }}>↗ {item._linkedProduct}</div>}
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 3 }}>
          {SHOWER_FREQUENCIES.map(f => (
            <button key={f.key} onClick={e => { e.stopPropagation(); onFreqChange(index, f.key) }}
              aria-pressed={item.frequency === f.key}
              style={{ fontSize: 9, padding: '1px 6px', borderRadius: 0, cursor: 'pointer', border: `0.5px solid ${item.frequency === f.key ? T.pinkDeep : T.hairline}`, background: item.frequency === f.key ? T.pink : 'transparent', color: item.frequency === f.key ? T.text : T.textLight, fontWeight: item.frequency === f.key ? 500 : 400 }}
            >{f.label}</button>
          ))}
        </div>
        {item.frequency !== 'daily' && (
          <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 9, color: T.textLight }}>{item.frequency === 'alternate' ? 'starts on:' : 'cycle starts:'}</span>
            {DAYS.map((d, i) => (
              <button key={i} onClick={e => { e.stopPropagation(); onWeekStartChange(index, i) }}
                aria-pressed={(item.weekStartDay ?? 1) === i}
                style={{ fontSize: 9, padding: '1px 5px', borderRadius: 0, cursor: 'pointer', border: `0.5px solid ${(item.weekStartDay ?? 1) === i ? T.orange : T.hairline}`, background: (item.weekStartDay ?? 1) === i ? T.orangeLight : 'transparent', color: (item.weekStartDay ?? 1) === i ? '#9A3412' : T.textLight }}
              >{d}</button>
            ))}
          </div>
        )}
      </div>
      <button onClick={() => onRemove(index)} aria-label={`Remove ${item.label}`} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: T.textLight, fontSize: 14, padding: '0 2px', flexShrink: 0 }}>×</button>
    </div>
  )
}

// ShowerEditor — add/remove/reorder shower items with frequency settings
export function ShowerEditor({ initial, onSave, onCancel, allPeriods = [], onEditConflict, products = {}, onSaveProduct, userId }) {
  const catalogProducts = Object.fromEntries(Object.entries(products).filter(([, p]) => p._isCatalog))
  const [startDate,    setStartDate]    = useState(initial?.startDate    || '')
  const [endDate,      setEndDate]      = useState(initial?.endDate      || '')
  const [items, setItems] = useState(initial?.items || [])
  const [newLabel,       setNewLabel]       = useState('')
  const [newNote,        setNewNote]        = useState('')
  const [newFreq,        setNewFreq]        = useState('daily')
  const [showerPresetSearch, setShowerPresetSearch] = useState('')
  const [showShowerPresets,  setShowShowerPresets]  = useState(false)
  const [dragFrom,  setDragFrom]  = useState(null)
  const [dragOver,  setDragOver]  = useState(null)

  const conflict = null // end dates set automatically on save

  function addItem() {
    if (!newLabel.trim()) return
    setItems(it => [...it, { id: uid(), label: newLabel.trim(), note: newNote.trim(), frequency: newFreq, weekStartDay: 1 }])
    setNewLabel(''); setNewNote('')
  }

  function removeItem(i)        { setItems(it => it.filter((_, idx) => idx !== i)) }
  function handleDragStart(i)   { setDragFrom(i) }
  function handleDragEnter(i)   { setDragOver(i) }
  function handleDragEnd() {
    if (dragFrom !== null && dragOver !== null && dragFrom !== dragOver) {
      setItems(it => { const n=[...it]; const [m]=n.splice(dragFrom,1); n.splice(dragOver,0,m); return n })
    }
    setDragFrom(null); setDragOver(null)
  }
  function handleLongPress(i)   { setDragFrom(i) }
  function handleFreqChange(i, freq) {
    setItems(it => it.map((item, idx) => idx === i ? { ...item, frequency: freq } : item))
  }
  function handleWeekStartChange(i, day) {
    setItems(it => it.map((item, idx) => idx === i ? { ...item, weekStartDay: day } : item))
  }

  return (
    <div style={{ background: T.white, border: `0.5px solid ${T.hairline}`, borderRadius: 0, padding: '14px 16px', marginBottom: 10 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 4 }}>
        {initial?.id ? `Shower routine — editing from ${fmtDate(initial?.startDate)}` : 'Shower routine'}
      </div>
      <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 10, lineHeight: 1.6, background: T.surfaceMuted, borderRadius: 0, padding: '8px 12px' }}>
        Body washes, hair treatments, and anything else that happens in the shower. Set how often each one runs.
      </div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
        <div><FieldLabel htmlFor="shower-start">Start date</FieldLabel><DateInput id="shower-start" value={startDate} onChange={e => setStartDate(e.target.value)} /></div>
        <div><FieldLabel htmlFor="shower-end">End date (leave blank if active)</FieldLabel><DateInput id="shower-end" value={endDate} onChange={e => setEndDate(e.target.value)} /></div>
      </div>

      {conflict && <ConflictMessage conflict={conflict} onEditConflict={onEditConflict} />}

<div style={{ marginBottom: 10 }}>
        <FieldLabel>Items — long press to reorder</FieldLabel>
        {items.length === 0 && <div style={{ fontSize: 12, color: T.textLight, fontStyle: 'italic', padding: '6px 0' }}>No items yet</div>}
        {items.map((item, i) => (
          <div key={item.id}>
            <DraggableShowerItem
              item={item} index={i}
              onRemove={removeItem} onFreqChange={handleFreqChange} onWeekStartChange={handleWeekStartChange}
              isDragging={dragFrom === i}
              onDragStart={handleDragStart} onDragEnter={handleDragEnter}
              onDragEnd={handleDragEnd} onLongPress={handleLongPress}
            />
            {/* Product slot — tappable row matching skincare pattern */}
            {(() => {
              const prod = item.productId ? products[item.productId] : null
              const isOpen = !!item._pickingProduct
              return (
                <div style={{ marginLeft: 8, marginBottom: 4 }}>
                  <div
                    onClick={() => setItems(it => it.map((x,idx) => idx===i ? {...x,_pickingProduct:!x._pickingProduct} : x))}
                    role="button" tabIndex={0} aria-expanded={isOpen}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setItems(it => it.map((x,idx) => idx===i ? {...x,_pickingProduct:!x._pickingProduct} : x)) } }}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 0, cursor: 'pointer', background: isOpen ? T.pink : 'transparent', border: `0.5px solid ${isOpen ? T.pinkDeep : T.hairline}`, marginBottom: isOpen ? 4 : 0 }}
                  >
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: T.pinkDeep, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {prod ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {prod.imageUrl && <img src={prod.imageUrl} alt="" style={{ width: 44, height: 44, borderRadius: T.radius.card, objectFit: 'cover', flexShrink: 0 }} onError={e => e.target.style.display='none'} />}
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 11, fontWeight: 500, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{prod.name}</div>
                            {prod.brand && <div style={{ fontSize: 10, color: T.textMuted }}>{prod.brand}</div>}
                            {prod.effectiveness > 0 && <StarRating value={prod.effectiveness} size={9} />}
                          </div>
                        </div>
                      ) : (
                        <span style={{ fontSize: 11, color: T.textLight, fontStyle: 'italic' }}>Tap to assign product</span>
                      )}
                    </div>
                    {prod && <button onClick={e => { e.stopPropagation(); setItems(it => it.map((x,idx) => idx===i ? {...x,productId:null} : x)) }} aria-label="Remove assigned product" style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: T.textLight, fontSize: 13, padding: '0 2px', lineHeight: 1 }}>×</button>}
                    <span style={{ fontSize: 10, color: T.textLight, flexShrink: 0 }}>{isOpen ? '▲' : '▼'}</span>
                  </div>
                  {isOpen && (
                    <ProductPicker
                      stepKey="other"
                      currentProductId={item.productId}
                      products={products}
                      onSelect={(pid) => setItems(it => it.map((x,idx) => idx===i ? {...x,productId:pid,_pickingProduct:false,_linkedProduct: pid && products[pid]?.name} : x))}
                      onAddNew={() => setItems(it => it.map((x,idx) => idx===i ? {...x,_addingProduct:true,_pickingProduct:false} : x))}
                      onClose={() => setItems(it => it.map((x,idx) => idx===i ? {...x,_pickingProduct:false} : x))}
                    />
                  )}
                  {item._addingProduct && (
                    <ProductForm
                      onSave={(p) => { onSaveProduct?.(p); setItems(it => it.map((x,idx) => idx===i ? {...x,productId:p.id,_linkedProduct:p.name,_addingProduct:false} : x)) }}
                      onCancel={() => setItems(it => it.map((x,idx) => idx===i ? {...x,_addingProduct:false} : x))}
                      userId={userId}
                      catalogProducts={catalogProducts}
                    />
                  )}
                </div>
              )
            })()}
          </div>
        ))}
      </div>

      <div style={{ borderTop: `0.5px solid ${T.hairline}`, paddingTop: 10 }}>
        {/* Preset picker */}
        <div style={{ marginBottom: 8 }}>
          <button
            onClick={() => setShowShowerPresets(s => !s)}
            style={{ fontSize: 11, color: T.pinkDeep, border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, marginBottom: showShowerPresets ? 6 : 0 }}
          >
            {showShowerPresets ? '▲ Hide suggestions' : '▼ Browse suggestions'}
          </button>
          {showShowerPresets && (
            <div style={{ border: `0.5px solid ${T.hairline}`, borderRadius: 0, overflow: 'hidden', marginBottom: 8 }}>
              <input
                type="text"
                value={showerPresetSearch}
                onChange={e => setShowerPresetSearch(e.target.value)}
                placeholder="Search suggestions..."
                style={{ width: '100%', fontSize: 12, padding: '7px 10px', border: 'none', borderBottom: `0.5px solid ${T.hairline}`, background: T.white, color: T.text, boxSizing: 'border-box' }}
              />
              <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                {SHOWER_PRESETS.map(group => {
                  const filtered = group.items.filter(item =>
                    !showerPresetSearch || item.toLowerCase().includes(showerPresetSearch.toLowerCase())
                  )
                  if (!filtered.length) return null
                  return (
                    <div key={group.group}>
                      <div style={{ fontSize: 10, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '6px 10px 3px', background: T.surfaceMuted }}>{group.group}</div>
                      {filtered.map(item => (
                        <div
                          key={item}
                          onClick={() => { setNewLabel(item); setShowShowerPresets(false); setShowerPresetSearch('') }}
                          style={{ fontSize: 12, padding: '6px 10px', cursor: 'pointer', color: T.text, borderBottom: `0.5px solid ${T.hairline}` }}
                          onMouseEnter={e => e.currentTarget.style.background = T.pink}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          {item}
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div><FieldLabel htmlFor="shower-item">Item</FieldLabel><TextInput id="shower-item" value={newLabel} onChange={e => setNewLabel(e.target.value)} placeholder="e.g. BP wash" width={100} /></div>
          <div><FieldLabel htmlFor="shower-note">Note</FieldLabel><TextInput id="shower-note" value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="optional" width={80} /></div>
          <div>
            <FieldLabel htmlFor="shower-freq">Frequency</FieldLabel>
            <select id="shower-freq" value={newFreq} onChange={e => setNewFreq(e.target.value)} style={{ fontSize: 12, padding: '5px 8px', border: `0.5px solid ${T.hairline}`, borderRadius: 0, background: T.white, color: T.text }}>
              {SHOWER_FREQUENCIES.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
            </select>
          </div>
          <Btn variant="secondary" onClick={addItem}>Add</Btn>
        </div>
      </div>

      <div style={{ borderTop: `0.5px solid ${T.hairline}`, paddingTop: 10, marginTop: 10, display: 'flex', gap: 8 }}>
        <Btn variant="primary" onClick={() => startDate && !conflict && onSave({ startDate, endDate: endDate || null, items, id: initial?.id || uid() })} disabled={!startDate || !!conflict || items.length === 0}>Save</Btn>
        <Btn onClick={onCancel}>Cancel</Btn>
      </div>
    </div>
  )
}

// ShowerSection — shows active shower items for this specific date in the flyout
function ShowerSection({ dt, showerHistory, onEditShower, products, onUpdateShowerItemProduct, accentColor }) {
  const period = getActiveShowerPeriod(dt, showerHistory)
  const allItems  = period?.items || []
  const activeItems = allItems.filter(item => isShowerItemActive(dt, item, period?.startDate))
  const [openItemId, setOpenItemId] = useState(null)

  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Shower</div>
        <button onClick={onEditShower} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 11, color: T.textLight, padding: '0 2px' }}>Edit</button>
      </div>
      {activeItems.length === 0 ? (
        <div style={{ fontSize: 11, color: T.textLight, fontStyle: 'italic' }}>
          {period ? 'No shower items scheduled today' : 'No shower routine — tap Edit to add'}
        </div>
      ) : (
        activeItems.map(item => {
          const freq = SHOWER_FREQUENCIES.find(f => f.key === item.frequency)
          const prod = item.productId ? products?.[item.productId] : null
          const isOpen = openItemId === item.id
          return (
            <div key={item.id} style={{ borderBottom: `0.5px solid ${T.hairline}`, paddingBottom: 6, marginBottom: 6 }}>
              {/* Item header row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: T.text, flex: 1 }}>{item.label}</div>
                {item.note && <div style={{ fontSize: 11, color: T.textMuted }}>{item.note}</div>}
                <div style={{ fontSize: 9, color: T.textLight }}>{(freq?.label || item.frequency || 'Every day').replace('Every shower', 'Every day')}</div>
              </div>
              {/* Product slot — matches skincare renderSteps pattern */}
              <div
                onClick={() => setOpenItemId(isOpen ? null : item.id)}
                role="button" tabIndex={0} aria-expanded={isOpen}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpenItemId(isOpen ? null : item.id) } }}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: `0.5px solid ${T.hairline}`, cursor: 'pointer', opacity: prod ? 1 : 0.45 }}
              >
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: T.pinkDeep, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  {prod ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                      {prod.imageUrl && <img src={prod.imageUrl} alt="" style={{ width: 44, height: 44, borderRadius: T.radius.card, objectFit: 'cover', flexShrink: 0 }} onError={e => e.target.style.display='none'} />}
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 11, fontWeight: 500, color: T.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{prod.name}</div>
                        {prod.brand && <div style={{ fontSize: 10, color: T.textLight }}>{prod.brand}</div>}
                        {prod.effectiveness > 0 && <StarRating value={prod.effectiveness} size={9} />}
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: 11, color: T.textLight, fontStyle: 'italic' }}>Tap to assign product</div>
                  )}
                </div>
                <div style={{ fontSize: 10, color: T.textLight, flexShrink: 0 }}>{isOpen ? '▲' : '▼'}</div>
              </div>
              {isOpen && (
                <ProductPicker
                  stepKey="shower"
                  currentProductId={item.productId}
                  products={products}
                  onSelect={(pid) => { onUpdateShowerItemProduct?.(period.id, item.id, pid); setOpenItemId(null) }}
                  onClose={() => setOpenItemId(null)}
                  accentColor={accentColor}
                />
              )}
            </div>
          )
        })
      )}
    </div>
  )
}


// Dynamically builds PM step list based on routine period config and night type
// nightType: 'main' | 'off' | 'recovery' | 'treatment'


// ─── DAY FLYOUT ──────────────────────────────────────────────
// Shows AM or PM routine for a clicked day, with tab switcher
const AM_STEPS = [
  { key: 'am_cleanser',    label: 'Cleanser'    },
  { key: 'am_toner',       label: 'Toner'       },
  { key: 'am_serum',       label: 'Serum'       },
  { key: 'am_moisturizer', label: 'Moisturizer' },
  { key: 'am_spf',         label: 'SPF'         },
  { key: 'am_eye',         label: 'Eye cream'   },
]



// ─── MANAGE STEPS ────────────────────────────────────────────
// Library at bottom of flyout — greyed out steps with + to add,
// × on active steps to remove back to library. No page refresh.
const MULTI_STEP_KEYS = new Set(['watery_serum', 'treatment_serum', 'essence', 'toner', 'eye_cream'])

function ManageSteps({ period, dayTypeKey, onUpdateSteps, skinType, accentColor = T.darkGreen, borderColor = T.hairline }) {
  const [open, setOpen] = useState(false)
  if (!period?._dbId) return null

  const isOilySkin = skinType === 'oily' || skinType === 'combination'
  const currentSteps = period.steps?.[dayTypeKey] || []
  // dayTypes flags are per dayTypeKey (am/main/off/recovery/pause), not just
  // am vs pm — 'professional' counts as available here too, same as
  // getDefaultSteps treats it.
  const available = Object.entries(INGREDIENT_CATEGORIES)
    .filter(([, cat]) => cat.dayTypes[dayTypeKey] === true || cat.dayTypes[dayTypeKey] === 'professional')
    .sort((a, b) => a[1].order - b[1].order)
  const currentKeys = currentSteps.map(s => s.categoryKey)
  const librarySteps = available.filter(([key]) =>
    !currentKeys.includes(key) || MULTI_STEP_KEYS.has(key)
  )

  if (librarySteps.length === 0) return null

  function addStep(key, label) {
    const steps = JSON.parse(JSON.stringify(period.steps || {}))
    const cats  = INGREDIENT_CATEGORIES
    const uid   = `${dayTypeKey}_${key}_${Date.now()}`
    const newStep = { id: uid, categoryKey: key, label, optional: true, enabled: true }
    // Seed from the computed defaults if this dayType has never been
    // customized before — otherwise the required default steps (cleanser,
    // moisturizer, etc., which only ever existed virtually) get replaced by
    // an array containing just this one new step.
    const list  = steps[dayTypeKey] || getDefaultSteps(dayTypeKey)
    list.push(newStep)
    list.sort((a, b) => (cats[a.categoryKey]?.order ?? 99) - (cats[b.categoryKey]?.order ?? 99))
    steps[dayTypeKey] = list
    // Active nights mirror to off nights by default, same convention as the
    // removal side.
    if (dayTypeKey === 'main') {
      const offList = steps.off || []
      offList.push({ id: `off_${key}_${Date.now()}`, categoryKey: key, label, optional: true, enabled: true })
      offList.sort((a, b) => (cats[a.categoryKey]?.order ?? 99) - (cats[b.categoryKey]?.order ?? 99))
      steps.off = offList
    }
    onUpdateSteps?.(period._dbId, steps)
  }

  return (
    <div style={{ marginTop: 12, borderTop: `0.5px solid ${borderColor}`, paddingTop: 10 }}>
      <button onClick={() => setOpen(o => !o)}
        style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit', fontSize: 10, fontWeight: 600, color: T.textLight, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        Add to routine
        <span style={{ fontSize: 7, display: 'inline-block', transition: 'transform 0.15s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
      </button>
      {open && (
        <>
          <div style={{ fontSize: 10, color: T.textLight, fontStyle: 'italic', marginTop: 2, marginBottom: 6 }}>Tap + to add to your routine</div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {librarySteps.map(([key, cat]) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '5px 0', borderBottom: `0.5px solid ${borderColor}` }}>
                <div>
                  <span style={{ fontSize: 12, color: T.textMuted }}>{cat.label}</span>
                  {key === 'occlusive' && isOilySkin && (
                    <div style={{ fontSize: 10, color: T.textLight, fontStyle: 'italic', marginTop: 1 }}>
                      Use with caution on oily or acne-prone skin
                    </div>
                  )}
                </div>
                <button onClick={() => addStep(key, cat.label)}
                  aria-label={`Add ${cat.label}`} title="Add this step"
                  style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: accentColor, fontSize: 16, padding: '0 4px', lineHeight: 1, fontWeight: 600, flexShrink: 0 }}>
                  +
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function DayFlyout({ flyout, borderColor, bodyIsWhite, period, dailyHistory, showerHistory, products, allTypes, onClose, onAddTreatment, onTabChange, onEditDaily, onEditShower, onUpdatePeriodProducts, onUpdatePeriodSteps, onAddProduct, recoveryRoutines, onUpdateRecoveryProducts, onUpdateRecoverySteps, onUpdateShowerItemProduct, onUpdateDailyItemProduct, session, onReload, onUpdateSteps, skinType }) {
  const userId = session?.user?.id
  const catalogProducts = Object.fromEntries(Object.entries(products).filter(([, p]) => p._isCatalog))
  const [massageOpen, setMassageOpen] = useState(false)
  const tab = flyout.tab  // always read from parent — no local drift
  const [openStepKey, setOpenStepKey] = useState(null)
  const [addingProduct, setAddingProduct] = useState(false)
  function switchTab(t) { onTabChange?.(t); setOpenStepKey(null) }
  const { date, dayType, isTreatment, treatmentTimeOfDay, activeTreatmentType, allTreatments } = flyout
  const treatTod = treatmentTimeOfDay || 'am'

  // nightType: PM of treatment day always shows recovery steps
  // (recovery products are used immediately after any treatment)
  const nightType = (() => {
    if (isTreatment) {
      if (tab === 'pm') return 'recovery'
      // AM: show treatment message if AM treatment, normal routine if PM treatment
      if (treatTod === 'am') return 'treatment'
      return dayType === 'tret' ? 'main' : 'off'
    }
    if (dayType === 'pca' || dayType === 'recovery') return 'recovery'
    if (dayType === 'pause') return 'pause'
    if (dayType === 'tret') return 'main'
    return 'off'
  })()
  const isRecovery = dayType === 'pca' || dayType === 'recovery'
  // The actual period.steps[...] key backing whichever tab is showing right
  // now — 'am'/'recovery' for the AM tab, nightType for PM (which already
  // resolves to main/off/pause/recovery/treatment). Needed anywhere steps
  // get read or written for the current view, since 'am'/'pm' alone aren't
  // real storage keys once a day has any status beyond plain am/pm.
  const activeDayTypeKey = tab === 'am' ? (isRecovery ? 'recovery' : 'am') : nightType

  // Use treatment-scoped recovery routine if available
  const activeRecovery = isRecovery && activeTreatmentType
    ? recoveryRoutines?.[activeTreatmentType]
    : null

  const periodProducts = activeRecovery?.products || period?.products || {}

  // For recovery days with a scoped routine, use those steps; else use period/defaults
  const pmSteps = (() => {
    if (activeRecovery?.steps) {
      return activeRecovery.steps
        .filter(s => s.enabled)
        .sort((a, b) => {
          const oA = INGREDIENT_CATEGORIES[a.categoryKey]?.order ?? 99
          const oB = INGREDIENT_CATEGORIES[b.categoryKey]?.order ?? 99
          return oA - oB
        })
    }
    return period ? getStepsForDayType(period, nightType) : getDefaultSteps(nightType)
  })()

  function handleSelectProduct(stepKey, productId) {
    if (activeRecovery !== null && onUpdateRecoveryProducts) {
      onUpdateRecoveryProducts(activeTreatmentType, stepKey, productId)
    } else {
      onUpdatePeriodProducts(period?.startDate, stepKey, productId)
    }
    setOpenStepKey(null)
  }

  const isMassageDay = (() => {
    // Legacy: period.massageEnabled still works for old routines
    if (period?.massageEnabled && period?.massageDays?.includes(date.getDay())) return true
    // New: check extras for an active massage/gua sha/roller item in AM
    const extrasPeriod = getActiveDailyPeriod(date, dailyHistory)
    if (!extrasPeriod) return false
    return (extrasPeriod.items || []).some(item => {
      const l = item.label.toLowerCase()
      const isMassageItem = l.includes('massage') || l.includes('gua sha') || l.includes('roller')
      const freqMatch = isShowerItemActive(date, item, extrasPeriod.startDate)
      const tod = item.timeOfDay || 'both'
      const tabMatch = tod === 'both' || tod === 'am'
      return isMassageItem && freqMatch && tabMatch
    })
  })()

  function renderSteps(steps, dotColor, dayTypeKey) {
    const result = []
    steps.forEach(step => {
      const stepKey = step.id || step.key
      const productId = periodProducts[stepKey]
      const product = productId ? products[productId] : null
      const isThisOpen = openStepKey === stepKey
      result.push(
        <div key={stepKey}>
          <div
            onClick={() => period && setOpenStepKey(isThisOpen ? null : stepKey)}
            role="button" tabIndex={period ? 0 : undefined} aria-expanded={isThisOpen}
            onKeyDown={e => { if (period && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); setOpenStepKey(isThisOpen ? null : stepKey) } }}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: `0.5px solid ${borderColor}`, cursor: period ? 'pointer' : 'default', opacity: product ? 1 : 0.45, position: 'relative', minHeight: 44 }}
          >
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: T.text }}>{step.label}</div>
                {step.optional && period && (
                  <button onClick={e => {
                    e.stopPropagation()
                    if (onUpdateSteps) {
                      // Remove this specific step instance by id — must key off
                      // the actual dayTypeKey this list was rendered under
                      // (am/main/off/pause/recovery/treatment), not a hardcoded
                      // am/pm/off guess. That mismatch was why removal silently
                      // did nothing on any colored (non-plain-am) day: the step
                      // lived under e.g. period.steps.recovery, which was never
                      // touched.
                      const steps = JSON.parse(JSON.stringify(period.steps || {}))
                      // Same defaults-seeding as ManageSteps.addStep — a
                      // dayType with no persisted array yet is still showing
                      // the full virtual default set, not just this step.
                      steps[dayTypeKey] = (steps[dayTypeKey] || getDefaultSteps(dayTypeKey)).filter(s => s.id !== step.id)
                      // Active/off nights mirror each other by default, so
                      // removing a step on an active night also drops its
                      // off-night counterpart.
                      if (dayTypeKey === 'main') {
                        const offId = step.id.replace(/^main_/, 'off_')
                        steps.off = (steps.off || []).filter(s => s.id !== offId)
                      }
                      onUpdateSteps(period._dbId, steps)
                    } else {
                      onUpdatePeriodSteps?.(period.startDate, stepKey, false)
                    }
                  }} aria-label="Remove this step" style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: T.textLight, fontSize: 14, padding: '0 2px', lineHeight: 1, flexShrink: 0 }} title="Remove this step">×</button>
                )}
              </div>
              {product ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  {product.imageUrl && <img src={product.imageUrl} alt="" style={{ width: 44, height: 44, borderRadius: T.radius.card, objectFit: 'cover', flexShrink: 0 }} onError={e => e.target.style.display='none'} />}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 11, color: T.textMuted, fontWeight: 500 }}>{product.name}</div>
                    {product.brand && <div style={{ fontSize: 10, color: T.textLight }}>{product.brand}</div>}
                    {product.effectiveness > 0 && <StarRating value={product.effectiveness} size={9} />}
                  </div>
                </div>
              ) : productId ? (
                <div style={{ fontSize: 11, color: T.textLight, fontStyle: 'italic' }}>Assigned product not found — tap to reassign</div>
              ) : (
                <div style={{ fontSize: 11, color: T.textLight, fontStyle: 'italic' }}>Tap to assign product</div>
              )}
              {step.notes && (
                <div style={{ fontSize: 11, color: T.textMuted, lineHeight: 1.6, marginTop: 5, paddingTop: 5, borderTop: `0.5px solid ${borderColor}` }}>
                  {step.notes}
                </div>
              )}
            </div>
            <div style={{ fontSize: 10, color: T.textLight }}>{isThisOpen ? '▲' : '▼'}</div>
          </div>
          {isThisOpen && (
            addingProduct ? (
              <ProductForm
                onSave={(p) => { onAddProduct(p); setAddingProduct(false) }}
                onCancel={() => setAddingProduct(false)}
                userId={userId}
                catalogProducts={catalogProducts}
              />
            ) : (
              <ProductPicker
                stepKey={stepKey}
                categoryKey={step.categoryKey}
                currentProductId={productId}
                products={products}
                onSelect={(pid) => handleSelectProduct(stepKey, pid)}
                onAddNew={() => setAddingProduct(true)}
                onClose={() => setOpenStepKey(null)}
                accentColor={dayAccentDark}
              />
            )
          )}
        </div>
      )
      // Massage banner injected after moisturizer in AM tab
      if (step.key === 'am_moisturizer' && isMassageDay) {
        result.push(
          <div key="massage-banner">
            <div
              onClick={() => setMassageOpen(o => !o)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 0, background: '#E0F2FE', border: '0.5px solid #38BDF8', cursor: 'pointer', margin: '4px 0' }}
            >
              <span style={{ fontSize: 13 }}>🧖</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: '#0C4A6E' }}>Face massage today</div>
                <div style={{ fontSize: 10, color: '#0369A1', marginTop: 1 }}>Apply moisturizer or a few drops of facial oil first — the slip helps your fingers glide without dragging the skin.</div>
              </div>
              <span style={{ fontSize: 10, color: '#38BDF8', flexShrink: 0 }}>{massageOpen ? '▲' : '▼'}</span>
            </div>
            {massageOpen && (() => {
              // Check extras item note for a video URL
              const extrasPeriod = getActiveDailyPeriod(date, dailyHistory)
              const massageItem = (extrasPeriod?.items || []).find(item => {
                const l = item.label.toLowerCase()
                return (l.includes('massage') || l.includes('gua sha') || l.includes('roller')) && isShowerItemActive(date, item, extrasPeriod?.startDate)
              })
              const videoUrl = massageItem?.note?.startsWith('http') ? massageItem.note : (period?.massageVideoUrl || null)
              return videoUrl ? (
                <div style={{ marginTop: 4, borderRadius: 0, overflow: 'hidden', background: T.surfaceMuted, padding: 8 }}>
                  <iframe src={videoUrl} style={{ width: '100%', height: 360, border: 'none', borderRadius: 0 }} allowFullScreen title="Face massage" loading="lazy" />
                </div>
              ) : (
                <div style={{ fontSize: 10, color: '#0369A1', padding: '4px 10px', fontStyle: 'italic' }}>
                  Add a video URL to the note field of your Face massage extra to see it here.
                </div>
              )
            })()}
          </div>
        )
      }
    })

    return result
  }

  // Step-dot color per day type — same tokens as the calendar cells and
  // the badge above, instead of a hardcoded default/ternary that didn't
  // track dayType (previously left BHA/pause/treatment nights showing the
  // wrong color).
  function dotColorFor(key) {
    if (!key) return T.darkGreen
    if (key === 'pca') return T.recovery.text
    return T[key]?.text || T.darkGreen
  }

  // Dark accent for this day's own badge color — used for "selected" states
  // in product pickers/add-step actions within the flyout (dark bg needs
  // white text, same pattern as the badge/header elsewhere), falling back
  // to dark green when the day has no active status to draw a color from.
  const dayAccentColorKey = isTreatment ? (STATUS_COLORS[dayType] ? dayType : 'treatment') : (dayType === 'pca' ? 'recovery' : dayType)
  const dayAccentDark = (dayAccentColorKey && STATUS_COLORS[dayAccentColorKey]) ? STATUS_COLORS[dayAccentColorKey].dark : T.darkGreen

  return (
    <div style={{ background: 'transparent', padding: '12px 14px', marginBottom: 14 }}>
      {/* Day-type badge + treatment actions — same row. Badge uses the
          white-bg / dark-text badge treatment (STYLES spec), colored per
          the same tokens as the calendar cells so tret/bha/pause/recovery
          stay consistent everywhere instead of an ad-hoc local palette. */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {(() => {
            const banners = {
              tret:     { colorKey: 'tret',     label: `${period?.activeName ? period.activeName.charAt(0).toUpperCase() + period.activeName.slice(1) : 'Tretinoin'} night` },
              bha:      { colorKey: 'bha',      label: 'BHA night' },
              pause:    { colorKey: 'pause',    label: 'Pre-treatment pause' },
              pca:      { colorKey: 'recovery', label: 'Recovery products' },
              recovery: { colorKey: 'recovery', label: 'Recovery' },
            }
            const key = isTreatment ? null : dayType
            const b = banners[key]
            if (!b && !isTreatment) return null
            if (isTreatment && allTreatments?.length > 1) {
              return allTreatments.map(t => {
                const lbl = allTypes?.[t.type]?.label || t.type
                const c = T[t.type] || T.treatment
                return <div key={t._dbId} style={{ fontSize: 13, fontWeight: 700, padding: '5px 12px', borderRadius: T.radius.pill, background: bodyIsWhite ? c.bg : T.white, color: c.text, display: 'inline-block' }}>{lbl.charAt(0).toUpperCase() + lbl.slice(1).toLowerCase()}</div>
              })
            }
            const label = isTreatment ? (allTypes?.[dayType]?.label || dayType) : b.label
            const c = isTreatment ? (T[dayType] || T.treatment) : T[b.colorKey]
            return <div style={{ fontSize: 13, fontWeight: 700, padding: '5px 12px', borderRadius: T.radius.pill, background: bodyIsWhite ? c.bg : T.white, color: c.text, display: 'inline-block' }}>{label}</div>
          })()}
        </div>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          {flyout.isTreatment && (
            <Btn onClick={onAddTreatment} style={{ fontSize: 11, padding: '4px 10px', whiteSpace: 'nowrap' }}>+ Add treatment</Btn>
          )}
          {flyout.isTreatment
            ? <Btn onClick={() => onAddTreatment(flyout.allTreatments?.[0]?._dbId)} style={{ fontSize: 11, padding: '4px 10px', whiteSpace: 'nowrap' }}>Edit treatment</Btn>
            : <Btn onClick={onAddTreatment} style={{ fontSize: 11, padding: '4px 10px', whiteSpace: 'nowrap' }}>+ Add treatment</Btn>
          }
        </div>
      </div>

      {/* 1. Shower routine — always at top */}
      <ShowerSection dt={date} showerHistory={showerHistory} onEditShower={onEditShower} products={products} onUpdateShowerItemProduct={onUpdateShowerItemProduct} accentColor={dayAccentDark} />

      {/* 2. Morning / Night tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 8, marginTop: 10 }}>
        <button onClick={() => switchTab('am')} aria-pressed={tab === 'am'} style={{ padding: '7px 18px', borderRadius: T.radius.pill, border: 'none', background: tab === 'am' ? T.text : T.white, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', cursor: 'pointer', color: tab === 'am' ? T.white : T.text }}>Morning (AM)</button>
        <button onClick={() => switchTab('pm')} aria-pressed={tab === 'pm'} style={{ padding: '7px 18px', borderRadius: T.radius.pill, border: 'none', background: tab === 'pm' ? T.text : T.white, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', cursor: 'pointer', color: tab === 'pm' ? T.white : T.text }}>Evening (PM)</button>
      </div>

      {/* 3. Extras — filtered by frequency + current tab, hidden when nothing matches */}
      <DailySection dt={date} dailyHistory={dailyHistory} onEditDaily={onEditDaily} tab={tab} products={products} onUpdateDailyItemProduct={onUpdateDailyItemProduct} accentColor={dayAccentDark} />

      {/* 4. Skincare steps — tab-specific */}
      {!period ? (
        <div style={{ fontSize: 11, color: T.textMuted, fontStyle: 'italic', padding: '6px 0 10px', lineHeight: 1.6 }}>
          No skincare routine active for this date. Routine settings and product assignments begin on your routine start date.
        </div>
      ) : (
        <>
          {period && <div style={{ fontSize: 10, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, paddingTop: 10, borderTop: `0.5px solid ${borderColor}` }}>Skincare</div>}
          {/* AM: normal routine unless it's an AM treatment */}
          {tab === 'am' && dayType === 'pause' && (
            <div style={{ fontSize: 11, color: T.pause.text, background: T.pause.bg, border: `0.5px solid ${T.pause.border}`, borderRadius: T.radius.card, padding: '5px 10px', marginBottom: 8 }}>
              Pre-treatment pause — your morning SPF and moisturizer are fine. Skip any acids or actives.
            </div>
          )}
          {tab === 'am' && isTreatment && treatTod === 'am' && (
            <div style={{ fontSize: 12, color: T.textMuted, padding: '8px 0' }}>
              <span style={{ fontWeight: 500, color: T.text }}>Treatment this morning.</span> Skip your regular routine and follow your provider's instructions. Recovery products start tonight.
            </div>
          )}
          {tab === 'am' && (dayType === 'pca' || dayType === 'recovery') && (
            <div style={{ fontSize: 12, color: T.textMuted, fontStyle: 'italic', padding: '8px 0' }}>
              Recovery products only — no actives this morning.
            </div>
          )}
          {tab === 'am' && !isRecovery && !(isTreatment && treatTod === 'am') && renderSteps(period ? getStepsForDayType(period, 'am') : getDefaultSteps('am'), dotColorFor(dayType), 'am')}
          {tab === 'am' && isRecovery && renderSteps(getStepsForDayType(period, 'recovery'), dotColorFor('pca'), 'recovery')}
          {/* PM: treatment banner + recovery steps */}
          {tab === 'pm' && isTreatment && (
            <div style={{ fontSize: 11, padding: '6px 10px', borderRadius: 0, background: (T[dayType] || T.treatment).bg, color: (T[dayType] || T.treatment).text, marginBottom: 8, lineHeight: 1.5 }}>
              {treatTod === 'pm'
                ? 'Treatment tonight — use recovery products after your appointment.'
                : 'Treatment this morning — recovery begins tonight.'}
            </div>
          )}
          {tab === 'pm' && dayType === 'pause' && (
            <div style={{ fontSize: 11, color: T.pause.text, background: T.pause.bg, border: `0.5px solid ${T.pause.border}`, borderRadius: T.radius.card, padding: '5px 10px', marginBottom: 8 }}>
              Pre-treatment pause — skip actives tonight. Regular cleanse and moisturizer only.
            </div>
          )}
          {tab === 'pm' && renderSteps(pmSteps, dotColorFor(dayType), nightType)}

          {/* ── Manage steps ── */}
          {period && !isTreatment && (
            <ManageSteps
              period={period}
              dayTypeKey={activeDayTypeKey}
              onUpdateSteps={onUpdateSteps}
              skinType={skinType}
              accentColor={dayAccentDark}
              borderColor={borderColor}
            />
          )}
        </>
      )}
    </div>
  )
}


// ─── NEW ROUTINE PERIOD PICKER ───────────────────────────────
// Asks "What kind of routine would you like to add?" then shows the right form
// ─── ADD A PROGRAM PANEL ──────────────────────────────────────
// The hub for enrolling in add-on programs (e.g. Tretinoin Onboarding)
// on top of an existing baseline routine, and for ending/restarting
// a program if the user falls off partway through.
// ─── PROGRAM ENROLLMENT PREVIEW ──────────────────────────────
function ProgramEnrollmentPreview({ program, onConfirm, onBack, timezone }) {
  const [phases, setPhases] = useState([])
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState(() => todayInTz(timezone || detectTimezone()))
  const [confirming, setConfirming] = useState(false)

  // Pace tiers — only shown for linear programs like Tretinoin
  const PACE_TIERS = [
    {
      id: 'sensitive',
      label: 'Sensitive skin',
      sublabel: "I want to take it slow",
      durations: { 1: 42, 2: 28, 3: 28 },
      total: 98,
    },
    {
      id: 'recommended',
      label: 'Recommended',
      sublabel: 'Dermatologist standard pace',
      durations: { 1: 28, 2: 21, 3: 14 },
      total: 63,
      default: true,
    },
    {
      id: 'faster',
      label: 'Faster',
      sublabel: "I've used retinoids before",
      durations: { 1: 21, 2: 14, 3: 7 },
      total: 42,
    },
  ]

  const isLinear = program.slug === 'tretinoin-onboarding'
  const isBha    = program.slug === 'aha-bha-onboarding'
  const [pace, setPace] = useState('recommended')
  const [bhaDay, setBhaDay] = useState(6) // default Saturday
  const selectedTier = PACE_TIERS.find(t => t.id === pace)

  const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']

  useEffect(() => {
    supabase.from('program_phases').select('*').eq('program_id', program.id).order('phase_number')
      .then(({ data }) => { setPhases(data || []); setLoading(false) })
  }, [program.id])

  // For linear programs, use selected tier durations; otherwise use DB durations
  const displayedTotal = isLinear && selectedTier
    ? selectedTier.total
    : phases.filter(p => p.duration_days).reduce((s, p) => s + p.duration_days, 0)

  const displayedDuration = (phase) => {
    if (isLinear && selectedTier && selectedTier.durations[phase.phase_number]) {
      return selectedTier.durations[phase.phase_number]
    }
    return phase.duration_days
  }

  const toWeeks = (days) => {
    if (!days) return null
    const w = days / 7
    return Number.isInteger(w) ? `${w}w` : `${days}d`
  }

  return (
    <div style={{ padding: '18px 18px' }}>
      <button onClick={onBack}
        style={{ fontSize: 12, color: T.textMuted, background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit', marginBottom: 16 }}>
        ← Back to programs
      </button>

      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: T.pinkDeep, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Program overview</div>
        <div style={{ fontSize: 18, fontWeight: 800, color: T.text, letterSpacing: '-0.03em', marginBottom: 8 }}>{program.name}</div>
        <div style={{ fontSize: 13, color: T.textMuted, lineHeight: 1.7, marginBottom: 10 }}>{program.description}</div>
        {displayedTotal > 0 && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, color: T.textMuted, background: T.surfaceMuted, border: `0.5px solid ${T.hairline}`, padding: '4px 10px' }}>
            📅 ~{displayedTotal} days ({Math.round(displayedTotal / 7)} weeks) · {phases.length} phases
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ fontSize: 12, color: T.textMuted, padding: '20px 0', textAlign: 'center' }}>Loading…</div>
      ) : (
        <>
          {/* Pace picker — above phases, linear programs only */}
          {isLinear && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>Choose your pace</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {PACE_TIERS.map(tier => (
                  <button key={tier.id} onClick={() => setPace(tier.id)}
                    style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 0, border: `1px solid ${pace === tier.id ? T.text : T.hairline}`, background: pace === tier.id ? T.text : 'transparent', cursor: 'pointer', fontFamily: 'inherit' }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: pace === tier.id ? '#fff' : T.text }}>
                        {tier.label}
                        {tier.default && <span style={{ fontSize: 10, fontWeight: 400, color: pace === tier.id ? 'rgba(255,255,255,0.6)' : T.pinkDeep, marginLeft: 8 }}>recommended</span>}
                      </div>
                      <div style={{ fontSize: 11, color: pace === tier.id ? 'rgba(255,255,255,0.7)' : T.textMuted }}>{tier.sublabel}</div>
                    </div>
                    <div style={{ fontSize: 11, color: pace === tier.id ? 'rgba(255,255,255,0.7)' : T.textMuted, flexShrink: 0, marginLeft: 12 }}>
                      ~{Math.round(tier.total / 7)} weeks
                    </div>
                  </button>
                ))}
              </div>
              <div style={{ fontSize: 11, color: T.textMuted, lineHeight: 1.6, marginTop: 10, fontStyle: 'italic' }}>
                Slower is always safer — you can always move faster once you know your skin handles it.
              </div>
            </div>
          )}

          {/* Phase timeline — durations update with pace selection */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 14 }}>What to expect</div>
            {phases.map((p, i) => {
              const dur = displayedDuration(p)
              return (
                <div key={p.id} style={{ display: 'flex', gap: 14, marginBottom: 14 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: 24, height: 24, borderRadius: 0, background: i === 0 ? T.text : T.surfaceMuted, border: `1px solid ${i === 0 ? T.text : T.hairline}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: i === 0 ? '#fff' : T.textMuted, flexShrink: 0 }}>
                      {p.phase_number}
                    </div>
                    {i < phases.length - 1 && (
                      <div style={{ width: 1, height: 16, background: T.hairline, marginTop: 4 }} />
                    )}
                  </div>
                  <div style={{ paddingTop: 3 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: T.pinkDeep, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 2 }}>
                      Phase {p.phase_number}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>
                      {p.name}
                      {dur && <span style={{ fontWeight: 400, color: T.textMuted, marginLeft: 8 }}>{toWeeks(dur)}</span>}
                    </div>
                    <div style={{ fontSize: 12, color: T.textMuted, lineHeight: 1.6, marginTop: 2 }}>
                      {p.preview_description || p.description}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {!loading && (
        <div style={{ borderTop: `0.5px solid ${T.hairline}`, paddingTop: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 4 }}>When did/will you start?</div>
          <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 10, lineHeight: 1.6 }}>
            Already using this? Set the date you actually started so the calendar reflects where you are.
          </div>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
            style={{ width: '100%', boxSizing: 'border-box', fontSize: 12, padding: '6px 2px', border: 'none', borderBottom: `1px solid ${T.text}`, borderRadius: 0, background: 'transparent', color: T.text, fontFamily: 'inherit', outline: 'none', marginBottom: 14 }} />

          {/* AHA/BHA day picker */}
          {isBha && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: T.textLight, marginBottom: 6 }}>Which day works best for your first exfoliation night?</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {DAYS.map((d, i) => (
                  <button key={i} onClick={() => setBhaDay(i)}
                    style={{ padding: '5px 10px', borderRadius: 0, border: `1px solid ${bhaDay === i ? T.text : T.hairline}`, background: bhaDay === i ? T.text : 'transparent', color: bhaDay === i ? '#fff' : T.textMuted, cursor: 'pointer', fontSize: 11, fontFamily: 'inherit' }}>
                    {d.slice(0, 3)}
                  </button>
                ))}
              </div>
              <div style={{ fontSize: 10, color: T.textMuted, marginTop: 6, lineHeight: 1.6 }}>
                Phase 1 → {DAYS[bhaDay]} · Phase 2 → {DAYS[bhaDay]} + {DAYS[(bhaDay + 3) % 7]} · Maintenance → {DAYS[bhaDay]} + {DAYS[(bhaDay + 2) % 7]} + {DAYS[(bhaDay + 4) % 7]}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onBack} disabled={confirming}
              style={{ flex: 1, padding: '11px', borderRadius: 0, border: `1px solid ${T.hairline}`, background: 'transparent', color: T.text, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>
              Cancel
            </button>
            <button onClick={async () => {
              setConfirming(true)
              await onConfirm(startDate, isLinear ? selectedTier?.durations : null, isBha ? bhaDay : null)
              setConfirming(false)
            }} disabled={confirming}
              style={{ flex: 2, padding: '11px', borderRadius: 0, border: 'none', background: T.pinkDeep, color: '#fff', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', fontWeight: 600 }}>
              {confirming ? 'Starting…' : `Start ${program.name}`}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function AddProgramPanel({ session, activeProgram, activePrograms = [], routinePeriod, skinType, timezone, onChanged }) {
  const [alertDialog, alertUser] = useAlert()
  const [loading, setLoading] = useState(true)
  const [library, setLibrary] = useState([])
  const [completionCounts, setCompletionCounts] = useState({})
  const [activeProgramSlugs, setActiveProgramSlugs] = useState([]) // slugs of all active programs
  const [activeProgramDetails, setActiveProgramDetails] = useState(null)
  const [phase2Options, setPhase2Options] = useState([])
  const [ending, setEnding] = useState(false)
  const [starting, setStarting] = useState(null) // program id being started
  const [previewingProgram, setPreviewingProgram] = useState(null) // program object being previewed
  const [startDate, setStartDate] = useState(() => todayInTz(timezone || detectTimezone()))
  const [showAddMore, setShowAddMore] = useState(false)
  const [endFoundationConfirm, setEndFoundationConfirm] = useState(false)
  const [endingFoundation, setEndingFoundation] = useState(false)

  useEffect(() => { load() }, [activePrograms.map(p => p.id).join(',')])

  async function load() {
    setLoading(true)
    try {
      if (activeProgram) {
        const { data: prog } = await supabase
          .from('programs').select('*').eq('id', activeProgram.program_id).single()
        const { data: ph } = await supabase
          .from('program_phases').select('*').eq('program_id', activeProgram.program_id).order('phase_number')
        setActiveProgramDetails({ program: prog, phases: ph || [] })

        if (prog?.slug === 'basic-skincare') {
          const phase2 = (ph || []).find(p => p.phase_number === 2)
          if (phase2) {
            const { data: opts } = await supabase
              .from('program_phase_options').select('*').eq('phase_id', phase2.id).order('position')
            setPhase2Options(opts || [])
          }
        }

        // Load slugs of ALL active programs for incompatibility checking
        if (activePrograms.length > 0) {
          const { data: progs } = await supabase
            .from('programs').select('slug').in('id', activePrograms.map(p => p.program_id))
          setActiveProgramSlugs((progs || []).map(p => p.slug))
        }

        // Also show the library so compatible add-on programs can be enrolled
        const { data: progs } = await supabase
          .from('programs').select('*').eq('is_stackable', true).order('name')
        setLibrary(progs || [])

        const { data: completions } = await supabase
          .from('user_programs').select('program_id, status_detail')
          .eq('user_id', session.user.id).in('status', ['completed'])
        const counts = {}
        for (const c of (completions || [])) counts[c.program_id] = (counts[c.program_id] || 0) + 1
        setCompletionCounts(counts)

      } else {
        setActiveProgramDetails(null)
        // Add-on programs only — basic-skincare is the foundation, not an add-on
        const { data: progs } = await supabase
          .from('programs').select('*').eq('is_stackable', true).order('name')
        setLibrary(progs || [])

        // Load completion counts per program for this user
        const { data: completions } = await supabase
          .from('user_programs')
          .select('program_id, status_detail')
          .eq('user_id', session.user.id)
          .in('status', ['completed'])
        const counts = {}
        for (const c of (completions || [])) {
          counts[c.program_id] = (counts[c.program_id] || 0) + 1
        }
        setCompletionCounts(counts)
      }
    } catch (err) {
      console.error('AddProgramPanel load error:', err)
    } finally {
      setLoading(false)
    }
  }

  // Check if a candidate program is blocked by any active program
  // Checks both directions: candidate's own list AND active programs' lists
  function incompatibleWith(program) {
    const candidateSlug = program.slug
    const candidateIncompatible = program.incompatible_with || []
    return activeProgramSlugs.find(activeSlug =>
      candidateIncompatible.includes(activeSlug) ||
      // Also check if the active program lists this candidate as incompatible
      (library.find(p => p.slug === activeSlug)?.incompatible_with || []).includes(candidateSlug)
    )
  }

  // ── Add more, anytime during Phase 2 (doesn't touch phase/dates) ──
  async function addStepsNow(chosenOptions, bhaDay = null) {
    const realChoices = chosenOptions.filter(o => !o.is_skip_option)
    const hasExfoliant = realChoices.some(o => o.step_key === 'exfoliant')
    // Non-exfoliant steps get added to routine normally
    const nonBhaChoices = realChoices.filter(o => o.step_key !== 'exfoliant')
    const phase2 = activeProgramDetails?.phases.find(p => p.phase_number === 2)

    if (nonBhaChoices.length && routinePeriod?._dbId) {
      const currentSteps = routinePeriod.steps || { am: [], pm: [], off: [] }
      const { am: amAdds, pm: pmAdds } = buildStepEntries(nonBhaChoices)
      const newSteps = {
        am:  [...(currentSteps.am  || []), ...amAdds],
        pm:  [...(currentSteps.pm  || []), ...pmAdds],
        off: [...(currentSteps.off || currentSteps.pm || []), ...pmAdds.map(s => ({ ...s, id: s.id.replace('pm_', 'off_') }))],
      }
      await supabase
        .from('routine_periods')
        .update({ steps: newSteps, updated_at: new Date().toISOString() })
        .eq('id', routinePeriod._dbId)
    }

    for (const opt of nonBhaChoices) {
      await supabase.from('user_program_phase_selections').insert({
        user_program_id: activeProgram.id,
        phase_id: phase2?.id || activeProgram.id,
        selected_option_id: opt.id,
      })
    }

    // If exfoliant was selected, enroll in AHA/BHA Onboarding program
    if (hasExfoliant) {
      const today = todayInTz(timezone)
      const { data: bhaProg, error: bhaProgErr } = await supabase
        .from('programs').select('id').eq('slug', 'aha-bha-onboarding').single()
      if (bhaProg) {
        const { error: insertErr } = await supabase.from('user_programs').insert({
          user_id: session.user.id,
          program_id: bhaProg.id,
          started_at: today,
          current_phase_number: 1,
          phase_started_at: today,
          status: 'active',
          phase_duration_overrides: null,
        })
        if (!insertErr && routinePeriod?._dbId) {
          await supabase.from('routine_periods')
            .update({ bha_enabled: true, bha_frequency: 1, bha_start_day: bhaDay ?? 6 })
            .eq('id', routinePeriod._dbId)
        }
      }
    }

    setShowAddMore(false)
    onChanged()
  }

  // For foundation programs (e.g. Basic Skincare), "ending early" means
  // graduating now with whatever's been built so far — not abandoning.
  async function endFoundationEarly() {
    setEndingFoundation(true)
    try {
      const today = todayInTz(timezone)
      await supabase.from('user_programs').update({
        status: 'completed',
        completed_at: today,
      }).eq('id', activeProgram.id)

      await supabase.from('user_program_phase_history').insert({
        user_program_id: activeProgram.id,
        from_phase: activeProgram.current_phase_number,
        to_phase: null,
        reason: 'graduated_early',
      })

      onChanged()
    } catch (err) {
      console.error('End foundation program error:', err)
      setEndingFoundation(false)
    }
  }

  async function endProgram() {
    setEnding(true)
    try {
      const today = todayInTz(timezone)
      await supabase.from('user_programs').update({
        status: 'abandoned',
        completed_at: today,
      }).eq('id', activeProgram.id)

      await supabase.from('user_program_phase_history').insert({
        user_program_id: activeProgram.id,
        from_phase: activeProgram.current_phase_number,
        to_phase: null,
        reason: 'abandoned',
      })

      onChanged()
    } catch (err) {
      console.error('End program error:', err)
      setEnding(false)
    }
  }

  async function startProgram(program, chosenStartDate, phaseDurations, bhaDay) {
    setStarting(program.id)
    try {
      const today = chosenStartDate || todayInTz(timezone)

      // Server-side incompatibility check — don't trust UI alone
      if (program.incompatible_with?.length > 0 && activeProgramSlugs.length > 0) {
        const conflict = activeProgramSlugs.find(s => program.incompatible_with.includes(s))
        if (conflict) {
          await alertUser(`You need to complete your current program before starting ${program.name}.`)
          setStarting(null)
          return
        }
      }

      // AHA/BHA program — enable BHA tracking on the active routine period
      if (program.slug === 'aha-bha-onboarding') {
        if (routinePeriod?._dbId) {
          await supabase.from('routine_periods')
            .update({ bha_enabled: true, bha_frequency: 1, bha_start_day: bhaDay ?? 6 })
            .eq('id', routinePeriod._dbId)
        }
      }

      // Load phase 1 for this program
      const { data: ph } = await supabase
        .from('program_phases').select('*').eq('program_id', program.id).order('phase_number')
      const phase1 = (ph || []).find(p => p.phase_number === 1)

      // Store pace overrides per-user in user_programs (not global program_phases)
      const { error: progErr } = await supabase
        .from('user_programs')
        .insert({
          user_id:                  session.user.id,
          program_id:               program.id,
          started_at:               today,
          current_phase_number:     1,
          phase_started_at:         today,
          status:                   'active',
          phase_duration_overrides: phaseDurations || null,
        })
      if (progErr) throw progErr

      // Apply Phase 1's step changes (e.g. sandwich method + tret frequency)
      if (phase1 && routinePeriod?._dbId) {
        const { data: phase1Steps } = await supabase
          .from('program_phase_steps').select('*').eq('phase_id', phase1.id)

        const patch = applyProgramPhase(phase1Steps || [], routinePeriod, { isFirstApplication: true, startDate: today })

        await supabase
          .from('routine_periods')
          .update({
            steps: patch.steps,
            ...(patch.tret_enabled !== undefined && { tret_enabled: patch.tret_enabled }),
            ...(patch.tret_frequency !== undefined && { tret_frequency: patch.tret_frequency }),
            ...(patch.tret_frequency_history !== undefined && { tret_frequency_history: patch.tret_frequency_history }),
            ...(patch.tret_start_date !== undefined && { tret_start_date: patch.tret_start_date }),
            ...(patch.active_name !== undefined && { active_name: patch.active_name }),
            updated_at: new Date().toISOString(),
          })
          .eq('id', routinePeriod._dbId)
      }

      onChanged()
    } catch (err) {
      console.error('Start program error:', err)
      setStarting(null)
    }
  }

  if (loading) return (
    <div style={{ padding: '20px 18px', fontSize: 13, color: T.textMuted }}>Loading programs…</div>
  )

  // ── ACTIVE PROGRAM — show status + end option ──────────────
  if (activeProgram && activeProgramDetails) {
    const { program, phases } = activeProgramDetails
    const currentPhase = phases.find(p => p.phase_number === activeProgram.current_phase_number)

    // Foundation programs (e.g. Basic Skincare) aren't "add-ons" — finishing
    // them is what unlocks this hub's library in the first place. Show
    // progress + an explanation, plus the option to call it done early.
    if (!program.is_stackable) {
      return (
        <div style={{ padding: '18px 18px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 4 }}>You're still building your foundation</div>
          <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 16, lineHeight: 1.6 }}>
            {program.name} walks you through your first routine in phases. Once you finish, programs like Tretinoin Onboarding will show up here.
          </div>

          <div style={{ background: T.white, border: `1px solid ${T.hairline}`, borderRadius: 0, padding: '14px 16px', marginBottom: 16 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: T.pinkDeep, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
              {program.name}
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>
              {currentPhase ? `Phase ${currentPhase.phase_number} of ${phases.filter(p => p.duration_days != null).length} — ${currentPhase.name}` : 'In progress'}
            </div>
          </div>

          <div style={{ fontSize: 12, color: T.textMuted, lineHeight: 1.7, marginBottom: 16 }}>
            The same buttons live in your status bar above the calendar — here's where they take you.
          </div>

          {!endFoundationConfirm && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <button onClick={() => setShowAddMore(true)}
                style={{ padding: '7px 14px', borderRadius: 0, border: `1px solid ${T.hairline}`, background: 'transparent', color: T.text, cursor: 'pointer', fontSize: 11, fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                Add to my routine
              </button>
              <button onClick={() => setEndFoundationConfirm(true)}
                style={{ padding: '7px 14px', borderRadius: 0, border: `1px solid ${T.hairline}`, background: 'transparent', color: T.textMuted, cursor: 'pointer', fontSize: 11, fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                Done with this program
              </button>
            </div>
          )}

          {endFoundationConfirm && (
            <div style={{ maxWidth: '100%', overflow: 'hidden', border: `1px solid ${T.hairline}`, borderRadius: 0, padding: '14px 16px' }}>
              <div style={{ fontSize: 12, color: T.textMuted, lineHeight: 1.7, marginBottom: 14, wordBreak: 'break-word' }}>
                This locks in your current routine exactly as it is — no more Basic Skincare phases. Whether you're happy with it or just ready to move on, your routine stays as-is and you can keep adjusting it manually or add a new program (like Tretinoin Onboarding) anytime.
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setEndFoundationConfirm(false)} disabled={endingFoundation}
                  style={{ flex: 1, padding: '10px', borderRadius: 0, border: `1px solid ${T.hairline}`, background: 'transparent', color: T.text, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>
                  Cancel
                </button>
                <button onClick={endFoundationEarly} disabled={endingFoundation}
                  style={{ flex: 1, padding: '10px', borderRadius: 0, border: 'none', background: T.pinkDeep, color: '#fff', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', fontWeight: 600 }}>
                  {endingFoundation ? 'Saving…' : 'Done with this program'}
                </button>
              </div>
            </div>
          )}

          {showAddMore && (
            <Phase2Picker
              options={phase2Options}
              onChoose={addStepsNow}
              onClose={() => setShowAddMore(false)}
              skinType={skinType}
            />
          )}
        </div>
      )
    }
  }

  // ── PROGRAM LIBRARY — show all programs, mark active/incompatible ─────────────
  if (previewingProgram) {
    return (
      <>
        <ProgramEnrollmentPreview
          program={previewingProgram}
          timezone={timezone}
          onBack={() => setPreviewingProgram(null)}
          onConfirm={async (startDate, phaseDurations, bhaDay) => {
            await startProgram(previewingProgram, startDate, phaseDurations, bhaDay)
            setPreviewingProgram(null)
          }}
        />
        {alertDialog}
      </>
    )
  }

  return (
    <div style={{ padding: '18px 18px', overflowY: 'auto', maxHeight: 'calc(100vh - 120px)', WebkitOverflowScrolling: 'touch' }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 4 }}>Add a program</div>
      <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 16, lineHeight: 1.6 }}>
        Programs guide you through introducing something new — pacing it out in phases so you can tell what your skin is responding to. Your current routine stays as your baseline.
      </div>

      {library.length === 0 ? (
        <div style={{ fontSize: 12, color: T.textMuted, fontStyle: 'italic', padding: '20px 0', textAlign: 'center' }}>
          No programs available yet — check back soon.
        </div>
      ) : (
        library.map(program => {
          const completions = completionCounts[program.id] || 0
          const blocker = incompatibleWith(program)
          const isActive = activePrograms.some(p => p.program_id === program.id)
          const cardColor = programCardColor(program)
          const midColor = programMidColor(program)
          return (
            <div key={program.id} style={{ borderRadius: T.radius.card, marginBottom: 10, overflow: 'hidden', opacity: blocker || isActive ? 0.6 : 1 }}>
              <div style={{ background: cardColor, padding: '14px 18px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.white, letterSpacing: '0.02em', textTransform: 'uppercase' }}>
                  {program.name}
                </div>
                {completions > 0 && (
                  <div style={{ fontSize: 10, color: T.white, background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: T.radius.pill, flexShrink: 0, whiteSpace: 'nowrap' }}>
                    {completions === 1 ? 'Completed once' : `Completed ${completions} times`}
                  </div>
                )}
              </div>
              <div style={{ background: midColor, padding: '16px 18px' }}>
                <div style={{ fontSize: 14, color: cardColor, lineHeight: 1.6, marginBottom: 14 }}>{program.description}</div>
                {isActive ? (
                  <div style={{ fontSize: 11, color: cardColor, fontStyle: 'italic' }}>Currently active</div>
                ) : blocker ? (
                  <div style={{ fontSize: 11, color: cardColor }}>Complete your current program before starting this one</div>
                ) : (
                  <button onClick={() => setPreviewingProgram(program)}
                    style={{ width: '100%', padding: '12px', borderRadius: T.radius.pill, border: 'none', background: T.white, color: cardColor, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', fontWeight: 600, transition: 'opacity 150ms ease' }}
                    onMouseEnter={e => { e.currentTarget.style.opacity = 0.85 }}
                    onMouseLeave={e => { e.currentTarget.style.opacity = 1 }}>
                    {completions > 0 ? <>Start <AccentWord>again</AccentWord></> : <>Learn <AccentWord>more</AccentWord> & start</>}
                  </button>
                )}
              </div>
            </div>
          )
        })
      )}
      {alertDialog}
    </div>
  )
}

function NewRoutinePeriodPicker({ routineHistory, dailyHistory, showerHistory, products, onSaveNew, onSaveDaily, onSaveShower, onCancel, onSaveProduct, onEditConflictRoutine, onEditConflictDaily, onEditConflictShower, now, session, activeProgram, activePrograms, skinType, timezone, onProgramChanged, onScreenChange }) {
  const userId = session?.user?.id
  const [chosen, setChosen] = useState(null)

  // Tell the parent whether we're on the chooser screen (full-page blue)
  // or a sub-panel (its own colors) — parent owns the full-page background.
  useEffect(() => {
    onScreenChange?.(!chosen)
    return () => onScreenChange?.(false)
  }, [chosen])

  const primaryOptions = [
    { key: 'program',  label: 'Add a program',              desc: 'Guided phases for introducing something new — like a tretinoin ramp-up — that build on your current routine.' },
    { key: 'skincare', label: 'Manually adjust your routine',  desc: 'Edit your morning and evening steps directly — cleanse, moisturize, actives, SPF.' },
  ]
  const otherOptions = [
    { key: 'daily',  label: 'Extras',         desc: 'Growth serums, eye patches, tools, supplements.' },
    { key: 'shower', label: 'Shower routine', desc: 'Body washes, hair treatments, and anything else in the shower.' },
  ]
  const options = [...primaryOptions, ...otherOptions]

  if (!chosen) return (
    <div style={{ background: 'transparent', padding: 0, marginBottom: 14 }}>
      <div style={{ fontSize: 22, fontWeight: 600, color: T.white, marginBottom: 6 }}>What kind of routine would you like to add?</div>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', marginBottom: 14 }}>Each type is tracked separately with its own history.</div>

      {/* Primary choice: build a program vs manually adjust — stacked, not a grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
        {primaryOptions.map(o => (
          <button key={o.key} onClick={() => setChosen(o.key)} style={{
            padding: '16px 14px', borderRadius: T.radius.card,
            border: 'none', background: T.white,
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
            textAlign: 'left', cursor: 'pointer',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none' }}
          >
            <div style={{ fontSize: 14, fontWeight: 700, color: T.darkBlue, marginBottom: 4 }}>{o.label}</div>
            <div style={{ fontSize: 11, color: T.darkBlue, opacity: 0.75, lineHeight: 1.6 }}>{o.desc}</div>
          </button>
        )).reduce((acc, el, i) => i === 0 ? [el] : [...acc,
          <div key="or" style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.7)', fontStyle: 'italic' }}>or</div>,
          el
        ], [])}
      </div>

      <SectionLabel style={{ color: 'rgba(255,255,255,0.75)', borderTop: '0.5px solid rgba(255,255,255,0.3)' }}>Other options</SectionLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
        {otherOptions.map(o => (
          <button key={o.key} onClick={() => setChosen(o.key)} style={{
            padding: '10px 12px', borderRadius: T.radius.card,
            border: 'none', background: T.white,
            textAlign: 'left', cursor: 'pointer',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none' }}
          >
            <div style={{ fontSize: 12, fontWeight: 500, color: T.darkBlue, marginBottom: 2 }}>{o.label}</div>
            <div style={{ fontSize: 10, color: T.darkBlue, opacity: 0.75, lineHeight: 1.5 }}>{o.desc}</div>
          </button>
        ))}
      </div>

      <Btn onClick={onCancel} style={{ borderColor: T.white, color: T.white }}>Cancel</Btn>
    </div>
  )

  return (
    <div>
      {/* Back link lives inside a wrapper card so it feels contained */}
      <div style={{ background: T.white, borderRadius: T.radius.modal, marginBottom: 14, overflow: 'hidden' }}>
        <button onClick={() => setChosen(null)} style={{ border: 'none', borderRadius: 0, background: 'transparent', fontSize: 12, color: T.darkGreen, cursor: 'pointer', padding: '10px 16px', display: 'block', width: '100%', textAlign: 'left' }}>
          ← Back to routine type
        </button>
        <div style={{ padding: '0' }}>
          {chosen === 'skincare' && (
            <div style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 140px)', WebkitOverflowScrolling: 'touch' }}>
            <RoutinePeriodForm
              initial={{ ...getActivePeriod(now, routineHistory), startDate: '' }}
              onSave={onSaveNew}
              onCancel={onCancel}
              isFirst={false}
              allPeriods={routineHistory}
              products={products}
              onSaveProduct={onSaveProduct}
              onEditConflict={onEditConflictRoutine}
              userId={userId}
            />
            </div>
          )}
          {chosen === 'program' && (
            <AddProgramPanel
              session={session}
              activeProgram={activeProgram}
              activePrograms={activePrograms}
              routinePeriod={getActivePeriod(now, routineHistory)}
              skinType={skinType}
              timezone={timezone}
              onChanged={onProgramChanged}
            />
          )}
          {chosen === 'daily' && (
            <DailyEditor
              initial={getActiveDailyPeriod(now, dailyHistory) ? { ...getActiveDailyPeriod(now, dailyHistory), startDate: '', endDate: null, id: null } : null}
              onSave={onSaveDaily}
              onCancel={onCancel}
              allPeriods={dailyHistory}
              onEditConflict={onEditConflictDaily}
              products={products}
              onSaveProduct={onSaveProduct}
              userId={userId}
            />
          )}
          {chosen === 'shower' && (
            <ShowerEditor
              initial={getActiveShowerPeriod(now, showerHistory) ? { ...getActiveShowerPeriod(now, showerHistory), startDate: '', endDate: null, id: null } : null}
              onSave={onSaveShower}
              onCancel={onCancel}
              allPeriods={showerHistory}
              onEditConflict={onEditConflictShower}
              products={products}
              onSaveProduct={onSaveProduct}
              userId={userId}
            />
          )}
        </div>
      </div>
    </div>
  )
}




// ─── SEED PRODUCTS ───────────────────────────────────────────
// Pre-populated on first load and merged in for any existing library.
// Photos and purchase links can be added manually.



// ─── ICS EXPORT ──────────────────────────────────────────────
function icsEscape(str) {
  return (str || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

function icsDate(dt) {
  const pad = n => String(n).padStart(2,'0')
  return `${dt.getFullYear()}${pad(dt.getMonth()+1)}${pad(dt.getDate())}`
}

function icsDateTime(dt, timeStr) {
  const [h, m] = timeStr.split(':').map(Number)
  const pad = n => String(n).padStart(2,'0')
  return `${dt.getFullYear()}${pad(dt.getMonth()+1)}${pad(dt.getDate())}T${pad(h)}${pad(m)}00`
}

function buildStepDescription(steps, periodProducts, products) {
  return steps.map(step => {
    const pid = periodProducts?.[step.key || step.id]
    const prod = pid ? products?.[pid] : null
    return prod ? `${step.label}: ${prod.name}${prod.brand ? ' ('+prod.brand+')' : ''}` : step.label
  }).join('\n')
}

function addMins(timeStr, mins) {
  const [h, m] = timeStr.split(':').map(Number)
  const total = h * 60 + m + mins
  return `${String(Math.floor(total / 60) % 24).padStart(2,'0')}:${String(total % 60).padStart(2,'0')}`
}

function generateICS({ routineHistory, treatments, allTypes, products, settings, timezone }) {
  // format: 'allday' | 'combined' | 'separate'
  // amMode / pmMode: 'same' | 'custom'
  // amTimes, pmTimes: { 0..6: 'HH:MM' }
  // amTime, pmTime: 'HH:MM' (when mode === 'same')
  const { format, daysAhead, amMode, amTimes, amTime, pmMode, pmTimes, pmTime } = settings

  const getAM = dow => amMode === 'same' ? (amTime || '07:00') : (amTimes?.[dow] || '07:00')
  const getPM = dow => pmMode === 'same' ? (pmTime || '22:30') : (pmTimes?.[dow] || '22:30')

  const lines = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Glow Up//EN','CALSCALE:GREGORIAN','METHOD:PUBLISH']
  // Sequence number — increments each export so calendar apps update existing events
  const seqNum = Math.floor(Date.now() / 1000)
  const dtstamp = (() => { const n = new Date(); return `${n.getUTCFullYear()}${String(n.getUTCMonth()+1).padStart(2,'0')}${String(n.getUTCDate()).padStart(2,'0')}T${String(n.getUTCHours()).padStart(2,'0')}${String(n.getUTCMinutes()).padStart(2,'0')}${String(n.getUTCSeconds()).padStart(2,'0')}Z` })()
  const today = nowInTz(timezone)

  for (let offset = 0; offset < daysAhead; offset++) {
    const dt = new Date(today); dt.setDate(today.getDate() + offset)
    const key = dateKey(dt)
    const info = getDayInfo(dt, treatments, allTypes, routineHistory)
    const period = getActivePeriod(dt, routineHistory)
    const periodProducts = period?.products || {}
    const dow = dt.getDay()

    let nightType
    if (info.isTreatment) nightType = 'recovery'
    else if (info.status === 'pca' || info.status === 'recovery') nightType = 'recovery'
    else if (info.status === 'pause') nightType = 'pause'
    else if (info.status === 'tret') nightType = 'main'
    else if (info.status === 'bha')  nightType = 'main'
    else nightType = 'off'

    const rawLabel = info.isTreatment ? (allTypes[info.status]?.label || info.status) : ''
    const statusLabel = info.isTreatment
      ? (rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1).toLowerCase())
      : info.status === 'tret' ? `${period?.activeName ? (period.activeName.charAt(0).toUpperCase() + period.activeName.slice(1)) : 'Tretinoin'} night`
      : info.status === 'bha'  ? 'AHA/BHA night'
      : info.status === 'pause' ? 'Pre-treatment pause'
      : (info.status === 'pca' || info.status === 'recovery') ? 'Recovery'
      : null

    const amDesc = period ? buildStepDescription(AM_STEPS, periodProducts, products) : null
    const pmSteps = period ? getStepsForDayType(period, nightType) : getDefaultSteps(nightType)
    const pmDesc = info.isTreatment && !period ? 'Follow provider aftercare instructions'
      : pmSteps.length ? buildStepDescription(pmSteps, periodProducts, products)
      : null
    // Skip days with no routine and no treatment
    if (!period && !info.isTreatment) continue
    const uid = (slot) => `${key}-${slot}@glowup`

    if (format === 'allday') {
      const desc = `${amDesc ? `MORNING\n${amDesc}\n\n` : ``}${statusLabel ? `EVENING (${statusLabel})` : 'EVENING'}\n${pmDesc}`
      lines.push('BEGIN:VEVENT',`UID:${uid('allday')}`,`DTSTAMP:${dtstamp}`,`SEQUENCE:${seqNum}`,`DTSTART;VALUE=DATE:${icsDate(dt)}`,`DTEND;VALUE=DATE:${icsDate(new Date(dt.getTime()+86400000))}`,`SUMMARY:${statusLabel ? `Skincare — ${statusLabel}` : 'Skincare routine'}`,`DESCRIPTION:${icsEscape(desc)}`,'END:VEVENT')

    } else {
      // separate AM + PM
      const at = getAM(dow)
      lines.push('BEGIN:VEVENT',`UID:${uid('am')}`,`DTSTAMP:${dtstamp}`,`SEQUENCE:${seqNum}`,`DTSTART:${icsDateTime(dt, at)}`,`DTEND:${icsDateTime(dt, addMins(at, 30))}`,`SUMMARY:Morning routine`,`DESCRIPTION:${icsEscape('MORNING\n'+amDesc)}`,'END:VEVENT')
      const pt = getPM(dow)
      lines.push('BEGIN:VEVENT',`UID:${uid('pm')}`,`DTSTAMP:${dtstamp}`,`SEQUENCE:${seqNum}`,`DTSTART:${icsDateTime(dt, pt)}`,`DTEND:${icsDateTime(dt, addMins(pt, 30))}`,`SUMMARY:${statusLabel ? `Evening routine — ${statusLabel}` : 'Evening routine'}`,`DESCRIPTION:${icsEscape('EVENING\n'+pmDesc)}`,'END:VEVENT')
    }
  }
  lines.push('END:VCALENDAR')
  return lines.join('\r\n')
}

// ─── TIME PICKER SECTION ──────────────────────────────────────
const DOW_LABELS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const DEFAULT_AM = { 0:'09:00',1:'07:00',2:'07:00',3:'07:00',4:'07:00',5:'07:00',6:'09:00' }
const DEFAULT_PM = { 0:'22:30',1:'22:30',2:'22:30',3:'22:30',4:'22:30',5:'22:30',6:'22:30' }

function TimeGrid({ label, mode, setMode, times, setTimes, singleTime, setSingleTime, defaultSingle }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <FieldLabel>{label}</FieldLabel>
        <div style={{ display: 'flex', gap: 4 }}>
          {[['same','Same every day'],['custom','Per day of week']].map(([k,l]) => (
            <button key={k} onClick={() => setMode(k)} aria-pressed={mode===k} style={{ fontSize: 9, padding: '2px 7px', borderRadius: 0, cursor: 'pointer', border: `0.5px solid ${mode===k ? T.pinkDeep : T.hairline}`, background: mode===k ? T.pink : 'transparent', color: mode===k ? T.text : T.textLight }}>{l}</button>
          ))}
        </div>
      </div>
      {mode === 'same' ? (
        <input type="time" value={singleTime} onChange={e => setSingleTime(e.target.value)}
          style={{ fontSize: 12, padding: '5px 8px', border: `0.5px solid ${T.hairline}`, borderRadius: 0, background: T.white, color: T.text }} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
          {[0,1,2,3,4,5,6].map(d => (
            <div key={d} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 9, fontWeight: 600, color: T.textMuted, marginBottom: 2 }}>{DOW_LABELS[d]}</div>
              <input type="time" value={times[d]} onChange={e => setTimes(t => ({ ...t, [d]: e.target.value }))}
                style={{ width: '100%', fontSize: 9, padding: '2px 1px', border: `0.5px solid ${T.hairline}`, borderRadius: 0, background: T.white, color: T.text }} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── EXPORT PANEL ─────────────────────────────────────────────
function ExportPanel({ routineHistory, treatments, allTypes, products, dailyHistory, showerHistory, onClose, onNotion, timezone }) {
  const [format, setFormat]     = useState('separate')
  const [daysAhead, setDaysAhead] = useState(30)
  const [amMode, setAmMode]     = useState('same')
  const [amTimes, setAmTimes]   = useState({ ...DEFAULT_AM })
  const [amTime, setAmTime]     = useState('07:00')
  const [pmMode, setPmMode]     = useState('same')
  const [pmTimes, setPmTimes]   = useState({ ...DEFAULT_PM })
  const [pmTime, setPmTime]     = useState('22:30')

  const formats = [
    { key:'allday',   label:'All-day event',           desc:'One event per day, AM + PM details listed inside.' },
    { key:'separate', label:'Separate AM + PM events', desc:'Two events per day — set the same time every day or customize per day of the week.' },
  ]

  function handleDownload() {
    const settings = { format, daysAhead, amMode, amTimes, amTime, pmMode, pmTimes, pmTime }
    const ics = generateICS({ routineHistory, treatments, allTypes, products, settings, timezone })
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'glowup-routine.ics'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ background: T.white, border: `0.5px solid ${T.hairline}`, borderRadius: 0, padding: '16px 18px', marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>Export</div>
        <button onClick={onClose} aria-label="Close export panel" style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 18, color: T.textMuted, padding: '0 2px', lineHeight: 1 }}>×</button>
      </div>

      {/* Notion */}
      <div style={{ marginBottom: 14, paddingBottom: 14, borderBottom: `0.5px solid ${T.hairline}` }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: T.text, marginBottom: 4 }}>Copy to Notion</div>
        <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 8 }}>Copies a markdown summary of your treatments and routine history.</div>
        <Btn onClick={onNotion} style={{ fontSize: 11, padding: '5px 12px' }}>Copy Notion markdown</Btn>
      </div>

      {/* Calendar .ics */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 500, color: T.text, marginBottom: 4 }}>Add to calendar (.ics)</div>
        <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 12 }}>Imports into Google Calendar, Apple Calendar, or Outlook. Each event includes your steps and assigned products for that day.</div>

        {/* Event format */}
        <FieldLabel>Event format</FieldLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
          {formats.map(f => (
            <button key={f.key} onClick={() => setFormat(f.key)} aria-pressed={format===f.key} style={{ padding: '8px 12px', borderRadius: 0, border: `0.5px solid ${format===f.key ? T.pinkDeep : T.hairline}`, background: format===f.key ? T.pink : 'transparent', fontSize: 11, cursor: 'pointer', color: T.text, textAlign: 'left' }}>
              <span style={{ fontWeight: 500 }}>{f.label}</span>
              <span style={{ color: T.textMuted }}> — {f.desc}</span>
            </button>
          ))}
        </div>

        {/* Date range */}
        <FieldLabel>How far ahead</FieldLabel>
        <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
          {[30,60,90].map(d => (
            <button key={d} onClick={() => setDaysAhead(d)} aria-pressed={daysAhead===d} style={{ padding: '5px 14px', borderRadius: 0, border: `0.5px solid ${daysAhead===d ? T.pinkDeep : T.hairline}`, background: daysAhead===d ? T.pink : 'transparent', fontSize: 11, cursor: 'pointer', color: T.text }}>{d} days</button>
          ))}
        </div>

        {/* Time pickers */}
        {format === 'separate' && (
          <>
            <TimeGrid label="Morning time" mode={amMode} setMode={setAmMode} times={amTimes} setTimes={setAmTimes} singleTime={amTime} setSingleTime={setAmTime} />
            <TimeGrid label="Bedtime (evening routine)" mode={pmMode} setMode={setPmMode} times={pmTimes} setTimes={setPmTimes} singleTime={pmTime} setSingleTime={setPmTime} />
          </>
        )}

        <Btn variant="primary" onClick={handleDownload} style={{ width: '100%', textAlign: 'center', fontSize: 12, padding: '8px', marginTop: 4 }}>
          Download .ics file
        </Btn>
      </div>
    </div>
  )
}


// ─── UPCOMING TREATMENTS PANEL ───────────────────────────────

// ─── RECOVERY ROUTINE EDITOR ──────────────────────────────────────────────
function RecoveryRoutineEditor({ typeKey, typeLabel, steps, products, allProducts, onStepToggle, onProductSelect, onClose }) {
  const [openStepKey, setOpenStepKey] = useState(null)
  const enabledSteps  = steps.filter(s => s.enabled).sort((a, b) => {
    const oA = INGREDIENT_CATEGORIES[a.categoryKey]?.order ?? 99
    const oB = INGREDIENT_CATEGORIES[b.categoryKey]?.order ?? 99
    return oA - oB
  })
  const hiddenSteps = steps.filter(s => !s.enabled && s.optional)

  return (
    <div style={{ background: T.white, border: `0.5px solid ${T.hairline}`, borderRadius: 0, padding: '16px 18px', marginBottom: 14 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>Recovery routine</div>
          <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>{typeLabel}</div>
        </div>
        <button onClick={onClose} aria-label="Close recovery routine editor" style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 18, color: T.textMuted, lineHeight: 1 }}>×</button>
      </div>

      <div style={{ fontSize: 11, color: T.textMuted, lineHeight: 1.6, padding: '8px 10px', background: T.surfaceMuted, borderRadius: 0, marginBottom: 14, border: `0.5px solid ${T.hairline}` }}>
        Choose which steps and products you use during recovery from a {typeLabel.toLowerCase()}. These will show automatically on recovery days for this treatment.
      </div>

      {/* Enabled steps with product pickers */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {enabledSteps.map(step => {
          const assignedProductId = products[step.id]
          const assignedProduct   = assignedProductId ? allProducts[assignedProductId] : null
          const isOpen = openStepKey === step.id
          return (
            <div key={step.id}>
              <div
                onClick={() => setOpenStepKey(isOpen ? null : step.id)}
                role="button" tabIndex={0} aria-expanded={isOpen}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpenStepKey(isOpen ? null : step.id) } }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 12px', borderRadius: 0, cursor: 'pointer',
                  background: isOpen ? T.pink : 'transparent',
                  border: `0.5px solid ${isOpen ? T.pinkDeep : T.hairline}`,
                  transition: 'all 0.15s',
                }}
              >
                <div>
                  <div style={{ fontSize: 12, fontWeight: 500, color: T.text }}>{step.label}</div>
                  {assignedProduct && (
                    <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2 }}>
                      {assignedProduct.brand ? `${assignedProduct.brand} — ` : ''}{assignedProduct.name}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {step.optional && (
                    <button onClick={e => { e.stopPropagation(); onStepToggle(step.id, false) }}
                      style={{ fontSize: 10, padding: '2px 8px', borderRadius: 0, border: `0.5px solid ${T.hairline}`, background: 'transparent', color: T.textMuted, cursor: 'pointer', fontFamily: 'inherit' }}>
                      Remove
                    </button>
                  )}
                  <span style={{ fontSize: 11, color: T.textMuted }}>{isOpen ? '▲' : '▼'}</span>
                </div>
              </div>

              {/* Product picker */}
              {isOpen && (
                <ProductPicker
                  stepKey={step.id}
                  currentProductId={assignedProductId}
                  products={allProducts}
                  categoryKey={step.categoryKey}
                  onSelect={(productId) => { onProductSelect(step.id, productId); setOpenStepKey(null) }}
                  onAddNew={() => {}}
                  onClose={() => setOpenStepKey(null)}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Hidden optional steps */}
      {hiddenSteps.length > 0 && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: `0.5px solid ${T.hairline}` }}>
          <div style={{ fontSize: 10, color: T.textLight, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
            Add a step
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {hiddenSteps.map(step => (
              <button key={step.id} onClick={() => onStepToggle(step.id, true)}
                style={{ fontSize: 11, padding: '4px 10px', borderRadius: 0, border: `0.5px solid ${T.hairline}`, background: T.white, color: T.textMuted, cursor: 'pointer', fontFamily: 'inherit' }}>
                + {step.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function UpcomingTreatmentsPanel({ treatments, allTypes, routineHistory, onClose, onEdit, onRemove, onAddNew, recoveryRoutines, onUpdateRecoveryProducts, onUpdateRecoverySteps, getRecoveryStepsForType, products, timezone }) {
  const now = nowInTz(timezone)
  const [addingDate, setAddingDate] = useState('')
  const [editingRecovery, setEditingRecovery] = useState(null) // typeKey being edited
  const sorted = Object.entries(treatments).sort(([a],[b]) => a.localeCompare(b))
  const upcoming = sorted.filter(([k]) => new Date(k+'T00:00:00') >= now)
  const past     = sorted.filter(([k]) => new Date(k+'T00:00:00') <  now)

  function renderTreatment([key, entries], isPast) {
    const dt = new Date(key+'T00:00:00')
    const isToday = key === dateKey(now)
    const entriesArr = Array.isArray(entries) ? entries : [entries]
    return (
      <div key={key} style={{ marginBottom: 10 }}>
        {entriesArr.map(tv => {
          const cfg = { pre: tv.pre ?? allTypes[tv.type]?.pre ?? 0, post: tv.post ?? allTypes[tv.type]?.post ?? 0 }
          const typeLabel = allTypes[tv.type]?.label || tv.type
          const areaLabel = tv.area ? tv.area.charAt(0).toUpperCase()+tv.area.slice(1) : ''
          const todLabel  = tv.timeOfDay === 'pm' ? 'Evening (PM)' : 'Morning (AM)'
          const metaParts = [areaLabel, todLabel]
          if (cfg.pre > 0) metaParts.push(`${cfg.pre} days pause before`)
          if (cfg.post > 0) metaParts.push(`${cfg.post} days recovery after`)
          const cardBg = isPast ? T.orangeLight : T.white
          const cardText = T.darkOrange
          return (
            <div key={tv._dbId} style={{ background: cardBg, borderRadius: T.radius.card, padding: '16px 18px', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                {/* Circular date badge */}
                <div style={{ width: 58, height: 58, borderRadius: '50%', background: isPast ? T.white : T.orangeLight, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: cardText, textTransform: 'uppercase', letterSpacing: '0.04em', lineHeight: 1.1 }}>{dt.toLocaleString('default',{month:'short'})}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: cardText, lineHeight: 1.1 }}>{dt.getDate()}</div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {isToday && <span style={{ fontSize: 10, padding: '2px 10px', borderRadius: T.radius.pill, background: T.orange, color: T.white, fontWeight: 700, display: 'inline-block', marginBottom: 6 }}>Today</span>}
                  <div style={{ fontSize: 18, fontWeight: 700, color: cardText, marginBottom: 3 }}>{typeLabel}</div>
                  <div style={{ fontSize: 12, color: cardText, opacity: 0.75 }}>{metaParts.filter(Boolean).join(' · ')}</div>
                </div>
                {!isPast && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
                    <button onClick={() => onRemove(tv._dbId)} aria-label={`Remove ${typeLabel}`} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: cardText, opacity: 0.55, fontSize: 18, padding: 0, lineHeight: 1 }}>×</button>
                    <button onClick={() => onEdit(key)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: cardText, opacity: 0.7, fontSize: 12, fontWeight: 600, fontFamily: 'inherit', padding: 0, whiteSpace: 'nowrap' }}>Edit</button>
                  </div>
                )}
              </div>

              {isPast && (
                <div style={{ fontSize: 11, color: cardText, opacity: 0.7, fontStyle: 'italic', marginTop: 10 }}>
                  Recovery ended {(() => {
                    const recEnd = new Date(dt); recEnd.setDate(recEnd.getDate() + cfg.post)
                    const daysSince = Math.round((now - recEnd) / 86400000)
                    return daysSince <= 0 ? 'today' : `${daysSince}d ago`
                  })()}
                </div>
              )}
              {!isPast && cfg.pre > 0 && (() => {
                const pauseStart = new Date(dt); pauseStart.setDate(pauseStart.getDate() - cfg.pre)
                const daysUntilPause = Math.round((pauseStart - now) / 86400000)
                const daysUntil = Math.round((dt - now) / 86400000)
                return daysUntilPause <= 0 && daysUntil > 0 ? (
                  <div style={{ fontSize: 11, color: T.white, background: T.darkOrange, borderRadius: T.radius.pill, padding: '3px 10px', display: 'inline-block', marginTop: 10 }}>
                    Pause window active — {daysUntil} days until treatment
                  </div>
                ) : daysUntilPause > 0 ? (
                  <div style={{ fontSize: 11, color: cardText, opacity: 0.8, marginTop: 10 }}>
                    Pause exfoliants & retinoids in {daysUntilPause} days · Treatment in {daysUntil} days
                  </div>
                ) : null
              })()}
              {!isPast && cfg.post > 0 && (
                <div style={{ marginTop: 10 }}>
                  <button onClick={() => setEditingRecovery(editingRecovery === tv._dbId ? null : tv._dbId)}
                    style={{ fontSize: 11, padding: '4px 12px', borderRadius: T.radius.pill, border: 'none', background: editingRecovery === tv._dbId ? T.darkOrange : T.orangeLight, color: editingRecovery === tv._dbId ? T.white : T.darkOrange, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
                    Set recovery routine
                  </button>
                </div>
              )}
              {editingRecovery === tv._dbId && (
                <div style={{ marginTop: 10 }}>
                  <RecoveryRoutineEditor
                    typeKey={tv.type}
                    typeLabel={allTypes[tv.type]?.label || tv.type}
                    steps={getRecoveryStepsForType(tv.type)}
                    products={recoveryRoutines?.[tv.type]?.products || {}}
                    allProducts={products}
                    onStepToggle={(stepId, enabled) => { const steps = getRecoveryStepsForType(tv.type).map(s => s.id === stepId ? { ...s, enabled } : s); onUpdateRecoverySteps(tv.type, steps) }}
                    onProductSelect={(stepKey, productId) => onUpdateRecoveryProducts(tv.type, stepKey, productId)}
                    onClose={() => setEditingRecovery(null)}
                  />
                </div>
              )}
            </div>
          )
        })}
        {!isPast && (
          <button onClick={() => onAddNew(key)} style={{ fontSize: 10, color: T.textMuted, background: 'transparent', border: `0.5px dashed ${T.hairline}`, borderRadius: T.radius.card, padding: '5px 8px', cursor: 'pointer', fontFamily: 'inherit', width: '100%' }}>
            + Add another treatment this day
          </button>
        )}
      </div>
    )
  }

  return (
    <div style={{ background: 'transparent', padding: 0, marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.white }}>Treatments</div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>

          <button onClick={onClose} aria-label="Close treatments panel" style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 18, color: T.white, padding: '0 2px', lineHeight: 1 }}>×</button>
        </div>
      </div>

      {/* Add new treatment */}
      <div style={{ marginBottom: 14, paddingBottom: 14, borderBottom: '0.5px solid rgba(255,255,255,0.3)' }}>
        {addingDate ? (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <DateInput value={addingDate} onChange={e => setAddingDate(e.target.value)} />
            <Btn variant="primary" disabled={!addingDate} onClick={() => { onAddNew(addingDate); setAddingDate('') }} style={{ fontSize: 11, padding: '5px 12px', background: T.white, color: T.darkOrange }}>
              Choose type →
            </Btn>
            <Btn onClick={() => setAddingDate('')} style={{ fontSize: 11, padding: '5px 10px', borderColor: T.white, color: T.white }}>Cancel</Btn>
          </div>
        ) : (
          <Btn variant="primary" onClick={() => setAddingDate(dateKey(new Date()))} style={{ fontSize: 11, padding: '5px 12px', background: T.white, color: T.darkOrange }}>
            + Add a treatment
          </Btn>
        )}
      </div>

      {Object.keys(treatments).length === 0 ? (
        <div style={{ fontSize: 12, color: T.white, background: 'rgba(255,255,255,0.2)', borderRadius: T.radius.card, padding: '12px 14px', lineHeight: 1.6 }}>
          No treatments scheduled yet. Tap any date on the calendar to add a treatment.
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, color: T.white, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Upcoming</div>
              {upcoming.map(t => renderTreatment(t, false))}
            </div>
          )}
          {past.length > 0 && (
            <div style={{ marginTop: upcoming.length > 0 ? 14 : 0 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: T.white, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Past</div>
              {past.slice(0, 5).map(t => renderTreatment(t, true))}
              {past.length > 5 && (
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', fontStyle: 'italic', paddingTop: 8 }}>+{past.length - 5} older treatments</div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ─── SIDE MENU ────────────────────────────────────────────────
// Returns list of active ingredient names currently in the routine
// Used to warn users when adding a treatment that will pause those actives
function getActiveIngredients(routinePeriod) {
  if (!routinePeriod) return []
  const actives = []
  if (routinePeriod.tret_enabled) actives.push('tretinoin')
  const ACTIVE_KEYS = new Set(['bha_acid', 'aha_acid', 'vitamin_c', 'exfoliant', 'retinoid'])
  const steps = [
    ...(routinePeriod.steps?.am   || []),
    ...(routinePeriod.steps?.pm   || []),
    ...(routinePeriod.steps?.main || []),
  ]
  for (const s of steps) {
    if (s.enabled !== false && ACTIVE_KEYS.has(s.categoryKey)) {
      // Avoid duplication if tretinoin already listed
      if (s.categoryKey === 'retinoid' && routinePeriod.tret_enabled) continue
      actives.push(s.label || s.categoryKey)
    }
  }
  return [...new Set(actives)]
}

// ─── NOTIFICATIONS ───────────────────────────────────────────
// Pure function — computes all current alerts from app state.
// Runs on every render so it's always fresh with no extra fetches.
function computeNotifications({ products, treatments, allTypes, timezone }) {
  const notes = []
  const today = todayInTz(timezone)

  // ── PAO / expiry warnings ─────────────────────────────────
  const productsArr = Object.values(products || {})
  for (const p of productsArr) {
    if (!p.name) continue

    // Compute expiry date: explicit expires_at wins, then opened_at + pao_months
    let expiryDate = p.expires_at || null
    if (!expiryDate && p.opened_at && p.pao_months) {
      const d = new Date(p.opened_at + 'T00:00:00')
      d.setMonth(d.getMonth() + Number(p.pao_months))
      expiryDate = d.toISOString().split('T')[0]
    }
    if (!expiryDate) continue

    const daysLeft = Math.round((new Date(expiryDate + 'T00:00:00') - new Date(today + 'T00:00:00')) / 86400000)
    if (daysLeft < 0) {
      notes.push({
        id: `pao-expired-${p.id}`,
        type: 'warning',
        category: 'pao',
        title: `${p.name} has expired`,
        body: `Expired ${Math.abs(daysLeft)} day${Math.abs(daysLeft) === 1 ? '' : 's'} ago. Check if it's still safe to use.`,
        date: expiryDate,
      })
    } else if (daysLeft <= 30) {
      notes.push({
        id: `pao-soon-${p.id}`,
        type: 'info',
        category: 'pao',
        title: `${p.name} expires soon`,
        body: `${daysLeft === 0 ? 'Expires today' : `${daysLeft} day${daysLeft === 1 ? '' : 's'} left`}. Opened ${p.opened_at ? new Date(p.opened_at + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''}.`,
        date: expiryDate,
      })
    }
  }

  // ── Post-recovery nudge ───────────────────────────────────
  for (const [dateKey, entries] of Object.entries(treatments || {})) {
    for (const tx of (Array.isArray(entries) ? entries : [entries])) {
      const cfg = allTypes[tx.type]
      if (!cfg || !cfg.post) continue
      const resumeDate = new Date(dateKey + 'T00:00:00')
      resumeDate.setDate(resumeDate.getDate() + cfg.post + 1)
      const resumeKey = resumeDate.toISOString().split('T')[0]
      if (resumeKey === today) {
        notes.push({
          id: `recovery-${dateKey}-${tx._dbId || tx.type}`,
          type: 'nudge',
          category: 'recovery',
          title: 'Your recovery window ended',
          body: `Your ${cfg.label || tx.type} recovery is over — your full routine resumes tonight.`,
          date: today,
        })
      }
    }
  }

  // Sort: warnings first, then by date descending
  const priority = { warning: 0, nudge: 1, info: 2 }
  return notes.sort((a, b) => (priority[a.type] ?? 3) - (priority[b.type] ?? 3) || b.date.localeCompare(a.date))
}


const LOGO_COLORS = [T.pink, T.blue, T.green, T.yellow, T.orange]

// Shared bright/dark color pair per day-type status — used for cell fills
// and the day flyout's body/header colorization.
const STATUS_COLORS = {
  tret:               { fill: T.green,  dark: T.darkGreen },
  bha:                { fill: T.blue,   dark: T.darkBlue },
  pause:              { fill: T.yellow, dark: T.darkYellow },
  recovery:           { fill: T.pink,   dark: T.darkPink },
  treatment:          { fill: T.orange, dark: T.darkOrange },
  microneedling:      { fill: T.orange, dark: T.darkOrange },
  massage:            { fill: T.orange, dark: T.darkOrange },
  hairTreatment:      { fill: T.orange, dark: T.darkOrange },
  peel:               { fill: T.orange, dark: T.darkOrange },
  electrolysis:       { fill: T.orange, dark: T.darkOrange },
  facial:             { fill: T.orange, dark: T.darkOrange },
  microderm:          { fill: T.orange, dark: T.darkOrange },
  custom:             { fill: T.orange, dark: T.darkOrange },
  laser:              { fill: T.orange, dark: T.darkOrange },
  dermaplaning:       { fill: T.orange, dark: T.darkOrange },
  botox:              { fill: T.orange, dark: T.darkOrange },
  led:                { fill: T.orange, dark: T.darkOrange },
  microneedling_home: { fill: T.orange, dark: T.darkOrange },
  hydrafacial:        { fill: T.orange, dark: T.darkOrange },
}

// AM/PM cell labels render directly on the saturated STATUS_COLORS fill
// (not the light badge tint), so the badges' own `.text` tokens — tuned for
// contrast against a pale tint — fall short of 4.5:1 here. These are darkened
// versions used only for that label, so the badge pill colors elsewhere stay
// untouched.
const CELL_LABEL_TEXT = {
  tret: '#186438', bha: '#1D2D8A', pause: '#6B4800', recovery: '#5F123F', treatment: '#521C00',
}
for (const k of ['microneedling', 'massage', 'hairTreatment', 'peel', 'electrolysis', 'facial', 'microderm', 'custom', 'laser', 'dermaplaning', 'botox', 'led', 'microneedling_home', 'hydrafacial']) {
  CELL_LABEL_TEXT[k] = CELL_LABEL_TEXT.treatment
}
// Statuses that are strictly a nighttime concept (actives applied PM
// only) — the AM half stays neutral. Pause ("no actives") applies to both
// halves, so it's excluded here.
const PM_ONLY_STATUSES = ['tret', 'bha']

export default function GlowUpCalendar({ session }) {
  const [confirmDialog, confirm] = useConfirm()
  const userId = session?.user?.id
  // Random brand color per page load — calendar page only.
  const logoColor = useRef(LOGO_COLORS[Math.floor(Math.random() * LOGO_COLORS.length)])

  // timezone must be declared FIRST so all date computations below are correct.
  // Initialize from device timezone immediately — profile load will override once
  // the saved preference arrives from Supabase.
  const [timezone, setTimezone] = useState(() => detectTimezone())
  const now = nowInTz(timezone)
  const [year,  setYear]  = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())

  const [routineHistory, setRoutineHistory] = useState([])
  const [products,       setProducts]       = useState({})
  const catalogProducts = Object.fromEntries(Object.entries(products).filter(([, p]) => p._isCatalog))
  const catalogIds = useRef(new Set())
  const [dailyHistory,   setDailyHistory]   = useState([])
  const [showerHistory,  setShowerHistory]  = useState([])
  const [treatments,     setTreatments]     = useState({})
  const [customTypes,    setCustomTypes]    = useState({})
  const [activePrograms, setActivePrograms] = useState([])  // all active user_programs rows
  const [onboardingDone, setOnboardingDone] = useState(null)   // null=loading, true/false
  const [reloadKey,      setReloadKey]      = useState(0)      // bump to retrigger loadAll

  // panel: 'setup' | 'update' | null
  const [panel,         setPanel]         = useState(null)
  // editingPeriod: the period being edited in place, or null
  const [editingPeriod, setEditingPeriod] = useState(null)
  const [editingDaily,  setEditingDaily]  = useState(null) // null | 'new' | period object
  const [editingShower, setEditingShower] = useState(null) // null | 'new' | period object
  const [editingProduct, setEditingProduct] = useState(null) // null | 'new' | product object
  const [selector,      setSelector]      = useState(null)
  const [dayFlyout,     setDayFlyout]     = useState(null) // { key, date, tab: 'am'|'pm', dayType }
  const [toast,         setToast]         = useState(false)
  const [showExport, setShowExport] = useState(() => {
    const has = new URLSearchParams(window.location.search).get('export') === '1'
    if (has) window.history.replaceState({}, '', window.location.pathname)
    return has
  })
  const [loading,       setLoading]       = useState(true)


  useEffect(() => {
    const action = sessionStorage.getItem('glowup-history-action')
    if (!action) return
    sessionStorage.removeItem('glowup-history-action')
    try {
      const { type, data } = JSON.parse(action)
      if (type === 'edit-skincare') {
        setEditingPeriod(data)
        setPanel(null)
      } else if (type === 'new-skincare') {
        setPanel('update')
        setEditingPeriod(null)
      } else if (type === 'edit-daily') {
        setEditingDaily(data)
        setPanel(null)
      } else if (type === 'new-daily') {
        openDailyEditor('new')
      } else if (type === 'edit-shower') {
        setEditingShower(data)
        setPanel(null)
      } else if (type === 'new-shower') {
        openShowerEditor('new')
      }
    } catch(e) {}
  }, [])

  // ── Load all data from Supabase on mount ─────────────────────────────────
  useEffect(() => {
    if (!userId) return
    async function loadAll() {
      try {
      setLoading(true)
      const results = await Promise.allSettled([
        supabase.from('routine_periods').select('*').eq('user_id', userId).order('start_date'),
        supabase.from('profiles').select('recovery_routines, display_name, avatar_url, skin_type, timezone, survey_submitted_at, beta_tester').eq('id', userId).single(),
        supabase.from('products').select('*').or(`is_catalog.eq.true,user_id.eq.${userId}`),
        supabase.from('extras_periods').select('*').eq('user_id', userId).order('start_date'),
        supabase.from('shower_periods').select('*').eq('user_id', userId).order('start_date'),
        supabase.from('treatments').select('*').eq('user_id', userId),
        supabase.from('custom_treatment_types').select('*').eq('user_id', userId),
        supabase.from('user_programs').select('*').eq('user_id', userId).eq('status', 'active'),
        supabase.from('user_programs').select('id, started_at, status_detail').eq('user_id', userId).eq('status', 'completed'),
      ])
      const getValue = (r) => r.status === 'fulfilled' ? (r.value?.data ?? null) : null
      const [rp, profileRR, pr, ep, sp, tr, ct, up, cp] = results.map(getValue)

      // Active program
      setActivePrograms(up || [])
      setCompletedPrograms(cp || [])
      setOnboardingDone(!!(up?.length > 0 || (rp && rp.length > 0)))

      // Routine periods — convert snake_case from DB to camelCase
      setRoutineHistory((rp || []).map(p => ({
        startDate:       p.start_date,
        endDate:         p.end_date,
        activeName:      p.active_name,
        tretEnabled:     p.tret_enabled,
        tretFrequency:   p.tret_frequency,
        tretStartDate:   p.tret_start_date,
        tretFrequencyHistory: p.tret_frequency_history || [],
        secondaryActives:p.secondary_actives || [],
        bhaEnabled:      p.bha_enabled || false,
        bhaFrequency:    p.bha_frequency || 1,
        bhaStartDay:     p.bha_start_day ?? 6,
        products:        p.products || {},
        steps:           p.steps || null,
        _dbId:           p.id,
        createdAt:       p.created_at,
        updatedAt:       p.updated_at,
      })))

      // Products — single table, catalog + user unified
      const prodMap = {}
      // Load recovery routines from profiles
      if (profileRR?.recovery_routines) setRecoveryRoutines(profileRR.recovery_routines)
      setSkinType(profileRR?.skin_type || '')
      if (profileRR?.timezone) setTimezone(profileRR.timezone)
      // Re-check survey status from DB each load so deletions are reflected
      setSurveySubmitted(!!profileRR?.survey_submitted_at)
      if (profileRR?.beta_tester) setBetaTester(true)
      catalogIds.current = new Set()
      ;(pr || []).forEach(p => {
        if (p.is_catalog) catalogIds.current.add(p.id)
        prodMap[p.id] = {
          id:                  p.id,
          name:                p.name,
          brand:               p.brand,
          category:            p.category,
          imageUrl:            p.image_url,
          purchaseUrl:         p.purchase_url,
          bdsCompliant:        p.bds_compliant,
          effectivenessAvg:    p.effectiveness_avg || 0,  // future: aggregate rating tool
          tags:                (p.tags || []).map(t => t ? t.charAt(0).toUpperCase() + t.slice(1) : t),
          notes:               p.notes || '',
          ingredient_category: p.ingredient_category || '',
          ingredient_form:     p.ingredient_form || '',
          black_owned:         p.black_owned || false,
          indigenous_owned:    p.indigenous_owned || false,
          poc_owned:           p.poc_owned || false,
          woman_owned:         p.woman_owned || false,
          lgbtq_owned:         p.lgbtq_owned || false,
          cruelty_free:        p.cruelty_free || false,
          vegan:               p.vegan || false,
          certified_organic:   p.certified_organic || false,
          fair_trade:          p.fair_trade || false,
          clean_formula:       p.clean_formula || false,
          science_backed:      p.science_backed || false,
          is_prescription:     p.is_prescription || false,
          _isCatalog:          p.is_catalog || false,
          store_name:          p.store_name || '',
          direct_url:          p.direct_url || '',
          direct_store_name:   p.direct_store_name || '',
          description:         p.description || '',
          ingredients:         p.ingredients || '',
          // PAO/expiry — read back here so computeNotifications (and the
          // product form's own PAO fields) actually see saved values;
          // these round-trip through the sync-to-DB effect below, which
          // already expects them under these same snake_case names.
          purchased_at:        p.purchased_at || null,
          opened_at:           p.opened_at || null,
          expires_at:          p.expires_at || null,
          pao_months:          p.pao_months || null,
        }
      })
      setProducts(prodMap)

      // Extras periods
      setDailyHistory((ep || []).map(p => ({ id: p.id, startDate: p.start_date, endDate: p.end_date, items: p.items || [], createdAt: p.created_at, updatedAt: p.updated_at })))

      // Shower periods
      setShowerHistory((sp || []).map(p => ({ id: p.id, startDate: p.start_date, endDate: p.end_date, items: p.items || [], createdAt: p.created_at, updatedAt: p.updated_at })))

      // Treatments — group into arrays per date (multiple treatments allowed per day)
      const treatMap = {}
      ;(tr || []).forEach(t => {
        if (!treatMap[t.date]) treatMap[t.date] = []
        treatMap[t.date].push({ type: t.type, timeOfDay: t.time_of_day, area: t.area, pre: t.pre_days, post: t.post_days, _dbId: t.id })
      })
      setTreatments(treatMap)

      // Custom treatment types
      const ctMap = {}
      ;(ct || []).forEach(t => { ctMap[t.key] = { label: t.label, pre: t.pre_days, post: t.post_days } })
      setCustomTypes(ctMap)

      setLoading(false)
      } catch(err) {
        console.error('loadAll error:', err)
        setLoadError(err)
        setLoading(false)
      }
    }
    loadAll()
  }, [userId, reloadKey])
  const [showTreatments, setShowTreatments] = useState(false)
  const [routineChooserOpen, setRoutineChooserOpen] = useState(false)
  const [showMenu,          setShowMenu]          = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [treatmentWarning,  setTreatmentWarning]  = useState(null) // { key, date } pending selector

  useEffect(() => {
    if (!dayFlyout && !treatmentWarning) return
    function handleKey(e) {
      if (e.key !== 'Escape') return
      if (treatmentWarning) setTreatmentWarning(null)
      else if (dayFlyout) setDayFlyout(null)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [dayFlyout, treatmentWarning])
  const [showFeedback,  setShowFeedback]  = useState(() => {
    const has = new URLSearchParams(window.location.search).get('feedback') === '1'
    if (has) window.history.replaceState({}, '', window.location.pathname)
    return has
  })
  const [showSurvey, setShowSurvey] = useState(false)
  const [surveyDismissed, setSurveyDismissed] = useState(() => {
    try {
      const until = localStorage.getItem('glowup_survey_snooze_until')
      if (until && Date.now() < parseInt(until)) return true
    } catch {}
    return false
  })
  const [programNudgeDismissed, setProgramNudgeDismissed] = useState(() => {
    try { return !!localStorage.getItem('glowup_program_nudge_dismissed') } catch { return false }
  })

  function handleSurveyDismiss() {
    try {
      const count = parseInt(localStorage.getItem('glowup_survey_dismiss_count') || '0') + 1
      if (count >= 3) {
        // Snooze for 7 days and reset counter
        localStorage.setItem('glowup_survey_snooze_until', String(Date.now() + 7 * 24 * 60 * 60 * 1000))
        localStorage.removeItem('glowup_survey_dismiss_count')
      } else {
        localStorage.setItem('glowup_survey_dismiss_count', String(count))
      }
    } catch {}
    setSurveyDismissed(true)
  }
  const [surveySubmitted, setSurveySubmitted] = useState(false)
  const [betaTester,    setBetaTester]    = useState(false)
  const [completedPrograms, setCompletedPrograms] = useState([])
  const [recoveryRoutines, setRecoveryRoutines] = useState({})
  const [skinType, setSkinType] = useState('')
  const [loadError, setLoadError] = useState(null)

  // Persistence
  // Persist calendar month/year
  useEffect(() => { localStorage.setItem('glowup-calendar-month', month); localStorage.setItem('glowup-calendar-year', year) }, [month, year])

  // Persistence — save to Supabase whenever state changes
  // Routine periods
  useEffect(() => {
    if (!userId || loading) return
    async function sync() {
      // Upsert all periods — match by start_date + user_id
      const rows = routineHistory.map(p => ({
        id:                p._dbId,
        user_id:           userId,
        start_date:        p.startDate,
        end_date:          p.endDate || null,
        active_name:       p.activeName,
        tret_enabled:      p.tretEnabled,
        tret_frequency:    p.tretFrequency,
        tret_start_date:   p.tretStartDate || null,
        secondary_actives: p.secondaryActives || [],
        products:          p.products || {},
        steps:             p.steps || null,
      }))
      if (rows.length > 0) await supabase.from('routine_periods').upsert(rows)
    }
    sync()
  }, [routineHistory, userId, loading])

  // Products
  useEffect(() => {
    if (!userId || loading) return
    async function sync() {
      const rows = Object.values(products)
        .filter(p => !p._isCatalog && (!p.id?.startsWith('seed-') || p._modified))
        .map(p => ({
          id: p.id, user_id: userId,
          name: p.name, brand: p.brand, category: p.category,
          image_url: p.imageUrl, purchase_url: p.purchaseUrl,
          bds_compliant: p.bdsCompliant, tags: p.tags || [], notes: p.notes || '',
          ingredient_category: p.ingredient_category || null,
          ingredient_form:     p.ingredient_form || null,
          black_owned:         p.black_owned || false,
          indigenous_owned:    p.indigenous_owned || false,
          poc_owned:           p.poc_owned || false,
          woman_owned:         p.woman_owned || false,
          lgbtq_owned:         p.lgbtq_owned || false,
          cruelty_free:        p.cruelty_free || false,
          vegan:               p.vegan || false,
          certified_organic:   p.certified_organic || false,
          fair_trade:          p.fair_trade || false,
          clean_formula:       p.clean_formula || false,
          science_backed:      p.science_backed || false,
          is_prescription:     p.is_prescription || false,
          purchased_at:        p.purchased_at || null,
          opened_at:           p.opened_at || null,
          expires_at:          p.expires_at || null,
          pao_months:          p.pao_months || null,
        }))
      if (rows.length > 0) await supabase.from('products').upsert(rows)
    }
    sync()
  }, [products, userId, loading])

  // Extras periods
  useEffect(() => {
    if (!userId || loading) return
    async function sync() {
      const rows = dailyHistory.map(p => ({ id: p.id, user_id: userId, start_date: p.startDate, end_date: p.endDate || null, items: p.items || [] }))
      if (rows.length > 0) await supabase.from('extras_periods').upsert(rows)
    }
    sync()
  }, [dailyHistory, userId, loading])

  // Shower periods
  useEffect(() => {
    if (!userId || loading) return
    async function sync() {
      const rows = showerHistory.map(p => ({ id: p.id, user_id: userId, start_date: p.startDate, end_date: p.endDate || null, items: p.items || [] }))
      if (rows.length > 0) await supabase.from('shower_periods').upsert(rows)
    }
    sync()
  }, [showerHistory, userId, loading])

  // Custom treatment types
  useEffect(() => {
    if (!userId || loading) return
    async function sync() {
      const rows = Object.entries(customTypes).map(([key, t]) => ({ user_id: userId, key, label: t.label, pre_days: t.pre, post_days: t.post }))
      if (rows.length > 0) await supabase.from('custom_treatment_types').upsert(rows, { onConflict: 'user_id,key' })
    }
    sync()
  }, [customTypes, userId, loading])


  const allTypes   = { ...BASE_TYPES, ...customTypes }
  const hasRoutine = routineHistory.length > 0
  const notifications = computeNotifications({ products, treatments, allTypes, timezone })
  const unreadCount = notifications.length

  // ── Routine handlers ─────────────────────────────────────

  // Add a new period — auto-sets endDate on the currently active period
  async function saveNewPeriod(form) {
    // Write to Supabase directly — get back the DB id
    const row = {
      user_id: userId, start_date: form.startDate, end_date: form.endDate || null,
      active_name: form.activeName, tret_enabled: form.tretEnabled,
      tret_frequency: form.tretFrequency, tret_start_date: form.tretStartDate || null,
      tret_frequency_history: reconcileTretFrequencyHistory(form),
      secondary_actives: form.secondaryActives || [], products: form.products || {},
      steps: form.steps || null,
    }
    const { data } = await supabase.from('routine_periods').insert(row).select().single()
    const formWithId = { ...form, _dbId: data?.id, createdAt: data?.created_at, updatedAt: data?.created_at }

    setRoutineHistory(h => {
      const prevActive = getActivePeriod(new Date(form.startDate + 'T00:00:00'), h)
      const updated = h.map(p => {
        if (prevActive && p.startDate === prevActive.startDate && p.startDate !== form.startDate) {
          // Also update end date in DB
          supabase.from('routine_periods').update({ end_date: dayBefore(form.startDate) }).eq('id', p._dbId)
          return { ...p, endDate: dayBefore(form.startDate) }
        }
        return p
      })
      // Keep existing periods with same startDate that have different DB ids (shouldn't normally happen but be safe)
      const filtered = updated.filter(p => p.startDate !== form.startDate)
      return [...filtered, formWithId].sort((a, b) => a.startDate.localeCompare(b.startDate))
    })
    setPanel(null)
  }

  // Edit an existing period in place — matches by original startDate stored in editingPeriod
  async function saveEditedPeriod(form) {
    const row = {
      start_date: form.startDate, end_date: form.endDate || null,
      active_name: form.activeName, tret_enabled: form.tretEnabled,
      tret_frequency: form.tretFrequency, tret_start_date: form.tretStartDate || null,
      tret_frequency_history: reconcileTretFrequencyHistory(form),
      secondary_actives: form.secondaryActives || [], products: form.products || {},
      steps: form.steps || null,
    }
    const editNow = new Date().toISOString()
    if (editingPeriod._dbId) {
      await supabase.from('routine_periods').update({ ...row, updated_at: editNow }).eq('id', editingPeriod._dbId)
    }
    setRoutineHistory(h => h.map(p =>
      p.startDate === editingPeriod.startDate ? { ...form, _dbId: editingPeriod._dbId, createdAt: editingPeriod.createdAt, updatedAt: editNow } : p
    ))
    setEditingPeriod(null)
    setPanel(null)
  }

  function cancelEdit() {
    setEditingPeriod(null)
  }

  // ── Daily routine handlers ────────────────────────────────
  async function saveDaily(form) {
    const id = form.id || crypto.randomUUID()
    const now = new Date().toISOString()
    const formWithId = { ...form, id, updatedAt: now, createdAt: form.createdAt || now }
    const row = { id, user_id: userId, start_date: form.startDate, end_date: form.endDate || null, items: form.items || [], updated_at: now }
    await supabase.from('extras_periods').upsert(row)
    setDailyHistory(h => {
      const isNew = !h.find(p => p.id === id)
      if (isNew) {
        // Close out the previously active period
        const prevActive = getActiveDailyPeriod(new Date(form.startDate + 'T00:00:00'), h)
        if (prevActive) {
          supabase.from('extras_periods').update({ end_date: dayBefore(form.startDate) }).eq('id', prevActive.id)
        }
        const updated = h.map(p => prevActive && p.id === prevActive.id
          ? { ...p, endDate: dayBefore(form.startDate) }
          : p
        )
        return [...updated, formWithId].sort((a, b) => a.startDate.localeCompare(b.startDate))
      }
      return [...h.filter(p => p.id !== id), formWithId].sort((a, b) => a.startDate.localeCompare(b.startDate))
    })
    setEditingDaily(null)
  }

  function openDailyEditor(period) {
    if (period === 'new') {
      const current = getActiveDailyPeriod(new Date(), dailyHistory)
      setEditingDaily(current ? { ...current, startDate: '', endDate: null, id: null, _prefill: true } : 'new')
    } else {
      setEditingDaily(period)
    }
    setEditingShower(null)
    setPanel(null)
    setDayFlyout(null)
  }

  // ── Shower routine handlers ───────────────────────────────
  async function saveShower(form) {
    const id = form.id || crypto.randomUUID()
    const now = new Date().toISOString()
    const formWithId = { ...form, id, updatedAt: now, createdAt: form.createdAt || now }
    const row = { id, user_id: userId, start_date: form.startDate, end_date: form.endDate || null, items: form.items || [], updated_at: now }
    await supabase.from('shower_periods').upsert(row)
    setShowerHistory(h => {
      const isNew = !h.find(p => p.id === id)
      if (isNew) {
        const prevActive = getActiveShowerPeriod(new Date(form.startDate + 'T00:00:00'), h)
        if (prevActive) {
          supabase.from('shower_periods').update({ end_date: dayBefore(form.startDate) }).eq('id', prevActive.id)
        }
        const updated = h.map(p => prevActive && p.id === prevActive.id
          ? { ...p, endDate: dayBefore(form.startDate) }
          : p
        )
        return [...updated, formWithId].sort((a, b) => a.startDate.localeCompare(b.startDate))
      }
      return [...h.filter(p => p.id !== id), formWithId].sort((a, b) => a.startDate.localeCompare(b.startDate))
    })
    setEditingShower(null)
  }

  function openShowerEditor(period) {
    if (period === 'new') {
      const current = getActiveShowerPeriod(new Date(), showerHistory)
      setEditingShower(current ? { ...current, startDate: '', endDate: null, id: null, _prefill: true } : 'new')
    } else {
      setEditingShower(period)
    }
    setPanel(null)
    setDayFlyout(null)
  }

  // ── Product handlers ──────────────────────────────────────
  async function saveProduct(product) {
    // Don't write catalog products to the user products table
    if (catalogIds.current.has(product.id)) {
      setEditingProduct(null)
      return
    }
    const row = {
      id: product.id || undefined,
      user_id: userId,
      is_catalog: false,
      name: product.name, brand: product.brand || '', category: product.category,
      image_url: product.imageUrl, purchase_url: product.purchaseUrl,
      bds_compliant: product.bdsCompliant,
      tags: product.tags || [], notes: product.notes || '',
      ingredient_category: product.ingredient_category || null,
      ingredient_form: product.ingredient_form || null,
      store_name: product.store_name || null,
      direct_url: product.direct_url || null,
      direct_store_name: product.direct_store_name || null,
      description: product.description || null,
      ingredients: product.ingredients || null,
      black_owned: product.black_owned || false,
      indigenous_owned: product.indigenous_owned || false,
      poc_owned: product.poc_owned || false,
      woman_owned: product.woman_owned || false,
      lgbtq_owned: product.lgbtq_owned || false,
      cruelty_free: product.cruelty_free || false,
      vegan: product.vegan || false,
      certified_organic: product.certified_organic || false,
      fair_trade: product.fair_trade || false,
      clean_formula: product.clean_formula || false,
      science_backed: product.science_backed || false,
      is_prescription: product.is_prescription || false,
    }
    const { data: saved } = await supabase.from('products').upsert(row, { onConflict: 'name,brand' }).select().single()
    if (saved) setProducts(p => ({ ...p, [saved.id]: { ...product, id: saved.id, _isCatalog: false } }))
    setEditingProduct(null)
  }

  async function deleteProduct(productId) {
    await supabase.from('products').delete().eq('id', productId).eq('user_id', userId)
    setProducts(p => { const n = { ...p }; delete n[productId]; return n })
  }

  // Assigns a product to a specific shower item in the flyout
  function updateShowerItemProduct(periodId, itemId, productId) {
    setShowerHistory(h => h.map(p => {
      if (p.id !== periodId) return p
      const newItems = p.items.map(it => it.id === itemId ? { ...it, productId: productId || null } : it)
      if (p._dbId) supabase.from('shower_periods').update({ items: newItems }).eq('id', p._dbId)
      return { ...p, items: newItems }
    }))
  }

  // Assigns a product to a specific extras (daily) item in the flyout
  function updateDailyItemProduct(periodId, itemId, productId) {
    setDailyHistory(h => h.map(p => {
      if (p.id !== periodId) return p
      const newItems = p.items.map(it => it.id === itemId ? { ...it, productId: productId || null } : it)
      if (p._dbId) supabase.from('extras_periods').update({ items: newItems }).eq('id', p._dbId)
      return { ...p, items: newItems }
    }))
  }

  function updatePeriodStep(periodStartDate, stepId, enabled) {
    const dayType = stepId.split('_')[0]
    setRoutineHistory(h => h.map(p => {
      if (p.startDate !== periodStartDate) return p
      const existingSteps = p.steps?.[dayType] || getDefaultSteps(dayType)
      const updatedSteps = existingSteps.map(s => s.id === stepId ? { ...s, enabled } : s)
      const newSteps = { ...(p.steps || {}), [dayType]: updatedSteps }
      if (p._dbId) supabase.from('routine_periods').update({ steps: newSteps }).eq('id', p._dbId)
      return { ...p, steps: newSteps }
    }))
  }

  // Assigns a product to a specific step in a specific routine period
  // Updates steps without full reload — used by ManageSteps and renderSteps × button
  async function updatePeriodStepsInline(dbId, newSteps) {
    await supabase.from('routine_periods')
      .update({ steps: newSteps, updated_at: new Date().toISOString() })
      .eq('id', dbId)
    setRoutineHistory(prev => prev.map(p =>
      p._dbId === dbId ? { ...p, steps: newSteps } : p
    ))
  }

  async function updatePeriodProducts(periodStartDate, stepKey, productId) {
    if (!periodStartDate) return
    setRoutineHistory(h => h.map(p => {
      if (p.startDate !== periodStartDate) return p
      const newProducts = { ...(p.products || {}) }
      if (productId === null) delete newProducts[stepKey]
      else newProducts[stepKey] = productId
      // Write to DB
      if (p._dbId) supabase.from('routine_periods').update({ products: newProducts }).eq('id', p._dbId)
      return { ...p, products: newProducts }
    }))
  }

  // ── Treatment handlers ────────────────────────────────────
  function openDayFlyout(key, dt, tab) {
    const info = getDayInfo(dt, treatments, allTypes, routineHistory)
    const treatTod = info.isTreatment ? (info.allTreatments?.[0]?.timeOfDay || 'am') : null
    setDayFlyout({ key, date: dt, tab, dayType: info.status, isTreatment: info.isTreatment, treatmentTimeOfDay: treatTod, activeTreatmentType: info.activeTreatmentType || null, allTreatments: info.allTreatments || null })
    setPanel(null)
    setEditingPeriod(null)
    setEditingDaily(null)
    setSelector(null)
  }

  

  async function applyTreatment(type, qure, timeOfDay = 'am', area = 'face', pre, post, newDateKey) {
    const cfg = allTypes[type] || {}
    const effectiveDate = newDateKey || selector.key
    // selector.editingDbId is set when editing an existing entry; null for new ones
    const editingDbId = selector.editingDbId || null
    const row = {
      user_id: userId, date: effectiveDate, type,
      time_of_day: timeOfDay, area, pre_days: pre ?? cfg.pre, post_days: post ?? cfg.post,
    }
    let dbId = editingDbId
    if (dbId) {
      await supabase.from('treatments').update(row).eq('id', dbId)
    } else {
      const { data } = await supabase.from('treatments').insert(row).select().single()
      dbId = data?.id
    }
    const entry = { type, timeOfDay, area, pre: pre ?? cfg.pre, post: post ?? cfg.post, _dbId: dbId }
    setTreatments(t => {
      const next = { ...t }
      // Remove old entry if date changed or we were editing
      if (editingDbId) {
        const oldKey = selector.key
        if (next[oldKey]) {
          next[oldKey] = next[oldKey].filter(e => e._dbId !== editingDbId)
          if (!next[oldKey].length) delete next[oldKey]
        }
        // If date changed, also clean old key
        if (effectiveDate !== oldKey && next[oldKey]) {
          next[oldKey] = next[oldKey].filter(e => e._dbId !== editingDbId)
          if (!next[oldKey].length) delete next[oldKey]
        }
      }
      if (!next[effectiveDate]) next[effectiveDate] = []
      // Replace or append
      const idx = next[effectiveDate].findIndex(e => e._dbId === dbId)
      if (idx >= 0) next[effectiveDate][idx] = entry
      else next[effectiveDate] = [...next[effectiveDate], entry]
      return next
    })
    setSelector(null)
  }

  async function removeTreatment(dbId) {
    // dbId targets a specific entry, not the whole date
    const targetId = dbId || selector.editingDbId
    if (targetId) await supabase.from('treatments').delete().eq('id', targetId)
    setTreatments(t => {
      const next = { ...t }
      for (const key of Object.keys(next)) {
        next[key] = (next[key] || []).filter(e => e._dbId !== targetId)
        if (!next[key].length) delete next[key]
      }
      return next
    })
    setSelector(null)
  }

  // ── Nav ───────────────────────────────────────────────────
  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) } else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) } else setMonth(m => m + 1)
  }

  // ── Export ────────────────────────────────────────────────
  function showToast() { setToast(true); setTimeout(() => setToast(false), 3000) }

  function exportNotion() {
    const lines = ['# Glow-up routine calendar', '', '## Scheduled treatments']
    const sorted = Object.keys(treatments).sort()
    if (!sorted.length) {
      lines.push('No treatments scheduled yet.')
    } else {
      sorted.forEach(tk => {
        const tv  = treatments[tk]
        const cfg = { pre: tv.pre ?? allTypes[tv.type]?.pre ?? 3, post: tv.post ?? allTypes[tv.type]?.post ?? 3, pca: allTypes[tv.type]?.pca ?? false }
        const td  = new Date(tk + 'T00:00:00')
        const pre = new Date(td); pre.setDate(pre.getDate() - cfg.pre)
        const end = new Date(td); end.setDate(end.getDate() + cfg.post)
        const res = new Date(td); res.setDate(res.getDate() + cfg.post + 1)
      })
    }
    lines.push('', '## Routine history')
    ;[...routineHistory].sort((a, b) => b.startDate.localeCompare(a.startDate)).forEach(p => {
      const freq = TRET_FREQUENCIES.find(f => f.key === p.tretFrequency)?.label || p.tretFrequency
      lines.push(`- **From ${p.startDate}:** Tretinoin ${p.tretEnabled ? `${freq} from ${p.tretStartDate}` : 'off'} | BHA ${p.bhaEnabled ? 'on' : 'off'}`)
    })
    lines.push('', '---', '*Exported from GlowUpCalendar*')
    const text = lines.join('\n')
    navigator.clipboard?.writeText(text).then(showToast).catch(() => {
      const ta = document.createElement('textarea')
      ta.value = text; ta.style.position = 'absolute'; ta.style.left = '-9999px'
      document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta)
      showToast()
    })
  }

  // ── Calendar grid ─────────────────────────────────────────
  const firstDow    = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = []

  const prevMonthLastDay = new Date(year, month, 0).getDate()
  for (let i = 0; i < firstDow; i++) {
    const dayNum = prevMonthLastDay - firstDow + i + 1
    cells.push(
      <div key={`prev${i}`} style={{ position: 'relative', borderRadius: 8, border: 'none', background: '#EBFBF2', display: 'flex', flexDirection: 'column', minHeight: '100px' }}>
        <div style={{ fontSize: 10, color: T.darkGreen, padding: '3px 5px', fontWeight: 400, opacity: 0.5 }}>{dayNum}</div>
      </div>
    )
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dt      = new Date(year, month, d)
    const key     = dateKey(dt)
    const info    = getDayInfo(dt, treatments, allTypes, routineHistory)
    const period  = getActivePeriod(dt, routineHistory)
    const isToday = dt.getTime() === now.getTime()
    const s       = info.status

    // Determine treatment time of day (default am for backward compat) —
    // computed before cell coloring below so per-half color can use it.
    const treatmentTimeOfDay = info.isTreatment ? (info.allTreatments?.[0]?.timeOfDay || 'am') : null

    // Each half colors for its own status. On a treatment day, only the
    // half the treatment actually happened in shows the treatment color —
    // the other half shows recovery starting that same day. Tretinoin, BHA,
    // and pause are nighttime-only concepts, so the AM half stays neutral
    // unless it's a treatment or recovery day. Matches the AM/PM badge logic
    // just below, which already does this per-half.
    const amStatusKey = info.isTreatment ? (treatmentTimeOfDay === 'am' ? s : 'recovery') : (PM_ONLY_STATUSES.includes(s) ? null : s)
    const pmStatusKey = info.isTreatment ? (treatmentTimeOfDay === 'pm' ? s : 'recovery') : s

    // Cell fills use the saturated brand color for each status, not the
    // lighter badge tint — badges (which sit on top of the cell) use the
    // light tint + border per the badge spec, but the cell itself is bold.
    function cellFillFor(statusKey) {
      const key = statusKey === 'pca' ? 'recovery' : statusKey
      if (!key || !T[key] || !STATUS_COLORS[key]) return null
      return { bg: STATUS_COLORS[key].fill, text: CELL_LABEL_TEXT[key] }
    }

    const amFill = cellFillFor(amStatusKey)
    const pmFill = cellFillFor(pmStatusKey)
    const amCellBg = amFill?.bg ?? T.white
    const pmCellBg = pmFill?.bg ?? T.white
    const dateColor = T.text

    // Dividers are dark green by default — only the Today cell's outer
    // stroke stays black. The AM/PM divider switches to white whenever
    // either half has a status fill, so it still reads against the color.
    const upperDivider = T.darkGreen
    const lowerDivider = (amFill || pmFill) ? T.white : T.darkGreen
    const cellBorder    = isToday ? T.text : T.darkGreen
    const cellBorderW    = isToday ? '1.5px' : '0.5px'

    // AM badge — tier system, single badge
    // Badge content computed as {colorKey, label} pairs first so AM and PM
    // can be compared — when they'd say the exact same thing, the AM pill
    // is dropped and just the cell color carries the meaning.
    const amBadgeData = (() => {
      // Tier 1 — AM treatment
      if (info.isTreatment && treatmentTimeOfDay === 'am') {
        const count = info.allTreatments?.length || 1
        if (count > 1) {
          const names = [...new Set((info.allTreatments || []).map(t => allTypes[t.type]?.label || t.type))]
            .map(n => n.charAt(0).toUpperCase() + n.slice(1).toLowerCase())
          return { colorKey: s, label: names.join(', ') }
        }
        const lbl = allTypes[s]?.label || s
        return { colorKey: s, label: lbl.charAt(0).toUpperCase() + lbl.slice(1).toLowerCase() }
      }
      // Recovery AM
      if (s === 'pca' || s === 'recovery')
        return { colorKey: 'recovery', label: 'Recovery' }
      // Pause AM
      if (s === 'pause')
        return { colorKey: 'pause', label: 'No actives' }

      return null
    })()

    // PM badge — tier system, single badge per half
    // T1: vitamin A / no actives / recovery (always)
    // T2: secondary actives (always)
    const pmBadgeData = (() => {
      if (info.isTreatment) {
        const count = info.allTreatments?.length || 1
        if (count > 1) {
          const names = [...new Set((info.allTreatments || []).map(t => allTypes[t.type]?.label || t.type))]
            .map(n => n.charAt(0).toUpperCase() + n.slice(1).toLowerCase())
          return { colorKey: s, label: names.join(', ') }
        }
        if (treatmentTimeOfDay === 'pm') {
          const lbl = allTypes[s]?.label || s
          return { colorKey: s, label: lbl.charAt(0).toUpperCase() + lbl.slice(1).toLowerCase() }
        }
        return { colorKey: 'recovery', label: 'Recovery' }
      }
      if (s === 'pause')    return { colorKey: 'pause',    label: 'No actives' }
      if (s === 'pca')      return { colorKey: 'recovery', label: 'Recovery' }
      if (s === 'recovery') return { colorKey: 'recovery', label: 'Recovery' }
      if (s === 'tret') { const an = period?.activeName || 'tretinoin'; return { colorKey: 'tret', label: an.charAt(0).toUpperCase() + an.slice(1) } }
      if (s === 'bha')  return { colorKey: 'bha', label: 'AHA/BHA' }
      return null
    })()

    const sameBadge = !!(amBadgeData && pmBadgeData && amBadgeData.colorKey === pmBadgeData.colorKey && amBadgeData.label === pmBadgeData.label)
    const amBadges = (amBadgeData && !sameBadge) ? [<Badge key="am" colorKey={amBadgeData.colorKey} label={amBadgeData.label} />] : []
    const pmBadges = pmBadgeData ? [<Badge key="pm" colorKey={pmBadgeData.colorKey} label={pmBadgeData.label} />] : []
    const isOpen = dayFlyout?.key === key
    const activePeriod = getActivePeriod(dt, routineHistory)

    cells.push(
      <div key={key} style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', border: `${isOpen ? '1px' : cellBorderW} solid ${isOpen ? T.text : cellBorder}`, display: 'flex', flexDirection: 'column', zIndex: isOpen ? 100 : 1, minHeight: '100px' }}>
        {/* Date row */}
        <div style={{ padding: '3px 6px', background: T.white, borderBottom: `0.5px solid ${upperDivider}`, fontSize: 11, fontWeight: 600, color: isOpen ? T.text : dateColor, textAlign: 'center' }}>
          {d}
        </div>
        {/* AM half */}
        <div
          onClick={e => { e.stopPropagation(); isOpen && dayFlyout?.tab === 'am' ? setDayFlyout(null) : openDayFlyout(key, dt, 'am') }}
          role="button" tabIndex={0} aria-label={`Open AM routine for day ${d}`}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); isOpen && dayFlyout?.tab === 'am' ? setDayFlyout(null) : openDayFlyout(key, dt, 'am') } }}
          style={{ flex: 1, background: isOpen && dayFlyout?.tab === 'am' ? `linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.1)), ${amCellBg}` : amCellBg, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'space-between', padding: '3px 4px', cursor: 'pointer', borderBottom: `0.5px solid ${lowerDivider}`, gap: 2, overflow: 'visible', transition: 'background 0.15s', position: 'relative', zIndex: 1 }}
        >
          <div style={{ fontSize: 9, fontWeight: 600, color: isOpen && dayFlyout?.tab === 'am' ? T.text : (amFill?.text || T.darkGreen), letterSpacing: '0.04em' }}>AM</div>
          {amBadges}
        </div>
        {/* PM half */}
        <div
          onClick={e => { e.stopPropagation(); isOpen && dayFlyout?.tab === 'pm' ? setDayFlyout(null) : openDayFlyout(key, dt, 'pm') }}
          role="button" tabIndex={0} aria-label={`Open PM routine for day ${d}`}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); isOpen && dayFlyout?.tab === 'pm' ? setDayFlyout(null) : openDayFlyout(key, dt, 'pm') } }}
          style={{ flex: 1, background: isOpen && dayFlyout?.tab === 'pm' ? `linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.1)), ${pmCellBg}` : pmCellBg, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'space-between', padding: '3px 4px', cursor: 'pointer', gap: 2, overflow: 'visible', transition: 'background 0.15s', position: 'relative', zIndex: 1 }}
        >
          <div style={{ fontSize: 9, fontWeight: 600, color: isOpen && dayFlyout?.tab === 'pm' ? T.text : (pmFill?.text || T.darkGreen), letterSpacing: '0.04em' }}>PM</div>
          {pmBadges}
        </div>
      </div>
    )
  }

  // Trailing ghost days — fill remaining cells in last row with next month's days
  const totalCells = Math.ceil((firstDow + daysInMonth) / 7) * 7
  const trailingCount = totalCells - firstDow - daysInMonth
  for (let i = 1; i <= trailingCount; i++) {
    cells.push(
      <div key={`next${i}`} style={{ position: 'relative', borderRadius: 8, border: 'none', background: '#EBFBF2', display: 'flex', flexDirection: 'column', minHeight: '100px' }}>
        <div style={{ fontSize: 10, color: T.darkGreen, padding: '3px 5px', fontWeight: 400, opacity: 0.5 }}>{i}</div>
      </div>
    )
  }

  // ── Render ────────────────────────────────────────────────
  // Determine if any overlay panel is open
  const hasOverlay = !!(panel || editingPeriod || editingDaily || editingShower || editingProduct || selector || showExport || showTreatments || showFeedback)

  // Lock body scroll when any overlay panel is open — prevents background scrolling on mobile
  useEffect(() => {
    if (hasOverlay) {
      const y = window.scrollY
      document.body.style.overflow = 'hidden'
      document.body.style.position = 'fixed'
      document.body.style.top = `-${y}px`
      document.body.style.width = '100%'
      return () => {
        document.body.style.overflow = ''
        document.body.style.position = ''
        document.body.style.top = ''
        document.body.style.width = ''
        window.scrollTo(0, y)
      }
    }
  }, [hasOverlay])

  // Lock body scroll when flyout modal is open
  useEffect(() => {
    if (!dayFlyout) return
    const y = window.scrollY
    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.top = `-${y}px`
    document.body.style.width = '100%'
    return () => {
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      window.scrollTo(0, y)
    }
  }, [!!dayFlyout])

  function goToPrevDay() {
    if (!dayFlyout) return
    const d = new Date(dayFlyout.date); d.setDate(d.getDate() - 1)
    openDayFlyout(dateKey(d), d, dayFlyout.tab)
  }
  function goToNextDay() {
    if (!dayFlyout) return
    const d = new Date(dayFlyout.date); d.setDate(d.getDate() + 1)
    openDayFlyout(dateKey(d), d, dayFlyout.tab)
  }

  function updateRecoveryProducts(typeKey, stepKey, productId) {
    setRecoveryRoutines(prev => {
      const existing = prev[typeKey] || { steps: [], products: {} }
      const products = { ...existing.products }
      if (productId === null) delete products[stepKey]
      else products[stepKey] = productId
      return { ...prev, [typeKey]: { ...existing, products } }
    })
  }

  function updateRecoverySteps(typeKey, steps) {
    setRecoveryRoutines(prev => {
      const existing = prev[typeKey] || { steps: [], products: {} }
      return { ...prev, [typeKey]: { ...existing, steps } }
    })
  }

  function getRecoveryStepsForType(typeKey) {
    if (recoveryRoutines[typeKey]?.steps?.length > 0) return recoveryRoutines[typeKey].steps
    return Object.entries(INGREDIENT_CATEGORIES)
      .filter(([, cat]) => cat.dayTypes?.recovery === true)
      .sort(([, a], [, b]) => a.order - b.order)
      .map(([key, cat]) => ({
        id: `recovery_${key}`,
        categoryKey: key,
        label: cat.label,
        optional: cat.optional ?? true,
        enabled: !cat.optional,
        professionalOnly: false,
      }))
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    window.location.reload()
  }

  // Persist recovery routines to profiles whenever they change
  useEffect(() => {
    if (!userId || loading) return
    supabase.from('profiles').upsert({
      id: userId,
      recovery_routines: recoveryRoutines,
      updated_at: new Date().toISOString(),
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recoveryRoutines])

  if (loadError) return (
    <LoadError
      error={loadError}
      onRetry={() => { setLoadError(null); setLoading(true) }}
    />
  )
  if (loading) return <GlowUpLoader />

  // Convenience alias — first active program (for backwards-compat code that only needs one)
  const activeProgram = activePrograms[0] || null

  // Show onboarding for new users who have no routine and no active program
  if (onboardingDone === false) return (
    <Onboarding
      session={session}
      onEnrolled={() => {
        setOnboardingDone(true)
        setReloadKey(k => k + 1)
      }}
      onSkipToBuilder={() => {
        setOnboardingDone(true)
        setPanel('setup')
      }}
    />
  )

  return (
    <>
      {/* Sticky top bar — same structural pattern as Profile/ProductsPage/
          RoutineHistory (sticky, full-bleed) so the side drawer covers it
          consistently everywhere, but white instead of black since this is
          the home page, and the logo stays centered (desktop-only, as
          before) instead of left-aligned since there's no "back to
          calendar" link needed here. Unlike the page content below it,
          this bar is NOT maxWidth-constrained — it needs to reach the true
          viewport edge so the fixed-position drawer (which anchors to the
          real edge, not the centered content column) actually covers it. */}
      <div style={{ background: T.white, position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '10px 20px', minHeight: 44, boxSizing: 'border-box' }}>
          <div className="glowup-cal-logo" style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
            <GlowUpLogo size={32} style={{ color: logoColor.current }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button onClick={() => setShowNotifications(s => !s)}
              aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
              aria-expanded={showNotifications}
              style={{ position: 'relative', border: 'none', background: 'transparent', borderRadius: T.radius.pill, padding: '6px 8px', cursor: 'pointer', color: T.text, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, width: 36, height: 36 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              {unreadCount > 0 && (
                <span aria-hidden="true" style={{ position: 'absolute', top: 2, right: 2, width: 14, height: 14, borderRadius: '50%', background: T.warn, color: '#fff', fontSize: 8, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            <button onClick={() => setShowMenu(s => !s)} aria-label="Menu"
              style={{ border: 'none', background: showMenu ? T.pink : 'transparent', borderRadius: T.radius.pill, padding: '5px 10px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'center', justifyContent: 'center', width: 36, height: 36 }}>
              <span style={{ display: 'block', width: 14, height: 1.5, background: T.text, borderRadius: 0 }} />
              <span style={{ display: 'block', width: 14, height: 1.5, background: T.text, borderRadius: 0 }} />
              <span style={{ display: 'block', width: 14, height: 1.5, background: T.text, borderRadius: 0 }} />
            </button>
          </div>
          {/* Notifications — overlay flyout anchored under the bell, not
              inline content that pushes the page down. */}
          {showNotifications && (
            <>
              <div onClick={() => setShowNotifications(false)} style={{ position: 'fixed', inset: 0, zIndex: 149 }} />
              <div style={{ position: 'absolute', top: '100%', right: 20, marginTop: 8, width: 'min(340px, 90vw)', maxHeight: '70vh', overflowY: 'auto', background: T.white, border: `1px solid ${T.text}`, borderRadius: T.radius.modal, padding: '14px 16px', boxShadow: '0 8px 32px rgba(0,0,0,0.18)', zIndex: 150, animation: 'panelIn 0.15s ease' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 12 }}>Notifications</div>
                {notifications.length === 0 ? (
                  <div style={{ fontSize: 12, color: T.text, opacity: 0.7, fontStyle: 'italic', padding: '8px 0' }}>
                    You're all caught up — nothing needs attention right now.
                  </div>
                ) : notifications.map(n => (
                  <div key={n.id} style={{ display: 'flex', gap: 12, padding: '10px 0', borderTop: `0.5px solid ${T.hairline}` }}>
                    <div style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>
                      {n.type === 'warning' ? '⚠️' : n.type === 'nudge' ? '✅' : 'ℹ️'}
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 2 }}>{n.title}</div>
                      <div style={{ fontSize: 11, color: T.text, opacity: 0.7, lineHeight: 1.6 }}>{n.body}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    <div onClick={() => { if (dayFlyout) setDayFlyout(null) }} style={{ fontFamily: 'inherit', padding: '1rem 0.75rem', maxWidth: 900, width: 'min(100vw, 900px)', boxSizing: 'border-box', position: 'relative', margin: '0 auto', overflow: 'hidden' }}>
      <style>{`html, body { overflow-x: hidden; } @keyframes slideDown { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } } @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } } @keyframes panelIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } } @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } } .glowup-cal-logo { display: flex } @media (max-width: 639px) { .glowup-cal-logo { display: none } }`}</style>

      {/* Program nudge — for users who built their routine manually and have never enrolled in a program */}
      {activePrograms.length === 0 && !programNudgeDismissed && routineHistory.length > 0 && completedPrograms.length === 0 && (() => {
        const firstRoutine = [...routineHistory].sort((a, b) => a.startDate.localeCompare(b.startDate))[0]
        const daysUsing = firstRoutine
          ? Math.floor((now - new Date(firstRoutine.startDate + 'T00:00:00')) / 86400000)
          : 0
        return daysUsing >= 7
      })() && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '10px 14px', background: T.surfaceMuted, border: `1px solid ${T.hairline}`, marginBottom: 12, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 12, color: T.textMuted, fontWeight: 500 }}>
            Ready to level up your routine? Try a guided program — Basic Skincare or Tretinoin Onboarding.
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <button onClick={() => { setPanel('new'); setProgramNudgeDismissed(true); try { localStorage.setItem('glowup_program_nudge_dismissed', '1') } catch {} }}
              style={{ padding: '5px 12px', borderRadius: 0, border: `1px solid ${T.hairline}`, background: T.text, color: '#fff', cursor: 'pointer', fontSize: 11, fontFamily: 'inherit', fontWeight: 600 }}>
              Explore programs
            </button>
            <button onClick={() => { setProgramNudgeDismissed(true); try { localStorage.setItem('glowup_program_nudge_dismissed', '1') } catch {} }}
              style={{ padding: '5px 8px', borderRadius: 0, border: 'none', background: 'transparent', color: T.textMuted, cursor: 'pointer', fontSize: 16, lineHeight: 1, fontFamily: 'inherit' }}>
              ×
            </button>
          </div>
        </div>
      )}

      {/* Beta survey soft banner */}
      {!surveySubmitted && !surveyDismissed && betaTester && (() => {
        // Trigger if ANY active program has completed at least one phase
        if (activePrograms.some(p => p.current_phase_number > 1)) return true
        // Or if any program has been graduated
        return completedPrograms.some(p => p.status_detail === 'graduated')
      })() && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '10px 14px', background: T.pink, border: `1px solid ${T.pinkDeep}`, marginBottom: 12, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 12, color: T.pinkDeep, fontWeight: 500 }}>
            {completedPrograms.some(p => p.status_detail === 'graduated')
              ? "You've completed a program 🎉 — we'd love to know what you think."
              : "You've completed your first phase 🎉 — we'd love to know what you think so far."}
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <button onClick={() => setShowSurvey(true)}
              style={{ padding: '5px 12px', borderRadius: 0, border: 'none', background: T.pinkDeep, color: '#fff', cursor: 'pointer', fontSize: 11, fontFamily: 'inherit', fontWeight: 600 }}>
              Share feedback
            </button>
            <button onClick={() => handleSurveyDismiss()}
              style={{ padding: '5px 8px', borderRadius: 0, border: 'none', background: 'transparent', color: T.pinkDeep, cursor: 'pointer', fontSize: 16, lineHeight: 1, fontFamily: 'inherit' }}>
              ×
            </button>
          </div>
        </div>
      )}

      {/* Beta survey modal */}
      {showSurvey && (
        <BetaSurvey
          session={session}
          betaTester={betaTester}
          alreadySubmitted={surveySubmitted}
          onClose={() => setShowSurvey(false)}
          onSubmitted={() => {
            setShowSurvey(false)
            setSurveySubmitted(true)
            try {
              localStorage.removeItem('glowup_survey_snooze_until')
              localStorage.removeItem('glowup_survey_dismiss_count')
            } catch {}
          }}
        />
      )}
      {/* Active program banners — one per active program */}
      {activePrograms.map(prog => (
        <div key={prog.id} style={{ width: '100%', minWidth: 0, maxWidth: '100%', overflow: 'hidden', boxSizing: 'border-box' }}>
          <ProgramAdvancement
            session={session}
            activeProgram={prog}
            routinePeriod={getActivePeriod(now, routineHistory)}
            treatments={treatments}
            allTypes={allTypes}
            skinType={skinType}
            onAdvanced={() => setReloadKey(k => k + 1)}
          />
        </div>
      ))}

      {/* Toast — always in flow at top, small so it doesn't displace much */}
      {toast && (
        <div style={{ marginBottom: 8, padding: '7px 14px', background: T.surfaceMuted, borderRadius: 0, fontSize: 12, color: T.textMuted, border: `0.5px solid ${T.hairline}` }}>
          Copied — paste into any Notion page
        </div>
      )}

      {/* Month/year with flanking nav arrows — fixed-width center keeps arrows static */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 16, marginBottom: 6 }}>
        <button onClick={prevMonth} aria-label="Previous month" style={{ border: 'none', background: 'transparent', padding: '5px 20px', cursor: 'pointer', fontSize: 18, color: T.text, flexShrink: 0 }}>←</button>
        <div style={{ width: 260, textAlign: 'center' }}>
          <div style={{ fontSize: 'clamp(20px, 4vw, 30px)', fontWeight: 700, color: T.text, lineHeight: 1.1, textTransform: 'uppercase' }}>{MONTHS[month]}</div>
          <div style={{ fontSize: 'clamp(13px, 2.5vw, 18px)', color: T.text, opacity: 0.7, fontWeight: 400, marginTop: 2 }}>{year}</div>
        </div>
        <button onClick={nextMonth} aria-label="Next month" style={{ border: 'none', background: 'transparent', padding: '5px 20px', cursor: 'pointer', fontSize: 18, color: T.text, flexShrink: 0 }}>→</button>
      </div>

      {/* Primary actions — bell + hamburger now live in the sticky header above */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <Btn variant={['update','setup'].includes(panel) ? 'active' : 'primary'}
          style={['update','setup'].includes(panel) ? undefined : { background: T.text, color: T.white }}
          onClick={() => { setPanel(p => ['update','setup'].includes(p) ? null : (hasRoutine ? 'update' : 'setup')); setEditingPeriod(null); setDayFlyout(null) }}>
          + Build your <AccentWord>routine</AccentWord>
        </Btn>
        <Btn variant={showTreatments ? 'active' : 'secondary'}
          style={showTreatments ? undefined : { borderColor: T.text, color: T.text }}
          onClick={() => { setShowTreatments(s => !s); setDayFlyout(null) }}>My treatments</Btn>
        {(month !== now.getMonth() || year !== now.getFullYear()) && (
          <Btn variant="ghost" style={{ color: T.darkGreen }} onClick={() => { setMonth(now.getMonth()); setYear(now.getFullYear()) }}>Today</Btn>
        )}
      </div>


      {/* Treatment warning modal — shown when adding a treatment during an active-ingredient phase */}
      {treatmentWarning && (() => {
        const activePeriod = getActivePeriod(new Date(treatmentWarning.key + 'T00:00:00'), routineHistory)
        const actives = getActiveIngredients(activePeriod)
        const activeList = actives.join(', ')
        return (
          <div onClick={() => setTreatmentWarning(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <div onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="treatment-warning-title" style={{ background: T.white, border: `1px solid ${T.hairline}`, borderRadius: 0, padding: '24px 20px', width: '100%', maxWidth: 420 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: T.pinkDeep, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
                Heads up
              </div>
              <div id="treatment-warning-title" style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 12 }}>
                This treatment will pause your active ingredients
              </div>
              <div style={{ fontSize: 13, color: T.textMuted, lineHeight: 1.8, marginBottom: 20 }}>
                Your routine currently includes <strong style={{ color: T.text }}>{activeList}</strong>. Adding a treatment pauses these actives for any pre-treatment and recovery windows — your program timer extends to match, so you don't lose any progress. Everything picks back up right where you left off once the recovery period ends.
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setTreatmentWarning(null)}
                  style={{ flex: 1, padding: '10px', borderRadius: 0, border: `1px solid ${T.hairline}`, background: 'transparent', color: T.text, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>
                  Cancel
                </button>
                <button onClick={() => {
                  setSelector({ key: treatmentWarning.key, date: treatmentWarning.date })
                  setTreatmentWarning(null)
                }}
                  style={{ flex: 2, padding: '10px', borderRadius: 0, border: 'none', background: T.pinkDeep, color: '#fff', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', fontWeight: 600 }}>
                  Got it — add treatment
                </button>
              </div>
            </div>
          </div>
        )
      })()}
      {dayFlyout && (() => {
        const activePeriodFlyout = getActivePeriod(dayFlyout.date, routineHistory)
        const fmt = new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'long', day: 'numeric' })

        // Colorize the flyout to match this half's routine-item color — same
        // PM-only rule as the calendar cells (tret/bha/pause are a nighttime
        // concept, so an AM flyout on one of those days stays neutral).
        const flyoutInfo = getDayInfo(dayFlyout.date, treatments, allTypes, routineHistory)
        const flyoutTreatmentTod = flyoutInfo.isTreatment ? (flyoutInfo.allTreatments?.[0]?.timeOfDay || 'am') : null
        const flyoutStatusKey = flyoutInfo.isTreatment
          ? (flyoutTreatmentTod === dayFlyout.tab ? flyoutInfo.status : 'recovery')
          : (dayFlyout.tab === 'am' && PM_ONLY_STATUSES.includes(flyoutInfo.status) ? null : flyoutInfo.status)
        const flyoutColorKey = flyoutStatusKey === 'pca' ? 'recovery' : flyoutStatusKey
        const flyoutColors = flyoutColorKey ? STATUS_COLORS[flyoutColorKey] : null
        const flyoutBodyBg = flyoutColors?.fill ?? T.white
        const flyoutHeaderBg = flyoutColors?.dark ?? T.white
        const flyoutHeaderInk = flyoutColors ? T.white : T.text
        // Divider color: white on a colored flyout (for definition against
        // the fill), or green on an otherwise-white flyout — no active
        // status to draw a color from there, so no cream/gray border token
        // either.
        const flyoutBorderColor = flyoutColors ? T.white : T.darkGreen

        return (
          <>
            {/* Backdrop */}
            <div onClick={() => setDayFlyout(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 500 }} />
            {/* Modal */}
            <div
              data-day-flyout="true"
              onClick={e => e.stopPropagation()}
              role="dialog" aria-modal="true" aria-labelledby="day-flyout-title"
              style={{
                position: 'fixed',
                top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 'min(460px, 95vw)',
                maxHeight: '85vh',
                display: 'flex', flexDirection: 'column',
                zIndex: 501,
                borderRadius: T.radius.modal,
                background: flyoutBodyBg,
                // Outer modal edge — commented out for now (liked it, just not here); the
                // color-aware rule this was using (white on color / ink on white) still
                // applies to the internal section dividers via flyoutBorderColor below.
                // border: `2px solid ${flyoutBorderColor}`,
                boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
                animation: 'fadeIn 0.15s ease',
                overflow: 'hidden',
              }}
            >
              {/* Sticky header: prev/next day arrows + date + close */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px 10px', flexShrink: 0, background: flyoutHeaderBg }}>
                <button onClick={goToPrevDay} aria-label="Previous day" style={{ border: 'none', background: 'transparent', borderRadius: T.radius.pill, padding: '5px 12px', cursor: 'pointer', fontSize: 14, color: flyoutHeaderInk, flexShrink: 0 }}>←</button>
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div id="day-flyout-title" style={{ fontSize: 14, fontWeight: 600, color: flyoutHeaderInk }}>{fmt.format(dayFlyout.date)}</div>
                </div>
                <button onClick={goToNextDay} aria-label="Next day" style={{ border: 'none', background: 'transparent', borderRadius: T.radius.pill, padding: '5px 12px', cursor: 'pointer', fontSize: 14, color: flyoutHeaderInk, flexShrink: 0 }}>→</button>
                <button onClick={() => setDayFlyout(null)} aria-label="Close day details" style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 18, color: flyoutHeaderInk, opacity: 0.8, padding: '0 2px', lineHeight: 1, flexShrink: 0 }}>×</button>
              </div>
              {/* Scrollable content */}
              <div style={{ overflowY: 'auto', WebkitOverflowScrolling: 'touch', flex: 1, background: flyoutBodyBg }}>
                <DayFlyout
                  flyout={dayFlyout}
                  borderColor={flyoutBorderColor}
                  bodyIsWhite={!flyoutColors}
                  period={activePeriodFlyout}
                  dailyHistory={dailyHistory}
                  showerHistory={showerHistory}
                  products={products}
                  allTypes={allTypes}
                  onClose={() => setDayFlyout(null)}
                  onTabChange={(t) => setDayFlyout(f => ({ ...f, tab: t }))}
                  onAddTreatment={(editingDbId) => {
                    const activePeriod = getActivePeriod(dayFlyout.date, routineHistory)
                    const activeIngredients = getActiveIngredients(activePeriod)
                    if (activeIngredients.length > 0 && !editingDbId) {
                      setTreatmentWarning({ key: dayFlyout.key, date: dayFlyout.date })
                      setDayFlyout(null)
                    } else {
                      setSelector({ key: dayFlyout.key, date: dayFlyout.date, ...(editingDbId && { editingDbId }) })
                      setDayFlyout(null)
                    }
                  }}
                  onEditDaily={() => openDailyEditor(getActiveDailyPeriod(dayFlyout.date, dailyHistory))}
                  onEditShower={() => openShowerEditor(getActiveShowerPeriod(dayFlyout.date, showerHistory))}
                  onUpdatePeriodProducts={updatePeriodProducts}
                  onUpdatePeriodSteps={updatePeriodStep}
                  onAddProduct={saveProduct}
                  recoveryRoutines={recoveryRoutines}
                  onUpdateRecoveryProducts={updateRecoveryProducts}
                  onUpdateRecoverySteps={updateRecoverySteps}
                  onUpdateShowerItemProduct={updateShowerItemProduct}
                  onUpdateDailyItemProduct={updateDailyItemProduct}
                  session={session}
                  onReload={() => setReloadKey(k => k + 1)}
                  onUpdateSteps={updatePeriodStepsInline}
                  skinType={skinType}
                />
              </div>
            </div>
          </>
        )
      })()}

      {/* Side menu */}
      {showMenu && (
        <SideMenu
          session={session}
          onClose={() => setShowMenu(false)}
          onFeedback={() => { setShowFeedback(true); setShowMenu(false) }}
        />
      )}

      {/* Hint — above day headers */}
      <p style={{ fontSize: 11, color: T.text, opacity: 0.6, marginBottom: 6 }}>
        Tap AM or PM on any date to open the day's routine. Use "Products" to manage your product library. Tap any step to assign a product.
      </p>

      {/* Day headers — always visible */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 3, marginBottom: 3 }}>
        {DAYS.map(d => <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: T.text, opacity: 0.6, padding: '3px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{d}</div>)}
      </div>

      {/* Grid — always visible, never moves */}
      <div onClick={() => { if (dayFlyout) setDayFlyout(null) }} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 'clamp(2px, 0.5vw, 4px)', gridAutoRows: '100px' }}>{cells}</div>

      {/* Overlay — takes over the full page, like Onboarding does on first run */}
      {hasOverlay && (
        <>
          {/* Full-page container — fixed to escape overflow:hidden */}
          <div
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              zIndex: 50,
              background: showTreatments ? T.orange : routineChooserOpen ? T.blue : T.white,
              animation: 'panelIn 0.2s ease',
              overflowY: 'auto',
              WebkitOverflowScrolling: 'touch',
            }}>
            {/* Inner wrapper — centered column, reasonable reading width */}
            <div
              style={{
                maxWidth: 560, margin: '0 auto', minHeight: '100vh',
                display: 'flex', flexDirection: 'column', justifyContent: 'flex-start',
                padding: '64px 20px 48px',
              }}>

            {/* First launch */}
            {!hasRoutine && panel === 'setup' && !editingPeriod && (
              <div style={{ background: T.pink, border: `0.5px solid ${T.pinkDeep}`, borderRadius: 0, padding: '14px 18px', marginBottom: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 6 }}>Welcome! Set up your routine to get started.</div>
                <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 10 }}>Configure your evening actives, secondary treatments, and schedule — it all auto-populates on the calendar.</div>
              </div>
            )}

            {/* Setup form */}
            {panel === 'setup' && !editingPeriod && (
              <RoutinePeriodForm initial={{}} onSave={saveNewPeriod} onCancel={() => setPanel(null)} isFirst={true} allPeriods={routineHistory} products={products} onSaveProduct={saveProduct} userId={userId} />
            )}

            {/* New routine period — tabbed form */}
            {panel === 'update' && !editingPeriod && (
              <NewRoutinePeriodPicker
                routineHistory={routineHistory}
                dailyHistory={dailyHistory}
                showerHistory={showerHistory}
                products={products}
                onSaveNew={(form) => { saveNewPeriod(form); setPanel(null) }}
                onSaveDaily={(form) => { saveDaily(form); setPanel(null) }}
                onSaveShower={(form) => { saveShower(form); setPanel(null) }}
                onCancel={() => setPanel(null)}
                onSaveProduct={saveProduct}
                onEditConflictRoutine={(p) => { setEditingPeriod(p); setPanel(null) }}
                onEditConflictDaily={openDailyEditor}
                onEditConflictShower={openShowerEditor}
                now={now}
                session={session}
                activeProgram={activeProgram}
                activePrograms={activePrograms}
                skinType={skinType}
                timezone={timezone}
                onProgramChanged={() => { setReloadKey(k => k + 1); setPanel(null) }}
                onScreenChange={setRoutineChooserOpen}
              />
            )}

            {/* Edit existing period */}
            {editingPeriod && (
              <RoutinePeriodForm
                initial={editingPeriod}
                onSave={saveEditedPeriod}
                onCancel={cancelEdit}
                isFirst={false}
                allPeriods={routineHistory}
                products={products}
                onSaveProduct={saveProduct}
                onEditConflict={(p) => setEditingPeriod(p)}
                userId={userId}
              />
            )}

            {/* Shower editor */}
            {editingShower && (
              <ShowerEditor
                initial={editingShower === 'new' ? null : editingShower}
                onSave={saveShower}
                onCancel={() => { setEditingShower(null); setDayFlyout(null) }}
                allPeriods={showerHistory}
                onEditConflict={(p) => setEditingShower(p)}
                products={products}
                onSaveProduct={saveProduct}
                userId={userId}
              />
            )}

            {/* Daily editor */}
            {editingDaily && (
              <DailyEditor
                initial={editingDaily === 'new' ? null : editingDaily}
                onSave={saveDaily}
                onCancel={() => { setEditingDaily(null); setDayFlyout(null) }}
                allPeriods={dailyHistory}
                onEditConflict={(p) => setEditingDaily(p)}
                products={products}
                onSaveProduct={saveProduct}
                userId={userId}
              />
            )}

            {/* Product form */}
            {editingProduct && (
              <ProductForm
                initial={editingProduct === 'new' ? undefined : editingProduct}
                onSave={saveProduct}
                onCancel={() => setEditingProduct(null)}
                userId={userId}
                catalogProducts={catalogProducts}
              />
            )}

            {/* Upcoming treatments panel */}
            {showTreatments && (
              <UpcomingTreatmentsPanel
                treatments={treatments}
                recoveryRoutines={recoveryRoutines}
                onUpdateRecoveryProducts={updateRecoveryProducts}
                onUpdateRecoverySteps={updateRecoverySteps}
                getRecoveryStepsForType={getRecoveryStepsForType}
                products={products}
                allTypes={allTypes}
                routineHistory={routineHistory}
                timezone={timezone}
                onClose={() => setShowTreatments(false)}
                onEdit={(key) => {
                  const [y,m,d] = key.split('-').map(Number)
                  setSelector({ key, date: new Date(y,m-1,d) })
                  setShowTreatments(false)
                }}
                onRemove={async (dbId) => {
                  if (await confirm({ title: 'Remove this treatment?', message: 'This cannot be undone.' })) {
                    await removeTreatment(dbId)
                  }
                }}
                onAddNew={(dateStr) => {
                  const [y,m,d] = dateStr.split('-').map(Number)
                  const dt = new Date(y,m-1,d)
                  const activePeriod = getActivePeriod(dt, routineHistory)
                  const activeIngredients = getActiveIngredients(activePeriod)
                  if (activeIngredients.length > 0) {
                    setTreatmentWarning({ key: dateStr, date: dt })
                  } else {
                    setSelector({ key: dateStr, date: dt })
                  }
                  setShowTreatments(false)
                }}
              />
            )}

            {/* Feedback panel */}
            {showFeedback && (
              <FeedbackPanel
                onClose={() => setShowFeedback(false)}
              />
            )}

            {/* Export panel */}
            {showExport && (
              <ExportPanel
                routineHistory={routineHistory}
                treatments={treatments}
                allTypes={allTypes}
                products={products}
                dailyHistory={dailyHistory}
                showerHistory={showerHistory}
                onClose={() => setShowExport(false)}
                onNotion={exportNotion}
                timezone={timezone}
              />
            )}

            {/* Treatment selector */}
            {selector && (
              <TreatmentSelectorPanel
                selector={selector}
                treatments={treatments}
                allTypes={allTypes}
                customTypes={customTypes}
                setCustomTypes={setCustomTypes}
                onApply={applyTreatment}
                onRemove={removeTreatment}
                onClose={() => setSelector(null)}
                routineHistory={routineHistory}
                showerHistory={showerHistory}
                products={products}
              />
            )}
            </div>{/* end centered column */}
          </div>{/* end full-page container */}
        </>
      )}

      {confirmDialog}

    </div>
    </>
  )
}
