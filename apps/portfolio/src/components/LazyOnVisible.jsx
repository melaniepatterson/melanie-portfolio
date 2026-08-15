import { useState, useEffect, useRef } from "react";

// React.lazy() triggers its import() the moment the lazy component is
// rendered, not when it's actually visible — so a project page's gallery
// items (several of which are React.lazy() components, like RISD's
// GridFisheye/FallingRectangles/ConfettiDemo) were all being fetched at
// once on mount, chaining into the page's critical request latency, even
// though most of them sit well below the fold. This defers rendering the
// given (already-lazy) children until the wrapper is on/near screen,
// showing `placeholder` in the meantime — the same placeholder Suspense
// would show anyway, so there's no visible difference, just a later
// start time for the fetch. Fires once; doesn't un-render on scroll-away.
export default function LazyOnVisible({ placeholder, rootMargin = "400px", children }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (visible) return;
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [visible]);

  if (visible) return children;
  return (
    <div ref={ref} style={{ width: "100%" }}>
      {placeholder}
    </div>
  );
}
