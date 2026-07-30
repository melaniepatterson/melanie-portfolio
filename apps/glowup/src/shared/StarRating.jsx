import T from '../theme'

const STAR_PATH = 'M12,2 L14.35,9.24 L21.51,8.91 L15.80,13.24 L17.88,20.09 L12,16 L6.12,20.09 L8.20,13.24 L2.49,8.91 L9.65,9.24 Z'

// Active: T.yellow fill 100%. Empty: T.yellow border at 50% opacity.
// Per STYLES — OTHER ATOMS spec.
export default function StarRating({ value, onChange, size = 16 }) {
  return (
    <div role={onChange ? 'radiogroup' : undefined} aria-label={onChange ? 'Rating' : undefined} style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
      {[1, 2, 3, 4, 5].map(n => (
        <svg key={n} width={size} height={size} viewBox="0 0 24 24"
          onClick={onChange ? () => onChange(n) : undefined}
          role={onChange ? 'radio' : undefined}
          aria-checked={onChange ? n === value : undefined}
          aria-label={onChange ? `${n} out of 5 stars` : undefined}
          tabIndex={onChange ? 0 : undefined}
          onKeyDown={onChange ? (e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onChange(n) } }) : undefined}
          style={{ cursor: onChange ? 'pointer' : 'default', display: 'block', flexShrink: 0 }}>
          <path d={STAR_PATH}
            fill={n <= value ? T.yellow : 'none'}
            stroke={T.yellow}
            strokeWidth={n <= value ? 0 : 1}
            strokeOpacity={n <= value ? 1 : 0.5}
            strokeLinejoin="round" />
        </svg>
      ))}
    </div>
  )
}
