import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

const T = {
  white:    '#FFFFFF',
  cream:    '#FAF7F2',
  creamDark:'#F3EDE4',
  border:   '#E7E0D8',
  text:     '#1C1917',
  textMuted:'#78716C',
  textLight:'#A8A29E',
  pink:     '#FFD6F9',
  pinkDeep: '#C93500',
  red:      '#C93500',
}

const SKIN_TYPES = ['Dry', 'Oily', 'Combination', 'Normal', 'Sensitive']
const SKIN_GOALS = [
  'Anti-aging', 'Acne', 'Hyperpigmentation', 'Hydration',
  'Texture', 'Brightening', 'Redness', 'Pore size', 'Sun protection',
]

const SUPABASE_URL = 'https://brcjhshptisevcndqavz.supabase.co'
const MAX_DIMENSION = 400  // resize avatar to 400x400 max before upload
const WEBP_QUALITY  = 0.85

// Convert any image file to a square-cropped WebP blob via canvas
async function toWebP(file) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      // Square-crop from center
      const size = Math.min(img.width, img.height)
      const sx   = (img.width  - size) / 2
      const sy   = (img.height - size) / 2
      const dim  = Math.min(size, MAX_DIMENSION)
      const canvas = document.createElement('canvas')
      canvas.width  = dim
      canvas.height = dim
      canvas.getContext('2d').drawImage(img, sx, sy, size, size, 0, 0, dim, dim)
      canvas.toBlob(
        blob => blob ? resolve(blob) : reject(new Error('Canvas toBlob failed')),
        'image/webp',
        WEBP_QUALITY
      )
    }
    img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error('Image load failed')) }
    img.src = objectUrl
  })
}

