import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import GlowUpLogo from './GlowUpWordmark'
import SideMenu from './SideMenu'
import NotificationBell from './shared/NotificationBell'
import { supabase } from '../lib/supabase'
import Avatar from './Avatar'
import CropModal from './CropModal'
import BetaSurvey from './BetaSurvey'
import { detectTimezone, TIMEZONE_OPTIONS } from './timezone'
import T from './theme'
import { useAlert } from './shared/useConfirm'
import FeedbackPanel from './shared/FeedbackPanel'
import GlowUpFooter from './shared/GlowUpFooter'




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

const CHECK_COLORS = [T.pink, T.blue, T.green, T.yellow, T.orange]
const randomCheckColor = (exclude) => {
  const pool = exclude ? CHECK_COLORS.filter(c => c !== exclude) : CHECK_COLORS
  return pool[Math.floor(Math.random() * pool.length)]
}

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

// Unselected: neutral pill, no fill, black border. Selected: filled with
// whatever brand color the parent assigned it (reshuffled on each new
// selection — see randomCheckColor). Text stays black throughout since the
// brand palette is all light/mid pastels — white text on them would fail
// contrast.
function PillButton({ active, onClick, children, sub, color }) {
  return (
    <button onClick={onClick} style={{
      padding: sub ? '6px 12px' : '6px 14px',
      borderRadius: T.radius.pill, fontSize: 12, cursor: 'pointer',
      border: `1px solid ${active ? color : T.text}`,
      background: active ? color : 'transparent',
      color: T.text, fontFamily: 'inherit',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
    }}>
      <span>{children}</span>
      {sub && <span style={{ fontSize: 9, color: T.textMuted }}>{sub}</span>}
    </button>
  )
}

// Assigns each item in a multi-select list its own color, avoiding repeats
// between consecutive items — used both when the user adds a new chip and
// when restoring a previously-saved selection from Supabase on load.
function buildColorMap(list) {
  const map = {}
  let last = null
  for (const item of list) {
    const color = randomCheckColor(last)
    map[item] = color
    last = color
  }
  return map
}

