/**
 * GlowUpCalendar.jsx
 * ─────────────────────────────────────────────────────────────
 * Melanie's glow-up routine + treatment calendar.
 *
 * ARCHITECTURE
 *   - routineHistory: array of routine periods, each with a startDate.
 *     The calendar finds the most recent period whose startDate <= any
 *     given date and uses those settings to render that day.
 *     Periods can be added (going forward) OR edited in place.
 *   - treatments: one-off treatment events (peels, electrolysis, etc.)
 *   - customTypes: user-defined treatment type definitions
 *
 * LOCALSTORAGE KEYS
 *   'glowup-routine-history'  — routine periods array
 *   'glowup-treatments'       — treatment events object
 *   'glowup-custom-types'     — custom treatment types object (user-added only; base types hardcoded)
 *   'glowup-daily-routine'    — daily routine periods array (brow routine etc.)
 *
 * SUPABASE UPGRADE PATH
 *   Replace localStorage useState initializers with useEffect fetches,
 *   and swap persistence useEffects for Supabase upsert calls.
 *
 * STYLING
 *   All colors live in the T object. Swap for your site tokens.
 *
 * USAGE
 *   import GlowUpCalendar from './components/GlowUpCalendar'
 *   <GlowUpCalendar />
 * ─────────────────────────────────────────────────────────────
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import Avatar from './Avatar'
import { supabase } from '../lib/supabase'
import GlowUpLoader from './GlowUpLoader'
import { LoadError } from './ErrorBoundary'
import Onboarding from './Onboarding'

// ─── DESIGN TOKENS ───────────────────────────────────────────
const T = {
  pink:         '#FFD6F9',
  pinkDeep:     '#F472B6',
  orange:       '#FB923C',
  orangeLight:  '#FED7AA',
  cream:        '#FAF7F2',
  creamDark:    '#F0EBE3',
  text:         '#1C1917',
  textMuted:    '#78716C',
  textLight:    '#A8A29E',
  border:       '#E7E0D8',
  white:        '#FFFFFF',
  tret:         { bg: '#EDE9FE', border: '#A78BFA', text: '#5B21B6' },
  bha:          { bg: '#DCFCE7', border: '#4ADE80', text: '#166534' },
  pause:        { bg: '#FEF3C7', border: '#FCD34D', text: '#92400E' },
  recovery:     { bg: '#FFE4E6', border: '#FB7185', text: '#9F1239' },
  microneedling: { bg: '#FED7AA', border: '#FB923C', text: '#9A3412' },
  massage:      { bg: '#E0F2FE', border: '#38BDF8', text: '#0C4A6E' },
  hairTreatment:      { bg: '#DCFCE7', border: '#4ADE80', text: '#166534' },
  peel:         { bg: '#FFE4E6', border: '#FB7185', text: '#9F1239' },
  electrolysis: { bg: '#EDE9FE', border: '#A78BFA', text: '#5B21B6' },
  facial:       { bg: '#DCFCE7', border: '#4ADE80', text: '#166534' },
  microderm:    { bg: '#E0F2FE', border: '#38BDF8', text: '#0C4A6E' },
  custom:       { bg: '#FFE4E6', border: '#FB7185', text: '#9F1239' },
}

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
    label: 'Oil / balm cleanser', order: 2,
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
    label: 'Eye cream', order: 10,
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

// ─── PRODUCT INGREDIENT TAXONOMY ─────────────────────────────
// Separate from steps — used to tag products for conflict detection
const PRODUCT_INGREDIENT_CATEGORIES = {
  vitamin_c:       { label: 'Vitamin C',          forms: ['L-ascorbic acid (most potent)','Ascorbyl glucoside (stable)','Sodium ascorbyl phosphate','Ascorbyl tetraisopalmitate (oil-soluble)','Vitamin C powder (mix-in)','Other vitamin C derivative'] },
  niacinamide:     { label: 'Niacinamide',         forms: ['Niacinamide serum','Niacinamide toner','Other'] },
  hyaluronic_acid: { label: 'Hyaluronic acid',     forms: ['Low molecular weight','High molecular weight','Multi-weight blend','Other'] },
  peptides:        { label: 'Peptides',             forms: ['Matrixyl','Argireline','Copper peptides','Other peptides'] },
  retinoid:        { label: 'Retinoid',             forms: ['Tretinoin (prescription)','Adapalene','Retinol','Retinaldehyde','Tazarotene','Other retinoid'] },
  aha:             { label: 'AHA',                  forms: ['Glycolic acid','Lactic acid','Mandelic acid','Citric acid','Other AHA'] },
  bha:             { label: 'BHA',                  forms: ['Salicylic acid (leave-on)','Salicylic acid (rinse-off)','Betaine salicylate','Other BHA'] },
  pha:             { label: 'PHA',                  forms: ['Gluconolactone','Lactobionic acid','Other PHA'] },
  azelaic_acid:    { label: 'Azelaic acid',         forms: ['10% or under (OTC)','15-20% (prescription)','Other'] },
  benzoyl_peroxide:{ label: 'Benzoyl peroxide',     forms: ['2.5%','5%','10%'] },
  tranexamic_acid: { label: 'Tranexamic acid',      forms: ['Tranexamic acid serum','Other'] },
  alpha_arbutin:   { label: 'Alpha arbutin',        forms: ['Alpha arbutin serum','Other'] },
  kojic_acid:      { label: 'Kojic acid',           forms: ['Kojic acid serum','Other'] },
  bakuchiol:       { label: 'Bakuchiol',            forms: ['Bakuchiol serum','Other'] },
  centella:        { label: 'Centella / Cica',      forms: ['Centella serum','Cica cream','Madecassoside serum','Other'] },
  snail_mucin:     { label: 'Snail mucin',          forms: ['Snail mucin essence','Snail mucin serum','Other'] },
  antioxidant:     { label: 'Antioxidant',          forms: ['Resveratrol','Coenzyme Q10','Vitamin E','Ferulic acid','Other antioxidant'] },
  ceramide:        { label: 'Ceramide',             forms: ['Ceramide serum','Ceramide moisturizer','Other'] },
  squalane:        { label: 'Squalane',             forms: ['100% squalane','Squalane blend','Other'] },
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
function getPeriodStatus(p) {
  const today = new Date(); today.setHours(0,0,0,0)
  const start = new Date(p.startDate + 'T00:00:00')
  const end   = p.endDate ? new Date(p.endDate + 'T00:00:00') : null
  if (start > today) return 'upcoming'
  if (!end || end >= today) return 'current'
  return 'past'
}

function fmtDate(dateStr) {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-')
  return `${m}/${d}/${y}`
}

function fmtDateTime(isoStr) {
  if (!isoStr) return ''
  const dt = new Date(isoStr)
  return dt.toLocaleString(undefined, {
    month: '2-digit', day: '2-digit', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  })
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



function getActivePeriod(dt, history) {
  const key = dateKey(dt)
  const sorted = [...history].sort((a, b) => a.startDate.localeCompare(b.startDate))
  let active = null
  for (const p of sorted) { if (p.startDate <= key) active = p }
  return active
}

function getTretBhaStatus(dt, period) {
  if (!period?.tretEnabled) return null
  const tretStart = period.tretStartDate ? new Date(period.tretStartDate + 'T00:00:00') : null
  if (!tretStart || isNaN(tretStart) || dt < tretStart) return null
  const daysIn = Math.round((dt - tretStart) / 86400000)
  const dow    = dt.getDay()
  switch (period.tretFrequency) {
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

function getDayInfo(dt, treatments, allTypes, routineHistory) {
  const key = dateKey(dt)
  if (treatments[key]) return { status: treatments[key].type, isTreatment: true }
  for (const [tk, tv] of Object.entries(treatments)) {
    const td   = new Date(tk + 'T00:00:00')
    const cfg  = allTypes[tv.type] || { pre: 3, post: 3, pca: false }
    const diff = Math.round((dt - td) / 86400000)
    if (diff >= -cfg.pre && diff <= -1)      return { status: 'pause',    isTreatment: false }
    if (diff >= 1 && diff <= cfg.post)       return { status: cfg.pca ? 'pca' : 'recovery', isTreatment: false, activeTreatmentType: tv.type }
  }
  const period  = getActivePeriod(dt, routineHistory)
  const tretBha = getTretBhaStatus(dt, period)
  if (tretBha && tretBha !== 'rest') return { status: tretBha, isTreatment: false }
  return { status: 'none', isTreatment: false }
}

function isMassageDay(dt, info, period) {
  if (!period?.massageEnabled) return false
  if (info.isTreatment || ['pause','pca','recovery'].includes(info.status)) return false
  return period.massageDays.includes(dt.getDay())
}


// ─── UI PRIMITIVES ───────────────────────────────────────────
function Badge({ colorKey, label }) {
  const c = T[colorKey] || T.custom
  return (
    <span style={{ fontSize: 9, fontWeight: 600, padding: '2px 5px', borderRadius: 0, background: c.bg, color: c.text, border: `0.5px solid ${c.border}`, display: 'inline-block', lineHeight: 1.5, whiteSpace: 'nowrap', overflow: 'hidden', maxWidth: '100%', textOverflow: 'ellipsis', letterSpacing: '0.02em' }}>
      {label}
    </span>
  )
}


function Btn({ onClick, children, variant = 'default', style: sx = {}, disabled = false }) {
  const base = { padding: '6px 14px', borderRadius: 0, fontSize: 12, cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.5 : 1 }
  const variants = {
    default:   { border: `0.5px solid ${T.border}`,   background: 'transparent', color: T.textMuted },
    primary:   { border: `0.5px solid ${T.pinkDeep}`, background: T.pink,        color: T.text, fontWeight: 600 },
    danger:    { border: '0.5px solid #FB7185',        background: 'transparent', color: '#9F1239' },
    secondary: { border: `0.5px solid ${T.border}`,   background: T.creamDark,   color: T.text },
    active:    { border: `0.5px solid ${T.pinkDeep}`, background: T.pink,        color: T.text },
  }
  return <button onClick={onClick} disabled={disabled} style={{ ...base, ...variants[variant], ...sx }}>{children}</button>
}

function SectionLabel({ children }) {
  return <div style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, marginTop: 14, paddingTop: 12, borderTop: `0.5px solid ${T.border}` }}>{children}</div>
}

function FieldLabel({ children }) {
  return <div style={{ fontSize: 11, color: T.textLight, marginBottom: 3 }}>{children}</div>
}

function TextInput({ value, onChange, placeholder, width = 140 }) {
  return <input type="text" value={value} onChange={onChange} placeholder={placeholder} style={{ width, fontSize: 12, padding: '5px 2px', border: 'none', borderBottom: '1px solid #000000', borderRadius: 0, background: 'transparent', color: T.text, outline: 'none' }} />
}

function NumberInput({ value, onChange, min = 0, max = 14, width = 60 }) {
  return <input type="number" value={value} onChange={onChange} min={min} max={max} style={{ width, fontSize: 12, padding: '5px 2px', border: 'none', borderBottom: '1px solid #000000', borderRadius: 0, background: 'transparent', color: T.text, outline: 'none' }} />
}

function DateInput({ value, onChange, disabled = false }) {
  return <input type="date" value={value} onChange={onChange} disabled={disabled} style={{ fontSize: 12, padding: '5px 2px', border: 'none', borderBottom: '1px solid #000000', borderRadius: 0, background: 'transparent', color: disabled ? T.textMuted : T.text, outline: 'none', cursor: disabled ? 'not-allowed' : 'auto' }} />
}

function Toggle({ checked, onChange, label }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 0, cursor: 'pointer', background: T.creamDark, border: `0.5px solid ${T.border}`, fontSize: 12, color: T.text, marginBottom: 6 }}>
      <input type="checkbox" checked={checked} onChange={onChange} style={{ width: 14, height: 14, cursor: 'pointer', accentColor: T.pinkDeep }} />
      {label}
    </label>
  )
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
  for (const [tk, tv] of Object.entries(treatments)) {
    if (tk === proposedKey) continue
    const td = new Date(tk + 'T00:00:00')
    const ec = { pre: tv.pre ?? allTypes[tv.type]?.pre ?? 3, post: tv.post ?? allTypes[tv.type]?.post ?? 3 }
    const diff = Math.round((proposedDt - td) / 86400000)
    if (diff >= -ec.pre && diff <= ec.post) {
      const dir = diff < 0 ? `${Math.abs(diff)}d before` : `${diff}d after`
      conflicts.push({
        kind: 'treatment',
        message: `Falls inside ${allTypes[tv.type]?.label || tv.type} window (${tk})`,
        detail: `That treatment needs ${ec.pre}d before + ${ec.post}d after clear. You're ${dir} it.`
      })
    }
  }

  // (b) An existing treatment falls inside this treatment's own pre-window
  for (const [tk, tv] of Object.entries(treatments)) {
    if (tk === proposedKey) continue
    const td = new Date(tk + 'T00:00:00')
    const diffExisting = Math.round((td - proposedDt) / 86400000)
    if (diffExisting < 0 && diffExisting >= -cfg.pre) {
      conflicts.push({
        kind: 'treatment',
        message: `Pre-treatment window conflicts with ${allTypes[tv.type]?.label || tv.type} (${tk})`,
        detail: `This treatment needs ${cfg.pre}d clear before it. That treatment is ${Math.abs(diffExisting)}d prior.`
      })
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
        detail: `This treatment needs ${cfg.post}d recovery. Your retinoid starts in ${daysToTret}d — you won't be healed in time.`
      })
    }

    // Treatment is AFTER tret start — does it fall inside tret's required pre-pause?
    if (daysToTret < 0 && daysToTret >= -cfg.pre) {
      conflicts.push({
        kind: 'tret',
        message: `Too close to ${period.activeName || 'Tretinoin'} start (${period.tretStartDate})`,
        detail: `This treatment needs ${cfg.pre}d retinoid pause before it. Your retinoid started ${Math.abs(daysToTret)}d ago — not enough time.`
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
function RoutinePeriodForm({ initial = {}, onSave, onCancel, isFirst = false, lockStartDate = false, allPeriods = [], onEditConflict, products = {}, onSaveProduct }) {
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
    <div style={{ background: T.white, border: `0.5px solid ${T.border}`, borderRadius: 0, padding: '16px 18px', marginBottom: 14 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 4 }}>
        {isFirst ? 'Skincare routine' : lockStartDate ? `Skincare routine — editing from ${fmtDate(initial.startDate)}` : 'Skincare routine'}
      </div>
      {!isFirst && !lockStartDate && (
        <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 12 }}>Past months stay accurate. This adds a new period; it doesn't overwrite history.</div>
      )}
      {lockStartDate && (
        <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 12 }}>You can edit the start date — if it overlaps with another period you'll be prompted to resolve it first.</div>
      )}

      <div style={{ marginBottom: 10 }}>
        <FieldLabel>{isFirst ? 'Routine start date' : 'Effective from'}</FieldLabel>
        <DateInput value={form.startDate} onChange={e => set('startDate', e.target.value)} />
      </div>

      {conflict && <ConflictMessage conflict={conflict} onEditConflict={onEditConflict} />}

      <SectionLabel>What does your skincare routine consist of?</SectionLabel>
      <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 12, lineHeight: 1.6, background: T.creamDark, borderRadius: 0, padding: '10px 12px' }}>
        Your morning and evening steps — from cleanse to SPF, actives, and treatments. Toggle on what you use and we'll build your calendar around it.
      </div>

      {/* Retinoid toggle */}
      <div style={{ marginBottom: 4, padding: '10px 12px', borderRadius: 0, border: `0.5px solid ${form.tretEnabled ? T.pinkDeep : T.border}`, background: form.tretEnabled ? T.pink : T.white }}>
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
          <input type="checkbox" checked={form.tretEnabled} onChange={e => set('tretEnabled', e.target.checked)} style={{ width: 14, height: 14, marginTop: 2, cursor: 'pointer', accentColor: T.pinkDeep }} />
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>Retinoid (vitamin A)</div>
            <div style={{ fontSize: 11, color: T.textMuted }}>Tretinoin, adapalene, retinol, retinaldehyde, and more — prescription or over the counter</div>
          </div>
        </label>
      </div>
      {form.tretEnabled && (
        <div style={{ marginLeft: 12, marginBottom: 8, paddingLeft: 12, borderLeft: `2px solid ${T.pinkDeep}` }}>
          <div style={{ marginBottom: 8, marginTop: 8 }}>
            <FieldLabel>Which one?</FieldLabel>
            <select
              value={MAIN_ACTIVE_OPTIONS.find(o => o.value === form.activeName) ? form.activeName : 'tretinoin'}
              onChange={e => set('activeName', e.target.value)}
              style={{ fontSize: 12, padding: '5px 8px', border: `0.5px solid ${T.border}`, borderRadius: 0, background: T.cream, color: T.text }}
            >
              {MAIN_ACTIVE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          {(form.activeName === 'other' || !MAIN_ACTIVE_OPTIONS.find(o => o.value === form.activeName)) && (
            <div style={{ marginBottom: 8 }}>
              <FieldLabel>Name it</FieldLabel>
              <TextInput value={MAIN_ACTIVE_OPTIONS.find(o => o.value === form.activeName) ? '' : form.activeName} onChange={e => set('activeName', e.target.value)} placeholder="e.g. clindamycin, azelaic" width={200} />
            </div>
          )}
          <div style={{ marginBottom: 8 }}>
            <FieldLabel>When did you start?</FieldLabel>
            <DateInput value={form.tretStartDate} onChange={e => set('tretStartDate', e.target.value)} />
          </div>
          <FieldLabel>How often?</FieldLabel>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 6, marginBottom: 6 }}>
            {TRET_FREQUENCIES.map(f => (
              <button key={f.key} onClick={() => set('tretFrequency', f.key)} style={{ border: `0.5px solid ${form.tretFrequency === f.key ? T.pinkDeep : T.border}`, borderRadius: 0, padding: '8px 10px', cursor: 'pointer', background: form.tretFrequency === f.key ? T.pink : T.white, textAlign: 'left' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{f.label}</div>
                <div style={{ fontSize: 10, color: T.textLight }}>{f.description}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Other evening actives */}
      {form.tretEnabled && (
        <div style={{ fontSize: 11, color: T.textMuted, margin: '8px 0 6px', paddingLeft: 2 }}>
          <strong style={{ color: T.text }}>Active nights</strong> = nights you use your main evening treatment. <strong style={{ color: T.text }}>Off nights</strong> = the other evenings.
        </div>
      )}
      {AVAILABLE_SECONDARY_ACTIVES.map(def => {
        const sa = (form.secondaryActives || []).find(a => a.key === def.key) || { key: def.key, enabled: false, nights: def.defaultNights }
        const enabled = sa.enabled
        const showNightsOptions = form.tretEnabled
        const incompatWarning = enabled && showNightsOptions ? SECONDARY_INCOMPATIBILITIES[def.key]?.[sa.nights] : null
        return (
          <div key={def.key} style={{ marginBottom: 4, padding: '10px 12px', borderRadius: 0, border: `0.5px solid ${enabled ? T.pinkDeep : T.border}`, background: enabled ? T.pink : T.white }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
              <input type="checkbox" checked={enabled} onChange={e => {
                const base = form.secondaryActives || AVAILABLE_SECONDARY_ACTIVES.map(a => ({ key: a.key, enabled: false, nights: a.defaultNights }))
                set('secondaryActives', base.map(a => a.key === def.key ? { ...a, enabled: e.target.checked } : a))
              }} style={{ width: 14, height: 14, marginTop: 2, cursor: 'pointer', accentColor: T.pinkDeep }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: T.text }}>{def.label}</div>
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
                          }} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 0, cursor: 'pointer', border: `0.5px solid ${sa.nights === n.key ? T.pinkDeep : T.border}`, background: sa.nights === n.key ? T.white : 'transparent', fontWeight: sa.nights === n.key ? 600 : 400, color: isIncompat ? '#92400E' : (sa.nights === n.key ? T.text : T.textLight), whiteSpace: 'nowrap' }}>
                            {n.label}{isIncompat ? ' ⚠' : ''}
                          </button>
                        )
                      })}
                    </div>
                    {incompatWarning && (
                      <div style={{ fontSize: 10, color: '#92400E', background: '#FFFBEB', border: '0.5px solid #FCD34D', borderRadius: 0, padding: '5px 8px', marginTop: 5, lineHeight: 1.5 }}>
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
                      }} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 0, cursor: 'pointer', border: `0.5px solid ${sa.nights === n.key ? T.pinkDeep : T.border}`, background: sa.nights === n.key ? T.white : 'transparent', fontWeight: sa.nights === n.key ? 600 : 400, color: sa.nights === n.key ? T.text : T.textLight, whiteSpace: 'nowrap' }}>
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



      <SectionLabel>Product assignments (optional)</SectionLabel>
      <div style={{ marginBottom: 8 }}>
        <Btn onClick={() => setShowProducts(s => !s)} style={{ fontSize: 11, padding: '4px 10px', marginBottom: 8 }}>{showProducts ? 'Hide products' : 'Assign products to steps'}</Btn>
        {showProducts && (
          <div>
            <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 8 }}>Assign products to each routine step. Unassigned steps will be faded in the day flyout.</div>
            {/* Product assignment split by routine section */}
            {[
              { section: 'Morning', steps: getDefaultSteps('am') },
              { section: form.activeName ? `Active nights (${form.activeName})` : 'Active nights', steps: getDefaultSteps('main') },
              { section: 'Off nights', steps: [
                ...getDefaultSteps('off'),
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
                  <div onClick={() => setOpenStep(isOpen ? null : sid)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 0, border: `0.5px solid ${isOpen ? T.pinkDeep : T.border}`, cursor: 'pointer', background: isOpen ? T.pink : T.white }}>
                    <div style={{ fontSize: 11, fontWeight: 500, color: T.text, flex: 1 }}>{step.label}</div>
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

      <div style={{ borderTop: `0.5px solid ${T.border}`, paddingTop: 12, marginTop: 14, display: 'flex', gap: 8 }}>
        <Btn variant="primary" onClick={() => canSave && onSave(form)} disabled={!canSave}>
          {lockStartDate ? 'Save changes' : 'Save routine'}
        </Btn>
        <Btn onClick={onCancel}>Cancel</Btn>
      </div>
    </div>
  )
}

// ─── ROUTINE HISTORY PANEL ───────────────────────────────────

// ─── TOOLTIP ─────────────────────────────────────────────────
function InfoTooltip({ text }) {
  const [pos, setPos] = useState(null)
  const ref = useRef(null)
  function show() {
    if (ref.current) {
      const r = ref.current.getBoundingClientRect()
      setPos({ top: r.top - 8, left: r.left + r.width / 2 })
    }
  }
  return (
    <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', marginLeft: 4 }}>
      <span ref={ref} onMouseEnter={show} onMouseLeave={() => setPos(null)}
        onTouchStart={e => { e.stopPropagation(); pos ? setPos(null) : show() }}
        style={{ width: 14, height: 14, borderRadius: '50%', background: T.border, color: T.textMuted, fontSize: 9, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'default', userSelect: 'none', flexShrink: 0 }}
      >i</span>
      {pos && (
        <span style={{ position: 'fixed', top: pos.top, left: Math.min(pos.left, window.innerWidth - 240), transform: 'translate(-50%, -100%)', background: T.text, color: T.white, fontSize: 11, lineHeight: 1.5, padding: '8px 10px', borderRadius: 0, width: 220, zIndex: 9999, boxShadow: '0 4px 16px rgba(0,0,0,0.15)', pointerEvents: 'none' }}>
          {text}
          <span style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', borderWidth: 4, borderStyle: 'solid', borderColor: `${T.text} transparent transparent transparent` }} />
        </span>
      )}
    </span>
  )
}

function RoutineHistoryPanel({ history, onClose, onEdit, onDelete, onAddNew, getActivePeriod, dailyHistory, onEditDaily, onDeleteDaily, showerHistory, onEditShower, onDeleteShower }) {
  const sorted = [...history].sort((a, b) => b.startDate.localeCompare(a.startDate)).slice(0, 3)
  return (
    <div style={{ background: T.white, border: `0.5px solid ${T.border}`, borderRadius: 0, padding: '16px 18px', marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>Routine history</div>
        <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 18, color: T.textMuted, padding: '0 2px', lineHeight: 1 }}>×</button>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Skincare Routine</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Btn variant="primary" onClick={e => { e.stopPropagation(); onAddNew() }} style={{ padding: '3px 10px', fontSize: 11 }}>+ Start new routine</Btn>
          <InfoTooltip text="Add a new routine when your approach is changing — it preserves your history and lets you track what you used before. Edit when you're correcting a mistake. Think of each routine as a chapter." />
        </div>
      </div>

      {sorted.length === 0 && (
        <div style={{ fontSize: 12, color: T.textMuted, background: T.creamDark, borderRadius: 0, padding: '12px 14px', lineHeight: 1.6 }}>
          No skincare routine saved yet. Hit <strong>+ Start new routine</strong> to set up your first one.
        </div>
      )}

      {sorted.map((p, i) => {
        const freq = TRET_FREQUENCIES.find(f => f.key === p.tretFrequency)?.label || p.tretFrequency
        return (
          <div key={p.startDate} style={{ borderTop: i > 0 ? `0.5px solid ${T.border}` : 'none', paddingTop: i > 0 ? 12 : 0, marginTop: i > 0 ? 12 : 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>
                  {(() => {
                    const status = getPeriodStatus(p)
                    if (status === 'current') return `Current routine (as of ${fmtDate(p.startDate)})`
                    if (status === 'upcoming') return `Upcoming — starts ${fmtDate(p.startDate)}`
                    return `${fmtDate(p.startDate)} — ${p.endDate ? fmtDate(p.endDate) : '—'}`
                  })()}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <Btn onClick={() => onEdit(p)} style={{ padding: '3px 10px', fontSize: 11 }}>Edit</Btn>
                <button onClick={() => { if (window.confirm('Delete this skincare routine period? This cannot be undone.')) onDelete(p.startDate) }} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: T.textLight, fontSize: 16, padding: '0 4px', lineHeight: 1 }}>×</button>
              </div>
            </div>
            <div style={{ fontSize: 11, color: T.textMuted, lineHeight: 1.8 }}>
              <span>{p.activeName ? (p.activeName.charAt(0).toUpperCase() + p.activeName.slice(1)) : 'Retinoid'}: {p.tretEnabled ? `${freq}, from ${fmtDate(p.tretStartDate)}` : 'off'}</span> &nbsp;·&nbsp;
              <span>{
                p.secondaryActives
                  ? (() => {
                      const enabled = p.secondaryActives.filter(sa => sa.enabled)
                      if (!enabled.length) return 'No secondary actives'
                      return enabled.map(sa => {
                        const def = AVAILABLE_SECONDARY_ACTIVES.find(a => a.key === sa.key)
                        return def?.label.split('/')[0].split('(')[0].trim() || sa.key
                      }).join(', ')
                    })()
                  : `BHA: ${p.bhaEnabled ? 'on' : 'off'}`
              }</span>
            </div>
            {(p.updatedAt || p.createdAt) && (
              <div style={{ fontSize: 10, color: T.textLight, marginTop: 5, fontStyle: 'italic', lineHeight: 1.6 }}>
                {p.createdAt && <div>Created: {fmtDateTime(p.createdAt)}</div>}
                {p.updatedAt && p.createdAt && p.updatedAt !== p.createdAt && (
                  <div>Last edited: {fmtDateTime(p.updatedAt)}</div>
                )}
              </div>
            )}
          </div>
        )
      })}

      {/* Daily routine history */}
      <div style={{ borderTop: `0.5px solid ${T.border}`, marginTop: 16, paddingTop: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Extras</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Btn onClick={() => onEditDaily('new')} variant="primary" style={{ padding: '3px 10px', fontSize: 11 }}>+ Start new routine</Btn>
            <InfoTooltip text="Add a new routine when your approach is changing — it preserves your history and lets you track what you used before. Edit when you're correcting a mistake. Think of each routine as a chapter." />
          </div>
        </div>
        {(!dailyHistory || dailyHistory.length === 0) && (
          <div style={{ fontSize: 12, color: T.textLight, fontStyle: 'italic' }}>No extras saved yet — add brow serums, eye patches, tools, and more.</div>
        )}
        {[...(dailyHistory || [])].sort((a, b) => b.startDate.localeCompare(a.startDate)).slice(0, 3).map((p, i) => (
          <div key={p.id} style={{ borderTop: i > 0 ? `0.5px solid ${T.border}` : 'none', paddingTop: i > 0 ? 12 : 0, marginTop: i > 0 ? 12 : 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>
                {(() => {
                    const status = getPeriodStatus(p)
                    if (status === 'current') return `Current (as of ${fmtDate(p.startDate)})`
                    if (status === 'upcoming') return `Upcoming — starts ${fmtDate(p.startDate)}`
                    return `${fmtDate(p.startDate)} — ${p.endDate ? fmtDate(p.endDate) : '—'}`
                  })()}
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <Btn onClick={() => onEditDaily(p)} style={{ padding: '3px 10px', fontSize: 11 }}>Edit</Btn>
                <button onClick={() => { if (window.confirm('Delete this extras period? This cannot be undone.')) onDeleteDaily(p.id) }} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: T.textLight, fontSize: 16, padding: '0 4px', lineHeight: 1 }}>×</button>
              </div>
            </div>
            <div style={{ fontSize: 11, color: T.textMuted, lineHeight: 1.8 }}>
              {p.items.map(it => it.label).join(' · ') || 'No items'}
            </div>
            {(p.updatedAt || p.createdAt) && (
              <div style={{ fontSize: 10, color: T.textLight, marginTop: 4, fontStyle: 'italic' }}>
                {p.createdAt && <div>Created: {fmtDateTime(p.createdAt)}</div>}
                {p.updatedAt && p.createdAt && p.updatedAt !== p.createdAt && (
                  <div>Last edited: {fmtDateTime(p.updatedAt)}</div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Shower routine history */}
      <div style={{ borderTop: `0.5px solid ${T.border}`, marginTop: 16, paddingTop: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Shower Routine</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Btn onClick={() => onEditShower('new')} variant="primary" style={{ padding: '3px 10px', fontSize: 11 }}>+ Start new routine</Btn>
            <InfoTooltip text="Add a new routine when your approach is changing — it preserves your history and lets you track what you used before. Edit when you're correcting a mistake. Think of each routine as a chapter." />
          </div>
        </div>
        {(!showerHistory || showerHistory.length === 0) && (
          <div style={{ fontSize: 12, color: T.textLight, fontStyle: 'italic' }}>No shower routine saved yet — add body washes, hair treatments, and more.</div>
        )}
        {[...(showerHistory || [])].sort((a, b) => b.startDate.localeCompare(a.startDate)).slice(0, 3).map((p, i) => (
          <div key={p.id} style={{ borderTop: i > 0 ? `0.5px solid ${T.border}` : 'none', paddingTop: i > 0 ? 12 : 0, marginTop: i > 0 ? 12 : 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>
                {(() => {
                    const status = getPeriodStatus(p)
                    if (status === 'current') return `Current (as of ${fmtDate(p.startDate)})`
                    if (status === 'upcoming') return `Upcoming — starts ${fmtDate(p.startDate)}`
                    return `${fmtDate(p.startDate)} — ${p.endDate ? fmtDate(p.endDate) : '—'}`
                  })()}
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <Btn onClick={() => onEditShower(p)} style={{ padding: '3px 10px', fontSize: 11 }}>Edit</Btn>
                <button onClick={() => { if (window.confirm('Delete this shower routine period? This cannot be undone.')) onDeleteShower(p.id) }} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: T.textLight, fontSize: 16, padding: '0 4px', lineHeight: 1 }}>×</button>
              </div>
            </div>
            <div style={{ fontSize: 11, color: T.textMuted, lineHeight: 1.8 }}>
              {(p.items || []).map(it => `${it.label} (${SHOWER_FREQUENCIES.find(f=>f.key===it.frequency)?.label||it.frequency})`).join(' · ') || 'No items'}
            </div>
            {(p.updatedAt || p.createdAt) && (
              <div style={{ fontSize: 10, color: T.textLight, marginTop: 4, fontStyle: 'italic' }}>
                {p.createdAt && <div>Created: {fmtDateTime(p.createdAt)}</div>}
                {p.updatedAt && p.createdAt && p.updatedAt !== p.createdAt && (
                  <div>Last edited: {fmtDateTime(p.updatedAt)}</div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* See full history */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
        <button
          onClick={() => window.location.href = '/routine/history'}
          style={{ fontSize: 11, padding: '6px 16px', borderRadius: 0, border: `0.5px solid ${T.border}`, background: 'transparent', cursor: 'pointer', color: T.textMuted, fontFamily: 'inherit' }}
        >See full history →</button>
      </div>
    </div>
  )
}

// ─── TREATMENT SELECTOR PANEL ────────────────────────────────
function TreatmentSelectorPanel({ selector, treatments, allTypes, customTypes, setCustomTypes, onApply, onRemove, onClose, routineHistory, showerHistory, products }) {
  const existing = treatments[selector.key]
  const [selType,     setSelType]     = useState(existing?.type       || null)
  const [timeOfDay,   setTimeOfDay]   = useState(existing?.timeOfDay  || 'am')
  const [treatArea,   setTreatArea]   = useState(existing?.area || (selType && allTypes[selType]?.area) || 'face')
  const [customPre,   setCustomPre]   = useState(existing?.pre  ?? (existing?.type ? (allTypes[existing.type]?.pre ?? 0) : 0))
  const [customPost,  setCustomPost]  = useState(existing?.post ?? (existing?.type ? (allTypes[existing.type]?.post ?? 0) : 0))
  const [newName, setNewName] = useState('')
  const [newPre,  setNewPre]  = useState(3)
  const [newPost, setNewPost] = useState(3)

  function addCustomType() {
    if (!newName.trim()) return
    const key = 'custom-' + newName.toLowerCase().replace(/\s+/g, '-')
    setCustomTypes(ct => ({ ...ct, [key]: { label: newName.trim(), pre: newPre, post: newPost, pca: false } }))
    setNewName(''); setNewPre(3); setNewPost(3)
  }

  // Compute conflicts and ingredient needs whenever a type is selected
  const conflicts = selType
    ? detectTreatmentConflicts(selector.key, selType, allTypes, treatments, routineHistory || [])
    : []

  const ingredientConflicts = (() => {
    if (!selType) return null
    const cfg = allTypes[selType]
    if (!cfg) return null
    const activePeriod = getActivePeriod(selector.date, routineHistory || [])
    const routineFlags = getActiveRoutineFlags(activePeriod, showerHistory || [], selector.date, products || {})
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
    ? findSafeDate(selector.key, selType, allTypes, treatments, routineHistory || [])
    : null

  const hasAnyConflict = conflicts.length > 0 || !!ingredientConflicts

  return (
    <div style={{ background: T.white, border: `0.5px solid ${T.border}`, borderRadius: 0, padding: '16px 18px', marginBottom: 14 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 12 }}>
        {MONTHS[selector.date.getMonth()]} {selector.date.getDate()}, {selector.date.getFullYear()} — {existing ? 'Edit treatment' : 'Add treatment'}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 6, marginBottom: 12 }}>
        {Object.entries(allTypes).map(([k, v]) => (
          <button key={k} onClick={() => { setSelType(k); setTreatArea(v.area || 'face'); setCustomPre(v.pre ?? 0); setCustomPost(v.post ?? 0) }} style={{ border: `0.5px solid ${selType === k ? T.pinkDeep : T.border}`, borderRadius: 0, padding: '8px 10px', cursor: 'pointer', background: selType === k ? T.pink : T.white, textAlign: 'left' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{v.label}</div>
            <div style={{ fontSize: 10, color: T.textLight }}>{v.pre}d before / {v.post}d after</div>
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
          <button onClick={() => setTimeOfDay('am')} style={{ padding: '5px 16px', borderRadius: 0, border: `0.5px solid ${timeOfDay === 'am' ? T.pinkDeep : T.border}`, background: timeOfDay === 'am' ? T.pink : 'transparent', fontSize: 12, fontWeight: timeOfDay === 'am' ? 500 : 400, cursor: 'pointer', color: T.text }}>Morning (AM)</button>
          <button onClick={() => setTimeOfDay('pm')} style={{ padding: '5px 16px', borderRadius: 0, border: `0.5px solid ${timeOfDay === 'pm' ? T.pinkDeep : T.border}`, background: timeOfDay === 'pm' ? T.pink : 'transparent', fontSize: 12, fontWeight: timeOfDay === 'pm' ? 500 : 400, cursor: 'pointer', color: T.text }}>Evening (PM)</button>
        </div>
      </div>
      <div style={{ marginBottom: 10 }}>
        <FieldLabel>Treatment area</FieldLabel>
        <div style={{ display: 'flex', gap: 6 }}>
          {[{key:'face',label:'Face'},{key:'body',label:'Body'},{key:'both',label:'Both'}].map(a => (
            <button key={a.key} onClick={() => setTreatArea(a.key)} style={{ padding: '5px 14px', borderRadius: 0, border: `0.5px solid ${treatArea === a.key ? T.pinkDeep : T.border}`, background: treatArea === a.key ? T.pink : 'transparent', fontSize: 12, fontWeight: treatArea === a.key ? 500 : 400, cursor: 'pointer', color: T.text }}>{a.label}</button>
          ))}
        </div>
        <div style={{ fontSize: 10, color: T.textLight, marginTop: 4 }}>
          Body products (BP wash, body salicylic) only conflict with body treatments.
        </div>
      </div>
      {selType && (
        <div style={{ marginBottom: 10, padding: '10px 12px', background: T.creamDark, borderRadius: 0, border: `0.5px solid ${T.border}` }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: T.text, marginBottom: 8 }}>Pause and recovery window</div>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <div>
              <FieldLabel>Days before — pause actives</FieldLabel>
              <div style={{ fontSize: 10, color: T.textLight, marginBottom: 4 }}>How many days before this treatment should you stop using actives (retinoids, acids, etc.)?</div>
              <NumberInput value={customPre} onChange={e => setCustomPre(+e.target.value)} min={0} max={30} width={70} />
            </div>
            <div>
              <FieldLabel>Days after — recovery period</FieldLabel>
              <div style={{ fontSize: 10, color: T.textLight, marginBottom: 4 }}>How many days of recovery before resuming your normal routine?</div>
              <NumberInput value={customPost} onChange={e => setCustomPost(+e.target.value)} min={0} max={30} width={70} />
            </div>
          </div>
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', borderTop: `0.5px solid ${T.border}`, paddingTop: 10, marginTop: 4 }}>
        <Btn variant="primary" onClick={() => { if (selType && conflicts.length === 0) onApply(selType, false, timeOfDay, treatArea, customPre, customPost) }} disabled={!selType || conflicts.length > 0}>Save</Btn>
        {conflicts.length > 0 && safeDate && <div style={{ fontSize: 11, color: '#166534', padding: '4px 0' }}>Move to {safeDate} to save.</div>}
        <Btn onClick={onClose}>Cancel</Btn>
        {existing && <Btn variant="danger" onClick={() => { if (window.confirm('Remove this treatment? This cannot be undone.')) onRemove() }}>Remove treatment</Btn>}
      </div>
      <SectionLabel>Add a new treatment type</SectionLabel>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div><FieldLabel>Name</FieldLabel><TextInput value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. LED therapy" /></div>
        <div><FieldLabel>Days before</FieldLabel><NumberInput value={newPre} onChange={e => setNewPre(+e.target.value)} /></div>
        <div><FieldLabel>Days after</FieldLabel><NumberInput value={newPost} onChange={e => setNewPost(+e.target.value)} /></div>
        <Btn variant="secondary" onClick={addCustomType}>Add</Btn>
      </div>
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
function getActiveDailyPeriod(dt, history) {
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
        border: `0.5px solid ${isDragging ? T.pinkDeep : T.border}`,
        background: isDragging ? T.pink : pressing ? T.creamDark : T.white,
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
            style={{ fontSize: 11, color: T.textMuted, background: 'transparent', border: 'none', borderBottom: `0.5px solid ${T.border}`, outline: 'none', width: '100%', padding: '1px 0', marginBottom: 2, cursor: 'text' }}
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
                style={{ fontSize: 9, padding: '1px 5px', borderRadius: 0, cursor: 'pointer', border: `0.5px solid ${(item.frequency||'daily') === f.key ? T.pinkDeep : T.border}`, background: (item.frequency||'daily') === f.key ? T.pink : 'transparent', color: (item.frequency||'daily') === f.key ? T.text : T.textLight, whiteSpace: 'nowrap' }}>
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
                style={{ fontSize: 9, padding: '1px 4px', borderRadius: 0, cursor: 'pointer', border: `0.5px solid ${(item.weekStartDay ?? 1) === i ? T.orange : T.border}`, background: (item.weekStartDay ?? 1) === i ? T.orangeLight : 'transparent', color: (item.weekStartDay ?? 1) === i ? '#9A3412' : T.textLight }}>
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
                style={{ fontSize: 9, padding: '1px 5px', borderRadius: 0, cursor: 'pointer', border: `0.5px solid ${(item.timeOfDay||'both') === t.key ? T.pinkDeep : T.border}`, background: (item.timeOfDay||'both') === t.key ? T.pink : 'transparent', color: (item.timeOfDay||'both') === t.key ? T.text : T.textLight }}>
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
function DailyEditor({ initial, onSave, onCancel, lockStartDate = false, allPeriods = [], onEditConflict, products = {}, onSaveProduct }) {
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
    <div style={{ background: T.white, border: `0.5px solid ${T.border}`, borderRadius: 0, padding: '14px 16px', marginBottom: 10 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 4 }}>
        {initial?.id ? `Extras — editing from ${fmtDate(initial?.startDate)}` : 'Extras'}
      </div>
      <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 10, lineHeight: 1.6, background: T.creamDark, borderRadius: 0, padding: '8px 12px' }}>
        The little things that make a big difference — growth serums, eye patches, leave-on body treatments, tools, supplements, and more.
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
        <div>
          <FieldLabel>Start date</FieldLabel>
          <DateInput value={startDate} onChange={e => setStartDate(e.target.value)} />
        </div>
        <div>
          <FieldLabel>End date (leave blank if still active)</FieldLabel>
          <DateInput value={endDate} onChange={e => setEndDate(e.target.value)} />
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
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 0, cursor: 'pointer', background: isOpen ? T.pink : 'transparent', border: `0.5px solid ${isOpen ? T.pinkDeep : T.border}`, marginBottom: isOpen ? 4 : 0 }}
                  >
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: T.pinkDeep, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {prod ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {prod.imageUrl && <img src={prod.imageUrl} alt="" style={{ width: 44, height: 44, borderRadius: 0, objectFit: 'cover', flexShrink: 0 }} onError={e => e.target.style.display='none'} />}
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
                    {prod && <button onClick={e => { e.stopPropagation(); setItems(it => it.map((x,idx) => idx===i ? {...x,productId:null} : x)) }} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: T.textLight, fontSize: 13, padding: '0 2px', lineHeight: 1 }}>×</button>}
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
                    />
                  )}
                </div>
              )
            })()}
          </div>
        ))}
      </div>

      {/* Add new item */}
      <div style={{ borderTop: `0.5px solid ${T.border}`, paddingTop: 10 }}>
        {/* Preset picker */}
        <div style={{ marginBottom: 8 }}>
          <button
            onClick={() => setShowPresets(s => !s)}
            style={{ fontSize: 11, color: T.pinkDeep, border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, marginBottom: showPresets ? 6 : 0 }}
          >
            {showPresets ? '▲ Hide suggestions' : '▼ Browse suggestions'}
          </button>
          {showPresets && (
            <div style={{ border: `0.5px solid ${T.border}`, borderRadius: 0, overflow: 'hidden', marginBottom: 8 }}>
              <input
                type="text"
                value={presetSearch}
                onChange={e => setPresetSearch(e.target.value)}
                placeholder="Search suggestions..."
                style={{ width: '100%', fontSize: 12, padding: '7px 10px', border: 'none', borderBottom: `0.5px solid ${T.border}`, background: T.cream, color: T.text, boxSizing: 'border-box' }}
              />
              <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                {EXTRAS_PRESETS.map(group => {
                  const filtered = group.items.filter(item =>
                    !presetSearch || item.toLowerCase().includes(presetSearch.toLowerCase())
                  )
                  if (!filtered.length) return null
                  return (
                    <div key={group.group}>
                      <div style={{ fontSize: 10, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '6px 10px 3px', background: T.creamDark }}>{group.group}</div>
                      {filtered.map(item => (
                        <div
                          key={item}
                          onClick={() => { setNewLabel(item); setShowPresets(false); setPresetSearch('') }}
                          style={{ fontSize: 12, padding: '6px 10px', cursor: 'pointer', color: T.text, borderBottom: `0.5px solid ${T.border}` }}
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
        <div><FieldLabel>Item</FieldLabel><TextInput value={newLabel} onChange={e => setNewLabel(e.target.value)} placeholder="e.g. Minoxidil" width={110} /></div>
        <div><FieldLabel>Note</FieldLabel><TextInput value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="optional" width={90} /></div>
        <div>
          <FieldLabel>How often</FieldLabel>
          <select value={newFreq} onChange={e => setNewFreq(e.target.value)} style={{ fontSize: 12, padding: '5px 8px', border: `0.5px solid ${T.border}`, borderRadius: 0, background: T.cream, color: T.text }}>
            {EXTRAS_FREQUENCIES.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
          </select>
        </div>
        <div>
          <FieldLabel>When</FieldLabel>
          <div style={{ display: 'flex', gap: 4 }}>
            {TIME_OF_DAY_OPTIONS.map(t => (
              <button key={t.key} onClick={() => setNewTimeOfDay(t.key)} style={{ fontSize: 10, padding: '5px 8px', borderRadius: 0, cursor: 'pointer', border: `0.5px solid ${newTimeOfDay === t.key ? T.pinkDeep : T.border}`, background: newTimeOfDay === t.key ? T.pink : 'transparent', color: newTimeOfDay === t.key ? T.text : T.textLight }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <Btn variant="secondary" onClick={addItem}>Add</Btn>
        </div>{/* end flex row */}
      </div>{/* end add item section */}

      <div style={{ borderTop: `0.5px solid ${T.border}`, paddingTop: 10, marginTop: 10, display: 'flex', gap: 8 }}>
        <Btn variant="primary" onClick={handleSave} disabled={!startDate || !!conflict || items.length === 0}>Save</Btn>
        <Btn onClick={onCancel}>Cancel</Btn>
      </div>
    </div>
  )
}

// DailySection (Extras) — renders extras active today, filtered by frequency + AM/PM tab
// Returns null when nothing is scheduled for that day+tab — no empty section shown
function DailySection({ dt, dailyHistory, onEditDaily, tab, products, onUpdateDailyItemProduct }) {
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
          <div key={item.id} style={{ borderBottom: `0.5px solid ${T.border}`, paddingBottom: 6, marginBottom: 6 }}>
            {/* Item header row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: T.text, flex: 1 }}>{item.label}</div>
              {item.note && <div style={{ fontSize: 11, color: T.textMuted }}>{item.note}</div>}
            </div>
            {/* Product slot — matches skincare renderSteps pattern */}
            <div
              onClick={() => setOpenItemId(isOpen ? null : item.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: `0.5px solid ${T.border}`, cursor: 'pointer', opacity: prod ? 1 : 0.45 }}
            >
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: T.pinkDeep, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                {prod ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    {prod.imageUrl && <img src={prod.imageUrl} alt="" style={{ width: 44, height: 44, borderRadius: 0, objectFit: 'cover', flexShrink: 0 }} onError={e => e.target.style.display='none'} />}
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
              />
            )}
          </div>
        )
      })}
    </div>
  )
}


// ─── PRODUCT SYSTEM ──────────────────────────────────────────
// Maps routine step keys to human-readable categories for filtering


const PRODUCT_CATEGORIES = [
  'cleanser', 'cleansing oil / balm', 'toner', 'essence',
  'serum', 'moisturizer', 'spf', 'eye cream',
  'bha', 'azelaic acid', 'tretinoin',
  'body wash', 'body treatment', 'haircare', 'hair growth', 'boosts', 'other'
]

// Star rating display helper
function StarRating({ value, onChange, size = 12 }) {
  const path = 'M12,2 L14.35,9.24 L21.51,8.91 L15.80,13.24 L17.88,20.09 L12,16 L6.12,20.09 L8.20,13.24 L2.49,8.91 L9.65,9.24 Z'
  return (
    <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
      {[1,2,3,4,5].map(n => (
        <svg key={n} width={size} height={size} viewBox="0 0 24 24"
          onClick={onChange ? () => onChange(n) : undefined}
          style={{ cursor: onChange ? 'pointer' : 'default', display: 'block', flexShrink: 0 }}>
          <path d={path}
            fill={n <= value ? '#000000' : 'none'}
            stroke="#000000"
            strokeWidth={n <= value ? 0 : 1}
            strokeLinejoin="round" />
        </svg>
      ))}
    </div>
  )
}

// ProductForm — add or edit a product


// ─── PAO ICON ────────────────────────────────────────────────
const PAO_OPTIONS = [3, 6, 9, 12, 18, 24, 36]

function PaoIcon({ months, size = 20 }) {
  if (!months) return null
  const s = Math.round(size)
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, verticalAlign: 'middle' }}>
      <svg width={s} height={s} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="4" y="8" width="12" height="9" rx="1" stroke="currentColor" strokeWidth="1.3"/>
        <path d="M4 8V6.5C4 5.67 6.69 5 10 5s6 .67 6 1.5V8" stroke="currentColor" strokeWidth="1.3"/>
        <path d="M7 5.2L6 3.5M13 5.2L14 3.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
      </svg>
      <span style={{ fontSize: Math.max(8, Math.round(s * 0.5)), fontWeight: 700, lineHeight: 1 }}>{months}M</span>
    </span>
  )
}

// ─── PRODUCT FLAG BADGES ──────────────────────────────────────
const PRODUCT_FLAGS = [
  { key: 'black_owned',       label: 'Black-owned',       bg: '#1a1a1a', color: '#fff'    },
  { key: 'indigenous_owned',  label: 'Indigenous-owned',  bg: '#7C3AED', color: '#fff'    },
  { key: 'poc_owned',         label: 'POC-owned',         bg: '#D97706', color: '#fff'    },
  { key: 'woman_owned',       label: 'Woman-owned',       bg: '#DB2777', color: '#fff'    },
  { key: 'lgbtq_owned',       label: 'LGBTQ+-owned',      bg: 'linear-gradient(90deg,#FF6B6B,#FFE66D,#4ECDC4)', color: '#1a1a1a' },
  { key: 'cruelty_free',      label: '🐰 Cruelty-free',   bg: '#D1FAE5', color: '#065F46' },
  { key: 'vegan',             label: '🌱 Vegan',           bg: '#ECFDF5', color: '#065F46' },
  { key: 'certified_organic', label: '🌿 Organic',         bg: '#F0FDF4', color: '#166534' },
  { key: 'fair_trade',        label: '🤝 Fair trade',      bg: '#FEF3C7', color: '#92400E' },
  { key: 'is_prescription',    label: '℞ Prescription',      bg: '#FFF7ED', color: '#9A3412' },
  { key: 'clean_formula',      label: '✨ Clean',             bg: '#FDF4FF', color: '#7E22CE' },
  { key: 'science_backed',     label: '🔬 Science-backed',    bg: '#EFF6FF', color: '#1D4ED8' },
]

function ProductFlagBadges({ product, max }) {
  const active = PRODUCT_FLAGS.filter(f => product[f.key])
  const shown = max ? active.slice(0, max) : active
  const rest = max && active.length > max ? active.length - max : 0
  if (!shown.length) return null
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginTop: 4 }}>
      {shown.map(f => (
        <span key={f.key} style={{
          fontSize: 9, padding: '2px 6px', borderRadius: 0,
          background: f.bg, color: f.color,
          border: '0.5px solid rgba(0,0,0,0.08)', fontWeight: 500,
          whiteSpace: 'nowrap',
        }}>{f.label}</span>
      ))}
      {rest > 0 && <span style={{ fontSize: 9, color: T.textLight, padding: '2px 4px' }}>+{rest} more</span>}
    </div>
  )
}


// ─── PRODUCT IMAGE UPLOAD (inline) ────────────────────────────────────────
const PRODUCT_IMAGES_URL = 'https://brcjhshptisevcndqavz.supabase.co/storage/v1/object/public/product-images/'

async function imageToWebP(file, maxDim = 600, quality = 0.88) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height))
      const w = Math.round(img.width * scale)
      const h = Math.round(img.height * scale)
      const canvas = document.createElement('canvas')
      canvas.width = w; canvas.height = h
      canvas.getContext('2d').drawImage(img, 0, 0, w, h)
      canvas.toBlob(b => b ? resolve(b) : reject(new Error('toBlob failed')), 'image/webp', quality)
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('load failed')) }
    img.src = url
  })
}

function CalProductImageUpload({ value, onChange, userId, productName }) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview]     = useState(value || null)
  const ref = useRef(null)

  useEffect(() => { setPreview(value || null) }, [value])

  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) return
    if (file.size > 10 * 1024 * 1024) { alert('Image must be under 10MB'); return }
    setUploading(true)
    try {
      const webp = await imageToWebP(file)
      const slug = (productName || 'product').toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 40)
      const path = `${userId || 'anon'}/${slug}-${Date.now()}.webp`
      const { error } = await supabase.storage
        .from('product-images')
        .upload(path, webp, { upsert: true, contentType: 'image/webp' })
      if (error) throw error
      const publicUrl = PRODUCT_IMAGES_URL + path
      setPreview(publicUrl)
      onChange(publicUrl)
    } catch (err) {
      console.error('Upload failed:', err)
      alert('Upload failed — try again')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <div>
      {preview && (
        <div style={{ position: 'relative', marginBottom: 6, height: 100, borderRadius: 0, overflow: 'hidden', border: `0.5px solid ${T.border}` }}>
          <img src={preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <button onClick={() => { setPreview(null); onChange('') }}
            style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', width: 20, height: 20, color: '#fff', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        </div>
      )}
      <button onClick={() => ref.current?.click()} disabled={uploading}
        style={{ width: '100%', padding: '6px 10px', borderRadius: 0, border: `0.5px solid ${T.border}`, background: T.creamDark, color: T.textMuted, fontSize: 11, cursor: uploading ? 'default' : 'pointer', fontFamily: 'inherit' }}>
        {uploading ? 'Uploading...' : preview ? '↑ Replace image' : '↑ Upload image'}
      </button>
      <input ref={ref} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
    </div>
  )
}

function ProductForm({ initial, onSave, onCancel, userId }) {
  const [form, setForm] = useState({
    name: '', brand: '', category: 'cleanser',
    imageUrl: '', purchaseUrl: '',
    bdsCompliant: true, tags: [],
    effectiveness: 0, buyAgain: null, notes: '',
    ingredient_category: '', ingredient_form: '',
    black_owned: false, indigenous_owned: false, poc_owned: false, woman_owned: false,
    lgbtq_owned: false, cruelty_free: false, vegan: false, certified_organic: false, fair_trade: false,
    clean_formula: false, science_backed: false, is_prescription: false,
    purchased_at: '', opened_at: '', expires_at: '', pao_months: null,
    ...initial
  })
  const [tagInput, setTagInput] = useState('')
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  function addTag() {
    const raw = tagInput.trim()
    if (!raw) return
    const t = raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase()
    if (form.tags.map(x => x.toLowerCase()).includes(t.toLowerCase())) return
    set('tags', [...form.tags, t])
    setTagInput('')
  }

  function removeTag(t) { set('tags', form.tags.filter(x => x !== t)) }

  return (
    <div style={{ background: T.white, border: `0.5px solid ${T.border}`, borderRadius: 0, padding: '14px 16px', marginBottom: 10 }}>
      <div style={{ fontSize: 13, fontWeight: 500, color: T.text, marginBottom: 12 }}>
        {initial?.id ? 'Edit product' : 'Add product'}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
        <div><FieldLabel>Product name</FieldLabel><TextInput value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Blueberry Cleanser" width="100%" /></div>
        <div><FieldLabel>Brand</FieldLabel><TextInput value={form.brand} onChange={e => set('brand', e.target.value)} placeholder="e.g. Glow Recipe" width="100%" /></div>
      </div>

      <div style={{ marginBottom: 8 }}>
        <FieldLabel>Category</FieldLabel>
        <select value={form.category} onChange={e => set('category', e.target.value)} style={{ fontSize: 12, padding: '5px 8px', border: `0.5px solid ${T.border}`, borderRadius: 0, background: T.cream, color: T.text, width: '100%' }}>
          {PRODUCT_CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
        <div>
          <FieldLabel>Product image</FieldLabel>
          <CalProductImageUpload
            value={form.imageUrl}
            onChange={url => set('imageUrl', url)}
            userId={userId}
            productName={form.name}
          />
        </div>
        <div><FieldLabel>Purchase URL</FieldLabel><TextInput value={form.purchaseUrl} onChange={e => set('purchaseUrl', e.target.value)} placeholder="https://..." width="100%" /></div>
      </div>

      <div style={{ marginBottom: 8 }}>
        <FieldLabel>Where do you use this? (select all that apply)</FieldLabel>
        <div style={{ display: 'flex', gap: 6 }}>
          {['Face', 'Body', 'Hair'].map(area => {
            const key = area.toLowerCase()
            const active = !!(form.applicationArea?.[key])
            return (
              <button key={key} onClick={() => set('applicationArea', { ...(form.applicationArea || {}), [key]: !active })}
                style={{ fontSize: 11, padding: '4px 12px', borderRadius: 0, cursor: 'pointer', border: `0.5px solid ${active ? T.pinkDeep : T.border}`, background: active ? T.pink : 'transparent', color: active ? T.text : T.textMuted, fontWeight: active ? 600 : 400 }}>
                {area}
              </button>
            )
          })}
        </div>
      </div>



      {/* Purchase & expiry tracking */}
      <div style={{ borderTop: `0.5px solid ${T.border}`, paddingTop: 12, marginBottom: 10 }}>
        <FieldLabel>Purchase & expiry <span style={{ fontWeight: 400, color: T.textLight }}>(optional)</span></FieldLabel>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
        <div>
          <FieldLabel>Purchased</FieldLabel>
          <input type="date" value={form.purchased_at || ''} onChange={e => set('purchased_at', e.target.value)}
            style={{ width: '100%', fontSize: 12, padding: '7px 10px', border: `0.5px solid ${T.border}`, borderRadius: 0, background: T.cream, color: T.text, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <div>
          <FieldLabel>Opened</FieldLabel>
          <input type="date" value={form.opened_at || ''} onChange={e => set('opened_at', e.target.value)}
            style={{ width: '100%', fontSize: 12, padding: '7px 10px', border: `0.5px solid ${T.border}`, borderRadius: 0, background: T.cream, color: T.text, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <div>
          <FieldLabel>Expires</FieldLabel>
          <input type="date" value={form.expires_at || ''} onChange={e => set('expires_at', e.target.value)}
            style={{ width: '100%', fontSize: 12, padding: '7px 10px', border: `0.5px solid ${T.border}`, borderRadius: 0, background: T.cream, color: T.text, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <div>
          <FieldLabel>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <PaoIcon months={form.pao_months} size={14} />
              PAO
              <InfoTooltip text="Period After Opening — how long the product is good for once opened. Look for the open jar symbol on packaging." />
            </span>
          </FieldLabel>
          <select value={form.pao_months || ''} onChange={e => set('pao_months', e.target.value ? Number(e.target.value) : null)}
            style={{ width: '100%', fontSize: 12, padding: '7px 10px', border: `0.5px solid ${T.border}`, borderRadius: 0, background: T.cream, color: form.pao_months ? T.text : T.textMuted, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}>
            <option value="">— Select PAO —</option>
            {PAO_OPTIONS.map(m => <option key={m} value={m}>{m} months</option>)}
          </select>
        </div>
      </div>
      {form.opened_at && form.pao_months && (
        <div style={{ fontSize: 11, color: T.textMuted, fontStyle: 'italic', marginBottom: 10 }}>
          Use by: {new Date(new Date(form.opened_at).setMonth(new Date(form.opened_at).getMonth() + form.pao_months)).toLocaleDateString()}
        </div>
      )}

      {/* Ownership & ethics */}
      <div style={{ borderTop: `0.5px solid ${T.border}`, paddingTop: 12, marginBottom: 8 }}>
        <FieldLabel>Ownership & ethics</FieldLabel>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
        {[
          { key: 'black_owned',       label: 'Black-owned'       },
          { key: 'indigenous_owned',  label: 'Indigenous-owned'  },
          { key: 'poc_owned',         label: 'POC-owned'         },
          { key: 'woman_owned',       label: 'Woman-owned'       },
          { key: 'lgbtq_owned',       label: 'LGBTQ+-owned'      },
          { key: 'cruelty_free',      label: 'Cruelty-free'      },
          { key: 'vegan',             label: 'Vegan'             },
          { key: 'certified_organic', label: 'Certified organic' },
          { key: 'fair_trade',        label: 'Fair trade'        },
          { key: 'is_prescription',   label: '℞ Prescription'    },
          { key: 'clean_formula',     label: 'Clean formula'     },
          { key: 'science_backed',    label: 'Science-backed'    },
        ].map(({ key, label }) => (
          <button key={key} type="button" onClick={() => set(key, !form[key])} style={{
            padding: '5px 12px', borderRadius: 0, fontSize: 11, cursor: 'pointer',
            border: `0.5px solid ${form[key] ? T.pinkDeep : T.border}`,
            background: form[key] ? T.pink : 'transparent',
            color: T.text, fontFamily: 'inherit',
          }}>{label}</button>
        ))}
      </div>

      <div style={{ marginBottom: 8 }}>
        <FieldLabel>Effectiveness</FieldLabel>
        <StarRating value={form.effectiveness} onChange={v => set('effectiveness', v)} size={18} />
      </div>

      <div style={{ marginBottom: 8 }}>
        <FieldLabel>Tags (fragrance free, silicone free, etc.)</FieldLabel>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
          {form.tags.map(t => (
            <span key={t} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 0, background: T.pink, color: T.text, border: `0.5px solid ${T.pinkDeep}`, cursor: 'pointer' }} onClick={() => removeTag(t)}>
              {t} ×
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <TextInput value={tagInput} onChange={e => setTagInput(e.target.value)} placeholder="e.g. fragrance free" width={150} />
          <Btn variant="secondary" onClick={addTag}>Add</Btn>
        </div>
      </div>

      <div style={{ marginBottom: 10 }}>
        <FieldLabel>Ingredient category <span style={{ fontWeight: 400, color: T.textLight }}>(optional — enables conflict detection)</span></FieldLabel>
        <select
          value={form.ingredient_category || ''}
          onChange={e => set('ingredient_category', e.target.value)}
          style={{ width: '100%', fontSize: 12, padding: '8px 10px', border: `0.5px solid ${T.border}`, borderRadius: 0, background: T.cream, color: form.ingredient_category ? T.text : T.textMuted, fontFamily: 'inherit', marginBottom: 8, outline: 'none', boxSizing: 'border-box' }}
        >
          <option value="">— Select ingredient category —</option>
          {Object.entries(PRODUCT_INGREDIENT_CATEGORIES).map(([key, cat]) => (
            <option key={key} value={key}>{cat.label}</option>
          ))}
        </select>
        {form.ingredient_category && PRODUCT_INGREDIENT_CATEGORIES[form.ingredient_category]?.forms?.length > 0 && (<>
          <FieldLabel>Ingredient form <span style={{ fontWeight: 400, color: T.textLight }}>(optional)</span></FieldLabel>
          <select
            value={form.ingredient_form || ''}
            onChange={e => set('ingredient_form', e.target.value)}
            style={{ width: '100%', fontSize: 12, padding: '8px 10px', border: `0.5px solid ${T.border}`, borderRadius: 0, background: T.cream, color: form.ingredient_form ? T.text : T.textMuted, fontFamily: 'inherit', marginBottom: 8, outline: 'none', boxSizing: 'border-box' }}
          >
            <option value="">— Select form —</option>
            {PRODUCT_INGREDIENT_CATEGORIES[form.ingredient_category].forms.map(f => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </>)}
      </div>
      <div style={{ marginBottom: 10 }}>
        <FieldLabel>Notes</FieldLabel>
        <textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Any notes..." style={{ width: '100%', fontSize: 12, padding: '5px 8px', border: `0.5px solid ${T.border}`, borderRadius: 0, background: T.cream, color: T.text, resize: 'vertical', minHeight: 60, fontFamily: 'inherit' }} />
      </div>

      <div style={{ display: 'flex', gap: 8, borderTop: `0.5px solid ${T.border}`, paddingTop: 10 }}>
        <Btn variant="primary" onClick={() => form.name && onSave({ ...form, id: form.id || uid() })} disabled={!form.name}>Save product</Btn>
        <Btn onClick={onCancel}>Cancel</Btn>
      </div>
    </div>
  )
}

// ProductPicker — shown when clicking a step in the flyout
// Lets user pick from existing products or add a new one
function ProductPicker({ stepKey, currentProductId, products, onSelect, onAddNew, onClose, categoryKey }) {
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
    <div style={{ background: T.white, border: `0.5px solid ${T.border}`, borderRadius: 0, padding: '12px 14px', marginTop: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 500, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Select product</div>
        <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 14, color: T.textLight }}>×</button>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
        <TextInput value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." width={140} />
        <Btn variant={showAll ? 'active' : 'default'} onClick={() => setShowAll(s => !s)} style={{ fontSize: 11, padding: '4px 8px' }}>All categories</Btn>
      </div>

      {catLabel && !showAll && (
        <div style={{ fontSize: 10, color: T.textMuted, marginBottom: 6, fontStyle: 'italic' }}>
          Showing {catLabel} products · <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setShowAll(true)}>show all</span>
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
            style={{ padding: '6px 8px', borderRadius: 0, fontSize: 12, cursor: 'pointer', color: '#9F1239', marginBottom: 3, background: '#FFF0F0' }}
          >
            Remove assignment
          </div>
        )}
        {filtered.map(p => (
          <div
            key={p.id}
            onClick={() => onSelect(p.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '6px 8px', borderRadius: 0, fontSize: 12, cursor: 'pointer', marginBottom: 2,
              background: p.id === currentProductId ? T.pink : 'transparent',
              border: `0.5px solid ${p.id === currentProductId ? T.pinkDeep : 'transparent'}`,
            }}
          >
            {/* Thumbnail */}
            {p.imageUrl ? (
              <img src={p.imageUrl} alt="" style={{ width: 32, height: 32, borderRadius: 0, objectFit: 'cover', flexShrink: 0 }} onError={e => e.target.style.display='none'} />
            ) : (
              <div style={{ width: 32, height: 32, borderRadius: 0, background: T.creamDark, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: T.textLight }}>◻</div>
            )}
            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 500, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 1 }}>
                {p.brand && <span style={{ fontSize: 10, color: T.textMuted }}>{p.brand}</span>}
                {p.brand && p.category && <span style={{ fontSize: 10, color: T.textLight }}>·</span>}
                {p.category && <span style={{ fontSize: 10, color: T.textLight }}>{p.category}</span>}
              </div>
              {p.effectiveness > 0 && <StarRating value={p.effectiveness} size={9} />}
            </div>
          </div>
        ))}
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

function getActiveShowerPeriod(dt, history) {
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
        borderRadius: 0, border: `0.5px solid ${isDragging ? T.pinkDeep : T.border}`,
        background: isDragging ? T.pink : pressing ? T.creamDark : T.white,
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
              style={{ fontSize: 9, padding: '1px 6px', borderRadius: 0, cursor: 'pointer', border: `0.5px solid ${item.frequency === f.key ? T.pinkDeep : T.border}`, background: item.frequency === f.key ? T.pink : 'transparent', color: item.frequency === f.key ? T.text : T.textLight, fontWeight: item.frequency === f.key ? 500 : 400 }}
            >{f.label}</button>
          ))}
        </div>
        {item.frequency !== 'daily' && (
          <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 9, color: T.textLight }}>{item.frequency === 'alternate' ? 'starts on:' : 'cycle starts:'}</span>
            {DAYS.map((d, i) => (
              <button key={i} onClick={e => { e.stopPropagation(); onWeekStartChange(index, i) }}
                style={{ fontSize: 9, padding: '1px 5px', borderRadius: 0, cursor: 'pointer', border: `0.5px solid ${(item.weekStartDay ?? 1) === i ? T.orange : T.border}`, background: (item.weekStartDay ?? 1) === i ? T.orangeLight : 'transparent', color: (item.weekStartDay ?? 1) === i ? '#9A3412' : T.textLight }}
              >{d}</button>
            ))}
          </div>
        )}
      </div>
      <button onClick={() => onRemove(index)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: T.textLight, fontSize: 14, padding: '0 2px', flexShrink: 0 }}>×</button>
    </div>
  )
}

// ShowerEditor — add/remove/reorder shower items with frequency settings
function ShowerEditor({ initial, onSave, onCancel, allPeriods = [], onEditConflict, products = {}, onSaveProduct }) {
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
    <div style={{ background: T.white, border: `0.5px solid ${T.border}`, borderRadius: 0, padding: '14px 16px', marginBottom: 10 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 4 }}>
        {initial?.id ? `Shower routine — editing from ${fmtDate(initial?.startDate)}` : 'Shower routine'}
      </div>
      <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 10, lineHeight: 1.6, background: T.creamDark, borderRadius: 0, padding: '8px 12px' }}>
        Body washes, hair treatments, and anything else that happens in the shower. Set how often each one runs.
      </div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
        <div><FieldLabel>Start date</FieldLabel><DateInput value={startDate} onChange={e => setStartDate(e.target.value)} /></div>
        <div><FieldLabel>End date (leave blank if active)</FieldLabel><DateInput value={endDate} onChange={e => setEndDate(e.target.value)} /></div>
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
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 0, cursor: 'pointer', background: isOpen ? T.pink : 'transparent', border: `0.5px solid ${isOpen ? T.pinkDeep : T.border}`, marginBottom: isOpen ? 4 : 0 }}
                  >
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: T.pinkDeep, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {prod ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {prod.imageUrl && <img src={prod.imageUrl} alt="" style={{ width: 44, height: 44, borderRadius: 0, objectFit: 'cover', flexShrink: 0 }} onError={e => e.target.style.display='none'} />}
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
                    {prod && <button onClick={e => { e.stopPropagation(); setItems(it => it.map((x,idx) => idx===i ? {...x,productId:null} : x)) }} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: T.textLight, fontSize: 13, padding: '0 2px', lineHeight: 1 }}>×</button>}
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
                    />
                  )}
                </div>
              )
            })()}
          </div>
        ))}
      </div>

      <div style={{ borderTop: `0.5px solid ${T.border}`, paddingTop: 10 }}>
        {/* Preset picker */}
        <div style={{ marginBottom: 8 }}>
          <button
            onClick={() => setShowShowerPresets(s => !s)}
            style={{ fontSize: 11, color: T.pinkDeep, border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, marginBottom: showShowerPresets ? 6 : 0 }}
          >
            {showShowerPresets ? '▲ Hide suggestions' : '▼ Browse suggestions'}
          </button>
          {showShowerPresets && (
            <div style={{ border: `0.5px solid ${T.border}`, borderRadius: 0, overflow: 'hidden', marginBottom: 8 }}>
              <input
                type="text"
                value={showerPresetSearch}
                onChange={e => setShowerPresetSearch(e.target.value)}
                placeholder="Search suggestions..."
                style={{ width: '100%', fontSize: 12, padding: '7px 10px', border: 'none', borderBottom: `0.5px solid ${T.border}`, background: T.cream, color: T.text, boxSizing: 'border-box' }}
              />
              <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                {SHOWER_PRESETS.map(group => {
                  const filtered = group.items.filter(item =>
                    !showerPresetSearch || item.toLowerCase().includes(showerPresetSearch.toLowerCase())
                  )
                  if (!filtered.length) return null
                  return (
                    <div key={group.group}>
                      <div style={{ fontSize: 10, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '6px 10px 3px', background: T.creamDark }}>{group.group}</div>
                      {filtered.map(item => (
                        <div
                          key={item}
                          onClick={() => { setNewLabel(item); setShowShowerPresets(false); setShowerPresetSearch('') }}
                          style={{ fontSize: 12, padding: '6px 10px', cursor: 'pointer', color: T.text, borderBottom: `0.5px solid ${T.border}` }}
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
          <div><FieldLabel>Item</FieldLabel><TextInput value={newLabel} onChange={e => setNewLabel(e.target.value)} placeholder="e.g. BP wash" width={100} /></div>
          <div><FieldLabel>Note</FieldLabel><TextInput value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="optional" width={80} /></div>
          <div>
            <FieldLabel>Frequency</FieldLabel>
            <select value={newFreq} onChange={e => setNewFreq(e.target.value)} style={{ fontSize: 12, padding: '5px 8px', border: `0.5px solid ${T.border}`, borderRadius: 0, background: T.cream, color: T.text }}>
              {SHOWER_FREQUENCIES.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
            </select>
          </div>
          <Btn variant="secondary" onClick={addItem}>Add</Btn>
        </div>
      </div>

      <div style={{ borderTop: `0.5px solid ${T.border}`, paddingTop: 10, marginTop: 10, display: 'flex', gap: 8 }}>
        <Btn variant="primary" onClick={() => startDate && !conflict && onSave({ startDate, endDate: endDate || null, items, id: initial?.id || uid() })} disabled={!startDate || !!conflict || items.length === 0}>Save</Btn>
        <Btn onClick={onCancel}>Cancel</Btn>
      </div>
    </div>
  )
}

// ShowerSection — shows active shower items for this specific date in the flyout
function ShowerSection({ dt, showerHistory, onEditShower, products, onUpdateShowerItemProduct }) {
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
            <div key={item.id} style={{ borderBottom: `0.5px solid ${T.border}`, paddingBottom: 6, marginBottom: 6 }}>
              {/* Item header row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: T.text, flex: 1 }}>{item.label}</div>
                {item.note && <div style={{ fontSize: 11, color: T.textMuted }}>{item.note}</div>}
                <div style={{ fontSize: 9, color: T.textLight }}>{(freq?.label || item.frequency || 'Every day').replace('Every shower', 'Every day')}</div>
              </div>
              {/* Product slot — matches skincare renderSteps pattern */}
              <div
                onClick={() => setOpenItemId(isOpen ? null : item.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: `0.5px solid ${T.border}`, cursor: 'pointer', opacity: prod ? 1 : 0.45 }}
              >
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: T.pinkDeep, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  {prod ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                      {prod.imageUrl && <img src={prod.imageUrl} alt="" style={{ width: 44, height: 44, borderRadius: 0, objectFit: 'cover', flexShrink: 0 }} onError={e => e.target.style.display='none'} />}
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



function DayFlyout({ flyout, period, dailyHistory, showerHistory, products, allTypes, onClose, onAddTreatment, onTabChange, onEditDaily, onEditShower, onUpdatePeriodProducts, onUpdatePeriodSteps, onAddProduct, recoveryRoutines, onUpdateRecoveryProducts, onUpdateRecoverySteps, onUpdateShowerItemProduct, onUpdateDailyItemProduct }) {
  const [massageOpen, setMassageOpen] = useState(false)
  const tab = flyout.tab  // always read from parent — no local drift
  const [openStepKey, setOpenStepKey] = useState(null)
  const [addingProduct, setAddingProduct] = useState(false)
  function switchTab(t) { onTabChange?.(t); setOpenStepKey(null) }
  const { date, dayType, isTreatment, treatmentTimeOfDay, activeTreatmentType } = flyout
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
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: `0.5px solid ${T.border}`, cursor: period ? 'pointer' : 'default', opacity: product ? 1 : 0.45, position: 'relative' }}
          >
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: T.text }}>{step.label}</div>
                {step.optional && !product && period && (
                  <button onClick={e => { e.stopPropagation(); onUpdatePeriodSteps?.(period.startDate, stepKey, false) }} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: T.textLight, fontSize: 14, padding: '0 2px', lineHeight: 1, flexShrink: 0 }} title="Hide this step">×</button>
                )}
              </div>
              {product ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  {product.imageUrl && <img src={product.imageUrl} alt="" style={{ width: 44, height: 44, borderRadius: 0, objectFit: 'cover', flexShrink: 0 }} onError={e => e.target.style.display='none'} />}
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
            </div>
            <div style={{ fontSize: 10, color: T.textLight }}>{isThisOpen ? '▲' : '▼'}</div>
          </div>
          {isThisOpen && (
            addingProduct ? (
              <ProductForm
                onSave={(p) => { onAddProduct(p); setAddingProduct(false) }}
                onCancel={() => setAddingProduct(false)}
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
                <div style={{ marginTop: 4, borderRadius: 0, overflow: 'hidden', background: T.creamDark, padding: 8 }}>
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

    // Show hidden optional steps at bottom with + to re-enable
    const hiddenSteps = (() => {
      if (activeRecovery?.steps) {
        return activeRecovery.steps.filter(s => !s.enabled && s.optional)
      }
      return dayTypeKey ? getPeriodSteps(period, dayTypeKey).filter(s => !s.enabled && s.optional) : []
    })()
    if (hiddenSteps.length > 0 && period) {
      result.push(
        <div key="hidden-steps" style={{ marginTop: 8 }}>
          <div style={{ marginBottom: 6 }}>
            <div style={{ fontSize: 10, color: T.textLight, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Optional steps</div>
            <div style={{ fontSize: 10, color: T.textLight, fontStyle: 'italic', marginTop: 2 }}>Tap + to add to your routine</div>
          </div>
          {hiddenSteps.map(s => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 0', borderBottom: '0.5px solid ' + T.border, opacity: 0.5 }}>
              <div style={{ fontSize: 12, color: T.textMuted }}>{s.label}</div>
              <button
                onClick={() => onUpdatePeriodSteps?.(period.startDate, s.id, true)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: T.pinkDeep, fontSize: 16, padding: '0 4px', lineHeight: 1, fontWeight: 600 }}
                title="Restore this step"
              >+</button>
            </div>
          ))}
        </div>
      )
    }

    return result
  }

  return (
    <div style={{ background: T.white, border: `0.5px solid ${T.border}`, borderRadius: 0, padding: '12px 14px', marginBottom: 14 }}>
      {/* Date + actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: T.text }}>
          {MONTHS[date.getMonth()]} {date.getDate()}
        </div>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <Btn onClick={onAddTreatment} style={{ fontSize: 11, padding: '4px 10px', whiteSpace: 'nowrap' }}>{flyout.isTreatment ? 'Edit treatment' : '+ Add treatment'}</Btn>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 16, color: T.textMuted, padding: '0 4px', lineHeight: 1 }}>×</button>
        </div>
      </div>
      {/* Color-coded day type banner */}
      {(() => {
        const banners = {
          tret:     { bg: '#EDE9FE', color: '#5B21B6', label: `${period?.activeName ? period.activeName.charAt(0).toUpperCase() + period.activeName.slice(1) : 'Tretinoin'} night` },
          bha:      { bg: '#DCFCE7', color: '#166534', label: 'BHA night' },
          pause:    { bg: '#FEF3C7', color: '#92400E', label: 'Pre-treatment pause' },
          pca:      { bg: '#FFE4E6', color: '#9F1239', label: 'Recovery products' },
          recovery: { bg: '#FFE4E6', color: '#9F1239', label: 'Recovery' },
        }
        const key = isTreatment ? null : dayType
        const b = banners[key]
        if (!b && !isTreatment) return null
        const label = isTreatment ? (allTypes?.[dayType]?.label || dayType) : b.label
        const bg    = isTreatment ? '#E0F2FE' : b.bg
        const color = isTreatment ? '#0C4A6E' : b.color
        return <div style={{ fontSize: 11, fontWeight: 500, padding: '4px 10px', borderRadius: 0, background: bg, color, marginBottom: 10, display: 'inline-block' }}>{label}</div>
      })()}

      {/* 1. Shower routine — always at top */}
      <ShowerSection dt={date} showerHistory={showerHistory} onEditShower={onEditShower} products={products} onUpdateShowerItemProduct={onUpdateShowerItemProduct} />

      {/* 2. Morning / Night tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 8, marginTop: 10 }}>
        <button onClick={() => switchTab('am')} style={{ padding: '4px 14px', borderRadius: 0, border: `0.5px solid ${tab === 'am' ? T.pinkDeep : T.border}`, background: tab === 'am' ? T.pink : 'transparent', fontSize: 12, fontWeight: tab === 'am' ? 500 : 400, cursor: 'pointer', color: T.text }}>Morning</button>
        <button onClick={() => switchTab('pm')} style={{ padding: '4px 14px', borderRadius: 0, border: `0.5px solid ${tab === 'pm' ? T.pinkDeep : T.border}`, background: tab === 'pm' ? T.pink : 'transparent', fontSize: 12, fontWeight: tab === 'pm' ? 500 : 400, cursor: 'pointer', color: T.text }}>Night</button>
      </div>

      {/* 3. Extras — filtered by frequency + current tab, hidden when nothing matches */}
      <DailySection dt={date} dailyHistory={dailyHistory} onEditDaily={onEditDaily} tab={tab} products={products} onUpdateDailyItemProduct={onUpdateDailyItemProduct} />

      {/* 4. Skincare steps — tab-specific */}
      {!period ? (
        <div style={{ fontSize: 11, color: T.textMuted, fontStyle: 'italic', padding: '6px 0 10px', lineHeight: 1.6 }}>
          No skincare routine active for this date. Routine settings and product assignments begin on your routine start date.
        </div>
      ) : (
        <>
          {period && <div style={{ fontSize: 10, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, paddingTop: 10, borderTop: `0.5px solid ${T.border}` }}>Skincare</div>}
          {/* AM: normal routine unless it's an AM treatment */}
          {tab === 'am' && dayType === 'pause' && (
            <div style={{ fontSize: 11, color: '#92400E', background: '#FFFBEB', border: '0.5px solid #FCD34D', borderRadius: 0, padding: '5px 10px', marginBottom: 8 }}>
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
          {tab === 'am' && !isRecovery && !(isTreatment && treatTod === 'am') && renderSteps(period ? getStepsForDayType(period, 'am') : getDefaultSteps('am'), T.pinkDeep, 'am')}
          {tab === 'am' && isRecovery && renderSteps(getStepsForDayType(period, 'recovery'), T.pinkDeep, 'recovery')}
          {/* PM: treatment banner + recovery steps */}
          {tab === 'pm' && isTreatment && (
            <div style={{ fontSize: 11, padding: '6px 10px', borderRadius: 0, background: '#E0F2FE', color: '#0C4A6E', marginBottom: 8, lineHeight: 1.5 }}>
              {treatTod === 'pm'
                ? 'Treatment tonight — use recovery products after your appointment.'
                : 'Treatment this morning — recovery begins tonight.'}
            </div>
          )}
          {tab === 'pm' && dayType === 'pause' && (
            <div style={{ fontSize: 11, color: '#92400E', background: '#FFFBEB', border: '0.5px solid #FCD34D', borderRadius: 0, padding: '5px 10px', marginBottom: 8 }}>
              Pre-treatment pause — skip actives tonight. Regular cleanse and moisturizer only.
            </div>
          )}
          {tab === 'pm' && renderSteps(pmSteps, dayType === 'tret' ? '#A78BFA' : T.orange, nightType)}
        </>
      )}
    </div>
  )
}


// ─── NEW ROUTINE PERIOD PICKER ───────────────────────────────
// Asks "What kind of routine would you like to add?" then shows the right form
function NewRoutinePeriodPicker({ routineHistory, dailyHistory, showerHistory, products, onSaveNew, onSaveDaily, onSaveShower, onCancel, onSaveProduct, onEditConflictRoutine, now }) {
  const [chosen, setChosen] = useState(null)

  const options = [
    { key: 'skincare', label: 'Skincare routine', desc: 'Your morning and evening steps — from cleanse to SPF, actives, and treatments.' },
    { key: 'daily',    label: 'Extras',              desc: 'The little things that make a big difference — growth serums, eye patches, tools, supplements.' },
    { key: 'shower',   label: 'Shower routine',      desc: 'Body washes, hair treatments, and anything else that happens in the shower.' },
  ]

  if (!chosen) return (
    <div style={{ background: T.white, border: `0.5px solid ${T.border}`, borderRadius: 0, padding: '18px 18px', marginBottom: 14 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 4 }}>What kind of routine would you like to add?</div>
      <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 14 }}>Each type is tracked separately with its own history.</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
        {options.map(o => (
          <button key={o.key} onClick={() => setChosen(o.key)} style={{
            padding: '12px 14px', borderRadius: 0,
            border: `0.5px solid ${T.border}`, background: T.cream,
            textAlign: 'left', cursor: 'pointer',
            transition: 'border-color 0.15s, background 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = T.pinkDeep; e.currentTarget.style.background = T.pink }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = T.cream }}
          >
            <div style={{ fontSize: 13, fontWeight: 500, color: T.text, marginBottom: 2 }}>{o.label}</div>
            <div style={{ fontSize: 11, color: T.textMuted }}>{o.desc}</div>
          </button>
        ))}
      </div>
      <Btn onClick={onCancel}>Cancel</Btn>
    </div>
  )

  return (
    <div>
      {/* Back link lives inside a wrapper card so it feels contained */}
      <div style={{ background: T.white, border: `0.5px solid ${T.border}`, borderRadius: 0, marginBottom: 14, overflow: 'hidden' }}>
        <button onClick={() => setChosen(null)} style={{ border: 'none', borderBottom: `0.5px solid ${T.border}`, background: T.creamDark, fontSize: 12, color: T.pinkDeep, cursor: 'pointer', padding: '10px 16px', display: 'block', width: '100%', textAlign: 'left' }}>
          ← Back to routine type
        </button>
        <div style={{ padding: '0' }}>
          {chosen === 'skincare' && (
            <RoutinePeriodForm
              initial={{ ...getActivePeriod(now, routineHistory), startDate: '' }}
              onSave={onSaveNew}
              onCancel={onCancel}
              isFirst={false}
              allPeriods={routineHistory}
              products={products}
              onSaveProduct={onSaveProduct}
              onEditConflict={onEditConflictRoutine}
            />
          )}
          {chosen === 'daily' && (
            <DailyEditor
              initial={getActiveDailyPeriod(now, dailyHistory) ? { ...getActiveDailyPeriod(now, dailyHistory), startDate: '', endDate: null, id: null } : null}
              onSave={onSaveDaily}
              onCancel={onCancel}
              allPeriods={dailyHistory}
              onEditConflict={(p) => openDailyEditor(p)}
              products={products}
              onSaveProduct={onSaveProduct}
            />
          )}
          {chosen === 'shower' && (
            <ShowerEditor
              initial={getActiveShowerPeriod(now, showerHistory) ? { ...getActiveShowerPeriod(now, showerHistory), startDate: '', endDate: null, id: null } : null}
              onSave={onSaveShower}
              onCancel={onCancel}
              allPeriods={showerHistory}
              onEditConflict={(p) => openShowerEditor(p)}
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

function generateICS({ routineHistory, treatments, allTypes, products, settings }) {
  // format: 'allday' | 'combined' | 'separate'
  // amMode / pmMode: 'same' | 'custom'
  // amTimes, pmTimes: { 0..6: 'HH:MM' }
  // amTime, pmTime: 'HH:MM' (when mode === 'same')
  const { format, daysAhead, amMode, amTimes, amTime, pmMode, pmTimes, pmTime } = settings

  const getAM = dow => amMode === 'same' ? (amTime || '07:00') : (amTimes?.[dow] || '07:00')
  const getPM = dow => pmMode === 'same' ? (pmTime || '22:30') : (pmTimes?.[dow] || '22:30')

  const lines = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//GlowUp Calendar//EN','CALSCALE:GREGORIAN','METHOD:PUBLISH']
  // Sequence number — increments each export so calendar apps update existing events
  const seqNum = Math.floor(Date.now() / 1000)
  const dtstamp = (() => { const n = new Date(); return `${n.getUTCFullYear()}${String(n.getUTCMonth()+1).padStart(2,'0')}${String(n.getUTCDate()).padStart(2,'0')}T${String(n.getUTCHours()).padStart(2,'0')}${String(n.getUTCMinutes()).padStart(2,'0')}${String(n.getUTCSeconds()).padStart(2,'0')}Z` })()
  const today = new Date(); today.setHours(0,0,0,0)

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
    else nightType = 'off'

    const rawLabel = info.isTreatment ? (allTypes[info.status]?.label || info.status) : ''
    const statusLabel = info.isTreatment
      ? (rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1).toLowerCase())
      : info.status === 'tret' ? `${period?.activeName ? (period.activeName.charAt(0).toUpperCase() + period.activeName.slice(1)) : 'Tretinoin'} night`
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
            <button key={k} onClick={() => setMode(k)} style={{ fontSize: 9, padding: '2px 7px', borderRadius: 0, cursor: 'pointer', border: `0.5px solid ${mode===k ? T.pinkDeep : T.border}`, background: mode===k ? T.pink : 'transparent', color: mode===k ? T.text : T.textLight }}>{l}</button>
          ))}
        </div>
      </div>
      {mode === 'same' ? (
        <input type="time" value={singleTime} onChange={e => setSingleTime(e.target.value)}
          style={{ fontSize: 12, padding: '5px 8px', border: `0.5px solid ${T.border}`, borderRadius: 0, background: T.cream, color: T.text }} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
          {[0,1,2,3,4,5,6].map(d => (
            <div key={d} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 9, fontWeight: 600, color: T.textMuted, marginBottom: 2 }}>{DOW_LABELS[d]}</div>
              <input type="time" value={times[d]} onChange={e => setTimes(t => ({ ...t, [d]: e.target.value }))}
                style={{ width: '100%', fontSize: 9, padding: '2px 1px', border: `0.5px solid ${T.border}`, borderRadius: 0, background: T.cream, color: T.text }} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── EXPORT PANEL ─────────────────────────────────────────────
function ExportPanel({ routineHistory, treatments, allTypes, products, dailyHistory, showerHistory, onClose, onNotion }) {
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
    const ics = generateICS({ routineHistory, treatments, allTypes, products, settings })
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'glowup-routine.ics'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ background: T.white, border: `0.5px solid ${T.border}`, borderRadius: 0, padding: '16px 18px', marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>Export</div>
        <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 18, color: T.textMuted, padding: '0 2px', lineHeight: 1 }}>×</button>
      </div>

      {/* Notion */}
      <div style={{ marginBottom: 14, paddingBottom: 14, borderBottom: `0.5px solid ${T.border}` }}>
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
            <button key={f.key} onClick={() => setFormat(f.key)} style={{ padding: '8px 12px', borderRadius: 0, border: `0.5px solid ${format===f.key ? T.pinkDeep : T.border}`, background: format===f.key ? T.pink : 'transparent', fontSize: 11, cursor: 'pointer', color: T.text, textAlign: 'left' }}>
              <span style={{ fontWeight: 500 }}>{f.label}</span>
              <span style={{ color: T.textMuted }}> — {f.desc}</span>
            </button>
          ))}
        </div>

        {/* Date range */}
        <FieldLabel>How far ahead</FieldLabel>
        <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
          {[30,60,90].map(d => (
            <button key={d} onClick={() => setDaysAhead(d)} style={{ padding: '5px 14px', borderRadius: 0, border: `0.5px solid ${daysAhead===d ? T.pinkDeep : T.border}`, background: daysAhead===d ? T.pink : 'transparent', fontSize: 11, cursor: 'pointer', color: T.text }}>{d} days</button>
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
    <div style={{ background: T.white, border: `0.5px solid ${T.border}`, borderRadius: 0, padding: '16px 18px', marginBottom: 14 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>Recovery routine</div>
          <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>{typeLabel}</div>
        </div>
        <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 18, color: T.textMuted, lineHeight: 1 }}>×</button>
      </div>

      <div style={{ fontSize: 11, color: T.textMuted, lineHeight: 1.6, padding: '8px 10px', background: T.creamDark, borderRadius: 0, marginBottom: 14, border: `0.5px solid ${T.border}` }}>
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
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 12px', borderRadius: 0, cursor: 'pointer',
                  background: isOpen ? T.pink : 'transparent',
                  border: `0.5px solid ${isOpen ? T.pinkDeep : T.border}`,
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
                      style={{ fontSize: 10, padding: '2px 8px', borderRadius: 0, border: `0.5px solid ${T.border}`, background: 'transparent', color: T.textMuted, cursor: 'pointer', fontFamily: 'inherit' }}>
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
                  onSelect={(stepKey, productId) => { onProductSelect(stepKey, productId); setOpenStepKey(null) }}
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
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: `0.5px solid ${T.border}` }}>
          <div style={{ fontSize: 10, color: T.textLight, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
            Add a step
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {hiddenSteps.map(step => (
              <button key={step.id} onClick={() => onStepToggle(step.id, true)}
                style={{ fontSize: 11, padding: '4px 10px', borderRadius: 0, border: `0.5px solid ${T.border}`, background: T.white, color: T.textMuted, cursor: 'pointer', fontFamily: 'inherit' }}>
                + {step.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function UpcomingTreatmentsPanel({ treatments, allTypes, routineHistory, onClose, onEdit, onRemove, onAddNew, recoveryRoutines, onUpdateRecoveryProducts, onUpdateRecoverySteps, getRecoveryStepsForType, products }) {
  const now = new Date(); now.setHours(0,0,0,0)
  const [addingDate, setAddingDate] = useState('')
  const [editingRecovery, setEditingRecovery] = useState(null) // typeKey being edited
  const sorted = Object.entries(treatments).sort(([a],[b]) => a.localeCompare(b))
  const upcoming = sorted.filter(([k]) => new Date(k+'T00:00:00') >= now)
  const past     = sorted.filter(([k]) => new Date(k+'T00:00:00') <  now)

  function renderTreatment([key, tv], isPast) {
    const dt  = new Date(key+'T00:00:00')
    const cfg = { pre: tv.pre ?? allTypes[tv.type]?.pre ?? 0, post: tv.post ?? allTypes[tv.type]?.post ?? 0 }
    const typeLabel = allTypes[tv.type]?.label || tv.type
    const isToday = key === dateKey(now)
    const areaLabel = tv.area ? ` · ${tv.area.charAt(0).toUpperCase()+tv.area.slice(1)}` : ''
    const todLabel  = tv.timeOfDay === 'pm' ? 'Evening' : 'Morning'

    return (
      <div key={key} style={{ padding: '10px 0', borderBottom: `0.5px solid ${T.border}`, opacity: isPast ? 0.55 : 1 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          {/* Date block */}
          <div style={{ minWidth: 48, textAlign: 'center', padding: '4px 6px', borderRadius: 0, background: isToday ? T.pink : T.creamDark, border: `0.5px solid ${isToday ? T.pinkDeep : T.border}`, flexShrink: 0 }}>
            <div style={{ fontSize: 9, fontWeight: 600, color: isToday ? T.pinkDeep : T.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {dt.toLocaleString('default',{month:'short'})}
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: isToday ? T.pinkDeep : T.text, lineHeight: 1.1 }}>{dt.getDate()}</div>
            <div style={{ fontSize: 9, color: T.textLight }}>{dt.getFullYear()}</div>
          </div>

          {/* Details */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{typeLabel}</span>
              {isToday && <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 0, background: T.pink, color: T.pinkDeep, fontWeight: 600 }}>Today</span>}
            </div>
            <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 4 }}>
              {todLabel}{areaLabel}
              {cfg.pre > 0 && ` · ${cfg.pre}d pause before`}
              {cfg.post > 0 && ` · ${cfg.post}d recovery after`}
            </div>
            {isPast && (
              <div style={{ fontSize: 10, color: T.textLight, fontStyle: 'italic' }}>
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
                <div style={{ fontSize: 10, color: '#92400E', background: '#FFFBEB', border: '0.5px solid #FCD34D', borderRadius: 0, padding: '2px 6px', display: 'inline-block', marginTop: 2 }}>
                  Pause window active — {daysUntil}d until treatment
                </div>
              ) : daysUntilPause > 0 ? (
                <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2 }}>
                  Pause actives in {daysUntilPause}d · Treatment in {daysUntil}d
                </div>
              ) : null
            })()}
          </div>

          {/* Actions */}
          {!isPast && (
            <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
              <Btn onClick={() => onEdit(key)} style={{ fontSize: 10, padding: '3px 8px' }}>Edit</Btn>
              {cfg.post > 0 && (
                <Btn
                  onClick={() => setEditingRecovery(editingRecovery === key ? null : key)}
                  style={{ fontSize: 10, padding: '3px 8px', background: editingRecovery === key ? T.pink : undefined, borderColor: editingRecovery === key ? T.pinkDeep : undefined }}
                >
                  Set recovery routine
                </Btn>
              )}
              <button onClick={() => onRemove(key)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: T.textLight, fontSize: 16, padding: '0 4px', lineHeight: 1 }}>×</button>
            </div>
          )}
        </div>
        {/* Recovery routine editor — full width BELOW the flex row */}
        {editingRecovery === key && (
          <div style={{ marginTop: 8 }}>
            <RecoveryRoutineEditor
              typeKey={tv.type}
              typeLabel={allTypes[tv.type]?.label || tv.type}
              steps={getRecoveryStepsForType(tv.type)}
              products={recoveryRoutines?.[tv.type]?.products || {}}
              allProducts={products}
              onStepToggle={(stepId, enabled) => {
                const steps = getRecoveryStepsForType(tv.type).map(s =>
                  s.id === stepId ? { ...s, enabled } : s
                )
                onUpdateRecoverySteps(tv.type, steps)
              }}
              onProductSelect={(stepKey, productId) => onUpdateRecoveryProducts(tv.type, stepKey, productId)}
              onClose={() => setEditingRecovery(null)}
            />
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{ background: T.white, border: `0.5px solid ${T.border}`, borderRadius: 0, padding: '16px 18px', marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>Treatments</div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>

          <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 18, color: T.textMuted, padding: '0 2px', lineHeight: 1 }}>×</button>
        </div>
      </div>

      {/* Add new treatment */}
      <div style={{ marginBottom: 14, paddingBottom: 14, borderBottom: `0.5px solid ${T.border}` }}>
        {addingDate ? (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <DateInput value={addingDate} onChange={e => setAddingDate(e.target.value)} />
            <Btn variant="primary" disabled={!addingDate} onClick={() => { onAddNew(addingDate); setAddingDate('') }} style={{ fontSize: 11, padding: '5px 12px' }}>
              Choose type →
            </Btn>
            <Btn onClick={() => setAddingDate('')} style={{ fontSize: 11, padding: '5px 10px' }}>Cancel</Btn>
          </div>
        ) : (
          <Btn variant="primary" onClick={() => setAddingDate(dateKey(new Date()))} style={{ fontSize: 11, padding: '5px 12px' }}>
            + Add a treatment
          </Btn>
        )}
      </div>

      {Object.keys(treatments).length === 0 ? (
        <div style={{ fontSize: 12, color: T.textMuted, background: T.creamDark, borderRadius: 0, padding: '12px 14px', lineHeight: 1.6 }}>
          No treatments scheduled yet. Tap any date on the calendar to add a treatment.
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Upcoming</div>
              {upcoming.map(t => renderTreatment(t, false))}
            </div>
          )}
          {past.length > 0 && (
            <div style={{ marginTop: upcoming.length > 0 ? 14 : 0 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Past</div>
              {past.slice(0, 5).map(t => renderTreatment(t, true))}
              {past.length > 5 && (
                <div style={{ fontSize: 11, color: T.textLight, fontStyle: 'italic', paddingTop: 8 }}>+{past.length - 5} older treatments</div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}



// ─── FEEDBACK PANEL ───────────────────────────────────────────
function FeedbackPanel({ onClose }) {
  const [type,    setType]    = useState('general')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent,    setSent]    = useState(false)

  const types = [
    { key: 'bug',     label: '🐛 Bug report' },
    { key: 'feature', label: '✨ Feature idea' },
    { key: 'general', label: '💬 General' },
  ]

  async function handleSend() {
    if (!message.trim()) return
    setSending(true)
    // user_id intentionally omitted — feedback is anonymous
    await supabase.from('feedback').insert({ type, message: message.trim() })
    setSending(false)
    setSent(true)
    setTimeout(() => { setSent(false); setMessage(''); onClose() }, 2000)
  }

  return (
    <div style={{ background: T.white, border: `0.5px solid ${T.border}`, borderRadius: 0, padding: '16px 18px', marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>Send feedback</div>
        <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 18, color: T.textMuted, lineHeight: 1 }}>×</button>
      </div>

      {/* Anonymity notice */}
      <div style={{ fontSize: 11, color: T.textMuted, lineHeight: 1.6, padding: '8px 10px', background: T.creamDark, borderRadius: 0, marginBottom: 12, border: `0.5px solid ${T.border}` }}>
        🔒 Feedback is completely anonymous. Your name, account, and identity are never attached to what you write here.
      </div>

      {/* Type picker */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {types.map(t => (
          <button key={t.key} onClick={() => setType(t.key)} style={{
            flex: 1, padding: '6px 8px', borderRadius: 0, fontSize: 11, cursor: 'pointer',
            border: `0.5px solid ${type === t.key ? T.pinkDeep : T.border}`,
            background: type === t.key ? T.pink : 'transparent', color: T.text, fontFamily: 'inherit',
          }}>{t.label}</button>
        ))}
      </div>

      {/* Message */}
      <textarea
        value={message}
        onChange={e => setMessage(e.target.value)}
        placeholder="What's on your mind? Be as specific as you can — steps to reproduce a bug, or what you wish the app did differently."
        rows={5}
        style={{
          width: '100%', fontSize: 12, padding: '10px 12px', border: `0.5px solid ${T.border}`,
          borderRadius: 0, background: T.cream, color: T.text, resize: 'vertical',
          fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', lineHeight: 1.6,
          marginBottom: 10,
        }}
      />

      <button
        onClick={handleSend}
        disabled={sending || !message.trim()}
        style={{
          width: '100%', padding: '10px', borderRadius: 0, border: 'none',
          background: sent ? '#4ADE80' : T.pinkDeep,
          color: sent ? '#14532D' : T.white,
          fontSize: 12, fontWeight: 600, cursor: sending || !message.trim() ? 'default' : 'pointer',
          opacity: !message.trim() ? 0.5 : 1, transition: 'background 0.2s', fontFamily: 'inherit',
        }}
      >{sent ? '✓ Sent — thank you!' : sending ? 'Sending...' : 'Send feedback'}</button>
    </div>
  )
}

// ─── SIDE MENU ────────────────────────────────────────────────
function SideMenu({ session, menuProfile, onClose, onHistory, onLibrary, onExport, onSignOut, onFeedback }) {
  const email = session?.user?.email || ''
  // Use pre-loaded profile from parent — no fetch, no flash
  const displayName = menuProfile?.display_name || email.split('@')[0]
  const avatarUrl   = menuProfile?.avatar_url || null
  // Preload avatar image so Avatar never flashes initials before image
  const [imageReady, setImageReady] = useState(!avatarUrl)
  useEffect(() => {
    if (!avatarUrl) { setImageReady(true); return }
    const img = new Image()
    img.onload = () => setImageReady(true)
    img.onerror = () => setImageReady(true)
    img.src = avatarUrl
  }, [avatarUrl])
  const avatarReady = menuProfile !== null && imageReady
  const menuItems = [
    { label: 'Routine history',  icon: '📋', action: onHistory },
    { label: 'Product library',  icon: '🧴', action: onLibrary },
    { label: 'Export',           icon: '↑',  action: onExport  },
    { label: 'Profile',          icon: '👤', action: () => { window.location.href = '/routine/profile' } },
    { label: 'Send feedback',     icon: '💬', action: onFeedback },
  ]

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.2)', zIndex: 200 }} />
      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 260,
        background: T.white, borderLeft: `0.5px solid ${T.border}`,
        zIndex: 201, display: 'flex', flexDirection: 'column',
        fontFamily: 'inherit', boxShadow: '-4px 0 24px rgba(0,0,0,0.08)',
      }}>
        {/* Header — avatar + name */}
        <div style={{ padding: '20px 20px 16px', borderBottom: `0.5px solid ${T.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* Avatar — blank circle until image is preloaded to avoid any flash */}
              {!avatarReady ? (
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: T.creamDark, flexShrink: 0 }} />
              ) : (
                <Avatar
                  avatarUrl={avatarUrl}
                  displayName={displayName}
                  email={email}
                  size={44}
                />
              )}
              {/* Name — only show once ready */}
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {avatarReady ? displayName : ''}
                </div>
              </div>
            </div>
            <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 20, color: T.textMuted, padding: '0 2px', lineHeight: 1, flexShrink: 0 }}>×</button>
          </div>
        </div>

        {/* Menu items */}
        <div style={{ flex: 1, padding: '8px 0', overflowY: 'auto' }}>
          {menuItems.map(({ label, icon, action }) => (
            <button key={label} onClick={() => { action(); onClose() }} style={{
              display: 'flex', alignItems: 'center', gap: 12, width: '100%',
              padding: '12px 20px', border: 'none', background: 'transparent',
              cursor: 'pointer', textAlign: 'left', fontSize: 13, color: T.text,
              borderBottom: `0.5px solid ${T.border}`,
            }}
              onMouseEnter={e => e.currentTarget.style.background = T.creamDark}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <span style={{ fontSize: 16, width: 20, textAlign: 'center' }}>{icon}</span>
              {label}
            </button>
          ))}
        </div>

        {/* Footer — sign out */}
        <div style={{ padding: '12px 20px', borderTop: `0.5px solid ${T.border}` }}>
          <button onClick={onSignOut} style={{
            display: 'flex', alignItems: 'center', gap: 12, width: '100%',
            padding: '10px 0', border: 'none', background: 'transparent',
            cursor: 'pointer', fontSize: 13, color: T.textLight, textAlign: 'left',
          }}>
            <span style={{ fontSize: 16, width: 20, textAlign: 'center' }}>→</span>
            Sign out
          </button>
        </div>
      </div>
    </>
  )
}

// ─── MAIN COMPONENT ──────────────────────────────────────────
export default function GlowUpCalendar({ session }) {
  const userId = session?.user?.id
  const now = new Date(); now.setHours(0,0,0,0)

  const [year,  setYear]  = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())

  const [routineHistory, setRoutineHistory] = useState([])
  const [products,       setProducts]       = useState({})
  const catalogIds = useRef(new Set())
  const [dailyHistory,   setDailyHistory]   = useState([])
  const [showerHistory,  setShowerHistory]  = useState([])
  const [treatments,     setTreatments]     = useState({})
  const [customTypes,    setCustomTypes]    = useState({})
  const [activeProgram,  setActiveProgram]  = useState(null)   // user_programs row or null
  const [onboardingDone, setOnboardingDone] = useState(null)   // null=loading, true/false

  // panel: 'setup' | 'update' | 'history' | null
  const [panel,         setPanel]         = useState(null)
  // editingPeriod: the period being edited in place, or null
  const [editingPeriod, setEditingPeriod] = useState(null)
  const [editingDaily,  setEditingDaily]  = useState(null) // null | 'new' | period object
  const [editingShower, setEditingShower] = useState(null) // null | 'new' | period object
  const [editingProduct, setEditingProduct] = useState(null) // null | 'new' | product object
  const [selector,      setSelector]      = useState(null)
  const [dayFlyout,     setDayFlyout]     = useState(null) // { key, date, tab: 'am'|'pm', dayType }
  const [toast,         setToast]         = useState(false)
  const [showExport,    setShowExport]    = useState(false)
  const [loading,       setLoading]       = useState(true)


  // ── Handle actions from history page ─────────────────────────────────────
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
        supabase.from('profiles').select('recovery_routines, display_name, avatar_url').eq('id', userId).single(),
        supabase.from('products').select('*').or(`is_catalog.eq.true,user_id.eq.${userId}`),
        supabase.from('extras_periods').select('*').eq('user_id', userId).order('start_date'),
        supabase.from('shower_periods').select('*').eq('user_id', userId).order('start_date'),
        supabase.from('treatments').select('*').eq('user_id', userId),
        supabase.from('custom_treatment_types').select('*').eq('user_id', userId),
        supabase.from('user_programs').select('*').eq('user_id', userId).eq('status', 'active').maybeSingle(),
      ])
      const getValue = (r) => r.status === 'fulfilled' ? (r.value?.data ?? null) : null
      const [rp, profileRR, pr, ep, sp, tr, ct, up] = results.map(getValue)

      // Active program
      setActiveProgram(up || null)
      setOnboardingDone(!!(up || (rp && rp.length > 0)))

      // Routine periods — convert snake_case from DB to camelCase
      setRoutineHistory((rp || []).map(p => ({
        startDate:       p.start_date,
        endDate:         p.end_date,
        activeName:      p.active_name,
        tretEnabled:     p.tret_enabled,
        tretFrequency:   p.tret_frequency,
        tretStartDate:   p.tret_start_date,
        secondaryActives:p.secondary_actives || [],
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
      if (profileRR) setMenuProfile({ display_name: profileRR.display_name, avatar_url: profileRR.avatar_url })
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
        }
      })
      setProducts(prodMap)

      // Extras periods
      setDailyHistory((ep || []).map(p => ({ id: p.id, startDate: p.start_date, endDate: p.end_date, items: p.items || [], createdAt: p.created_at, updatedAt: p.updated_at })))

      // Shower periods
      setShowerHistory((sp || []).map(p => ({ id: p.id, startDate: p.start_date, endDate: p.end_date, items: p.items || [], createdAt: p.created_at, updatedAt: p.updated_at })))

      // Treatments — convert array to keyed object
      const treatMap = {}
      ;(tr || []).forEach(t => {
        treatMap[t.date] = { type: t.type, timeOfDay: t.time_of_day, area: t.area, pre: t.pre_days, post: t.post_days, _dbId: t.id }
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
  }, [userId])
  const [showTreatments, setShowTreatments] = useState(false)
  const [showMenu,      setShowMenu]      = useState(false)
  const [showFeedback,  setShowFeedback]  = useState(false)
  const [recoveryRoutines, setRecoveryRoutines] = useState({})
  const [menuProfile, setMenuProfile] = useState(null)
  const [loadError, setLoadError] = useState(null)
  const [editFromHistory, setEditFromHistory] = useState(false)
  const [dailyFromHistory, setDailyFromHistory] = useState(false)
  const [showerFromHistory, setShowerFromHistory] = useState(false)
  const [showAllBadges, setShowAllBadges] = useState(() => localStorage.getItem('glowup-show-all-badges') === 'true')

  // Persistence
  // Persist badge toggle
  useEffect(() => { localStorage.setItem('glowup-show-all-badges', showAllBadges) }, [showAllBadges])
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
        .filter(p => !p.id?.startsWith('seed-') || p._modified)
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

  // Treatments — upsert changed rows, delete removed rows by tracking a ref
  const prevTreatmentsRef = useRef(null)
  useEffect(() => {
    if (!userId || loading) return
    // Never wipe all treatments — only delete keys that were removed since last sync
    async function sync() {
      const prev = prevTreatmentsRef.current
      const current = treatments

      // Upsert all current treatments
      const rows = Object.entries(current).map(([date, t]) => ({
        id: t._dbId,
        user_id: userId, date,
        type: t.type, time_of_day: t.timeOfDay || 'am',
        area: t.area || 'face', pre_days: t.pre, post_days: t.post,
      }))
      if (rows.length > 0) await supabase.from('treatments').upsert(rows)

      // Delete only keys that existed before but are gone now
      if (prev) {
        const removed = Object.keys(prev).filter(k => !current[k])
        for (const date of removed) {
          const dbId = prev[date]?._dbId
          if (dbId) await supabase.from('treatments').delete().eq('id', dbId)
        }
      }
      prevTreatmentsRef.current = current
    }
    sync()
  }, [treatments, userId, loading])

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

  // ── Routine handlers ─────────────────────────────────────

  // Add a new period — auto-sets endDate on the currently active period
  async function saveNewPeriod(form) {
    // Write to Supabase directly — get back the DB id
    const row = {
      user_id: userId, start_date: form.startDate, end_date: form.endDate || null,
      active_name: form.activeName, tret_enabled: form.tretEnabled,
      tret_frequency: form.tretFrequency, tret_start_date: form.tretStartDate || null,
      secondary_actives: form.secondaryActives || [], products: form.products || {},
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
      secondary_actives: form.secondaryActives || [], products: form.products || {},
    }
    const editNow = new Date().toISOString()
    if (editingPeriod._dbId) {
      await supabase.from('routine_periods').update({ ...row, updated_at: editNow }).eq('id', editingPeriod._dbId)
    }
    setRoutineHistory(h => h.map(p =>
      p.startDate === editingPeriod.startDate ? { ...form, _dbId: editingPeriod._dbId, createdAt: editingPeriod.createdAt, updatedAt: editNow } : p
    ))
    setEditingPeriod(null)
    setEditFromHistory(false)
    if (editFromHistory) setPanel('history')
    else setPanel(null)
  }

  function startEdit(period) {
    setEditingPeriod(period)
    setPanel(null)
    setDayFlyout(null)
  }

  function cancelEdit() {
    setEditingPeriod(null)
    if (editFromHistory) {
      setPanel('history')
      setEditFromHistory(false)
    }
  }

  async function deletePeriod(startDate) {
    const period = routineHistory.find(p => p.startDate === startDate)
    if (period?._dbId) {
      await supabase.from('routine_periods').delete().eq('id', period._dbId)
      setRoutineHistory(h => h.filter(p => p._dbId !== period._dbId))
    } else {
      setRoutineHistory(h => h.filter(p => p.startDate !== startDate))
    }
  }

  async function deleteDaily(id) {
    await supabase.from('extras_periods').delete().eq('id', id)
    setDailyHistory(h => h.filter(p => p.id !== id))
  }

  async function deleteShower(id) {
    await supabase.from('shower_periods').delete().eq('id', id)
    setShowerHistory(h => h.filter(p => p.id !== id))
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
    if (dailyFromHistory) { setPanel('history'); setDailyFromHistory(false) }
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
    if (showerFromHistory) { setPanel('history'); setShowerFromHistory(false) }
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
      if (p._dbId) supabase.from('daily_periods').update({ items: newItems }).eq('id', p._dbId)
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
    const treatTod = info.isTreatment ? (treatments[key]?.timeOfDay || 'am') : null
    setDayFlyout({ key, date: dt, tab, dayType: info.status, isTreatment: info.isTreatment, treatmentTimeOfDay: treatTod, activeTreatmentType: info.activeTreatmentType || null })
    setPanel(null)
    setEditingPeriod(null)
    setEditingDaily(null)
    setSelector(null)
  }

  

  async function applyTreatment(type, qure, timeOfDay = 'am', area = 'face', pre, post) {
    const cfg = allTypes[type] || {}
    const existing = treatments[selector.key]
    const row = {
      user_id: userId, date: selector.key, type,
      time_of_day: timeOfDay, area, pre_days: pre ?? cfg.pre, post_days: post ?? cfg.post,
    }
    let dbId = existing?._dbId
    if (dbId) {
      await supabase.from('treatments').update(row).eq('id', dbId)
    } else {
      const { data } = await supabase.from('treatments').insert(row).select().single()
      dbId = data?.id
    }
    setTreatments(t => ({ ...t, [selector.key]: { type, timeOfDay, area, pre: pre ?? cfg.pre, post: post ?? cfg.post, _dbId: dbId } }))
    setSelector(null)
  }

  async function removeTreatment() {
    const existing = treatments[selector.key]
    if (existing?._dbId) await supabase.from('treatments').delete().eq('id', existing._dbId)
    setTreatments(t => { const n = { ...t }; delete n[selector.key]; return n })
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
      <div key={`prev${i}`} style={{ position: 'relative', borderRadius: 0, border: `0.5px solid ${T.border}`, display: 'flex', flexDirection: 'column', minHeight: '88px' }}>
        <div style={{ fontSize: 10, color: T.textLight, padding: '3px 5px', fontWeight: 400, opacity: 0.5 }}>{dayNum}</div>
      </div>
    )
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dt      = new Date(year, month, d)
    const key     = dateKey(dt)
    const info    = getDayInfo(dt, treatments, allTypes, routineHistory)
    const period  = getActivePeriod(dt, routineHistory)
    const isToday = dt.getTime() === now.getTime()
    const massage = isMassageDay(dt, info, period)
    const s       = info.status
    const hasRoutinePeriod = !!getActivePeriod(dt, routineHistory)
    // Days with no routine period get plain white; active routine days get a subtle tint
    let cellBg = hasRoutinePeriod ? '#FAF5FF' : T.white
    let cellBorder = hasRoutinePeriod ? '#E9D8FD' : T.border
    if      (info.isTreatment && T[s])              { cellBg = T[s].bg;       cellBorder = T[s].border       }
    else if (s === 'pause')                         { cellBg = T.pause.bg;    cellBorder = T.pause.border    }
    else if (s === 'pca' || s === 'recovery')       { cellBg = T.recovery.bg; cellBorder = T.recovery.border }
    else if (s === 'tret')                          { cellBg = T.tret.bg;     cellBorder = T.tret.border     }
    else if (s === 'bha')                           { cellBg = T.bha.bg;      cellBorder = T.bha.border      }

    // Date row label
    const dateColor = isToday ? T.pinkDeep : (info.isTreatment && T[s] ? T[s].text : s === 'pause' ? T.pause.text : (s === 'pca' || s === 'recovery') ? T.recovery.text : s === 'tret' ? T.tret.text : s === 'bha' ? T.bha.text : T.textMuted)

    // Determine treatment time of day (default am for backward compat)
    const treatmentTimeOfDay = info.isTreatment ? (treatments[key]?.timeOfDay || 'am') : null

    // AM badge — tier system, single badge
    const amBadge = (() => {
      // Tier 1 — AM treatment
      if (info.isTreatment && treatmentTimeOfDay === 'am')
        return (() => { const lbl = allTypes[s]?.label || s; return <Badge key="t" colorKey={s} label={lbl.charAt(0).toUpperCase() + lbl.slice(1).toLowerCase()} /> })()
      // Recovery AM
      if (s === 'pca' || s === 'recovery')
        return <Badge key="r" colorKey="recovery" label="Recovery" />

      if (!showAllBadges) {
        // Tier 1 still: massage is now an extra — skip if not showing all
        return null
      }
      // Tier 3 — extras: first active AM item
      const epAM = getActiveDailyPeriod(dt, dailyHistory)
      if (epAM) {
        const firstAMExtra = (epAM.items || []).find(item => {
          const tod = item.timeOfDay || 'both'
          return isShowerItemActive(dt, item, epAM.startDate) && (tod === 'am' || tod === 'both')
        })
        if (firstAMExtra) {
          const rawE = firstAMExtra.label.split('(')[0].split('/')[0].trim()
          const short = rawE.charAt(0).toUpperCase() + rawE.slice(1)
          return <Badge key="e" colorKey="pause" label={short.length > 12 ? short.slice(0,11)+'…' : short} />
        }
      }
      // Tier 4 — shower badges deactivated (shower time varies)
      // if (spAM && ...) return <Badge ... label="Shower" />
      return null
    })()
    const amBadges = amBadge ? [amBadge] : []

    // PM badge — tier system, single badge per half
    // T1: vitamin A / no actives / recovery (always)
    // T2: secondary actives (always)
    // T3: extras today (only if showAllBadges)
    // T4: shower items today (only if showAllBadges)
    const pmBadge = (() => {
      if (info.isTreatment) {
        // PM of treatment day: show treatment badge if PM appt, recovery badge if AM appt
        if (treatmentTimeOfDay === 'pm')
          return (() => { const lbl = allTypes[s]?.label || s; return <Badge key="t" colorKey={s} label={lbl.charAt(0).toUpperCase() + lbl.slice(1).toLowerCase()} /> })()
        return <Badge key="r" colorKey="recovery" label="Recovery" />
      }
      if (s === 'pause')    return <Badge key="p" colorKey="pause"         label="No actives"       />
      if (s === 'pca')      return <Badge key="p" colorKey="recovery"      label="Recovery" />
      if (s === 'recovery') return <Badge key="p" colorKey="recovery"      label="Recovery" />
      if (s === 'tret') { const an = period?.activeName || 'tretinoin'; return <Badge key="p" colorKey="tret" label={an.charAt(0).toUpperCase() + an.slice(1)} /> }
      if (!showAllBadges) return null
      // Tier 3 — extras: show first active PM item's label
      const ep = getActiveDailyPeriod(dt, dailyHistory)
      if (ep) {
        const firstPMExtra = (ep.items || []).find(item => {
          const tod = item.timeOfDay || 'both'
          return isShowerItemActive(dt, item, ep.startDate) && (tod === 'pm' || tod === 'both')
        })
        if (firstPMExtra) {
          const rawE = firstPMExtra.label.split('(')[0].split('/')[0].trim()
          const short = rawE.charAt(0).toUpperCase() + rawE.slice(1)
          return <Badge key="e" colorKey="pause" label={short.length > 12 ? short.slice(0,11)+'…' : short} />
        }
      }
      // Tier 4 — shower badges deactivated
      return null
    })()
    const pmBadges = pmBadge ? [pmBadge] : []
    const isOpen = dayFlyout?.key === key
    const activePeriod = getActivePeriod(dt, routineHistory)

    cells.push(
      <div key={key} style={{ position: 'relative', borderRadius: 0, border: `0.5px solid ${isOpen ? T.pinkDeep : cellBorder}`, outline: isToday ? `2px solid ${T.pinkDeep}` : 'none', outlineOffset: -1, display: 'flex', flexDirection: 'column', zIndex: isOpen ? 100 : 1, minHeight: '88px' }}>
        {/* Date row */}
        <div style={{ padding: '3px 6px', background: T.white, borderBottom: `0.5px solid ${isOpen ? T.pinkDeep : cellBorder}`, fontSize: 11, fontWeight: 600, color: isOpen ? T.pinkDeep : dateColor, textAlign: 'center', borderRadius: 0 }}>
          {d}
        </div>
        {/* AM half */}
        <div
          onClick={e => { e.stopPropagation(); isOpen && dayFlyout?.tab === 'am' ? setDayFlyout(null) : openDayFlyout(key, dt, 'am') }}
          style={{ flex: 1, background: isOpen && dayFlyout?.tab === 'am' ? T.pink : cellBg, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '3px 4px', cursor: 'pointer', borderBottom: `0.5px solid ${isOpen ? T.pinkDeep : cellBorder}`, gap: 2, overflow: 'hidden', transition: 'background 0.15s' }}
        >
          <div style={{ fontSize: 9, fontWeight: 600, color: isOpen && dayFlyout?.tab === 'am' ? T.pinkDeep : dateColor, opacity: 0.8, letterSpacing: '0.04em' }}>AM</div>
          {amBadges}
        </div>
        {/* PM half */}
        <div
          onClick={e => { e.stopPropagation(); isOpen && dayFlyout?.tab === 'pm' ? setDayFlyout(null) : openDayFlyout(key, dt, 'pm') }}
          style={{ flex: 1, background: isOpen && dayFlyout?.tab === 'pm' ? T.pink : cellBg, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '3px 4px', cursor: 'pointer', gap: 2, overflow: 'hidden', borderRadius: 0, transition: 'background 0.15s' }}
        >
          <div style={{ fontSize: 9, fontWeight: 600, color: isOpen && dayFlyout?.tab === 'pm' ? T.pinkDeep : dateColor, opacity: 0.8, letterSpacing: '0.04em' }}>PM</div>
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
      <div key={`next${i}`} style={{ position: 'relative', borderRadius: 0, border: `0.5px solid ${T.border}`, display: 'flex', flexDirection: 'column', minHeight: '88px' }}>
        <div style={{ fontSize: 10, color: T.textLight, padding: '3px 5px', fontWeight: 400, opacity: 0.5 }}>{i}</div>
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

  function closeAllPanels() {
    setPanel(null); setEditingPeriod(null); setEditingDaily(null); setEditingShower(null)
    setEditingProduct(null); setSelector(null); setShowExport(false); setShowTreatments(false); setShowFeedback(false)
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
  if (loading) return <GlowUpLoader message="Loading your routine..." />

  // Show onboarding for new users who have no routine and no active program
  if (onboardingDone === false) return (
    <Onboarding
      session={session}
      onEnrolled={() => {
        setOnboardingDone(true)
        // Reload so activeProgram state is fresh
        setLoading(true)
      }}
      onSkipToBuilder={() => {
        setOnboardingDone(true)
        setPanel('setup')
      }}
    />
  )

  return (
    <div onClick={() => { if (dayFlyout) setDayFlyout(null) }} style={{ fontFamily: 'inherit', padding: '1rem 0.75rem', maxWidth: 900, position: 'relative', margin: '0 auto' }}>
      <style>{`@keyframes slideDown { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } } @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } } @keyframes panelIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } } @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } } .glowup-cal-logo { display: flex } @media (max-width: 639px) { .glowup-cal-logo { display: none } }`}</style>

      {/* Glow Up logo — desktop only */}
      <div className="glowup-cal-logo" style={{ alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 12 }}>
        <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.04em', color: T.text, lineHeight: 1 }}>glow up</span>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.pinkDeep, display: 'inline-block', flexShrink: 0 }} />
      </div>

      {/* Toast — always in flow at top, small so it doesn't displace much */}
      {toast && (
        <div style={{ marginBottom: 8, padding: '7px 14px', background: T.creamDark, borderRadius: 0, fontSize: 12, color: T.textMuted, border: `0.5px solid ${T.border}` }}>
          Copied — paste into any Notion page
        </div>
      )}

      {/* Month/year with flanking nav arrows — fixed-width center keeps arrows static */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
        <button onClick={prevMonth} style={{ border: `0.5px solid ${T.border}`, background: 'transparent', borderRadius: 0, padding: '5px 20px', cursor: 'pointer', fontSize: 15, color: T.text, flexShrink: 0 }}>←</button>
        <div style={{ width: 260, textAlign: 'center' }}>
          <div style={{ fontSize: 'clamp(28px, 6vw, 42px)', fontWeight: 700, color: T.text, lineHeight: 1.1, letterSpacing: '-0.02em' }}>{MONTHS[month]}</div>
          <div style={{ fontSize: 'clamp(13px, 2.5vw, 18px)', color: T.textMuted, fontWeight: 400, marginTop: 2 }}>{year}</div>
        </div>
        <button onClick={nextMonth} style={{ border: `0.5px solid ${T.border}`, background: 'transparent', borderRadius: 0, padding: '5px 20px', cursor: 'pointer', fontSize: 15, color: T.text, flexShrink: 0 }}>→</button>
      </div>

      {/* Header — always visible, never moves */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, gap: 8 }}>
        {/* Left — primary actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <Btn variant={['update','setup'].includes(panel) ? 'active' : 'primary'} style={{ fontSize: 11, padding: '5px 10px' }} onClick={() => { setPanel(p => ['update','setup'].includes(p) ? null : (hasRoutine ? 'update' : 'setup')); setEditingPeriod(null); setDayFlyout(null) }}>+ Start new routine</Btn>
          <Btn variant={showTreatments ? 'active' : 'default'} style={{ fontSize: 11, padding: '5px 10px' }} onClick={() => { setShowTreatments(s => !s); setDayFlyout(null) }}>My treatments</Btn>
          {(month !== now.getMonth() || year !== now.getFullYear()) && (
            <button onClick={() => { setMonth(now.getMonth()); setYear(now.getFullYear()) }} style={{ border: `0.5px solid ${T.border}`, background: 'transparent', borderRadius: 0, padding: '5px 10px', cursor: 'pointer', fontSize: 11, color: T.textMuted, fontFamily: 'inherit' }}>Today</button>
          )}
        </div>
        {/* Right — hamburger */}
        <button
          onClick={() => setShowMenu(s => !s)}
          style={{ border: `0.5px solid ${showMenu ? T.pinkDeep : T.border}`, background: showMenu ? T.pink : 'transparent', borderRadius: 0, padding: '5px 10px', cursor: 'pointer', color: T.text, fontSize: 16, lineHeight: 1, display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'center', justifyContent: 'center', width: 36, height: 32 }}
          aria-label="Menu"
        >
          <span style={{ display: 'block', width: 14, height: 1.5, background: T.text, borderRadius: 0 }} />
          <span style={{ display: 'block', width: 14, height: 1.5, background: T.text, borderRadius: 0 }} />
          <span style={{ display: 'block', width: 14, height: 1.5, background: T.text, borderRadius: 0 }} />
        </button>
      </div>

      {/* Day flyout — unified centered modal, works on mobile and desktop */}
      {dayFlyout && (() => {
        const activePeriodFlyout = getActivePeriod(dayFlyout.date, routineHistory)
        const fmt = new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'long', day: 'numeric' })
        return (
          <>
            {/* Backdrop */}
            <div onClick={() => setDayFlyout(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 500 }} />
            {/* Modal */}
            <div
              data-day-flyout="true"
              onClick={e => e.stopPropagation()}
              style={{
                position: 'fixed',
                top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 'min(460px, 95vw)',
                maxHeight: '85vh',
                display: 'flex', flexDirection: 'column',
                zIndex: 501,
                borderRadius: 0,
                background: T.white,
                border: `0.5px solid ${T.pinkDeep}`,
                boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
                animation: 'fadeIn 0.15s ease',
                overflow: 'hidden',
              }}
            >
              {/* Sticky header: prev/next day arrows + date + close */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px 10px', borderBottom: `0.5px solid ${T.border}`, flexShrink: 0, background: T.white }}>
                <button onClick={goToPrevDay} style={{ border: `0.5px solid ${T.border}`, background: 'transparent', borderRadius: 0, padding: '5px 12px', cursor: 'pointer', fontSize: 14, color: T.text, flexShrink: 0 }}>←</button>
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{fmt.format(dayFlyout.date)}</div>
                </div>
                <button onClick={goToNextDay} style={{ border: `0.5px solid ${T.border}`, background: 'transparent', borderRadius: 0, padding: '5px 12px', cursor: 'pointer', fontSize: 14, color: T.text, flexShrink: 0 }}>→</button>
                <button onClick={() => setDayFlyout(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 18, color: T.textLight, padding: '0 2px', lineHeight: 1, flexShrink: 0 }}>×</button>
              </div>
              {/* Scrollable content */}
              <div style={{ overflowY: 'auto', WebkitOverflowScrolling: 'touch', flex: 1 }}>
                <DayFlyout
                  flyout={dayFlyout}
                  period={activePeriodFlyout}
                  dailyHistory={dailyHistory}
                  showerHistory={showerHistory}
                  products={products}
                  allTypes={allTypes}
                  onClose={() => setDayFlyout(null)}
                  onTabChange={(t) => setDayFlyout(f => ({ ...f, tab: t }))}
                  onAddTreatment={() => { setSelector({ key: dayFlyout.key, date: dayFlyout.date }); setDayFlyout(null) }}
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
          menuProfile={menuProfile}
          onClose={() => setShowMenu(false)}
          onHistory={() => { setPanel(p => p === 'history' ? null : 'history'); setEditingPeriod(null); setDayFlyout(null) }}
          onLibrary={() => { window.location.href = '/routine/products' }}
          onExport={() => { setShowExport(s => !s); setDayFlyout(null) }}
          onSignOut={handleSignOut}
          onFeedback={() => { setShowFeedback(true); setShowMenu(false) }}
        />
      )}

      {/* Badge toggle row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, marginTop: -4, justifyContent: 'flex-end' }}>
        <span style={{ fontSize: 11, color: T.textMuted }}>Calendar badges:</span>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
          <div
            onClick={() => setShowAllBadges(s => !s)}
            style={{
              width: 36, height: 20, borderRadius: 0, cursor: 'pointer',
              background: showAllBadges ? T.pinkDeep : T.border,
              position: 'relative', transition: 'background 0.2s', flexShrink: 0,
            }}
          >
            <div style={{
              position: 'absolute', top: 2, left: showAllBadges ? 18 : 2,
              width: 16, height: 16, borderRadius: '50%', background: T.white,
              transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
            }} />
          </div>
          <span style={{ fontSize: 11, color: T.textMuted }}>{showAllBadges ? 'All badges' : 'Actives only'}</span>
        </label>
      </div>

      {/* Hint — above day headers */}
      <p style={{ fontSize: 11, color: T.textLight, marginBottom: 6 }}>
        Tap AM or PM on any date to open the day's routine. Use "Products" to manage your product library. Tap any step to assign a product.
      </p>

      {/* Day headers — always visible */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 3, marginBottom: 3 }}>
        {DAYS.map(d => <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: T.textLight, padding: '3px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{d}</div>)}
      </div>

      {/* Grid — always visible, never moves */}
      <div onClick={() => { if (dayFlyout) setDayFlyout(null) }} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 'clamp(2px, 0.5vw, 4px)', gridAutoRows: '88px' }}>{cells}</div>

      {/* Overlay — floats over the calendar */}
      {hasOverlay && (
        <>
          {/* Clickable backdrop */}
          <div
            onClick={closeAllPanels}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(250,247,242,0.7)',
              backdropFilter: 'blur(2px)',
              zIndex: 40,
            }}
          />
          {/* Panel container — fixed to escape overflow:hidden, pointer-events none so backdrop clicks through */}
          <div
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              zIndex: 50,
              pointerEvents: 'none',
              animation: 'panelIn 0.2s ease',
            }}>
            {/* Inner wrapper — scrollable, restores pointer events, stops propagation */}
            <div
              onClick={e => e.stopPropagation()}
              style={{
                pointerEvents: 'auto',
                height: '100%',
                overflowY: 'auto',
                WebkitOverflowScrolling: 'touch',
                maxWidth: 900, margin: '0 auto', padding: '12px 12px 60px',
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
              <RoutinePeriodForm initial={{}} onSave={saveNewPeriod} onCancel={() => setPanel(null)} isFirst={true} allPeriods={routineHistory} products={products} onSaveProduct={saveProduct} />
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
                now={now}
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
              />
            )}

            {/* Shower editor */}
            {editingShower && (
              <ShowerEditor
                initial={editingShower === 'new' ? null : editingShower}
                onSave={saveShower}
                onCancel={() => { setEditingShower(null); setDayFlyout(null); if (showerFromHistory) { setPanel('history'); setShowerFromHistory(false) } }}
                allPeriods={showerHistory}
                onEditConflict={(p) => setEditingShower(p)}
                products={products}
                onSaveProduct={saveProduct}
              />
            )}

            {/* Daily editor */}
            {editingDaily && (
              <DailyEditor
                initial={editingDaily === 'new' ? null : editingDaily}
                onSave={saveDaily}
                onCancel={() => { setEditingDaily(null); setDayFlyout(null); if (dailyFromHistory) { setPanel('history'); setDailyFromHistory(false) } }}
                allPeriods={dailyHistory}
                onEditConflict={(p) => setEditingDaily(p)}
                products={products}
                onSaveProduct={saveProduct}
              />
            )}

            {/* History panel */}
            {panel === 'history' && !editingPeriod && (
              <RoutineHistoryPanel
                history={routineHistory}
                onClose={() => setPanel(null)}
                onEdit={(period) => { startEdit(period); setPanel(null); setEditFromHistory(true) }}
                onDelete={deletePeriod}
                onAddNew={() => { setPanel(routineHistory.length > 0 ? 'update' : 'setup'); setEditingPeriod(null) }}
                dailyHistory={dailyHistory}
                onEditDaily={(p) => { openDailyEditor(p); setPanel(null); setDailyFromHistory(true) }}
                onDeleteDaily={deleteDaily}
                showerHistory={showerHistory}
                onEditShower={(p) => { openShowerEditor(p); setPanel(null); setShowerFromHistory(true) }}
                onDeleteShower={deleteShower}
              />
            )}

            {/* Product form */}
            {editingProduct && (
              <ProductForm
                initial={editingProduct === 'new' ? undefined : editingProduct}
                onSave={saveProduct}
                onCancel={() => setEditingProduct(null)}
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
                onClose={() => setShowTreatments(false)}
                onEdit={(key) => {
                  const [y,m,d] = key.split('-').map(Number)
                  setSelector({ key, date: new Date(y,m-1,d) })
                  setShowTreatments(false)
                }}
                onRemove={async (key) => {
                  if (window.confirm('Remove this treatment? This cannot be undone.')) {
                    const t = treatments[key]
                    if (t?._dbId) await supabase.from('treatments').delete().eq('id', t._dbId)
                    setTreatments(t => { const n={...t}; delete n[key]; return n })
                  }
                }}
                onAddNew={(dateStr) => {
                  const [y,m,d] = dateStr.split('-').map(Number)
                  setSelector({ key: dateStr, date: new Date(y,m-1,d) })
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
            </div>{/* end inner stopPropagation wrapper */}
          </div>{/* end panel container */}
        </>
      )}



    </div>
  )
}
