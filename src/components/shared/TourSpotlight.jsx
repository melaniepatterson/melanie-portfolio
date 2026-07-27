import { useEffect, useState } from 'react'
import T from '../theme'
import GlowUpLogo from '../GlowUpWordmark'

// A guided-tour spotlight: dims the whole screen except a cutout around
// `targetSelector`, with a message bubble near the cutout. The four bands
// around the cutout are real elements with pointerEvents:'auto', so clicks
// are physically blocked everywhere except the spotlighted element — the
// cutout area itself has no overlay on top of it, so real clicks reach the
// real element underneath.
export default function TourSpotlight({ targetSelector, targetSelectors, message, onNext, nextLabel = 'Next', onSkip }) {
  const [rect, setRect] = useState(null)
  const selectors = targetSelectors || (targetSelector ? [targetSelector] : [])

  useEffect(() => {
    function measure() {
      const rects = selectors
        .map(sel => document.querySelector(sel))
        .filter(Boolean)
        .map(el => el.getBoundingClientRect())
      if (!rects.length) { setRect(null); return }
      const top = Math.min(...rects.map(r => r.top))
      const left = Math.min(...rects.map(r => r.left))
      const bottom = Math.max(...rects.map(r => r.bottom))
      const right = Math.max(...rects.map(r => r.right))
      setRect({ top, left, width: right - left, height: bottom - top })
    }
    measure()
    const id = setInterval(measure, 200) // catches layout shifts (images loading, etc.) without a full ResizeObserver wiring
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    return () => {
      clearInterval(id)
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
    }
  }, [selectors.join('|')])

  if (!rect) return null

  const PAD = 8
  const top = Math.max(0, rect.top - PAD)
  const left = Math.max(0, rect.left - PAD)
  const width = rect.width + PAD * 2
  const height = rect.height + PAD * 2
  const bottom = top + height
  const right = left + width
  const vw = window.innerWidth
  const vh = window.innerHeight
  const overlayBg = 'rgba(25, 122, 60, 0.88)' // T.darkGreen wash

  // Tooltip: prefer below the cutout, flip above if there isn't room.
  const spaceBelow = vh - bottom
  const tooltipBelow = spaceBelow > 140
  const tooltipTop = tooltipBelow ? bottom + 14 : Math.max(14, top - 14)
  const tooltipMaxWidth = 320
  let tooltipLeft = Math.min(Math.max(left, 14), vw - tooltipMaxWidth - 14)

  const cutoutRadius = 12

  return (
    <>
      <style>{`
        @keyframes glowupTourPulse {
          0%, 100% { box-shadow: 0 0 0 9999px ${overlayBg}, 0 0 0 0 rgba(255,255,255,0.55); }
          50%      { box-shadow: 0 0 0 9999px ${overlayBg}, 0 0 0 8px rgba(255,255,255,0); }
        }
      `}</style>
      {/* Click-blocking bands — invisible, everything except the cutout.
          Kept separate from the visual dimming below so the dimming layer
          can have real rounded corners (a huge box-shadow on a small
          rounded div) without losing click-blocking outside the cutout. */}
      <div onClick={onSkip} style={{ position: 'fixed', top: 0, left: 0, right: 0, height: top, zIndex: 600 }} />
      <div onClick={onSkip} style={{ position: 'fixed', top: bottom, left: 0, right: 0, bottom: 0, zIndex: 600 }} />
      <div onClick={onSkip} style={{ position: 'fixed', top, left: 0, width: left, height, zIndex: 600 }} />
      <div onClick={onSkip} style={{ position: 'fixed', top, left: right, right: 0, height, zIndex: 600 }} />

      {/* Dimming + pulsing ring, combined — a rounded div whose huge
          box-shadow paints the rest of the viewport, so the cutout's
          corners are genuinely rounded instead of a sharp rectangle. */}
      <div style={{
        position: 'fixed', top, left, width, height,
        borderRadius: cutoutRadius,
        boxShadow: `0 0 0 9999px ${overlayBg}, 0 0 0 0 rgba(255,255,255,0.55)`,
        animation: 'glowupTourPulse 1.6s ease-in-out infinite',
        pointerEvents: 'none', zIndex: 599,
      }} />

      {/* Message bubble — stopPropagation so clicking Next/the bubble itself
          doesn't bubble up to page-level "click anywhere closes the flyout"
          handlers (this bubble isn't a DOM descendant of the flyout modal,
          it's a fixed-position sibling, so it needs to guard explicitly). */}
      <div onClick={e => e.stopPropagation()} style={{
        position: 'fixed', top: tooltipTop, left: tooltipLeft, width: tooltipMaxWidth,
        background: T.white, borderRadius: T.radius.modal, padding: '14px 16px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.25)', zIndex: 602,
      }}>
        <div style={{ fontSize: 13, color: T.text, lineHeight: 1.6, marginBottom: onNext ? 12 : 0 }}>
          {message}
        </div>
        {onNext && (
          <button onClick={onNext} style={{ border: 'none', background: T.darkGreen, color: T.white, borderRadius: T.radius.pill, padding: '7px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            {nextLabel}
          </button>
        )}
      </div>
    </>
  )
}

// Duplicates the real header wordmark in solid black, fixed at its live
// on-screen position, above the dimming overlay (z-index 610) — so it
// reads clearly through the green wash instead of being tinted by it.
// Renders nothing if the real logo isn't currently on-screen.
export function TourLogo({ selector, size = 44 }) {
  const [rect, setRect] = useState(null)

  useEffect(() => {
    function measure() {
      const el = document.querySelector(selector)
      if (!el) { setRect(null); return }
      const r = el.getBoundingClientRect()
      const onScreen = r.bottom > 0 && r.top < window.innerHeight && r.right > 0 && r.left < window.innerWidth
      setRect(onScreen ? { top: r.top, left: r.left, width: r.width, height: r.height } : null)
    }
    measure()
    const id = setInterval(measure, 200)
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    return () => {
      clearInterval(id)
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
    }
  }, [selector])

  if (!rect) return null

  return (
    <div style={{ position: 'fixed', top: rect.top, left: rect.left, width: rect.width, height: rect.height, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', zIndex: 610 }}>
      <GlowUpLogo size={size} style={{ color: '#000000' }} />
    </div>
  )
}
