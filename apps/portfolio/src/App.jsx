import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Nav from "./Nav";
import Hero from "./Radialgradient";
import Logo from "./Logo";
import LogoHorizontal from "./LogoHorizontal";
import Work from "./pages/Work";
import AboutContact from "./pages/About-contact";
import "./App.css";
import WorkDetail from "./pages/WorkDetail";
import { PROJECTS } from "./data/projects";
import { useEffect } from "react";
import PageTransition from "./PageTransition";
import NotFound from "./NotFound";

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
    };
    const title = titles[location.pathname];
    if (title) {
      document.title = title;
    } else if (location.pathname.startsWith("/portfolio/")) {
      const slug = location.pathname.replace("/portfolio/", "");
      const project = PROJECTS.find(p => p.slug === slug);
      document.title = project ? `${project.title} — melanie.studio` : "melanie.studio";
    }
  }, [location.pathname]);

  return (
    <div className="layout">
      {!isHome && <Nav isWork={isWork || isWorkDetail} />}
      <Logo isWork={isWork || isWorkDetail} />
      <LogoHorizontal isWork={isWork || isWorkDetail} />
      <div className="page-wrapper" style={{
        backgroundColor: isWork || isWorkDetail ? "#C93500" : "#FAF7F2",
      }}>
        <main className="content">
          <PageTransition>
            <Routes>
              <Route path="/" element={<Hero />} />
              <Route path="/portfolio" element={<Work />} />
              <Route path="/portfolio/:slug" element={<WorkDetail />} />
              <Route path="/about-contact" element={<AboutContact />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </PageTransition>
        </main>
        <footer className="site-footer" style={{
          marginTop: "auto",
          paddingTop: "1rem",
          paddingLeft: "2rem",
          paddingRight: "2rem",
          fontSize: "0.6rem",
          letterSpacing: "0.1em",
          color: isWork || isWorkDetail ? "#FAF7F2" : "#C93500",
          pointerEvents: "none",
        }}>
          © {new Date().getFullYear()} Melanie Patterson
        </footer>
      </div>
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
