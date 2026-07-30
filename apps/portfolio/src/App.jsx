import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Nav from "./Nav";
import Hero from "./Radialgradient";
import Logo from "./Logo";
import Work from "./pages/Work";
import AboutContact from "./pages/About-contact";
import "./App.css";
import WorkDetail from "./pages/WorkDetail";
import { PROJECTS } from "./data/projects";
import { useEffect } from "react";
import PageTransition from "./PageTransition";
import NotFound from "@shared/NotFound";
import CookieNotice from "@shared/CookieNotice";

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
    <>
      <div className="layout">
        {!isHome && <Nav isWork={isWork || isWorkDetail} />}
        <Logo isWork={isWork || isWorkDetail} />
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
          <footer style={{
            marginTop: "auto",
            padding: "1rem 2rem",
            fontSize: "0.6rem",
            letterSpacing: "0.1em",
            opacity: 0.4,
            color: isWork || isWorkDetail ? "#FAF7F2" : "#C93500",
            pointerEvents: "none",
          }}>
            © {new Date().getFullYear()} Melanie Patterson
          </footer>
        </div>
      </div>
      <CookieNotice variant="portfolio" />
    </>
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
