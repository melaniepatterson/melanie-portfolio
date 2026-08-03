import { useParams, Link } from "react-router-dom";
import { PROJECTS } from "../data/projects";
import styles from "./WorkDetail.module.css";
import { SplitText } from "../utils";
import InspirationResult from "../components/InspirationResult";
import AppletResult from "../components/AppletResult";
import BannerStack from "../components/BannerStack";
import Lightbox from "../components/Lightbox";
import CodeReveal from "../components/CodeReveal";
import BrowserFrame from "../components/BrowserFrame";
import React, { useEffect, Suspense, lazy, useState } from "react";

const heroCache = {};
const sessionGalleryData = {};

function getGalleryData(project) {
  if (!sessionGalleryData[project.slug]) {
    // Shuffle a copy of the gallery images (everything after the hero)
    const images = [...project.images.slice(1)];
    for (let i = images.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [images[i], images[j]] = [images[j], images[i]];
    }

    // Offsets derived from shuffled order so large/small maxStart is correct
    const offsets = images.map((img) => {
      const maxStart = img.size === "large" || img.type === "inspiration-result" ? 3 : 4;
      return Math.floor(Math.random() * maxStart) + 1;
    });

    const spacers = images.map(() => Math.random() > 0.6);

    sessionGalleryData[project.slug] = { images, offsets, spacers };
  }
  return sessionGalleryData[project.slug];
}

function LazyHero({ loader, fallbackSrc, fallbackAlt }) {
  if (!heroCache[loader]) {
    heroCache[loader] = lazy(loader);
  }
  const Component = heroCache[loader];
  return (
    <Suspense fallback={<img src={fallbackSrc} alt={fallbackAlt} />}>
      <Component />
    </Suspense>
  );
}

// Pre-pass: returns indices that need a 1-col spacer inserted before them
// to prevent two large items from filling an entire row side by side.
// Works with grid-auto-flow: dense so small items can backfill the gap.
function computeRowBreaks(images, offsets) {
  const breaks = new Set();
  let col = 1;

  images.forEach((img, i) => {
    const isLarge = img.size === "large" || img.type === "inspiration-result" || img.type === "applet-result";
    const span = isLarge ? 2 : 1;
    // browser-frame large items use gridColumn: "span 2" (auto-placed, no explicit start)
    const isAutoPlaced = img.type === "browser-frame" && img.size === "large";
    const start = isAutoPlaced ? col : (offsets[i] || col);

    if (isLarge && col === 3) {
      // This large item would land at cols 3–4, pairing with a previous
      // large item at cols 1–2 and filling the entire row.
      // Insert a 1-col spacer at col 3 so the large item wraps to a new row.
      breaks.add(i);
      col = 1 + span; // large item placed at 1–2 on the new row
      if (col > 4) col = 1;
      return;
    }

    col = start + span;
    if (col > 4) col = 1;
  });

  return breaks;
}

