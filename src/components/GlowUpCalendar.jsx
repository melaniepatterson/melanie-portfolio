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
  retinoid:    { label: 'Retinoids / tretinoin', routineFlag: 'tret',       scope: 'face' },
  aha:         { label: 'AHAs',                  routineFlag: 'azelaic',    scope: 'face' },
  bha:         { label: 'BHAs / salicylic acid', routineFlag: 'bha',        scope: 'both' },
  vitamin_c:   { label: 'Vitamin C',             routineFlag: 'vitamin_c',  scope: 'face' },
  bp:          { label: 'Benzoyl peroxide',       routineFlag: 'bp',         scope: 'body' },
  physical:    { label: 'Physical exfoliation',  routineFlag: 'physical',   scope: 'body' },
  niacinamide: { label: 'Niacinamide',           routineFlag: 'niacinamide',scope: 'face' },
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
    avoidPreNote:  'Pause tretinoin 7 days before (increases skin sensitivity at treatment sites).',
    avoidPostNote: 'Wait 7 days before restarting tretinoin on treated areas.',
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
  pha:     { main: 'PHAs combined with retinoids may increase irritation, especially while building tolerance. Consider using on off nights.' },
  azelaic: {}, // azelaic acid is generally compatible with retinoids
  peptides:{}, // peptides are broadly compatible
  niacinamide: {}, // niacinamide is compatible with most actives
}

const DEFAULT_PERIOD = {
  startDate:         '',
  activeName:        'tretinoin',
  tretEnabled:       false,
  tretFrequency:     '2x-232',
  tretStartDate:     '',
  secondaryActives:  AVAILABLE_SECONDARY_ACTIVES.map(a => ({ key: a.key, enabled: false, nights: a.defaultNights })),
  massageEnabled:    false,
  massageDays:       [1, 3, 5],
  massageVideoUrl:   '',
}

