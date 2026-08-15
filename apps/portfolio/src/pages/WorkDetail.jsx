import { useParams, Link } from "react-router-dom";
import { PROJECTS } from "../data/projects";
import styles from "./WorkDetail.module.css";
import { SplitText, useHoverCapable } from "../utils";
import InspirationResult from "../components/InspirationResult";
import AppletResult from "../components/AppletResult";
import BannerStack from "../components/BannerStack";
import DeviceCompare from "../components/DeviceCompare";
import Lightbox from "../components/Lightbox";
import CodeReveal from "../components/CodeReveal";
import BrowserFrame from "../components/BrowserFrame";
import Caption from "../components/Caption";
import ShimmerImage, { Skeleton } from "../components/Skeleton";
import LazyOnVisible from "../components/LazyOnVisible";
import VisibilityGatedVideo from "../components/VisibilityGatedVideo";
import { useEffect, Suspense, lazy, useState } from "react";

const heroCache = {};
const galleryComponentCache = {};
const sessionGalleryData = {};

function getGalleryData(project) {
  if (!sessionGalleryData[project.slug]) {
    // Shuffle a copy of the gallery images (everything after the hero)
    const images = [...project.images.slice(1)];
    for (let i = images.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [images[i], images[j]] = [images[j], images[i]];
    }
    sessionGalleryData[project.slug] = { images };
  }
  return sessionGalleryData[project.slug];
}

function LazyHero({ loader, fallbackSrc, fallbackAlt, fallbackWidth, fallbackHeight }) {
  if (!heroCache[loader]) {
    heroCache[loader] = lazy(loader);
  }
  const Component = heroCache[loader];
  // Same fallback convention as LazyAppletComponent/LazyBannerComponent in
  // AppletResult.jsx — an image-backed fallback where one exists, otherwise
  // a bare aspect-ratio skeleton (a custom Hero component's actual visual
  // may not have a static image counterpart at all, e.g. RISD's is a video).
  const fallback = fallbackSrc
    ? <ShimmerImage src={fallbackSrc} alt={fallbackAlt} width={fallbackWidth} height={fallbackHeight} />
    : <Skeleton ratio={fallbackWidth && fallbackHeight ? `${fallbackWidth} / ${fallbackHeight}` : undefined} />;
  return (
    <Suspense fallback={fallback}>
      <Component />
    </Suspense>
  );
}

// Generic slot for dropping any one-off custom component (e.g. GlowUpFloat,
// DeviceCompare) into the gallery grid like it was just another image —
// type: "component" + component: () => import(...), same lazy-loader
// convention as the hero/thumbnail/applet slots elsewhere in this codebase.
// `ratio` (CSS aspect-ratio, e.g. "927.98 / 1920") sizes the shimmer
// fallback to roughly match what the component will render, so it doesn't
// pop in at full height from nothing once the chunk loads.
function LazyGalleryComponent({ loader, ratio }) {
  if (!galleryComponentCache[loader]) {
    galleryComponentCache[loader] = lazy(loader);
  }
  const Component = galleryComponentCache[loader];
  const fallback = <Skeleton ratio={ratio} />;
  return (
    <LazyOnVisible placeholder={fallback}>
      <Suspense fallback={fallback}>
        <Component />
      </Suspense>
    </LazyOnVisible>
  );
}

