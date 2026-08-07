import BrowserFrame from "./BrowserFrame";
import Caption from "./Caption";
import styles from "./DeviceCompare.module.css";

// A phone mockup beside BrowserFrame's existing browser-window chrome, for
// showing the mobile and desktop version of the same screen side by side.
export default function DeviceCompare({
  desktopSrc,
  desktopAlt = "",
  mobileSrc,
  mobileAlt = "",
  caption,
}) {
  return (
    <div>
      <div className={styles.wrapper}>
        <div className={styles.desktop}>
          <BrowserFrame src={desktopSrc} alt={desktopAlt} />
        </div>
        <div className={styles.phone}>
          <div className={styles.phoneFrame}>
            <div className={styles.notch} />
            <div className={styles.phoneScreen}>
              <img src={mobileSrc} alt={mobileAlt} />
            </div>
            <div className={styles.homeIndicator} />
          </div>
        </div>
      </div>
      {caption && <Caption className={styles.caption}>{caption}</Caption>}
    </div>
  );
}
