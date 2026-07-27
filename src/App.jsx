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
import BlogComingSoon from './components/BlogComingSoon'
import GlowUpAbout from './components/GlowUpAbout'
import BetaSurvey from './components/BetaSurvey'
import { supabase } from './lib/supabase'
import T from './components/theme'

// Captured once at module load, before any GlowUp route-coloring effect
// ever touches the tag — the pristine portfolio value to restore to
// outside /routine.
const PORTFOLIO_THEME_COLOR = document.querySelector('meta[name="theme-color"]')?.getAttribute('content') ?? '#C93500'

function Layout() {
  const location = useLocation();
  const isHome = location.pathname === "/";
  const isWork = location.pathname === "/portfolio";
  const isWorkDetail = location.pathname.startsWith("/portfolio/");
  const isRoutine = location.pathname.startsWith("/routine");
  // GlowUp pages that live outside /routine — no auth, no loader/Auth
  // states, just a plain white GlowUp page — but still need GlowUp's font
  // and colors instead of the portfolio's, same as everything under /routine.
  const isGlowUpStandalone = ["/privacy", "/blog", "/about-glowup"].includes(location.pathname)
  const isGlowUpPage = isRoutine || isGlowUpStandalone

  const [session, setSession] = useState(undefined)
  const [showSurvey, setShowSurvey] = useState(false)
  const [surveySubmitted, setSurveySubmitted] = useState(false)
  const [betaTester, setBetaTester] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session))
    return () => subscription.unsubscribe()
  }, [])

  // GlowUp uses DM Sans everywhere — the rest of the portfolio site sets
  // Bricolage Grotesque on <body>, which otherwise leaks through anywhere
  // a GlowUp component relies on fontFamily: 'inherit'. Same story for the
  // portfolio's brand red body color — GlowUp doesn't use it, so anywhere
  // a component leaves color unset it should inherit black, not red.
  useEffect(() => {
    document.body.style.fontFamily = isGlowUpPage ? T.fontFamily : ''
    document.body.style.color = isGlowUpPage ? T.text : ''
    // index.css sets body/html to the portfolio's cream (#FAF7F2) — that's
    // the portfolio's own default and stays as-is there, but GlowUp needs
    // its own color so the portfolio color doesn't show through on
    // overscroll/short pages or gaps under mobile browser chrome. Which
    // color depends on which GlowUp screen is actually up: the loader
    // (green) and signed-out Auth (black) aren't white like the signed-in
    // app or the standalone pages (privacy/blog/about), so blanket-forcing
    // white here left a white sliver/address-bar mismatch behind those.
    const routineBg = !isGlowUpPage ? '' : isGlowUpStandalone ? T.white : session === undefined ? T.darkGreen : !session ? T.text : T.white
    document.body.style.backgroundColor = routineBg
    document.documentElement.style.backgroundColor = routineBg
    document.body.classList.toggle('glowup-app', isGlowUpPage)
    // index.html sets theme-color to the portfolio's brand red — that colors
    // the browser chrome (mobile address bar, macOS title bar) site-wide
    // unless overridden per-route, so GlowUp gets its own color to match
    // whichever screen is showing.
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.setAttribute('content', isGlowUpPage ? routineBg : PORTFOLIO_THEME_COLOR)
    // iOS Safari only repaints its status bar/toolbar chrome on a scroll
    // event, not immediately when theme-color changes via JS — and since
    // GlowUp's full-screen states (loader, Auth) use position:fixed with no
    // window-level scrolling, that repaint trigger never naturally happens,
    // leaving the chrome stuck on whatever color was there at first paint.
    // Nudging the window by 1px and back forces Safari to resample it.
    requestAnimationFrame(() => {
      window.scrollTo(window.scrollX, window.scrollY + 1)
      requestAnimationFrame(() => window.scrollTo(window.scrollX, window.scrollY - 1))
    })
  }, [isGlowUpPage, isGlowUpStandalone, session])

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
      "/blog": "Blog — melanie.studio",
      "/about-glowup": "About — melanie.studio",
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

  // Blog — no auth required, placeholder until the real thing ships
  if (location.pathname === "/blog") return <BlogComingSoon />

  // GlowUp's own About page — no auth required, distinct from the
  // portfolio's /about-contact (which is about Melanie, not the app)
  if (location.pathname === "/about-glowup") return <GlowUpAbout />

  // Calendar — full screen, no nav/logo/footer chrome. Bypasses page-wrapper
  // like the other /routine/* pages below: page-wrapper centers <main> via
  // alignItems (needed elsewhere), which makes it shrink-wrap to whatever
  // child has an explicit width — GlowUpCalendar's own maxWidth:900 content
  // column — so its sticky header could never reach the true viewport edge
  // from inside that wrapper no matter what width it declared itself.
  if (location.pathname === "/routine") return (
    <>
      <ErrorBoundary><GlowUpCalendar session={session} /></ErrorBoundary>
      <CookieNotice variant="glowup" />
    </>
  )

  // Profile page — full screen, no nav/logo/footer chrome
  if (location.pathname === "/routine/profile") return (
    <>
      <Profile session={session} onOpenSurvey={() => setShowSurvey(true)} />
      <CookieNotice variant="glowup" />
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
  if (location.pathname === "/routine/history") return (
    <>
      <RoutineHistory session={session} betaTester={betaTester} />
      <CookieNotice variant="glowup" />
    </>
  )
  if (location.pathname === "/routine/products") return (
    <>
      <ProductsPage session={session} betaTester={betaTester} />
      <CookieNotice variant="glowup" />
    </>
  )

  return (
    <>
      <div className="layout">
        {!isHome && !isRoutine && <Nav isWork={isWork || isWorkDetail} />}
        <Logo isWork={isWork || isWorkDetail} isHidden={isRoutine} />
        <div className="page-wrapper" style={{
          backgroundColor: isWork || isWorkDetail ? "#C93500" : isRoutine ? T.white : "#FAF7F2",
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
                <Route path="/routine/history" element={<ErrorBoundary><RoutineHistory session={session} betaTester={betaTester} /></ErrorBoundary>} />
                <Route path="/routine/products" element={<ErrorBoundary><ProductsPage session={session} betaTester={betaTester} /></ErrorBoundary>} />
              </Routes>
            </PageTransition>
          </main>
          <footer style={{
            marginTop: "auto",
            padding: "1rem 2rem",
            fontSize: "0.6rem",
            letterSpacing: "0.1em",
            opacity: 0.4,
            color: isWork || isWorkDetail ? "#FAF7F2" : isRoutine ? T.darkGreen : "#C93500",
            pointerEvents: "none",
          }}>
            © {new Date().getFullYear()} Melanie Patterson
          </footer>
        </div>
      </div>
      <CookieNotice variant={isRoutine ? 'glowup' : 'portfolio'} />
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
