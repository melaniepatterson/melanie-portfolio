import { useState } from 'react'
import T from '../theme'

// A one-time, dismissible tip shown the first time a user sees a given
// screen — persisted per-device via localStorage so it never reappears
// once dismissed. Visual language matches the app's existing dismissible
// nudge banners (see the program-advance nudge in GlowUpCalendar.jsx).
export default function FirstVisitTip({ storageKey, children }) {
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem(storageKey) === '1' } catch { return false }
  })

  if (dismissed) return null

  function dismiss() {
    try { localStorage.setItem(storageKey, '1') } catch {}
    setDismissed(true)
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: T.blue, color: T.darkBlue, borderRadius: T.radius.card, padding: '10px 14px', marginBottom: 12, fontSize: 12, lineHeight: 1.5 }}>
      <div style={{ flex: 1 }}>{children}</div>
      <button onClick={dismiss} style={{ border: 'none', background: 'transparent', color: T.darkBlue, fontWeight: 700, fontSize: 11, cursor: 'pointer', whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '0.04em', flexShrink: 0 }}>
        Got it
      </button>
    </div>
  )
}
