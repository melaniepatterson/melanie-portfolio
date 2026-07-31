import { Component } from 'react'
import T from './theme'

function ErrorScreen({ error, onRetry, type = 'boundary', message }) {
  const isLoad = type === 'load'
  return (
    <div style={{
      position: isLoad ? 'fixed' : 'relative',
      inset: isLoad ? 0 : undefined,
      minHeight: isLoad ? undefined : '60vh',
      background: T.white,
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
          fill="none" stroke={T.darkPink} strokeWidth="1.5" strokeLinejoin="round" />
        <circle cx="32" cy="32" r="2.5" fill={T.darkPink} opacity="0.6" />
      </svg>

      <div style={{ fontSize: 15, fontWeight: 600, color: T.text, marginBottom: 8, textAlign: 'center' }}>
        {isLoad ? (message || 'Couldn\'t load your routine') : 'Something went wrong'}
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
          <div style={{ marginTop: 8, padding: '8px 10px', background: T.surfaceMuted, borderRadius: 8, border: `0.5px solid ${T.hairline}`, fontSize: 11, color: T.textMuted, fontFamily: 'monospace', wordBreak: 'break-all', lineHeight: 1.6 }}>
            {error.message}
          </div>
        </details>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => onRetry ? onRetry() : window.location.reload()} style={{
          padding: '10px 20px', borderRadius: 10,
          border: 'none', background: T.darkPink,
          color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
        }}>
          {onRetry ? 'Try again' : 'Refresh page'}
        </button>
      </div>
    </div>
  )
}

// Non-fullscreen sibling of LoadError — for a panel/card whose load failed,
// where the rest of the page (nav, calendar chrome) should stay visible
// rather than being covered by a fixed overlay.
export function InlineLoadError({ message = "Couldn't load this.", onRetry }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      textAlign: 'center', padding: '28px 20px', gap: 10,
    }}>
      <svg width="32" height="32" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.5 }}>
        <path d="M32 6 L34 28 L56 32 L34 36 L32 58 L30 36 L8 32 L30 28 Z"
          fill="none" stroke={T.darkPink} strokeWidth="2" strokeLinejoin="round" />
        <circle cx="32" cy="32" r="3" fill={T.darkPink} opacity="0.6" />
      </svg>
      <div style={{ fontSize: 13, color: T.textMuted, lineHeight: 1.6, maxWidth: 260 }}>
        {message}
      </div>
      {onRetry && (
        <button onClick={onRetry} style={{
          padding: '8px 16px', borderRadius: T.radius.pill,
          border: `1px solid ${T.hairline}`, background: 'transparent',
          color: T.text, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
        }}>
          Try again
        </button>
      )}
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

// Fullscreen load error — used by any page whose primary data failed to load
export function LoadError({ error, onRetry, message }) {
  return <ErrorScreen error={error} type="load" onRetry={onRetry} message={message} />
}
