import './App.css';
import ParticlesBackground from "./Particles";   // ← add this line at the top

function App() {
  return (
    <div className="App">
      <header>
        <ParticlesBackground />
        <h1 class="site-name">Melanie Patterson</h1>
        <nav>
          <a href="#about">About</a>
          <a href="#contact">Contact</a>
        </nav>
      </header>

      <main>
        <section id="about">
          <p><a href="">Work</a><a href="">Play</a></p>
        </section>
      </main>
    </div>
  );
}

export default App;