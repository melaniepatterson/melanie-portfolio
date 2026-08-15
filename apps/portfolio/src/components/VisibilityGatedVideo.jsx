import { useRef, useEffect } from "react";
import skeletonStyles from "./Skeleton.module.css";

// Autoplaying video (no UI, muted, looping) that only actually plays while
// on/near screen — with several of these on one page, decoding every one
// continuously regardless of scroll position is real, unbounded CPU/RAM
// cost on weaker machines. This caps concurrent decode to roughly what's
// visible, no matter how many video assets end up on the page. Shares the
// same shimmer wrapper/aspect-ratio treatment as ShimmerImage so it slots
// into any spot a regular image would.
export default function VisibilityGatedVideo({ src, width, height, alt }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { rootMargin: "150px" }
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className={skeletonStyles.shimmer}
      style={{ aspectRatio: width && height ? `${width} / ${height}` : undefined }}
    >
      <video
        ref={videoRef}
        src={src}
        width={width}
        height={height}
        loop
        muted
        playsInline
        disablePictureInPicture
        controls={false}
        aria-label={alt}
        className={skeletonStyles.img}
      />
    </div>
  );
}
