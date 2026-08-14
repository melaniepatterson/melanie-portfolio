import styles from "./InspirationResult.module.css";
import CodeReveal from "./CodeReveal";
import Caption from "./Caption";
import { Suspense, lazy } from "react";

const resultComponentCache = {};

function LazyResultComponent({ loader, fallbackSrc, fallbackAlt }) {
  if (!resultComponentCache[loader]) {
    resultComponentCache[loader] = lazy(loader);
  }
  const Component = resultComponentCache[loader];
  return (
    <Suspense fallback={fallbackSrc ? <img src={fallbackSrc} alt={fallbackAlt} /> : null}>
      <Component />
    </Suspense>
  );
}

export default function InspirationResult({
  inspirationSrc,
  inspirationAlt,
  inspirationCaption,
  resultSrc,
  resultAlt,
  resultCaption,
  dominates = "result",
  onLightbox,
  resultComponent,
  hoverHint,
}) {
  return (
    <div className={styles.wrapper}>
      {hoverHint && (
        <p className={styles.hoverHint}>Hover to interact</p>
      )}
      <div className={`${styles.item} ${dominates === "inspiration" ? styles.large : styles.small}`}>
        <span className={styles.label}>Inspiration</span>
        <img src={inspirationSrc} alt={inspirationAlt} />
        {inspirationCaption && <Caption className={styles.caption}>{inspirationCaption}</Caption>}
      </div>

      <div className={styles.arrow}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <line x1="4" y1="12" x2="20" y2="12" />
          <polyline points="14 6 20 12 14 18" />
        </svg>
      </div>

      <div
        className={`${styles.item} ${dominates === "result" ? styles.large : styles.small} ${onLightbox && !resultComponent ? styles.lightboxable : ""}`}
        onClick={() => onLightbox && !resultComponent && onLightbox(resultSrc, resultAlt)}
        role={onLightbox && !resultComponent ? "button" : undefined}
        tabIndex={onLightbox && !resultComponent ? 0 : undefined}
        onKeyDown={onLightbox && !resultComponent ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onLightbox(resultSrc, resultAlt); } } : undefined}
        aria-label={onLightbox && !resultComponent ? `View larger: ${resultAlt}` : undefined}
      >
        {onLightbox && !resultComponent && <div className={styles.lightboxHint} aria-hidden="true">⊕</div>}
        {resultComponent ? (
          <LazyResultComponent
            loader={resultComponent}
            fallbackSrc={resultSrc}
            fallbackAlt={resultAlt}
          />
        ) : (
          <img src={resultSrc} alt={resultAlt} />
        )}
        {resultCaption && <Caption className={styles.caption}>{resultCaption}</Caption>}
      </div>
    </div>
  );
}