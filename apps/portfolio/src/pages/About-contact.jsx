import { SplitText } from "../utils";
import styles from "./About-contact.module.css";
import ShimmerImage from "../components/Skeleton";
import { useEffect, useState } from "react";

export default function AboutContact() {
  const [hovered, setHovered] = useState(false);
  // Same 640px breakpoint used sitewide (Work.jsx, WorkDetail.jsx) — drives
  // both the star-mask box ratio below and skipping the hover-tilt inline
  // style, which would otherwise fight the mobile-only float animation for
  // the same transform property.
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < 640);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    // See Work.jsx — Liquid Glass falls back to html/body's real
    // background-color, so body needs this synced too, not just html.
    document.documentElement.style.backgroundColor = "#FAF7F2";
    document.body.style.backgroundColor = "#FAF7F2";
    return () => {
      document.documentElement.style.backgroundColor = "";
      document.body.style.backgroundColor = "";
    };
  }, []);

  return (
    <div className={styles.page}>
      <h1 className="sr-only">About Melanie Patterson</h1>
      <div className={styles.content}>
        <div className={styles.text}>
          <p className={styles.bio}>
            Melanie Patterson is an Indo-Jamaican American artist and designer drawing inspiration from oratory histories, community dynamics, and just societal concepts. Through her work, she is compelled to document rare stories, celebrate difficult truths, and make meaningful work across print, code, and handmade processes alike.
          </p>
          <p className={styles.bio}>
            Born and raised in Miami, FL and based in Providence, RI since earning her BFA from Rhode Island School of Design, she works at the intersection of design, code, and community.
          </p>
          <p className={styles.bio}>
            Available for freelance projects and open to new opportunities.
          </p>
         
          <div className={styles.links}>
            <a href="/images/Melanie_Patterson_Resume.pdf" target="_blank" rel="noopener noreferrer">
              <SplitText>CV</SplitText>
              <span className="sr-only"> (opens in new window)</span>
            </a>
            <span> / </span>
            <a href="mailto:hello@melanie.studio"><SplitText>Email</SplitText></a>
          </div>
       
        </div>
        <div className={styles.photo}>
          <ShimmerImage
            src="/images/melanie-patterson-headshot.webp"
            srcSet="/images/melanie-patterson-headshot-mobile.webp 480w, /images/melanie-patterson-headshot.webp 960w"
            sizes="(max-width: 640px) 234px, 480px"
            alt="Melanie Patterson"
            // Mobile swaps to the star mask's own near-square ratio
            // (122.64/114.84, rounded) so mask-size: contain in the CSS
            // fills the box edge-to-edge instead of leaving empty space
            // above/below a portrait-shaped box.
            width={isMobile ? 123 : 960}
            height={isMobile ? 115 : 1440}
            className={styles.photoShimmer}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            // On mobile the hover tilt never fires (no real hover) and
            // would otherwise sit inline forever, blocking the CSS
            // float animation below from ever touching `transform` on
            // the same element. Omit it there instead of relying on
            // animations' cascade precedence over inline styles.
            style={isMobile ? undefined : {
              transform: hovered ? "translateX(6px) rotate(0.75deg)" : "translateX(0px) rotate(0deg)",
              transition: "transform 0.5s cubic-bezier(0.22, 0.61, 0.36, 1)",
              transformOrigin: "bottom center",
            }}
          />
        </div>
      </div>
    </div>
  );
}

