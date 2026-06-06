import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import Avatar from './Avatar'
import CropModal from './CropModal'

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
}

const SUPABASE_URL = 'https://brcjhshptisevcndqavz.supabase.co'

const SKIN_TYPES = ['Dry', 'Oily', 'Combination', 'Normal', 'Sensitive']

const SKIN_GOALS = [
  'Anti-aging', 'Texture', 'Brightening', 'Pore size', 'Sun protection',
]

const SKIN_CONCERNS = [
  'Hormonal acne', 'Cystic acne', 'Post-inflammatory hyperpigmentation (PIH)',
  'Melasma', 'Rosacea', 'Perioral dermatitis', 'Keratosis pilaris (KP)',
  'Eczema / atopic dermatitis', 'Dehydration', 'Sensitivity / reactivity',
]

const AGE_RANGES = ['Under 18', '18–24', '25–34', '35–44', '45–54', '55+']

const RETINOID_LEVELS = [
  { key: 'none',         label: 'None',         sub: 'never used' },
  { key: 'beginner',     label: 'Beginner',     sub: '< 6 months' },
  { key: 'intermediate', label: 'Intermediate', sub: '6 mo – 2 yrs' },
  { key: 'experienced',  label: 'Experienced',  sub: '2+ years' },
]

const CLIMATES = ['Arid / desert', 'Temperate', 'Humid', 'Tropical', 'Variable / seasonal']

// Fitzpatrick scale: tone colors + labels
const FITZPATRICK = [
  { n: 1, color: '#F5D5B8', label: 'Type I',   sub: 'Very fair, always burns' },
  { n: 2, color: '#E8B88A', label: 'Type II',  sub: 'Fair, usually burns' },
  { n: 3, color: '#C68642', label: 'Type III', sub: 'Medium, sometimes burns' },
  { n: 4, color: '#A0522D', label: 'Type IV',  sub: 'Olive, rarely burns' },
  { n: 5, color: '#6B3A2A', label: 'Type V',   sub: 'Brown, very rarely burns' },
  { n: 6, color: '#3B1F0E', label: 'Type VI',  sub: 'Deep brown, never burns' },
]

function SectionLabel({ children }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
      {children}
    </div>
  )
}

function OptionalTag() {
  return (
    <span style={{ fontSize: 9, fontWeight: 500, color: T.textLight, textTransform: 'uppercase', letterSpacing: '0.05em', marginLeft: 6, verticalAlign: 'middle' }}>
      optional
    </span>
  )
}

function PillButton({ active, onClick, children, sub }) {
  return (
    <button onClick={onClick} style={{
      padding: sub ? '6px 12px' : '6px 14px',
      borderRadius: 20, fontSize: 12, cursor: 'pointer',
      border: `0.5px solid ${active ? T.pinkDeep : T.border}`,
      background: active ? T.pink : T.white,
      color: T.text, fontFamily: 'inherit',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
    }}>
      <span>{children}</span>
      {sub && <span style={{ fontSize: 9, color: T.textMuted }}>{sub}</span>}
    </button>
  )
}

