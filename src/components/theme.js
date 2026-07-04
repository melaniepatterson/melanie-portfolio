// ─── GlowUp Design Tokens ────────────────────────────────────
// Single source of truth for all colors, typography, and spacing.
// Import this file in every component: import T from './theme'

const T = {
  // ── Brand colors ─────────────────────────────────────────────
  pink:         '#FFD6F9',   // brand pink — logo dot, accents
  pinkDeep:     '#C93500',   // brand red — CTAs, active states, links
  pinkMid:      '#F9A8D4',   // light pink — hover states, soft highlights

  // ── Neutrals ─────────────────────────────────────────────────
  white:        '#FFFFFF',
  cream:        '#FAF7F2',   // page background
  creamDark:    '#F0EBE3',   // card backgrounds, secondary surfaces
  creamMid:     '#F3EDE4',   // input backgrounds, subtle dividers

  // ── Text ─────────────────────────────────────────────────────
  text:         '#1C1917',   // primary text (stone-900)
  textMuted:    '#78716C',   // secondary text (stone-500)
  textLight:    '#A8A29E',   // tertiary text, placeholders (stone-400)

  // ── Borders ──────────────────────────────────────────────────
  border:       '#E7E0D8',   // standard border
  borderLight:  '#EDE8E2',   // subtle dividers

  // ── Accent colors ────────────────────────────────────────────
  orange:       '#F97316',   // PM routine indicator (orange-500)
  orangeLight:  '#FED7AA',   // orange tint backgrounds

  // ── Calendar badge colors ─────────────────────────────────────
  // Each has bg / border / text for badge chips
  tret:         { bg: '#EDE9FE', border: '#A78BFA', text: '#5B21B6' },
  bha:          { bg: '#DCFCE7', border: '#4ADE80', text: '#166534' },
  pause:        { bg: '#FEF3C7', border: '#FCD34D', text: '#92400E' },
  recovery:     { bg: '#FFE4E6', border: '#FB7185', text: '#9F1239' },
  microneedling:{ bg: '#FED7AA', border: '#FB923C', text: '#9A3412' },
  massage:      { bg: '#E0F2FE', border: '#38BDF8', text: '#0C4A6E' },
  hairTreatment:{ bg: '#DCFCE7', border: '#4ADE80', text: '#166534' },
  peel:         { bg: '#FFE4E6', border: '#FB7185', text: '#9F1239' },
  electrolysis: { bg: '#EDE9FE', border: '#A78BFA', text: '#5B21B6' },
  facial:       { bg: '#DCFCE7', border: '#4ADE80', text: '#166534' },
  microderm:    { bg: '#E0F2FE', border: '#38BDF8', text: '#0C4A6E' },
  custom:       { bg: '#FFE4E6', border: '#FB7185', text: '#9F1239' },

  // ── Typography ───────────────────────────────────────────────
  fontFamily:   "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",

  fontSize: {
    xs:   '9px',    // labels, badges, uppercase tags
    sm:   '11px',   // secondary info, metadata
    base: '12px',   // body text, form fields
    md:   '13px',   // standard UI text
    lg:   '14px',   // subheadings, step labels
    xl:   '16px',   // section headings
    xxl:  '18px',   // page headings
    hero: '22px',   // logo, major headings
  },

  fontWeight: {
    normal:    400,
    medium:    500,
    semibold:  600,
    bold:      700,
    extrabold: 800,
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

  // ── Border radius ────────────────────────────────────────────
  // GlowUp uses 0 (square) everywhere — this is the design language
  radius: 0,

  // ── Shadows ──────────────────────────────────────────────────
  shadow: {
    sm:  '0 1px 4px rgba(0,0,0,0.08)',
    md:  '0 4px 16px rgba(0,0,0,0.08)',
    lg:  '0 8px 32px rgba(0,0,0,0.12)',
  },
}

export default T
