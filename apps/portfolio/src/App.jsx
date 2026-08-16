import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Nav from "./Nav";
import Logo from "./Logo";
import LogoHorizontal from "./LogoHorizontal";
import "./App.css";
import { PROJECT_TITLES } from "./data/projectTitles";
import { useEffect, Suspense, lazy } from "react";
import PageTransition from "./PageTransition";
import NotFound from "./NotFound";
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
  // actually visible. Home's circle (Radialgradient.jsx) is a heavily
  // blurred ellipse, not a flat fill — its raw color (#FFD6F9) is far more
  // saturated than what's actually visible near the screen edges where the
  // toolbar sits, since the blur fades it out there. #fce7f5 is sampled
  // directly from the rendered edge (canvas pixel read, composited over the
  // cream body background), not guessed.
  useEffect(() => {
    const color = isWork || isWorkDetail ? "#C93500" : isHome ? "#fce7f5" : "#FAF7F2";
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', color);
  }, [isHome, isWork, isWorkDetail]);

  // iOS Safari only repaints its status bar/toolbar chrome on a scroll
  // event, not immediately when theme-color changes via JS (client-side
  // route changes never trigger one on their own) — so the meta tag was
  // updating correctly but the visible chrome stayed stale until the user
  // happened to scroll. Forcing a tiny real scroll nudges Safari into
  // resampling it. Same fix already used in the GlowUp app.
  useEffect(() => {
    const html = document.documentElement;
    const prevMinHeight = html.style.minHeight;
    html.style.minHeight = 'calc(100vh + 2px)';
    const raf = requestAnimationFrame(() => {
      window.scrollTo(window.scrollX, window.scrollY + 2);
    });
    const timeout = setTimeout(() => {
      window.scrollTo(window.scrollX, window.scrollY - 2);
      html.style.minHeight = prevMinHeight;
    }, 120);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timeout);
      html.style.minHeight = prevMinHeight;
    };
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
