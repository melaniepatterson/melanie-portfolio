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
 */
export default function BrowserFrame({ src, alt = '' }) {
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
        viewBox="17 21 3420 1899"
        xmlns="http://www.w3.org/2000/svg"
        className={styles.svg}
        aria-label={alt || 'Browser screenshot'}
      >
        <defs>
          <clipPath id="browserFrameClip">
            <rect x="21" y="24" width="3412" height="1872" rx="46" ry="46" />
          </clipPath>
        </defs>

        <g clipPath="url(#browserFrameClip)">
          <foreignObject x="21" y="137" width="3412" height="1756">
            <div
              xmlns="http://www.w3.org/1999/xhtml"
              className={styles.scrollContainer}
              onScroll={handleScroll}
            >
              <img src={src} alt={alt} className={styles.screenshot} />
            </div>
          </foreignObject>
        </g>

        <g style={{ mixBlendMode: 'multiply' }}>
          <path
            d="m3388 26.095c25.916 0 47 21.084 47 47v1773.8c0 25.916-21.084 47-47 47h-3319.4c-25.916 0-47-21.084-47-47v-1773.8c0-25.916 21.084-47 47-47h3319.4m0-3h-3319.4c-27.5 0-50 22.5-50 50v1773.8c0 27.5 22.5 50 50 50h3319.4c27.5 0 50-22.5 50-50v-1773.8c0-27.5-22.5-50-50-50z"
            fill="#982511"
          />
          <path
            d="m75.221 67.073c6.758 0 12.257 5.498 12.257 12.257s-5.498 12.257-12.257 12.257-12.257-5.498-12.257-12.257 5.498-12.257 12.257-12.257m0-3c-8.426 0-15.257 6.831-15.257 15.257s6.831 15.257 15.257 15.257 15.257-6.831 15.257-15.257-6.831-15.257-15.257-15.257z"
            fill="#982511"
          />
          <path
            d="m115.54 67.073c6.758 0 12.257 5.498 12.257 12.257s-5.498 12.257-12.257 12.257-12.257-5.498-12.257-12.257 5.498-12.257 12.257-12.257m0-3c-8.426 0-15.257 6.831-15.257 15.257s6.831 15.257 15.257 15.257 15.257-6.831 15.257-15.257-6.831-15.257-15.257-15.257z"
            fill="#982511"
          />
          <path
            d="m155.86 67.073c6.758 0 12.257 5.498 12.257 12.257s-5.498 12.257-12.257 12.257-12.257-5.498-12.257-12.257 5.498-12.257 12.257-12.257m0-3c-8.426 0-15.257 6.831-15.257 15.257s6.831 15.257 15.257 15.257 15.257-6.831 15.257-15.257-6.831-15.257-15.257-15.257z"
            fill="#982511"
          />
          <path
            d="m3357 56.72c12.467 0 22.609 10.142 22.609 22.609s-10.143 22.609-22.609 22.609h-3112.4c-12.467 0-22.609-10.143-22.609-22.609s10.143-22.609 22.609-22.609h3112.4m0-3h-3112.4c-14.085 0-25.609 11.524-25.609 25.609s11.524 25.609 25.609 25.609h3112.4c14.085 0 25.609-11.524 25.609-25.609s-11.524-25.609-25.609-25.609z"
            fill="#982511"
          />
          <line
            x1="18.675"
            x2="3435.1"
            y1="134.45"
            y2="134.45"
            fill="none"
            stroke="#982511"
            strokeMiterlimit="10"
            strokeWidth="3"
          />
        </g>
      </svg>

      <p className={`${styles.scrollHint} ${isScrolling ? styles.scrollHintHidden : ''}`}>
        <span className={styles.scrollHintInner}>Scroll</span>
      </p>
    </div>
  );
}