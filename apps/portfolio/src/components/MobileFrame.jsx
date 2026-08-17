import { useEffect, useRef, useState } from "react";
import styles from "./MobileFrame.module.css";

// Phone-shaped chrome — same overlay technique as BrowserFrame (device
// artwork sits on top with mix-blend-mode: multiply, content lives below
// it as a plain HTML layer). Used standalone (for live content, like the
// loader preview) and inside DeviceCompare (for a screenshot next to
// BrowserFrame).
//
// Rebuilt without a foreignObject — real Safari has a longstanding bug
// where foreignObject content doesn't reliably respect the ambient SVG's
// viewBox scaling, rendering at literal pixel values instead and
// escaping the frame's clip (confirmed on-device: the GlowUp loader
// showing as a blank rectangle, screenshots rendering zoomed/blank).
// The content now lives as a plain HTML layer sized with ordinary CSS
// percentages against an aspect-ratio container; the SVG chrome is a
// purely decorative pointer-events: none overlay on top.
//
// The original also cut a true transparent hole for the camera pill (so
// the page background showed through it, not an opaque shape drawn over
// the screenshot) via an SVG mask on the foreignObject's containing <g>
// — without a foreignObject there's no single group left to mask like
// that. Simplified to a solid pill in the phone's own body color
// instead, same as a real phone's camera cutout actually looks (opaque,
// not a window through the device) — a small, deliberate visual
// simplification in exchange for content that reliably renders.
//
// scrollable: true turns the screen into a real scroll container (same
// scroll + fading "Scroll" hint pattern as BrowserFrame) for a tall
// screenshot — leave false for live-content children that already fill
// the frame exactly, like the loader preview.
//
// matchHeight: true sizes the frame by height instead of width, so it can
// sit flush with BrowserFrame's rendered height in DeviceCompare — leave
// false for standalone use, where it fills its container's width instead.
export default function MobileFrame({ children, scrollable = false, matchHeight = false, fullWidth = false }) {
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
    <div className={`${styles.wrapper} ${matchHeight ? styles.matchHeight : ""} ${fullWidth ? styles.fullWidth : ""}`}>
      {/* Screen area, as a % of the frame — matches the chrome art's own
          drawn border (x=25.72 y=26.1 w=875.85 h=1867.8 out of the
          927.98x1920 viewBox). Corner radius (44 units) expressed as two
          percentages (horizontal % of width / vertical % of height) so
          it stays exactly circular at any rendered size. */}
      <div
        className={`${styles.screen} ${scrollable ? styles.scrollable : ""}`}
        onScroll={scrollable ? handleScroll : undefined}
        style={{
          position: "absolute",
          left: "2.7716%",
          top: "1.3594%",
          width: "94.3836%",
          height: "97.2812%",
          borderRadius: "5.023%/2.356%",
        }}
      >
        {children}
      </div>

      <svg
        viewBox="0 0 927.98 1920"
        xmlns="http://www.w3.org/2000/svg"
        className={styles.chromeSvg}
        aria-hidden="true"
      >
        <g style={{ mixBlendMode: "multiply" }}>
          <path
            className={styles.body}
            d="m854.57 26.1c25.92 0 47 21.08 47 47v1773.8c0 25.92-21.08 47-47 47h-781.85c-25.92 0-47-21.08-47-47v-1773.8c0-25.92 21.08-47 47-47h781.85zm0-3h-781.85c-27.5 0-50 22.5-50 50v1773.8c0 27.5 22.5 50 50 50h781.85c27.5 0 50-22.5 50-50v-1773.8c0-27.5-22.5-50-50-50z"
          />
          <path
            className={styles.button}
            d="m903.25 419.79h8.62c1.66 0 3 1.34 3 3v187.25c0 1.66-1.34 3-3 3h-8.62v-193.25z"
          />
          <path
            className={styles.button}
            transform="translate(36.02 577.22) rotate(180)"
            d="m12.2 253.6h8.62c1.66 0 3 1.34 3 3v64.02c0 1.66-1.34 3-3 3h-8.62v-70.02z"
          />
          <path
            className={styles.button}
            transform="translate(36.02 958.7) rotate(180)"
            d="m12.2 413.79h8.62c1.66 0 3 1.34 3 3v125.12c0 1.66-1.34 3-3 3h-8.62v-131.12z"
          />
          <path
            className={styles.button}
            transform="translate(36.018 1300.3) rotate(180)"
            d="m12.2 584.61h8.62c1.66 0 3 1.34 3 3v125.12c0 1.66-1.34 3-3 3h-8.62v-131.12z"
          />
        </g>
        {/* Camera pill — solid, not a cutout (see comment above). */}
        <rect
          className={styles.body}
          x="347.55" y="53.72" width="226.85" height="51.22" rx="25.61" ry="25.61"
        />
      </svg>

      {scrollable && (
        <p className={`${styles.scrollHint} ${isScrolling ? styles.scrollHintHidden : ""}`}>
          <span className={styles.scrollHintInner}>Scroll to interact</span>
        </p>
      )}
    </div>
  );
}
