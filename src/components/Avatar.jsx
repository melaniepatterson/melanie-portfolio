// Shared Avatar component — photo if available, gradient initial if not.
// Used in Profile page and SideMenu drawer.
import T from './theme'

const BRAND_COLORS = [T.pink, T.blue, T.green, T.yellow, T.orange]

// Two colors picked once per session (module load) — every Avatar
// instance shares the same gradient for the rest of the session.
const shuffled = [...BRAND_COLORS].sort(() => Math.random() - 0.5)
const [sessionColorA, sessionColorB] = shuffled

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
    background: avatarUrl ? 'transparent' : `linear-gradient(135deg, ${sessionColorA}, ${sessionColorB})`,
    ...style,
  }

  return (
    <div style={baseStyle} onClick={onClick}>
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
