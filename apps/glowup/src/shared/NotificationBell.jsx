// Notification bell for headers outside the calendar page (which has its
// own inline version already wired to data it loads anyway). Self-
// contained: drop <NotificationBell session={session} /> next to a
// hamburger button and it handles its own data + open state.
import { useState } from 'react'
import T from '../theme'
import { useNotifications } from './useNotifications'

export default function NotificationBell({ session }) {
  const { notifications, unreadCount } = useNotifications(session)
  const [open, setOpen] = useState(false)

  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(s => !s)}
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
        aria-expanded={open}
        style={{ position: 'relative', border: 'none', background: 'transparent', borderRadius: T.radius.pill, padding: '6px 8px', cursor: 'pointer', color: T.white, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 32 }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span aria-hidden="true" style={{ position: 'absolute', top: 2, right: 2, width: 14, height: 14, borderRadius: '50%', background: T.warn, color: '#fff', fontSize: 8, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 149 }} />
          <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 8, width: 'min(340px, 90vw)', maxHeight: '70vh', overflowY: 'auto', background: T.white, border: `1px solid ${T.text}`, borderRadius: T.radius.modal, padding: '14px 16px', boxShadow: '0 8px 32px rgba(0,0,0,0.18)', zIndex: 150 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 12 }}>Notifications</div>
            {notifications.length === 0 ? (
              <div style={{ fontSize: 12, color: T.text, opacity: 0.7, fontStyle: 'italic', padding: '8px 0' }}>
                You're all caught up — nothing needs attention right now.
              </div>
            ) : notifications.map(n => (
              <div key={n.id} style={{ display: 'flex', gap: 12, padding: '10px 0', borderTop: `0.5px solid ${T.hairline}` }}>
                <div style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>
                  {n.type === 'warning' ? '⚠️' : n.type === 'nudge' ? '✅' : 'ℹ️'}
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 2 }}>{n.title}</div>
                  <div style={{ fontSize: 11, color: T.text, opacity: 0.7, lineHeight: 1.6 }}>{n.body}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
