import { useEffect } from "react";
import styles from "./Lightbox.module.css";

export default function Lightbox({ src, alt, onClose }) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div className={styles.overlay}>
      <div className={styles.inner}>
        <button className={styles.close} onClick={onClose}>✕</button>
        <img src={src} alt={alt} className={styles.image} />
      </div>
    </div>
  );
}