// ─── HELPERS ─────────────────────────────────────────────────
function dateKey(dt) {
  return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`
}

function formatDate(dt) {
  return `${MONTHS[dt.getMonth()].slice(0,3)} ${dt.getDate()}, ${dt.getFullYear()}`
}

// Returns the date string for the day before a given date string
function fmtDate(dateStr) {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-')
  return `${m}/${d}/${y}`
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

function lsGet(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback }
  catch { return fallback }
}

function lsSet(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch {}
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
    if (diff >= 1 && diff <= cfg.post)       return { status: cfg.pca ? 'pca' : 'recovery', isTreatment: false }
    if (tv.qure && diff === -(cfg.pre + 1))  return { status: 'qure',     isTreatment: false }
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

function isHairTreatmentDay(dt, info, period) {
  if (!period?.hairTreatmentEnabled) return false
  if (info.isTreatment || ['pause','pca','recovery'].includes(info.status)) return false
  return period.hairTreatmentDays.includes(dt.getDay())
}

// ─── UI PRIMITIVES ───────────────────────────────────────────
function Badge({ colorKey, label }) {
  const c = T[colorKey] || T.custom
  return (
    <span style={{ fontSize: 9, fontWeight: 600, padding: '2px 5px', borderRadius: 3, background: c.bg, color: c.text, border: `0.5px solid ${c.border}`, display: 'inline-block', lineHeight: 1.5, whiteSpace: 'nowrap', overflow: 'hidden', maxWidth: '100%', textOverflow: 'ellipsis', letterSpacing: '0.02em' }}>
      {label}
    </span>
  )
}

function LegendItem({ colorKey, label }) {
  const c = T[colorKey] || T.custom
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: T.textMuted }}>
      <div style={{ width: 10, height: 10, borderRadius: 2, background: c.bg, border: `0.5px solid ${c.border}`, flexShrink: 0 }} />
      {label}
    </div>
  )
}

function Btn({ onClick, children, variant = 'default', style: sx = {}, disabled = false }) {
  const base = { padding: '6px 14px', borderRadius: 8, fontSize: 12, cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.5 : 1 }
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
  return <input type="text" value={value} onChange={onChange} placeholder={placeholder} style={{ width, fontSize: 12, padding: '5px 8px', border: `0.5px solid ${T.border}`, borderRadius: 6, background: T.cream, color: T.text }} />
}

function NumberInput({ value, onChange, min = 0, max = 14, width = 60 }) {
  return <input type="number" value={value} onChange={onChange} min={min} max={max} style={{ width, fontSize: 12, padding: '5px 8px', border: `0.5px solid ${T.border}`, borderRadius: 6, background: T.cream, color: T.text }} />
}

function DateInput({ value, onChange, disabled = false }) {
  return <input type="date" value={value} onChange={onChange} disabled={disabled} style={{ fontSize: 12, padding: '5px 8px', border: `0.5px solid ${T.border}`, borderRadius: 6, background: disabled ? T.creamDark : T.cream, color: disabled ? T.textMuted : T.text, cursor: disabled ? 'not-allowed' : 'auto' }} />
}

function Toggle({ checked, onChange, label }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, cursor: 'pointer', background: T.creamDark, border: `0.5px solid ${T.border}`, fontSize: 12, color: T.text, marginBottom: 6 }}>
      <input type="checkbox" checked={checked} onChange={onChange} style={{ width: 14, height: 14, cursor: 'pointer', accentColor: T.pinkDeep }} />
      {label}
    </label>
  )
}

function DayPicker({ selected, onChange, label }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <FieldLabel>{label}</FieldLabel>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {DAYS.map((d, i) => (
          <button key={i} onClick={() => onChange(selected.includes(i) ? selected.filter(x => x !== i) : [...selected, i])} style={{ padding: '3px 8px', borderRadius: 6, fontSize: 11, cursor: 'pointer', border: `0.5px solid ${selected.includes(i) ? T.pinkDeep : T.border}`, background: selected.includes(i) ? T.pink : T.white, color: T.text, fontWeight: selected.includes(i) ? 600 : 400 }}>
            {d}
          </button>
        ))}
      </div>
    </div>
  )
}


// ─── CONFLICT MESSAGE ────────────────────────────────────────
function ConflictMessage({ conflict, onEditConflict }) {
  const endLabel = conflict.endDate ? ` → ${conflict.endDate}` : ' (active, no end date)'
  const itemCount = conflict.items ? ` · ${conflict.items.length} item${conflict.items.length !== 1 ? 's' : ''}` : ''
  return (
    <div style={{
      background: '#FCEBEB', border: '0.5px solid #E24B4A',
      borderRadius: 8, padding: '10px 14px', marginBottom: 10,
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
          fontSize: 11, padding: '4px 12px', borderRadius: 6,
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
        detail: `This treatment needs ${cfg.post}d recovery. Tretinoin starts in ${daysToTret}d — you won't be healed in time.`
      })
    }

    // Treatment is AFTER tret start — does it fall inside tret's required pre-pause?
    if (daysToTret < 0 && daysToTret >= -cfg.pre) {
      conflicts.push({
        kind: 'tret',
        message: `Too close to ${period.activeName || 'Tretinoin'} start (${period.tretStartDate})`,
        detail: `This treatment needs ${cfg.pre}d Tretinoin pause before it. Tretinoin started ${Math.abs(daysToTret)}d ago — not enough time.`
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
    <div style={{ background: blocked ? '#FCEBEB' : '#FFFBEB', border: `0.5px solid ${blocked ? '#E24B4A' : '#FCD34D'}`, borderRadius: 8, padding: '12px 14px', marginBottom: 12 }}>

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
            <div style={{ fontSize: 11, fontWeight: 600, color: '#166534', marginTop: 10, padding: '6px 10px', background: '#DCFCE7', borderRadius: 6, border: '0.5px solid #4ADE80' }}>
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
              {ingredientConflicts.pre.map(cat => (
                <div key={cat} style={{ fontSize: 11, color: '#92400E', padding: '2px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#F59E0B', flexShrink: 0 }} />
                  {ACTIVE_CATEGORIES[cat]?.label || cat}
                  {ingredientConflicts.preNote ? '' : ''}
                </div>
              ))}
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
              {ingredientConflicts.post.map(cat => (
                <div key={cat} style={{ fontSize: 11, color: '#92400E', padding: '2px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#F59E0B', flexShrink: 0 }} />
                  {ACTIVE_CATEGORIES[cat]?.label || cat}
                </div>
              ))}
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
    if (cat === 'tretinoin')              flags.add('tret')
    if (cat === 'bha')                    { flags.add('bha') }
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
    <div style={{ background: T.white, border: `0.5px solid ${T.border}`, borderRadius: 12, padding: '16px 18px', marginBottom: 14 }}>
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
      <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 12, lineHeight: 1.6, background: T.creamDark, borderRadius: 8, padding: '10px 12px' }}>
        Your morning and evening steps — from cleanse to SPF, actives, and treatments. Most actives go at night because they can increase sun sensitivity, and skin does most of its repair work while you sleep. Toggle on what you use and we'll build your calendar.
      </div>

      {/* Retinoid toggle */}
      <div style={{ marginBottom: 4, padding: '10px 12px', borderRadius: 8, border: `0.5px solid ${form.tretEnabled ? T.pinkDeep : T.border}`, background: form.tretEnabled ? T.pink : T.white }}>
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
          <input type="checkbox" checked={form.tretEnabled} onChange={e => set('tretEnabled', e.target.checked)} style={{ width: 14, height: 14, marginTop: 2, cursor: 'pointer', accentColor: T.pinkDeep }} />
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>Retinoid (vitamin A)</div>
            <div style={{ fontSize: 11, color: T.textMuted }}>Tretinoin, adapalene, retinol, retinaldehyde, etc. — prescription or over the counter</div>
          </div>
        </label>
      </div>
      {form.tretEnabled && (
        <div style={{ marginLeft: 12, marginBottom: 8, paddingLeft: 12, borderLeft: `2px solid ${T.pinkDeep}` }}>
          <div style={{ marginBottom: 8, marginTop: 8 }}>
            <FieldLabel>Which one?</FieldLabel>
            <select
              value={MAIN_ACTIVE_OPTIONS.find(o => o.value === form.activeName) ? form.activeName : 'other'}
              onChange={e => set('activeName', e.target.value)}
              style={{ fontSize: 12, padding: '5px 8px', border: `0.5px solid ${T.border}`, borderRadius: 6, background: T.cream, color: T.text }}
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
              <button key={f.key} onClick={() => set('tretFrequency', f.key)} style={{ border: `0.5px solid ${form.tretFrequency === f.key ? T.pinkDeep : T.border}`, borderRadius: 8, padding: '8px 10px', cursor: 'pointer', background: form.tretFrequency === f.key ? T.pink : T.white, textAlign: 'left' }}>
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
          <strong style={{ color: T.text }}>Active nights</strong> = nights you use your retinoid. <strong style={{ color: T.text }}>Off nights</strong> = the other evenings.
        </div>
      )}
      {AVAILABLE_SECONDARY_ACTIVES.map(def => {
        const sa = (form.secondaryActives || []).find(a => a.key === def.key) || { key: def.key, enabled: false, nights: def.defaultNights }
        const enabled = sa.enabled
        const showNightsOptions = form.tretEnabled
        const incompatWarning = enabled && showNightsOptions ? SECONDARY_INCOMPATIBILITIES[def.key]?.[sa.nights] : null
        return (
          <div key={def.key} style={{ marginBottom: 4, padding: '10px 12px', borderRadius: 8, border: `0.5px solid ${enabled ? T.pinkDeep : T.border}`, background: enabled ? T.pink : T.white }}>
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
                          }} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, cursor: 'pointer', border: `0.5px solid ${sa.nights === n.key ? T.pinkDeep : T.border}`, background: sa.nights === n.key ? T.white : 'transparent', fontWeight: sa.nights === n.key ? 600 : 400, color: isIncompat ? '#92400E' : (sa.nights === n.key ? T.text : T.textLight), whiteSpace: 'nowrap' }}>
                            {n.label}{isIncompat ? ' ⚠' : ''}
                          </button>
                        )
                      })}
                    </div>
                    {incompatWarning && (
                      <div style={{ fontSize: 10, color: '#92400E', background: '#FFFBEB', border: '0.5px solid #FCD34D', borderRadius: 5, padding: '5px 8px', marginTop: 5, lineHeight: 1.5 }}>
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
                      }} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, cursor: 'pointer', border: `0.5px solid ${sa.nights === n.key ? T.pinkDeep : T.border}`, background: sa.nights === n.key ? T.white : 'transparent', fontWeight: sa.nights === n.key ? 600 : 400, color: sa.nights === n.key ? T.text : T.textLight, whiteSpace: 'nowrap' }}>
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
              { section: 'Morning', steps: AM_STEPS },
              { section: `Active nights (${form.activeName || 'treatment'})`, steps: [
                { key: 'pm_cleanse1', label: 'Cleanse 1' }, { key: 'pm_cleanse2', label: 'Cleanse 2' },
                { key: 'pm_essence', label: 'Essence' },
                { key: 'pm_tret', label: form.activeName ? form.activeName.charAt(0).toUpperCase() + form.activeName.slice(1) : 'Evening treatment' },
                ...(form.secondaryActives||[]).filter(sa => sa.enabled && (sa.nights==='main'||sa.nights==='all')).map(sa => {
                  const d = AVAILABLE_SECONDARY_ACTIVES.find(a=>a.key===sa.key); return d ? { key: d.stepKey, label: d.label } : null
                }).filter(Boolean),
                { key: 'pm_moisturizer', label: 'Moisturizer' }, { key: 'pm_eye', label: 'Eye cream' },
              ]},
              { section: 'Off nights', steps: [
                { key: 'pm_cleanse1', label: 'Cleanse 1' }, { key: 'pm_cleanse2', label: 'Cleanse 2' },
                ...(form.secondaryActives||[]).filter(sa => sa.enabled && (sa.nights==='off'||sa.nights==='all')).map(sa => {
                  const d = AVAILABLE_SECONDARY_ACTIVES.find(a=>a.key===sa.key); return d ? { key: d.stepKey, label: d.label } : null
                }).filter(Boolean),
                { key: 'pm_moisturizer', label: 'Moisturizer' }, { key: 'pm_eye', label: 'Eye cream' },
              ]},
              { section: 'Recovery days', steps: [
                { key: 'pm_cleanse1', label: 'Gentle cleanse' },
                { key: 'pm_recovery', label: 'Recovery / barrier product' },
                { key: 'pm_moisturizer', label: 'Moisturizer' },
              ]},
            ].map(({ section, steps }) => (
              <div key={section}>
                <div style={{ fontSize: 10, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '10px 0 6px' }}>{section}</div>
                {[...new Map(steps.map(s => [s.key, s])).values()].map(step => {
              const pid = form.products?.[step.key]
              const prod = pid ? products[pid] : null
              const isOpen = openStep === step.key
              return (
                <div key={step.key} style={{ marginBottom: 6 }}>
                  <div onClick={() => setOpenStep(isOpen ? null : step.key)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 6, border: `0.5px solid ${isOpen ? T.pinkDeep : T.border}`, cursor: 'pointer', background: isOpen ? T.pink : T.white }}>
                    <div style={{ fontSize: 11, fontWeight: 500, color: T.text, flex: 1 }}>{step.label}</div>
                    {prod ? (
                      <span style={{ fontSize: 11, color: T.textMuted }}>{prod.name}</span>
                    ) : (
                      <span style={{ fontSize: 11, color: T.textLight, fontStyle: 'italic' }}>unassigned</span>
                    )}
                    <span style={{ fontSize: 10, color: T.textLight }}>{isOpen ? '▲' : '▼'}</span>
                  </div>
                  {isOpen && (
                    addingProd ? (
                      <ProductForm
                        onSave={(p) => { onSaveProduct?.(p); setProductAssignment(step.key, p.id); setAddingProd(false) }}
                        onCancel={() => setAddingProd(false)}
                      />
                    ) : (
                      <ProductPicker
                        stepKey={step.key}
                        currentProductId={pid}
                        products={products}
                        onSelect={(id) => { setProductAssignment(step.key, id); setOpenStep(null) }}
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
function RoutineHistoryPanel({ history, onClose, onEdit, onDelete, onAddNew, dailyHistory, onEditDaily, onDeleteDaily, showerHistory, onEditShower, onDeleteShower }) {
  const sorted = [...history].sort((a, b) => b.startDate.localeCompare(a.startDate))
  return (
    <div style={{ background: T.white, border: `0.5px solid ${T.border}`, borderRadius: 12, padding: '16px 18px', marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>Routine history</div>
        <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 18, color: T.textMuted, padding: '0 2px', lineHeight: 1 }}>×</button>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Skincare Routine</div>
        <Btn variant="primary" onClick={() => onAddNew()} style={{ padding: '3px 10px', fontSize: 11 }}>+ Start new routine</Btn>
      </div>

      {sorted.length === 0 && (
        <div style={{ fontSize: 12, color: T.textMuted }}>No routine periods saved yet.</div>
      )}

      {sorted.map((p, i) => {
        const freq = TRET_FREQUENCIES.find(f => f.key === p.tretFrequency)?.label || p.tretFrequency
        return (
          <div key={p.startDate} style={{ borderTop: i > 0 ? `0.5px solid ${T.border}` : 'none', paddingTop: i > 0 ? 12 : 0, marginTop: i > 0 ? 12 : 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>
                From {fmtDate(p.startDate)}{i === 0 ? ' — current' : ''}
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <Btn onClick={() => onEdit(p)} style={{ padding: '3px 10px', fontSize: 11 }}>Edit</Btn>
                <button onClick={() => onDelete(p.startDate)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: T.textLight, fontSize: 16, padding: '0 4px', lineHeight: 1 }}>×</button>
              </div>
            </div>
            <div style={{ fontSize: 11, color: T.textMuted, lineHeight: 1.8 }}>
              <span>{p.activeName ? (p.activeName.charAt(0).toUpperCase() + p.activeName.slice(1)) : 'Tretinoin'}: {p.tretEnabled ? `${freq}, from ${fmtDate(p.tretStartDate)}` : 'off'}</span> &nbsp;·&nbsp;
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
          </div>
        )
      })}

      {/* Daily routine history */}
      <div style={{ borderTop: `0.5px solid ${T.border}`, marginTop: 16, paddingTop: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Extras</div>
          <Btn onClick={() => onEditDaily('new')} variant="primary" style={{ padding: '3px 10px', fontSize: 11 }}>+ Start new routine</Btn>
        </div>
        {(!dailyHistory || dailyHistory.length === 0) && (
          <div style={{ fontSize: 12, color: T.textLight, fontStyle: 'italic' }}>No extras set yet.</div>
        )}
        {[...(dailyHistory || [])].sort((a, b) => b.startDate.localeCompare(a.startDate)).map((p, i) => (
          <div key={p.id} style={{ borderTop: i > 0 ? `0.5px solid ${T.border}` : 'none', paddingTop: i > 0 ? 12 : 0, marginTop: i > 0 ? 12 : 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>
                From {fmtDate(p.startDate)}{i === 0 ? ' — current' : ''}
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <Btn onClick={() => onEditDaily(p)} style={{ padding: '3px 10px', fontSize: 11 }}>Edit</Btn>
                <button onClick={() => onDeleteDaily(p.id)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: T.textLight, fontSize: 16, padding: '0 4px', lineHeight: 1 }}>×</button>
              </div>
            </div>
            <div style={{ fontSize: 11, color: T.textMuted, lineHeight: 1.8 }}>
              {p.items.map(it => it.label).join(' · ') || 'No items'}
            </div>
          </div>
        ))}
      </div>

      {/* Shower routine history */}
      <div style={{ borderTop: `0.5px solid ${T.border}`, marginTop: 16, paddingTop: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Shower Routine</div>
          <Btn onClick={() => onEditShower('new')} variant="primary" style={{ padding: '3px 10px', fontSize: 11 }}>+ Start new routine</Btn>
        </div>
        {(!showerHistory || showerHistory.length === 0) && (
          <div style={{ fontSize: 12, color: T.textLight, fontStyle: 'italic' }}>No shower routine set yet.</div>
        )}
        {[...(showerHistory || [])].sort((a, b) => b.startDate.localeCompare(a.startDate)).map((p, i) => (
          <div key={p.id} style={{ borderTop: i > 0 ? `0.5px solid ${T.border}` : 'none', paddingTop: i > 0 ? 12 : 0, marginTop: i > 0 ? 12 : 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>
                From {fmtDate(p.startDate)}{i === 0 ? ' — current' : ''}
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <Btn onClick={() => onEditShower(p)} style={{ padding: '3px 10px', fontSize: 11 }}>Edit</Btn>
                <button onClick={() => onDeleteShower(p.id)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: T.textLight, fontSize: 16, padding: '0 4px', lineHeight: 1 }}>×</button>
              </div>
            </div>
            <div style={{ fontSize: 11, color: T.textMuted, lineHeight: 1.8 }}>
              {(p.items || []).map(it => `${it.label} (${SHOWER_FREQUENCIES.find(f=>f.key===it.frequency)?.label||it.frequency})`).join(' · ') || 'No items'}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── TREATMENT SELECTOR PANEL ────────────────────────────────
function TreatmentSelectorPanel({ selector, treatments, allTypes, customTypes, setCustomTypes, onApply, onRemove, onClose, routineHistory, showerHistory, products }) {
  const existing = treatments[selector.key]
  const [selType,     setSelType]     = useState(existing?.type       || null)
  const [qureOn,      setQureOn]      = useState(existing?.qure       || false)
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
    <div style={{ background: T.white, border: `0.5px solid ${T.border}`, borderRadius: 12, padding: '16px 18px', marginBottom: 14 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 12 }}>
        {MONTHS[selector.date.getMonth()]} {selector.date.getDate()}, {selector.date.getFullYear()} — {existing ? 'Edit treatment' : 'Add treatment'}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 6, marginBottom: 12 }}>
        {Object.entries(allTypes).map(([k, v]) => (
          <button key={k} onClick={() => { setSelType(k); setTreatArea(v.area || 'face'); setCustomPre(v.pre ?? 0); setCustomPost(v.post ?? 0) }} style={{ border: `0.5px solid ${selType === k ? T.pinkDeep : T.border}`, borderRadius: 8, padding: '8px 10px', cursor: 'pointer', background: selType === k ? T.pink : T.white, textAlign: 'left' }}>
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
          <button onClick={() => setTimeOfDay('am')} style={{ padding: '5px 16px', borderRadius: 8, border: `0.5px solid ${timeOfDay === 'am' ? T.pinkDeep : T.border}`, background: timeOfDay === 'am' ? T.pink : 'transparent', fontSize: 12, fontWeight: timeOfDay === 'am' ? 500 : 400, cursor: 'pointer', color: T.text }}>Morning (AM)</button>
          <button onClick={() => setTimeOfDay('pm')} style={{ padding: '5px 16px', borderRadius: 8, border: `0.5px solid ${timeOfDay === 'pm' ? T.pinkDeep : T.border}`, background: timeOfDay === 'pm' ? T.pink : 'transparent', fontSize: 12, fontWeight: timeOfDay === 'pm' ? 500 : 400, cursor: 'pointer', color: T.text }}>Evening (PM)</button>
        </div>
      </div>
      <div style={{ marginBottom: 10 }}>
        <FieldLabel>Treatment area</FieldLabel>
        <div style={{ display: 'flex', gap: 6 }}>
          {[{key:'face',label:'Face'},{key:'body',label:'Body'},{key:'both',label:'Both'}].map(a => (
            <button key={a.key} onClick={() => setTreatArea(a.key)} style={{ padding: '5px 14px', borderRadius: 8, border: `0.5px solid ${treatArea === a.key ? T.pinkDeep : T.border}`, background: treatArea === a.key ? T.pink : 'transparent', fontSize: 12, fontWeight: treatArea === a.key ? 500 : 400, cursor: 'pointer', color: T.text }}>{a.label}</button>
          ))}
        </div>
        <div style={{ fontSize: 10, color: T.textLight, marginTop: 4 }}>
          Body products (BP wash, body salicylic) only conflict with body treatments.
        </div>
      </div>
      {selType && (
        <div style={{ marginBottom: 10, padding: '10px 12px', background: T.creamDark, borderRadius: 8, border: `0.5px solid ${T.border}` }}>
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
      <Toggle checked={qureOn} onChange={e => setQureOn(e.target.checked)} label="Mark Microneedling night — the night before this pause begins" />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', borderTop: `0.5px solid ${T.border}`, paddingTop: 10, marginTop: 4 }}>
        <Btn variant="primary" onClick={() => { if (selType && conflicts.length === 0) onApply(selType, qureOn, timeOfDay, treatArea, customPre, customPost) }} disabled={!selType || conflicts.length > 0}>Save</Btn>
        {conflicts.length > 0 && safeDate && <div style={{ fontSize: 11, color: '#166534', padding: '4px 0' }}>Move to {safeDate} to save.</div>}
        <Btn onClick={onClose}>Cancel</Btn>
        {existing && <Btn variant="danger" onClick={onRemove}>Remove treatment</Btn>}
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
    items: ['Brow serum / minoxidil', 'Lash serum', 'Scalp serum', 'Hair growth oil (castor oil, rosemary)'],
  },
  {
    group: 'Eye & lip',
    items: ['Under-eye patches', 'Eye mask', 'Lip mask / overnight treatment', 'Lip balm (SPF)'],
  },
  {
    group: 'Skin tools',
    items: ['Face massage', 'Gua sha', 'Face roller (jade, quartz)', 'LED device', 'Microcurrent device', 'Dermaroller / microneedling'],
  },
  {
    group: 'Body',
    items: ['Body oil', 'Body AHA/BHA treatment (leave-on)', 'Stretch mark treatment', 'Nail treatment'],
  },
  {
    group: 'Wellness',
    items: ['Supplements (collagen, biotin, zinc)', 'Ingestibles'],
  },
]

// ─── EXTRAS ─────────────────────────────────────────────────
// Generates a unique id for new daily items
function uid() { return Math.random().toString(36).slice(2, 9) }

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
function DraggableItem({ item, index, total, onRemove, isDragging, onDragStart, onDragEnter, onDragEnd, onLongPress, onFreqChange, onWeekStartChange, onTimeChange, freqOptions }) {
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
        padding: '7px 8px', marginBottom: 3, borderRadius: 6,
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
        {item.note && <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 2 }}>{item.note}</div>}
        {item.productName && <div style={{ fontSize: 10, color: T.textLight, marginBottom: 3 }}>↗ {item.productName}</div>}
        {/* Frequency picker — only shown when onFreqChange provided */}
        {onFreqChange && (
          <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginBottom: 2 }}>
            {(freqOptions || SHOWER_FREQUENCIES).map(f => (
              <button key={f.key} onClick={e => { e.stopPropagation(); onFreqChange(index, f.key) }}
                style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, cursor: 'pointer', border: `0.5px solid ${(item.frequency||'daily') === f.key ? T.pinkDeep : T.border}`, background: (item.frequency||'daily') === f.key ? T.pink : 'transparent', color: (item.frequency||'daily') === f.key ? T.text : T.textLight, whiteSpace: 'nowrap' }}>
                {f.label}
              </button>
            ))}
          </div>
        )}
        {/* Cycle start day — only for non-daily/alternate frequencies */}
        {onWeekStartChange && item.frequency && item.frequency !== 'daily' && item.frequency !== 'alternate' && (
          <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'center', marginBottom: 2 }}>
            <span style={{ fontSize: 9, color: T.textLight }}>cycle starts:</span>
            {DAYS.map((d, i) => (
              <button key={i} onClick={e => { e.stopPropagation(); onWeekStartChange(index, i) }}
                style={{ fontSize: 9, padding: '1px 4px', borderRadius: 3, cursor: 'pointer', border: `0.5px solid ${(item.weekStartDay ?? 1) === i ? T.orange : T.border}`, background: (item.weekStartDay ?? 1) === i ? T.orangeLight : 'transparent', color: (item.weekStartDay ?? 1) === i ? '#9A3412' : T.textLight }}>
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
                style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, cursor: 'pointer', border: `0.5px solid ${(item.timeOfDay||'both') === t.key ? T.pinkDeep : T.border}`, background: (item.timeOfDay||'both') === t.key ? T.pink : 'transparent', color: (item.timeOfDay||'both') === t.key ? T.text : T.textLight }}>
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
  const [newProductName, setNewProductName] = useState('')
  const [newFreq,        setNewFreq]        = useState('daily')
  const [newTimeOfDay,   setNewTimeOfDay]   = useState('both')
  const [presetSearch,   setPresetSearch]   = useState('')
  const [showPresets,    setShowPresets]    = useState(false)
  const [dragFrom,  setDragFrom]  = useState(null)
  const [dragOver,  setDragOver]  = useState(null)

  // Detect overlap against all other daily periods (exclude self by id)
  const conflict = startDate
    ? detectOverlap(
        { startDate, endDate: endDate || null, excludeId: initial?.id },
        allPeriods
      )
    : null

  function addItem() {
    if (!newLabel.trim()) return
    setItems(it => [...it, { id: uid(), label: newLabel.trim(), note: newNote.trim(), productName: newProductName.trim(), frequency: newFreq, weekStartDay: 1, timeOfDay: newTimeOfDay }])
    setNewLabel(''); setNewNote(''); setNewProductName('')
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

  function handleSave() {
    if (!startDate || conflict) return
    onSave({ startDate, endDate: endDate || null, items, id: initial?.id || uid() })
  }

  return (
    <div style={{ background: T.white, border: `0.5px solid ${T.border}`, borderRadius: 12, padding: '14px 16px', marginBottom: 10 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 4 }}>
        {initial?.id ? `Extras — editing from ${fmtDate(initial?.startDate)}` : 'Extras'}
      </div>
      <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 10, lineHeight: 1.6, background: T.creamDark, borderRadius: 8, padding: '8px 12px' }}>
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
              freqOptions={EXTRAS_FREQUENCIES}
            />
            {/* Inline product picker per daily item */}
            <div style={{ marginLeft: 24, marginBottom: 4 }}>
              {item.productId && products[item.productId] ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: T.textMuted }}>
                  {products[item.productId].imageUrl && <img src={products[item.productId].imageUrl} alt="" style={{ width: 14, height: 14, borderRadius: 3, objectFit: 'cover' }} onError={e => e.target.style.display='none'} />}
                  <span>{products[item.productId].name}</span>
                  <StarRating value={products[item.productId].effectiveness || 0} size={9} />
                  <button onClick={() => setItems(it => it.map((x,idx) => idx===i ? {...x,productId:null} : x))} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: T.textLight, fontSize: 11 }}>×</button>
                </div>
              ) : (
                <button
                  onClick={() => setItems(it => it.map((x,idx) => idx===i ? {...x,_pickingProduct:!x._pickingProduct} : x))}
                  style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 10, color: T.pinkDeep, padding: 0 }}
                >+ Link product from library</button>
              )}
              {item._pickingProduct && (
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
            <div style={{ border: `0.5px solid ${T.border}`, borderRadius: 8, overflow: 'hidden', marginBottom: 8 }}>
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
        <div><FieldLabel>Product</FieldLabel><TextInput value={newProductName} onChange={e => setNewProductName(e.target.value)} placeholder="optional" width={100} /></div>
        <div>
          <FieldLabel>How often</FieldLabel>
          <select value={newFreq} onChange={e => setNewFreq(e.target.value)} style={{ fontSize: 12, padding: '5px 8px', border: `0.5px solid ${T.border}`, borderRadius: 6, background: T.cream, color: T.text }}>
            {EXTRAS_FREQUENCIES.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
          </select>
        </div>
        <div>
          <FieldLabel>When</FieldLabel>
          <div style={{ display: 'flex', gap: 4 }}>
            {TIME_OF_DAY_OPTIONS.map(t => (
              <button key={t.key} onClick={() => setNewTimeOfDay(t.key)} style={{ fontSize: 10, padding: '5px 8px', borderRadius: 6, cursor: 'pointer', border: `0.5px solid ${newTimeOfDay === t.key ? T.pinkDeep : T.border}`, background: newTimeOfDay === t.key ? T.pink : 'transparent', color: newTimeOfDay === t.key ? T.text : T.textLight }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <Btn variant="secondary" onClick={addItem}>Add</Btn>
        </div>{/* end flex row */}
      </div>{/* end add item section */}

      <div style={{ borderTop: `0.5px solid ${T.border}`, paddingTop: 10, marginTop: 10, display: 'flex', gap: 8 }}>
        <Btn variant="primary" onClick={handleSave} disabled={!startDate || !!conflict}>Save</Btn>
        <Btn onClick={onCancel}>Cancel</Btn>
      </div>
    </div>
  )
}

// DailySection (Extras) — renders extras active today, filtered by frequency + AM/PM tab
// Returns null when nothing is scheduled for that day+tab — no empty section shown
function DailySection({ dt, dailyHistory, onEditDaily, tab, products }) {
  const period = getActiveDailyPeriod(dt, dailyHistory)
  const allItems = period?.items || []

  // Filter: frequency match AND timeOfDay match for current tab
  const activeItems = allItems.filter(item => {
    const freqMatch = isShowerItemActive(dt, item, period?.startDate)
    const tod = item.timeOfDay || 'both'
    const tabMatch = !tab || tod === 'both' || tod === tab
    return freqMatch && tabMatch
  })

  // Only render if there are matching items for today's tab
  if (activeItems.length === 0) return null

  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: '#92400E', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Extras</div>
        <button onClick={onEditDaily} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 11, color: T.textLight, padding: '0 2px' }} aria-label="Edit extras">Edit</button>
      </div>
      {activeItems.map(item => {
        const prod = item.productId ? products?.[item.productId] : null
        return (
          <div key={item.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 7, padding: '5px 0', borderBottom: `0.5px solid #FEF3C7` }}>
            {prod?.imageUrl ? (
              <img src={prod.imageUrl} alt="" style={{ width: 24, height: 24, borderRadius: 4, objectFit: 'cover', flexShrink: 0, marginTop: 1 }} onError={e => e.target.style.display='none'} />
            ) : (
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#EF9F27', flexShrink: 0, marginTop: 4 }} />
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#633806' }}>{item.label}</div>
              {item.note && <div style={{ fontSize: 11, color: '#854F0B' }}>{item.note}</div>}
              {prod ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                  <span style={{ fontSize: 10, color: '#92400E' }}>{prod.name}</span>
                  {prod.effectiveness > 0 && <StarRating value={prod.effectiveness} size={9} />}
                </div>
              ) : item.productName ? (
                <div style={{ fontSize: 10, color: '#A16207', marginTop: 1 }}>↗ {item.productName}</div>
              ) : null}
            </div>
          </div>
        )
      })}
      <div style={{ borderTop: `0.5px solid ${T.border}`, marginTop: 8 }} />
    </div>
  )
}


// ─── PRODUCT SYSTEM ──────────────────────────────────────────
// Maps routine step keys to human-readable categories for filtering
const STEP_CATEGORIES = {
  am_cleanser:    'cleanser',
  am_toner:       'toner',
  am_serum:       'serum',
  am_moisturizer: 'moisturizer',
  am_spf:         'spf',
  am_eye:         'eye cream',
  pm_cleanse1:    'cleansing oil / balm',
  pm_cleanse2:    'cleanser',
  pm_essence:     'essence',
  pm_tret:        'tretinoin',
  pm_bha:          'bha',
  pm_azelaic:     'azelaic acid',
  pm_moisturizer:     'moisturizer',
  pm_eye:             'eye cream',
  pm_peptides:        'serum',
  pm_niacinamide_pm:  'serum',
  pm_pha:             'bha',
  pm_recovery:        'moisturizer',
}

const PRODUCT_CATEGORIES = [
  'cleanser', 'cleansing oil / balm', 'toner', 'essence',
  'serum', 'moisturizer', 'spf', 'eye cream',
  'bha', 'azelaic acid', 'tretinoin',
  'body wash', 'body treatment', 'haircare', 'hair growth', 'boosts', 'other'
]

// Star rating display helper
function StarRating({ value, onChange, size = 12 }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1,2,3,4,5].map(n => (
        <span
          key={n}
          onClick={onChange ? () => onChange(n) : undefined}
          style={{
            fontSize: size, cursor: onChange ? 'pointer' : 'default',
            color: n <= value ? '#FB923C' : T.textLight,
          }}
        >★</span>
      ))}
    </div>
  )
}

// ProductForm — add or edit a product
function ProductForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: '', brand: '', category: 'cleanser',
    imageUrl: '', purchaseUrl: '',
    bdsCompliant: true, tags: [],
    effectiveness: 0, buyAgain: null, notes: '',
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
    <div style={{ background: T.white, border: `0.5px solid ${T.border}`, borderRadius: 12, padding: '14px 16px', marginBottom: 10 }}>
      <div style={{ fontSize: 13, fontWeight: 500, color: T.text, marginBottom: 12 }}>
        {initial?.id ? 'Edit product' : 'Add product'}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
        <div><FieldLabel>Product name</FieldLabel><TextInput value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Blueberry Cleanser" width="100%" /></div>
        <div><FieldLabel>Brand</FieldLabel><TextInput value={form.brand} onChange={e => set('brand', e.target.value)} placeholder="e.g. Glow Recipe" width="100%" /></div>
      </div>

      <div style={{ marginBottom: 8 }}>
        <FieldLabel>Category</FieldLabel>
        <select value={form.category} onChange={e => set('category', e.target.value)} style={{ fontSize: 12, padding: '5px 8px', border: `0.5px solid ${T.border}`, borderRadius: 6, background: T.cream, color: T.text, width: '100%' }}>
          {PRODUCT_CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
        <div><FieldLabel>Image URL</FieldLabel><TextInput value={form.imageUrl} onChange={e => set('imageUrl', e.target.value)} placeholder="https://..." width="100%" /></div>
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
                style={{ fontSize: 11, padding: '4px 12px', borderRadius: 6, cursor: 'pointer', border: `0.5px solid ${active ? T.pinkDeep : T.border}`, background: active ? T.pink : 'transparent', color: active ? T.text : T.textMuted, fontWeight: active ? 600 : 400 }}>
                {area}
              </button>
            )
          })}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
        <Toggle checked={!!form.currentlyUsing} onChange={e => set('currentlyUsing', e.target.checked)} label="I'm currently using this" />
        <Toggle checked={form.bdsCompliant} onChange={e => set('bdsCompliant', e.target.checked)} label="BDS compliant" />
        <Toggle checked={form.buyAgain === true} onChange={e => set('buyAgain', e.target.checked ? true : null)} label="Would buy again" />
      </div>

      <div style={{ marginBottom: 8 }}>
        <FieldLabel>Effectiveness</FieldLabel>
        <StarRating value={form.effectiveness} onChange={v => set('effectiveness', v)} size={18} />
      </div>

      <div style={{ marginBottom: 8 }}>
        <FieldLabel>Tags (fragrance free, silicone free, etc.)</FieldLabel>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
          {form.tags.map(t => (
            <span key={t} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: T.pink, color: T.text, border: `0.5px solid ${T.pinkDeep}`, cursor: 'pointer' }} onClick={() => removeTag(t)}>
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
        <FieldLabel>Notes</FieldLabel>
        <textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Any notes..." style={{ width: '100%', fontSize: 12, padding: '5px 8px', border: `0.5px solid ${T.border}`, borderRadius: 6, background: T.cream, color: T.text, resize: 'vertical', minHeight: 60, fontFamily: 'inherit' }} />
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
function ProductPicker({ stepKey, currentProductId, products, onSelect, onAddNew, onClose }) {
  const category = STEP_CATEGORIES[stepKey]
  // No category mapping → show all by default (e.g. extras items use stepKey='other')
  const [search, setSearch] = useState('')
  const [showAll, setShowAll] = useState(!category)

  const filtered = Object.values(products).filter(p => {
    const matchCat = showAll || !category || p.category === category
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.brand || '').toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  return (
    <div style={{ background: T.white, border: `0.5px solid ${T.pinkDeep}`, borderRadius: 8, padding: '12px 14px', marginTop: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 500, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Select product</div>
        <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 14, color: T.textLight }}>×</button>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
        <TextInput value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." width={140} />
        <Btn variant={showAll ? 'active' : 'default'} onClick={() => setShowAll(s => !s)} style={{ fontSize: 11, padding: '4px 8px' }}>All categories</Btn>
      </div>

      {filtered.length === 0 && (
        <div style={{ fontSize: 11, color: T.textLight, fontStyle: 'italic', marginBottom: 8 }}>
          {category ? `No products in "${category}" yet` : 'No products added yet'}
        </div>
      )}

      <div style={{ maxHeight: 180, overflowY: 'auto', marginBottom: 8 }}>
        {currentProductId && (
          <div
            onClick={() => onSelect(null)}
            style={{ padding: '6px 8px', borderRadius: 6, fontSize: 12, cursor: 'pointer', color: '#9F1239', marginBottom: 3, background: '#FFF0F0' }}
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
              padding: '6px 8px', borderRadius: 6, fontSize: 12, cursor: 'pointer', marginBottom: 2,
              background: p.id === currentProductId ? T.pink : 'transparent',
              border: `0.5px solid ${p.id === currentProductId ? T.pinkDeep : 'transparent'}`,
            }}
          >
            {/* Thumbnail */}
            {p.imageUrl ? (
              <img src={p.imageUrl} alt="" style={{ width: 32, height: 32, borderRadius: 5, objectFit: 'cover', flexShrink: 0 }} onError={e => e.target.style.display='none'} />
            ) : (
              <div style={{ width: 32, height: 32, borderRadius: 5, background: T.creamDark, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: T.textLight }}>◻</div>
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
function ProductLibrary({ products, onEdit, onAdd, onClose }) {
  const [filterCat, setFilterCat] = useState('all')
  const [filterArea, setFilterArea] = useState('all')
  const [search, setSearch] = useState('')

  const filtered = Object.values(products).filter(p => {
    const matchCat = filterCat === 'all' || p.category === filterCat
    const matchArea = filterArea === 'all' || !!(p.applicationArea?.[filterArea])
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.brand || '').toLowerCase().includes(search.toLowerCase())
    return matchCat && matchArea && matchSearch
  })

  return (
    <div style={{ background: T.white, border: `0.5px solid ${T.border}`, borderRadius: 12, padding: '16px 18px', marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>Product library</div>
        <div style={{ display: 'flex', gap: 6 }}>
          <Btn variant="primary" onClick={onAdd} style={{ fontSize: 11, padding: '4px 10px' }}>+ Add product</Btn>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 16, color: T.textMuted, padding: '0 4px', lineHeight: 1 }}>×</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextInput value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..." width={150} />
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)} style={{ fontSize: 12, padding: '5px 8px', border: `0.5px solid ${T.border}`, borderRadius: 6, background: T.cream, color: T.text }}>
          <option value="all">All categories</option>
          {PRODUCT_CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
        </select>
        <select value={filterArea} onChange={e => setFilterArea(e.target.value)} style={{ fontSize: 12, padding: '5px 8px', border: `0.5px solid ${T.border}`, borderRadius: 6, background: T.cream, color: T.text }}>
          <option value="all">All uses</option>
          <option value="face">Face</option>
          <option value="body">Body</option>
          <option value="hair">Hair</option>
        </select>
      </div>

      {filtered.length === 0 && (
        <div style={{ fontSize: 12, color: T.textLight, fontStyle: 'italic' }}>No products yet — add your first one above.</div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
        {filtered.map(p => (
          <div key={p.id} style={{ border: `0.5px solid ${T.border}`, borderRadius: 8, padding: '10px 12px', background: T.cream }}>
            {p.imageUrl && (
              <img src={p.imageUrl} alt={p.name} style={{ width: '100%', height: 80, objectFit: 'cover', borderRadius: 6, marginBottom: 8 }} onError={e => e.target.style.display='none'} />
            )}
            <div style={{ fontSize: 12, fontWeight: 500, color: T.text, marginBottom: 2 }}>{p.name}</div>
            {p.brand && <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 4 }}>{p.brand}</div>}
            <div style={{ fontSize: 11, color: T.textLight, marginBottom: 4 }}>{p.category ? p.category.charAt(0).toUpperCase() + p.category.slice(1) : ''}</div>
            {p.effectiveness > 0 && <StarRating value={p.effectiveness} size={11} />}
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 6 }}>
              {p.currentlyUsing && <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: '#DCFCE7', color: '#166534', border: '0.5px solid #4ADE80' }}>In use</span>}
              {p.bdsCompliant && <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: '#E1F5EE', color: '#085041', border: '0.5px solid #5DCAA5' }}>BDS safe</span>}
              {p.buyAgain === true && <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: T.pink, color: '#9F1239', border: `0.5px solid ${T.pinkDeep}` }}>buy again</span>}
              {Object.entries(p.applicationArea || {}).filter(([,v])=>v).map(([k]) => (
                <span key={k} style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: T.creamDark, color: T.textMuted, border: `0.5px solid ${T.border}` }}>
                  {k.charAt(0).toUpperCase() + k.slice(1)}
                </span>
              ))}
              {(p.tags || []).slice(0,2).map(t => <span key={t} style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: T.creamDark, color: T.textMuted, border: `0.5px solid ${T.border}` }}>{t}</span>)}
            </div>
            <div style={{ marginTop: 8 }}>
              <Btn onClick={() => onEdit(p)} style={{ fontSize: 11, padding: '3px 8px', width: '100%', textAlign: 'center' }}>Edit</Btn>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}



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
      'Bond builder (Olaplex, etc.)',
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
        borderRadius: 6, border: `0.5px solid ${isDragging ? T.pinkDeep : T.border}`,
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
              style={{ fontSize: 9, padding: '1px 6px', borderRadius: 3, cursor: 'pointer', border: `0.5px solid ${item.frequency === f.key ? T.pinkDeep : T.border}`, background: item.frequency === f.key ? T.pink : 'transparent', color: item.frequency === f.key ? T.text : T.textLight, fontWeight: item.frequency === f.key ? 500 : 400 }}
            >{f.label}</button>
          ))}
        </div>
        {item.frequency !== 'daily' && item.frequency !== 'alternate' && (
          <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 9, color: T.textLight }}>cycle starts:</span>
            {DAYS.map((d, i) => (
              <button key={i} onClick={e => { e.stopPropagation(); onWeekStartChange(index, i) }}
                style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, cursor: 'pointer', border: `0.5px solid ${(item.weekStartDay ?? 1) === i ? T.orange : T.border}`, background: (item.weekStartDay ?? 1) === i ? T.orangeLight : 'transparent', color: (item.weekStartDay ?? 1) === i ? '#9A3412' : T.textLight }}
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
  const [newProductName, setNewProductName]  = useState('')
  const [showerPresetSearch, setShowerPresetSearch] = useState('')
  const [showShowerPresets,  setShowShowerPresets]  = useState(false)
  const [dragFrom,  setDragFrom]  = useState(null)
  const [dragOver,  setDragOver]  = useState(null)

  const conflict = startDate
    ? detectOverlap({ startDate, endDate: endDate || null, excludeId: initial?.id }, allPeriods)
    : null

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
    <div style={{ background: T.white, border: `0.5px solid ${T.border}`, borderRadius: 12, padding: '14px 16px', marginBottom: 10 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 4 }}>
        {initial?.id ? `Shower routine — editing from ${fmtDate(initial?.startDate)}` : 'Shower routine'}
      </div>
      <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 10, lineHeight: 1.6, background: T.creamDark, borderRadius: 8, padding: '8px 12px' }}>
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
            {/* Inline product picker */}
            <div style={{ marginLeft: 24, marginBottom: 4 }}>
              {item.productId && products[item.productId] ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: T.textMuted }}>
                  {products[item.productId].imageUrl && <img src={products[item.productId].imageUrl} alt="" style={{ width: 14, height: 14, borderRadius: 3, objectFit: 'cover' }} onError={e => e.target.style.display='none'} />}
                  <span>{products[item.productId].name}</span>
                  {products[item.productId].applicationArea && Object.entries(products[item.productId].applicationArea).filter(([,v])=>v).map(([k]) => (
                    <span key={k} style={{ fontSize: 9, padding: '1px 4px', borderRadius: 3, background: T.creamDark, color: T.textMuted, border: `0.5px solid ${T.border}` }}>{k}</span>
                  ))}
                  <StarRating value={products[item.productId].effectiveness || 0} size={9} />
                  <button onClick={() => setItems(it => it.map((x,idx) => idx===i ? {...x,productId:null} : x))} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: T.textLight, fontSize: 11 }}>×</button>
                </div>
              ) : (
                <button
                  onClick={() => setItems(it => it.map((x,idx) => idx===i ? {...x,_pickingProduct:!x._pickingProduct} : x))}
                  style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 10, color: T.pinkDeep, padding: 0 }}
                >+ Link product from library</button>
              )}
              {item._pickingProduct && (
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
              {/* Area hint — shown when a product is linked */}
              {item.productId && products[item.productId] && !Object.values(products[item.productId].applicationArea || {}).some(v => v) && (
                <div style={{ fontSize: 10, color: T.textLight, fontStyle: 'italic', marginTop: 2 }}>
                  Tip: open the product to set where it's applied (face, body, hair).
                </div>
              )}
            </div>
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
            <div style={{ border: `0.5px solid ${T.border}`, borderRadius: 8, overflow: 'hidden', marginBottom: 8 }}>
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
            <select value={newFreq} onChange={e => setNewFreq(e.target.value)} style={{ fontSize: 12, padding: '5px 8px', border: `0.5px solid ${T.border}`, borderRadius: 6, background: T.cream, color: T.text }}>
              {SHOWER_FREQUENCIES.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
            </select>
          </div>
          <Btn variant="secondary" onClick={addItem}>Add</Btn>
        </div>
      </div>

      <div style={{ borderTop: `0.5px solid ${T.border}`, paddingTop: 10, marginTop: 10, display: 'flex', gap: 8 }}>
        <Btn variant="primary" onClick={() => startDate && !conflict && onSave({ startDate, endDate: endDate || null, items, id: initial?.id || uid() })} disabled={!startDate || !!conflict}>Save</Btn>
        <Btn onClick={onCancel}>Cancel</Btn>
      </div>
    </div>
  )
}

// ShowerSection — shows active shower items for this specific date in the flyout
function ShowerSection({ dt, showerHistory, onEditShower, products }) {
  const period = getActiveShowerPeriod(dt, showerHistory)
  const allItems  = period?.items || []
  const activeItems = allItems.filter(item => isShowerItemActive(dt, item, period?.startDate))

  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: '#0C447C', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Shower</div>
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
          return (
            <div key={item.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 7, padding: '5px 0', borderBottom: `0.5px solid #E0F2FE` }}>
              {prod?.imageUrl ? (
                <img src={prod.imageUrl} alt="" style={{ width: 24, height: 24, borderRadius: 4, objectFit: 'cover', flexShrink: 0, marginTop: 1 }} onError={e => e.target.style.display='none'} />
              ) : (
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#38BDF8', flexShrink: 0, marginTop: 4 }} />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: '#0C4A6E' }}>{item.label}</div>
                {item.note && <div style={{ fontSize: 11, color: '#0C447C' }}>{item.note}</div>}
                {prod ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                    <span style={{ fontSize: 10, color: '#0C4A6E' }}>{prod.name}</span>
                    {prod.effectiveness > 0 && <StarRating value={prod.effectiveness} size={9} />}
                  </div>
                ) : item.productName ? (
                  <div style={{ fontSize: 10, color: '#38BDF8', marginTop: 1 }}>↗ {item.productName}</div>
                ) : null}
                <div style={{ fontSize: 9, color: '#38BDF8', marginTop: 2 }}>{(freq?.label || item.frequency || 'Every day').replace('Every shower', 'Every day')}</div>
              </div>
            </div>
          )
        })
      )}
      <div style={{ borderTop: `0.5px solid ${T.border}`, marginTop: 8 }} />
    </div>
  )
}