export default function WorkDetail() {
  const { slug } = useParams();
  const project = PROJECTS.find(p => p.slug === slug);
  const [lightbox, setLightbox] = useState(null);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640);

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

  const { images: galleryImages, offsets, spacers } = getGalleryData(project);
  const rowBreaks = computeRowBreaks(galleryImages, offsets);

  return (
    <div className={styles.page}>
      <Link to="/portfolio" className={styles.back}><SplitText>{isMobile ? "← Back" : "← Work"}</SplitText></Link>

      <div className={styles.layout}>
        <div className={styles.images}>
          {project.hero ? (
            <LazyHero
              loader={project.hero}
              fallbackSrc={project.images[0].src}
              fallbackAlt={project.images[0].alt}
            />
          ) : (
            <img src={project.images[0].src} alt={project.images[0].alt} />
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
                </a>
              ) : (
                project.client.name
              )}
            </p>
          )}
          <p className={styles.description}>{project.description}</p>
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
              <SplitText>View Project</SplitText>
              {project.externalLink.startsWith("http") ? " ↗︎" : ""}
            </a>
          )}
        </div>
      </div>

      {galleryImages.length > 0 && (
        <div className={styles.gallery}>
          {galleryImages.map((img, i) => {

            if (img.type === "inspiration-result") {
              return (
                <React.Fragment key={i}>
                  {!isMobile && rowBreaks.has(i) && <div className={styles.galleryRowBreak} />}
                  <div className={`${styles.galleryItem} ${styles.galleryLarge}`}>
                    <InspirationResult
                      {...img}
                      onLightbox={(src, alt) => setLightbox({ src, alt })}
                    />
                  </div>
                </React.Fragment>
              );
            }

            if (img.type === "applet-result") {
              return (
                <React.Fragment key={i}>
                  {!isMobile && rowBreaks.has(i) && <div className={styles.galleryRowBreak} />}
                  <div className={`${styles.galleryItem} ${styles.galleryLarge}`}>
                    <AppletResult
                      {...img}
                      onLightbox={(src, alt) => setLightbox({ src, alt })}
                    />
                  </div>
                </React.Fragment>
              );
            }

            if (img.type === "banner-stack") {
              return (
                <React.Fragment key={i}>
                  {!isMobile && rowBreaks.has(i) && <div className={styles.galleryRowBreak} />}
                  <div
                    className={`${styles.galleryItem} ${img.size === "large" ? styles.galleryLarge : styles.gallerySmall}`}
                    style={isMobile ? undefined : { gridColumnStart: offsets[i] }}
                  >
                    <BannerStack
                      images={img.images}
                      caption={img.caption}
                      onLightbox={(src, alt) => setLightbox({ src, alt })}
                    />
                  </div>
                </React.Fragment>
              );
            }

            if (img.type === "code-reveal") {
              return (
                <React.Fragment key={i}>
                  {!isMobile && rowBreaks.has(i) && <div className={styles.galleryRowBreak} />}
                  <div
                    className={`${styles.galleryItem} ${img.size === "large" ? styles.galleryLarge : styles.gallerySmall}`}
                    style={isMobile ? undefined : { gridColumnStart: offsets[i] }}
                  >
                    <CodeReveal still={img.still} alt={img.alt} code={img.code} />
                  </div>
                </React.Fragment>
              );
            }

            if (img.type === "browser-frame") {
              return (
                <React.Fragment key={i}>
                  {!isMobile && rowBreaks.has(i) && <div className={styles.galleryRowBreak} />}
                  {!isMobile && spacers[i] && <div className={styles.gallerySpacer} />}
                  <div
                    className={`${styles.galleryItem} ${img.size === "large" ? styles.galleryLarge : styles.gallerySmall}`}
                    style={
                      isMobile
                        ? undefined
                        : img.size === "large"
                        ? { gridColumn: "span 2" }
                        : { gridColumnStart: offsets[i] }
                    }
                  >
                    <BrowserFrame src={img.src} alt={img.alt} />
                    {img.caption && <p className={styles.caption}>{img.caption}</p>}
                  </div>
                </React.Fragment>
              );
            }

            return (
              <React.Fragment key={i}>
                {!isMobile && rowBreaks.has(i) && <div className={styles.galleryRowBreak} />}
                <div
                  className={`${styles.galleryItem} ${img.size === "large" ? styles.galleryLarge : styles.gallerySmall} ${img.lightbox ? styles.lightboxable : ""}`}
                  style={isMobile ? undefined : { gridColumnStart: offsets[i] }}
                  onClick={() => img.lightbox && setLightbox({ src: img.src, alt: img.alt })}
                >
                  <img src={img.src} alt={img.alt} loading="lazy" />
                  {img.lightbox && <div className={styles.lightboxHint}>⊕</div>}
                  {img.caption && <p className={styles.caption}>{img.caption}</p>}
                  {img.hoverHint && <p className={styles.hoverHint}>Hover to interact</p>}
                </div>
              </React.Fragment>
            );
          })}
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