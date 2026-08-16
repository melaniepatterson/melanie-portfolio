import styles from "./AppletResult.module.css";
import Caption from "./Caption";
import ShimmerImage, { Skeleton } from "./Skeleton";
import LazyOnVisible from "./LazyOnVisible";
import VisibilityGatedVideo from "./VisibilityGatedVideo";
import { Suspense, lazy, useState, useEffect } from "react";
import { useHoverCapable } from "../utils";

const appletComponentCache = {};
const bannerComponentCache = {};

// AppletCanvas.module.css (what every current appletComponent renders
// into) is fixed at 3:2 — used as the Skeleton's fallback ratio whenever
// there's no fallbackSrc image to size against instead.
const DEFAULT_APPLET_RATIO = "3 / 2";

// resetKey (not React's own `key`) remounts just the inner Suspense/
// Component on "restart applet" — keeping LazyOnVisible itself stable
// so restarting an already-visible, already-loaded applet doesn't also
// reset its visibility gate and wait on a fresh IntersectionObserver
// callback before remounting.
function LazyAppletComponent({ loader, fallbackSrc, fallbackAlt, fallbackWidth, fallbackHeight, ratio, resetKey }) {
  if (!appletComponentCache[loader]) {
    appletComponentCache[loader] = lazy(loader);
  }
  const Component = appletComponentCache[loader];
  const fallback = fallbackSrc
    ? <ShimmerImage src={fallbackSrc} alt={fallbackAlt} width={fallbackWidth} height={fallbackHeight} />
    : <Skeleton ratio={ratio || DEFAULT_APPLET_RATIO} />;
  return (
    <LazyOnVisible placeholder={fallback}>
      <Suspense key={resetKey} fallback={fallback}>
        <Component />
      </Suspense>
    </LazyOnVisible>
  );
}

function LazyBannerComponent({ loader, fallbackSrc, fallbackAlt, fallbackWidth, fallbackHeight }) {
  if (!bannerComponentCache[loader]) {
    bannerComponentCache[loader] = lazy(loader);
  }
  const Component = bannerComponentCache[loader];
  const fallback = fallbackSrc
    ? <ShimmerImage src={fallbackSrc} alt={fallbackAlt} width={fallbackWidth} height={fallbackHeight} />
    : <Skeleton />;
  return (
    <LazyOnVisible placeholder={fallback}>
      <Suspense fallback={fallback}>
        <Component />
      </Suspense>
    </LazyOnVisible>
  );
}

