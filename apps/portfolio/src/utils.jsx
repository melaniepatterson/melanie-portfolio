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
