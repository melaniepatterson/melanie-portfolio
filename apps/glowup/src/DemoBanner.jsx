import { useEffect, useState } from 'react'
import T from './theme'

// Persistent top bar shown only in the read-only demo build. Always visible
// so a visitor never wonders why a click didn't do anything — and briefly
// flashes on every blocked write (see demoClient.js's 'glowup-demo-write'
// event) so the connection between "I clicked something" and "that's why"
// is immediate rather than left to guesswork.
export default function DemoBanner() {
  const [flash, setFlash] = useState(false)

  useEffect(() => {
    function onWrite() {
      setFlash(true)
      const t = setTimeout(() => setFlash(false), 900)
      return () => clearTimeout(t)
    }
    window.addEventListener('glowup-demo-write', onWrite)
    return () => window.removeEventListener('glowup-demo-write', onWrite)
  }, [])

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
      background: flash ? T.darkPink : T.darkGreen, color: T.white,
      textAlign: 'center', padding: '6px 12px', fontSize: 12, fontWeight: 600,
      transition: 'background 150ms ease', pointerEvents: 'none',
    }}>
      {flash ? "This is a demo — changes aren't saved" : "You're viewing a demo of Glow Up"}
    </div>
  )
}
