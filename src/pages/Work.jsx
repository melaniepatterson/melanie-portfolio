import { useState } from "react";
import styles from "./Work.module.css";
import { PROJECTS } from "../data/projects";
import { Link } from "react-router-dom";

const MODALITIES = ["Fine Art", "Design / Print", "Web Development"];
const MEDIUMS = ["Watercolor", "Digital", "Mixed Media", "Collage", "Code", "Photography", "Drawing"];
const SIZES = ["small", "medium", "wide", "large"];

// Seeded per session so it doesn't reflow on every render, only on page load
const sessionSizes = PROJECTS.map(() => SIZES[Math.floor(Math.random() * SIZES.length)]);

export default function Work() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedModalities, setSelectedModalities] = useState([]);
  const [selectedMediums, setSelectedMediums] = useState([]);

  const toggleFilter = (value, selected, setSelected) => {
    setSelected(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    );
  };

  const filtered = PROJECTS.filter(p => {
    const modalityMatch = selectedModalities.length === 0 || selectedModalities.includes(p.modality);
    const mediumMatch = selectedMediums.length === 0 || selectedMediums.includes(p.medium);
    return modalityMatch && mediumMatch;
  });

  return (
    <div className={styles.page}>
      <button className={styles.filterButton} onClick={() => setDrawerOpen(true)}>
        ☰ Filters
      </button>

      {drawerOpen && (
        <div className={styles.overlay} onClick={() => setDrawerOpen(false)} />
      )}

      <div className={`${styles.drawer} ${drawerOpen ? styles.drawerOpen : ""}`}>
        <button className={styles.drawerClose} onClick={() => setDrawerOpen(false)}>✕</button>

        <div className={styles.filterSection}>
          <div className={styles.filterTitle}>Modality</div>
          {MODALITIES.map(m => (
            <label key={m} className={styles.filterOption}>
              <input
                type="checkbox"
                checked={selectedModalities.includes(m)}
                onChange={() => toggleFilter(m, selectedModalities, setSelectedModalities)}
              />
              {m}
            </label>
          ))}
        </div>

        <div className={styles.filterSection}>
          <div className={styles.filterTitle}>Medium</div>
          {MEDIUMS.map(m => (
            <label key={m} className={styles.filterOption}>
              <input
                type="checkbox"
                checked={selectedMediums.includes(m)}
                onChange={() => toggleFilter(m, selectedMediums, setSelectedMediums)}
              />
              {m}
            </label>
          ))}
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.grid}>
          {filtered.length > 0 ? filtered.map((project, i) => (
          <Link
            key={project.id}
            to={`/work/${project.slug}`}
            className={`${styles.card} ${styles[sessionSizes[i]]}`}
            >
            <img src={project.images[0]} alt={project.title} />
            <div className={styles.cardInfo}>
              <div className={styles.cardTitle}>{project.title}</div>
              <div className={styles.cardMeta}>{project.modality} · {project.medium}</div>
            </div>
          </Link>
        )) : (
          <p className={styles.empty}>No projects match your filters.</p>
        )}
        </div>
      </div>
    </div>
  );
}