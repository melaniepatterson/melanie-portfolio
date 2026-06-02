import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Auth() {
  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent]       = useState(false)
  const [error, setError]     = useState(null)

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: 'https://melanie.studio/routine' }
    })
    if (error) setError(error.message)
    else setSent(true)
    setLoading(false)
  }

  if (sent) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'inherit', padding: '2rem' }}>
      <div style={{ maxWidth: 380, textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 16 }}>✉️</div>
        <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Check your email</div>
        <div style={{ fontSize: 14, color: '#78716C', lineHeight: 1.6 }}>
          We sent a magic link to <strong>{email}</strong>. Click it to sign in — no password needed.
        </div>
      </div>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'inherit', padding: '2rem' }}>
      <div style={{ maxWidth: 380, width: '100%' }}>
        <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Glow Up</div>
        <div style={{ fontSize: 14, color: '#78716C', marginBottom: 32 }}>Your skincare calendar</div>
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 12 }}>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={{ width: '100%', fontSize: 14, padding: '10px 12px', border: '0.5px solid #E7E0D8', borderRadius: 8, background: '#FAF7F2', color: '#1C1917', boxSizing: 'border-box', outline: 'none' }}
            />
          </div>
          {error && <div style={{ fontSize: 12, color: '#9F1239', marginBottom: 10 }}>{error}</div>}
          <button
            type="submit"
            disabled={loading || !email}
            style={{ width: '100%', padding: '10px', borderRadius: 8, border: 'none', background: '#F472B6', color: '#1C1917', fontSize: 14, fontWeight: 600, cursor: loading ? 'default' : 'pointer', opacity: loading || !email ? 0.6 : 1 }}
          >
            {loading ? 'Sending...' : 'Send magic link'}
          </button>
        </form>
      </div>
    </div>
  )
}
