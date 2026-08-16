import { useState } from "react";
import styles from "./Caption.module.css";

// Shared caption treatment for gallery pieces. Below the mobile breakpoint
// the caption clamps to one line with a trailing chevron signaling there's
// more — tapping toggles the same text between clamped and full in place.
// (Previously this opened a separate flyout that repeated the full text
// right next to the already-visible trigger, reading as a duplicate.)
// Above that breakpoint the full caption always shows plainly, no toggle.
export default function Caption({ children, className = "" }) {
  const [open, setOpen] = useState(false);

  if (!children) return null;

  return (
    <button
      type="button"
      className={`${styles.trigger} ${open ? styles.open : ""} ${className}`}
      onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
      aria-expanded={open}
    >
      <span className={styles.text}>{children}</span>
      <svg className={styles.chevron} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </button>
  );
}
