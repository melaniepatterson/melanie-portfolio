// Browser-window chrome for the looping app-open-email video in the RISD
// hero — same mix-blend-mode: multiply overlay technique as the shared
// BrowserFrame component, but narrower (viewBox 0 0 1620.5 1876.4) and
// built for a fixed-loop <video> instead of a scrollable screenshot.
//
// Unlike BrowserFrame/MobileFrame, the video here is NOT inside a
// foreignObject — real Safari has a longstanding bug where foreignObject
// content doesn't reliably respect the ambient SVG's viewBox scaling, and
// for a <video> specifically that surfaced as a severe crop/zoom (the
// element rendering at its literal unscaled pixel size, with only a
// corner of it visible through the clipped frame) rather than the milder
// overflow BrowserFrame's static screenshots showed. Rendering the video
// as a plain HTML layer, sized with ordinary percentages against a
// CSS-aspect-ratio container, sidesteps the whole bug category instead of
// patching around it again — the SVG above it is purely decorative chrome
// (traffic lights + border), pointer-events: none, with nothing living
// inside it that Safari's foreignObject bug could ever apply to.
export default function EmailBrowserFrame({ src }) {
  return (
    <div style={{ position: "relative", width: "100%", aspectRatio: "1620.5 / 1876.4" }}>
      {/* Screen area, as a % of the frame — matches the chrome art's own
          drawn border below (x=18.57 y=134.45 w=1583.8 h=1714.45 out of
          the 1620.5x1876.4 viewBox). Corner radius is expressed as two
          percentages (horizontal % of width / vertical % of height) so a
          50-unit radius in that same 1583.8x1714.45 space stays exactly
          circular at any rendered size, not just the one it was tuned at. */}
      <div
        style={{
          position: "absolute",
          left: "1.146%",
          top: "7.166%",
          width: "97.735%",
          height: "91.377%",
          overflow: "hidden",
          // Shorthand slash separates the whole horizontal-radii list from
          // the whole vertical-radii list (not per-corner) — 0 0 X X for
          // top-left/top-right/bottom-right/bottom-left horizontal radii,
          // then the same four again for vertical.
          borderRadius: "0 0 3.157% 3.157% / 0 0 2.917% 2.917%",
        }}
      >
        <video
          autoPlay
          loop
          muted
          playsInline
          disablePictureInPicture
          controls={false}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        >
          {/* See VisibilityGatedVideo.jsx — Safari can't decode VP9/WebM
              at all, so it needs the H.264 .mp4 fallback. */}
          <source src={src} type="video/webm" />
          <source src={src.replace(/\.webm$/, ".mp4")} type="video/mp4" />
        </video>
      </div>

      <svg
        viewBox="0 0 1620.5 1876.4"
        xmlns="http://www.w3.org/2000/svg"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
        aria-hidden="true"
      >
        {/* Solid page-red base underneath the multiply layer below: multiply
            blends with whatever's visually behind it, and behind this frame
            is a photo, not the page background — this base stands in for the
            page color so the multiply math below lands on the same result it
            would elsewhere on the page (multiplying over the actual C93500
            background), instead of muddying against the photo's blue. */}
        <g>
          <path
            fill="#C93500"
            d="m1552.4 23.1h-1483.8c-27.5 0-50 22.5-50 50v61.36h1583.8v-61.36c0-27.5-22.5-50-50-50zm-1477.2 71.49c-8.43 0-15.26-6.83-15.26-15.26s6.83-15.26 15.26-15.26 15.26 6.83 15.26 15.26-6.83 15.26-15.26 15.26zm40.32 0c-8.43 0-15.26-6.83-15.26-15.26s6.83-15.26 15.26-15.26 15.26 6.83 15.26 15.26-6.83 15.26-15.26 15.26zm40.32 0c-8.43 0-15.26-6.83-15.26-15.26s6.83-15.26 15.26-15.26 15.26 6.83 15.26 15.26-6.83 15.26-15.26 15.26zm1387.9-15.26c0 14.09-11.52 25.61-25.61 25.61h-1273.6c-14.09 0-25.61-11.52-25.61-25.61s11.52-25.61 25.61-25.61h1273.6c14.08 0 25.61 11.52 25.61 25.61z"
          />
          <path
            fill="none"
            stroke="#C93500"
            strokeMiterlimit="10"
            strokeWidth="3"
            d="M18.57,134.45v1664.45c0,27.5,22.5,50,50,50h1483.8c27.5,0,50-22.5,50-50V134.45H18.57Z"
          />
        </g>

        {/* Top bar (traffic-light dots + address-bar pill cut out as true
            holes) and body outline, multiplied over the base layer above —
            same chrome color/blend used by the shared BrowserFrame component
            elsewhere on the site. */}
        <g style={{ mixBlendMode: "multiply" }}>
          <path
            fill="#982511"
            d="m1552.4 23.1h-1483.8c-27.5 0-50 22.5-50 50v61.36h1583.8v-61.36c0-27.5-22.5-50-50-50zm-1477.2 71.49c-8.43 0-15.26-6.83-15.26-15.26s6.83-15.26 15.26-15.26 15.26 6.83 15.26 15.26-6.83 15.26-15.26 15.26zm40.32 0c-8.43 0-15.26-6.83-15.26-15.26s6.83-15.26 15.26-15.26 15.26 6.83 15.26 15.26-6.83 15.26-15.26 15.26zm40.32 0c-8.43 0-15.26-6.83-15.26-15.26s6.83-15.26 15.26-15.26 15.26 6.83 15.26 15.26-6.83 15.26-15.26 15.26zm1387.9-15.26c0 14.09-11.52 25.61-25.61 25.61h-1273.6c-14.09 0-25.61-11.52-25.61-25.61s11.52-25.61 25.61-25.61h1273.6c14.08 0 25.61 11.52 25.61 25.61z"
          />
          <path
            fill="none"
            stroke="#982511"
            strokeMiterlimit="10"
            strokeWidth="3"
            d="M18.57,134.45v1664.45c0,27.5,22.5,50,50,50h1483.8c27.5,0,50-22.5,50-50V134.45H18.57Z"
          />
        </g>
      </svg>
    </div>
  );
}
