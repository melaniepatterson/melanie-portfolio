import { NavLink } from "react-router-dom";

export default function Nav() {
  return (
    <nav className="sidenav">
      <NavLink to="/" end>Home</NavLink>
      <NavLink to="/work">Work</NavLink>
      <NavLink to="/about">About</NavLink>
      <NavLink to="/contact">Contact</NavLink>
    </nav>
  );
}
