import React, { useState, useMemo, useEffect, useRef, Suspense, lazy } from "react";
import { createPortal } from "react-dom";
import { Drawer } from "vaul";
import styles from "./Work.module.css";
import { PROJECTS } from "../data/projects";
import { Link } from "react-router-dom";
import ShimmerImage, { Skeleton } from "../components/Skeleton";
import skeletonStyles from "../components/Skeleton.module.css";
import VisibilityGatedVideo from "../components/VisibilityGatedVideo";

// Gated off temporarily to test the raw vaul drawer without it in the way.
// Flip back to true to re-enable.
const CHROME_PATCH_ENABLED = false;

// The scattered "poster wall" look — mixed card sizes, randomized vertical
// nudges/margins, and randomly-inserted spacers. Looks great with a big,
// dense grid; with only a handful of projects it just reads as gaps and
// misalignment, so it's off for now — every card renders at the uniform
// "large" size instead, with no nudge/margin/spacer randomness. Flip back
// to true once there's enough work to fill it out.
const POSTER_WALL_ENABLED = false;

// Off for now: projects show in project id order instead of shuffled.
const RANDOM_ORDER_ENABLED = false;

const SIZES = ["small", "medium", "wide", "large"];
const sessionSizes = PROJECTS.map(() => POSTER_WALL_ENABLED ? SIZES[Math.floor(Math.random() * SIZES.length)] : "large");
const sessionOrder = RANDOM_ORDER_ENABLED
  ? [...PROJECTS].sort(() => Math.random() - 0.5)
  : [...PROJECTS].sort((a, b) => a.id - b.id);
const sessionNudges = PROJECTS.map(() => POSTER_WALL_ENABLED ? Math.floor(Math.random() * 200) : 0);
const sessionMargins = PROJECTS.map(() => POSTER_WALL_ENABLED ? Math.floor(Math.random() * 200) : 0);
const sessionSpacers = new Set(
  POSTER_WALL_ENABLED
    ? PROJECTS.map((_, i) => i).filter(() => Math.random() > 0.6)
    : []
);
const componentCache = {};

function LazyThumbnail({ loader, hovered, fallbackSrc, fallbackAlt, fallbackWidth, fallbackHeight }) {
  if (!componentCache[loader]) {
    componentCache[loader] = lazy(loader);
  }
  const Component = componentCache[loader];
  return (
    <Suspense fallback={<ShimmerImage src={fallbackSrc} alt={fallbackAlt} width={fallbackWidth} height={fallbackHeight} />}>
      <Component hovered={hovered} />
    </Suspense>
  );
}

