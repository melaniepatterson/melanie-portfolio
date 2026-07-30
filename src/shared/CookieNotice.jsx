import { useState } from 'react'
import T from '../glowup/theme'

const COPY = {
  glowup: {
    storageKey: 'glowup_cookie_notice_dismissed',
    text: 'Glow Up uses essential cookies to keep you signed in, and small bits of browser storage for functional preferences. No tracking, no advertising, no third-party cookies.',
    privacyLink: '/privacy',
    width: 280,
    padding: '16px 18px',
    gap: 12,
    fontSize: 12,
    background: T.white,
    textColor: T.textMuted,
    border: 'none',
    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
    buttonBg: T.text,
    buttonTextColor: T.white,
    linkColor: T.darkGreen,
    buttonRadius: T.radius.pill,
  },
  portfolio: {
    storageKey: 'portfolio_cookie_notice_dismissed',
    text: 'This site uses minimal browser storage. No tracking, no advertising, no third-party cookies.',
    privacyLink: null,
    width: 220,
    padding: '12px 14px',
    gap: 8,
    fontSize: 11,
    background: '#C93500',
    textColor: T.white,
    border: 'none',
    boxShadow: 'none',
    buttonBg: T.white,
    buttonTextColor: '#C93500',
    linkColor: T.white,
    buttonRadius: 8,
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
      width: `min(${copy.width}px, calc(100vw - 40px))`,
      background: copy.background, border: copy.border, borderRadius: 12,
      padding: copy.padding, display: 'flex', flexDirection: 'column', gap: copy.gap,
      boxShadow: copy.boxShadow,
    }}>
      <div style={{ fontSize: copy.fontSize, color: copy.textColor, lineHeight: 1.6 }}>
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
        style={{ alignSelf: 'flex-start', padding: '8px 18px', borderRadius: copy.buttonRadius, border: 'none', background: copy.buttonBg, color: copy.buttonTextColor, cursor: 'pointer', fontSize: copy.fontSize, fontFamily: 'inherit', fontWeight: 600 }}>
        Got it
      </button>
    </div>
  )
}
