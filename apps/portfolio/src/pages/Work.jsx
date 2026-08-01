import React, { useState, useMemo, useEffect, useRef, Suspense, lazy } from "react";
import { createPortal } from "react-dom";
import styles from "./Work.module.css";
import { PROJECTS } from "../data/projects";
import { Link } from "react-router-dom";

const SIZES = ["small", "medium", "wide", "large"];
const sessionSizes = PROJECTS.map(() => SIZES[Math.floor(Math.random() * SIZES.length)]);
const sessionOrder = [...PROJECTS].sort(() => Math.random() - 0.5);
const sessionNudges = PROJECTS.map(() => Math.floor(Math.random() * 200));
const sessionMargins = PROJECTS.map(() => Math.floor(Math.random() * 200));
const sessionSpacers = new Set(
  PROJECTS.map((_, i) => i)
    .filter(() => Math.random() > 0.6)
);
const componentCache = {};

function LazyThumbnail({ loader, hovered, fallbackSrc, fallbackAlt }) {
  if (!componentCache[loader]) {
    componentCache[loader] = lazy(loader);
  }
  const Component = componentCache[loader];
  return (
    <Suspense fallback={<img src={fallbackSrc} alt={fallbackAlt} />}>
      <Component hovered={hovered} />
    </Suspense>
  );
}

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
  const [showScroll, setShowScroll] = useState(true);
  const contentRef = useRef(null);
  const [hasScroll, setHasScroll] = useState(false);
  const gridRef = useRef(null);
  const [gridVisible, setGridVisible] = useState(true);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    // iOS 26 Liquid Glass ignores theme-color entirely and falls back to
    // html/body's actual background-color when no qualifying fixed element
    // is sampled — body needs this too, not just documentElement.
    document.documentElement.style.backgroundColor = "#C93500";
    document.body.style.backgroundColor = "#C93500";
    return () => {
      document.documentElement.style.backgroundColor = "";
      document.body.style.backgroundColor = "";
    };
  }, []);

  useEffect(() => {
    const saved = sessionStorage.getItem("workScroll");
    if (saved) {
      window.scrollTo(0, parseInt(saved));
      sessionStorage.removeItem("workScroll");
    }
  }, []);
  
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 100) {
        setShowScroll(false);
      } else {
        setShowScroll(true);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleFilter = (value, selected, setSelected) => {
  setGridVisible(false);
  setTimeout(() => {
    setSelected(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    );
    setGridVisible(true);
    window.scrollTo(0, 0);
  }, 200);
};

  const availableDisciplines = [...new Set(PROJECTS.flatMap(p => p.disciplines))];
  const availableTopics = [...new Set(PROJECTS.flatMap(p => p.topics ?? []))];

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

useEffect(() => {
  const checkScroll = () => {
    if (!gridRef.current) return;
    const cards = gridRef.current.querySelectorAll('a');
    const belowFold = Array.from(cards).some(
      card => card.getBoundingClientRect().bottom > window.innerHeight
    );
    setHasScroll(belowFold);
  };
  const timer = setTimeout(checkScroll, 100);
  return () => clearTimeout(timer);
}, [filtered]);

  return (
    <div className={styles.page}>
      <button className={styles.filterButton} onClick={() => setDrawerOpen(true)}>
        ☰ Filters
      </button>

      {!isMobile && drawerOpen && (
        <div
          className={styles.overlay}
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {(() => {
        const filterContent = (
          <>
            {availableDisciplines.length > 0 && (
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
            )}

            {availableTopics.length > 0 && (
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
            )}

            {(selectedDisciplines.length > 0 || selectedTopics.length > 0) && (
              <button
                className={styles.clearButton}
                onClick={() => {
                  setGridVisible(false);
                  setTimeout(() => {
                    setSelectedDisciplines([]);
                    setSelectedTopics([]);
                    setGridVisible(true);
                    window.scrollTo(0, 0);
                  }, 200);
                }}
              >
                Clear Filters
              </button>
            )}
          </>
        );

        return isMobile ? (
          drawerOpen && createPortal(
            <>
              {/* Portaled straight to <body> — .page creates its own stacking
                  context (position:relative + z-index), which trapped the
                  sheet's z-index:300 inside it, so the fixed logo (z-index:50,
                  a sibling of .page) was comparing against .page's own low
                  z-index and painting on top of the whole sheet regardless.
                  Escaping .page's subtree entirely sidesteps that. */}
              <div className={styles.sheetBackdrop} onClick={() => setDrawerOpen(false)}>
                <div className={styles.sheetBackdropFill} />
              </div>
              <div className={styles.sheet}>
                <div className={styles.sheetInner}>
                  <div className={styles.sheetHandleRow}>
                    <div className={styles.sheetHandle} />
                  </div>
                  <div className={styles.sheetHeader}>
                    <div className={styles.sheetTitle}>Filters</div>
                    <button className={styles.drawerClose} onClick={() => setDrawerOpen(false)}>✕</button>
                  </div>
                  {filterContent}
                </div>
              </div>
            </>,
            document.body
          )
        ) : (
          <div className={`${styles.drawer} ${drawerOpen ? styles.drawerOpen : ""}`}>
            <button className={styles.drawerClose} onClick={() => setDrawerOpen(false)}>✕</button>
            {filterContent}
          </div>
        );
      })()}

      <div className={styles.content} ref={contentRef}>
        <div className={styles.grid} ref={gridRef} style={{
          opacity: gridVisible ? 1 : 0,
          transition: "opacity 0.2s ease"
        }}>
          {filtered.length > 0 ? filtered.map((project) => {
            const i = PROJECTS.findIndex(p => p.id === project.id);
            const size = sessionSizes[i];
            const nudge = sessionNudges[i];

            return (
              <React.Fragment key={project.id}>
                {!isMobile && sessionSpacers.has(i) && (
                  <div className={styles.spacer} />
                )}
                <Link
                  to={`/portfolio/${project.slug}`}
                  className={`${styles.card} ${isMobile ? "" : styles[size]}`}
                  style={isMobile ? undefined : { marginTop: `${nudge}px`, marginBottom: `${sessionMargins[i]}px` }}
                  onClick={() => sessionStorage.setItem("workScroll", window.scrollY)}
                >
                  {project.thumbnail ? (
                    <LazyThumbnail
                      loader={project.thumbnail}
                      hovered={false}
                      fallbackSrc={project.images[0].src}
                      fallbackAlt={project.images[0].alt}
                    />
                  ) : (
                    <img src={project.images[0].src} alt={project.images[0].alt} />
                  )}
                  <div className={styles.cardTitle}>{project.title}</div>
                  <div className={styles.cardYear}>{project.year}</div>
                </Link>
              </React.Fragment>
            );
          }) : (
            <p className={styles.empty}>No projects match your filters.</p>
          )}
        </div>
        <div className={styles.scrollHint} style={{ opacity: showScroll && hasScroll ? 1 : 0 }}>
          <span>Scroll</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="#FAF7F2" strokeWidth="1.5" strokeLinecap="round">
            <line x1="12" y1="4" x2="12" y2="20" />
            <polyline points="6 14 12 20 18 14" />
          </svg>
        </div>
      </div>
    </div>
  );
}


