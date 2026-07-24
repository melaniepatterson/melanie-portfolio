// Shared Avatar component — photo if available, gradient initial if not.
// Used in Profile page and SideMenu drawer.
import T from './theme'

// No yellow — the SideMenu drawer background is yellow, and a yellow
// avatar would disappear into it there.
const BRAND_COLORS = [T.pink, T.blue, T.green, T.orange]

// One color picked once per session (module load) — every Avatar
// instance shares the same solid color for the rest of the session.
const sessionColor = BRAND_COLORS[Math.floor(Math.random() * BRAND_COLORS.length)]

export const AVATAR_SIZES = { large: 90, medium: 64, small: 32 }

export default function Avatar({ avatarUrl, displayName, email, size = AVATAR_SIZES.medium, onClick, style = {} }) {
  const initial = (displayName || email || '?').charAt(0).toUpperCase()

  // Scale font relative to size
  const fontSize = Math.round(size * 0.38)

  const baseStyle = {
    width: size,
    height: size,
    borderRadius: '50%',
    overflow: 'hidden',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: `0.5px solid ${T.border}`,
    cursor: onClick ? 'pointer' : 'default',
    background: avatarUrl ? 'transparent' : sessionColor,
    ...style,
  }

  return (
    <div style={baseStyle} onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={onClick ? 'Change profile photo' : undefined}
      onKeyDown={onClick ? (e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick() } }) : undefined}>
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={displayName || 'Profile'}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={e => { e.target.style.display = 'none' }}
        />
      ) : (
        <span style={{
          fontSize,
          fontWeight: 700,
          color: T.white,
          lineHeight: 1,
          fontFamily: 'inherit',
          userSelect: 'none',
        }}>
          {initial}
        </span>
      )}
    </div>
  )
}
