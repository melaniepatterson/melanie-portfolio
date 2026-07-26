import { useEffect, useState } from 'react'
import T from '../theme'

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

  return (
    <>
      <style>{`
        @keyframes glowupTourPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(255,255,255,0.55); }
          50%      { box-shadow: 0 0 0 8px rgba(255,255,255,0); }
        }
      `}</style>
      {/* Blocking bands — everything except the cutout */}
      <div onClick={onSkip} style={{ position: 'fixed', top: 0, left: 0, right: 0, height: top, background: overlayBg, zIndex: 600 }} />
      <div onClick={onSkip} style={{ position: 'fixed', top: bottom, left: 0, right: 0, bottom: 0, background: overlayBg, zIndex: 600 }} />
      <div onClick={onSkip} style={{ position: 'fixed', top, left: 0, width: left, height, background: overlayBg, zIndex: 600 }} />
      <div onClick={onSkip} style={{ position: 'fixed', top, left: right, right: 0, height, background: overlayBg, zIndex: 600 }} />

      {/* Pulsing ring around the cutout — non-blocking, purely visual */}
      <div style={{
        position: 'fixed', top, left, width, height,
        borderRadius: 10, border: `2px solid ${T.white}`,
        animation: 'glowupTourPulse 1.6s ease-in-out infinite',
        pointerEvents: 'none', zIndex: 601,
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