// Custom checkbox that reshuffles to a random brand color every time it's toggled
function RandomCheckbox({ checked, color }) {
  return (
    <div style={{ width: 18, height: 18, marginTop: 2, borderRadius: 5, border: '1.5px solid ' + (checked ? color : T.text), background: checked ? color : 'transparent', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {checked && (
        <svg width="11" height="9" viewBox="0 0 11 9" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M1 4L4 7.5L10 1" stroke={T.text} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
    </div>
  )
}

export default function Profile({ session, onOpenSurvey }) {
  const navigate = useNavigate()
  const [alertDialog, alertUser] = useAlert()
  const [showSurvey, setShowSurvey] = useState(false)
  const [displayName,   setDisplayName]   = useState('')
  const [skinType,      setSkinType]      = useState('')
  const [skinGoals,     setSkinGoals]     = useState([])
  const [skinConcerns,  setSkinConcerns]  = useState([])
  const [fitzpatrick,   setFitzpatrick]   = useState(null)
  const [ageRange,      setAgeRange]      = useState('')
  const [retinoidExp,   setRetinoidExp]   = useState('')
  const [climate,       setClimate]       = useState('')
  // Random brand-color assignment for selection pills — one color per
  // single-select group, one color per selected item for multi-select
  // groups (so each chip keeps its own color as siblings are added/removed).
  const [ageRangeColor, setAgeRangeColor] = useState(randomCheckColor)
  const [skinTypeColor, setSkinTypeColor] = useState(randomCheckColor)
  const [retinoidColor, setRetinoidColor] = useState(randomCheckColor)
  const [climateColor,  setClimateColor]  = useState(randomCheckColor)
  const [fitzColor,     setFitzColor]     = useState(randomCheckColor)
  const [skinGoalColors,    setSkinGoalColors]    = useState({})
  const [skinConcernColors, setSkinConcernColors] = useState({})
  const [timezone,      setTimezone]      = useState(() => detectTimezone())
  const [betaTester,    setBetaTester]    = useState(false)
  const [betaColor,     setBetaColor]     = useState(randomCheckColor)
  const [savedBetaTester, setSavedBetaTester] = useState(false)
  const [newsletterOptIn, setNewsletterOptIn] = useState(false)
  const [newsletterColor, setNewsletterColor] = useState(randomCheckColor)
  const [avatarUrl,     setAvatarUrl]     = useState(null)
  const [cropSrc,       setCropSrc]       = useState(null)
  const [uploading,     setUploading]     = useState(false)
  const [loading,       setLoading]       = useState(true)
  const [saving,        setSaving]        = useState(false)
  const [saved,         setSaved]         = useState(false)
  const [showMenu,      setShowMenu]      = useState(false)
  const [showFeedback,  setShowFeedback]  = useState(false)
  const fileInputRef = useRef(null)

  const userId = session?.user?.id
  const email  = session?.user?.email || ''

  const [resetConfirm, setResetConfirm] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleteText, setDeleteText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [actionError, setActionError] = useState(null)

  async function resetRoutine() {
    setResetting(true)
    setActionError(null)
    try {
      const { data: ups } = await supabase.from('user_programs').select('id').eq('user_id', userId)
      const ids = (ups || []).map(u => u.id)
      if (ids.length) {
        await supabase.from('user_program_phase_history').delete().in('user_program_id', ids)
        await supabase.from('user_program_phase_selections').delete().in('user_program_id', ids)
      }
      await supabase.from('user_programs').delete().eq('user_id', userId)

      await supabase.from('routine_periods').delete().eq('user_id', userId)
      await supabase.from('extras_periods').delete().eq('user_id', userId)
      await supabase.from('shower_periods').delete().eq('user_id', userId)
      await supabase.from('treatments').delete().eq('user_id', userId)
      await supabase.from('custom_treatment_types').delete().eq('user_id', userId)

      await supabase.from('profiles').update({ recovery_routines: {} }).eq('id', userId)

      setResetConfirm(false)
      window.location.href = '/routine'
    } catch (err) {
      setActionError(err.message)
    } finally {
      setResetting(false)
    }
  }

  async function deleteAccount() {
    setDeleting(true)
    setActionError(null)
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData?.session?.access_token
      const res = await fetch(`${SUPABASE_URL}/functions/v1/delete-account`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to delete account')

      await supabase.auth.signOut()
      window.location.href = '/'
    } catch (err) {
      setActionError(err.message)
      setDeleting(false)
    }
  }


  useEffect(() => {
    if (!resetConfirm && !deleteConfirm) return
    function handleKey(e) {
      if (e.key !== 'Escape') return
      if (resetConfirm && !resetting) setResetConfirm(false)
      if (deleteConfirm && !deleting) setDeleteConfirm(false)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [resetConfirm, deleteConfirm, resetting, deleting])

  useEffect(() => {
    if (!userId) return
    supabase.from('profiles').select('*').eq('id', userId).single()
      .then(({ data }) => {
        if (data) {
          setDisplayName(data.display_name || '')
          setSkinType(data.skin_type || '')
          setSkinGoals(data.skin_goals || [])
          setSkinGoalColors(buildColorMap(data.skin_goals || []))
          setSkinConcerns(data.skin_concerns || [])
          setSkinConcernColors(buildColorMap(data.skin_concerns || []))
          setFitzpatrick(data.fitzpatrick || null)
          setAgeRange(data.age_range || '')
          setRetinoidExp(data.retinoid_experience || '')
          setTimezone(data.timezone || detectTimezone())
          setBetaTester(data.beta_tester || false)
          setSavedBetaTester(data.beta_tester || false)
          setClimate(data.climate || '')
          if (data.avatar_url) setAvatarUrl(data.avatar_url)
          setNewsletterOptIn(data.newsletter_opt_in || false)
        }
        setLoading(false)
      })
  }, [userId])

  async function handleAvatarUpload(e) {
    const file = e.target.files?.[0]
    if (!file || !userId) return
    if (!file.type.startsWith('image/')) return
    if (file.size > 10 * 1024 * 1024) { await alertUser('Photo must be under 10MB'); return }
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
      await alertUser('Upload failed — please try again')
    } finally {
      setUploading(false)
    }
  }

  function handleCropCancel() {
    if (cropSrc) URL.revokeObjectURL(cropSrc)
    setCropSrc(null)
  }

  // Single-select pill group: picks a fresh random color (never the one it
  // just had) whenever the selection changes.
  function selectSingle(current, setCurrent, setColor, val) {
    if (current === val) { setCurrent(''); return }
    setColor(prev => randomCheckColor(prev))
    setCurrent(val)
  }

  // Multi-select pill group: each newly-selected chip gets its own color,
  // chosen to avoid repeating the color of the most recently added chip.
  function toggleMulti(list, setList, colors, setColors, val) {
    if (list.includes(val)) {
      setList(list.filter(x => x !== val))
      return
    }
    const lastColor = list.length ? colors[list[list.length - 1]] : null
    setColors({ ...colors, [val]: randomCheckColor(lastColor) })
    setList([...list, val])
  }

  function toggleBetaTester() {
    setBetaTester(v => !v)
    setBetaColor(randomCheckColor())
  }

  function toggleNewsletter() {
    setNewsletterOptIn(v => !v)
    setNewsletterColor(randomCheckColor())
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
      timezone:            timezone || null,
      beta_tester:         betaTester,
      newsletter_opt_in:   newsletterOptIn,
      updated_at:          new Date().toISOString(),
    })
    setSaving(false)
    setSaved(true)
    setSavedBetaTester(betaTester)
    setTimeout(() => setSaved(false), 2000)
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'inherit', color: T.textMuted, fontSize: 13 }}>
      Loading...
    </div>
  )

  return (
    <>
    <div style={{ fontFamily: 'inherit', minHeight: '100vh', background: T.white, display: 'flex', flexDirection: 'column' }}>
      {cropSrc && (
        <CropModal imageSrc={cropSrc} onConfirm={handleCropConfirm} onCancel={handleCropCancel} uploading={uploading} />
      )}

      {/* Header — logo centered (matching the calendar page), arrow stays
          left, so the wordmark reads as the app's anchor point on every
          page instead of only the home screen. */}
      <div style={{ background: T.text, position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px 10px' }}>
          <a href="/routine" aria-label="Back to calendar" style={{ border: 'none', background: 'transparent', borderRadius: T.radius.pill, padding: '5px 12px', cursor: 'pointer', fontSize: 15, color: T.white, textDecoration: 'none', display: 'inline-block' }}>←</a>
          <a href="/routine" style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', display: 'flex', alignItems: 'baseline', textDecoration: 'none' }}>
            <GlowUpLogo size={32} style={{ color: T.white }} />
          </a>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <NotificationBell session={session} />
            <button onClick={() => setShowMenu(true)}
              style={{ border: 'none', background: 'transparent', borderRadius: T.radius.pill, padding: '5px 10px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'center', justifyContent: 'center', width: 36, height: 32 }}>
              <span style={{ display: 'block', width: 14, height: 1.5, background: T.white }} />
              <span style={{ display: 'block', width: 14, height: 1.5, background: T.white }} />
              <span style={{ display: 'block', width: 14, height: 1.5, background: T.white }} />
            </button>
          </div>
          {showMenu && (
            <SideMenu session={session} onClose={() => setShowMenu(false)} betaTester={betaTester}
              onFeedback={() => { setShowMenu(false); setShowFeedback(true) }} />
          )}
          {showFeedback && <FeedbackPanel onClose={() => setShowFeedback(false)} />}
        </div>
        <div style={{ padding: '0 20px 14px' }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: T.white }}>Account &amp; settings</div>
        </div>
      </div>

      <div style={{ width: '100%', maxWidth: 480, margin: '0 auto', padding: '24px 20px', boxSizing: 'border-box' }}>

        {/* Avatar */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 28 }}>
          <div style={{ position: 'relative', width: 88, height: 88 }}>
            <Avatar avatarUrl={avatarUrl} displayName={displayName} email={email} size={88}
              onClick={() => !uploading && fileInputRef.current?.click()}
              style={{ opacity: uploading ? 0.6 : 1, transition: 'opacity 0.2s', cursor: uploading ? 'default' : 'pointer', border: 'none' }} />
            {!uploading && (
              <div onClick={() => fileInputRef.current?.click()} aria-hidden="true"
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

        {/* Display name */}
        <div style={{ marginBottom: 20 }}>
          <SectionLabel>Display name</SectionLabel>
          <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Your name"
            style={{ width: '100%', fontSize: 13, padding: '10px 14px', border: `1px solid ${T.hairline}`, borderRadius: T.radius.pill, background: T.white, color: T.text, boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' }} />
        </div>

        {/* Email */}
        <div style={{ marginBottom: 24 }}>
          <SectionLabel>Email</SectionLabel>
          <div style={{ fontSize: 13, color: T.textLight, padding: '10px 14px', border: `1px solid ${T.hairline}`, borderRadius: T.radius.pill, background: T.white, boxSizing: 'border-box' }}>{email}</div>
        </div>

        <div style={{ height: 1, background: 'rgba(0,0,0,0.08)', marginBottom: 24 }} />

        {/* Fitzpatrick skin tone */}
        <div style={{ marginBottom: 24 }}>
          <SectionLabel>Skin tone <OptionalTag /></SectionLabel>
          <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 10, lineHeight: 1.5 }}>
            Fitzpatrick scale — helps us understand how products work across different melanin levels.
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {FITZPATRICK.map(f => (
              <button key={f.n} onClick={() => {
                  if (fitzpatrick === f.n) { setFitzpatrick(null); return }
                  setFitzColor(prev => randomCheckColor(prev))
                  setFitzpatrick(f.n)
                }}
                title={`${f.label} — ${f.sub}`}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  padding: '8px 10px', borderRadius: T.radius.card, cursor: 'pointer', fontFamily: 'inherit',
                  border: `2px solid ${fitzpatrick === f.n ? fitzColor : T.text}`,
                  background: 'transparent',
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
              <PillButton key={a} active={ageRange === a} color={ageRangeColor}
                onClick={() => selectSingle(ageRange, setAgeRange, setAgeRangeColor, a)}>{a}</PillButton>
            ))}
          </div>
        </div>

        {/* Skin type */}
        <div style={{ marginBottom: 24 }}>
          <SectionLabel>Skin type <OptionalTag /></SectionLabel>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {SKIN_TYPES.map(t => (
              <PillButton key={t} active={skinType === t} color={skinTypeColor}
                onClick={() => selectSingle(skinType, setSkinType, setSkinTypeColor, t)}>{t}</PillButton>
            ))}
          </div>
        </div>

        {/* Skin goals */}
        <div style={{ marginBottom: 24 }}>
          <SectionLabel>What I'm working toward <OptionalTag /></SectionLabel>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {SKIN_GOALS.map(g => (
              <PillButton key={g} active={skinGoals.includes(g)} color={skinGoalColors[g]}
                onClick={() => toggleMulti(skinGoals, setSkinGoals, skinGoalColors, setSkinGoalColors, g)}>{g}</PillButton>
            ))}
          </div>
        </div>

        {/* Specific concerns */}
        <div style={{ marginBottom: 24 }}>
          <SectionLabel>What I'm managing <OptionalTag /></SectionLabel>

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {SKIN_CONCERNS.map(c => (
              <PillButton key={c} active={skinConcerns.includes(c)} color={skinConcernColors[c]}
                onClick={() => toggleMulti(skinConcerns, setSkinConcerns, skinConcernColors, setSkinConcernColors, c)}>{c}</PillButton>
            ))}
          </div>
        </div>

        {/* Retinoid experience */}
        <div style={{ marginBottom: 24 }}>
          <SectionLabel>Retinoid experience <OptionalTag /></SectionLabel>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {RETINOID_LEVELS.map(r => (
              <PillButton key={r.key} active={retinoidExp === r.key} sub={r.sub} color={retinoidColor}
                onClick={() => selectSingle(retinoidExp, setRetinoidExp, setRetinoidColor, r.key)}>
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
              <PillButton key={c} active={climate === c} color={climateColor}
                onClick={() => selectSingle(climate, setClimate, setClimateColor, c)}>{c}</PillButton>
            ))}
          </div>
        </div>

        {/* Timezone */}
        <div style={{ marginBottom: 24, padding: '14px 16px', background: 'transparent', border: `1px solid ${T.text}`, borderRadius: T.radius.card }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 4 }}>Time zone</div>
          <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 12, lineHeight: 1.6 }}>
            Used to determine what day it is for your calendar — important if you use the app near midnight.
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <select
              value={timezone}
              onChange={e => setTimezone(e.target.value)}
              style={{ flex: 1, minWidth: 0, fontSize: 12, padding: '8px 14px', border: 'none', borderRadius: T.radius.pill, background: T.white, color: T.text, fontFamily: 'inherit', cursor: 'pointer' }}
            >
              {TIMEZONE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
              {/* Show current value even if not in the list */}
              {timezone && !TIMEZONE_OPTIONS.find(o => o.value === timezone) && (
                <option value={timezone}>{timezone}</option>
              )}
            </select>
            <button
              onClick={() => setTimezone(detectTimezone())}
              style={{ padding: '8px 14px', borderRadius: T.radius.pill, border: `1px solid ${T.text}`, background: T.white, color: T.text, cursor: 'pointer', fontSize: 11, fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
              Auto-detect
            </button>
          </div>
          {timezone && (
            <div style={{ fontSize: 10, color: T.textMuted, marginTop: 8 }}>
              Currently: {timezone} — today is {new Intl.DateTimeFormat('en-US', { timeZone: timezone, weekday: 'short', month: 'short', day: 'numeric' }).format(new Date())}
            </div>
          )}
        </div>

        {/* Newsletter opt-in */}
        <div style={{ marginBottom: 24, padding: '14px 16px', background: 'transparent', border: `1px solid ${T.text}`, borderRadius: T.radius.card }}>
          <div onClick={toggleNewsletter} role="checkbox" aria-checked={newsletterOptIn} tabIndex={0}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleNewsletter() } }}
            style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer', userSelect: 'none' }}>
            <RandomCheckbox checked={newsletterOptIn} color={newsletterColor} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 3 }}>
                Subscribe to the newsletter
              </div>
              <div style={{ fontSize: 11, color: T.textMuted, lineHeight: 1.5 }}>
                Occasional updates on new products, routine tips, and what we're loving. No spam, unsubscribe any time.
              </div>
            </div>
          </div>
        </div>

        {/* Privacy note */}
        <div style={{ fontSize: 11, color: T.textLight, lineHeight: 1.6, padding: '12px 14px', background: 'transparent', borderRadius: T.radius.card, marginBottom: 20 }}>
          Your data is never sold or shared. Optional fields help us understand which products work best for different skin tones, types, and concerns — so recommendations get better for everyone.
        </div>

        {/* Beta tester + feedback */}
        <div style={{ borderTop: '1px solid rgba(0,0,0,0.08)', paddingTop: 16, marginBottom: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
            Beta program
          </div>
          <div onClick={toggleBetaTester} role="checkbox" aria-checked={betaTester} tabIndex={0}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleBetaTester() } }}
            style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', marginBottom: 14, userSelect: 'none' }}>
            <RandomCheckbox checked={betaTester} color={betaColor} />
            <div style={{ fontSize: 12, color: T.textMuted, lineHeight: 1.7 }}>
              <strong style={{ color: T.text }}>I'm interested in being a beta tester</strong> — you may hear from us about new features, early previews, and occasional check-ins. No spam, ever.
            </div>
          </div>
          {savedBetaTester && (
            <button onClick={() => setShowSurvey(true)}
              style={{ fontSize: 12, color: T.darkGreen, fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>
              Share feedback about the app →
            </button>
          )}
        </div>

        {/* Save — sits close under Beta program (the last field it covers)
            with extra breathing room below, so it reads as the button for
            everything above rather than being paired with Export next. */}
        <button onClick={handleSave} disabled={saving}
          style={{ width: '100%', padding: '13px', borderRadius: T.radius.pill, border: 'none', background: T.text, color: T.white, fontSize: 13, fontWeight: 600, cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.7 : 1, transition: 'opacity 0.2s', fontFamily: 'inherit', marginBottom: 36 }}>
          {saved ? '✓ Saved' : saving ? 'Saving...' : 'Save profile'}
        </button>

        {/* Export */}
        <div style={{ borderTop: '1px solid rgba(0,0,0,0.08)', paddingTop: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
            Export
          </div>
          <div style={{ fontSize: 12, color: T.textMuted, lineHeight: 1.7, marginBottom: 12 }}>
            Export your routine as a calendar file (.ics) to add to Apple Calendar, Google Calendar, or any other calendar app.
          </div>
          <a href="/routine?export=1"
            style={{ display: 'inline-block', padding: '9px 18px', borderRadius: T.radius.pill, border: 'none', background: T.text, color: T.white, fontSize: 12, fontFamily: 'inherit', cursor: 'pointer', textDecoration: 'none' }}>
            Open export options →
          </a>
        </div>

        {/* Danger zone */}
        <div style={{ borderTop: '1px solid rgba(0,0,0,0.08)', paddingTop: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
            Account
          </div>

          {actionError && (
            <div style={{ fontSize: 12, color: T.darkPink, marginBottom: 10 }}>{actionError}</div>
          )}

          <button onClick={() => setResetConfirm(true)}
            style={{ width: '100%', padding: '11px', borderRadius: T.radius.pill, border: 'none', background: T.text, fontSize: 13, color: T.white, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 8 }}>
            Reset my routine
          </button>
          <div style={{ fontSize: 11, color: T.textMuted, lineHeight: 1.6, marginBottom: 16 }}>
            Clears your routine, treatments, and program enrollment so you can start onboarding fresh. Your products and profile info stay.
          </div>

          <button onClick={() => setDeleteConfirm(true)}
            style={{ width: '100%', padding: '11px', borderRadius: T.radius.pill, border: 'none', background: T.recovery.bg, color: T.darkPink, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, marginBottom: 8 }}>
            Delete my account
          </button>
          <div style={{ fontSize: 11, color: T.textMuted, lineHeight: 1.6 }}>
            Permanently deletes your account and all your data — routine, treatments, products, profile. This cannot be undone. We keep a record that an account existed and was deleted, with no personal information, for legal purposes only.
          </div>
        </div>

        {/* Reset confirmation modal */}
        {resetConfirm && (
          <div onClick={() => !resetting && setResetConfirm(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="reset-routine-title" style={{ background: T.white, borderRadius: T.radius.modal, boxShadow: '0 8px 32px rgba(0,0,0,0.15)', width: '100%', maxWidth: 400, padding: '24px 20px' }}>
              <h3 id="reset-routine-title" style={{ fontSize: 16, fontWeight: 700, color: T.text, margin: '0 0 10px' }}>Reset your routine?</h3>
              <p style={{ fontSize: 13, color: T.textMuted, lineHeight: 1.7, margin: '0 0 20px' }}>
                This deletes your routine, treatments, and program progress so you can go through onboarding again. Your products and profile info are kept. This can't be undone.
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setResetConfirm(false)} disabled={resetting}
                  style={{ flex: 1, padding: '10px', borderRadius: T.radius.pill, border: `1px solid ${T.text}`, background: 'transparent', color: T.text, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>
                  Cancel
                </button>
                <button onClick={resetRoutine} disabled={resetting}
                  style={{ flex: 1, padding: '10px', borderRadius: T.radius.pill, border: 'none', background: T.darkPink, color: '#fff', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', fontWeight: 600 }}>
                  {resetting ? 'Resetting…' : 'Reset routine'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete account confirmation modal */}
        {deleteConfirm && (
          <div onClick={() => !deleting && setDeleteConfirm(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="delete-account-title" style={{ background: T.white, borderRadius: T.radius.modal, boxShadow: '0 8px 32px rgba(0,0,0,0.15)', width: '100%', maxWidth: 400, padding: '24px 20px' }}>
              <h3 id="delete-account-title" style={{ fontSize: 16, fontWeight: 700, color: T.darkPink, margin: '0 0 10px' }}>Delete your account?</h3>
              <p style={{ fontSize: 13, color: T.textMuted, lineHeight: 1.7, margin: '0 0 16px' }}>
                This permanently deletes your account and everything in it — routine, treatments, products, profile. This cannot be undone.
              </p>
              <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 6 }}>Type DELETE to confirm</div>
              <input value={deleteText} onChange={e => setDeleteText(e.target.value)}
                aria-label="Type DELETE to confirm"
                style={{ width: '100%', boxSizing: 'border-box', fontSize: 13, padding: '8px 14px', border: '1px solid rgba(0,0,0,0.15)', borderRadius: T.radius.pill, background: T.white, color: T.text, fontFamily: 'inherit', outline: 'none', marginBottom: 20 }} />
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => { setDeleteConfirm(false); setDeleteText('') }} disabled={deleting}
                  style={{ flex: 1, padding: '10px', borderRadius: T.radius.pill, border: `1px solid ${T.text}`, background: 'transparent', color: T.text, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>
                  Cancel
                </button>
                <button onClick={deleteAccount} disabled={deleting || deleteText !== 'DELETE'}
                  style={{ flex: 1, padding: '10px', borderRadius: T.radius.pill, border: 'none', background: deleteText === 'DELETE' ? T.darkPink : 'rgba(0,0,0,0.15)', color: '#fff', cursor: deleteText === 'DELETE' ? 'pointer' : 'default', fontSize: 13, fontFamily: 'inherit', fontWeight: 600 }}>
                  {deleting ? 'Deleting…' : 'Delete account'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Sign out */}
        <button onClick={async () => { await supabase.auth.signOut(); window.location.href = '/routine' }}
          style={{ width: '100%', padding: '12px', borderRadius: T.radius.pill, border: 'none', background: T.text, fontSize: 13, color: T.white, cursor: 'pointer', fontFamily: 'inherit' }}>
          Sign out
        </button>
      </div>
    </div>
    <GlowUpFooter onFeedback={() => setShowFeedback(true)} betaTester={betaTester} />
    {showSurvey && (
      <BetaSurvey
        session={session}
        onClose={() => setShowSurvey(false)}
        onSubmitted={() => setShowSurvey(false)}
        betaTester={true}
        alreadySubmitted={false}
      />
    )}
    {alertDialog}
    </>
  )
}
