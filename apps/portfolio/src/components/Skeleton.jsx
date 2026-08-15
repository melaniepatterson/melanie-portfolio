import { useState } from "react";
import styles from "./Skeleton.module.css";

// Bare shimmer placeholder — for Suspense fallbacks that aren't loading an
// <img> (a lazy-loaded component like an applet or the GlowUp loader
// preview). `ratio` is a CSS aspect-ratio value ("width / height").
export function Skeleton({ ratio, className, style }) {
  return (
    <div
      className={`${styles.shimmer} ${className || ""}`}
      style={{ aspectRatio: ratio, ...style }}
      aria-hidden="true"
    />
  );
}

// <img> wrapped in the same shimmer, sized via width/height so the browser
// reserves the exact final space up front (no cumulative layout shift) —
// the shimmer keeps animating underneath but is fully covered once the
// image decodes, since object-fit: cover fills the box opaquely.
export default function ShimmerImage({
  src,
  srcSet,
  sizes,
  alt,
  width,
  height,
  loading,
  className,
  imgClassName,
  onClick,
  role,
  tabIndex,
  onKeyDown,
  ...rest
}) {
  // The shimmer sweep otherwise keeps animating forever once loaded —
  // it's just invisible, covered by the now-opaque <img>, but the
  // browser still has to do the work. Stopping it once the real image
  // has actually decoded is pure waste avoided, no visual difference.
  const [loaded, setLoaded] = useState(false);
  return (
    <div
      className={`${styles.shimmer} ${loaded ? styles.loaded : ""} ${className || ""}`}
      style={{ aspectRatio: width && height ? `${width} / ${height}` : undefined }}
      onClick={onClick}
      role={role}
      tabIndex={tabIndex}
      onKeyDown={onKeyDown}
    >
      <img
        src={src}
        srcSet={srcSet}
        sizes={sizes}
        alt={alt}
        width={width}
        height={height}
        loading={loading}
        className={`${styles.img} ${imgClassName || ""}`}
        {...rest}
        onLoad={() => setLoaded(true)}
      />
    </div>
  );
}
