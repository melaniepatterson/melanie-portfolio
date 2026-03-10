import { useParams, Link } from "react-router-dom";
import { PROJECTS } from "../data/projects";
import styles from "./WorkDetail.module.css";
import { useEffect } from "react";
import { SplitText } from "../App";


const GALLERY_SIZES = ["gallerySmall", "galleryMedium", "galleryWide", "galleryLarge"];

export default function WorkDetail() {
  const { slug } = useParams();
  const project = PROJECTS.find(p => p.slug === slug);

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
          <img src={project.images[0].src} alt={project.images[0].alt} />
        </div>

        <div className={styles.info}>
          <h1 className={styles.title}>{project.title}</h1>
          <p className={styles.meta}>
            {project.disciplines.join(" · ")} · {project.year}
          </p>
          {project.client && (
            <p className={styles.client} style={{fontStyle: "italic"}}>
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
              <a href={project.externalLink}
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
          {project.images.slice(1).map((img, i) => (
          <div key={i} className={`${styles.galleryItem} ${styles[GALLERY_SIZES[Math.floor(Math.random() * GALLERY_SIZES.length)]]}`}>
            <img src={img.src} alt={img.alt} loading="lazy"/>
          </div>
        ))}
        </div>
      )}
    </div>
  );
}