// GlowUpLogo — single source of truth for the wordmark
// Usage: <GlowUpLogo /> or <GlowUpLogo size={22} className="glowup-cal-logo" />

export default function GlowUpLogo({ size = 20, style = {}, className }) {
  return (
    <span
      className={className}
      style={{
        fontSize: size,
        fontWeight: 800,
        letterSpacing: '-0.04em',
        color: '#1A1A1A',
        lineHeight: 1,
        ...style,
      }}
    >
      Glow{' '}
      <span style={{ color: '#C93500' }}>Up</span>
      <span style={{ color: '#FFD6F9' }}>.</span>
    </span>
  )
}
