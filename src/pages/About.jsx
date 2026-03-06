export default function About() {
  return (
    <div className="about-page">
      <div className="about-nav">
        <span className="about-label">ABOUT</span>
      </div>
      <div className="about-content">
        <div className="about-text">
          <p className="about-bio">
            Melanie Patterson is a multi-disciplinary artist and designer drawing
            inspiration from oratory histories, community dynamics, and just
            societal concepts. Through her work, she is compelled to document
            rare stories, celebrate difficult truths, and make use of thoughtful
            materials with meaningful execution.
          </p>
          <p className="about-bio">
            Born and raised in Miami, FL, USA, she earned her BFA from Rhode
            Island School of Design in 2014 and currently lives in Providence,
            RI, USA.
          </p>
          <div className="about-skills">
            <p><em>Skills:</em></p>
            <p><em>Drawing</em></p>
            <p><em>Painting</em></p>
            <p><em>Digital + Print Design</em></p>
            <p><em>Web Development</em></p>
            <p><em>Photography</em></p>
            <p><em>Community Events + Organizing</em></p>
          </div>
          <div className="about-links">
            <a href="/cv.pdf" target="_blank" rel="noreferrer">CV</a>
            <span> / </span>
            <a href="mailto:hello@melanie.studio">Email</a>
          </div>
          <p className="about-footer">
            Melanie is also a content creator, blogger and fashion illustrator.
          </p>
        </div>
        <div className="about-photo">
          <img src="https://placehold.co/500x600" alt="Melanie Patterson" />
        </div>
      </div>
    </div>
  );
}
