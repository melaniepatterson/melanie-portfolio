import styles from "./BannerStack.module.css";
import Caption from "./Caption";
import ShimmerImage from "./Skeleton";

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
          role={onLightbox ? "button" : undefined}
          tabIndex={onLightbox ? 0 : undefined}
          onKeyDown={onLightbox ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onLightbox(img.src, img.alt); } } : undefined}
          aria-label={onLightbox ? `View larger: ${img.alt}` : undefined}
        >
          {onLightbox && <div className={styles.lightboxHint} aria-hidden="true">⊕</div>}
          <ShimmerImage src={img.src} alt={img.alt} width={img.width} height={img.height} />
        </div>
      ))}
      {caption && <Caption className={styles.caption}>{caption}</Caption>}
    </div>
  );
}