// Each shape carries its own viewBox — these are Melanie's hand-drawn
// stars, not a shared 24x24 icon set, so their native proportions differ.
// The fixed-size .star box (Work.module.css) scales each down to fit via
// the svg's own preserveAspectRatio default (xMidYMid meet).
const SHAPES = [
  { viewBox: "0 0 158.01 144.94", path: "M103.63,47.72c.49.09,41.48-11.99,45.3-10.25,1.08.49,1.51,1.98,1.42,2.81-.14,1.29-35.7,34.91-35.7,34.91-.36,1.1,24.24,31.63,24.59,33.44s-.25,2.96-1.83,3.53c-2.67.58-36.36-8.06-37.21-7.42-.74.56,1.01,24.35-.23,25.93-1.23,1.56-24.31-21.55-24.94-21.99,0,0-25.11,19.4-25.48,18.63s-1.33-37.19-1.38-38.24c-.05-1.05-36.24-17.87-36.58-18.68s-.5-4.42,1.01-6.27c1.17-1.35,34.1-6.58,34.22-6.98,1.33-3.8-17.02-31-14.33-33.95,1.35-1.93,33.79,22.29,35.78,23.46,0,0,28.05-38.18,28.88-38.72s2.65-.77,3.43.03c2.06,2.12,1.41,39.45,3.06,39.77Z" },
  { viewBox: "0 0 170 181.99", path: "m115.88 84.64s44.25-20.67 43.23-23.25c-2.54-5.64-54-1.17-54.12-2.91-0.09-5.32-2.67-42.84-5.59-43.32-4.69-0.88-19.84 34.24-22.01 39.32-0.92 2.14-35.6-18.53-35.6-18.53s7.8 29.15 9.81 34.15c-5.45 2.18-43.98-2.15-45.51 1.41-0.21 3.96 39.7 22.56 39.7 22.56s-12.88 50.84-9.99 48.88c1.58-1.06 34.69-22.36 34.69-22.36s14.15 49.45 17.61 49.06 14.21-50.19 14.36-54.88c-0.03-4.78 50.69 7.04 54.02 4.95 2.07-1.41-40.58-35.1-40.58-35.1z" },
  { viewBox: "0 0 184.17 178.72", path: "M15.38,145.7c4.05,1.88,44.08-23.08,46.41-17.82.48,2.3-2.43,41.11-1.82,43.56,1.52,5.79,27.09-41.97,31.83-41.86,4.75.11,25.65,22.93,29.93,23.71s-3.89-34.2-2.58-40.67c8.87-.64,48.48-8.1,46.13-13.06s-34.21-12.26-31.96-14.67c6.07-6.2,38.99-30.94,36.63-32.57s-49.95,7.68-50.84,4.26c-1.47-5.66-10.49-42.42-11.81-44.19-.55-.53-1.47-.55-2.19-.09-2.99,2.29-14.59,46.45-15.25,45.4-1.4-2.09-28.12-41.93-30.09-42.02-1.04.08-1.94,1.05-2.18,2.05-.52,2,4.69,37.5,7.63,47.54,2,5.34-55.48,11.51-53.48,15.75s45.94,11.98,45.13,15.32-45.19,47.66-41.48,49.39Z" },
  { viewBox: "0 0 148.21 132.95", path: "m108.61 118.58c1.02 0.68 1.5 2.58 1.28 3.64-0.25 1.15-1.28 1.96-2.16 2.16-1.18 0.27-2.04-0.58-3.22-1.24-1.81-2.53-52.41-32.76-52.58-32.61 0 0-31.18 26.4-34.15 28.13s-7.43 2.07-7.32-0.27 1.08-4.49 2.66-6.22c4.01-4.42 17.42-33.13 16.45-33.18-0.42-0.16-22.08 0.34-22.83-2.57-0.65-2.5 23.35-22.2 24.46-22.78s-13.21-24.78-12.88-27.02c0.31-2.05 2.8-2.89 4.47-2.38s28.36 8.56 32.42 13.17c-0.33-2.5 20.91-34.03 23.01-34.08 3.14-0.08 4.52 1.99 4.83 4.66l0.7 5.96c0.4 3.4 1.21 29.07 2.7 29.01s47.82 14.96 49.11 15.65c1.88 1.01 2.66 3.21 1.86 5.03-0.48 1.09-1.23 1.66-2.57 0.98s-49.92 11.04-50.19 11.67 21.36 40.55 23.97 42.3z" },
  { viewBox: "0 0 187.44 179.81", path: "M153.24,52.24c-1.08-1.86-33.02,5.32-32.9,4.37.11-.95,4.58-39.84,2.29-40.66-1.71-.61-4.04.7-5.32,1.5-2.99,2.13-23.12,28.61-24.83,29.14-2.1.02-19.44-7.39-22.81-8.43,0,0-19.27-6.77-21.43-3.36-1.19,1.87,19.79,25.59,20.47,26.55-2.47,4.63-46.56,22.31-47.55,26.37-.24,1-.4,2.19.14,3.22.82,1.57,49.44-2.29,48.6-2.04-1.18,1.11-5.59,48.93-4.77,51.98.22.83,1.01,2.08,2.24,2.16,2.67.17,23.53-44.49,23.53-44.49.63-.83,8.3,66.11,9.31,67.13,1.01,1.02,3.03.39,4.08-.55,1.13-1.01,15.62-61.67,15.83-63.1.21-1.44,29.51-10.32,29.8-15.14.25-4.25-26.35-7.92-27.31-8.79,2.88-2.57,31.99-18.76,32.16-21.66.17-2.9-.44-2.32-1.53-4.19Z" },
  { viewBox: "0 0 174.2 197.4", path: "M119.09,88.74c3.34-2.95,31.64-37.92,32.51-39.21,2.61-4.11-51.76,21.95-52.85,19.96-1.19-3.3-23.19-54.3-26.88-53.4-4.16,1.87.89,57.37-3.04,56.53-10.27-5.18-32.37-24.31-43.92-23.26-1.55,2.27,25.97,44.34,28.43,47.37-1.55,4.28-31.54,7.37-39.2,14.28,2.5,4.54,42.84,12.6,42.84,12.6,0,0-6.62,33.45-5.96,35.35.71,1.89,26.43-19.66,27.73-17.68,7.29,10.68,30.92,46.17,31.42,45.94,2.14-1.68-1.03-61.63-1.3-63.29.13-.07,57.66-17.37,57.57-19.77-1.31-4.6-48.74-14.27-47.34-15.41Z" },
];

