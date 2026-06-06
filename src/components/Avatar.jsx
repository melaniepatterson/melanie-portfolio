// Shared Avatar component — photo if available, initial letter if not
// Used in Profile page and SideMenu drawer

export default function Avatar({ avatarUrl, displayName, email, size = 44, onClick, style = {} }) {
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
    border: '0.5px solid #E7E0D8',
    cursor: onClick ? 'pointer' : 'default',
    background: avatarUrl ? 'transparent' : '#FFD6F9',
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
          color: '#C93500',
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