export default function WorkDetail() {
  const { slug } = useParams();
  const project = PROJECTS.find(p => p.slug === slug);
  const [lightbox, setLightbox] = useState(null);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640);
  const hoverCapable = useHoverCapable();

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    // See Work.jsx — Liquid Glass falls back to html/body's real
    // background-color, so body needs this synced too, not just html.
    document.documentElement.style.backgroundColor = "#C93500";
    document.body.style.backgroundColor = "#C93500";
    return () => {
      document.documentElement.style.backgroundColor = "";
      document.body.style.backgroundColor = "";
    };
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (!project) return (
    <div className={styles.page}>
      <p>Project not found.</p>
      <Link to="/portfolio"><SplitText>← Back to Portfolio</SplitText></Link>
    </div>
  );

  const { images: galleryImages } = getGalleryData(project);

  // These types are always the wide/large slot — same list this codebase
  // has used all along (see the old computeRowBreaks isLarge check) —
  // everything else falls back to img.size === "large".
  function isLargeItem(img) {
    return img.size === "large"
     // || img.type === "inspiration-result"
      || img.type === "applet-result"
      || img.type === "device-compare";
  }

  // One render path shared by both placements below — on desktop these
  // flow inside the hero's own column (in a 2-col mini-masonry, see
  // .galleryFlow) so they keep pace with a long description instead of
  // waiting for the whole two-column block to finish; on mobile they
  // render in their own full-width section after it, same as before.
  function renderGalleryItem(img, i) {
    const sizeClass = isLargeItem(img) ? styles.galleryLarge : styles.gallerySmall;

    if (img.type === "inspiration-result") {
      return (
        <div key={i} className={`${styles.galleryItem} ${sizeClass}`}>
          <InspirationResult
            {...img}
            onLightbox={(src, alt) => setLightbox({ src, alt })}
          />
        </div>
      );
    }

    if (img.type === "applet-result") {
      return (
        <div key={i} className={`${styles.galleryItem} ${sizeClass}`}>
          <AppletResult
            {...img}
            onLightbox={(src, alt) => setLightbox({ src, alt })}
          />
        </div>
      );
    }

    if (img.type === "device-compare") {
      return (
        <div key={i} className={`${styles.galleryItem} ${sizeClass}`}>
          <DeviceCompare {...img} />
        </div>
      );
    }

    if (img.type === "banner-stack") {
      return (
        <div key={i} className={`${styles.galleryItem} ${sizeClass}`}>
          <BannerStack
            images={img.images}
            caption={img.caption}
            onLightbox={(src, alt) => setLightbox({ src, alt })}
          />
        </div>
      );
    }

    if (img.type === "component") {
      return (
        <div key={i} className={`${styles.galleryItem} ${sizeClass}`}>
          <LazyGalleryComponent loader={img.component} ratio={img.ratio} />
          {img.caption && <Caption className={styles.caption}>{img.caption}</Caption>}
        </div>
      );
    }

    if (img.type === "code-reveal") {
      return (
        <div key={i} className={`${styles.galleryItem} ${sizeClass}`}>
          <CodeReveal still={img.still} alt={img.alt} code={img.code} />
        </div>
      );
    }

    if (img.type === "browser-frame") {
      return (
        <div key={i} className={`${styles.galleryItem} ${sizeClass}`}>
          <BrowserFrame src={img.src} alt={img.alt} width={img.width} height={img.height} />
          {img.caption && <Caption className={styles.caption}>{img.caption}</Caption>}
        </div>
      );
    }

    // Lightbox only knows how to render <img> — video items skip it
    // entirely rather than opening a broken image, same treatment as
    // BannerStack's video items.
    const isVideo = typeof img.src === "string" && img.src.endsWith(".webm");
    const lightboxable = img.lightbox && !isVideo;
    const openLightbox = () => lightboxable && setLightbox({ src: img.src, alt: img.alt });
    return (
      <div
        key={i}
        className={`${styles.galleryItem} ${sizeClass} ${lightboxable ? styles.lightboxable : ""}`}
        onClick={openLightbox}
        role={lightboxable ? "button" : undefined}
        tabIndex={lightboxable ? 0 : undefined}
        onKeyDown={lightboxable ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openLightbox(); } } : undefined}
        aria-label={lightboxable ? `View larger: ${img.alt}` : undefined}
      >
        {isVideo ? (
          <VisibilityGatedVideo src={img.src} alt={img.alt} width={img.width} height={img.height} />
        ) : (
          <ShimmerImage src={img.src} alt={img.alt} width={img.width} height={img.height} loading="lazy" />
        )}
        {lightboxable && <div className={styles.lightboxHint} aria-hidden="true">⊕</div>}
        {img.caption && <Caption className={styles.caption}>{img.caption}</Caption>}
        {img.hoverHint && hoverCapable && <p className={styles.hoverHint}>Hover to interact</p>}
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Link to="/portfolio" className={styles.back}><SplitText>{isMobile ? "← Back" : "← Work"}</SplitText></Link>

      <div className={styles.layout}>
        <div className={styles.images}>
          {project.hero ? (
            <LazyHero
              loader={project.hero}
              fallbackSrc={project.images[0].src?.endsWith(".webm") ? undefined : project.images[0].src}
              fallbackAlt={project.images[0].alt}
              fallbackWidth={project.images[0].width}
              fallbackHeight={project.images[0].height}
            />
          ) : (
            <ShimmerImage src={project.images[0].src} alt={project.images[0].alt} width={project.images[0].width} height={project.images[0].height} />
          )}
          {/* Desktop only — flows down this column alongside the description
              on the right (instead of waiting for that column to finish),
              in the same 2-col small/large mini-masonry the full-width
              gallery used to use. */}
          {!isMobile && galleryImages.length > 0 && (
            <div className={styles.galleryFlow}>
              {galleryImages.map(renderGalleryItem)}
            </div>
          )}
        </div>

        <div className={styles.info}>
          <h1 className={styles.title}>{project.title}</h1>
          <p className={styles.meta}>
            {project.disciplines.join(" · ")} · {project.year}
          </p>
          {project.client && (
            <p className={styles.client} style={{ fontStyle: "italic" }}>
              Client: {project.client.url ? (
                <a href={project.client.url} target="_blank" rel="noopener noreferrer" className={styles.clientLink}>
                  {project.client.name}
                  <span className="sr-only"> (opens in new window)</span>
                </a>
              ) : (
                project.client.name
              )}
            </p>
          )}
          <div className={styles.description}>{project.description}</div>
          {project.topics && (
            <p className={styles.topics}>{project.topics.join(" · ")}</p>
          )}
          {project.externalLink && (
            <a
              href={project.externalLink}
              target={project.externalLink.startsWith("http") ? "_blank" : undefined}
              rel={project.externalLink.startsWith("http") ? "noopener noreferrer" : undefined}
              className={styles.link}
            >
              <SplitText>{project.externalLinkLabel || "View Project"}</SplitText>
              {project.externalLink.startsWith("http") ? " ↗︎" : ""}
              {project.externalLink.startsWith("http") && <span className="sr-only"> (opens in new window)</span>}
            </a>
          )}
        </div>
      </div>

      {/* Mobile only — desktop's copy of this list renders inside .images
          above instead. */}
      {isMobile && galleryImages.length > 0 && (
        <div className={styles.gallery}>
          {galleryImages.map(renderGalleryItem)}
        </div>
      )}

      {lightbox && (
        <Lightbox
          src={lightbox.src}
          alt={lightbox.alt}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  );
}