import './App.css';

function App() {
  return (
    <div className="App">
      <header>
        <h1>Melanie Patterson</h1>
        <nav>
          <a href="#about">About</a>
          <a href="#work">Work</a>
          <a href="#contact">Contact</a>
        </nav>
      </header>

      <main>
        <section id="about">
          <h2>About</h2>
          <p>Designer & Developer | RISD BFA '14</p>
          <p>I blend design thinking with code to create beautiful, functional experiences.</p>
        </section>

        <section id="work">
          <h2>Work</h2>
          <p>Projects coming soon...</p>
        </section>

        <section id="contact">
          <h2>Contact</h2>
          <p>Email: [your email]</p>
          <p>GitHub: [coming soon]</p>
        </section>
      </main>
    </div>
  );
}

export default App;