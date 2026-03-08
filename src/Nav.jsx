import { NavLink } from "react-router-dom";

export default function Nav({ isWork }) {
  const color = isWork ? "#fff" : "#C93500";
  return (
    <nav className="sidenav">
      <NavLink to="/work" style={{ color, borderBottomColor: color }}>Work</NavLink>
      <NavLink to="/about-contact" style={{ color, borderBottomColor: color }}>Info / Contact</NavLink>
    </nav>
  );
}
