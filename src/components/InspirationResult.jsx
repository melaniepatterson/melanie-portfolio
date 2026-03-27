import styles from "./InspirationResult.module.css";
import CodeReveal from "./CodeReveal";


export default function InspirationResult({
  inspirationSrc,
  inspirationAlt,
  inspirationCaption,
  resultSrc,
  resultAlt,
  resultCaption,
  dominates = "result",
  onLightbox,
}) {
  return (
    <div className={styles.wrapper}>
      <div className={`${styles.item} ${dominates === "inspiration" ? styles.large : styles.small}`}>
        <span className={styles.label}>Inspiration</span>
        <img src={inspirationSrc} alt={inspirationAlt} />
        {inspirationCaption && <p className={styles.caption}>{inspirationCaption}</p>}
      </div>

      <div className={styles.arrow}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <line x1="4" y1="12" x2="20" y2="12" />
          <polyline points="14 6 20 12 14 18" />
        </svg>
      </div>

      <div className={`${styles.item} ${dominates === "result" ? styles.large : styles.small} ${onLightbox ? styles.lightboxable : ""}`}
        onClick={() => onLightbox && onLightbox(resultSrc, resultAlt)}
      >
        {onLightbox && <div className={styles.lightboxHint}>⊕</div>}
        {resultCodeReveal ? (
          <CodeReveal still={resultSrc} alt={resultAlt} code={resultCodeReveal} />
        ) : (
          <img src={resultSrc} alt={resultAlt} />
        )}
        {resultCaption && <p className={styles.caption}>{resultCaption}</p>}
      </div>
    </div>
  );
}