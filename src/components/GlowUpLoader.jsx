// Branded load screen for GlowUp — see handoff doc Section 7 for spec.
// Usage: <GlowUpLoader />
import { useEffect, useRef, useState } from 'react'
import T from './theme'

const SAYINGS = [
  'Buffering your barrier...',
  'Building layer by layer...',
  'Your actives are activating...',
  'Purging the cache. Not your skin...',
  'Slugging through it...',
  'One pump is never enough...',
  "SPF loading. Don't skip it...",
  'Reapplying every two hours...',
  'Exfoliating the unnecessary...',
  'Double cleansing the data...',
  'Reading the ingredients list...',
]

const BAR_COLORS = [T.pink, T.blue, T.green, T.yellow, T.orange]
const BG_COLORS = [T.darkPink, T.darkBlue, T.darkGreen, T.darkYellow, T.darkOrange]
const SLOT = 240          // px per color slot
const BAND_HALF = 45      // half-width of the solid color blob within a slot
const UNIT = SLOT * BAR_COLORS.length // one full pass through all 5 colors

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// One color blob centered in each slot, cream everywhere else — tiled via
// background-repeat and scrolled by exactly one UNIT width for a seamless loop.
function buildBarGradient() {
  const order = shuffle(BAR_COLORS)
  const stops = [`${T.creamLight} 0px`]
  order.forEach((color, i) => {
    const center = i * SLOT + SLOT / 2
    stops.push(`${T.creamLight} ${center - BAND_HALF}px`)
    stops.push(`${color} ${center}px`)
    stops.push(`${T.creamLight} ${center + BAND_HALF}px`)
  })
  stops.push(`${T.creamLight} ${UNIT}px`)
  return `linear-gradient(90deg, ${stops.join(', ')})`
}

export default function GlowUpLoader() {
  const bgColor = useRef(BG_COLORS[Math.floor(Math.random() * BG_COLORS.length)])
  const barGradient = useRef(buildBarGradient())
  const sayingQueue = useRef(shuffle(SAYINGS))
  const sayingIndex = useRef(0)
  const [text, setText] = useState('')

  useEffect(() => {
    let charTimer, holdTimer
    function typeSaying() {
      const saying = sayingQueue.current[sayingIndex.current]
      let i = 0
      setText('')
      function step() {
        i++
        setText(saying.slice(0, i))
        if (i < saying.length) {
          charTimer = setTimeout(step, 40)
        } else {
          holdTimer = setTimeout(() => {
            sayingIndex.current++
            if (sayingIndex.current >= sayingQueue.current.length) {
              sayingQueue.current = shuffle(SAYINGS)
              sayingIndex.current = 0
            }
            typeSaying()
          }, 1800)
        }
      }
      step()
    }
    typeSaying()
    return () => { clearTimeout(charTimer); clearTimeout(holdTimer) }
  }, [])

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: bgColor.current,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 28, zIndex: 9999,
    }}>
      <style>{`
        @keyframes glowupFloat {
          0%, 100% { transform: translateY(-8px); }
          50%      { transform: translateY(8px); }
        }
        @keyframes glowupBarRoll {
          0%   { background-position: -${UNIT}px 0; }
          100% { background-position: 0px 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .glowup-loader-wordmark, .glowup-loader-bar { animation: none !important; }
        }
      `}</style>

      <div className="glowup-loader-wordmark" style={{
        fontFamily: T.fontFamilyDisplay,
        fontSize: 'clamp(64px, 14vw, 88px)',
        lineHeight: 1,
        letterSpacing: '-0.01em',
        color: T.white,
        textAlign: 'center',
        animation: 'glowupFloat 3s cubic-bezier(0.445, 0.05, 0.55, 0.95) infinite',
        userSelect: 'none',
      }}>
        glow up.
      </div>

      <div style={{ width: 200, height: 6, borderRadius: T.radius.pill, overflow: 'hidden', background: T.creamLight }}>
        <div className="glowup-loader-bar" style={{
          width: '100%', height: '100%',
          backgroundImage: barGradient.current,
          backgroundSize: `${UNIT}px 100%`,
          backgroundRepeat: 'repeat-x',
          animation: 'glowupBarRoll 12.5s linear infinite',
        }} />
      </div>

      <div style={{
        fontFamily: T.fontFamily,
        fontSize: T.fontSize.sm,
        color: T.white,
        letterSpacing: '0.02em',
        minHeight: 16,
        textAlign: 'center',
      }}>
        {text}
      </div>
    </div>
  )
}
