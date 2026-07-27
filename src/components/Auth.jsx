import { useState } from 'react'
import { supabase } from '../lib/supabase'
import T from './theme'
import GlowUpLogo from './GlowUpWordmark'


const SKIN_TYPES = ['Dry', 'Oily', 'Combination', 'Normal', 'Sensitive', 'Not sure yet']
const HOW_HEARD  = ['Instagram', 'TikTok', 'Word of mouth', 'Melanie\'s portfolio', 'Twitter / X', 'Other']
const CHECK_COLORS = [T.pink, T.blue, T.green, T.yellow, T.orange]
const randomCheckColor = () => CHECK_COLORS[Math.floor(Math.random() * CHECK_COLORS.length)]

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
  const [betaColor, setBetaColor] = useState(randomCheckColor)
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

  function toggleBetaTester() {
    setBetaTester(v => !v)
    setBetaColor(randomCheckColor())
  }

  // ── Shared styles ─────────────────────────────────────────────────────────
  const btnStyle = (active = true) => ({
    width: '100%', padding: '13px', borderRadius: T.radius.pill, border: 'none',
    background: active ? T.text : '#EBFBF2',
    color: active ? T.white : T.text,
    fontSize: 14, fontWeight: 600, cursor: active ? 'pointer' : 'default',
    fontFamily: 'inherit', transition: 'opacity 0.15s',
    opacity: loading ? 0.7 : 1,
  })
  const pillStyle = (active) => ({
    padding: '7px 14px', borderRadius: T.radius.pill, fontSize: 12,
    cursor: 'pointer', fontFamily: 'inherit', border: 'none',
    background: active ? T.text : '#EBFBF2',
    color: active ? T.white : T.text,
  })

  return (
    <div style={{
      minHeight: '100vh', background: T.text,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px 20px', fontFamily: 'inherit',
    }}>
      <style>{`
        @keyframes glowupAuthFloat {
          0%, 100% { transform: translateY(-8px); }
          50%      { transform: translateY(8px); }
        }
        @media (prefers-reduced-motion: reduce) {
          .glowup-auth-logo { animation: none !important; }
        }
      `}</style>

      <div style={{ width: '100%', maxWidth: 400 }}>

        {/* Logo / wordmark — floats in white, like the load screen */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <GlowUpLogo size={40} className="glowup-auth-logo" style={{ display: 'inline-block', color: T.white, animation: 'glowupAuthFloat 3s cubic-bezier(0.445, 0.05, 0.55, 0.95) infinite' }} />
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 22 }}>
            Your skincare routine, organized.
          </div>
        </div>

        <div style={{
          background: T.white, borderRadius: 16, padding: '28px 24px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
        }}>

          {/* ── SCREEN: email ── */}
          {screen === 'email' && (
            <form onSubmit={handleEmailSubmit}>
              <div style={{ fontSize: 16, fontWeight: 600, color: T.text, marginBottom: 6 }}>
                Sign in or join the waitlist
              </div>
              <div style={{ fontSize: 13, color: T.textMuted, marginBottom: 20, lineHeight: 1.5 }}>
                Enter your email — we'll send a magic link if you're already approved, or add you to the waitlist if you're new here.
              </div>
              <input
                type="email" required autoFocus
                aria-label="Email address"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="gu-input"
                style={{ marginBottom: 12 }}
              />
              {errorMsg && (
                <div style={{ fontSize: 12, color: T.darkPink, marginBottom: 10 }}>{errorMsg}</div>
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

              <div style={{ fontSize: 11, color: T.text, marginBottom: 12, padding: '10px 12px', background: '#EBFBF2', borderRadius: 8 }}>
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
                <div style={{ fontSize: 12, color: T.darkPink, marginBottom: 10 }}>{errorMsg}</div>
              )}

              {/* Beta tester opt-in — checkbox reshuffles to a random color on every toggle */}
              <div onClick={toggleBetaTester} role="checkbox" aria-checked={betaTester} tabIndex={0}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleBetaTester() } }}
                style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', marginBottom: 20, padding: '12px', background: '#EBFBF2', borderRadius: 8, userSelect: 'none' }}>
                <div style={{ width: 18, height: 18, marginTop: 3, borderRadius: 5, border: '1.5px solid ' + (betaTester ? betaColor : T.text), background: betaTester ? betaColor : 'transparent', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {betaTester && (
                    <svg width="11" height="9" viewBox="0 0 11 9" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1 4L4 7.5L10 1" stroke={T.text} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <div style={{ fontSize: 12, color: T.textMuted, lineHeight: 1.7 }}>
                  <strong style={{ color: T.text }}>I'd like to be a beta tester</strong> — I'm happy to give feedback, try new features early, and help shape the app. No spam, just occasional check-ins.
                </div>
              </div>

              <button type="submit" disabled={loading} style={btnStyle(true)}>
                {loading ? 'Joining...' : 'Join the waitlist'}
              </button>

              <button type="button" onClick={() => setScreen('email')}
                style={{ marginTop: 10, width: '100%', padding: '10px', borderRadius: T.radius.pill, border: 'none', background: '#EBFBF2', color: T.text, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                ← Use a different email
              </button>
            </form>
          )}

          {/* ── SCREEN: joined waitlist ── */}
          {screen === 'joined' && (
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <div style={{ marginBottom: 12 }}>
                {alreadyOnList ? (
                  <svg width="32" height="32" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <g fill={T.text}>
                      <ellipse cx="12" cy="6" rx="3" ry="5" />
                      <ellipse cx="12" cy="6" rx="3" ry="5" transform="rotate(72 12 12)" />
                      <ellipse cx="12" cy="6" rx="3" ry="5" transform="rotate(144 12 12)" />
                      <ellipse cx="12" cy="6" rx="3" ry="5" transform="rotate(216 12 12)" />
                      <ellipse cx="12" cy="6" rx="3" ry="5" transform="rotate(288 12 12)" />
                    </g>
                  </svg>
                ) : (
                  <svg width="32" height="32" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2 L14.5 9.5 L22 12 L14.5 14.5 L12 22 L9.5 14.5 L2 12 L9.5 9.5 Z" fill={T.text} />
                  </svg>
                )}
              </div>
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
                style={{ ...btnStyle(false), marginTop: 20 }}>
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
                style={{ ...btnStyle(false), marginTop: 16 }}>
                Try a different email
              </button>
            </div>
          )}

        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 11, color: 'rgba(255,255,255,0.8)' }}>
          Your data is never sold. <span style={{ margin: '0 6px' }}>·</span>
          <a href="https://melanie.studio" style={{ color: 'inherit', textDecoration: 'underline' }}>melanie.studio</a>
        </div>
      </div>
    </div>
  )
}
