// Themed replacement for window.confirm()/alert() — see GlowUp_Project_Handoff.md
// Section 13.5 ("native confirm/alert can't be themed"). Visual pattern matches
// the reset/delete-account modals already hand-built in Profile.jsx.
import T from '../theme'

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
  if (!open) return null

  return (
    <div onClick={() => !busy && onCancel?.()} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 0, width: '100%', maxWidth: 400, padding: '24px 20px' }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: danger ? T.pinkDeep : T.text, margin: '0 0 10px' }}>{title}</h3>
        <p style={{ fontSize: 13, color: T.textMuted, lineHeight: 1.7, margin: '0 0 20px' }}>{message}</p>
        <div style={{ display: 'flex', gap: 8 }}>
          {onCancel && (
            <button onClick={onCancel} disabled={busy}
              style={{ flex: 1, padding: '10px', borderRadius: 0, border: `1px solid ${T.border}`, background: 'transparent', color: T.text, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>
              {cancelLabel}
            </button>
          )}
          <button onClick={onConfirm} disabled={busy}
            style={{ flex: 1, padding: '10px', borderRadius: 0, border: 'none', background: danger ? T.pinkDeep : T.text, color: '#fff', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', fontWeight: 600 }}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
