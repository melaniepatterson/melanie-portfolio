import styles from "./GlowUpFloat.module.css";

// The exact floating treatment from GlowUp's own real loading screen
// (GlowUpLoader.jsx) — Naskle wordmark, bobbing on the brand's dark green —
// reused here as a portfolio gallery image instead of a full-bleed loader.
export default function GlowUpFloat() {
  return (
    <div className={styles.stage}>
      <div className={styles.wordmark}>glow up.</div>
    </div>
  );
}
