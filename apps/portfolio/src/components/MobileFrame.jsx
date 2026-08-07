import styles from "./MobileFrame.module.css";

// Standalone phone-shaped chrome — the same frame DeviceCompare's mobile
// side uses, extracted so it can wrap arbitrary content (a live component,
// not just a screenshot) for gallery items that don't pair with a desktop
// comparison. A placeholder until a custom mobile-device SVG replaces it.
export default function MobileFrame({ children }) {
  return (
    <div className={styles.phoneFrame}>
      <div className={styles.notch} />
      <div className={styles.phoneScreen}>{children}</div>
      <div className={styles.homeIndicator} />
    </div>
  );
}
