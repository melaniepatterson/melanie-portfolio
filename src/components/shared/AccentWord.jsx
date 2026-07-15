import T from '../theme'

// One word set in the Fraunces italic accent, per Section 9's DM Sans +
// Fraunces mixing system — never two accent words in a row.
export default function AccentWord({ children }) {
  return <span style={{ fontFamily: T.fontFamilyAccent, fontStyle: T.fontStyleAccent }}>{children}</span>
}
