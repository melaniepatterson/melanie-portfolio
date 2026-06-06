// Branded load screen for GlowUp
// Usage: <GlowUpLoader /> or <GlowUpLoader message="Loading your routine..." />

export default function GlowUpLoader({ message = '' }) {
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: '#FAF7F2',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: 'inherit', zIndex: 9999,
    }}>
      {/* Wordmark */}
      <div style={{
        fontSize: 28, fontWeight: 700, color: '#1C1917',
        letterSpacing: '-0.03em', marginBottom: 28,
      }}>
        Glow<span style={{ color: '#C93500' }}>Up</span>
      </div>

      {/* Animated stars */}
      <div style={{ position: 'relative', width: 64, height: 64, marginBottom: 24 }}>
        <svg viewBox="0 0 64 64" width="64" height="64" xmlns="http://www.w3.org/2000/svg">
          <style>{`
            @keyframes spin-slow  { from { transform-origin: 32px 32px; transform: rotate(0deg)   } to { transform-origin: 32px 32px; transform: rotate(360deg)  } }
            @keyframes spin-rev   { from { transform-origin: 32px 32px; transform: rotate(0deg)   } to { transform-origin: 32px 32px; transform: rotate(-360deg) } }
            @keyframes pulse-glow { 0%,100% { opacity: 0.35 } 50% { opacity: 1 } }
            .star-outer { animation: spin-slow 3s linear infinite; }
            .star-inner { animation: spin-rev 2s linear infinite; }
            .dot        { animation: pulse-glow 1.4s ease-in-out infinite; }
          `}</style>

          {/* Outer 8-point star */}
          <g className="star-outer">
            <path d="M32 4 L34 28 L58 32 L34 36 L32 60 L30 36 L6 32 L30 28 Z"
              fill="none" stroke="#FFD6F9" strokeWidth="1.5" strokeLinejoin="round" />
          </g>

          {/* Inner 4-point star */}
          <g className="star-inner">
            <path d="M32 18 L33.5 30.5 L46 32 L33.5 33.5 L32 46 L30.5 33.5 L18 32 L30.5 30.5 Z"
              fill="#C93500" opacity="0.85" />
          </g>

          {/* Center dot */}
          <circle className="dot" cx="32" cy="32" r="3" fill="#C93500" />
        </svg>
      </div>

      {/* Shimmer bar */}
      <div style={{
        width: 120, height: 2, borderRadius: 2,
        background: 'linear-gradient(90deg, #FAF7F2 0%, #FFD6F9 40%, #C93500 60%, #FAF7F2 100%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.6s ease-in-out infinite',
        marginBottom: message ? 16 : 0,
      }} />

      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% center }
          100% { background-position: -200% center }
        }
      `}</style>

      {/* Optional message */}
      {message && (
        <div style={{ fontSize: 12, color: '#A8A29E', letterSpacing: '0.04em' }}>
          {message}
        </div>
      )}
    </div>
  )
}
