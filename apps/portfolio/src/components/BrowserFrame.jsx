import React, { useState, useRef, useEffect } from 'react';
import styles from './BrowserFrame.module.css';

/**
 * BrowserFrame
 * Renders a scrollable screenshot inside an SVG browser-window chrome.
 * The chrome uses mix-blend-mode: multiply so it overlays the image.
 *
 * Props:
 *   src      — image URL/path for the screenshot
 *   alt      — alt text for the screenshot image (optional)
 *   width    — intrinsic pixel width of the screenshot (avoids CLS)
 *   height   — intrinsic pixel height of the screenshot (avoids CLS)
 */
export default function BrowserFrame({ src, alt = '', width, height }) {
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimer = useRef(null);

  useEffect(() => {
    return () => clearTimeout(scrollTimer.current);
  }, []);

  const handleScroll = () => {
    setIsScrolling(true);
    clearTimeout(scrollTimer.current);
    scrollTimer.current = setTimeout(() => {
      setIsScrolling(false);
    }, 1000);
  };

  return (
    <div className={styles.wrapper}>
      <svg
        viewBox="0 0 3464.9 1920"
        xmlns="http://www.w3.org/2000/svg"
        className={styles.svg}
        aria-label={alt || 'Browser screenshot'}
      >
        <defs>
          {/* Square top corners (flush against the flat bottom edge of the
              top bar right above), rounded bottom corners matching the
              body ring's own radius — a uniform rx/ry on a <rect> here
              would round the top corners too, leaving a visible rounded
              notch right under the top bar's flat edge. */}
          <clipPath id="browserFrameClip">
            <path d="M21.6 137.45H3435V1846.85A47 47 0 0 1 3388 1893.85H68.6A47 47 0 0 1 21.6 1846.85Z" />
          </clipPath>
        </defs>

        <g clipPath="url(#browserFrameClip)">
          <foreignObject x="21.6" y="137.45" width="3413.4" height="1756.4">
            <div
              xmlns="http://www.w3.org/1999/xhtml"
              className={styles.scrollContainer}
              onScroll={handleScroll}
            >
              <img src={src} alt={alt} width={width} height={height} className={styles.screenshot} />
            </div>
          </foreignObject>
        </g>

        <g style={{ mixBlendMode: 'multiply' }}>
          {/* Top bar background with the traffic-light dots and address-bar
              pill cut out as true holes (opposite-winding subpaths in one
              compound path) — sits entirely above the foreignObject, so
              there's no content underneath to worry about; the holes just
              read straight through to the page background. */}
          <path
            d="m3388 23.1h-3319.4c-27.5 0-50 22.5-50 50v61.36h3419.4v-61.36c0-27.5-22.5-50-50-50zm-3312.8 71.49c-8.43 0-15.26-6.83-15.26-15.26s6.83-15.26 15.26-15.26 15.26 6.83 15.26 15.26-6.83 15.26-15.26 15.26zm40.32 0c-8.43 0-15.26-6.83-15.26-15.26s6.83-15.26 15.26-15.26 15.26 6.83 15.26 15.26-6.83 15.26-15.26 15.26zm40.32 0c-8.43 0-15.26-6.83-15.26-15.26s6.83-15.26 15.26-15.26 15.26 6.83 15.26 15.26-6.83 15.26-15.26 15.26zm3226.8-15.26c0 14.09-11.52 25.61-25.61 25.61h-3112.4c-14.09 0-25.61-11.52-25.61-25.61s11.52-25.61 25.61-25.61h3112.4c14.08 0 25.61 11.52 25.61 25.61z"
            fill="#982511"
          />
          <path
            d="m3435 137.45v1709.4c0 25.92-21.08 47-47 47h-3319.4c-25.92 0-47-21.08-47-47v-1709.4h3413.4zm3-3h-3419.4v1712.4c0 27.5 22.5 50 50 50h3319.4c27.5 0 50-22.5 50-50v-1712.4z"
            fill="#982511"
          />
        </g>
      </svg>

      <p className={`${styles.scrollHint} ${isScrolling ? styles.scrollHintHidden : ''}`}>
        <span className={styles.scrollHintInner}>Scroll to interact</span>
      </p>
    </div>
  );
}