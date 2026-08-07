import styles from "./AppletResult.module.css";
import Caption from "./Caption";
import { Suspense, lazy, useState, useEffect } from "react";

const appletComponentCache = {};
const bannerComponentCache = {};

function LazyAppletComponent({ loader, fallbackSrc, fallbackAlt }) {
  if (!appletComponentCache[loader]) {
    appletComponentCache[loader] = lazy(loader);
  }
  const Component = appletComponentCache[loader];
  return (
    <Suspense fallback={fallbackSrc ? <img src={fallbackSrc} alt={fallbackAlt} /> : null}>
      <Component />
    </Suspense>
  );
}

function LazyBannerComponent({ loader, fallbackSrc, fallbackAlt }) {
  if (!bannerComponentCache[loader]) {
    bannerComponentCache[loader] = lazy(loader);
  }
  const Component = bannerComponentCache[loader];
  return (
    <Suspense fallback={fallbackSrc ? <img src={fallbackSrc} alt={fallbackAlt} /> : null}>
      <Component />
    </Suspense>
  );
}

export default function AppletResult({
  appletSrc,
  appletAlt,
  appletCaption,
  bannerSrc,
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

  return (
    <div className={styles.wrapper}>
      {hoverHint && (
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
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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
            key={appletKey}
            loader={appletComponent}
            fallbackSrc={appletSrc}
            fallbackAlt={appletAlt}
          />
        ) : (
          <img src={appletSrc} alt={appletAlt} />
        )}
        {appletCaption && <Caption className={styles.caption}>{appletCaption}</Caption>}
      </div>

      <div className={styles.arrow}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <line x1="4" y1="12" x2="20" y2="12" />
          <polyline points="14 6 20 12 14 18" />
        </svg>
      </div>

      <div
        className={`${styles.item} ${dominates === "banner" ? styles.large : styles.small} ${onLightbox && !bannerComponent ? styles.lightboxable : ""}`}
        onClick={() => onLightbox && !bannerComponent && onLightbox(bannerSrc, bannerAlt)}
      >
        {onLightbox && !bannerComponent && <div className={styles.lightboxHint}>⊕</div>}
        {useBannerVideo ? (
          <video src={bannerVideoSrc} autoPlay loop muted playsInline aria-label={bannerAlt} />
        ) : bannerComponent ? (
          <LazyBannerComponent
            loader={bannerComponent}
            fallbackSrc={bannerSrc}
            fallbackAlt={bannerAlt}
          />
        ) : (
          <img src={bannerSrc} alt={bannerAlt} />
        )}
        {bannerCaption && <Caption className={styles.caption}>{bannerCaption}</Caption>}
      </div>
    </div>
  );
}
