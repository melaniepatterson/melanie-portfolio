import { useParams, Link } from "react-router-dom";
import { PROJECTS } from "../data/projects";
import styles from "./WorkDetail.module.css";

const GALLERY_SIZES = ["gallerySmall", "galleryMedium", "galleryWide", "galleryLarge"];

export default function WorkDetail() {
  const { slug } = useParams();
  const project = PROJECTS.find(p => p.slug === slug);

  if (!project) return (
    <div className={styles.page}>
      <p>Project not found.</p>
      <Link to="/work">← Back to Work</Link>
    </div>
  );

  return (
    <div className={styles.page}>
      <Link to="/work" className={styles.back}>← Work</Link>

      <div className={styles.layout}>
        <div className={styles.images}>
          <img src={project.images[0]} alt={project.title} />
        </div>

        <div className={styles.info}>
          <h1 className={styles.title}>{project.title}</h1>
          <p className={styles.meta}>{project.modality} · {project.medium} · {project.year}</p>
          <p className={styles.description}>{project.description}</p>
          {project.externalLink && (
              <a href={project.externalLink}
              target={project.externalLink.startsWith("http") ? "_blank" : undefined}
              rel={project.externalLink.startsWith("http") ? "noreferrer" : undefined}
              className={styles.link}
              >
              View Project
              {project.externalLink.startsWith("http") ? " ↗" : ""}
            </a>
          )}
        </div>
      </div>

      {project.images.length > 1 && (
        <div className={styles.gallery}>
          {project.images.slice(1).map((img, i) => (
            <div
              key={i}
              className={`${styles.galleryItem} ${styles[GALLERY_SIZES[Math.floor(Math.random() * GALLERY_SIZES.length)]]}`}
            >
              <img src={img} alt={`${project.title} ${i + 2}`} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}