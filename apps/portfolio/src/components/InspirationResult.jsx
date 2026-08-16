import styles from "./InspirationResult.module.css";
import CodeReveal from "./CodeReveal";
import Caption from "./Caption";
import ShimmerImage, { Skeleton } from "./Skeleton";
import LazyOnVisible from "./LazyOnVisible";
import { Suspense, lazy, useState } from "react";
import { useHoverCapable } from "../utils";

const resultComponentCache = {};

function LazyResultComponent({ loader, fallbackSrc, fallbackAlt, fallbackWidth, fallbackHeight, fallbackRatio, resetKey }) {
  if (!resultComponentCache[loader]) {
    resultComponentCache[loader] = lazy(loader);
  }
  const Component = resultComponentCache[loader];
  const fallback = fallbackSrc
    ? <ShimmerImage src={fallbackSrc} alt={fallbackAlt} width={fallbackWidth} height={fallbackHeight} />
    : <Skeleton ratio={fallbackRatio} />;
  return (
    <LazyOnVisible placeholder={fallback}>
      <Suspense key={resetKey} fallback={fallback}>
        <Component />
      </Suspense>
    </LazyOnVisible>
  );
}

export default function InspirationResult({
  inspirationSrc,
  inspirationWidth,
  inspirationHeight,
  inspirationAlt,
  inspirationCaption,
  resultSrc,
  resultWidth,
  resultHeight,
  resultRatio,
  resultAlt,
  resultCaption,
  dominates = "result",
  onLightbox,
  resultComponent,
  showRefresh = false,
  hoverHint,
}) {
  const hoverCapable = useHoverCapable();
  // Same restart mechanism as AppletResult's refresh button — bumping this
  // remounts LazyResultComponent's inner Suspense via key, re-running the
  // component's own effects from scratch.
  const [resultKey, setResultKey] = useState(0);
  return (
    <div className={styles.wrapper}>
      {hoverHint && hoverCapable && (
        <p className={styles.hoverHint}>Hover to interact</p>
      )}
      <div className={`${styles.item} ${dominates === "inspiration" ? styles.large : styles.small}`}>
        <span className={styles.label}>Inspiration</span>
        <ShimmerImage src={inspirationSrc} alt={inspirationAlt} width={inspirationWidth} height={inspirationHeight} />
        {inspirationCaption && <Caption className={styles.caption}>{inspirationCaption}</Caption>}
      </div>

      <div className={styles.arrow}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
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
        {resultComponent && showRefresh && (
          <div className={styles.itemHeader}>
            <span className={styles.label}>Result</span>
            <button
              type="button"
              className={styles.refreshButton}
              onClick={(e) => { e.stopPropagation(); setResultKey(k => k + 1); }}
              aria-label="Restart result"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 12a9 9 0 0 1 15.5-6.36M21 12a9 9 0 0 1-15.5 6.36" />
                <polyline points="16 3 18.5 5.5 16 8" />
                <polyline points="8 21 5.5 18.5 8 16" />
              </svg>
            </button>
          </div>
        )}
        {resultComponent ? (
          <LazyResultComponent
            resetKey={resultKey}
            loader={resultComponent}
            fallbackSrc={resultSrc}
            fallbackAlt={resultAlt}
            fallbackWidth={resultWidth}
            fallbackHeight={resultHeight}
            fallbackRatio={resultRatio}
          />
        ) : (
          <ShimmerImage src={resultSrc} alt={resultAlt} width={resultWidth} height={resultHeight} />
        )}
        {resultCaption && <Caption className={styles.caption}>{resultCaption}</Caption>}
      </div>
    </div>
  );
}
