import img3 from "./images/03.webp";

export default function Thumbnail({ hovered }) {
  return (
    <div style={{ position: "relative", width: "100%", aspectRatio: "4/3" }}>
      <img
        src={img3}
        alt=""
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />
    </div>
  );
}
