import { SplitText } from "../App";
import styles from "./About-contact.module.css";
import { useEffect } from "react";

export default function About() {
  
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
            Melanie Patterson is an Indo-Jamaican American artist and designer drawing inspiration from oratory histories, community dynamics, and just societal concepts. Through her work, she is compelled to document rare stories, celebrate difficult truths, and make use of thoughtful materials with meaningful execution. Her practice exists across digital contexts, but is unyieldingly informed by handmade and traditional processes.
          </p>
          <p className={styles.bio}>
            Born and raised in Miami, FL, she earned her BFA in Illustration from Rhode Island School of Design and currently lives in Providence, RI. She manages digital communications at RISD, bridging design and technical implementation across HTML email production, marketing copy, and creative direction.
          </p>
          <p className={styles.bio}>
            Her commitment to community led to her involvement in grassroots civic organizing, where she applies creative tools to amplify advocacy work.
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
          <img src="/images/melanie-patterson-headshot.webp" alt="Melanie Patterson" />
        </div>
      </div>
    </div>
  );
}