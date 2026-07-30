import T from '../theme'

// xs label — section labels only. Per STYLES — LABELS + DIVIDERS spec.
export function Label({ children, style }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: T.text, ...style }}>
      {children}
    </div>
  )
}

// xs label + action — label left, toggle chevron right. Used when a
// section is expandable or has a CTA (e.g. "Ingredients ▾").
export function LabelWithAction({ children, open, onToggle }) {
  return (
    <button onClick={onToggle} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'inherit' }}>
      <Label>{children}</Label>
      <span style={{ fontSize: 10, color: T.textMuted, transition: 'transform 0.15s', display: 'inline-block', transform: open ? 'rotate(180deg)' : 'none' }}>▾</span>
    </button>
  )
}

// xs label + count — label with secondary metadata inline (e.g. "My products (12)").
export function LabelWithCount({ children, count }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
      <Label>{children}</Label>
      <span style={{ fontSize: 11, fontWeight: 400, color: T.textMuted, textTransform: 'none', letterSpacing: 'normal' }}>({count})</span>
    </div>
  )
}
