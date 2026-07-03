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
import GlowUpLoader from './components/GlowUpLoader'
import { ErrorBoundary } from './components/ErrorBoundary'
import Auth from './components/Auth'
import Profile from './components/Profile'
import RoutineHistory from './components/RoutineHistory'
import ProductsPage from './components/ProductsPage'
import CookieNotice from './components/CookieNotice'
import PrivacyPolicy from './components/PrivacyPolicy'
import BetaSurvey from './components/BetaSurvey'
import { supabase } from './lib/supabase'

function Layout() {
  const location = useLocation();
  const isHome = location.pathname === "/";
  const isWork = location.pathname === "/portfolio";
  const isWorkDetail = location.pathname.startsWith("/portfolio/");
  const isRoutine = location.pathname.startsWith("/routine");

  const [session, setSession] = useState(undefined)
  const [showSurvey, setShowSurvey] = useState(false)
  const [surveySubmitted, setSurveySubmitted] = useState(false)
  const [betaTester, setBetaTester] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session))
    return () => subscription.unsubscribe()
  }, [])

  // Check ?survey=1 param — open modal over whatever page is current
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('survey') === '1') {
      window.history.replaceState({}, '', window.location.pathname)
      setShowSurvey(true)
    }
  }, [location.search])

  // Load beta tester + survey status when session is available
  useEffect(() => {
    if (!session?.user?.id) return
    supabase.from('profiles').select('beta_tester, survey_submitted_at')
      .eq('id', session.user.id).single()
      .then(({ data }) => {
        if (data) {
          setBetaTester(data.beta_tester || false)
          setSurveySubmitted(!!data.survey_submitted_at)
          // Also open survey if param was set before profile loaded
          if (data.beta_tester && new URLSearchParams(window.location.search).get('survey') === '1') {
            window.history.replaceState({}, '', window.location.pathname)
            setShowSurvey(true)
          }
        }
      })
  }, [session?.user?.id])

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
      "/routine/profile": "Profile — melanie.studio",
      "/routine/history": "History — melanie.studio",
      "/routine/products": "Products — melanie.studio",
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

  if (isRoutine && session === undefined) return <GlowUpLoader />
  if (isRoutine && !session) return <Auth />

  // Privacy policy — no auth required
  if (location.pathname === "/privacy") return <PrivacyPolicy />

  // Profile page — full screen, no nav/logo/footer chrome
  if (location.pathname === "/routine/profile") return (
    <>
      <Profile session={session} onOpenSurvey={() => setShowSurvey(true)} />
      {showSurvey && session && (
        <BetaSurvey
          session={session}
          onClose={() => setShowSurvey(false)}
          onSubmitted={() => { setSurveySubmitted(true); setShowSurvey(false) }}
          betaTester={betaTester}
          alreadySubmitted={surveySubmitted}
        />
      )}
    </>
  )
  if (location.pathname === "/routine/history") return <RoutineHistory session={session} />
  if (location.pathname === "/routine/products") return <ProductsPage session={session} />

  return (
    <>
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
            overflowX: 'hidden',
            maxWidth: '100vw',
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
                <Route path="/routine" element={<ErrorBoundary><GlowUpCalendar session={session} /></ErrorBoundary>} />
                <Route path="/routine/profile" element={<ErrorBoundary><Profile session={session} /></ErrorBoundary>} />
                <Route path="/routine/history" element={<ErrorBoundary><RoutineHistory session={session} /></ErrorBoundary>} />
                <Route path="/routine/products" element={<ErrorBoundary><ProductsPage session={session} /></ErrorBoundary>} />
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
      <CookieNotice />
      {showSurvey && session && (
        <BetaSurvey
          session={session}
          onClose={() => setShowSurvey(false)}
          onSubmitted={() => { setSurveySubmitted(true); setShowSurvey(false) }}
          betaTester={betaTester}
          alreadySubmitted={surveySubmitted}
        />
      )}
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
