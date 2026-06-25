import { useState } from 'react'
import { supabase } from '../lib/supabase'

const T = {
  white:    '#FFFFFF',
  cream:    '#FAF7F2',
  creamDark:'#EDE8E2',
  border:   '#DDD8D0',
  text:     '#1A1A1A',
  textMuted:'#6B6560',
  textLight:'#A8A29E',
  pink:     '#FFD6F9',
  pinkDeep: '#C93500',
}

function StarRow({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} onClick={() => onChange(n)}
          style={{ width: 36, height: 36, borderRadius: 0, border: `1px solid ${n <= value ? T.pinkDeep : T.border}`, background: n <= value ? T.pink : 'transparent', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: n <= value ? T.pinkDeep : T.textMuted, fontFamily: 'inherit' }}>
          {n}
        </button>
      ))}
      <span style={{ fontSize: 11, color: T.textMuted, alignSelf: 'center', marginLeft: 6 }}>
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
          style={{ padding: '7px 14px', borderRadius: 0, border: `1px solid ${value === o.value ? T.text : T.border}`, background: value === o.value ? T.text : 'transparent', color: value === o.value ? '#fff' : T.textMuted, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

export default function BetaSurvey({ session, onClose, onSubmitted }) {
  const [setupEase,       setSetupEase]       = useState(0)
  const [changedThinking, setChangedThinking] = useState('')
  const [missing,         setMissing]         = useState('')
  const [pacing,          setPacing]          = useState('')
  const [tellFriend,      setTellFriend]      = useState('')
  const [anonymous,       setAnonymous]       = useState(false)
  const [submitting,      setSubmitting]      = useState(false)
  const [error,           setError]           = useState('')

  const canSubmit = setupEase > 0 && changedThinking && tellFriend.trim().length > 0

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

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 0, width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto', padding: '28px 24px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, color: T.pinkDeep, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Beta feedback</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: T.text, letterSpacing: '-0.03em' }}>How's it going so far?</div>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 20, color: T.textMuted, lineHeight: 1, padding: '0 0 0 16px' }}>×</button>
        </div>
        <div style={{ fontSize: 12, color: T.textMuted, lineHeight: 1.7, marginBottom: 24 }}>
          You've completed your first phase — we'd love to know what you think. Takes about 2 minutes.
        </div>

        {/* Q1 */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 8 }}>
            How easy was it to set up your first routine? <span style={{ color: T.pinkDeep }}>*</span>
          </div>
          <StarRow value={setupEase} onChange={setSetupEase} />
        </div>

        {/* Q2 */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 8 }}>
            Has the app changed how you think about your skincare routine? <span style={{ color: T.pinkDeep }}>*</span>
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
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 4 }}>
            What's missing that would make this worth paying for?
          </div>
          <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 8 }}>Optional</div>
          <textarea value={missing} onChange={e => setMissing(e.target.value)} rows={3}
            placeholder="Anything — features, content, integrations..."
            style={{ width: '100%', boxSizing: 'border-box', fontSize: 12, padding: '8px 10px', border: `1px solid ${T.border}`, borderRadius: 0, background: 'transparent', color: T.text, fontFamily: 'inherit', resize: 'vertical', outline: 'none', lineHeight: 1.6 }} />
        </div>

        {/* Q4 */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 4 }}>
            If you enrolled in a program: did the pacing feel right?
          </div>
          <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 8 }}>Optional — skip if you haven't enrolled in one</div>
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
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 8 }}>
            What would you tell a friend about this app? <span style={{ color: T.pinkDeep }}>*</span>
          </div>
          <textarea value={tellFriend} onChange={e => setTellFriend(e.target.value)} rows={3}
            placeholder="Be honest — good or bad, it all helps."
            style={{ width: '100%', boxSizing: 'border-box', fontSize: 12, padding: '8px 10px', border: `1px solid ${T.border}`, borderRadius: 0, background: 'transparent', color: T.text, fontFamily: 'inherit', resize: 'vertical', outline: 'none', lineHeight: 1.6 }} />
        </div>

        {/* Anonymous toggle + disclosure */}
        <div style={{ padding: '12px 14px', background: T.creamDark, border: `0.5px solid ${T.border}`, marginBottom: 16 }}>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
            <input type="checkbox" checked={anonymous} onChange={e => setAnonymous(e.target.checked)}
              style={{ marginTop: 2, accentColor: T.pinkDeep, flexShrink: 0 }} />
            <div style={{ fontSize: 11, color: T.textMuted, lineHeight: 1.7 }}>
              <strong style={{ color: T.text }}>Submit anonymously</strong> — by default your responses are linked to your account so we can follow up and improve your experience specifically. Check this to send without any identifying info. We never share your data either way.
            </div>
          </label>
        </div>

        {error && <div style={{ fontSize: 12, color: T.pinkDeep, marginBottom: 12 }}>{error}</div>}

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onClose}
            style={{ flex: 1, padding: '11px', borderRadius: 0, border: `1px solid ${T.border}`, background: 'transparent', color: T.text, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>
            Maybe later
          </button>
          <button onClick={handleSubmit} disabled={submitting || !canSubmit}
            style={{ flex: 2, padding: '11px', borderRadius: 0, border: 'none', background: canSubmit ? T.pinkDeep : T.border, color: '#fff', cursor: canSubmit ? 'pointer' : 'default', fontSize: 12, fontFamily: 'inherit', fontWeight: 600 }}>
            {submitting ? 'Submitting…' : 'Submit feedback'}
          </button>
        </div>

      </div>
    </div>
  )
}