export default function Profile({ session }) {
  const [displayName,   setDisplayName]   = useState('')
  const [skinType,      setSkinType]      = useState('')
  const [skinGoals,     setSkinGoals]     = useState([])
  const [skinConcerns,  setSkinConcerns]  = useState([])
  const [fitzpatrick,   setFitzpatrick]   = useState(null)
  const [ageRange,      setAgeRange]      = useState('')
  const [retinoidExp,   setRetinoidExp]   = useState('')
  const [climate,       setClimate]       = useState('')
  const [newsletterOptIn, setNewsletterOptIn] = useState(false)
  const [avatarUrl,     setAvatarUrl]     = useState(null)
  const [cropSrc,       setCropSrc]       = useState(null)
  const [uploading,     setUploading]     = useState(false)
  const [loading,       setLoading]       = useState(true)
  const [saving,        setSaving]        = useState(false)
  const [saved,         setSaved]         = useState(false)
  const fileInputRef = useRef(null)

  const userId = session?.user?.id
  const email  = session?.user?.email || ''

  useEffect(() => {
    if (!userId) return
    supabase.from('profiles').select('*').eq('id', userId).single()
      .then(({ data }) => {
        if (data) {
          setDisplayName(data.display_name || '')
          setSkinType(data.skin_type || '')
          setSkinGoals(data.skin_goals || [])
          setSkinConcerns(data.skin_concerns || [])
          setFitzpatrick(data.fitzpatrick || null)
          setAgeRange(data.age_range || '')
          setRetinoidExp(data.retinoid_experience || '')
          setClimate(data.climate || '')
          if (data.avatar_url) setAvatarUrl(data.avatar_url)
          setNewsletterOptIn(data.newsletter_opt_in || false)
        }
        setLoading(false)
      })
  }, [userId])

  function handleAvatarUpload(e) {
    const file = e.target.files?.[0]
    if (!file || !userId) return
    if (!file.type.startsWith('image/')) return
    if (file.size > 10 * 1024 * 1024) { alert('Photo must be under 10MB'); return }
    setCropSrc(URL.createObjectURL(file))
    e.target.value = ''
  }

  async function handleCropConfirm(webpBlob) {
    setUploading(true)
    try {
      const path = `${userId}.webp`
      const { error } = await supabase.storage
        .from('avatars')
        .upload(path, webpBlob, { upsert: true, contentType: 'image/webp' })
      if (error) throw error
      const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/avatars/${path}?t=${Date.now()}`
      await supabase.from('profiles').upsert({ id: userId, email, avatar_url: publicUrl, updated_at: new Date().toISOString() })
      setAvatarUrl(publicUrl)
      setCropSrc(null)
    } catch (err) {
      console.error('Upload failed:', err)
      alert('Upload failed — please try again')
    } finally {
      setUploading(false)
    }
  }

  function handleCropCancel() {
    if (cropSrc) URL.revokeObjectURL(cropSrc)
    setCropSrc(null)
  }

  function toggleArr(setter, val) {
    setter(prev => prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val])
  }

  async function handleSave() {
    setSaving(true)
    await supabase.from('profiles').upsert({
      id: userId, email,
      display_name:        displayName,
      skin_type:           skinType,
      skin_goals:          skinGoals,
      skin_concerns:       skinConcerns,
      fitzpatrick:         fitzpatrick,
      age_range:           ageRange || null,
      retinoid_experience: retinoidExp || null,
      climate:             climate || null,
      newsletter_opt_in:   newsletterOptIn,
      updated_at:          new Date().toISOString(),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'inherit', color: T.textMuted, fontSize: 13 }}>
      Loading...
    </div>
  )

  return (
    <div style={{ fontFamily: 'inherit', minHeight: '100vh', background: T.cream, padding: '0 0 60px' }}>
      {cropSrc && (
        <CropModal imageSrc={cropSrc} onConfirm={handleCropConfirm} onCancel={handleCropCancel} uploading={uploading} />
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 20px 16px', borderBottom: `0.5px solid ${T.border}`, background: T.white, position: 'sticky', top: 0, zIndex: 10 }}>
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
            <Avatar avatarUrl={avatarUrl} displayName={displayName} email={email} size={88}
              onClick={() => !uploading && fileInputRef.current?.click()}
              style={{ opacity: uploading ? 0.6 : 1, transition: 'opacity 0.2s', border: `2px solid ${T.border}`, cursor: uploading ? 'default' : 'pointer' }} />
            {!uploading && (
              <div onClick={() => fileInputRef.current?.click()}
                style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(0,0,0,0)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.32)'; e.currentTarget.querySelector('span').style.opacity = '1' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0)'; e.currentTarget.querySelector('span').style.opacity = '0' }}>
                <span style={{ fontSize: 11, color: '#fff', fontWeight: 600, opacity: 0, transition: 'opacity 0.15s', pointerEvents: 'none' }}>Change</span>
              </div>
            )}
          </div>
          <div style={{ fontSize: 11, color: T.textLight, marginTop: 8 }}>
            {uploading ? 'Uploading...' : 'Tap to change photo'}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: 'none' }} />
        </div>

        {/* Email */}
        <div style={{ marginBottom: 20 }}>
          <SectionLabel>Email</SectionLabel>
          <div style={{ fontSize: 13, color: T.textMuted, padding: '10px 12px', background: T.creamDark, borderRadius: 8, border: `0.5px solid ${T.border}` }}>{email}</div>
        </div>

        {/* Display name */}
        <div style={{ marginBottom: 24 }}>
          <SectionLabel>Display name</SectionLabel>
          <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Your name"
            style={{ width: '100%', fontSize: 13, padding: '10px 12px', border: `0.5px solid ${T.border}`, borderRadius: 8, background: T.white, color: T.text, boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' }} />
        </div>

        <div style={{ height: 1, background: T.border, marginBottom: 24 }} />

        {/* Fitzpatrick skin tone */}
        <div style={{ marginBottom: 24 }}>
          <SectionLabel>Skin tone <OptionalTag /></SectionLabel>
          <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 10, lineHeight: 1.5 }}>
            Fitzpatrick scale — helps us understand how products work across different melanin levels.
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {FITZPATRICK.map(f => (
              <button key={f.n} onClick={() => setFitzpatrick(fitzpatrick === f.n ? null : f.n)}
                title={`${f.label} — ${f.sub}`}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  padding: '8px 10px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit',
                  border: `2px solid ${fitzpatrick === f.n ? T.pinkDeep : T.border}`,
                  background: fitzpatrick === f.n ? T.pink : T.white,
                  minWidth: 54,
                }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: f.color, border: '0.5px solid rgba(0,0,0,0.15)' }} />
                <span style={{ fontSize: 9, color: T.textMuted, fontWeight: 500 }}>{f.label}</span>
              </button>
            ))}
          </div>
          {fitzpatrick && (
            <div style={{ fontSize: 11, color: T.textMuted, marginTop: 6 }}>
              {FITZPATRICK[fitzpatrick - 1].label} — {FITZPATRICK[fitzpatrick - 1].sub}
            </div>
          )}
        </div>

        {/* Age range */}
        <div style={{ marginBottom: 24 }}>
          <SectionLabel>Age range <OptionalTag /></SectionLabel>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {AGE_RANGES.map(a => (
              <PillButton key={a} active={ageRange === a} onClick={() => setAgeRange(ageRange === a ? '' : a)}>{a}</PillButton>
            ))}
          </div>
        </div>

        {/* Skin type */}
        <div style={{ marginBottom: 24 }}>
          <SectionLabel>Skin type <OptionalTag /></SectionLabel>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {SKIN_TYPES.map(t => (
              <PillButton key={t} active={skinType === t} onClick={() => setSkinType(skinType === t ? '' : t)}>{t}</PillButton>
            ))}
          </div>
        </div>

        {/* Skin goals */}
        <div style={{ marginBottom: 24 }}>
          <SectionLabel>What I'm working toward <OptionalTag /></SectionLabel>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {SKIN_GOALS.map(g => (
              <PillButton key={g} active={skinGoals.includes(g)} onClick={() => toggleArr(setSkinGoals, g)}>{g}</PillButton>
            ))}
          </div>
        </div>

        {/* Specific concerns */}
        <div style={{ marginBottom: 24 }}>
          <SectionLabel>What I'm managing <OptionalTag /></SectionLabel>
          
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {SKIN_CONCERNS.map(c => (
              <PillButton key={c} active={skinConcerns.includes(c)} onClick={() => toggleArr(setSkinConcerns, c)}>{c}</PillButton>
            ))}
          </div>
        </div>

        {/* Retinoid experience */}
        <div style={{ marginBottom: 24 }}>
          <SectionLabel>Retinoid experience <OptionalTag /></SectionLabel>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {RETINOID_LEVELS.map(r => (
              <PillButton key={r.key} active={retinoidExp === r.key} sub={r.sub}
                onClick={() => setRetinoidExp(retinoidExp === r.key ? '' : r.key)}>
                {r.label}
              </PillButton>
            ))}
          </div>
        </div>

        {/* Climate */}
        <div style={{ marginBottom: 32 }}>
          <SectionLabel>Your climate <OptionalTag /></SectionLabel>
          <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 8 }}>Affects which moisturizers and cleansers work best for you.</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {CLIMATES.map(c => (
              <PillButton key={c} active={climate === c} onClick={() => setClimate(climate === c ? '' : c)}>{c}</PillButton>
            ))}
          </div>
        </div>

        {/* Newsletter opt-in */}
        <div style={{ marginBottom: 24, padding: '14px 16px', background: T.white, borderRadius: 10, border: `0.5px solid ${T.border}` }}>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}>
            <div style={{ position: 'relative', flexShrink: 0, marginTop: 2 }}>
              <input
                type="checkbox"
                checked={newsletterOptIn}
                onChange={e => setNewsletterOptIn(e.target.checked)}
                style={{ width: 18, height: 18, accentColor: T.pinkDeep, cursor: 'pointer', marginTop: 0 }}
              />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 3 }}>
                Subscribe to the newsletter
              </div>
              <div style={{ fontSize: 11, color: T.textMuted, lineHeight: 1.5 }}>
                Occasional updates on new products, routine tips, and what we're loving. No spam, unsubscribe any time.
              </div>
            </div>
          </label>
        </div>

        {/* Privacy note */}
        <div style={{ fontSize: 11, color: T.textLight, lineHeight: 1.6, padding: '12px 14px', background: T.creamDark, borderRadius: 8, border: `0.5px solid ${T.border}`, marginBottom: 20 }}>
          Your data is never sold or shared. Optional fields help us understand which products work best for different skin tones, types, and concerns — so recommendations get better for everyone.
        </div>

        {/* Save */}
        <button onClick={handleSave} disabled={saving}
          style={{ width: '100%', padding: '12px', borderRadius: 10, border: 'none', background: saved ? '#4ADE80' : T.pinkDeep, color: saved ? '#14532D' : T.white, fontSize: 13, fontWeight: 600, cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.7 : 1, transition: 'background 0.2s', fontFamily: 'inherit', marginBottom: 16 }}>
          {saved ? '✓ Saved' : saving ? 'Saving...' : 'Save profile'}
        </button>

        {/* Sign out */}
        <button onClick={async () => { await supabase.auth.signOut(); window.location.href = '/routine' }}
          style={{ width: '100%', padding: '12px', borderRadius: 10, border: `0.5px solid ${T.border}`, background: 'transparent', fontSize: 13, color: T.textMuted, cursor: 'pointer', fontFamily: 'inherit' }}>
          Sign out
        </button>
      </div>
    </div>
  )
}
