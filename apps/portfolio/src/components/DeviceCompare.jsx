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
const DESKTOP_RATIO = 3420 / 1899;
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

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    function measure() {
      const gap = parseFloat(getComputedStyle(el).columnGap) || 0;
      const availableWidth = el.clientWidth - gap;
      setHeight(availableWidth / (DESKTOP_RATIO + PHONE_RATIO));
    }

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

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
