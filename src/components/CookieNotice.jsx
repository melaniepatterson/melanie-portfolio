import { useState } from 'react'
import T from './theme'

const COPY = {
  glowup: {
    storageKey: 'glowup_cookie_notice_dismissed',
    text: 'Glow Up uses essential cookies to keep you signed in, and small bits of browser storage for functional preferences. No tracking, no advertising, no third-party cookies.',
    privacyLink: '/privacy',
    buttonBg: T.text,
    linkColor: T.darkGreen,
    border: 'none',
  },
  portfolio: {
    storageKey: 'portfolio_cookie_notice_dismissed',
    text: 'This site uses minimal browser storage. No tracking, no advertising, no third-party cookies.',
    privacyLink: null,
    buttonBg: T.pinkDeep,
    linkColor: T.pinkDeep,
    border: `1px solid ${T.border}`,
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
      position: 'fixed', bottom: 20, left: 20, zIndex: 900,
      width: 'min(280px, calc(100vw - 40px))',
      background: T.white, border: copy.border, borderRadius: 12,
      padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12,
      boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
    }}>
      <div style={{ fontSize: 12, color: T.textMuted, lineHeight: 1.6 }}>
        {copy.text}
        {copy.privacyLink && (
          <>
            {' '}
            <a href={copy.privacyLink} style={{ color: copy.linkColor, textDecoration: 'none', fontWeight: 500 }}>
              Privacy Policy
            </a>
          </>
        )}
      </div>
      <button onClick={dismiss}
        style={{ alignSelf: 'flex-start', padding: '8px 18px', borderRadius: 8, border: 'none', background: copy.buttonBg, color: '#fff', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', fontWeight: 600 }}>
        Got it
      </button>
    </div>
  )
}