export default function AppletResult({
  appletSrc,
  appletWidth,
  appletHeight,
  appletRatio,
  appletAlt,
  appletCaption,
  bannerSrc,
  bannerWidth,
  bannerHeight,
  bannerAlt,
  bannerCaption,
  dominates = "applet",
  onLightbox,
  appletComponent,
  bannerComponent,
  showRefresh = false,
  appletVideoFallback = false,
  appletVideoSrc,
  bannerVideoFallback = false,
  bannerVideoSrc,
  hoverHint,
}) {
  // Bumping this remounts LazyAppletComponent from scratch (via key), which
  // is what actually "restarts" it — the applet's own effect cleanup/setup
  // re-runs, resetting whatever internal animation state it has.
  const [appletKey, setAppletKey] = useState(0);

  // Some of these are heavy/interactive (cursor tracking, canvas redraws on
  // every frame) and don't translate to touch — same 640px breakpoint used
  // elsewhere in this app (Work.jsx, WorkDetail.jsx) for mobile checks.
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < 640);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const useAppletVideo = appletVideoFallback && isMobile && appletVideoSrc;
  const useBannerVideo = bannerVideoFallback && isMobile && bannerVideoSrc;
  // Separate from the mobile-only useBannerVideo fallback above — this is
  // bannerSrc itself just being a video file outright, same "no ui,
  // infinite loop, no sound" treatment as the Work-grid thumbnails.
  const bannerIsVideoFile = typeof bannerSrc === "string" && bannerSrc.endsWith(".webm");
  const hoverCapable = useHoverCapable();

  return (
    <div className={styles.wrapper}>
      {hoverHint && hoverCapable && (
        <p className={styles.hoverHint}>Hover to interact</p>
      )}
      <div className={`${styles.item} ${dominates === "applet" ? styles.large : styles.small}`}>
        <div className={styles.itemHeader}>
          <span className={styles.label}>Applet</span>
          {appletComponent && showRefresh && !useAppletVideo && (
            <button
              type="button"
              className={styles.refreshButton}
              onClick={() => setAppletKey(k => k + 1)}
              aria-label="Restart applet"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 12a9 9 0 0 1 15.5-6.36M21 12a9 9 0 0 1-15.5 6.36" />
                <polyline points="16 3 18.5 5.5 16 8" />
                <polyline points="8 21 5.5 18.5 8 16" />
              </svg>
            </button>
          )}
        </div>
        {useAppletVideo ? (
          <video src={appletVideoSrc} autoPlay loop muted playsInline aria-label={appletAlt} />
        ) : appletComponent ? (
          <LazyAppletComponent
            resetKey={appletKey}
            loader={appletComponent}
            fallbackSrc={appletSrc}
            fallbackAlt={appletAlt}
            fallbackWidth={appletWidth}
            fallbackHeight={appletHeight}
            ratio={appletRatio}
          />
        ) : (
          <ShimmerImage src={appletSrc} alt={appletAlt} width={appletWidth} height={appletHeight} />
        )}
        {appletCaption && <Caption className={styles.caption}>{appletCaption}</Caption>}
      </div>

      <div className={styles.arrow}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
          <line x1="4" y1="12" x2="20" y2="12" />
          <polyline points="14 6 20 12 14 18" />
        </svg>
      </div>

      <div
        className={`${styles.item} ${dominates === "banner" ? styles.large : styles.small} ${onLightbox && !bannerComponent && !bannerIsVideoFile ? styles.lightboxable : ""}`}
        onClick={() => onLightbox && !bannerComponent && !bannerIsVideoFile && onLightbox(bannerSrc, bannerAlt)}
        role={onLightbox && !bannerComponent && !bannerIsVideoFile ? "button" : undefined}
        tabIndex={onLightbox && !bannerComponent && !bannerIsVideoFile ? 0 : undefined}
        onKeyDown={onLightbox && !bannerComponent && !bannerIsVideoFile ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onLightbox(bannerSrc, bannerAlt); } } : undefined}
        aria-label={onLightbox && !bannerComponent && !bannerIsVideoFile ? `View larger: ${bannerAlt}` : undefined}
      >
        {onLightbox && !bannerComponent && !bannerIsVideoFile && <div className={styles.lightboxHint} aria-hidden="true">⊕</div>}
        {/* This side never gets its own "Result" label/header — an
            invisible spacer the same height as the Applet side's
            itemHeader keeps the two artworks' tops aligned instead of
            the Result image starting higher than the Applet one. Mirrors
            the Applet side's own refresh-button condition too: the
            button's negative-margin hit-target padding makes it taller
            than the label alone, so the spacer needs the same icon
            present/absent to match height exactly, not just the label. */}
        <div className={styles.itemHeader} aria-hidden="true" style={{ visibility: "hidden" }}>
          <span className={styles.label}>Result</span>
          {appletComponent && showRefresh && !useAppletVideo && (
            <span className={styles.refreshButton}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 12a9 9 0 0 1 15.5-6.36M21 12a9 9 0 0 1-15.5 6.36" />
                <polyline points="16 3 18.5 5.5 16 8" />
                <polyline points="8 21 5.5 18.5 8 16" />
              </svg>
            </span>
          )}
        </div>
        {useBannerVideo ? (
          <video src={bannerVideoSrc} autoPlay loop muted playsInline aria-label={bannerAlt} />
        ) : bannerComponent ? (
          <LazyBannerComponent
            loader={bannerComponent}
            fallbackSrc={bannerSrc}
            fallbackAlt={bannerAlt}
            fallbackWidth={bannerWidth}
            fallbackHeight={bannerHeight}
          />
        ) : bannerIsVideoFile ? (
          <VisibilityGatedVideo src={bannerSrc} alt={bannerAlt} width={bannerWidth} height={bannerHeight} />
        ) : (
          <ShimmerImage src={bannerSrc} alt={bannerAlt} width={bannerWidth} height={bannerHeight} />
        )}
        {bannerCaption && <Caption className={styles.caption}>{bannerCaption}</Caption>}
      </div>
    </div>
  );
}
