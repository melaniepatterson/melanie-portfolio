import { NavLink } from "react-router-dom";
import { SplitText } from "../App";

export default function Nav({ isWork }) {
  const color = isWork ? "#FAF7F2" : "#C93500";
  return (
    <nav className="sidenav">
      <NavLink to="/portfolio" style={{ color, borderBottomColor: color }}><SplitText>Work</SplitText></NavLink>
      <NavLink to="/about-contact" style={{ color, borderBottomColor: color }}><SplitText>Info / Contact</SplitText></NavLink>
    </nav>
  );
}
