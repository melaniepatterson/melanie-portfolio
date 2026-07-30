import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import T from './theme'

const CHECK_COLORS = [T.pink, T.blue, T.green, T.yellow, T.orange]
const randomCheckColor = () => CHECK_COLORS[Math.floor(Math.random() * CHECK_COLORS.length)]

// Plain × — no circle background, matching the day-flyout close button
// (the one consistent close-button style used across the app).
function CloseButton({ onClose }) {
  return (
    <button onClick={onClose} aria-label="Close"
      style={{ position: 'fixed', top: 20, right: 20, zIndex: 810, border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 22, color: T.white, opacity: 0.85, lineHeight: 1, fontFamily: 'inherit', padding: '0 2px' }}>
      ×
    </button>
  )
}

// Escape closes the survey overlay, matching native dialog behavior
function useEscapeToClose(onClose) {
  useEffect(() => {
    function handleKey(e) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])
}

function StarRow({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} onClick={() => onChange(n)}
          style={{ width: 36, height: 36, borderRadius: T.radius.pill, border: 'none', background: n <= value ? T.white : 'rgba(255,255,255,0.15)', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: n <= value ? T.darkPink : T.white, fontFamily: 'inherit' }}>
          {n}
        </button>
      ))}
      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', marginLeft: 6 }}>
        {value === 1 ? 'Really hard' : value === 2 ? 'Tricky' : value === 3 ? 'Okay' : value === 4 ? 'Pretty easy' : value === 5 ? 'Super easy' : ''}
      </span>
    </div>
  )
}

