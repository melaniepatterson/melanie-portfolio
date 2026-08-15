import { useState, useEffect } from "react";

// Devices with no real hover (touch) shouldn't be told to "hover to
// interact" — matches the same (hover: hover) check used to gate
// GridFisheye's simulated cursor wander and ConfettiDemo's mobile
// auto-play, so hint text and interaction fallback all agree on what
// counts as "can this device actually hover."
export function useHoverCapable() {
  const [hoverCapable, setHoverCapable] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(hover: hover)").matches
  );
  useEffect(() => {
    const mql = window.matchMedia("(hover: hover)");
    const onChange = () => setHoverCapable(mql.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);
  return hoverCapable;
}

export function SplitText({ children, className }) {
  return (
    <span className={className} aria-label={children}>
      <span aria-hidden="true">
        {children.split("").map((char, i) => (
          <span key={i} className="split-char" style={{ "--i": i }}>
            {char === " " ? " " : char}
          </span>
        ))}
      </span>
    </span>
  );
}

export function externalLinkProps(url) {
  if (url && url.startsWith("http")) {
    return { target: "_blank", rel: "noopener noreferrer" };
  }
  return {};
}
