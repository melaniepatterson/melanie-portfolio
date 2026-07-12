// ─── GlowUp Design Tokens ────────────────────────────────────
// Single source of truth for all colors, typography, and spacing.
// Import this file in every component: import T from './theme'

const T = {
  // ── Brand colors ─────────────────────────────────────────────
  pink:    '#ED6FBB',   // pink — recovery badges, celebratory accents
  blue:    '#98AAF8',   // periwinkle — actives badges, focus rings
  green:   '#7BE3A5',   // mint — tretinoin badges
  yellow:  '#F5C222',   // yellow — pause badges
  orange:  '#E95800',   // orange — treatment badges, warning buttons
  olive:   '#92881F',   // olive — logo color only

  // ── Neutrals ─────────────────────────────────────────────────
  white:      '#FFFFFF',       // inputs, text areas, max contrast surfaces
  creamLight: '#FDF8F0',       // modals, cards, panels
  cream:      '#FBF0DB',       // page background
  creamDark:  '#EDE2C2',       // secondary surfaces, tags, dividers
  border:     '#D4C9A8',       // all borders

  // ── Text ─────────────────────────────────────────────────────
  text:      '#0F2F2B',                    // primary text — 100%
  textMuted: 'rgba(15, 47, 43, 0.70)',     // secondary text — 70%
  textLight: 'rgba(15, 47, 43, 0.50)',     // tertiary, placeholders — 50%

  // ── Button states ────────────────────────────────────────────
  btnHover:    '#2D5E57',   // primary hover (lighter than default)
  btnActive:   '#071A18',   // primary active/pressed (darker than default)
  warnHover:   '#B84400',   // warning hover border + text
  warnHoverBg: '#FEE9D5',   // warning hover background

  // ── Calendar badge colors ─────────────────────────────────────
  // Tretinoin — green
  tret:     { bg: '#E5F9ED', border: '#7BE3A5', text: '#1A6B3C' },
  // AHA/BHA and other actives — blue
  bha:      { bg: '#EDF0FE', border: '#98AAF8', text: '#1D2D8A' },
  // Pause — yellow
  pause:    { bg: '#FEF5CC', border: '#F5C222', text: '#6B4800' },
  // Treatments (facial, peel, microderm, etc.) — orange
  treatment:    { bg: '#FEE9D5', border: '#E95800', text: '#6B2500' },
  microneedling:{ bg: '#FEE9D5', border: '#E95800', text: '#6B2500' },
  massage:      { bg: '#FEE9D5', border: '#E95800', text: '#6B2500' },
  hairTreatment:{ bg: '#FEE9D5', border: '#E95800', text: '#6B2500' },
  peel:         { bg: '#FEE9D5', border: '#E95800', text: '#6B2500' },
  electrolysis: { bg: '#FEE9D5', border: '#E95800', text: '#6B2500' },
  facial:       { bg: '#FEE9D5', border: '#E95800', text: '#6B2500' },
  microderm:    { bg: '#FEE9D5', border: '#E95800', text: '#6B2500' },
  custom:       { bg: '#FEE9D5', border: '#E95800', text: '#6B2500' },
  // Recovery — pink
  recovery: { bg: '#FCE9F5', border: '#ED6FBB', text: '#7B1852' },

  // ── Typography ───────────────────────────────────────────────
  fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",

  fontSize: {
    xs:      '11px',   // 0.6875rem — uppercase section labels only (600 weight)
    sm:      '12px',   // 0.75rem   — placeholders, helper text, hints
    base:    '13px',   // 0.8125rem — secondary info, metadata, dates
    md:      '14px',   // 0.875rem  — body copy, descriptions, banner text (min body)
    lg:      '16px',   // 1rem      — step labels, flyout body, product names
    xl:      '18px',   // 1.125rem  — sub-headings, phase names, card titles
    xxl:     '22px',   // 1.375rem  — section headings within panels
    display: '28px',   // 1.75rem   — calendar month, panel headings, page titles
    hero:    '36px',   // 2.25rem   — onboarding welcome, empty state headlines
  },

  fontWeight: {
    normal:   400,
    medium:   500,
    semibold: 600,
  },

  // ── Border radius ────────────────────────────────────────────
  radius: {
    pill:   '9999px',  // buttons, badges, tags, chips
    card:   '8px',     // cards, program banner, settings sections
    modal:  '12px',    // modals, flyouts, drawers
    input:  '0px',     // inputs — underline style only
  },

  // ── Button sizes ─────────────────────────────────────────────
  btn: {
    compact:  { height: '32px',  paddingH: '14px', paddingV: '6px',  fontSize: '12px' },
    standard: { height: '44px',  paddingH: '20px', paddingV: '10px', fontSize: '14px' },
    full:     { height: '52px',  paddingH: '24px', paddingV: '14px', fontSize: '16px' },
  },

  // ── Button transitions ────────────────────────────────────────
  transition: {
    hover:    '150ms ease',
    active:   '80ms ease',
    disabled: '400ms ease',
  },

  // ── Spacing ──────────────────────────────────────────────────
  space: {
    1:  '4px',
    2:  '8px',
    3:  '12px',
    4:  '16px',
    5:  '20px',
    6:  '24px',
    8:  '32px',
    10: '40px',
    12: '48px',
  },

  // ── Shadows ──────────────────────────────────────────────────
  shadow: {
    sm: '0 1px 4px rgba(0,0,0,0.08)',
    md: '0 4px 16px rgba(0,0,0,0.08)',
    lg: '0 8px 32px rgba(0,0,0,0.12)',
  },
}

export default T
