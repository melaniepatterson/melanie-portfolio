import { useState } from 'react'

const T = {
  white:    '#FFFFFF',
  cream:    '#FAF7F2',
  creamDark:'#EDE8E2',
  border:   '#DDD8D0',
  text:     '#1A1A1A',
  textMuted:'#6B6560',
  pinkDeep: '#C93500',
}

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
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 900,
      background: T.white, borderTop: `1px solid ${T.border}`,
      padding: '14px 20px', display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', gap: 16, flexWrap: 'wrap',
      boxShadow: '0 -2px 12px rgba(0,0,0,0.06)',
    }}>
      <div style={{ fontSize: 12, color: T.textMuted, lineHeight: 1.7, maxWidth: 620 }}>
        Glow Up uses essential cookies to keep you signed in, and small bits of browser storage for functional preferences. No tracking, no advertising, no third-party cookies.{' '}
        <a href="/privacy" style={{ color: T.pinkDeep, textDecoration: 'none', fontWeight: 500 }}>
          Privacy Policy
        </a>
      </div>
      <button onClick={dismiss}
        style={{ padding: '8px 18px', borderRadius: 0, border: `1px solid ${T.border}`, background: T.text, color: '#fff', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', fontWeight: 600, flexShrink: 0 }}>
        Got it
      </button>
    </div>
  )
}
