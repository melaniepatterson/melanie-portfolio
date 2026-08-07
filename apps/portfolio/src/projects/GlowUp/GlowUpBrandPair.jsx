import GlowUpFloat from "./GlowUpFloat";
import GlowUpColorPalette from "./GlowUpColorPalette";
import styles from "./GlowUpBrandPair.module.css";

// Wordmark + palette side by side, as one gallery slot — the gallery
// shuffles item order per session, so this is the only way to guarantee
// the palette actually lands next to the wordmark instead of wherever a
// random shuffle drops it.
export default function GlowUpBrandPair() {
  return (
    <div className={styles.wrapper}>
      <div className={styles.half}>
        <GlowUpFloat />
      </div>
      <div className={styles.half}>
        <GlowUpColorPalette />
      </div>
    </div>
  );
}
