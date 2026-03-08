import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Nav from "./Nav";
import Hero from "./Radialgradient";
import Logo from "./Logo";
import Work from "./pages/Work";
import AboutContact from "./pages/About-contact";
import "./App.css";

function Layout() {
  const location = useLocation();
  const isHome = location.pathname === "/";

  return (
    <div className="layout">
      {!isHome && <Nav />}
      <Logo />
      <main className="content">
        <Routes>
          <Route path="/" element={<Hero />} />
          <Route path="/work" element={<Work />} />
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