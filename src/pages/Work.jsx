import { useState } from "react";
import styles from "./Work.module.css";

const MODALITIES = ["Fine Art", "Design / Print", "Web Development"];
const MEDIUMS = ["Watercolor", "Digital", "Mixed Media", "Collage", "Code", "Photography", "Drawing"];

// Placeholder projects — replace with your real work later
const PROJECTS = [
  { id: 1, title: "Project One", modality: "Fine Art", medium: "Watercolor", image: "https://placehold.co/600x450/C93500/FAF7F2" },
  { id: 2, title: "Project Two", modality: "Fine Art", medium: "Mixed Media", image: "https://placehold.co/600x450/C93500/FAF7F2" },
  { id: 3, title: "Project Three", modality: "Design / Print", medium: "Digital", image: "https://placehold.co/600x450/C93500/FAF7F2" },
  { id: 4, title: "Project Four", modality: "Web Development", medium: "Code", image: "https://placehold.co/600x450/C93500/FAF7F2" },
  { id: 5, title: "Project Five", modality: "Fine Art", medium: "Collage", image: "https://placehold.co/600x450/C93500/FAF7F2" },
  { id: 6, title: "Project Six", modality: "Design / Print", medium: "Photography", image: "https://placehold.co/600x450/C93500/FAF7F2" },
  { id: 7, title: "Project Seven", modality: "Fine Art", medium: "Drawing", image: "https://placehold.co/600x450/C93500/FAF7F2" },
  { id: 8, title: "Project Eight", modality: "Web Development", medium: "Digital", image: "https://placehold.co/600x450/C93500/FAF7F2" },
];

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
          {filtered.length > 0 ? filtered.map(project => (
            <div key={project.id} className={styles.card}>
              <img src={project.image} alt={project.title} />
              <div className={styles.cardInfo}>
                <div className={styles.cardTitle}>{project.title}</div>
                <div className={styles.cardMeta}>{project.modality} · {project.medium}</div>
              </div>
            </div>
          )) : (
            <p className={styles.empty}>No projects match your filters.</p>
          )}
        </div>
      </div>
    </div>
  );
}