import img1 from "./images/01.webp";
import img2 from "./images/02.webp";
import img3 from "./images/03.webp";

export default function Hero() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
      <img src={img1} alt="" style={{ width: "100%", gridColumn: "span 2" }} />
      <img src={img2} alt="" style={{ width: "100%" }} />
      <img src={img3} alt="" style={{ width: "100%" }} />
    </div>
  );
}