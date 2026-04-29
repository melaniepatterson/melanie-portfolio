import { useParams, Link } from "react-router-dom";
import { PROJECTS } from "../data/projects";
import styles from "./WorkDetail.module.css";
import { SplitText } from "../App";
import InspirationResult from "../components/InspirationResult";
import Lightbox from "../components/Lightbox";
import CodeReveal from "../components/CodeReveal";
import BrowserFrame from "../components/BrowserFrame";
import React, { useEffect, Suspense, lazy, useState } from "react";

const heroCache = {};
const sessionGalleryOffsets = {};
const sessionDetailSpacers = {};

function getSpacers(project) {
  if (!sessionDetailSpacers[project.slug]) {
    sessionDetailSpacers[project.slug] = project.images.slice(1).map(() => Math.random() > 0.6);
  }
  return sessionDetailSpacers[project.slug];
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

function getOffsets(project) {
  if (!sessionGalleryOffsets[project.slug]) {
    sessionGalleryOffsets[project.slug] = project.images.slice(1).map((img) => {
      const maxStart = img.size === "large" || img.type === "inspiration-result" ? 3 : 4;
      return Math.floor(Math.random() * maxStart) + 1;
    });
  }
  return sessionGalleryOffsets[project.slug];
}

export default function WorkDetail() {
  const { slug } = useParams();
  const project = PROJECTS.find(p => p.slug === slug);
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    document.documentElement.style.backgroundColor = "#C93500";
    return () => {
      document.documentElement.style.backgroundColor = "";
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

  return (
    <div className={styles.page}>
      <Link to="/portfolio" className={styles.back}><SplitText>← Work</SplitText></Link>

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
              {project.externalLink.startsWith("http") ? " ↗" : ""}
            </a>
          )}
        </div>
      </div>

      {project.images.length > 1 && (
        <div className={styles.gallery}>
          {project.images.slice(1).map((img, i) => {
            const offsets = getOffsets(project);

            if (img.type === "inspiration-result") {
              return (
                <div
                  key={i}
                  className={`${styles.galleryItem} ${styles.galleryLarge}`}
                >
                  <InspirationResult
                    {...img}
                    onLightbox={(src, alt) => setLightbox({ src, alt })}
                  />
                </div>
              );
            }

            if (img.type === "code-reveal") {
              return (
                <div key={i} className={`${styles.galleryItem} ${img.size === "large" ? styles.galleryLarge : styles.gallerySmall}`} style={{ gridColumnStart: offsets[i] }}>
                  <CodeReveal still={img.still} alt={img.alt} code={img.code} />
                </div>
              );
            }

            if (img.type === "browser-frame") {
              const spacers = getSpacers(project);
              return (
                <React.Fragment key={i}>
                  {spacers[i] && <div className={styles.gallerySpacer} />}
                  <div
                    className={`${styles.galleryItem} ${img.size === "large" ? styles.galleryLarge : styles.gallerySmall}`}
                    style={{ gridColumnStart: offsets[i] }}
                  >
                    <BrowserFrame src={img.src} alt={img.alt} />
                  </div>
                </React.Fragment>
              );
            }

            return (
              <div
                key={i}
                className={`${styles.galleryItem} ${img.size === "large" ? styles.galleryLarge : styles.gallerySmall} ${img.lightbox ? styles.lightboxable : ""}`}
                style={{ gridColumnStart: offsets[i] }}
                onClick={() => img.lightbox && setLightbox({ src: img.src, alt: img.alt })}
              >
                <img src={img.src} alt={img.alt} loading="lazy" />
                {img.lightbox && <div className={styles.lightboxHint}>⊕</div>}
                {img.caption && <p className={styles.caption}>{img.caption}</p>}
                {img.hoverHint && <p className={styles.hoverHint}>Hover to interact</p>}
              </div>
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