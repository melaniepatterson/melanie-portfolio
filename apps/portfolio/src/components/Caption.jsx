import { useEffect, useRef, useState } from "react";
import styles from "./Caption.module.css";

// Shared caption treatment for gallery pieces. The trigger text clamps to
// one line below the mobile breakpoint (full text above it) — tapping it
// opens the full caption as an absolutely-positioned flyout anchored to
// the piece, so it sits on top of the page instead of pushing content
// down. Closes on outside tap/Escape.
export default function Caption({ children, className = "" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    function handleKeyDown(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  if (!children) return null;

  return (
    <div ref={ref} className={`${styles.wrapper} ${className}`}>
      <button
        type="button"
        className={styles.trigger}
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
        aria-expanded={open}
      >
        {children}
      </button>
      {open && (
        <div className={styles.flyout} role="tooltip" onClick={(e) => e.stopPropagation()}>
          {children}
        </div>
      )}
    </div>
  );
}
