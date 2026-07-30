import { useState, useEffect, useMemo } from 'react'
import Avatar from './Avatar'
import { supabase } from '../lib/supabase'
import T from './theme'
import { GLOWUP_BASE, GLOWUP_HOME } from '../lib/glowupMode'

// Each letter alternates up/down in a steady rhythm, with just the tilt
// varying a little per letter — applied on hover via CSS custom properties.
// Letters are grouped per word (each word its own nowrap span) so that at
// larger sizes / narrower drawers, wrapping can only happen between words,
// not mid-word.
function ScatterText({ text }) {
  const words = useMemo(() => text.split(' '), [text])
  const offsets = useMemo(() => text.replace(/ /g, '').split('').map((_, i) => ({
    ty: (i % 2 === 0 ? -1 : 1).toFixed(1),
    rot: (Math.random() * 5 - 2.5).toFixed(1),
  })), [text])
  let idx = 0
  const nodes = []
  words.forEach((word, wi) => {
    const letters = word.split('').map(ch => {
      const i = idx++
      return (
        <span key={`c${i}`} className="glowup-scatter-letter" style={{ whiteSpace: 'pre', '--ty': `${offsets[i].ty}px`, '--rot': `${offsets[i].rot}deg` }}>
          {ch}
        </span>
      )
    })
    nodes.push(<span key={`w${wi}`} style={{ display: 'inline-flex' }}>{letters}</span>)
    if (wi < words.length - 1) nodes.push(<span key={`s${wi}`} style={{ whiteSpace: 'pre' }}> </span>)
  })
  return nodes
}


export default function SideMenu({ session, onClose, onFeedback, betaTester }) {
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

  useEffect(() => {
    function handleKey(e) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  const displayName = profile?.display_name || email.split('@')[0]
  const avatarUrl = profile?.avatar_url || null
  const avatarReady = profile !== null && imageReady

  const currentPath = window.location.pathname

  // Each item gets its own brand color for the active-state pill — the
  // four remaining items map 1:1 onto the app's four core brand colors
  // now that Account & settings lives behind the gear icon instead of
  // competing for a color here. Hover uses the matching dark variant with
  // white text (white on each dark* token is 5.4-7.4:1, comfortably past
  // WCAG AA even at normal-text size).
  const menuItems = [
    { label: 'Calendar',        href: GLOWUP_HOME,               color: T.blue,   hoverColor: T.darkBlue },
    { label: 'Routine history', href: `${GLOWUP_BASE}/history`,  color: T.green,  hoverColor: T.darkGreen },
    { label: 'Product library', href: `${GLOWUP_BASE}/products`, color: T.pink,   hoverColor: T.darkPink },
    // Beta testers give feedback through the beta survey instead — the
    // anonymous general feedback form isn't shown to them.
    ...(betaTester ? [] : [{ label: 'Send feedback', color: T.orange, hoverColor: T.darkOrange, action: onFeedback }]),
  ]

  async function signOut() {
    await supabase.auth.signOut()
    window.location.href = GLOWUP_HOME
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
        .glowup-menu-item:hover .glowup-scatter-letter,
        .glowup-menu-item.is-active .glowup-scatter-letter {
          transform: translateY(var(--ty)) rotate(var(--rot));
        }
      `}</style>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.2)', zIndex: 200 }} />
      <div role="dialog" aria-modal="true" aria-label="Main menu" style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 'min(400px, 88vw)',
        background: T.yellow, border: 'none',
        zIndex: 201, display: 'flex', flexDirection: 'column',
        fontFamily: 'inherit', boxShadow: '-4px 0 24px rgba(0,0,0,0.2)',
      }}>
        {/* Header — close button gets its own line up top so it isn't
            crowded against the gear icon on the identity row below. Sized
            and positioned to land on the same spot as the hamburger button
            underneath (36x~32-36, ~14px top / 20px right inset on every
            page that opens this drawer), so opening and closing the menu
            doesn't require moving the cursor. */}
        <div style={{ padding: '12px 20px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={onClose} aria-label="Close menu" style={{ border: 'none', background: 'transparent', borderRadius: T.radius.pill, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 34, fontSize: 20, color: T.text, lineHeight: 1, flexShrink: 0 }}>×</button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10 }}>
            {!avatarReady ? (
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(0,0,0,0.1)', flexShrink: 0 }} />
            ) : (
              <Avatar avatarUrl={avatarUrl} displayName={displayName} email={email} size={44} />
            )}
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {avatarReady ? displayName : ''}
              </div>
            </div>
            <a href={`${GLOWUP_BASE}/profile`} aria-label="Account & settings" onClick={onClose}
              style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: T.text, padding: 4, lineHeight: 1, flexShrink: 0, display: 'flex' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </a>
          </div>
        </div>

        {/* Menu items */}
        <div style={{ flex: 1, padding: '12px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {menuItems.map(({ label, href, action, color, hoverColor }) => {
            const isActive = href && currentPath === href
            return (
              <button key={label} className={`glowup-menu-item${isActive ? ' is-active' : ''}`}
                data-tour-target={label === 'Product library' ? 'product-library-menu-item' : undefined}
                onClick={() => { onClose(); if (action) action(); else if (href) window.location.href = href }}
                style={{
                  display: 'flex', alignItems: 'center', flexWrap: 'wrap', width: '100%',
                  padding: '16px 16px', border: 'none', borderRadius: T.radius.card,
                  background: isActive ? color : 'transparent',
                  cursor: 'pointer', textAlign: 'left', fontSize: 38,
                  color: T.text, textTransform: 'uppercase', letterSpacing: '0.02em',
                  fontWeight: 900, lineHeight: 1.1,
                  fontFamily: 'inherit',
                  animation: isActive ? 'glowupMenuPop 0.3s ease' : 'none',
                  transition: 'background 0.15s ease, color 0.15s ease',
                }}
                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = hoverColor; e.currentTarget.style.color = T.white } }}
                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = T.text } }}
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
            cursor: 'pointer', fontSize: 15, color: T.text, textAlign: 'left',
            textTransform: 'uppercase', letterSpacing: '0.02em',
          }}>
            Sign out
          </button>
          <div style={{ display: 'flex', gap: 16, paddingTop: 8 }}>
            <a href="/privacy" style={{ fontSize: 10, color: 'rgba(0,0,0,0.75)', textDecoration: 'none', letterSpacing: '0.04em' }}>Privacy Policy</a>
            <a href="/privacy#cookies" style={{ fontSize: 10, color: 'rgba(0,0,0,0.75)', textDecoration: 'none', letterSpacing: '0.04em' }}>Cookie Policy</a>
          </div>
        </div>
      </div>
    </>
  )
}