function PillRow({ options, value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {options.map(o => (
        <button key={o.value} onClick={() => onChange(o.value)}
          style={{ padding: '7px 14px', borderRadius: T.radius.pill, border: 'none', background: value === o.value ? T.white : 'rgba(255,255,255,0.15)', color: value === o.value ? T.darkPink : T.white, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

// Custom checkbox that reshuffles to a random brand color every time it's toggled
function RandomCheckbox({ checked, color }) {
  return (
    <div style={{ width: 18, height: 18, marginTop: 2, borderRadius: 5, border: '1.5px solid ' + (checked ? color : T.white), background: checked ? color : 'transparent', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {checked && (
        <svg width="11" height="9" viewBox="0 0 11 9" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M1 4L4 7.5L10 1" stroke={T.text} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
    </div>
  )
}

export default function BetaSurvey({ session, onClose, onSubmitted, betaTester, alreadySubmitted }) {
  const [setupEase,       setSetupEase]       = useState(0)
  const [changedThinking, setChangedThinking] = useState('')
  const [missing,         setMissing]         = useState('')
  const [pacing,          setPacing]          = useState('')
  const [tellFriend,      setTellFriend]      = useState('')
  const [anonymous,       setAnonymous]       = useState(false)
  const [anonymousColor,  setAnonymousColor]  = useState(randomCheckColor)
  const [submitting,      setSubmitting]      = useState(false)
  const [error,           setError]           = useState('')

  const canSubmit = setupEase > 0 && changedThinking && tellFriend.trim().length > 0

  function toggleAnonymous() {
    setAnonymous(v => !v)
    setAnonymousColor(randomCheckColor())
  }

  async function handleSubmit() {
    if (!canSubmit) { setError('Please answer all required questions.'); return }
    setSubmitting(true)
    setError('')
    const row = {
      user_id:          anonymous ? null : session?.user?.id,
      setup_ease:       setupEase,
      changed_thinking: changedThinking,
      missing_feature:  missing.trim() || null,
      program_pacing:   pacing || 'na',
      tell_a_friend:    tellFriend.trim(),
      anonymous,
    }
    const { error: err } = await supabase.from('beta_survey').insert(row)
    if (err) { setError('Something went wrong — please try again.'); setSubmitting(false); return }

    // Mark profile as submitted
    if (session?.user?.id) {
      await supabase.from('profiles')
        .update({ survey_submitted_at: new Date().toISOString() })
        .eq('id', session.user.id)
    }
    setSubmitting(false)
    onSubmitted()
  }

  useEscapeToClose(onClose)

  if (!betaTester) return null

  const textareaStyle = { width: '100%', boxSizing: 'border-box', fontSize: 12, padding: '10px 14px', border: 'none', borderRadius: T.radius.card, background: T.white, color: T.text, fontFamily: 'inherit', resize: 'vertical', outline: 'none', lineHeight: 1.6 }

  // Already submitted — show thank you instead of form
  if (alreadySubmitted) return (
    <div role="dialog" aria-modal="true" aria-labelledby="beta-survey-done-title" style={{ position: 'fixed', inset: 0, background: T.darkPink, zIndex: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, overflowY: 'auto' }}>
      <CloseButton onClose={onClose} />
      <div style={{ width: '100%', maxWidth: 420, textAlign: 'center' }}>
        <div id="beta-survey-done-title" style={{ fontSize: 18, fontWeight: 700, color: T.white, marginBottom: 8 }}>You've already shared feedback</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 1.7, marginBottom: 24 }}>Thank you — your response is in and we've read it. We'll be in touch if we have follow-up questions.</div>
        <button onClick={onClose}
          style={{ padding: '10px 24px', borderRadius: T.radius.pill, border: 'none', background: T.white, color: T.darkPink, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', fontWeight: 600 }}>
          Close
        </button>
      </div>
    </div>
  )

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="beta-survey-title" style={{ position: 'fixed', inset: 0, background: T.darkPink, zIndex: 800, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
      <CloseButton onClose={onClose} />
      <div style={{ width: '100%', maxWidth: 500, margin: '0 auto', padding: '64px 20px 48px', boxSizing: 'border-box' }}>

        {/* Header */}
        <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.75)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Beta feedback</div>
        <div id="beta-survey-title" style={{ fontSize: 20, fontWeight: 800, color: T.white, letterSpacing: '-0.03em', marginBottom: 6 }}>How's it going so far?</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', lineHeight: 1.7, marginBottom: 24 }}>
          You've completed your first phase — we'd love to know what you think. Takes about 2 minutes.
        </div>

        {/* Q1 */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.white, marginBottom: 8 }}>
            How easy was it to set up your first routine? <span style={{ color: 'rgba(255,255,255,0.75)' }}>*</span>
          </div>
          <StarRow value={setupEase} onChange={setSetupEase} />
        </div>

        {/* Q2 */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.white, marginBottom: 8 }}>
            Has the app changed how you think about your skincare routine? <span style={{ color: 'rgba(255,255,255,0.75)' }}>*</span>
          </div>
          <PillRow
            value={changedThinking}
            onChange={setChangedThinking}
            options={[
              { value: 'yes',      label: 'Yes' },
              { value: 'somewhat', label: 'Somewhat' },
              { value: 'not_yet',  label: 'Not yet' },
            ]}
          />
        </div>

        {/* Q3 */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.white, marginBottom: 4 }}>
            What's missing that would make this worth paying for?
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>Optional</div>
          <textarea value={missing} onChange={e => setMissing(e.target.value)} rows={3}
            placeholder="Anything — features, content, integrations..."
            aria-label="What's missing that would make this worth paying for?"
            style={textareaStyle} />
        </div>

        {/* Q4 */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.white, marginBottom: 4 }}>
            If you enrolled in a program: did the pacing feel right?
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>Optional — skip if you haven't enrolled in one</div>
          <PillRow
            value={pacing}
            onChange={setPacing}
            options={[
              { value: 'right',    label: 'Just right' },
              { value: 'too_slow', label: 'Too slow' },
              { value: 'too_fast', label: 'Too fast' },
            ]}
          />
        </div>

        {/* Q5 */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.white, marginBottom: 8 }}>
            What would you tell a friend about this app? <span style={{ color: 'rgba(255,255,255,0.75)' }}>*</span>
          </div>
          <textarea value={tellFriend} onChange={e => setTellFriend(e.target.value)} rows={3}
            placeholder="Be honest — good or bad, it all helps."
            aria-label="What would you tell a friend about this app?"
            style={textareaStyle} />
        </div>

        {/* Anonymous toggle + disclosure */}
        <div onClick={toggleAnonymous} role="checkbox" aria-checked={anonymous} tabIndex={0}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleAnonymous() } }}
          style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.12)', borderRadius: T.radius.card, marginBottom: 16, cursor: 'pointer' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, userSelect: 'none' }}>
            <RandomCheckbox checked={anonymous} color={anonymousColor} />
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', lineHeight: 1.7 }}>
              <strong style={{ color: T.white }}>Submit anonymously</strong> — by default your responses are linked to your account so we can follow up and improve your experience specifically. Check this to send without any identifying info. We never share your data either way.
            </div>
          </div>
        </div>

        {error && <div style={{ fontSize: 12, color: T.white, fontWeight: 600, marginBottom: 12 }}>{error}</div>}

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onClose}
            style={{ flex: 1, padding: '11px', borderRadius: T.radius.pill, border: 'none', background: 'rgba(255,255,255,0.15)', color: T.white, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>
            Maybe later
          </button>
          <button onClick={handleSubmit} disabled={submitting || !canSubmit}
            style={{ flex: 2, padding: '11px', borderRadius: T.radius.pill, border: 'none', background: canSubmit ? T.white : 'rgba(255,255,255,0.3)', color: T.darkPink, cursor: canSubmit ? 'pointer' : 'default', fontSize: 12, fontFamily: 'inherit', fontWeight: 600 }}>
            {submitting ? 'Submitting…' : 'Submit feedback'}
          </button>
        </div>

      </div>
    </div>
  )
}
