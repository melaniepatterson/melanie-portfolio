import { useEffect, useRef, useState } from "react";
import styles from "./MobileFrame.module.css";

// Phone-shaped chrome — same SVG-overlay technique as BrowserFrame (a
// foreignObject + clipPath holds the content, the device artwork sits on
// top with mix-blend-mode: multiply). Used standalone (for live content,
// like the loader preview) and inside DeviceCompare (for a screenshot next
// to BrowserFrame).
//
// scrollable: true turns the screen into a real scroll container (same
// scroll + fading "Scroll" hint pattern as BrowserFrame) for a tall
// screenshot — leave false for live-content children that already fill
// the frame exactly, like the loader preview.
//
// matchHeight: true sizes the frame by height instead of width, so it can
// sit flush with BrowserFrame's rendered height in DeviceCompare — leave
// false for standalone use, where it fills its container's width instead.
const CLIP_ID = "mobileFrameClip";
const MASK_ID = "mobileFrameMask";

export default function MobileFrame({ children, scrollable = false, matchHeight = false }) {
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
    <div className={`${styles.wrapper} ${matchHeight ? styles.matchHeight : ""}`}>
      <svg
        viewBox="0 0 927.98 1920"
        xmlns="http://www.w3.org/2000/svg"
        className={styles.svg}
        aria-hidden="true"
      >
        <defs>
          <clipPath id={CLIP_ID}>
            <rect x="25.72" y="26.1" width="875.85" height="1867.8" rx="44" ry="44" />
          </clipPath>
          {/* Cuts the camera pill out of the content layer — white shows
              through, black hides — so it's a true transparent window onto
              whatever sits behind the frame, not an opaque shape drawn over
              the screenshot. The chrome pill outline below sits right at
              this hole's edge. */}
          <mask id={MASK_ID} maskUnits="userSpaceOnUse">
            <rect x="0" y="0" width="927.98" height="1920" fill="#FFFFFF" />
            <rect x="347.55" y="53.72" width="226.85" height="51.22" rx="25.61" ry="25.61" fill="#000000" />
          </mask>
        </defs>

        <g clipPath={`url(#${CLIP_ID})`} mask={`url(#${MASK_ID})`}>
          <foreignObject x="25.72" y="26.1" width="875.85" height="1867.8">
            <div
              xmlns="http://www.w3.org/1999/xhtml"
              className={`${styles.screen} ${scrollable ? styles.scrollable : ""}`}
              onScroll={scrollable ? handleScroll : undefined}
            >
              {children}
            </div>
          </foreignObject>
        </g>

        <g style={{ mixBlendMode: "multiply" }}>
          <path
            className={styles.body}
            d="m854.57 26.1c25.92 0 47 21.08 47 47v1773.8c0 25.92-21.08 47-47 47h-781.85c-25.92 0-47-21.08-47-47v-1773.8c0-25.92 21.08-47 47-47h781.85zm0-3h-781.85c-27.5 0-50 22.5-50 50v1773.8c0 27.5 22.5 50 50 50h781.85c27.5 0 50-22.5 50-50v-1773.8c0-27.5-22.5-50-50-50z"
          />
          {/* The source SVG draws this as a solid-filled rect, but a solid
              fill here would render opaque (mix-blend-mode only blends
              against other shapes drawn inside this SVG, and there's
              nothing behind the mask's hole within the SVG itself) —
              stroking the same rect keeps a true hole in the middle so the
              page background still shows through, same fix as the pill
              needed before. */}
          <rect
            className={styles.body}
            x="347.55" y="53.72" width="226.85" height="51.22" rx="25.61" ry="25.61"
            fill="none" stroke="#982511" strokeWidth="3"
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
      </svg>

      {scrollable && (
        <p className={`${styles.scrollHint} ${isScrolling ? styles.scrollHintHidden : ""}`}>
          <span className={styles.scrollHintInner}>Scroll</span>
        </p>
      )}
    </div>
  );
}
