import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect, useState, Suspense, lazy } from "react";
import "./App.css";
import GlowUpCalendar from './GlowUpCalendar'
import GlowUpLoader from './GlowUpLoader'
import { ErrorBoundary } from './ErrorBoundary'
import Auth from './Auth'
import BlogComingSoon from './BlogComingSoon'
import GlowUpAbout from './GlowUpAbout'
import BetaSurvey from './BetaSurvey'

// Split out of the main bundle — visited far less often than the calendar
// home route, and this is what keeps the build under the 500KB chunk warning.
const Profile = lazy(() => import('./Profile'))
const RoutineHistory = lazy(() => import('./RoutineHistory'))
const ProductsPage = lazy(() => import('./ProductsPage'))
const PrivacyPolicy = lazy(() => import('./PrivacyPolicy'))
import T from './theme'
import { supabase, realSupabase } from './supabase'
import CookieNotice from './CookieNotice'
import NotFound from './NotFound'
import DemoBanner from './DemoBanner'

const IS_DEMO = import.meta.env.VITE_GLOWUP_DEMO === 'true'

const PUBLIC_PATHS = ["/privacy", "/blog", "/about-glowup"]

function Layout() {
  const location = useLocation();
  const isPublicPage = PUBLIC_PATHS.includes(location.pathname)

  const [session, setSession] = useState(undefined)
  const [showSurvey, setShowSurvey] = useState(false)
  const [surveySubmitted, setSurveySubmitted] = useState(false)
  const [betaTester, setBetaTester] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session))
    return () => subscription.unsubscribe()
  }, [])

  // index.html sets theme-color to white by default — this keeps the browser
  // chrome (mobile address bar, macOS title bar) in sync with whichever
  // screen is showing: black behind the loader/signed-out Auth screen,
  // white everywhere else.
  useEffect(() => {
    const routineBg = (!isPublicPage && !session) ? T.text : T.white
    document.body.style.backgroundColor = routineBg
    document.documentElement.style.backgroundColor = routineBg
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.setAttribute('content', routineBg)
  }, [isPublicPage, session])

  // iOS Safari only repaints its status bar/toolbar chrome on a scroll
  // event, not immediately when theme-color changes via JS. GlowUp's
  // full-screen states (loader, Auth) use position:fixed with no other
  // content in normal document flow, so the page can genuinely have zero
  // scrollable height — window.scrollTo would then be a silent no-op (no
  // scroll event ever fires). Forcing 1px of real overflow first
  // guarantees the nudge actually scrolls, and holding it for a real
  // 120ms via setTimeout (rather than just the next animation frame)
  // is what a real device needs to reliably resample.
  useEffect(() => {
    const html = document.documentElement
    const prevMinHeight = html.style.minHeight
    html.style.minHeight = 'calc(100vh + 2px)'
    const raf = requestAnimationFrame(() => {
      window.scrollTo(window.scrollX, window.scrollY + 2)
    })
    const timeout = setTimeout(() => {
      window.scrollTo(window.scrollX, window.scrollY - 2)
      html.style.minHeight = prevMinHeight
    }, 120)
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(timeout)
      html.style.minHeight = prevMinHeight
    }
  }, [isPublicPage, session])

  // Check ?survey=1 param — open modal over whatever page is current
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('survey') === '1') {
      window.history.replaceState({}, '', window.location.pathname)
      setShowSurvey(true)
    }
  }, [location.search])

  // Demo build only: log one visit per ?ref= tag (e.g. ?ref=acme) so
  // Melanie can tell which company/application a click-through came from.
  // Stored in sessionStorage so the tag survives in-app navigation without
  // needing to stay in the URL bar, and only logged once per session.
  useEffect(() => {
    if (!IS_DEMO || !realSupabase) return
    const params = new URLSearchParams(window.location.search)
    const ref = params.get('ref')
    if (ref) sessionStorage.setItem('glowup_demo_ref', ref)
    if (sessionStorage.getItem('glowup_demo_visit_logged')) return
    sessionStorage.setItem('glowup_demo_visit_logged', '1')
    realSupabase.from('demo_visits').insert({
      ref: sessionStorage.getItem('glowup_demo_ref') || null,
      path: window.location.pathname,
    }).then(({ error }) => {
      // Non-fatal — the demo_visits table may not exist yet if Melanie
      // hasn't run the setup SQL. Never let this affect the demo itself.
      if (error) console.warn('Demo visit logging failed (is the demo_visits table set up?):', error.message)
    })
  }, [])

  // Load beta tester + survey status when session is available
  useEffect(() => {
    if (!session?.user?.id) return
    supabase.from('profiles').select('beta_tester, survey_submitted_at')
      .eq('id', session.user.id).single()
      .then(({ data, error }) => {
        if (error) console.error('Beta tester/survey status load error:', error)
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
      "/": "Routine — Glow Up",
      "/profile": "Profile — Glow Up",
      "/history": "History — Glow Up",
      "/products": "Products — Glow Up",
      "/blog": "Blog — Glow Up",
      "/about-glowup": "About — Glow Up",
    };
    const title = titles[location.pathname];
    if (title) document.title = title;
  }, [location.pathname]);

  if (!isPublicPage && session === undefined) return <GlowUpLoader />
  if (!isPublicPage && !session) return <Auth />

  return (
    <Suspense fallback={<GlowUpLoader />}>
      <Routes>
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/blog" element={<BlogComingSoon />} />
        <Route path="/about-glowup" element={<GlowUpAbout />} />
        <Route path="/" element={
          <>
            <ErrorBoundary><GlowUpCalendar session={session} /></ErrorBoundary>
            <CookieNotice />
          </>
        } />
        <Route path="/profile" element={
          <>
            <Profile session={session} onOpenSurvey={() => setShowSurvey(true)} />
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
        } />
        <Route path="/history" element={
          <>
            <RoutineHistory session={session} betaTester={betaTester} />
            <CookieNotice />
          </>
        } />
        <Route path="/products" element={
          <>
            <ProductsPage session={session} betaTester={betaTester} />
            <CookieNotice />
          </>
        } />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

function App() {
  return (
    <>
      {IS_DEMO && <DemoBanner />}
      <BrowserRouter>
        <Layout />
      </BrowserRouter>
    </>
  );
}

export default App;
