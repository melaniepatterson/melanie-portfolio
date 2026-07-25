// Themed replacement for window.confirm()/alert() — see GlowUp_Project_Handoff.md
// Section 13.5 ("native confirm/alert can't be themed"). Visual pattern matches
// the reset/delete-account modals already hand-built in Profile.jsx.
import { useEffect, useRef } from 'react'
import T from '../theme'

let dialogIdCounter = 0

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  danger = true,
  busy = false,
}) {
  const titleId = useRef(`confirm-dialog-title-${++dialogIdCounter}`)
  const confirmRef = useRef(null)

  useEffect(() => {
    if (!open) return
    confirmRef.current?.focus()
    function handleKey(e) {
      if (e.key === 'Escape' && !busy) (onCancel || onConfirm)?.()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, busy, onCancel, onConfirm])

  if (!open) return null

  return (
    <div onClick={() => !busy && onCancel?.()} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby={titleId.current}
        style={{ background: T.white, border: `1px solid ${T.hairline}`, borderRadius: 0, width: '100%', maxWidth: 400, padding: '24px 20px' }}>
        <h3 id={titleId.current} style={{ fontSize: 16, fontWeight: 700, color: danger ? T.pinkDeep : T.text, margin: '0 0 10px' }}>{title}</h3>
        <p style={{ fontSize: 13, color: T.textMuted, lineHeight: 1.7, margin: '0 0 20px' }}>{message}</p>
        <div style={{ display: 'flex', gap: 8 }}>
          {onCancel && (
            <button onClick={onCancel} disabled={busy}
              style={{ flex: 1, padding: '10px', borderRadius: 0, border: `1px solid ${T.hairline}`, background: 'transparent', color: T.text, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>
              {cancelLabel}
            </button>
          )}
          <button ref={confirmRef} onClick={onConfirm} disabled={busy}
            style={{ flex: 1, padding: '10px', borderRadius: 0, border: 'none', background: danger ? T.pinkDeep : T.text, color: '#fff', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', fontWeight: 600 }}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
