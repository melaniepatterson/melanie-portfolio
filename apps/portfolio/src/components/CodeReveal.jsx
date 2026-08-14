import { useState } from "react";
import styles from "./CodeReveal.module.css";

export default function CodeReveal({ still, alt, code }) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div
      className={styles.wrapper}
      tabIndex={0}
      onMouseEnter={() => setRevealed(true)}
      onMouseLeave={() => setRevealed(false)}
      onFocus={() => setRevealed(true)}
      onBlur={() => setRevealed(false)}
    >
      <img src={still} alt={alt} className={styles.image} />
      <div className={`${styles.overlay} ${revealed ? styles.visible : ""}`}>
        <pre className={styles.code}>{code}</pre>
      </div>
    </div>
  );
}