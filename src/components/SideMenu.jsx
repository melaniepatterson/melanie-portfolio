import { useState, useEffect } from 'react'
import Avatar from './Avatar'
import { supabase } from '../lib/supabase'

const T = {
  white: '#FFFFFF', cream: '#FAF7F2', creamDark: '#F0EBE3',
  border: '#E8E2DA', text: '#1A1A1A', textMuted: '#6B6560', textLight: '#9B9590',
  pinkDeep: '#C93500', pink: '#FFD6F9',
}

export default function SideMenu({ session, onClose, onFeedback }) {
  const email = session?.user?.email || ''
  const [profile, setProfile] = useState(null)
  const [imageReady, setImageReady] = useState(false)

  useEffect(() => {
    if (!session?.user?.id) return
    supabase.from('profiles').select('display_name, avatar_url').eq('id', session.user.id).single()
      .then(({ data }) => setProfile(data || {}))
  }, [session?.user?.id])

  useEffect(() => {
    const url = profile?.avatar_url
    if (!url) { setImageReady(true); return }
    const img = new Image()
    img.onload = () => setImageReady(true)
    img.onerror = () => setImageReady(true)
    img.src = url
  }, [profile?.avatar_url])

  const displayName = profile?.display_name || email.split('@')[0]
  const avatarUrl = profile?.avatar_url || null
  const avatarReady = profile !== null && imageReady

  const currentPath = window.location.pathname

  const menuItems = [
    { label: 'Calendar',          icon: '📅', href: '/routine' },
    { label: 'Routine history',   icon: '📋', href: '/routine/history' },
    { label: 'Product library',   icon: '🧴', href: '/routine/library' },
    { label: 'Account & settings',icon: '👤', href: '/routine/profile' },
    { label: 'Send feedback', icon: '💬', action: onFeedback || (() => { window.location.href = '/routine?feedback=1' }) },
  ]

  async function signOut() {
    await supabase.auth.signOut()
    window.location.href = '/routine'
  }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.2)', zIndex: 200 }} />
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 260,
        background: T.white, borderLeft: `0.5px solid ${T.border}`,
        zIndex: 201, display: 'flex', flexDirection: 'column',
        fontFamily: 'inherit', boxShadow: '-4px 0 24px rgba(0,0,0,0.08)',
      }}>
        {/* Header */}
        <div style={{ padding: '20px 20px 16px', borderBottom: `0.5px solid ${T.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {!avatarReady ? (
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: T.creamDark, flexShrink: 0 }} />
              ) : (
                <Avatar avatarUrl={avatarUrl} displayName={displayName} email={email} size={44} />
              )}
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {avatarReady ? displayName : ''}
                </div>
              </div>
            </div>
            <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 20, color: T.textMuted, padding: '0 2px', lineHeight: 1, flexShrink: 0 }}>×</button>
          </div>
        </div>

        {/* Menu items */}
        <div style={{ flex: 1, padding: '8px 0', overflowY: 'auto' }}>
          {menuItems.map(({ label, icon, href, action }) => {
            const isActive = href && currentPath === href
            return (
              <button key={label}
                onClick={() => { onClose(); if (action) action(); else if (href) window.location.href = href }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, width: '100%',
                  padding: '12px 20px', border: 'none',
                  background: isActive ? T.creamDark : 'transparent',
                  cursor: 'pointer', textAlign: 'left', fontSize: 13,
                  color: isActive ? T.pinkDeep : T.text,
                  borderBottom: `0.5px solid ${T.border}`,
                  fontWeight: isActive ? 600 : 400,
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = T.creamDark }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
              >
                <span style={{ fontSize: 16, width: 20, textAlign: 'center' }}>{icon}</span>
                {label}
              </button>
            )
          })}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 20px', borderTop: `0.5px solid ${T.border}`, flexShrink: 0 }}>
          <button onClick={signOut} style={{
            display: 'flex', alignItems: 'center', gap: 12, width: '100%',
            padding: '10px 0', border: 'none', background: 'transparent',
            cursor: 'pointer', fontSize: 13, color: T.textLight, textAlign: 'left',
          }}>
            <span style={{ fontSize: 16, width: 20, textAlign: 'center' }}>→</span>
            Sign out
          </button>
          <div style={{ display: 'flex', gap: 16, paddingTop: 8, borderTop: `0.5px solid ${T.border}` }}>
            <a href="/privacy" style={{ fontSize: 10, color: T.textLight, textDecoration: 'none', letterSpacing: '0.04em' }}>Privacy Policy</a>
            <a href="/privacy#cookies" style={{ fontSize: 10, color: T.textLight, textDecoration: 'none', letterSpacing: '0.04em' }}>Cookie Policy</a>
          </div>
        </div>
      </div>
    </>
  )
}
