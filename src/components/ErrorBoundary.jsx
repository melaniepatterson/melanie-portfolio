import { Component } from 'react'

const T = {
  cream:    '#FAF7F2',
  border:   '#E7E0D8',
  text:     '#1C1917',
  textMuted:'#78716C',
  textLight:'#A8A29E',
  pinkDeep: '#C93500',
  pink:     '#FFD6F9',
  creamDark:'#F3EDE4',
}

function ErrorScreen({ error, onRetry, type = 'boundary' }) {
  const isLoad = type === 'load'
  return (
    <div style={{
      position: isLoad ? 'fixed' : 'relative',
      inset: isLoad ? 0 : undefined,
      minHeight: isLoad ? undefined : '60vh',
      background: T.cream,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: 'inherit', padding: '32px 24px',
      zIndex: isLoad ? 9999 : undefined,
    }}>
      {/* Wordmark */}
      <div style={{ fontSize: 22, fontWeight: 700, color: T.text, letterSpacing: '-0.02em', marginBottom: 32 }}>
        Glow Up.
      </div>

      {/* Sad star */}
      <svg width="52" height="52" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" style={{ marginBottom: 20, opacity: 0.5 }}>
        <path d="M32 6 L34 28 L56 32 L34 36 L32 58 L30 36 L8 32 L30 28 Z"
          fill="none" stroke={T.pinkDeep} strokeWidth="1.5" strokeLinejoin="round" />
        <circle cx="32" cy="32" r="2.5" fill={T.pinkDeep} opacity="0.6" />
      </svg>

      <div style={{ fontSize: 15, fontWeight: 600, color: T.text, marginBottom: 8, textAlign: 'center' }}>
        {isLoad ? 'Couldn\'t load your routine' : 'Something went wrong'}
      </div>

      <div style={{ fontSize: 13, color: T.textMuted, lineHeight: 1.6, textAlign: 'center', maxWidth: 300, marginBottom: 24 }}>
        {isLoad
          ? 'We had trouble connecting. Check your connection and try again — your data is safe.'
          : 'An unexpected error occurred. Refreshing usually fixes it.'}
      </div>

      {/* Error detail — collapsed */}
      {error?.message && (
        <details style={{ marginBottom: 20, width: '100%', maxWidth: 340 }}>
          <summary style={{ fontSize: 11, color: T.textLight, cursor: 'pointer', userSelect: 'none' }}>
            Show error details
          </summary>
          <div style={{ marginTop: 8, padding: '8px 10px', background: T.creamDark, borderRadius: 8, border: `0.5px solid ${T.border}`, fontSize: 11, color: T.textMuted, fontFamily: 'monospace', wordBreak: 'break-all', lineHeight: 1.6 }}>
            {error.message}
          </div>
        </details>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => window.location.reload()} style={{
          padding: '10px 20px', borderRadius: 10,
          border: 'none', background: T.pinkDeep,
          color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
        }}>
          Refresh page
        </button>
      </div>
    </div>
  )
}

// React Error Boundary — catches unexpected JS errors
export class ErrorBoundary extends Component {
  state = { hasError: false, error: null }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('[GlowUp] Uncaught error:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorScreen
          error={this.state.error}
          type="boundary"
          onRetry={() => this.setState({ hasError: false, error: null })}
        />
      )
    }
    return this.props.children
  }
}

// Inline load error — used inside GlowUpCalendar when loadAll() fails
export function LoadError({ error, onRetry }) {
  return <ErrorScreen error={error} type="load" onRetry={onRetry} />
}
