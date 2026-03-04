cat > src/Particles.jsx << 'EOF'
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadFull } from "tsparticles";
import { useEffect, useState } from "react";

export default function ParticlesBackground() {
  const [init, setInit] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadFull(engine);
    }).then(() => setInit(true));
  }, []);

  if (!init) return null;

  return (
    <Particles
      options={{"autoPlay":true,"background":{"color":{"value":"#fff"},"opacity":1},"clear":true,"detectRetina":true,"fpsLimit":120,"interactivity":{"detectsOn":"window","events":{"onClick":{"enable":true,"mode":"push"},"onHover":{"enable":true,"mode":"bubble","parallax":{"enable":false,"force":2,"smooth":10}},"resize":{"delay":0.5,"enable":true}},"modes":{"bubble":{"distance":400,"duration":2,"mix":false,"opacity":0.8,"size":40},"push":{"default":true,"quantity":4},"repulse":{"distance":200,"duration":0.4,"factor":100,"speed":1,"maxSpeed":50,"easing":"ease-out-quad"}}},"particles":{"color":{"value":"#ffffff"},"move":{"enable":true,"speed":2,"direction":"none","outModes":{"default":"out"}},"number":{"density":{"enable":true,"width":1920,"height":1080},"value":80},"opacity":{"value":1},"shape":{"type":"image","options":{"image":{"0":{"name":"dots"}}}},"size":{"value":16},"rotate":{"value":{"min":0,"max":360},"animation":{"enable":true,"speed":5,"sync":false},"direction":"random"}},"pauseOnBlur":true,"pauseOnOutsideViewport":true,"preload":{"src":"/images/melanie%20studio%20circle.svg","gif":false,"height":32,"name":"dots","width":32}}}
    />
  );
}
EOF