// Dynamically builds PM step list based on routine period config and night type
// nightType: 'main' | 'off' | 'recovery' | 'treatment'
function getPmSteps(period, nightType) {
  const steps = []
  const activeName = period?.activeName || 'tretinoin'
  const capName = activeName.charAt(0).toUpperCase() + activeName.slice(1)
  const secondaries = period?.secondaryActives || []

  if (nightType === 'recovery') {
    // Recovery nights: gentle cleanse + recovery/barrier product + moisturizer
    steps.push({ key: 'pm_cleanse1',   label: 'Gentle cleanse' })
    steps.push({ key: 'pm_recovery',   label: 'Recovery / barrier product' })
    steps.push({ key: 'pm_moisturizer',label: 'Moisturizer'    })
    steps.push({ key: 'pm_eye',        label: 'Eye cream'      })
    return steps
  }
  if (nightType === 'pause') {
    // Pre-treatment pause: normal base PM steps, no actives
    steps.push({ key: 'pm_cleanse1',   label: 'Cleanse 1'   })
    steps.push({ key: 'pm_cleanse2',   label: 'Cleanse 2'   })
    steps.push({ key: 'pm_essence',    label: 'Essence'     })
    steps.push({ key: 'pm_moisturizer',label: 'Moisturizer' })
    steps.push({ key: 'pm_eye',        label: 'Eye cream'   })
    return steps
  }
  if (nightType === 'treatment') {
    // Treatment night itself: no steps — provider instructions only
    return []
  }

  // Base steps always present for active/off nights
  steps.push({ key: 'pm_cleanse1', label: 'Cleanse 1' })
  steps.push({ key: 'pm_cleanse2', label: 'Cleanse 2' })
  steps.push({ key: 'pm_essence',  label: 'Essence'   })

  if (!period?.tretEnabled) {
    // No retinoid — show all enabled secondaries every night, no active/off distinction
    for (const sa of secondaries) {
      if (!sa.enabled) continue
      const def = AVAILABLE_SECONDARY_ACTIVES.find(a => a.key === sa.key)
      if (def) steps.push({ key: def.stepKey, label: def.label })
    }
  } else if (nightType === 'main') {
    steps.push({ key: 'pm_tret', label: capName })
    for (const sa of secondaries) {
      if (!sa.enabled || (sa.nights !== 'main' && sa.nights !== 'all')) continue
      const def = AVAILABLE_SECONDARY_ACTIVES.find(a => a.key === sa.key)
      if (def) steps.push({ key: def.stepKey, label: def.label })
    }
  } else {
    // Legacy bhaEnabled support
    if (period?.bhaEnabled && period?.secondaryActives === undefined) {
      steps.push({ key: 'pm_bha',     label: 'BHA'          })
      steps.push({ key: 'pm_azelaic', label: 'Azelaic acid' })
    } else {
      for (const sa of secondaries) {
        if (!sa.enabled || (sa.nights !== 'off' && sa.nights !== 'all')) continue
        const def = AVAILABLE_SECONDARY_ACTIVES.find(a => a.key === sa.key)
        if (def) steps.push({ key: def.stepKey, label: def.label })
      }
    }
  }

  steps.push({ key: 'pm_moisturizer', label: 'Moisturizer' })
  steps.push({ key: 'pm_eye',         label: 'Eye cream'   })
  return steps
}

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

