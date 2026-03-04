import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import { useEffect, useState } from "react";

export default function ParticlesBackground() {
  const [init, setInit] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => setInit(true));
  }, []);

  if (!init) return null;

  return (
    <Particles
      options={{
        particles: {
          number: { value: 80 },
          move: { enable: true, speed: 2 },
          opacity: { value: 0.5 },
          size: { value: 3 },
          links: { enable: true, color: "#ffffff" }
        },
        background: { color: "#000000" }
      }}
    />
  );
}