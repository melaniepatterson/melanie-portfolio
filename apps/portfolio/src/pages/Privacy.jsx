import styles from "./Privacy.module.css";
import { OPEN_CONSENT_EVENT } from "../ConsentBanner";

export default function Privacy() {
  return (
    <div className={styles.page}>
      <h1 className="sr-only">Privacy &amp; Cookies</h1>
      <p className={styles.updated}>Last updated August 2026</p>

      <div className={styles.section}>
        <h2>Analytics</h2>
        <p>
          This site uses Google Analytics to see general traffic patterns — nothing more. It only
          runs if you accept the cookie banner, and it only ever collects anonymous usage data.
        </p>
      </div>

      <div className={styles.section}>
        <h2>Cookies</h2>
        <p>
          No ads, no tracking pixels, and no selling of data — the only cookies here are the ones
          Google Analytics sets after you say yes, and a small note in your browser so you're not
          asked again right away. That note expires after 6 months, at which point you'll be asked again.
        </p>
      </div>

      <div className={styles.section}>
        <h2>Consent records</h2>
        <p>
          When you accept or decline, a record of that choice (timestamp and a random, anonymous
          id — not your name or anything identifying) is kept so there's proof a choice was made,
          should it ever be asked for. It can't be read back or edited from your browser.
        </p>
      </div>

      <div className={styles.section}>
        <h2>Changing your mind</h2>
        <p>
          It re-asks automatically every 6 months, or you can change your choice right now:
        </p>
        <button
          onClick={() => window.dispatchEvent(new Event(OPEN_CONSENT_EVENT))}
          className={styles.preferencesButton}
        >
          Change cookie preferences
        </button>
      </div>

      <div className={styles.section}>
        <h2>Questions</h2>
        <p>
          Reach out any time at <a href="mailto:hello@melanie.studio">hello@melanie.studio</a>.
        </p>
      </div>
    </div>
  );
}
