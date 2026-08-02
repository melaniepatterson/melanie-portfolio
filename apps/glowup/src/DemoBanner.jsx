import { useEffect, useState } from 'react'
import T from './theme'

// Persistent top bar shown only in the demo build. Demo writes actually
// apply in-memory (see demoClient.js) so the app feels real to click
// around in, but none of it is saved anywhere — a reload, new tab, or
// different device always starts over from the same seed data. Briefly
// flashes on every write (the 'glowup-demo-write' event) as a reminder of
// that, since there'd otherwise be no visible sign a "save" isn't real.
const BANNER_HEIGHT = 32

export default function DemoBanner() {
  const [flash, setFlash] = useState(false)

  useEffect(() => {
    function onWrite() {
      setFlash(true)
      const t = setTimeout(() => setFlash(false), 2200)
      return () => clearTimeout(t)
    }
    window.addEventListener('glowup-demo-write', onWrite)
    return () => window.removeEventListener('glowup-demo-write', onWrite)
  }, [])

  // Fixed rather than in normal flow, so it stays visible while scrolling —
  // but every page also has its own sticky header pinned to top:0, so we
  // reserve the banner's height as body padding to keep the two from
  // overlapping instead of just layering z-index over the header.
  useEffect(() => {
    document.body.style.paddingTop = `${BANNER_HEIGHT}px`
    return () => { document.body.style.paddingTop = '' }
  }, [])

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000, height: BANNER_HEIGHT,
      display: 'flex', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box',
      background: flash ? T.darkPink : T.darkGreen, color: T.white,
      textAlign: 'center', padding: '0 12px', fontSize: 12, fontWeight: 600,
      transition: 'background 150ms ease', pointerEvents: 'none',
    }}>
      {flash ? "Demo mode — resets when you reload" : "You're viewing a demo of Glow Up"}
    </div>
  )
}
