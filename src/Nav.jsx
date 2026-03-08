import { NavLink } from "react-router-dom";

export default function Nav() {
  return (
    <nav className="sidenav">
      <NavLink to="/work">Work</NavLink>
      <NavLink to="/about-contact">Info / Contact</NavLink>
    </nav>
  );
}
