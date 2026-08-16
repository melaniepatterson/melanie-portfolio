import { NavLink } from "react-router-dom";
import { SplitText } from "./utils";
import { useEffect, useState } from "react";

// On mobile work-detail pages specifically, "Work" doubles as the way
// back — swapping its label to "← Back" instead of also showing a
// separate back link in its own row (see WorkDetail.jsx, which hides
// its own .back link on mobile for the same reason). Same destination
// either way (/portfolio), so no behavior change, just the label.
export default function Nav({ isWork, isWorkDetail }) {
  const color = isWork ? "#FAF7F2" : "#C93500";
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const showBack = isWorkDetail && isMobile;

  return (
    <nav className="sidenav">
      <NavLink to="/portfolio" style={{ color, borderBottomColor: color }}><SplitText>{showBack ? "← Back" : "Work"}</SplitText></NavLink>
      <NavLink to="/about-contact" style={{ color, borderBottomColor: color }}><SplitText>{isMobile ? "Info" : "Info / Contact"}</SplitText></NavLink>
    </nav>
  );
}
