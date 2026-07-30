import GlowUpLogo from './GlowUpWordmark'
import T from './theme'
import { GLOWUP_HOME } from '../lib/glowupMode'

export default function BlogComingSoon() {
  return (
    <div style={{ minHeight: '100vh', background: T.white, padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
      <GlowUpLogo size={40} style={{ marginBottom: 24 }} />
      <div style={{ fontSize: 22, fontWeight: 700, color: T.text, marginBottom: 10 }}>The blog is coming soon.</div>
      <div style={{ fontSize: 13, color: T.textMuted, maxWidth: 380, lineHeight: 1.7, marginBottom: 24 }}>
        We're working on routine tips, ingredient breakdowns, and behind-the-scenes updates. Check back soon.
      </div>
      <a href={GLOWUP_HOME} style={{ fontSize: 12, color: T.textMuted, textDecoration: 'none' }}>
        ← Back to Glow Up
      </a>
    </div>
  )
}
