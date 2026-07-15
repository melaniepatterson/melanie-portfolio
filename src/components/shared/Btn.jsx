// Btn — single source of truth for GlowUp buttons.
// Variant/size/state styling lives in App.css (.gu-btn-*) — proper CSS is
// needed for :hover/:active/:focus-visible, which inline styles can't do.
// See STYLES — BUTTONS spec: primary (the one main action), secondary (a
// supporting action), ghost (low-priority, shouldn't draw the eye), danger
// (destructive, always confirm). Sizes: compact 32px / standard 44px /
// large 52px, per theme.js T.btn tokens.
//
// Existing call sites used variant="default" for a neutral bordered button
// — that's what the spec calls "secondary," so it's aliased below. "active"
// is a legacy toggle/selected-chip look (day pickers, tabs) that predates
// this spec and isn't one of its four variants — kept as-is.
export default function Btn({
  children,
  onClick,
  variant = 'secondary',
  size = 'compact',
  disabled = false,
  fullWidth = false,
  style,
  className,
  type = 'button',
  ...rest
}) {
  const resolvedVariant = variant === 'default' ? 'secondary' : variant
  const classes = ['gu-btn', `gu-btn-${resolvedVariant}`, `gu-btn-${size}`, className]
    .filter(Boolean)
    .join(' ')

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={classes}
      style={{ ...(fullWidth ? { width: '100%' } : null), ...style }}
      {...rest}
    >
      {children}
    </button>
  )
}
