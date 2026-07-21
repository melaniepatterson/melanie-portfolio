import { useState, useEffect, useMemo } from 'react'
import Avatar from './Avatar'
import { supabase } from '../lib/supabase'
import T from './theme'

// Each letter alternates up/down in a steady rhythm, with just the tilt
// varying a little per letter — applied on hover via CSS custom properties.
function ScatterText({ text }) {
  const offsets = useMemo(() => text.split('').map((_, i) => ({
    ty: (i % 2 === 0 ? -2 : 2).toFixed(1),
    rot: (Math.random() * 8 - 4).toFixed(1),
  })), [text])
  return text.split('').map((ch, i) => (
    <span key={i} className="glowup-scatter-letter" style={{ whiteSpace: 'pre', '--ty': `${offsets[i].ty}px`, '--rot': `${offsets[i].rot}deg` }}>
      {ch}
    </span>
  ))
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

  // Each item gets its own brand color for the active-state pill — avoids
  // yellow since that's now the drawer's own background.
  const menuItems = [
    { label: 'Calendar',           href: '/routine',          color: T.blue },
    { label: 'Routine history',    href: '/routine/history',  color: T.green },
    { label: 'Product library',    href: '/routine/products', color: T.pink },
    { label: 'Account & settings', href: '/routine/profile',  color: T.orange },
    { label: 'Send feedback', color: T.blue, action: onFeedback || (() => { window.location.href = '/routine?feedback=1' }) },
  ]

  async function signOut() {
    await supabase.auth.signOut()
    window.location.href = '/routine'
  }

  return (
    <>
      <style>{`
        @keyframes glowupMenuPop {
          0%   { transform: scale(0.9); }
          60%  { transform: scale(1.03); }
          100% { transform: scale(1); }
        }
        .glowup-scatter-letter {
          display: inline-block;
          transition: transform 0.25s cubic-bezier(.34,1.56,.64,1);
        }
        .glowup-menu-item:hover .glowup-scatter-letter {
          transform: translateY(var(--ty)) rotate(var(--rot));
        }
      `}</style>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.2)', zIndex: 200 }} />
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 280,
        background: T.yellow, border: 'none',
        zIndex: 201, display: 'flex', flexDirection: 'column',
        fontFamily: 'inherit', boxShadow: '-4px 0 24px rgba(0,0,0,0.2)',
      }}>
        {/* Header */}
        <div style={{ padding: '20px 20px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {!avatarReady ? (
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(0,0,0,0.1)', flexShrink: 0 }} />
              ) : (
                <Avatar avatarUrl={avatarUrl} displayName={displayName} email={email} size={44} />
              )}
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {avatarReady ? displayName : ''}
                </div>
              </div>
            </div>
            <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 22, color: T.text, padding: '0 2px', lineHeight: 1, flexShrink: 0 }}>×</button>
          </div>
        </div>

        {/* Menu items */}
        <div style={{ flex: 1, padding: '12px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {menuItems.map(({ label, href, action, color }) => {
            const isActive = href && currentPath === href
            return (
              <button key={label} className="glowup-menu-item"
                onClick={() => { onClose(); if (action) action(); else if (href) window.location.href = href }}
                style={{
                  display: 'flex', alignItems: 'center', width: '100%',
                  padding: '14px 16px', border: 'none', borderRadius: T.radius.card,
                  background: isActive ? color : 'transparent',
                  cursor: 'pointer', textAlign: 'left', fontSize: 18,
                  color: T.text, textTransform: 'uppercase', letterSpacing: '0.02em',
                  fontWeight: 700,
                  fontFamily: 'inherit',
                  animation: isActive ? 'glowupMenuPop 0.3s ease' : 'none',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(0,0,0,0.08)' }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
              >
                <ScatterText text={label} />
              </button>
            )
          })}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 20px', flexShrink: 0 }}>
          <button onClick={signOut} style={{
            display: 'flex', alignItems: 'center', width: '100%',
            padding: '10px 0', border: 'none', background: 'transparent',
            cursor: 'pointer', fontSize: 15, color: 'rgba(0,0,0,0.6)', textAlign: 'left',
          }}>
            Sign out
          </button>
          <div style={{ display: 'flex', gap: 16, paddingTop: 8 }}>
            <a href="/privacy" style={{ fontSize: 10, color: 'rgba(0,0,0,0.45)', textDecoration: 'none', letterSpacing: '0.04em' }}>Privacy Policy</a>
            <a href="/privacy#cookies" style={{ fontSize: 10, color: 'rgba(0,0,0,0.45)', textDecoration: 'none', letterSpacing: '0.04em' }}>Cookie Policy</a>
          </div>
        </div>
      </div>
    </>
  )
}
