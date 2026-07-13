import { useState } from 'react'
import T from './theme'

const COPY = {
  glowup: {
    storageKey: 'glowup_cookie_notice_dismissed',
    text: 'Glow Up uses essential cookies to keep you signed in, and small bits of browser storage for functional preferences. No tracking, no advertising, no third-party cookies.',
    privacyLink: '/privacy',
  },
  portfolio: {
    storageKey: 'portfolio_cookie_notice_dismissed',
    text: 'This site uses minimal browser storage — just to remember your scroll position between pages. No tracking, no advertising, no third-party cookies.',
    privacyLink: null,
  },
}

export default function CookieNotice({ variant = 'glowup' }) {
  const copy = COPY[variant]
  const [dismissed, setDismissed] = useState(() => {
    try { return !!localStorage.getItem(copy.storageKey) } catch { return false }
  })

  function dismiss() {
    try { localStorage.setItem(copy.storageKey, '1') } catch {}
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
        {copy.text}
        {copy.privacyLink && (
          <>
            {' '}
            <a href={copy.privacyLink} style={{ color: T.pinkDeep, textDecoration: 'none', fontWeight: 500 }}>
              Privacy Policy
            </a>
          </>
        )}
      </div>
      <button onClick={dismiss}
        style={{ padding: '8px 18px', borderRadius: 0, border: `1px solid ${T.border}`, background: T.text, color: '#fff', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', fontWeight: 600, flexShrink: 0 }}>
        Got it
      </button>
    </div>
  )
}
