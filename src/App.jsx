import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Nav from "./Nav";
import Hero from "./Radialgradient";
import Logo from "./Logo";
import Work from "./pages/Work";
import AboutContact from "./pages/About-contact";
import "./App.css";
import WorkDetail from "./pages/WorkDetail";

function Layout() {
  const location = useLocation();
  const isHome = location.pathname === "/";
  const isWork = location.pathname === "/portfolio";
  const isWorkDetail = location.pathname.startsWith("/portfolio/");

  return (
    <div className="layout">
      {!isHome && <Nav isWork={isWork || isWorkDetail} />}
      <Logo isWork={isWork || isWorkDetail} />
      <main className="content">
        <Routes>
          <Route path="/" element={<Hero />} />
          <Route path="/portfolio" element={<Work />} />
          <Route path="/portfolio/:slug" element={<WorkDetail />} />
          <Route path="/about-contact" element={<AboutContact />} />
        </Routes>
      </main>
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

