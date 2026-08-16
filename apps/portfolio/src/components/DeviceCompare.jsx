import { useEffect, useRef, useState } from "react";
import BrowserFrame from "./BrowserFrame";
import MobileFrame from "./MobileFrame";
import Caption from "./Caption";
import styles from "./DeviceCompare.module.css";

// BrowserFrame's and MobileFrame's own SVG viewBox ratios (width / height) —
// the two frames don't share an aspect ratio, so simple flex-grow can't
// make them share a height while exactly filling the row's width: one
// combination of widths does that math, and it depends on the row's
// current width, so it's computed here instead of guessed in CSS.
const DESKTOP_RATIO = 3464.9 / 1920;
const PHONE_RATIO = 927.98 / 1920;

// A phone mockup beside BrowserFrame's existing browser-window chrome, for
// showing the mobile and desktop version of the same screen side by side.
export default function DeviceCompare({
  desktopSrc,
  desktopAlt = "",
  mobileSrc,
  mobileAlt = "",
  caption,
}) {
  const wrapperRef = useRef(null);
  const [height, setHeight] = useState(null);
  // Below 640px the two frames stack instead of sitting side by side (see
  // .wrapper in the CSS) — each one just needs its own aspect-ratio-driven
  // height at full container width, not a shared computed height solving
  // for two different ratios sharing one row. Squeezed side by side at
  // mobile widths, both frames rendered tiny; full width each, stacked,
  // is dramatically bigger.
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el || isMobile) {
      setHeight(null);
      return;
    }

    // Setting height on the element we're observing changes its own resize
    // entries too (border-box size includes height), which would otherwise
    // re-trigger this observer every time it runs. Gating on width — the
    // only thing that should ever move the computed height — breaks that
    // feedback loop instead of chasing sub-pixel float jitter forever.
    let lastWidth = null;
    function measure(width) {
      if (lastWidth !== null && Math.abs(width - lastWidth) < 0.5) return;
      lastWidth = width;
      const gap = parseFloat(getComputedStyle(el).columnGap) || 0;
      setHeight((width - gap) / (DESKTOP_RATIO + PHONE_RATIO));
    }

    measure(el.getBoundingClientRect().width);
    const observer = new ResizeObserver(([entry]) => {
      const width = entry.contentBoxSize?.[0]?.inlineSize ?? entry.contentRect.width;
      measure(width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [isMobile]);

  return (
    <div>
      <div
        className={styles.wrapper}
        ref={wrapperRef}
        style={height ? { height } : undefined}
      >
        <div className={styles.desktop}>
          <BrowserFrame src={desktopSrc} alt={desktopAlt} />
        </div>
        <div className={styles.phone}>
          <MobileFrame scrollable matchHeight>
            <img src={mobileSrc} alt={mobileAlt} />
          </MobileFrame>
        </div>
      </div>
      {caption && <Caption className={styles.caption}>{caption}</Caption>}
    </div>
  );
}
