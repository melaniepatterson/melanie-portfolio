// Browser-window chrome for the looping app-open-email video in the RISD
// hero — same mix-blend-mode: multiply overlay technique as the shared
// BrowserFrame component, but narrower (viewBox 0 0 1620.5 1876.4) and
// built for a fixed-loop <video> instead of a scrollable screenshot.
export default function EmailBrowserFrame({ src }) {
  return (
    <svg
      viewBox="0 0 1620.5 1876.4"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: "100%", height: "auto", display: "block" }}
      aria-hidden="true"
    >
      <defs>
        {/* Square top corners (flush against the top bar's flat bottom
            edge), rounded bottom corners matching the body outline's own
            radius — same mixed-corner approach as BrowserFrame's clipPath. */}
        <clipPath id="risdEmailFrameClip">
          <path d="M18.57 134.45H1602.37V1798.9A50 50 0 0 1 1552.37 1848.9H68.57A50 50 0 0 1 18.57 1798.9Z" />
        </clipPath>
      </defs>

      <g clipPath="url(#risdEmailFrameClip)">
        <foreignObject x="18.57" y="134.45" width="1583.8" height="1664.45">
          <div xmlns="http://www.w3.org/1999/xhtml" style={{ position: "relative", width: "1583.8px", height: "1664.45px", overflow: "hidden" }}>
            <video
              src={src}
              autoPlay
              loop
              muted
              playsInline
              disablePictureInPicture
              controls={false}
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          </div>
        </foreignObject>
      </g>

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
  );
}
