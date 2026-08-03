import styles from "./BannerStack.module.css";

// Groups a run of banners (default: 3) that belong together — one shared
// caption underneath, instead of repeating the same credit/description
// under each one individually.
export default function BannerStack({ images = [], caption, onLightbox }) {
  return (
    <div className={styles.wrapper}>
      {images.map((img, i) => (
        <div
          key={i}
          className={`${styles.item} ${onLightbox ? styles.lightboxable : ""}`}
          onClick={() => onLightbox && onLightbox(img.src, img.alt)}
        >
          {onLightbox && <div className={styles.lightboxHint}>⊕</div>}
          <img src={img.src} alt={img.alt} />
        </div>
      ))}
      {caption && <p className={styles.caption}>{caption}</p>}
    </div>
  );
}
