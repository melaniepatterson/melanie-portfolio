import { useState } from 'react'
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
}

const SKIN_TYPES = ['Dry', 'Oily', 'Combination', 'Normal', 'Sensitive', 'Not sure yet']
const HOW_HEARD  = ['Instagram', 'TikTok', 'Word of mouth', 'Melanie\'s portfolio', 'Twitter / X', 'Other']

// ── Screens ──────────────────────────────────────────────────────────────────
// 'email'     → enter email
// 'waitlist'  → fill out waitlist form (not approved)
// 'joined'    → waitlist confirmation
// 'check'     → magic link sent
// 'error'     → something went wrong

export default function Auth() {
  const [screen,    setScreen]    = useState('email')
  const [email,     setEmail]     = useState('')
  const [skinType,  setSkinType]  = useState('')
  const [howHeard,  setHowHeard]  = useState('')
  const [betaTester, setBetaTester] = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [errorMsg,  setErrorMsg]  = useState('')
  const [alreadyOnList, setAlreadyOnList] = useState(false)

  // ── Stage 1: check approval then send magic link or show waitlist ─────────
  async function handleEmailSubmit(e) {
    e.preventDefault()
    const trimmed = email.trim().toLowerCase()
    if (!trimmed) return
    setLoading(true)
    setErrorMsg('')
    try {
      // Check if email is approved
      const { data, error } = await supabase
        .from('approved_emails')
        .select('id')
        .eq('email', trimmed)
        .maybeSingle()

      if (error) throw error

      if (data) {
        // Approved → send magic link
        const { error: otpError } = await supabase.auth.signInWithOtp({
          email: trimmed,
          options: { emailRedirectTo: window.location.origin + '/routine' },
        })
        if (otpError) throw otpError
        setScreen('check')
      } else {
        // Not approved → show waitlist form
        setEmail(trimmed)
        setScreen('waitlist')
      }
    } catch (err) {
      setErrorMsg(err?.message || err?.error_description || JSON.stringify(err) || 'Something went wrong. Please try again.')
      console.error('Auth error:', JSON.stringify(err))
    } finally {
      setLoading(false)
    }
  }

  // ── Stage 2: join waitlist ────────────────────────────────────────────────
  async function handleWaitlistSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')
    try {
      const { data: result, error } = await supabase.rpc('join_waitlist', {
        p_email: email,
        p_skin_type: skinType || null,
        p_how_heard: howHeard || null,
        p_beta_tester: betaTester,
      })
      if (error) throw error
      console.log('join_waitlist returned:', result, typeof result)
      // 0 = already existed, 1 = newly added
      setAlreadyOnList(result === 0 || result === '0')
      setScreen('joined')
    } catch (err) {
      setErrorMsg(err?.message || err?.error_description || JSON.stringify(err) || 'Something went wrong — please try again.')
      console.error('Waitlist error:', JSON.stringify(err))
    } finally {
      setLoading(false)
    }
  }

  // ── Shared styles ─────────────────────────────────────────────────────────
  const inputStyle = {
    width: '100%', fontSize: 14, padding: '12px 14px',
    border: `0.5px solid ${T.border}`, borderRadius: 10,
    background: T.white, color: T.text, boxSizing: 'border-box',
    outline: 'none', fontFamily: 'inherit',
  }
  const btnStyle = (active = true) => ({
    width: '100%', padding: '13px', borderRadius: 10, border: 'none',
    background: active ? T.pinkDeep : T.creamDark,
    color: active ? '#fff' : T.textMuted,
    fontSize: 14, fontWeight: 600, cursor: active ? 'pointer' : 'default',
    fontFamily: 'inherit', transition: 'opacity 0.15s',
    opacity: loading ? 0.7 : 1,
  })
  const pillStyle = (active) => ({
    padding: '7px 14px', borderRadius: 20, fontSize: 12,
    cursor: 'pointer', fontFamily: 'inherit',
    border: `0.5px solid ${active ? T.pinkDeep : T.border}`,
    background: active ? T.pink : T.white,
    color: T.text,
  })

  return (
    <div style={{
      minHeight: '100vh', background: T.cream,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px 20px', fontFamily: 'inherit',
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>

        {/* Logo / wordmark */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: T.text, letterSpacing: '-0.02em' }}>
            Glow Up
          </div>
          <div style={{ fontSize: 12, color: T.textMuted, marginTop: 4 }}>
            Your skincare routine, organized.
          </div>
        </div>

        <div style={{
          background: T.white, borderRadius: 16, padding: '28px 24px',
          border: `0.5px solid ${T.border}`,
        }}>

          {/* ── SCREEN: email ── */}
          {screen === 'email' && (
            <form onSubmit={handleEmailSubmit}>
              <div style={{ fontSize: 16, fontWeight: 600, color: T.text, marginBottom: 6 }}>
                Sign in
              </div>
              <div style={{ fontSize: 13, color: T.textMuted, marginBottom: 20, lineHeight: 1.5 }}>
                Enter your email and we'll send you a magic link — no password needed.
              </div>
              <input
                type="email" required autoFocus
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{ ...inputStyle, marginBottom: 12 }}
              />
              {errorMsg && (
                <div style={{ fontSize: 12, color: T.pinkDeep, marginBottom: 10 }}>{errorMsg}</div>
              )}
              <button type="submit" disabled={loading || !email.trim()} style={btnStyle(!!email.trim())}>
                {loading ? 'Checking...' : 'Continue →'}
              </button>
            </form>
          )}

          {/* ── SCREEN: waitlist form ── */}
          {screen === 'waitlist' && (
            <form onSubmit={handleWaitlistSubmit}>
              <div style={{ fontSize: 16, fontWeight: 600, color: T.text, marginBottom: 6 }}>
                You're almost in
              </div>
              <div style={{ fontSize: 13, color: T.textMuted, marginBottom: 20, lineHeight: 1.5 }}>
                Glow Up is in private beta. Add yourself to the waitlist and we'll reach out when your spot is ready.
              </div>

              <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 12, padding: '10px 12px', background: T.creamDark, borderRadius: 8, border: `0.5px solid ${T.border}` }}>
                {email}
              </div>

              {/* Skin type */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                  Your skin type <span style={{ fontWeight: 400, color: T.textLight }}>(optional)</span>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {SKIN_TYPES.map(t => (
                    <button key={t} type="button"
                      onClick={() => setSkinType(skinType === t ? '' : t)}
                      style={pillStyle(skinType === t)}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* How heard */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                  How did you hear about us? <span style={{ fontWeight: 400, color: T.textLight }}>(optional)</span>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {HOW_HEARD.map(h => (
                    <button key={h} type="button"
                      onClick={() => setHowHeard(howHeard === h ? '' : h)}
                      style={pillStyle(howHeard === h)}>
                      {h}
                    </button>
                  ))}
                </div>
              </div>

              {errorMsg && (
                <div style={{ fontSize: 12, color: T.pinkDeep, marginBottom: 10 }}>{errorMsg}</div>
              )}

              {/* Beta tester opt-in */}
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', marginBottom: 20, padding: '12px', background: T.creamDark, borderRadius: 8, border: `0.5px solid ${T.border}` }}>
                <input type="checkbox" checked={betaTester} onChange={e => setBetaTester(e.target.checked)}
                  style={{ marginTop: 3, accentColor: T.pinkDeep, flexShrink: 0 }} />
                <div style={{ fontSize: 12, color: T.textMuted, lineHeight: 1.7 }}>
                  <strong style={{ color: T.text }}>I'd like to be a beta tester</strong> — I'm happy to give feedback, try new features early, and help shape the app. No spam, just occasional check-ins.
                </div>
              </label>

              <button type="submit" disabled={loading} style={btnStyle(true)}>
                {loading ? 'Joining...' : 'Join the waitlist'}
              </button>

              <button type="button" onClick={() => setScreen('email')}
                style={{ marginTop: 10, width: '100%', padding: '10px', borderRadius: 10, border: `0.5px solid ${T.border}`, background: 'transparent', color: T.textMuted, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                ← Use a different email
              </button>
            </form>
          )}

          {/* ── SCREEN: joined waitlist ── */}
          {screen === 'joined' && (
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>{alreadyOnList ? '🌸' : '✨'}</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: T.text, marginBottom: 8 }}>
                {alreadyOnList ? "You're already on the list" : "You're on the list"}
              </div>
              <div style={{ fontSize: 13, color: T.textMuted, lineHeight: 1.6 }}>
                {alreadyOnList
                  ? <>We already have <strong style={{ color: T.text }}>{email}</strong> saved. We haven't forgotten you — we'll reach out as soon as your spot is ready.</>
                  : <>We'll reach out to <strong style={{ color: T.text }}>{email}</strong> when your spot is ready. Thanks for your interest — we can't wait to have you.</>
                }
              </div>
              <button onClick={() => { setScreen('email'); setEmail('') }}
                style={{ ...btnStyle(false), marginTop: 20, color: T.textMuted }}>
                Back
              </button>
            </div>
          )}

          {/* ── SCREEN: check email ── */}
          {screen === 'check' && (
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>📬</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: T.text, marginBottom: 8 }}>
                Check your email
              </div>
              <div style={{ fontSize: 13, color: T.textMuted, lineHeight: 1.6 }}>
                We sent a magic link to <strong style={{ color: T.text }}>{email}</strong>. Click the link in that email to sign in — it expires in 1 hour.
              </div>
              <div style={{ fontSize: 11, color: T.textLight, marginTop: 16 }}>
                No email? Check your spam folder or try again below.
              </div>
              <button onClick={() => setScreen('email')}
                style={{ ...btnStyle(false), marginTop: 16, color: T.textMuted }}>
                Try a different email
              </button>
            </div>
          )}

        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 11, color: T.textLight }}>
          Your data is never sold. <span style={{ margin: '0 6px' }}>·</span> Glow Up by Melanie
        </div>
      </div>
    </div>
  )
}
