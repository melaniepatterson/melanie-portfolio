import { useState, useMemo } from "react";
import styles from "./Work.module.css";
import { PROJECTS } from "../data/projects";
import { Link } from "react-router-dom";
import { useEffect } from "react";

const SIZES = ["small", "medium", "wide", "large"];
const sessionSizes = PROJECTS.map(() => SIZES[Math.floor(Math.random() * SIZES.length)]);
const sessionOrder = [...PROJECTS].sort(() => Math.random() - 0.5);
const sessionNudges = PROJECTS.map(() => Math.floor(Math.random() * 300));
const sessionMargins = PROJECTS.map(() => Math.floor(Math.random() * 300));

const SHAPES = [
  "M12 2C16 2 22 6 22 12C22 18 17 22 12 22C7 22 2 17 2 12C2 7 8 2 12 2Z",
  "M12 1C15 1 20 4 21 8C22 12 20 18 17 21C14 23 9 23 6 20C3 17 2 12 3 8C4 4 9 1 12 1Z",
  "M12 2L14 9L21 9L15.5 13.5L17.5 21L12 16.5L6.5 21L8.5 13.5L3 9L10 9Z",
  "M12 2C13.5 5 17 5 19 7C21 9 21 13 19 15C17 17 13.5 17 12 20C10.5 17 7 17 5 15C3 13 3 9 5 7C7 5 10.5 5 12 2Z",
  "M12 1L14 7L20 4L17 10L23 12L17 14L20 20L14 17L12 23L10 17L4 20L7 14L1 12L7 10L4 4L10 7Z",
  "M7 18C4 18 2 16 2 13C2 11 3 9 5 8C5 5 7 3 10 3C11 3 12 3.5 13 4C14 2 16 1 18 2C20 3 21 5 20 7C22 8 23 10 22 12C21 15 18 17 15 17Z",
  "M4 12C4 8 6 3 10 2C13 1 16 3 18 6C20 8 22 10 21 13C20 16 17 19 14 20C11 21 7 20 5 18C3 16 4 14 4 12Z",
  "M12 1L15 5L20 3L18 8L23 10L18 13L21 18L16 17L14 22L11 18L6 21L7 16L2 14L7 11L4 6L9 8Z",
];

function StarCheckbox({ checked, shape }) {
  return (
    <div className={styles.starCheckbox}>
      <svg viewBox="0 0 24 24" className={`${styles.star} ${checked ? styles.starChecked : ""}`}>
        <path d={shape} />
      </svg>
    </div>
  );
}

export default function Work() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedDisciplines, setSelectedDisciplines] = useState([]);
  const [selectedTopics, setSelectedTopics] = useState([]);

  const toggleFilter = (value, selected, setSelected) => {
    setSelected(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    );
  };

  useEffect(() => {
  const saved = sessionStorage.getItem("workScroll");
  if (saved) {
    window.scrollTo(0, parseInt(saved));
    sessionStorage.removeItem("workScroll");
  }
}, []);

  const availableDisciplines = [...new Set(PROJECTS.flatMap(p => p.disciplines))];
  const availableTopics = [...new Set(PROJECTS.flatMap(p => p.topics))];

  const shapeMap = useMemo(() => {
    const map = {};
    const shuffled = [...SHAPES].sort(() => Math.random() - 0.5);
    [...availableDisciplines, ...availableTopics].forEach((opt, i) => {
      map[opt] = shuffled[i % shuffled.length];
    });
    return map;
  }, []);

  const filtered = sessionOrder.filter(p => {
    const disciplineMatch = selectedDisciplines.length === 0 || p.disciplines.some(d => selectedDisciplines.includes(d));
    const topicMatch = selectedTopics.length === 0 || p.topics.some(t => selectedTopics.includes(t));
    return disciplineMatch && topicMatch;
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
          <div className={styles.filterTitle}>Discipline</div>
          {availableDisciplines.map(m => (
            <label
              key={m}
              className={styles.filterOption}
              onClick={(e) => {
                e.preventDefault();
                toggleFilter(m, selectedDisciplines, setSelectedDisciplines);
              }}
            >
              <StarCheckbox checked={selectedDisciplines.includes(m)} shape={shapeMap[m]} />
              {m}
            </label>
          ))}
        </div>

        <div className={styles.filterSection}>
          <div className={styles.filterTitle}>Topic</div>
          {availableTopics.map(m => (
            <label
              key={m}
              className={styles.filterOption}
              onClick={(e) => {
                e.preventDefault();
                toggleFilter(m, selectedTopics, setSelectedTopics);
              }}
            >
              <StarCheckbox checked={selectedTopics.includes(m)} shape={shapeMap[m]} />
              {m}
            </label>
          ))}
        </div>

        {(selectedDisciplines.length > 0 || selectedTopics.length > 0) && (
          <button
            className={styles.clearButton}
            onClick={() => {
              setSelectedDisciplines([]);
              setSelectedTopics([]);
            }}
          >
            Clear Filters
          </button>
        )}
      </div>

      <div className={styles.content}>
        <div className={styles.grid}>
          {filtered.length > 0 ? filtered.map((project) => {
  const i = PROJECTS.findIndex(p => p.id === project.id);
  const size = sessionSizes[i];
const nudge = sessionNudges[i];
  return (
    <Link
      key={project.id}
      to={`/portfolio/${project.slug}`}
      className={`${styles.card} ${styles[size]}`}
      style={{
        marginTop: `${nudge}px`,
        marginBottom: `${sessionMargins[i]}px`,
      }}
      onClick={() => sessionStorage.setItem("workScroll", window.scrollY)}
    >
      <img src={project.images[0]} alt={project.title} />
      <div className={styles.cardTitle}>{project.title}</div>
      <div className={styles.cardYear}>{project.year}</div>
    </Link>
  );
          }) : (
            <p className={styles.empty}>No projects match your filters.</p>
          )}
        </div>
      </div>
    </div>
  );
}

