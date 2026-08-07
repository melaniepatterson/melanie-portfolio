import styles from "./GlowUpColorPalette.module.css";

// Makeshift palette swatch — a holdover until the real style guide page
// exists. Pairs with GlowUpFloat in the gallery so the two small cells
// sit side by side instead of leaving one alone next to empty space.
const SWATCHES = [
  { name: "Dark green", hex: "#197A3C" },
  { name: "Pink", hex: "#ED6FBB" },
  { name: "Blue", hex: "#98AAF8" },
  { name: "Green", hex: "#7BE3A5" },
  { name: "Yellow", hex: "#F5C222" },
  { name: "Orange", hex: "#F07040" },
];

export default function GlowUpColorPalette() {
  return (
    <div className={styles.stage}>
      <div className={styles.grid}>
        {SWATCHES.map((s) => (
          <div key={s.hex} className={styles.swatch} style={{ background: s.hex }}>
            <span className={styles.label}>{s.hex}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
