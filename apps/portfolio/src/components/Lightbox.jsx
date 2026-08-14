import { useEffect, useRef } from "react";
import styles from "./Lightbox.module.css";

export default function Lightbox({ src, alt, onClose }) {
  const closeButtonRef = useRef(null);
  const previouslyFocusedRef = useRef(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    previouslyFocusedRef.current = document.activeElement;
    closeButtonRef.current?.focus();
    return () => {
      document.body.style.overflow = "";
      previouslyFocusedRef.current?.focus?.();
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      // Only the close button lives inside this dialog, so trapping Tab
      // just means it never leaves — no need for a full first/last cycle.
      if (e.key === "Tab") {
        e.preventDefault();
        closeButtonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label={alt || "Image preview"}>
      <div className={styles.inner}>
        <button ref={closeButtonRef} className={styles.close} onClick={onClose} aria-label="Close image preview">✕</button>
        <img src={src} alt={alt} className={styles.image} />
      </div>
    </div>
  );
}
