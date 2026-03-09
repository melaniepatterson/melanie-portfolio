import { NavLink } from "react-router-dom";

export default function Nav({ isWork }) {
  const color = isWork ? "#FAF7F2" : "#C93500";
  return (
    <nav className="sidenav">
      <NavLink to="/portfolio" style={{ color, borderBottomColor: color }}>Work</NavLink>
      <NavLink to="/about-contact" style={{ color, borderBottomColor: color }}>Info / Contact</NavLink>
    </nav>
  );
}
