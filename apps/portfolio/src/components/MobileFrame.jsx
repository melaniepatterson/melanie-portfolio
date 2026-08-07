import { useEffect, useRef, useState } from "react";
import styles from "./MobileFrame.module.css";

// Standalone phone-shaped chrome — the same frame DeviceCompare's mobile
// side uses, extracted so it can wrap arbitrary content (a live component,
// not just a screenshot) for gallery items that don't pair with a desktop
// comparison. A placeholder until a custom mobile-device SVG replaces it.
//
// scrollable: true turns the screen into a real scroll container (same
// scroll + fading "Scroll" hint pattern as BrowserFrame) for a tall
// screenshot — leave false for live-content children that already fill
// the frame exactly, like the loader preview.
export default function MobileFrame({ children, scrollable = false }) {
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimer = useRef(null);

  useEffect(() => {
    return () => clearTimeout(scrollTimer.current);
  }, []);

  function handleScroll() {
    setIsScrolling(true);
    clearTimeout(scrollTimer.current);
    scrollTimer.current = setTimeout(() => {
      setIsScrolling(false);
    }, 1000);
  }

  return (
    <div className={styles.phoneFrame}>
      <div className={styles.notch} />
      <div
        className={`${styles.phoneScreen} ${scrollable ? styles.scrollable : ""}`}
        onScroll={scrollable ? handleScroll : undefined}
      >
        {children}
      </div>
      <div className={styles.homeIndicator} />
      {scrollable && (
        <p className={`${styles.scrollHint} ${isScrolling ? styles.scrollHintHidden : ""}`}>
          <span className={styles.scrollHintInner}>Scroll</span>
        </p>
      )}
    </div>
  );
}
