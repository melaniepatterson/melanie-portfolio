// Global footer for every GlowUp app page — an oversized, rotated wordmark
// bleeding off all four edges of its crop box, sitting on a solid black bar
// with the copyright. Full-bleed, so it must be dropped outside any
// maxWidth-constrained content column, same rule as the sticky headers.
// marginTop: 'auto' pins it to the bottom of the viewport when page content
// is shorter than the screen — the parent just needs to be a flex column
// with minHeight: '100vh', same trick the portfolio's own footer uses.
import GlowUpLogo from '../GlowUpWordmark'
import T from '../theme'

export default function GlowUpFooter() {
  return (
    <footer style={{ width: '100%', flexShrink: 0, marginTop: 'auto' }}>
      <div style={{ position: 'relative', height: 260, overflow: 'hidden', background: T.white }}>
        <GlowUpLogo
          size={420}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%) rotate(-5deg)',
            whiteSpace: 'nowrap',
            color: T.text,
          }}
        />
      </div>
      <div style={{ background: T.text, color: T.white, textAlign: 'center', padding: '14px 20px', fontSize: 11, fontWeight: 500, letterSpacing: '0.08em' }}>
        © {new Date().getFullYear()} Melanie Patterson
      </div>
    </footer>
  )
}
