import { useState } from 'react'
import GlowUpLogo from './GlowUpWordmark'
import T from './theme'

const GLOWUP_HOME = '/'

const MESSAGES = [
  "This page broke out and had to be extracted.",
  "404 — this route didn't survive patch testing.",
  "Looks like this page skipped its routine and went missing.",
  "We looked everywhere, even under the retinol.",
  "This page purged itself. No cure time, just gone.",
  "Not found, not glowing, not here.",
  "This route ghosted us — SPF couldn't have prevented that.",
  "This page needs more hydration. Also, it doesn't exist.",
  "Somebody double-cleansed this URL right off the map.",
  "This link over-exfoliated and now there's nothing left.",
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
