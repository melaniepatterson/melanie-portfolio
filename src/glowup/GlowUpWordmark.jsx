// GlowUpLogo — single source of truth for the Glow Up wordmark.
// Naskle, all lowercase, per Section 5 of the design spec. GlowUpLoader.jsx
// intentionally has its own larger, floating treatment for the full-bleed
// loading screen — this component is for every other placement.
import T from './theme'

export default function GlowUpLogo({ size = 20, style, className }) {
  return (
    <span className={className} style={{
      fontFamily: T.fontFamilyDisplay,
      fontSize: size,
      lineHeight: 1,
      letterSpacing: '-0.01em',
      color: T.text,
      ...style,
    }}>
      glow up.
    </span>
  )
}
