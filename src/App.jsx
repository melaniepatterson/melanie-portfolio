import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Nav from "./Nav";
import Hero from "./Radialgradient";
import Logo from "./Logo";
import Work from "./pages/Work";
import AboutContact from "./pages/About-contact";
import "./App.css";
import WorkDetail from "./pages/WorkDetail";
import { PROJECTS } from "./data/projects";
import { useEffect, useState } from "react";
import PageTransition from "./PageTransition";
import NotFound from "./pages/NotFound";
import GlowUpCalendar from './components/GlowUpCalendar'
import Auth from './components/Auth'
import { supabase } from './lib/supabase'

function Layout() {
  const location = useLocation();
  const isHome = location.pathname === "/";
  const isWork = location.pathname === "/portfolio";
  const isWorkDetail = location.pathname.startsWith("/portfolio/");
  const isRoutine = location.pathname === "/routine";

  const [session, setSession] = useState(undefined) // undefined = loading

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Session on load:', session)
      setSession(session)
    })
    setSession(session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session))
    return () => subscription.unsubscribe()
  }, [])

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
      "/routine": "Routine — melanie.studio",
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

  // Show nothing while checking session
  if (isRoutine && session === undefined) return null

  // Show auth screen if not logged in and on /routine
  if (isRoutine && !session) return <Auth />

  return (
    <div className="layout">
      {!isHome && !isRoutine && <Nav isWork={isWork || isWorkDetail} />}
      <Logo isWork={isWork || isWorkDetail} isHidden={isRoutine} />
      <div className="page-wrapper" style={{
        backgroundColor: isWork || isWorkDetail ? "#C93500" : "#FAF7F2",
        ...(isRoutine && {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
        })
      }}>
        <main className="content">
          <PageTransition>
            <Routes>
              <Route path="/" element={<Hero />} />
              <Route path="/portfolio" element={<Work />} />
              <Route path="/portfolio/:slug" element={<WorkDetail />} />
              <Route path="/about-contact" element={<AboutContact />} />
              <Route path="*" element={<NotFound />} />
              <Route path="/routine" element={<GlowUpCalendar session={session} />} />
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

export function SplitText({ children, className }) {
  return (
    <span className={className}>
      {children.split("").map((char, i) => (
        <span key={i} className="split-char" style={{ "--i": i }}>
          {char === " " ? "\u00A0" : char}
        </span>
      ))}
    </span>
  );
}

export function externalLinkProps(url) {
  if (url && url.startsWith("http")) {
    return { target: "_blank", rel: "noopener noreferrer" };
  }
  return {};
}
