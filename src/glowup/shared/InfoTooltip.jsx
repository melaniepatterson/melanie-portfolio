import { useState, useRef } from 'react'
import T from '../theme'

export default function InfoTooltip({ text }) {
  const [pos, setPos] = useState(null)
  const ref = useRef(null)
  function show() {
    if (ref.current) {
      const r = ref.current.getBoundingClientRect()
      setPos({ top: r.top - 8, left: r.left + r.width / 2 })
    }
  }
  return (
    <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', marginLeft: 4 }}>
      <span ref={ref} onMouseEnter={show} onMouseLeave={() => setPos(null)}
        onTouchStart={e => { e.stopPropagation(); pos ? setPos(null) : show() }}
        style={{ width: 14, height: 14, borderRadius: '50%', background: 'rgba(0,0,0,0.12)', color: T.textMuted, fontSize: 9, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'default', userSelect: 'none', flexShrink: 0 }}
      >i</span>
      {pos && (
        <span style={{ position: 'fixed', top: pos.top, left: Math.min(pos.left, window.innerWidth - 240), transform: 'translate(-50%, -100%)', background: T.text, color: T.white, fontSize: 11, lineHeight: 1.5, padding: '8px 10px', borderRadius: 8, width: 220, zIndex: 9999, boxShadow: '0 4px 16px rgba(0,0,0,0.15)', pointerEvents: 'none' }}>
          {text}
          <span style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', borderWidth: 4, borderStyle: 'solid', borderColor: `${T.text} transparent transparent transparent` }} />
        </span>
      )}
    </span>
  )
}
