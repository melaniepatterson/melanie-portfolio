// Each program gets its own dark brand color, matched by slug (falls back
// to a name match in case a slug ever changes). Shared between the program
// library cards (GlowUpCalendar.jsx) and the active-program banner
// (ProgramAdvancement.jsx) so the two always agree.
import T from './theme'

const PROGRAM_COLOR_BY_SLUG = {
  'aha-bha-onboarding':          T.darkBlue,
  'benzoyl-peroxide-onboarding': T.darkPink,
  'hyperpigmentation-protocol':  T.darkYellow,
  'skin-barrier-repair':         T.darkOrange,
  'tretinoin-onboarding':        T.darkGreen,
}
const PROGRAM_COLOR_BY_NAME_KEYWORD = [
  [/aha|bha/i,             T.darkBlue],
  [/benzoyl|peroxide/i,    T.darkPink],
  [/hyperpigmentation/i,   T.darkYellow],
  [/barrier/i,             T.darkOrange],
  [/tretinoin/i,           T.darkGreen],
]

export function programCardColor(program) {
  if (PROGRAM_COLOR_BY_SLUG[program.slug]) return PROGRAM_COLOR_BY_SLUG[program.slug]
  const match = PROGRAM_COLOR_BY_NAME_KEYWORD.find(([re]) => re.test(program.name || ''))
  return match ? match[1] : T.text
}

// The medium (base) brand color paired with each dark program color —
// used for the description section of program cards, with the dark
// color as its text so the two halves read as one family.
const MID_BY_DARK = {
  [T.darkBlue]:   T.blue,
  [T.darkPink]:   T.pink,
  [T.darkYellow]: T.yellow,
  [T.darkOrange]: T.orange,
  [T.darkGreen]:  T.green,
}

export function programMidColor(program) {
  return MID_BY_DARK[programCardColor(program)] || T.surfaceMuted
}
