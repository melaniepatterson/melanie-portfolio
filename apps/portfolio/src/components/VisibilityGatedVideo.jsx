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
        width={width}
        height={height}
        loop
        muted
        playsInline
        disablePictureInPicture
        controls={false}
        // No dialogue/narration to caption — this is silent background
        // motion. When there's no alt text it's purely decorative (e.g.
        // the RISD hero), so hide it from assistive tech entirely rather
        // than expose an empty accessible name; otherwise keep the label,
        // since some of these videos are the actual work being shown.
        aria-hidden={alt ? undefined : "true"}
        aria-label={alt || undefined}
        className={skeletonStyles.img}
      >
        <source src={src} type="video/webm" />
        {/* Safari (desktop and iOS both) has no VP9/WebM decode support at
            all — the source above silently fails there rather than being
            slow, so every .webm on the site has a matching H.264 .mp4
            sitting right next to it for Safari to fall back to. */}
        <source src={src.replace(/\.webm$/, ".mp4")} type="video/mp4" />
      </video>
    </div>
  );
}