export default function Profile({ session }) {
  const [profile,     setProfile]     = useState(null)
  const [displayName, setDisplayName] = useState('')
  const [skinType,    setSkinType]    = useState('')
  const [skinGoals,   setSkinGoals]   = useState([])
  const [avatarUrl,   setAvatarUrl]   = useState(null)
  const [uploading,   setUploading]   = useState(false)
  const [loading,     setLoading]     = useState(true)
  const [saving,      setSaving]      = useState(false)
  const [saved,       setSaved]       = useState(false)
  const fileInputRef = useRef(null)

  const userId = session?.user?.id
  const email  = session?.user?.email || ''

  useEffect(() => {
    if (!userId) return
    async function load() {
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
      if (data) {
        setProfile(data)
        setDisplayName(data.display_name || '')
        setSkinType(data.skin_type || '')
        setSkinGoals(data.skin_goals || [])
        if (data.avatar_url) setAvatarUrl(data.avatar_url)
      }
      setLoading(false)
    }
    load()
  }, [userId])

  async function handleAvatarUpload(e) {
    const file = e.target.files?.[0]
    if (!file || !userId) return
    if (!file.type.startsWith('image/')) return
    if (file.size > 10 * 1024 * 1024) { alert('Photo must be under 10MB'); return }

    setUploading(true)
    try {
      // Convert to square WebP via canvas
      const webpBlob = await toWebP(file)
      const path = `${userId}.webp`

      const { error } = await supabase.storage
        .from('avatars')
        .upload(path, webpBlob, { upsert: true, contentType: 'image/webp' })

      if (error) throw error

      // Bust cache with timestamp
      const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/avatars/${path}?t=${Date.now()}`

      await supabase.from('profiles').upsert({
        id: userId, email,
        avatar_url: publicUrl,
        updated_at: new Date().toISOString(),
      })

      setAvatarUrl(publicUrl)
    } catch (err) {
      console.error('Upload failed:', err)
      alert('Upload failed — please try again')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  async function handleSave() {
    setSaving(true)
    await supabase.from('profiles').upsert({
      id: userId, email,
      display_name: displayName,
      skin_type: skinType,
      skin_goals: skinGoals,
      updated_at: new Date().toISOString(),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    window.location.href = '/routine'
  }

  function toggleGoal(goal) {
    setSkinGoals(g => g.includes(goal) ? g.filter(x => x !== goal) : [...g, goal])
  }

  const initials = (displayName || email || '?').charAt(0).toUpperCase()

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'inherit', color: T.textMuted, fontSize: 13 }}>
      Loading...
    </div>
  )

  return (
    <div style={{ fontFamily: 'inherit', minHeight: '100vh', background: T.cream, padding: '0 0 40px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 20px 16px', borderBottom: `0.5px solid ${T.border}`, background: T.white }}>
        <button onClick={() => window.location.href = '/routine'}
          style={{ border: `0.5px solid ${T.border}`, background: 'transparent', borderRadius: 8, padding: '5px 12px', cursor: 'pointer', fontSize: 15, color: T.text }}>
          ←
        </button>
        <div style={{ fontSize: 15, fontWeight: 600, color: T.text }}>Profile</div>
      </div>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '24px 20px' }}>

        {/* Avatar */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 28 }}>
          <div style={{ position: 'relative', width: 88, height: 88 }}>
            <div
              onClick={() => !uploading && fileInputRef.current?.click()}
              style={{
                width: 88, height: 88, borderRadius: '50%',
                background: avatarUrl ? 'transparent' : T.pink,
                border: `2px solid ${T.border}`,
                overflow: 'hidden',
                cursor: uploading ? 'default' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: uploading ? 0.6 : 1,
                transition: 'opacity 0.2s',
              }}
            >
              {avatarUrl
                ? <img src={avatarUrl} alt="Profile"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontSize: 32, fontWeight: 700, color: T.pinkDeep }}>{initials}</span>
              }
            </div>
            {/* Edit ring on hover */}
            {!uploading && (
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  position: 'absolute', inset: 0, borderRadius: '50%',
                  background: 'rgba(0,0,0,0)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', transition: 'background 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.32)'; e.currentTarget.firstChild && (e.currentTarget.firstChild.style.opacity = '1') }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0)'; e.currentTarget.firstChild && (e.currentTarget.firstChild.style.opacity = '0') }}
              >
                <span style={{ fontSize: 11, color: '#fff', fontWeight: 600, opacity: 0, transition: 'opacity 0.15s' }}>Change</span>
              </div>
            )}
          </div>
          <div style={{ fontSize: 11, color: T.textLight, marginTop: 8 }}>
            {uploading ? 'Converting & uploading...' : 'Tap to change photo'}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*"
            onChange={handleAvatarUpload} style={{ display: 'none' }} />
        </div>

        {/* Email */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Email</div>
          <div style={{ fontSize: 13, color: T.textMuted, padding: '10px 12px', background: T.creamDark, borderRadius: 8, border: `0.5px solid ${T.border}` }}>{email}</div>
        </div>

        {/* Display name */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Display name</div>
          <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)}
            placeholder="Your name"
            style={{ width: '100%', fontSize: 13, padding: '10px 12px', border: `0.5px solid ${T.border}`, borderRadius: 8, background: T.white, color: T.text, boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' }} />
        </div>

        {/* Skin type */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Skin type</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {SKIN_TYPES.map(t => (
              <button key={t} onClick={() => setSkinType(t === skinType ? '' : t)}
                style={{ padding: '6px 14px', borderRadius: 20, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', border: `0.5px solid ${skinType === t ? T.pinkDeep : T.border}`, background: skinType === t ? T.pink : T.white, color: T.text }}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Skin goals */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Skin goals</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {SKIN_GOALS.map(g => (
              <button key={g} onClick={() => toggleGoal(g)}
                style={{ padding: '6px 14px', borderRadius: 20, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', border: `0.5px solid ${skinGoals.includes(g) ? T.pinkDeep : T.border}`, background: skinGoals.includes(g) ? T.pink : T.white, color: T.text }}>
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* Save */}
        <button onClick={handleSave} disabled={saving}
          style={{ width: '100%', padding: '12px', borderRadius: 10, border: 'none', background: saved ? '#4ADE80' : T.pinkDeep, color: saved ? '#14532D' : T.white, fontSize: 13, fontWeight: 600, cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.7 : 1, transition: 'background 0.2s', fontFamily: 'inherit', marginBottom: 16 }}>
          {saved ? '✓ Saved' : saving ? 'Saving...' : 'Save profile'}
        </button>

        {/* Sign out */}
        <button onClick={handleSignOut}
          style={{ width: '100%', padding: '12px', borderRadius: 10, border: `0.5px solid ${T.border}`, background: 'transparent', fontSize: 13, color: T.textMuted, cursor: 'pointer', fontFamily: 'inherit' }}>
          Sign out
        </button>
      </div>
    </div>
  )
}
