// import img1 from "./images/melanie-patterson-risd.webp";
import img2 from "./images/melanie-patterson-risd-email-1.webp";
import img3 from "./images/03.webp";

export default function Thumbnail({ hovered }) {
  return (
    <div style={{ position: "relative", width: "100%", aspectRatio: "4/3" }}>
      <img
        src={img1}
        alt=""
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />
      <img
        src={img2}
        alt=""
        style={{
          position: "absolute",
          bottom: "5%",
          right: "5%",
          width: "45%",
          height: "auto",
          transition: "transform 0.4s ease",
          transform: hovered ? "translate(4px, -4px)" : "none",
        }}
      />
      <img
        src={img3}
        alt=""
        style={{
          position: "absolute",
          top: "5%",
          left: "5%",
          width: "30%",
          height: "auto",
        }}
      />
    </div>
  );
}