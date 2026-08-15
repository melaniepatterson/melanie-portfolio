import { useState, useEffect, useRef } from "react";
import still from "./images/melanie-patterson-decision-letter-text.webp";
import risdConfettiCode from "./ConfettiCode.txt?raw";
import styles from "./ConfettiDemo.module.css";

export default function ConfettiDemo() {
  const runningInline = useRef(false);
  const runningLightbox = useRef(false);
  const hasAutoPlayedRef = useRef(false);
  const [expanded, setExpanded] = useState(false);
  const wrapperRef = useRef(null);
  const lightboxRef = useRef(null);

  function runConfetti(container, runningRef) {
    if (!container || runningRef.current) return;
    runningRef.current = true;
    try {
      const fn = new Function('container', 'onComplete', risdConfettiCode);
      fn(container, () => { runningRef.current = false; });
    } catch (e) {
      console.error('Confetti error:', e);
      runningRef.current = false;
    }
  }

  useEffect(() => {
    if (expanded && lightboxRef.current) {
      runConfetti(lightboxRef.current, runningLightbox);
    }
    if (!expanded) {
      runningLightbox.current = false;
    }
  }, [expanded]);

  // The inline card only ever triggers confetti via onMouseEnter below,
  // which never fires on touch devices — same root problem as
  // GridFisheye's cursor dependency. Auto-play once, the first time the
  // card actually enters view, rather than looping continuously (which
  // wouldn't read as a deliberate "reveal" the way a single fall does).
  // Tapping through to the lightbox already re-triggers it on open (the
  // effect above isn't hover-gated), so there's a natural "see it again"
  // path without needing a dedicated reset control.
  useEffect(() => {
    if (window.matchMedia("(hover: hover)").matches) return;
    const el = wrapperRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAutoPlayedRef.current) {
          hasAutoPlayedRef.current = true;
          runConfetti(el, runningInline);
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div
        ref={wrapperRef}
        className={styles.wrapper}
        onMouseEnter={() => runConfetti(wrapperRef.current, runningInline)}
        onClick={() => setExpanded(true)}
      >
        <img src={still} alt="RISD admit decision letter" className={styles.image} />
        <div className={styles.expandHint}>⊕</div>
      </div>

      {expanded && (
      <div className={styles.lightboxOverlay}>
        <div className={styles.lightboxOuter}>
          <button className={styles.lightboxClose} onClick={() => setExpanded(false)}>✕</button>
          <div
            ref={lightboxRef}
            className={styles.lightboxInner}
          >
            <img
              src={still}
              alt="RISD admit decision letter"
              className={styles.lightboxImage}
              onMouseEnter={() => runConfetti(lightboxRef.current, runningLightbox)}
            />
          </div>
        </div>
      </div>
      )}
    </>
  );
}