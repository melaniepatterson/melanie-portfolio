import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

export default function PageTransition({ children }) {
  const location = useLocation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(false);
    const timer = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  return (
    <div style={{
      opacity: visible ? 1 : 0,
      transition: "opacity 0.4s ease",
    }}>
      {children}
    </div>
  );
}