import T from '../theme'

// Standard separator — between rows, steps, list items. Per STYLES —
// LABELS + DIVIDERS spec.
export function Hairline({ style }) {
  return <div style={{ height: 0, borderTop: `0.5px solid ${T.creamLight}`, ...style }} />
}

// Between major content sections — same hairline, with padding above + below.
export function SectionDivider({ style }) {
  return <div style={{ height: 0, borderTop: `0.5px solid ${T.creamLight}`, margin: '16px 0', ...style }} />
}

// Hairline + centered text — e.g. "or" between two auth options.
export function DividerWithLabel({ children, style }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '12px 0', ...style }}>
      <div style={{ flex: 1, height: 0, borderTop: `0.5px solid ${T.creamLight}` }} />
      <span style={{ fontSize: 12, color: T.textLight, whiteSpace: 'nowrap' }}>{children}</span>
      <div style={{ flex: 1, height: 0, borderTop: `0.5px solid ${T.creamLight}` }} />
    </div>
  )
}
