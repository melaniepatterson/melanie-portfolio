// Global footer for every GlowUp app page — an oversized, rotated wordmark
// bleeding off all four edges of its crop box, sitting on a solid black bar
// with a 3-column link grid and the copyright. Full-bleed, so it must be
// dropped outside any maxWidth-constrained content column, same rule as the
// sticky headers. marginTop: 'auto' pins it to the bottom of the viewport
// when page content is shorter than the screen — the parent just needs to
// be a flex column with minHeight: '100vh', same trick the portfolio's own
// footer uses.
import GlowUpLogo from '../GlowUpWordmark'
import T from '../theme'

// Plain text, white, no underline, no hover treatment — same for links and
// the one action (Send feedback opens a modal instead of navigating).
function FooterLink({ href, onClick, children }) {
  const style = { fontSize: 13, fontWeight: 700, color: T.white, textDecoration: 'none', background: 'none', border: 'none', padding: 0, margin: 0, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', display: 'block' }
  if (onClick) return <button onClick={onClick} style={style}>{children}</button>
  return <a href={href} style={style}>{children}</a>
}

export default function GlowUpFooter({ onFeedback }) {
  return (
    <footer style={{ width: '100%', flexShrink: 0, marginTop: 'auto' }}>
      <div style={{ position: 'relative', height: 340, overflow: 'hidden', background: T.white }}>
        <GlowUpLogo
          size={420}
          style={{
            position: 'absolute',
            top: '30%',
            left: '50%',
            transform: 'translate(-50%, -50%) rotate(-5deg)',
            whiteSpace: 'nowrap',
            color: T.text,
          }}
        />
      </div>
      <div style={{ background: T.text, padding: '32px 20px 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 24, maxWidth: 900, margin: '0 auto 28px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <FooterLink href="/routine">Calendar</FooterLink>
            <FooterLink href="/routine/history">Routine history</FooterLink>
            <FooterLink href="/routine/products">Product library</FooterLink>
            <FooterLink onClick={onFeedback}>Send feedback</FooterLink>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <FooterLink href="/about-contact">About</FooterLink>
            <FooterLink href="/blog">Blog</FooterLink>
            <FooterLink href="/privacy#cookies">Cookie policy</FooterLink>
            <FooterLink href="/privacy">Privacy policy</FooterLink>
          </div>
        </div>
        <div style={{ textAlign: 'center', fontSize: 11, fontWeight: 500, letterSpacing: '0.08em', color: T.white, maxWidth: 900, margin: '0 auto' }}>
          © {new Date().getFullYear()} Melanie Patterson
        </div>
      </div>
    </footer>
  )
}
