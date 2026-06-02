import { useState, useEffect } from 'react'
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

export default function Profile({ session }) {
  const [profile,      setProfile]      = useState(null)
  const [displayName,  setDisplayName]  = useState('')
  const [skinType,     setSkinType]     = useState('')
  const [skinGoals,    setSkinGoals]    = useState([])
  const [loading,      setLoading]      = useState(true)
  const [saving,       setSaving]       = useState(false)
  const [saved,        setSaved]        = useState(false)

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
      }
      setLoading(false)
    }
    load()
  }, [userId])

  async function handleSave() {
    setSaving(true)
    await supabase.from('profiles').upsert({
      id: userId,
      email,
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

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'inherit', color: T.textMuted, fontSize: 13 }}>
      Loading...
    </div>
  )

  return (
    <div style={{ fontFamily: 'inherit', minHeight: '100vh', background: T.cream, padding: '0 0 40px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 20px 16px', borderBottom: `0.5px solid ${T.border}`, background: T.white }}>
        <button
          onClick={() => window.location.href = '/routine'}
          style={{ border: `0.5px solid ${T.border}`, background: 'transparent', borderRadius: 8, padding: '5px 12px', cursor: 'pointer', fontSize: 15, color: T.text }}
        >←</button>
        <div style={{ fontSize: 15, fontWeight: 600, color: T.text }}>Profile</div>
      </div>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '24px 20px' }}>
        {/* Email — read only */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Email</div>
          <div style={{ fontSize: 13, color: T.textMuted, padding: '10px 12px', background: T.creamDark, borderRadius: 8, border: `0.5px solid ${T.border}` }}>{email}</div>
        </div>

        {/* Display name */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Display name</div>
          <input
            type="text"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            placeholder="Your name"
            style={{ width: '100%', fontSize: 13, padding: '10px 12px', border: `0.5px solid ${T.border}`, borderRadius: 8, background: T.white, color: T.text, boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' }}
          />
        </div>

        {/* Skin type */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Skin type</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {SKIN_TYPES.map(t => (
              <button key={t} onClick={() => setSkinType(t === skinType ? '' : t)} style={{
                padding: '6px 14px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
                border: `0.5px solid ${skinType === t ? T.pinkDeep : T.border}`,
                background: skinType === t ? T.pink : T.white,
                color: T.text,
              }}>{t}</button>
            ))}
          </div>
        </div>

        {/* Skin goals */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Skin goals</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {SKIN_GOALS.map(g => (
              <button key={g} onClick={() => toggleGoal(g)} style={{
                padding: '6px 14px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
                border: `0.5px solid ${skinGoals.includes(g) ? T.pinkDeep : T.border}`,
                background: skinGoals.includes(g) ? T.pink : T.white,
                color: T.text,
              }}>{g}</button>
            ))}
          </div>
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            width: '100%', padding: '12px', borderRadius: 10, border: 'none',
            background: saved ? '#4ADE80' : T.pinkDeep, color: saved ? '#14532D' : T.white,
            fontSize: 13, fontWeight: 600, cursor: saving ? 'default' : 'pointer',
            opacity: saving ? 0.7 : 1, transition: 'background 0.2s', fontFamily: 'inherit',
            marginBottom: 16,
          }}
        >
          {saved ? '✓ Saved' : saving ? 'Saving...' : 'Save profile'}
        </button>

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          style={{
            width: '100%', padding: '12px', borderRadius: 10,
            border: `0.5px solid ${T.border}`, background: 'transparent',
            fontSize: 13, color: T.textMuted, cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          Sign out
        </button>
      </div>
    </div>
  )
}
