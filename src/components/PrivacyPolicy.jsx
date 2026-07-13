import T from './theme'

function Section({ title, children, id }) {
  return (
    <div id={id} style={{ marginBottom: 32 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: T.pinkDeep, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
        {title}
      </div>
      <div style={{ fontSize: 13, color: T.textMuted, lineHeight: 1.85 }}>
        {children}
      </div>
    </div>
  )
}

function P({ children }) {
  return <p style={{ margin: '0 0 10px' }}>{children}</p>
}

function Ul({ items }) {
  return (
    <ul style={{ margin: '0 0 10px', paddingLeft: 20 }}>
      {items.map((item, i) => <li key={i} style={{ marginBottom: 4 }}>{item}</li>)}
    </ul>
  )
}

export default function PrivacyPolicy() {
  return (
    <div style={{ minHeight: '100vh', background: T.cream, padding: '40px 20px' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <a href="/routine" style={{ fontSize: 12, color: T.textMuted, textDecoration: 'none', display: 'inline-block', marginBottom: 24 }}>
            ← Back to Glow Up
          </a>
          <div style={{ fontSize: 9, fontWeight: 700, color: T.pinkDeep, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
            Legal
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: T.text, letterSpacing: '-0.03em', margin: '0 0 8px' }}>
            Privacy Policy
          </h1>
          <div style={{ fontSize: 12, color: T.textMuted }}>Last updated: June 25, 2026</div>
        </div>

        <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 32 }}>

          <Section title="What we collect">
            <P><strong style={{ color: T.text }}>Account information</strong> — Your email address, used only for authentication (magic link sign-in). We don't use it for marketing.</P>
            <P><strong style={{ color: T.text }}>Routine data</strong> — Everything you enter into the app: routine steps, products, treatment dates, program progress, and any notes or ratings. Stored in our database and tied to your account.</P>
            <P><strong style={{ color: T.text }}>Profile preferences</strong> — Your display name, skin type, timezone, and beta tester status.</P>
            <P><strong style={{ color: T.text }}>Feedback</strong> — If you submit the optional in-app survey, your responses are stored and optionally linked to your account. You can choose to submit anonymously.</P>
            <P><strong style={{ color: T.text }}>Technical data</strong> — Supabase (our database provider) logs standard server data like IP addresses and request timestamps for security. We don't use this for tracking.</P>
          </Section>

          <Section title="What we don't collect">
            <Ul items={[
              'No advertising or tracking pixels',
              'No Google Analytics or third-party analytics',
              'No selling of your data — ever',
              'No third-party sharing beyond what\u2019s described here',
            ]} />
          </Section>

          <Section title="Cookies and browser storage" id="cookies">
            <P><strong style={{ color: T.text }}>Authentication cookies</strong> — Set by Supabase to keep you signed in. Strictly necessary; no consent required under GDPR or UK GDPR.</P>
            <P><strong style={{ color: T.text }}>Local storage</strong> — We store small functional preferences in your browser: whether you've dismissed certain banners, and URL state for navigation. This data never leaves your device and isn't sent to any server.</P>
            <P>We don't use non-essential cookies, tracking cookies, or third-party cookies of any kind.</P>
          </Section>

          <Section title="How we use your data">
            <Ul items={[
              'To provide and improve the Glow Up app',
              'To send you authentication emails (magic links)',
              'To personalise your experience based on skin type and program progress',
              'To read beta feedback if you\u2019ve opted in and submitted a survey',
            ]} />
            <P>We don't use your data for advertising or profiling.</P>
          </Section>

          <Section title="Data storage and security">
            <P>Your data is stored on Supabase infrastructure, which uses industry-standard encryption in transit and at rest. Supabase is our data processor under GDPR. Read their policy at <a href="https://supabase.com/privacy" style={{ color: T.pinkDeep }}>supabase.com/privacy</a>.</P>
            <P>We retain your data for as long as your account is active. To request deletion, email us below.</P>
          </Section>

          <Section title="Your rights">
            <P>Depending on where you're located, you may have the right to:</P>
            <Ul items={[
              'Access the data we hold about you',
              'Correct inaccurate data',
              'Delete your account and associated data',
              'Export your data',
              'Withdraw consent for optional data uses (like beta feedback)',
            ]} />
            <P><strong style={{ color: T.text }}>EU/UK residents</strong> — You have rights under GDPR and UK GDPR. If you believe we've handled your data unlawfully, you can lodge a complaint with your local supervisory authority (e.g. the ICO in the UK).</P>
            <P><strong style={{ color: T.text }}>California residents</strong> — Under CCPA, you have the right to know what personal information we collect and to request deletion. We don't sell personal information.</P>
          </Section>

          <Section title="Children">
            <P>Glow Up is not directed at children under 13. We don't knowingly collect data from children.</P>
          </Section>

          <Section title="Changes to this policy">
            <P>If we make material changes, we'll update the date at the top and notify beta testers via the app.</P>
          </Section>

          <Section title="Contact">
            <P>Questions? Email <a href="mailto:hello@melanie.studio?subject=Glow%20Up%20%E2%80%94%20Privacy%3A%20" style={{ color: T.pinkDeep }}><strong style={{ color: T.text }}>hello@melanie.studio</strong></a> — update this address before going public.</P>
          </Section>

        </div>
      </div>
    </div>
  )
}