const PM_STEPS_TRET = [
  { key: 'pm_cleanse1',    label: 'Cleanse 1'   },
  { key: 'pm_cleanse2',    label: 'Cleanse 2'   },
  { key: 'pm_essence',     label: 'Essence'     },
  { key: 'pm_tret',        label: 'Tretinoin'   },
  { key: 'pm_moisturizer', label: 'Moisturizer' },
  { key: 'pm_eye',         label: 'Eye cream'   },
]

const PM_STEPS_BHA = [
  { key: 'pm_cleanse1',    label: 'Cleanse 1'   },
  { key: 'pm_cleanse2',    label: 'Cleanse 2'   },
  { key: 'pm_bha',         label: 'BHA'         },
  { key: 'pm_azelaic',     label: 'Azelaic acid'},
  { key: 'pm_moisturizer', label: 'Moisturizer' },
  { key: 'pm_eye',         label: 'Eye cream'   },
]

function DayFlyout({ flyout, period, dailyHistory, showerHistory, products, allTypes, onClose, onAddTreatment, onTabChange, onEditDaily, onEditShower, onUpdatePeriodProducts, onAddProduct }) {
  const [massageOpen, setMassageOpen] = useState(false)
  const tab = flyout.tab  // always read from parent — no local drift
  const [openStepKey, setOpenStepKey] = useState(null)
  const [addingProduct, setAddingProduct] = useState(false)
  function switchTab(t) { onTabChange?.(t); setOpenStepKey(null) }
  const { date, dayType, isTreatment, treatmentTimeOfDay } = flyout
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
  const pmSteps = getPmSteps(period, nightType)
  const isRecovery = dayType === 'pca' || dayType === 'recovery'

  const periodProducts = period?.products || {}

  function handleSelectProduct(stepKey, productId) {
    onUpdatePeriodProducts(period?.startDate, stepKey, productId)
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

  function renderSteps(steps, dotColor) {
    const result = []
    steps.forEach(step => {
      const productId = periodProducts[step.key]
      const product = productId ? products[productId] : null
      const isThisOpen = openStepKey === step.key
      result.push(
        <div key={step.key}>
          <div
            onClick={() => period && setOpenStepKey(isThisOpen ? null : step.key)}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: `0.5px solid ${T.border}`, cursor: period ? 'pointer' : 'default', opacity: (() => {
              if (product) return 1
              // Check if any currently-using product matches this step's category
              const stepCat = STEP_CATEGORIES[step.key]
              const hasCurrentlyUsing = stepCat && Object.values(products).some(p => p.currentlyUsing && p.category === stepCat)
              return hasCurrentlyUsing ? 1 : 0.45
            })() }}
          >
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: T.text }}>{step.label}</div>
              {product ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                  {product.imageUrl && <img src={product.imageUrl} alt="" style={{ width: 16, height: 16, borderRadius: 3, objectFit: 'cover' }} onError={e => e.target.style.display='none'} />}
                  <span style={{ fontSize: 11, color: T.textMuted }}>{product.name}</span>
                  {product.effectiveness > 0 && <StarRating value={product.effectiveness} size={9} />}
                </div>
              ) : productId ? (
                <div style={{ fontSize: 11, color: T.textLight, fontStyle: 'italic' }}>assigned product not found — tap to reassign</div>
              ) : (
                <div style={{ fontSize: 11, color: T.textLight, fontStyle: 'italic' }}>tap to assign product</div>
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
                stepKey={step.key}
                currentProductId={productId}
                products={products}
                onSelect={(pid) => handleSelectProduct(step.key, pid)}
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
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 8, background: '#E0F2FE', border: '0.5px solid #38BDF8', cursor: 'pointer', margin: '4px 0' }}
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
                <div style={{ marginTop: 4, borderRadius: 8, overflow: 'hidden', background: T.creamDark, padding: 8 }}>
                  <iframe src={videoUrl} style={{ width: '100%', height: 360, border: 'none', borderRadius: 6 }} allowFullScreen title="Face massage" loading="lazy" />
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

  return (
    <div style={{ background: T.white, border: `0.5px solid ${T.border}`, borderRadius: 12, padding: '12px 14px', marginBottom: 14 }}>
      {/* Date + actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: T.text }}>
          {MONTHS[date.getMonth()]} {date.getDate()}
        </div>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <Btn onClick={onAddTreatment} style={{ fontSize: 11, padding: '4px 10px', whiteSpace: 'nowrap' }}>{flyout.isTreatment ? 'Edit treatment' : '+ Treatment'}</Btn>
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
        return <div style={{ fontSize: 11, fontWeight: 500, padding: '4px 10px', borderRadius: 6, background: bg, color, marginBottom: 10, display: 'inline-block' }}>{label}</div>
      })()}

      {/* 1. Shower routine — always at top */}
      <ShowerSection dt={date} showerHistory={showerHistory} onEditShower={onEditShower} products={products} />

      {/* 2. Morning / Night tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 8, borderTop: `0.5px solid ${T.border}`, paddingTop: 8 }}>
        <button onClick={() => switchTab('am')} style={{ padding: '4px 14px', borderRadius: 8, border: `0.5px solid ${tab === 'am' ? T.pinkDeep : T.border}`, background: tab === 'am' ? T.pink : 'transparent', fontSize: 12, fontWeight: tab === 'am' ? 500 : 400, cursor: 'pointer', color: T.text }}>Morning</button>
        <button onClick={() => switchTab('pm')} style={{ padding: '4px 14px', borderRadius: 8, border: `0.5px solid ${tab === 'pm' ? T.pinkDeep : T.border}`, background: tab === 'pm' ? T.pink : 'transparent', fontSize: 12, fontWeight: tab === 'pm' ? 500 : 400, cursor: 'pointer', color: T.text }}>Night</button>
      </div>

      {/* 3. Extras — filtered by frequency + current tab, hidden when nothing matches */}
      <DailySection dt={date} dailyHistory={dailyHistory} onEditDaily={onEditDaily} tab={tab} products={products} />

      {/* 4. Skincare steps — tab-specific */}
      <div style={{ borderTop: `0.5px solid ${T.border}`, marginBottom: 8 }} />
      {!period ? (
        <div style={{ fontSize: 11, color: T.textMuted, fontStyle: 'italic', padding: '6px 0 10px', lineHeight: 1.6 }}>
          No skincare routine active for this date. Routine settings and product assignments begin on your routine start date.
        </div>
      ) : (
        <>
          {/* AM: normal routine unless it's an AM treatment */}
          {tab === 'am' && !isRecovery && !(isTreatment && treatTod === 'am') && renderSteps(AM_STEPS, T.pinkDeep)}
          {tab === 'am' && isRecovery && renderSteps(getPmSteps(period, 'recovery'), T.pinkDeep)}
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
          {tab === 'am' && dayType === 'pause' && (
            <div style={{ fontSize: 11, color: '#92400E', background: '#FFFBEB', border: '0.5px solid #FCD34D', borderRadius: 6, padding: '5px 10px', marginBottom: 8 }}>
              Pre-treatment pause — your morning SPF and moisturizer are fine. Skip any acids or actives.
            </div>
          )}
          {/* PM: treatment banner + recovery steps */}
          {tab === 'pm' && isTreatment && (
            <div style={{ fontSize: 11, padding: '6px 10px', borderRadius: 6, background: '#E0F2FE', color: '#0C4A6E', marginBottom: 8, lineHeight: 1.5 }}>
              {treatTod === 'pm'
                ? 'Treatment tonight — use recovery products after your appointment.'
                : 'Treatment this morning — recovery begins tonight.'}
            </div>
          )}
          {tab === 'pm' && dayType === 'pause' && (
            <div style={{ fontSize: 11, color: '#92400E', background: '#FFFBEB', border: '0.5px solid #FCD34D', borderRadius: 6, padding: '5px 10px', marginBottom: 8 }}>
              Pre-treatment pause — skip actives tonight. Regular cleanse and moisturizer only.
            </div>
          )}
          {tab === 'pm' && renderSteps(pmSteps, dayType === 'tret' ? '#A78BFA' : T.orange)}
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
    <div style={{ background: T.white, border: `0.5px solid ${T.border}`, borderRadius: 12, padding: '18px 18px', marginBottom: 14 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 4 }}>What kind of routine would you like to add?</div>
      <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 14 }}>Each type is tracked separately with its own history.</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
        {options.map(o => (
          <button key={o.key} onClick={() => setChosen(o.key)} style={{
            padding: '12px 14px', borderRadius: 10,
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
      <div style={{ background: T.white, border: `0.5px solid ${T.border}`, borderRadius: 12, marginBottom: 14, overflow: 'hidden' }}>
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
              initial={null}
              onSave={onSaveDaily}
              onCancel={onCancel}
              allPeriods={dailyHistory}
              onEditConflict={() => {}}
              products={products}
              onSaveProduct={onSaveProduct}
            />
          )}
          {chosen === 'shower' && (
            <ShowerEditor
              initial={null}
              onSave={onSaveShower}
              onCancel={onCancel}
              allPeriods={showerHistory}
              onEditConflict={() => {}}
            />
          )}
        </div>
      </div>
    </div>
  )
}


// ─── DEFAULT PRODUCTS ─────────────────────────────────────────
// Pre-populated with BDS-safe products from Melanie's current routine.
// Seeded on first load only (when the product library is empty).
const DEFAULT_PRODUCTS = {
  'prod-anua-toner': {
    id: 'prod-anua-toner', name: 'Heartleaf 77% Soothing Toner', brand: 'Anua',
    category: 'toner', bdsCompliant: true, currentlyUsing: true,
    applicationArea: { face: true, body: false, hair: false },
    effectiveness: 0, tags: ['fragrance free', 'korean'], notes: '',
    imageUrl: '', purchaseUrl: '', buyAgain: null,
  },
  'prod-cosrx-cleanser': {
    id: 'prod-cosrx-cleanser', name: 'Low pH Good Morning Gel Cleanser', brand: 'COSRX',
    category: 'cleanser', bdsCompliant: true, currentlyUsing: true,
    applicationArea: { face: true, body: false, hair: false },
    effectiveness: 0, tags: ['low ph', 'korean'], notes: 'AM cleanse (PM step 2)',
    imageUrl: '', purchaseUrl: '', buyAgain: null,
  },
  'prod-to-salicylic': {
    id: 'prod-to-salicylic', name: 'Salicylic Acid 2% Solution', brand: 'The Ordinary',
    category: 'bha', bdsCompliant: true, currentlyUsing: true,
    applicationArea: { face: true, body: true, hair: false },
    effectiveness: 0, tags: ['bha'], notes: 'Face (BHA nights) + leave-on arms for KP',
    imageUrl: '', purchaseUrl: '', buyAgain: null,
  },
  'prod-bgs-spf': {
    id: 'prod-bgs-spf', name: 'Kids SPF 50', brand: 'Black Girl Sunscreen',
    category: 'spf', bdsCompliant: true, currentlyUsing: true,
    applicationArea: { face: true, body: false, hair: false },
    effectiveness: 0, tags: ['mineral', 'spf 50'], notes: '',
    imageUrl: '', purchaseUrl: '', buyAgain: null,
  },
  'prod-to-niacinamide': {
    id: 'prod-to-niacinamide', name: 'Niacinamide 10% + Zinc 1%', brand: 'The Ordinary',
    category: 'serum', bdsCompliant: true, currentlyUsing: true,
    applicationArea: { face: true, body: true, hair: false },
    effectiveness: 0, tags: ['niacinamide', 'zinc'], notes: 'Also used on body for scarring',
    imageUrl: '', purchaseUrl: '', buyAgain: null,
  },
  'prod-to-azelaic': {
    id: 'prod-to-azelaic', name: 'Azelaic Acid Suspension 10%', brand: 'The Ordinary',
    category: 'azelaic acid', bdsCompliant: true, currentlyUsing: true,
    applicationArea: { face: true, body: false, hair: false },
    effectiveness: 0, tags: ['azelaic'], notes: 'BHA/off nights',
    imageUrl: '', purchaseUrl: '', buyAgain: null,
  },
  'prod-cosrx-snail': {
    id: 'prod-cosrx-snail', name: 'Advanced Snail 96 Mucin Power Essence', brand: 'COSRX',
    category: 'essence', bdsCompliant: true, currentlyUsing: true,
    applicationArea: { face: true, body: false, hair: false },
    effectiveness: 0, tags: ['snail mucin', 'korean'], notes: '',
    imageUrl: '', purchaseUrl: '', buyAgain: null,
  },
  'prod-purito-moisturizer': {
    id: 'prod-purito-moisturizer', name: 'Oat-in Calming Gel Cream', brand: 'Purito',
    category: 'moisturizer', bdsCompliant: true, currentlyUsing: true,
    applicationArea: { face: true, body: false, hair: false },
    effectiveness: 0, tags: ['gel', 'oat', 'korean'], notes: 'Summer moisturizer (May–Sep)',
    imageUrl: '', purchaseUrl: '', buyAgain: null,
  },
  'prod-klairs-cream': {
    id: 'prod-klairs-cream', name: 'Midnight Blue Calming Cream', brand: 'Klairs',
    category: 'moisturizer', bdsCompliant: true, currentlyUsing: true,
    applicationArea: { face: true, body: false, hair: false },
    effectiveness: 0, tags: ['calming', 'korean'], notes: 'PM moisturizer (tret + BHA nights)',
    imageUrl: '', purchaseUrl: '', buyAgain: null,
  },
  'prod-farmacy-cleanser': {
    id: 'prod-farmacy-cleanser', name: 'Green Clean Makeup Removing Cleansing Balm', brand: 'Farmacy',
    category: 'cleansing oil / balm', bdsCompliant: true, currentlyUsing: true,
    applicationArea: { face: true, body: false, hair: false },
    effectiveness: 0, tags: ['balm', 'oil cleanser'], notes: 'PM cleanse step 1',
    imageUrl: '', purchaseUrl: '', buyAgain: null,
  },
  'prod-gr-blueberry': {
    id: 'prod-gr-blueberry', name: 'Blueberry Bounce Gentle Cleanser', brand: 'Glow Recipe',
    category: 'cleanser', bdsCompliant: true, currentlyUsing: true,
    applicationArea: { face: true, body: false, hair: false },
    effectiveness: 0, tags: ['gentle', 'korean-founded'], notes: 'AM cleanser',
    imageUrl: '', purchaseUrl: '', buyAgain: null,
  },
  'prod-gr-plum': {
    id: 'prod-gr-plum', name: 'Plum Plump Hyaluronic Acid Serum', brand: 'Glow Recipe',
    category: 'serum', bdsCompliant: true, currentlyUsing: false,
    applicationArea: { face: true, body: false, hair: false },
    effectiveness: 0, tags: ['hyaluronic acid', 'seasonal'], notes: 'Fall/winter moisturizer (Oct–Apr)',
    imageUrl: '', purchaseUrl: '', buyAgain: null,
  },
  'prod-vegamour-brow': {
    id: 'prod-vegamour-brow', name: 'GRO Brow Serum', brand: 'Vegamour',
    category: 'hair growth', bdsCompliant: true, currentlyUsing: true,
    applicationArea: { face: false, body: false, hair: true },
    effectiveness: 0, tags: ['minoxidil', 'brow'], notes: 'Apply AM + PM, dry 5 min before castor oil',
    imageUrl: '', purchaseUrl: '', buyAgain: null,
  },
  'prod-jbco': {
    id: 'prod-jbco', name: 'Jamaican Black Castor Oil', brand: '',
    category: 'hair growth', bdsCompliant: true, currentlyUsing: true,
    applicationArea: { face: false, body: false, hair: true },
    effectiveness: 0, tags: ['castor oil', 'brow'], notes: 'Apply over dried minoxidil AM + PM',
    imageUrl: '', purchaseUrl: '', buyAgain: null,
  },
  'prod-olaplex-3': {
    id: 'prod-olaplex-3', name: 'No. 3 Plus Pre-Shampoo Treatment', brand: 'Olaplex',
    category: 'haircare', bdsCompliant: false, currentlyUsing: true,
    applicationArea: { face: false, body: false, hair: true },
    effectiveness: 0, tags: ['bond builder', 'pre-shampoo'], notes: 'Verify BDS status before continued use',
    imageUrl: '', purchaseUrl: '', buyAgain: null,
  },
  'prod-clinique-eye': {
    id: 'prod-clinique-eye', name: 'Eye Cream', brand: 'Clinique',
    category: 'eye cream', bdsCompliant: false, currentlyUsing: true,
    applicationArea: { face: true, body: false, hair: false },
    effectiveness: 0, tags: ['eye', 'eyelid eczema'], notes: 'Kept for eyelid eczema — medical need. Estée Lauder brand.',
    imageUrl: '', purchaseUrl: '', buyAgain: null,
  },
}


// ─── SEED PRODUCTS ───────────────────────────────────────────
// Pre-populated on first load and merged in for any existing library.
// Photos and purchase links can be added manually.
const SEED_PRODUCTS = [
  { id:'seed-1',  name:'Low pH Good Morning Gel Cleanser',         brand:'COSRX',         category:'cleanser',           bdsCompliant:true,  currentlyUsing:false, applicationArea:{face:true},             effectiveness:0, buyAgain:null, tags:['fragrance free'], notes:'', imageUrl:'', purchaseUrl:'' },
  { id:'seed-2',  name:'Blueberry Bounce Gentle Cleanser',          brand:'Glow Recipe',   category:'cleanser',           bdsCompliant:true,  currentlyUsing:false, applicationArea:{face:true},             effectiveness:0, buyAgain:null, tags:[], notes:'', imageUrl:'', purchaseUrl:'' },
  { id:'seed-3',  name:'Green Clean Makeup Meltaway Cleansing Balm',brand:'Farmacy',       category:'cleansing oil / balm',bdsCompliant:true,  currentlyUsing:false, applicationArea:{face:true},             effectiveness:0, buyAgain:null, tags:[], notes:'', imageUrl:'', purchaseUrl:'' },
  { id:'seed-4',  name:'Heartleaf 77% Soothing Toner',             brand:'Anua',          category:'toner',              bdsCompliant:true,  currentlyUsing:false, applicationArea:{face:true},             effectiveness:0, buyAgain:null, tags:['fragrance free'], notes:'', imageUrl:'', purchaseUrl:'' },
  { id:'seed-5',  name:'Advanced Snail 96 Mucin Power Essence',     brand:'COSRX',         category:'essence',            bdsCompliant:true,  currentlyUsing:false, applicationArea:{face:true},             effectiveness:0, buyAgain:null, tags:[], notes:'', imageUrl:'', purchaseUrl:'' },
  { id:'seed-6',  name:'Niacinamide 10% + Zinc 1%',                brand:'The Ordinary',  category:'serum',              bdsCompliant:true,  currentlyUsing:false, applicationArea:{face:true},             effectiveness:0, buyAgain:null, tags:['niacinamide'], notes:'', imageUrl:'', purchaseUrl:'' },
  { id:'seed-7',  name:'Salicylic Acid 2% Solution',                brand:'The Ordinary',  category:'bha',                bdsCompliant:true,  currentlyUsing:false, applicationArea:{body:true},             effectiveness:0, buyAgain:null, tags:[], notes:'Body / KP treatment — leave-on', imageUrl:'', purchaseUrl:'' },
  { id:'seed-8',  name:'Azelaic Acid Suspension 10%',               brand:'The Ordinary',  category:'azelaic acid',       bdsCompliant:true,  currentlyUsing:false, applicationArea:{face:true},             effectiveness:0, buyAgain:null, tags:[], notes:'', imageUrl:'', purchaseUrl:'' },
  { id:'seed-9',  name:'Daily Go-To Sunscreen SPF 50+',             brand:'Purito',        category:'spf',                bdsCompliant:true,  currentlyUsing:false, applicationArea:{face:true},             effectiveness:0, buyAgain:null, tags:['fragrance free'], notes:'Summer formula (Oat-in)', imageUrl:'', purchaseUrl:'' },
  { id:'seed-10', name:'Midnight Blue Calming Cream',               brand:'Klairs',        category:'moisturizer',        bdsCompliant:true,  currentlyUsing:false, applicationArea:{face:true},             effectiveness:0, buyAgain:null, tags:[], notes:'', imageUrl:'', purchaseUrl:'' },
  { id:'seed-11', name:'Plum Plump Hyaluronic Cream',               brand:'Glow Recipe',   category:'moisturizer',        bdsCompliant:true,  currentlyUsing:false, applicationArea:{face:true},             effectiveness:0, buyAgain:null, tags:[], notes:'Fall / winter formula', imageUrl:'', purchaseUrl:'' },
  { id:'seed-12', name:'Make It Matte SPF 45',                      brand:'Black Girl Sunscreen', category:'spf',         bdsCompliant:true,  currentlyUsing:false, applicationArea:{face:true},             effectiveness:0, buyAgain:null, tags:[], notes:'Kids formula', imageUrl:'', purchaseUrl:'' },
  { id:'seed-13', name:'All About Eyes',                            brand:'Clinique',      category:'eye cream',          bdsCompliant:false, currentlyUsing:true,  applicationArea:{face:true},             effectiveness:0, buyAgain:null, tags:[], notes:'', imageUrl:'', purchaseUrl:'' },
  { id:'seed-14', name:'GRO+ Advanced Hair Serum',                  brand:'Vegamour',      category:'hair growth',        bdsCompliant:true,  currentlyUsing:false, applicationArea:{hair:true},             effectiveness:0, buyAgain:null, tags:[], notes:'Contains minoxidil — verify BDS status', imageUrl:'', purchaseUrl:'' },
  { id:'seed-15', name:'Jamaican Black Castor Oil',                 brand:'',              category:'hair growth',        bdsCompliant:true,  currentlyUsing:false, applicationArea:{hair:true, body:true},  effectiveness:0, buyAgain:null, tags:[], notes:'', imageUrl:'', purchaseUrl:'' },
  { id:'seed-16', name:'No.3 Hair Perfector',                       brand:'Olaplex',       category:'haircare',           bdsCompliant:null,  currentlyUsing:false, applicationArea:{hair:true},             effectiveness:0, buyAgain:null, tags:[], notes:'BDS status pending verification', imageUrl:'', purchaseUrl:'' },
]


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
    const pid = periodProducts?.[step.key]
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

    const statusLabel = info.isTreatment ? (allTypes[info.status]?.label || info.status)
      : info.status === 'tret' ? `${period?.activeName || 'Tretinoin'} night`
      : info.status === 'pause' ? 'Pre-treatment pause'
      : (info.status === 'pca' || info.status === 'recovery') ? 'Recovery'
      : 'Off night'

    const amDesc = buildStepDescription(AM_STEPS, periodProducts, products)
    const pmSteps = period ? getPmSteps(period, nightType) : []
    const pmDesc = pmSteps.length ? buildStepDescription(pmSteps, periodProducts, products) : 'Follow provider aftercare instructions'
    const uid = () => `${key}-${Math.random().toString(36).slice(2)}@glowup`

    if (format === 'allday') {
      const desc = `MORNING\n${amDesc}\n\nEVENING (${statusLabel})\n${pmDesc}`
      lines.push('BEGIN:VEVENT',`UID:${uid()}`,`DTSTART;VALUE=DATE:${icsDate(dt)}`,`DTEND;VALUE=DATE:${icsDate(new Date(dt.getTime()+86400000))}`,`SUMMARY:Skincare — ${statusLabel}`,`DESCRIPTION:${icsEscape(desc)}`,'END:VEVENT')

    } else {
      // separate AM + PM
      const at = getAM(dow)
      lines.push('BEGIN:VEVENT',`UID:${uid()}`,`DTSTART:${icsDateTime(dt, at)}`,`DTEND:${icsDateTime(dt, addMins(at, 30))}`,`SUMMARY:Morning routine`,`DESCRIPTION:${icsEscape('MORNING\n'+amDesc)}`,'END:VEVENT')
      const pt = getPM(dow)
      lines.push('BEGIN:VEVENT',`UID:${uid()}`,`DTSTART:${icsDateTime(dt, pt)}`,`DTEND:${icsDateTime(dt, addMins(pt, 30))}`,`SUMMARY:Evening routine — ${statusLabel}`,`DESCRIPTION:${icsEscape('EVENING\n'+pmDesc)}`,'END:VEVENT')
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
            <button key={k} onClick={() => setMode(k)} style={{ fontSize: 9, padding: '2px 7px', borderRadius: 4, cursor: 'pointer', border: `0.5px solid ${mode===k ? T.pinkDeep : T.border}`, background: mode===k ? T.pink : 'transparent', color: mode===k ? T.text : T.textLight }}>{l}</button>
          ))}
        </div>
      </div>
      {mode === 'same' ? (
        <input type="time" value={singleTime} onChange={e => setSingleTime(e.target.value)}
          style={{ fontSize: 12, padding: '5px 8px', border: `0.5px solid ${T.border}`, borderRadius: 6, background: T.cream, color: T.text }} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
          {[0,1,2,3,4,5,6].map(d => (
            <div key={d} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 9, fontWeight: 600, color: T.textMuted, marginBottom: 2 }}>{DOW_LABELS[d]}</div>
              <input type="time" value={times[d]} onChange={e => setTimes(t => ({ ...t, [d]: e.target.value }))}
                style={{ width: '100%', fontSize: 9, padding: '2px 1px', border: `0.5px solid ${T.border}`, borderRadius: 4, background: T.cream, color: T.text }} />
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
    <div style={{ background: T.white, border: `0.5px solid ${T.border}`, borderRadius: 12, padding: '16px 18px', marginBottom: 14 }}>
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
            <button key={f.key} onClick={() => setFormat(f.key)} style={{ padding: '8px 12px', borderRadius: 8, border: `0.5px solid ${format===f.key ? T.pinkDeep : T.border}`, background: format===f.key ? T.pink : 'transparent', fontSize: 11, cursor: 'pointer', color: T.text, textAlign: 'left' }}>
              <span style={{ fontWeight: 500 }}>{f.label}</span>
              <span style={{ color: T.textMuted }}> — {f.desc}</span>
            </button>
          ))}
        </div>

        {/* Date range */}
        <FieldLabel>How far ahead</FieldLabel>
        <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
          {[30,60,90].map(d => (
            <button key={d} onClick={() => setDaysAhead(d)} style={{ padding: '5px 14px', borderRadius: 8, border: `0.5px solid ${daysAhead===d ? T.pinkDeep : T.border}`, background: daysAhead===d ? T.pink : 'transparent', fontSize: 11, cursor: 'pointer', color: T.text }}>{d} days</button>
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

// ─── MAIN COMPONENT ──────────────────────────────────────────
export default function GlowUpCalendar() {
  const now = new Date(); now.setHours(0,0,0,0)

  const [year,  setYear]  = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())

  const [routineHistory, setRoutineHistory] = useState(() => lsGet('glowup-routine-history', []))
  const [products, setProducts] = useState(() => {
    const stored = lsGet('glowup-products', null) || {}
    // Always merge seed products that aren't already in the library (by ID)
    // This ensures seeds appear even if the user had prior manual products
    const merged = { ...stored }
    SEED_PRODUCTS.forEach(p => {
      if (!merged[p.id]) merged[p.id] = p
    })
    return merged
  })
  const [dailyHistory,   setDailyHistory]   = useState(() => lsGet('glowup-daily-routine',   []))
  const [showerHistory,  setShowerHistory]  = useState(() => lsGet('glowup-shower-routine', []))
  const [treatments,     setTreatments]     = useState(() => lsGet('glowup-treatments',      {}))
  const [customTypes,    setCustomTypes]    = useState(() => lsGet('glowup-custom-types',    {}))

  // panel: 'setup' | 'update' | 'history' | null
  const [panel,         setPanel]         = useState(null)
  // editingPeriod: the period being edited in place, or null
  const [editingPeriod, setEditingPeriod] = useState(null)
  const [editingDaily,  setEditingDaily]  = useState(null) // null | 'new' | period object
  const [editingShower, setEditingShower] = useState(null) // null | 'new' | period object
  const [editingProduct, setEditingProduct] = useState(null) // null | 'new' | product object
  const [showLibrary,    setShowLibrary]    = useState(false)
  const [selector,      setSelector]      = useState(null)
  const [dayFlyout,     setDayFlyout]     = useState(null) // { key, date, tab: 'am'|'pm', dayType }
  const [toast,         setToast]         = useState(false)
  const [showExport,    setShowExport]    = useState(false)
  const [showAllBadges, setShowAllBadges] = useState(() => lsGet('glowup-show-all-badges', false))

  // Persistence
  useEffect(() => { lsSet('glowup-routine-history', routineHistory) }, [routineHistory])
  useEffect(() => { lsSet('glowup-products',       products)       }, [products])
  useEffect(() => { lsSet('glowup-daily-routine',   dailyHistory)   }, [dailyHistory])
  useEffect(() => { lsSet('glowup-shower-routine', showerHistory)  }, [showerHistory])
  useEffect(() => { lsSet('glowup-treatments',      treatments)     }, [treatments])
  useEffect(() => { lsSet('glowup-custom-types',    customTypes)    }, [customTypes])
  useEffect(() => { lsSet('glowup-show-all-badges',  showAllBadges)  }, [showAllBadges])


  const allTypes   = { ...BASE_TYPES, ...customTypes }
  const hasRoutine = routineHistory.length > 0

  // ── Routine handlers ─────────────────────────────────────

  // Add a new period — auto-sets endDate on the currently active period
  function saveNewPeriod(form) {
    setRoutineHistory(h => {
      const prevActive = getActivePeriod(new Date(form.startDate + 'T00:00:00'), h)
      const updated = h.map(p => {
        // Set endDate on the previously active period if it has no endDate or its endDate is after the new startDate
        if (prevActive && p.startDate === prevActive.startDate && p.startDate !== form.startDate) {
          return { ...p, endDate: dayBefore(form.startDate) }
        }
        return p
      })
      const filtered = updated.filter(p => p.startDate !== form.startDate)
      return [...filtered, form].sort((a, b) => a.startDate.localeCompare(b.startDate))
    })
    setPanel(null)
  }

  // Edit an existing period in place — matches by original startDate stored in editingPeriod
  function saveEditedPeriod(form) {
    setRoutineHistory(h => h.map(p =>
      p.startDate === editingPeriod.startDate ? { ...form } : p
    ))
    setEditingPeriod(null)
    setPanel(null)
  }

  function startEdit(period) {
    setEditingPeriod(period)
    setPanel(null)
    setDayFlyout(null)
  }

  function cancelEdit() {
    setEditingPeriod(null)
  }

  function deletePeriod(startDate) {
    setRoutineHistory(h => h.filter(p => p.startDate !== startDate))
  }

  function deleteDaily(id) {
    setDailyHistory(h => h.filter(p => p.id !== id))
  }

  function deleteShower(id) {
    setShowerHistory(h => h.filter(p => p.id !== id))
  }

  // ── Daily routine handlers ────────────────────────────────
  function saveDaily(form) {
    setDailyHistory(h => {
      // If new period (no matching id yet), auto-set endDate on currently active period
      const isNew = !h.find(p => p.id === form.id)
      const updated = isNew ? h.map(p => {
        const prevActive = getActiveDailyPeriod(new Date(form.startDate + 'T00:00:00'), h)
        if (prevActive && p.id === prevActive.id) {
          return { ...p, endDate: dayBefore(form.startDate) }
        }
        return p
      }) : h
      const filtered = updated.filter(p => p.id !== form.id)
      return [...filtered, form].sort((a, b) => a.startDate.localeCompare(b.startDate))
    })
    setEditingDaily(null)
  }

  function openDailyEditor(period) {
    setEditingDaily(period || 'new')
    setEditingShower(null)
    setPanel(null)
    setDayFlyout(null)
  }

  // ── Shower routine handlers ───────────────────────────────
  function saveShower(form) {
    setShowerHistory(h => {
      const isNew = !h.find(p => p.id === form.id)
      const updated = isNew ? h.map(p => {
        const prevActive = getActiveShowerPeriod(new Date(form.startDate + 'T00:00:00'), h)
        if (prevActive && p.id === prevActive.id) return { ...p, endDate: dayBefore(form.startDate) }
        return p
      }) : h
      const filtered = updated.filter(p => p.id !== form.id)
      return [...filtered, form].sort((a, b) => a.startDate.localeCompare(b.startDate))
    })
    setEditingShower(null)
  }

  function openShowerEditor(period) {
    setEditingShower(period || 'new')
    setPanel(null)
    setDayFlyout(null)
  }

  // ── Product handlers ──────────────────────────────────────
  function saveProduct(product) {
    setProducts(p => ({ ...p, [product.id]: product }))
    setEditingProduct(null)
  }

  // Assigns a product to a specific step in a specific routine period
  function updatePeriodProducts(periodStartDate, stepKey, productId) {
    if (!periodStartDate) return
    setRoutineHistory(h => h.map(p => {
      if (p.startDate !== periodStartDate) return p
      const newProducts = { ...(p.products || {}) }
      if (productId === null) {
        delete newProducts[stepKey]
      } else {
        newProducts[stepKey] = productId
      }
      return { ...p, products: newProducts }
    }))
  }

  // ── Treatment handlers ────────────────────────────────────
  function openDayFlyout(key, dt, tab) {
    const info = getDayInfo(dt, treatments, allTypes, routineHistory)
    const treatTod = info.isTreatment ? (treatments[key]?.timeOfDay || 'am') : null
    setDayFlyout({ key, date: dt, tab, dayType: info.status, isTreatment: info.isTreatment, treatmentTimeOfDay: treatTod })
    setPanel(null)
    setEditingPeriod(null)
    setEditingDaily(null)
    setSelector(null)
  }

  function openSelector(key) {
    const [y, m, d] = key.split('-').map(Number)
    setSelector({ key, date: new Date(y, m - 1, d) })
    setPanel(null)
    setEditingPeriod(null)
    setEditingDaily(null)
    setDayFlyout(null)
  }

  function applyTreatment(type, qure, timeOfDay = 'am', area = 'face', pre, post) {
    const cfg = allTypes[type] || {}
    setTreatments(t => ({ ...t, [selector.key]: { type, qure, timeOfDay, area, pre: pre ?? cfg.pre, post: post ?? cfg.post } }))
    setSelector(null)
  }

  function removeTreatment() {
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
        const qd  = new Date(td); qd.setDate(qd.getDate() - (cfg.pre + 1))
        const ql  = tv.qure ? ` | Microneedling: ${formatDate(qd)}` : ''
        lines.push(`- **${allTypes[tv.type]?.label || tv.type}: ${formatDate(td)}**${ql} | No tret from: ${formatDate(pre)} | Recovery through: ${formatDate(end)} | Resume: ${formatDate(res)}`)
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

  for (let i = 0; i < firstDow; i++) cells.push(<div key={`e${i}`} />)

  for (let d = 1; d <= daysInMonth; d++) {
    const dt      = new Date(year, month, d)
    const key     = dateKey(dt)
    const info    = getDayInfo(dt, treatments, allTypes, routineHistory)
    const period  = getActivePeriod(dt, routineHistory)
    const isToday = dt.getTime() === now.getTime()
    const massage = isMassageDay(dt, info, period)
    const hairTreatment = isHairTreatmentDay(dt, info, period)
    const s       = info.status

    let cellBg = T.white, cellBorder = T.border
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
      // const spAM = getActiveShowerPeriod(dt, showerHistory)
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
      if (s === 'qure')     return <Badge key="p" colorKey="microneedling" label="microneedling"    />
      if (s === 'tret') { const an = period?.activeName || 'tretinoin'; return <Badge key="p" colorKey="tret" label={an.charAt(0).toUpperCase() + an.slice(1)} /> }
      if (s === 'bha')      return <Badge key="p" colorKey="bha"           label="BHA"              />
      // Tier 2 — secondary actives
      if (period?.secondaryActives) {
        const lookFor = (!period?.tretEnabled || s === 'none')
          ? (sa) => sa.enabled && sa.nights !== 'main'
          : (sa) => sa.enabled && (sa.nights === 'off' || sa.nights === 'all')
        const active = (period.secondaryActives || []).find(lookFor)
        if (active) {
          const def = AVAILABLE_SECONDARY_ACTIVES.find(a => a.key === active.key)
          const raw2 = def?.label.split('/')[0].split('(')[0].trim() || active.key
          const lbl = raw2.charAt(0).toUpperCase() + raw2.slice(1)
          return <Badge key="p" colorKey="bha" label={lbl} />
        }
      }
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
      <div key={key} style={{ position: 'relative', borderRadius: 8, border: `0.5px solid ${isOpen ? T.pinkDeep : cellBorder}`, outline: isToday ? `2px solid ${T.pinkDeep}` : 'none', outlineOffset: -1, display: 'flex', flexDirection: 'column', zIndex: isOpen ? 100 : 1, minHeight: '88px' }}>
        {/* Date row */}
        <div style={{ padding: '3px 6px', background: T.white, borderBottom: `0.5px solid ${isOpen ? T.pinkDeep : cellBorder}`, fontSize: 11, fontWeight: 600, color: isOpen ? T.pinkDeep : dateColor, textAlign: 'center', borderRadius: '8px 8px 0 0' }}>
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
          style={{ flex: 1, background: isOpen && dayFlyout?.tab === 'pm' ? T.pink : cellBg, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '3px 4px', cursor: 'pointer', gap: 2, overflow: 'hidden', borderRadius: isOpen ? '0' : '0 0 8px 8px', transition: 'background 0.15s' }}
        >
          <div style={{ fontSize: 9, fontWeight: 600, color: isOpen && dayFlyout?.tab === 'pm' ? T.pinkDeep : dateColor, opacity: 0.8, letterSpacing: '0.04em' }}>PM</div>
          {pmBadges}
        </div>
        {/* Inline flyout — slides out from under the cell */}
        {isOpen && (
          <div
            data-day-flyout="true"
            onClick={e => e.stopPropagation()}
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              width: 'min(280px, 90vw)',
              zIndex: 30,
              marginTop: 2,
              borderRadius: '0 8px 8px 8px',
              border: `0.5px solid ${T.pinkDeep}`,
              background: T.white,
              boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
              animation: 'slideDown 0.2s ease',
            }}>
            <DayFlyout
              flyout={dayFlyout}
              period={activePeriod}
              dailyHistory={dailyHistory}
              showerHistory={showerHistory}
              products={products}
              allTypes={allTypes}
              onClose={() => setDayFlyout(null)}
              onTabChange={(t) => setDayFlyout(f => ({ ...f, tab: t }))}
              onAddTreatment={() => {
                setSelector({ key: dayFlyout.key, date: dayFlyout.date })
                setDayFlyout(null)
              }}
              onEditDaily={() => openDailyEditor(getActiveDailyPeriod(dayFlyout.date, dailyHistory))}
              onEditShower={() => openShowerEditor(getActiveShowerPeriod(dayFlyout.date, showerHistory))}
              onUpdatePeriodProducts={updatePeriodProducts}
              onAddProduct={saveProduct}
            />
          </div>
        )}
      </div>
    )
  }

  // ── Render ────────────────────────────────────────────────
  // Determine if any overlay panel is open
  const hasOverlay = !!(panel || editingPeriod || editingDaily || editingShower || showLibrary || editingProduct || selector || showExport)

  function closeAllPanels() {
    setPanel(null); setEditingPeriod(null); setEditingDaily(null); setEditingShower(null)
    setShowLibrary(false); setEditingProduct(null); setSelector(null); setShowExport(false)
  }

  return (
    <div onClick={() => { if (dayFlyout) setDayFlyout(null) }} style={{ fontFamily: 'inherit', padding: '1rem 0.75rem', maxWidth: 900, position: 'relative', margin: '0 auto' }}>
      <style>{`@keyframes slideDown { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } } @keyframes panelIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }`}</style>

      {/* Toast — always in flow at top, small so it doesn't displace much */}
      {toast && (
        <div style={{ marginBottom: 8, padding: '7px 14px', background: T.creamDark, borderRadius: 8, fontSize: 12, color: T.textMuted, border: `0.5px solid ${T.border}` }}>
          Copied — paste into any Notion page
        </div>
      )}

      {/* Month/year — large, centered, above nav */}
      <div style={{ textAlign: 'center', marginBottom: 10 }}>
        <div style={{ fontSize: 'clamp(28px, 6vw, 42px)', fontWeight: 700, color: T.text, lineHeight: 1.1, letterSpacing: '-0.02em' }}>{MONTHS[month]}</div>
        <div style={{ fontSize: 'clamp(13px, 2.5vw, 18px)', color: T.textMuted, fontWeight: 400, marginTop: 2 }}>{year}</div>
      </div>

      {/* Header — always visible, never moves */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={prevMonth} style={{ border: `0.5px solid ${T.border}`, background: 'transparent', borderRadius: 8, padding: '5px 12px', cursor: 'pointer', fontSize: 15, color: T.text }}>←</button>
          <button onClick={nextMonth} style={{ border: `0.5px solid ${T.border}`, background: 'transparent', borderRadius: 8, padding: '5px 12px', cursor: 'pointer', fontSize: 15, color: T.text }}>→</button>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {!hasRoutine && <Btn variant="primary" onClick={() => setPanel('setup')}>+ Start new routine</Btn>}
          {hasRoutine && <Btn variant={panel === 'update' ? 'active' : 'primary'} style={{ fontSize: 11, padding: '5px 10px' }} onClick={() => { setPanel(p => p === 'update' ? null : 'update'); setEditingPeriod(null); setDayFlyout(null) }}>+ Start new routine</Btn>}
          {hasRoutine && <Btn variant={panel === 'history' ? 'active' : 'default'} style={{ fontSize: 11, padding: '5px 10px' }} onClick={() => { setPanel(p => p === 'history' ? null : 'history'); setEditingPeriod(null); setDayFlyout(null) }}>Routine history</Btn>}
          <Btn variant={showLibrary ? 'active' : 'default'} style={{ fontSize: 11, padding: '5px 10px' }} onClick={() => { setShowLibrary(s => !s); setEditingProduct(null); setDayFlyout(null) }}>Product library</Btn>
          <Btn variant={showExport ? 'active' : 'default'} onClick={() => { setShowExport(s => !s); setDayFlyout(null) }} style={{ fontSize: 11, padding: '5px 10px' }}>↑ Export</Btn>

        </div>
      </div>

      {/* Badge toggle row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, marginTop: -4, justifyContent: 'flex-end' }}>
        <span style={{ fontSize: 11, color: T.textMuted }}>Calendar badges:</span>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
          <div
            onClick={() => setShowAllBadges(s => !s)}
            style={{
              width: 36, height: 20, borderRadius: 10, cursor: 'pointer',
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3, marginBottom: 3 }}>
        {DAYS.map(d => <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: T.textLight, padding: '3px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{d}</div>)}
      </div>

      {/* Grid — always visible, never moves */}
      <div onClick={() => { if (dayFlyout) setDayFlyout(null) }} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 'clamp(2px, 0.5vw, 4px)', gridAutoRows: '88px' }}>{cells}</div>

      {/* Overlay — floats over the calendar */}
      {hasOverlay && (
        <>
          {/* Clickable backdrop — sits behind panel container */}
          <div
            onClick={closeAllPanels}
            style={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(250,247,242,0.7)',
              backdropFilter: 'blur(2px)',
              zIndex: 40,
              borderRadius: 12,
            }}
          />
          {/* Panel container — higher z-index, clicks do NOT reach backdrop */}
          <div
            style={{
              position: 'absolute', top: 0, left: 0, right: 0,
              zIndex: 50,
              maxHeight: '90vh',
              overflowY: 'auto',
              borderRadius: 12,
              animation: 'panelIn 0.2s ease',
              padding: '12px 4px 0',
              pointerEvents: 'none',
            }}>
            {/* Inner wrapper restores pointer events and stops propagation to backdrop */}
            <div
              onClick={e => e.stopPropagation()}
              style={{ pointerEvents: 'auto' }}>

            {/* First launch */}
            {!hasRoutine && panel === 'setup' && !editingPeriod && (
              <div style={{ background: T.pink, border: `0.5px solid ${T.pinkDeep}`, borderRadius: 12, padding: '14px 18px', marginBottom: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 6 }}>Welcome! Set up your routine to get started.</div>
                <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 10 }}>Configure your tret schedule, BHA nights, massage days, and hair treatment — it all auto-populates on the calendar.</div>
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
                onCancel={() => { setEditingShower(null); setDayFlyout(null) }}
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
                onCancel={() => { setEditingDaily(null); setDayFlyout(null) }}
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
                onEdit={(period) => { startEdit(period); setPanel(null) }}
                onDelete={deletePeriod}
                onAddNew={() => { setPanel('update'); }}
                dailyHistory={dailyHistory}
                onEditDaily={(p) => { openDailyEditor(p); setPanel(null) }}
                onDeleteDaily={deleteDaily}
                showerHistory={showerHistory}
                onEditShower={(p) => { openShowerEditor(p); setPanel(null) }}
                onDeleteShower={deleteShower}
              />
            )}

            {/* Product library */}
            {showLibrary && !editingProduct && (
              <ProductLibrary
                products={products}
                onEdit={(p) => setEditingProduct(p)}
                onAdd={() => setEditingProduct('new')}
                onClose={() => setShowLibrary(false)}
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
