import styles from "./About-contact.module.css";

export default function About() {
  return (
    <div className={styles.page}>
  
      <div className={styles.content}>
        <div className={styles.text}>
          <p className={styles.bio}>
            Melanie Patterson is a multi-disciplinary artist and designer drawing
            inspiration from oratory histories, community dynamics, and just
            societal concepts. Through her work, she is compelled to document
            rare stories, celebrate difficult truths, and make use of thoughtful
            materials with meaningful execution.
          </p>
          <p className={styles.bio}>
            Born and raised in Miami, FL, USA, she earned her BFA from Rhode
            Island School of Design in 2014 and currently lives in Providence,
            RI, USA.
          </p>
          <div className={styles.skills}>
            <p><em>Skills:</em></p>
            <p><em>Drawing</em></p>
            <p><em>Painting</em></p>
            <p><em>Digital + Print Design</em></p>
            <p><em>Web Development</em></p>
            <p><em>Photography</em></p>
            <p><em>Community Events + Organizing</em></p>
          </div>
          <div className={styles.links}>
            <a href="/cv.pdf" target="_blank" rel="noreferrer">CV</a>
            <span> / </span>
            <a href="mailto:hello@melanie.studio">Email</a>
          </div>
          <p className={styles.footer}>
            Melanie is also a content creator, blogger and fashion illustrator.
          </p>
        </div>
        <div className={styles.photo}>
          <img src="/images/melanie-patterson-headshot.gif" alt="Melanie Patterson" />
        </div>
      </div>
    </div>
  );
}