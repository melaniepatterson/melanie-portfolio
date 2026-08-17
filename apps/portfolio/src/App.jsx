import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Nav from "./Nav";
import Logo from "./Logo";
import LogoHorizontal from "./LogoHorizontal";
import "./App.css";
import { PROJECT_TITLES } from "./data/projectTitles";
import { useEffect, Suspense, lazy } from "react";
import PageTransition from "./PageTransition";
import NotFound from "./NotFound";
import TrackedRedirect from "./TrackedRedirect";
import ConsentBanner from "./ConsentBanner";
// "/" is the default landing page for nearly every visitor, so it's kept
// eager rather than lazy — lazy-loading it only adds a sequential
// network round-trip to the critical path (main bundle, then this chunk,
// then its font) with no real payoff, since it's needed on initial load
// almost every time regardless.
import Hero from "./Radialgradient";

// Route-level code splitting for genuinely secondary navigation — each
// of these only downloads when a visitor actually clicks through to it,
// instead of the home page forcing a download of all three (and
// everything they in turn pull in, like the full project data) upfront.
const Work = lazy(() => import("./pages/Work"));
const WorkDetail = lazy(() => import("./pages/WorkDetail"));
const AboutContact = lazy(() => import("./pages/About-contact"));
const Privacy = lazy(() => import("./pages/Privacy"));

function Layout() {
  const location = useLocation();
  const isHome = location.pathname === "/";
  const isWork = location.pathname === "/portfolio";
  const isWorkDetail = location.pathname.startsWith("/portfolio/");

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  // Keep Safari's toolbar chrome in sync with whichever background is
  // actually visible — cream everywhere except Work/WorkDetail's rust.
  useEffect(() => {
    const color = isWork || isWorkDetail ? "#C93500" : "#FAF7F2";
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', color);
  }, [isHome, isWork, isWorkDetail]);

  // iOS Safari only repaints its status bar/toolbar chrome on a scroll
  // event, not immediately when theme-color (or html/body's background,
  // which is what iOS 26's Liquid Glass toolbar actually samples) changes
  // via JS — client-side route changes never trigger a scroll on their
  // own, so the correct color was set but the visible chrome stayed
  // stale. Forcing a real scroll nudges Safari into resampling it.
  //
  // Unlike the old version of this effect, the nudge is never reverted
  // back to 0 — Liquid Glass needs a persistently non-zero scrollY to
  // composite real page pixels behind the toolbar at all; snapping back
  // to exactly 0 re-opens the flat-color-fallback gap this exists to
  // avoid. .layout's matching -1px margin-top (App.css) cancels this
  // out visually, so nothing above the fold actually moves.
  //
  // minHeight only gets forced when the page genuinely isn't scrollable
  // yet (nothing to nudge otherwise) — CSS vh units resolve inconsistently
  // depending on whether Safari's toolbar happens to be expanded or
  // minimized at that exact moment, and forcing one unconditionally on
  // every route change risked fighting the toolbar's own resize reflow
  // (reported as scrolling back up "getting stuck" while it was
  // minimized). window.innerHeight is measured once, live, in JS instead
  // — no CSS viewport-unit ambiguity to fight.
  useEffect(() => {
    const html = document.documentElement;
    // Reset before measuring, not after — React 18 StrictMode
    // double-invokes this effect in dev, and reading scrollHeight
    // without resetting first measures the PREVIOUS run's own inflated
    // minHeight, concludes it's no longer needed, and clears it right
    // back out from under itself, leaving scrollY stuck at 0.
    html.style.minHeight = "";
    const needsHeight = html.scrollHeight <= window.innerHeight;
    if (needsHeight) html.style.minHeight = `${window.innerHeight + 1}px`;
    const raf = requestAnimationFrame(() => {
      if (window.scrollY < 1) window.scrollTo(window.scrollX, 1);
    });
    return () => cancelAnimationFrame(raf);
  }, [isHome, isWork, isWorkDetail]);

  useEffect(() => {
    const titles = {
      "/": "melanie.studio",
      "/portfolio": "Work — melanie.studio",
      "/about-contact": "Info & Contact — melanie.studio",
      "/privacy": "Privacy & Cookies — melanie.studio",
    };
    const title = titles[location.pathname];
    if (title) {
      document.title = title;
    } else if (location.pathname.startsWith("/portfolio/")) {
      const slug = location.pathname.replace("/portfolio/", "");
      const project = PROJECT_TITLES.find(p => p.slug === slug);
      document.title = project ? `${project.title} — melanie.studio` : "melanie.studio";
    }
  }, [location.pathname]);

  // gtag's own automatic page_view (fired once, from the initial config
  // call in index.html) is disabled via send_page_view: false — this is
  // an SPA, so that one-shot send would only ever cover the very first
  // load. Every route change, first one included, gets its own manual
  // event here instead. Runs after the title effect above so page_title
  // reflects the route that was just navigated to, not the previous one.
  useEffect(() => {
    if (typeof window.gtag !== "function") return;
    window.gtag("event", "page_view", {
      page_path: location.pathname,
      page_title: document.title,
      page_location: window.location.href,
    });
  }, [location.pathname]);

  return (
    <div className="layout">
      {!isHome && <Nav isWork={isWork || isWorkDetail} isWorkDetail={isWorkDetail} />}
      <Logo isWork={isWork || isWorkDetail} />
      <LogoHorizontal isWork={isWork || isWorkDetail} />
      <div className="page-wrapper" style={{
        backgroundColor: isWork || isWorkDetail ? "#C93500" : "#FAF7F2",
      }}>
        <main className="content">
          <PageTransition>
            <Suspense fallback={null}>
              <Routes>
                <Route path="/" element={<Hero />} />
                <Route path="/portfolio" element={<Work />} />
                <Route path="/portfolio/:slug" element={<WorkDetail />} />
                <Route path="/about-contact" element={<AboutContact />} />
                <Route path="/privacy" element={<Privacy />} />
                {/* One explicit route per known code, not a /:code
                    catchall — a typo'd path should hit the real 404
                    below, not silently redirect home. */}
                <Route path="/p1" element={<TrackedRedirect code="p1" />} />
                <Route path="/p2" element={<TrackedRedirect code="p2" />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </PageTransition>
        </main>
        <footer className={`site-footer${isWork ? " footerAboveFilters" : ""}`} style={{
          marginTop: "auto",
          paddingTop: "1rem",
          paddingLeft: "2rem",
          paddingRight: "2rem",
          fontSize: "0.6rem",
          letterSpacing: "0.1em",
          color: isWork || isWorkDetail ? "#FAF7F2" : "#C93500",
          pointerEvents: "none",
          display: "flex",
          alignItems: "center",
          gap: "0.6rem",
        }}>
          <span>© {new Date().getFullYear()} Melanie Patterson</span>
          <a
            href="/privacy"
            style={{ pointerEvents: "auto", color: "inherit" }}
          >
            Privacy
          </a>
          <a
            href="https://www.instagram.com/melanie.studio_/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Melanie Patterson on Instagram"
            style={{ pointerEvents: "auto", color: "inherit", display: "inline-flex", lineHeight: 0 }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="3" width="18" height="18" rx="5" ry="5" />
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
            </svg>
          </a>
        </footer>
      </div>
      <ConsentBanner />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  );
}

export default App;
