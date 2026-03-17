import { SplitText } from "../App";
import styles from "./About-contact.module.css";
import { useEffect, useState } from "react";

export default function AboutContact() {
  const [hovered, setHovered] = useState(false);
  
  useEffect(() => {
    document.documentElement.style.backgroundColor = "#C93500";
    return () => {
      document.documentElement.style.backgroundColor = "";
    };
  }, []);

  return (
    <div className={styles.page}>
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
            <a href="/cv.pdf" target="_blank" rel="noreferrer" ><SplitText>CV</SplitText></a>
            <span> / </span>
            <a href="mailto:hello@melanie.studio"><SplitText>Email</SplitText></a>
          </div>
       
        </div>
        <div className={styles.photo}>
          <img
            src="/images/melanie-patterson-headshot.webp"
            alt="Melanie Patterson"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
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

