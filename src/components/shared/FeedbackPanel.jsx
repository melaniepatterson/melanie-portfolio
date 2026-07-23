import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import T from '../theme'

const TYPES = [
  { key: 'bug',     label: 'Bug report' },
  { key: 'feature', label: 'Feature idea' },
  { key: 'general', label: 'General' },
]

// Full-page overlay — pops up over whatever page it's opened from, no navigation.
export default function FeedbackPanel({ onClose }) {
  const [type,    setType]    = useState('general')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent,    setSent]    = useState(false)

  async function handleSend() {
    if (!message.trim()) return
    setSending(true)
    // user_id intentionally omitted — feedback is anonymous
    await supabase.from('feedback').insert({ type, message: message.trim() })
    setSending(false)
    setSent(true)
    setTimeout(() => { setSent(false); setMessage(''); onClose() }, 2000)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: T.darkYellow, zIndex: 800, overflowY: 'auto', WebkitOverflowScrolling: 'touch', fontFamily: 'inherit' }}>
      <button onClick={onClose}
        style={{ position: 'fixed', top: 20, right: 20, zIndex: 810, width: 36, height: 36, borderRadius: T.radius.pill, border: 'none', background: 'rgba(255,255,255,0.18)', cursor: 'pointer', fontSize: 18, color: T.white, lineHeight: 1, fontFamily: 'inherit' }}>
        ×
      </button>

      <div style={{ width: '100%', maxWidth: 460, margin: '0 auto', padding: '64px 20px 48px', boxSizing: 'border-box' }}>

        <div style={{ fontSize: 20, fontWeight: 800, color: T.white, letterSpacing: '-0.03em', marginBottom: 16 }}>Send feedback</div>

        {/* Anonymity notice */}
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)', lineHeight: 1.6, padding: '10px 14px', background: 'rgba(255,255,255,0.15)', borderRadius: T.radius.card, marginBottom: 16 }}>
          Feedback is completely anonymous. Your name, account, and identity are never attached to what you write here.
        </div>

        {/* Type picker */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
          {TYPES.map(t => (
            <button key={t.key} onClick={() => setType(t.key)} style={{
              padding: '7px 14px', borderRadius: T.radius.pill, fontSize: 12, cursor: 'pointer',
              border: 'none',
              background: type === t.key ? T.white : 'rgba(255,255,255,0.15)',
              color: type === t.key ? T.darkYellow : T.white, fontFamily: 'inherit', fontWeight: type === t.key ? 600 : 400,
            }}>{t.label}</button>
          ))}
        </div>

        {/* Message */}
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="What's on your mind? Be as specific as you can — steps to reproduce a bug, or what you wish the app did differently."
          rows={6}
          style={{
            width: '100%', fontSize: 12, padding: '12px 14px', border: 'none',
            borderRadius: T.radius.card, background: T.white, color: T.text, resize: 'vertical',
            fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', lineHeight: 1.6,
            marginBottom: 14,
          }}
        />

        <button
          onClick={handleSend}
          disabled={sending || !message.trim()}
          style={{
            width: '100%', padding: '13px', borderRadius: T.radius.pill, border: 'none',
            background: sent ? T.green : (message.trim() ? T.white : 'rgba(255,255,255,0.3)'),
            color: sent ? T.darkGreen : T.darkYellow,
            fontSize: 13, fontWeight: 600, cursor: sending || !message.trim() ? 'default' : 'pointer',
            transition: 'background 0.2s', fontFamily: 'inherit',
          }}
        >{sent ? '✓ Sent — thank you!' : sending ? 'Sending...' : 'Send feedback'}</button>
      </div>
    </div>
  )
}
