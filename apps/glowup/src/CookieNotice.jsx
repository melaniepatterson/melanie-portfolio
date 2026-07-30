import { useState } from 'react'

const STORAGE_KEY = 'glowup_cookie_notice_dismissed'

export default function CookieNotice() {
  const [dismissed, setDismissed] = useState(() => {
    try { return !!localStorage.getItem(STORAGE_KEY) } catch { return false }
  })

  function dismiss() {
    try { localStorage.setItem(STORAGE_KEY, '1') } catch {}
    setDismissed(true)
  }

  if (dismissed) return null

  return (
    <div style={{
      position: 'fixed', bottom: 20, left: 20, zIndex: 900,
      width: 'min(280px, calc(100vw - 40px))',
      background: '#FFFFFF', border: 'none', borderRadius: 12,
      padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12,
      boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
    }}>
      <div style={{ fontSize: 12, color: 'rgba(0, 0, 0, 0.70)', lineHeight: 1.6 }}>
        Glow Up uses essential cookies to keep you signed in, and small bits of browser storage for functional preferences. No tracking, no advertising, no third-party cookies.
        {' '}
        <a href="/privacy" style={{ color: '#197A3C', textDecoration: 'none', fontWeight: 500 }}>
          Privacy Policy
        </a>
      </div>
      <button onClick={dismiss}
        style={{ alignSelf: 'flex-start', padding: '8px 18px', borderRadius: '9999px', border: 'none', background: '#000000', color: '#FFFFFF', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', fontWeight: 600 }}>
        Got it
      </button>
    </div>
  )
}
