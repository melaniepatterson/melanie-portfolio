import styles from "./BannerStack.module.css";
import Caption from "./Caption";
import ShimmerImage from "./Skeleton";
import VisibilityGatedVideo from "./VisibilityGatedVideo";

// Groups a run of banners (default: 3) that belong together — one shared
// caption underneath, instead of repeating the same credit/description
// under each one individually.
export default function BannerStack({ images = [], caption, onLightbox }) {
  return (
    <div className={styles.wrapper}>
      {images.map((img, i) => {
        const isVideo = typeof img.src === "string" && img.src.endsWith(".webm");
        // Lightbox only knows how to render <img> — video banners skip
        // it entirely rather than opening a broken image.
        const lightboxable = onLightbox && !isVideo;
        return (
          <div
            key={i}
            className={`${styles.item} ${lightboxable ? styles.lightboxable : ""}`}
            onClick={() => lightboxable && onLightbox(img.src, img.alt)}
            role={lightboxable ? "button" : undefined}
            tabIndex={lightboxable ? 0 : undefined}
            onKeyDown={lightboxable ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onLightbox(img.src, img.alt); } } : undefined}
            aria-label={lightboxable ? `View larger: ${img.alt}` : undefined}
          >
            {lightboxable && <div className={styles.lightboxHint} aria-hidden="true">⊕</div>}
            {isVideo ? (
              <VisibilityGatedVideo src={img.src} alt={img.alt} width={img.width} height={img.height} />
            ) : (
              <ShimmerImage src={img.src} alt={img.alt} width={img.width} height={img.height} />
            )}
          </div>
        );
      })}
      {caption && <Caption className={styles.caption}>{caption}</Caption>}
    </div>
  );
}
