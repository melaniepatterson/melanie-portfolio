import GlowUpLogo from './GlowUpWordmark'
import T from './theme'

export default function GlowUpAbout() {
  return (
    <div style={{ minHeight: '100vh', background: T.white, padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
      <GlowUpLogo size={40} style={{ marginBottom: 24 }} />
      <div style={{ fontSize: 22, fontWeight: 700, color: T.text, marginBottom: 14 }}>About GlowUp</div>
      <div style={{ fontSize: 13, color: T.textMuted, maxWidth: 420, lineHeight: 1.8, marginBottom: 10 }}>
        GlowUp helps you build and keep a skincare routine that actually makes sense — pacing new actives in gradually, tracking treatments and recovery windows, and flagging conflicts before they become a problem.
      </div>
      <div style={{ fontSize: 13, color: T.textMuted, maxWidth: 420, lineHeight: 1.8, marginBottom: 24 }}>
        It's designed and built by Melanie Patterson — every screen, from the calendar to the product library, one person end to end.
      </div>
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <a href="/privacy" style={{ fontSize: 12, color: T.textMuted, textDecoration: 'none' }}>Privacy policy</a>
        <a href="/about-contact" style={{ fontSize: 12, color: T.textMuted, textDecoration: 'none' }}>About Melanie</a>
      </div>
      <a href="/routine" style={{ fontSize: 12, color: T.textMuted, textDecoration: 'none' }}>
        ← Back to Glow Up
      </a>
    </div>
  )
}
