import { useState, useRef, useEffect } from 'react';
import styles from './BrowserFrame.module.css';

/**
 * BrowserFrame
 * Renders a scrollable screenshot inside browser-window chrome.
 *
 * Rebuilt without a foreignObject — real Safari has a longstanding bug
 * where foreignObject content doesn't reliably respect the ambient SVG's
 * viewBox scaling, rendering at literal pixel values instead and
 * escaping the frame's clip (confirmed on-device: screenshots showing
 * zoomed-in fragments, or not rendering at all). The screenshot now
 * lives as a plain HTML layer sized with ordinary CSS percentages
 * against an aspect-ratio container; the SVG chrome is a purely
 * decorative pointer-events: none overlay on top, with nothing living
 * inside it that Safari's foreignObject bug could ever apply to.
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
      {/* Screen area, as a % of the frame — matches the chrome art's own
          drawn border (x=21.6 y=137.45 w=3413.4 h=1756.4 out of the
          3464.9x1920 viewBox). Bottom corner radius (47 units) expressed
          as two percentages (horizontal % of width / vertical % of
          height) so it stays exactly circular at any rendered size. */}
      <div
        className={styles.scrollContainer}
        onScroll={handleScroll}
        style={{
          position: 'absolute',
          left: '0.6234%',
          top: '7.1589%',
          width: '98.5138%',
          height: '91.4792%',
          borderRadius: '0 0 1.3768% 1.3768% / 0 0 2.6764% 2.6764%',
        }}
      >
        <img src={src} alt={alt} width={width} height={height} className={styles.screenshot} />
      </div>

      <svg
        viewBox="0 0 3464.9 1920"
        xmlns="http://www.w3.org/2000/svg"
        className={styles.chromeSvg}
        aria-label={alt || 'Browser screenshot'}
      >
        <g style={{ mixBlendMode: 'multiply' }}>
          {/* Top bar background with the traffic-light dots and address-bar
              pill cut out as true holes (opposite-winding subpaths in one
              compound path) — reads straight through to the page
              background behind this now purely decorative overlay. */}
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
