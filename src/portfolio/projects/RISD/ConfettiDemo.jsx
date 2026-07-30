import { useState, useEffect, useRef } from "react";
import still from "./images/melanie-patterson-decision-letter-text.webp";
import risdConfettiCode from "./ConfettiCode.txt?raw";
import styles from "./ConfettiDemo.module.css";

export default function ConfettiDemo() {
  const runningInline = useRef(false);
  const runningLightbox = useRef(false);
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