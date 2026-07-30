import { useState } from 'react'
import GlowUpLogo from './GlowUpWordmark'
import T from './theme'

const GLOWUP_HOME = '/'

const MESSAGES = [
  "This page broke out and had to be extracted.",
  "404 — this route didn't survive patch testing.",
  "This page needs more hydration. Also, it doesn't exist.",
  "Somebody double-cleansed this URL — gone for good.",
  "This link over-exfoliated and now there's nothing left.",
  "This page's SPF wore off hours ago.",
  "Someone forgot to moisturize this route — it flaked off.",
  "This page purged itself — no trace left.",
]

export default function NotFound() {
  const [message] = useState(() => MESSAGES[Math.floor(Math.random() * MESSAGES.length)])

  return (
    <div style={{ minHeight: '100vh', background: T.white, padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
      <GlowUpLogo size={40} style={{ marginBottom: 24 }} />
      <div style={{ fontSize: 64, fontWeight: 900, color: T.text, lineHeight: 1, marginBottom: 16 }}>404</div>
      <div style={{ fontSize: 16, fontWeight: 600, color: T.text, maxWidth: 380, lineHeight: 1.5, marginBottom: 24 }}>
        {message}
      </div>
      <a href={GLOWUP_HOME} style={{ fontSize: 12, color: T.textMuted, textDecoration: 'none' }}>
        ← Back to Glow Up
      </a>
    </div>
  )
}