function StarCheckbox({ checked, shape }) {
  return (
    <div className={styles.starCheckbox} aria-hidden="true">
      <svg viewBox={shape.viewBox} className={`${styles.star} ${checked ? styles.starChecked : ""}`}>
        <path d={shape.path} />
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
  const chromePatchRef = useRef(null);

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
    // A real, separate DOM element (not a CSS pseudo-element tied to the
    // sheet's own box) whose top position is set directly from a JS-
    // measured coordinate rather than a CSS unit — dvh proved unreliable
    // for tracking Safari's actual current toolbar-adjusted viewport
    // edge. window.visualViewport.height is that measured coordinate;
    // the patch sits flush against it and extends 100px further down
    // (toolbar height + buffer), matching the sheet's own color. Only
    // present while the sheet is open — closing it removes the class.
    //
    // Confirmed via live device measurement: at -1px overlap, only that
    // 1px painted (hard cutoff at innerHeight). At -10px overlap, the
    // *entire* element painted correctly, chrome region included — not a
    // proportional reveal, more like a compositing-inclusion threshold:
    // some minimum overlap with the visible viewport determines whether
    // Safari includes the whole layer at all, not just the visible part
    // of it. 20px keeps a bit of margin over the working 10px without
    // covering much of the sheet's own visible content above it (the
    // patch sits on top there — see Work.module.css — but its color now
    // matches the sheet exactly, so a small overlap reads as seamless).
    if (!CHROME_PATCH_ENABLED || !drawerOpen) return;
    const updatePatch = () => {
      const vh = window.visualViewport ? window.visualViewport.height : window.innerHeight;
      if (chromePatchRef.current) {
        chromePatchRef.current.style.top = `${vh - 20}px`;
      }
    };
    updatePatch();
    window.visualViewport?.addEventListener("resize", updatePatch);
    window.visualViewport?.addEventListener("scroll", updatePatch);
    return () => {
      window.visualViewport?.removeEventListener("resize", updatePatch);
      window.visualViewport?.removeEventListener("scroll", updatePatch);
    };
  }, [drawerOpen]);

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

  const openFilters = () => {
    // Confirmed cause of the Liquid Glass toolbar gap: Safari only
    // resamples what's behind it on a genuine scroll event, not on DOM/
    // paint changes. If the sheet opens before the page has ever been
    // scrolled, the toolbar can be stuck showing a stale pre-sheet render.
    // vaul's own scroll lock prevents scrolling once open, so this nudge
    // has to happen — and finish — before setDrawerOpen engages it, not
    // in a useEffect racing against vaul's own effects.
    const html = document.documentElement;
    const prevMinHeight = html.style.minHeight;
    html.style.minHeight = 'calc(100vh + 2px)';
    requestAnimationFrame(() => {
      window.scrollTo(window.scrollX, window.scrollY + 2);
    });
    setTimeout(() => {
      window.scrollTo(window.scrollX, window.scrollY - 2);
      html.style.minHeight = prevMinHeight;
      setDrawerOpen(true);
    }, 120);
  };

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

  // Assigns each filter option a shape from SHAPES, cycling through a
  // shuffled pool and reshuffling once it's exhausted — but if a fresh
  // shuffle would put the same shape that just ran out back at the front,
  // that's an adjacent repeat across the reshuffle boundary, so it gets
  // swapped out first. Guarantees no two options next to each other in
  // the rendered list ever share a shape.
  const shapeMap = useMemo(() => {
    const options = [...availableDisciplines, ...availableTopics];
    const map = {};
    let pool = [];
    let prevShape = null;
    options.forEach((opt) => {
      if (pool.length === 0) {
        pool = [...SHAPES].sort(() => Math.random() - 0.5);
        if (pool[0] === prevShape && pool.length > 1) {
          const swapIndex = 1 + Math.floor(Math.random() * (pool.length - 1));
          [pool[0], pool[swapIndex]] = [pool[swapIndex], pool[0]];
        }
      }
      const shape = pool.shift();
      map[opt] = shape;
      prevShape = shape;
    });
    return map;
  }, []);

  const filtered = sessionOrder.filter(p => {
    const disciplineMatch = selectedDisciplines.length === 0 || p.disciplines.some(d => selectedDisciplines.includes(d));
    const topicMatch = selectedTopics.length === 0 || (p.topics ?? []).some(t => selectedTopics.includes(t));
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
      <button className={styles.filterButton} onClick={openFilters}>
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
                  <label key={m} className={styles.filterOption}>
                    <input
                      type="checkbox"
                      className={styles.srOnlyCheckbox}
                      checked={selectedDisciplines.includes(m)}
                      onChange={() => toggleFilter(m, selectedDisciplines, setSelectedDisciplines)}
                    />
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
                  <label key={m} className={styles.filterOption}>
                    <input
                      type="checkbox"
                      className={styles.srOnlyCheckbox}
                      checked={selectedTopics.includes(m)}
                      onChange={() => toggleFilter(m, selectedTopics, setSelectedTopics)}
                    />
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
          <Drawer.Root open={drawerOpen} onOpenChange={setDrawerOpen}>
            <Drawer.Portal>
              <Drawer.Overlay className={styles.sheetOverlay} />
              <Drawer.Content className={styles.sheetContent}>
                <Drawer.Handle className={styles.sheetHandle} />
                <div className={styles.sheetHeader}>
                  <Drawer.Title className={styles.sheetTitle}>Filters</Drawer.Title>
                  <Drawer.Close className={styles.drawerClose} aria-label="Close filters">✕</Drawer.Close>
                </div>
                {filterContent}
              </Drawer.Content>
            </Drawer.Portal>
            {CHROME_PATCH_ENABLED && createPortal(
              <div
                ref={chromePatchRef}
                className={`${styles.chromePatch} ${drawerOpen ? styles.chromePatchVisible : ""}`}
              />,
              document.body
            )}
          </Drawer.Root>
        ) : (
          <div className={`${styles.drawer} ${drawerOpen ? styles.drawerOpen : ""}`}>
            <button className={styles.drawerClose} onClick={() => setDrawerOpen(false)} aria-label="Close filters">✕</button>
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
                  <div className={project.comingSoon ? styles.comingSoonThumb : undefined}>
                    {typeof project.thumbnail === "function" ? (
                      <LazyThumbnail
                        loader={project.thumbnail}
                        hovered={false}
                        fallbackSrc={project.images[0].src}
                        fallbackAlt={project.images[0].alt}
                        fallbackWidth={project.images[0].width}
                        fallbackHeight={project.images[0].height}
                      />
                    ) : typeof project.thumbnail === "string" && project.thumbnail.endsWith(".webm") ? (
                      <VisibilityGatedVideo
                        src={project.thumbnail}
                        width={project.thumbnailWidth}
                        height={project.thumbnailHeight}
                        alt={project.images[0].alt}
                      />
                    ) : (
                      <ShimmerImage
                        src={project.thumbnail || project.images[0].src}
                        srcSet={project.thumbnail ? project.thumbnailSrcSet : undefined}
                        sizes={project.thumbnail ? project.thumbnailSizes : undefined}
                        alt={project.images[0].alt}
                        width={project.thumbnail ? project.thumbnailWidth : project.images[0].width}
                        height={project.thumbnail ? project.thumbnailHeight : project.images[0].height}
                      />
                    )}
                    {project.comingSoon && (
                      <div className={styles.comingSoonOverlay}>
                        <span className={styles.comingSoonLabel}>Coming Soon</span>
                      </div>
                    )}
                  </div>
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
          <svg viewBox="0 0 24 24" fill="none" stroke="#FAF7F2" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
            <line x1="12" y1="4" x2="12" y2="20" />
            <polyline points="6 14 12 20 18 14" />
          </svg>
        </div>
      </div>
    </div>
  );
}


