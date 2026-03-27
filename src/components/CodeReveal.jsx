import { useState } from "react";
import styles from "./CodeReveal.module.css";

export default function CodeReveal({ code }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className={styles.wrapper}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <img src={still} alt="Animation preview" className={styles.image} />
      <div className={`${styles.overlay} ${hovered ? styles.visible : ""}`}>
        <pre className={styles.code}>{code}</pre>
      </div>
    </div>
  );
}