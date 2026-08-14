// Browser-window chrome for the looping app-open-email video in the RISD
// hero — same mix-blend-mode: multiply overlay technique as the shared
// BrowserFrame component, but narrower (viewBox 0 0 1620.5 1920) and built
// for a fixed-loop <video> instead of a scrollable screenshot.
export default function EmailBrowserFrame({ src }) {
  return (
    <svg
      viewBox="0 0 1620.5 1920"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: "100%", height: "auto", display: "block" }}
      aria-hidden="true"
    >
      <defs>
        {/* Square top corners (flush against the top bar's flat bottom
            edge), rounded bottom corners matching the body ring's radius —
            same mixed-corner approach as BrowserFrame's own clipPath. */}
        <clipPath id="risdEmailFrameClip">
          <path d="M21.6 137.45H1599.4V1846.85A47 47 0 0 1 1552.4 1893.85H68.6A47 47 0 0 1 21.6 1846.85Z" />
        </clipPath>
      </defs>

      <g clipPath="url(#risdEmailFrameClip)">
        <foreignObject x="21.6" y="137.45" width="1577.8" height="1709.4">
          <div xmlns="http://www.w3.org/1999/xhtml" style={{ position: "relative", width: "1577.8px", height: "1709.4px", overflow: "hidden" }}>
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
          fill="#C93500"
          d="m1599.4 137.45v1709.4c0 25.92-21.08 47-47 47h-1483.8c-25.92 0-47-21.08-47-47v-1709.4h1577.8zm3-3h-1583.8v1712.4c0 27.5 22.5 50 50 50h1483.8c27.5 0 50-22.5 50-50v-1712.4z"
        />
      </g>

      {/* Top bar with traffic-light dots and address-bar pill cut out as
          true holes (opposite-winding subpaths in one compound path),
          multiplied over the base layer above — same chrome color/blend
          used by the shared BrowserFrame component elsewhere on the site. */}
      <g style={{ mixBlendMode: "multiply" }}>
        <path
          fill="#982511"
          d="m1552.4 23.1h-1483.8c-27.5 0-50 22.5-50 50v61.36h1583.8v-61.36c0-27.5-22.5-50-50-50zm-1477.2 71.49c-8.43 0-15.26-6.83-15.26-15.26s6.83-15.26 15.26-15.26 15.26 6.83 15.26 15.26-6.83 15.26-15.26 15.26zm40.32 0c-8.43 0-15.26-6.83-15.26-15.26s6.83-15.26 15.26-15.26 15.26 6.83 15.26 15.26-6.83 15.26-15.26 15.26zm40.32 0c-8.43 0-15.26-6.83-15.26-15.26s6.83-15.26 15.26-15.26 15.26 6.83 15.26 15.26-6.83 15.26-15.26 15.26zm1387.9-15.26c0 14.09-11.52 25.61-25.61 25.61h-1273.6c-14.09 0-25.61-11.52-25.61-25.61s11.52-25.61 25.61-25.61h1273.6c14.08 0 25.61 11.52 25.61 25.61z"
        />
        <path
          fill="#982511"
          d="m1599.4 137.45v1709.4c0 25.92-21.08 47-47 47h-1483.8c-25.92 0-47-21.08-47-47v-1709.4h1577.8zm3-3h-1583.8v1712.4c0 27.5 22.5 50 50 50h1483.8c27.5 0 50-22.5 50-50v-1712.4z"
        />
      </g>
    </svg>
  );
}
