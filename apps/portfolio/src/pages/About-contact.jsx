import { SplitText, computeRepulsion, applyRepulsionStyle } from "../utils";
import styles from "./About-contact.module.css";
import ShimmerImage from "../components/Skeleton";
import { useEffect, useRef, useState, forwardRef } from "react";

// Top-left decorative accent — gets the same cursor-repulsion motion as
// Home's stars on desktop (see Radialgradient.jsx / utils.jsx); static on
// mobile. Position/size come from the caller so desktop and mobile can
// differ (desktop crops it above the viewport; mobile crops it off the
// left edge instead).
//
// Split into an outer wrapper (fixed position/size + a static -10deg
// resting rotation) and an inner <svg> that only the repulsion effect
// touches — nested transforms compose, so the push/pull motion layers on
// top of the static rotation instead of replacing it (computeRepulsion's
// "at rest" case always returns rotate(0deg), which would otherwise wipe
// out a rotation set directly on the ref'd element).
//
// z-index: -1, not a positive value — these render as children of .page
// (z-index: 2, itself position: relative), not as true siblings of it, so
// a positive z-index here would hoist them above .page's own unpositioned
// in-flow content (the bio text, the photo) regardless of DOM order or
// .page's z-index. Negative keeps them behind all of that.
const StarLeft = forwardRef(({ style }, ref) => (
  <div
    style={{
      position: "fixed",
      pointerEvents: "none",
      zIndex: -1,
      transform: "rotate(-10deg)",
      ...style,
    }}
  >
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 148.21 132.95"
      aria-hidden="true"
      style={{ display: "block", width: "100%", height: "100%", fill: "#ffd6f9", willChange: "transform" }}
    >
    <path d="M132.08,15.4c-3.34.38-5.92,3-8.94,4.21-8.15,3.68-16.1,7.51-23.82,12.12-1.7.96-3.15,2.19-4.45,3.6-.37.33-.74.54-1.08.51-2.19-.89-1.62-6.01-1.78-8.03.12-4.3-1.77-8.48-.91-12.75,1.16-4.3-1.67-9.35-6.41-6.86-4.46,2.95-2.56,9.19-3.43,13.7-.45,4.06-2.28,8-3.66,11.77-.46,1.25-.78,2.63-1.68,3.65-3.04,3.62-6.97.79-10.5-.26-5.36-1.54-11.51-2.46-17.03-4.12-5.71-1.65-11.56-2.26-17.48-3.19-2.68-.52-5.37-.51-8.08-.7-2.49-.18-5.29-1.04-7.62-.63-3.18.4-5.36,3.32-3.58,6.36,7.45,8.62,18.2,14.11,27.37,20.7,3.67,3.24,8.04,4.63,12.43,6.41,3.53,1.55-1.93,9.46-3.19,11.62-3.97,5.57-8.03,10.95-12,16.46-2.94,3.67-5.96,7.5-8.89,11.27-1.08,2.09-2.25,4.17-2.96,6.44-.03.76.38.89,1.09,1.18,1.49.56-1.42,3.51,1.64,2.32,2.37-1.24,4.28-3.15,6.58-4.5,5.19-2.91,10.86-5.16,16.27-7.76,4.91-2.34,10.17-4.65,14.49-8.12,1.48-1.15,2.66-2.62,4.04-4.14.64-.69,1.59-1.52,2.47-1.4,3.38.56,6.7,15.62,7.89,18.97,1.69,4.65,3.18,9.44,4.99,14.02l.07.17c.63,1.43,1.6,3.19,2.29,4.78.41.9.89,1.94,1.92,2.23,5.49.29,4.28-7.07,4.5-10.74.01-3.22.82-6.4.95-9.71.04-4.22-.21-8.07.18-12.35.52-3.14-1.44-11.53,4.06-10.09,3.47,1.75,5.91,4.92,8.75,7.42,6.42,5.07,10.29,12.98,16.81,17.89,1.23.97,2.78,1.36,4.15,2.02,1.07.58,1.15,2.14,2.58,2.04,6.29-1.94,2.99-11.36,1.95-16.01-1.21-5.74-2.92-11.47-4.89-17.06-1.6-4.79-3.72-9.27-6.04-13.77-1.39-2.59-2.99-5.72-1.31-8.56,2.97-4.54,5.95-9.15,8.24-14.1,1.34-2.81,2.96-5.48,4.12-8.38,1.14-2.78,1.59-5.69,2.72-8.46.73-1.84,2.17-3.49,2.34-5.56.28-2.78-2.53-4.84-5.14-4.59ZM44.86,99.67s-5.34,2.08-7.81,3.28l-.13.06c-1.07.45-3.47,2.1-4.57,1.62.49-.47,1.43-.78,2.05-1.15,2.97-1.39,6.73-3.45,10.02-4.6.98-.34.45.79.45.79ZM131.05,27.5c-1.19,3.56-2.4,6.79-4.31,9.95-3.46,6.31-5.35,13.86-10.81,18.86-3.9,2.97-2.35,6.32.08,9.66,2.5,3.73,4.7,7.62,6.57,11.67,2.58,6.31,3.29,13.04,4.94,19.68.14,1.74,2.62,12.31-1.43,9.68-4.63-3.49-8.11-8.71-11.9-13.09-3.15-3.82-7.32-6.59-10.66-10.16-2.34-2.45-4.18-5.51-6.98-7.48-1.22-.75-3.28-1.22-4.12.11-.3.56-.25,1.35-.47,2.08-.31,1.01-1.12,1.91-1.34,3.01-.31,1.39-.26,2.83-.34,4.27-.44,9.47.13,19.82-1.9,29.09-1.63,4.6-3.64-1.9-4.12-3.74-1.22-4.31-2.52-8.67-3.85-12.91-.93-3.03-1.42-6.2-2.6-9.16-1.42-3.73-2.08-7.71-3.25-11.46l-.06-.17c-.6-1.81-2.32-3.42-4.33-3.27-1.17.05-2.15.89-2.21,2.12-.09,1.27.39,2.61.16,3.8-.18,1.25-1.01,2.27-1.51,3.4-.56,1.25-.54,2.61-1.26,3.76-1.35,2.14-3.56,3.65-5.55,5.13-3.58,2.63-7.87,4.93-12.1,6.52-.26.04-.76.23-1.03-.05-.17-.52.65-.98,1.15-1.31,2.62-1.43,5.25-2.69,7.74-4.12,2.64-1.55,5.59-3.24,7.64-5.61.5-.79-.28-.34-.73-.01-5.22,4.24-11.26,7-17.37,9.75-3.72,1.6-7.32,3.65-11.13,5-1.72.25-.46-1.66.13-2.44,5.03-6.82,10.75-13.44,15.67-20.39,1.8-2.74,3.61-5.53,5.87-8.02,1.46-1.85,3.22-3.23,4.93-4.79,1.41-1.4,1.37-3.55.61-5.44-1.43-3.35-5.4-1.07-7.89-1.29-1.47-.15-2.78-.72-4.21-1.4-10.41-5.99-20.6-13.21-29.35-21.27-.93-.83-1.99-2.27-1.13-3.38,1.37-1.62,4.04-1.17,6.01-1.08,12.68,1.38,25.61,3.36,37.17,8.98,1.86.85,3.91,1.22,5.73,2.35,2.16,1.35,3.79,3.38,5.6,4.42,1.93,1.27,4.33.56,6.08-.82,1.73-1.12,2.73-3.36,2.65-5.44-.38-5.27,1.64-10.24,2.81-15.3,2.4-10.71,3.19-4.14,3.42,1.81.05,3.17-.08,6.7-1.94,9.31-.39.63-1.15,1.46-.81,2.2.28.58,1.29.88,2.14,1.34,1.03.55,1.93,1.35,3.04,1.75,1.57.65,3.37.04,4.86-.39,1.61-.47,3.31-.87,4.74-2.23,1.87-1.69,2.11-4.54,4.15-6.08,4.65-3.22,9.98-5.25,15.04-7.58,3.12-1.35,5.99-3.87,9.61-3.66,2.67,0,2.84,1.83,2.16,3.86Z"/>
    </svg>
  </div>
));
StarLeft.displayName = "StarLeft";

// Bottom-edge decorative accent — on both desktop and mobile (desktop
// pokes past the bottom edge; mobile sits lower and pokes past the right
// edge instead). Same wrapper/inner-svg split as StarLeft above, for the
// same reason: the wrapper carries the static -20deg resting rotation, the
// inner ref'd svg is the only thing the repulsion effect touches, so the
// two transforms compose instead of the repulsion's "at rest" rotate(0deg)
// wiping out the static rotation.
// z-index: -1, not positive — same reasoning as StarLeft (renders as a
// child of .page rather than a true sibling of it).
const StarBottom = forwardRef(({ style }, ref) => (
  <div
    style={{
      position: "fixed",
      pointerEvents: "none",
      zIndex: -1,
      transform: "rotate(-20deg)",
      ...style,
    }}
  >
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 187.44 179.81"
      aria-hidden="true"
      style={{ display: "block", width: "100%", height: "100%", fill: "#ffd6f9", willChange: "transform" }}
    >
      <path d="M42.52,104.27c1.21-.06,5.27,1.01,5.76-.23.49-1.25-10.77-1.05-10.83-.77-.05.28.14.34.26.47,1.44.97,3.22.52,4.8.53Z"/>
      <path d="M34.4,104.09c.86-.62-1.69-.69-2.05-.87l-.05-.02c-.68-.23-3.48-.59-1.3.53.96.48,2.55.98,3.41.36Z"/>
      <path d="M136.2,113.43c.8-.59-.36-.69-1.17-.81-.81-.12-2.74-.13-2.39.55s2.76.85,3.56.26Z"/>
      <path d="M126.63,113.09h.09c.39-.03,1.72.01,1.93-.09.13-.08-.02-.55-.25-.67-1.45-.22-3.14.21-4.62.17-.7.02-1.6.03-2.33.11-.23.07-.85.06-.7.4,1.59.51,4.29-.04,5.88.07Z"/>
      <path d="M149.57,101.06c-3.29-1.78-7.33-1.3-10.28-3.7-2.68-1.68-5.34-3.42-7.96-5.09-.94-.62-2.06-1.25-2.86-2.06-.7-.74-.75-1.64-1.3-2.37-.39-.62-.92-1.11-.5-1.44.79-.6,4.62-1.16,5.9-1.14,1.06.01.45,1.16-.93,1.23-.49.03-1.87.22-2.11.38-.24.15-.31.66.83.47,3.98-.22,7.92-1.61,11.88-2.27,3.04-.6,6.1-1.08,8.99-2.24,5.83-2.38,34.18-13.78,22.95-21.9-1.5-.74-3.25-.57-4.83-.17-3.12.94-6.23,1.76-9.46,2.24-6.4,1.03-12.82,2.26-19.3,2.83-3.43.43-6.76,1.41-10.21,1.11-2.25-.2-4.33-1.17-3.04-3.64,1.37-2.83,2.68-5.77,4.04-8.64,4.52-7.93,7.59-16.7,12.85-24.15.93-1.31,1.78-2.55,1.99-4.21.55-3.32-3.3-5.77-6.14-4.23-1.84.94-2.87,2.87-3.95,4.56-2.25,3.68-5.21,6.88-8.4,9.91-3.24,2.82-5.47,6.29-8.59,9.32-1.96,2.12-4.22,3.95-6.03,6.33-1.21,1.25-2.33,2.36-3.45,3.69-2.35,1.65-1.09-2.69-.95-3.73,1.44-5.85,1.51-12.25,1.57-18.35.13-4.39-1.12-8.91-1.54-13.36-.08-2.18.69-4.32.52-6.61-.08-2.5-1.26-6.09-3.83-6.64-1.35-.28-2.8.54-3.89,1.76-1.84,2.14-1.77,4.92-2.76,7.42-1.4,3.6-4.07,6.58-6.14,9.79-4.52,7.2-7.39,15.54-8.78,23.97-.33,3.05-2.67,4.93-5.35,2.76-2.12-2.16-4.46-3.88-6.98-5.63-2.61-2.74-5.09-5.45-8.26-7.67-1.77-1.49-3.65-2.97-5.08-4.74-1.13-1.39-2.49-2.52-4.36-2.77-7.68-.81-1.98,8.5-.87,12.02,3.2,8.35,5.49,17.16,10.3,24.73,1.23,2.87,2.43,5.74,3.85,8.54,2.5,4-2.49,5.44-5.6,5.96-11.45,1.64-22.94,2.41-34.4,3.94-4.37.55-9.45-.84-13.48,1.35-2.35,1.37-4.16,3.48-1.97,5.67,1.7,1.72,3.94,2.56,6.11,3.57,1.9.79,3.64,1.89,5.52,2.44,5.37,1.28,10.93,1.39,16.44,1.78,4.43.56,9.03.38,13.45.79,2.07.32,3.91,1.07,6.04,1.53,1.97.37,3.43.96,2.87,3.36-.86,4.94-1.99,9.79-2.28,14.83-.96,9.1-.98,18.25-1.31,27.39-.27,2.7-1.12,5.47-1.69,8.16-.44,2.23-.64,4.5-1.54,6.53-.51,1.29-1.35,2.51-1.6,3.88-.07,2.86.59,5.53,3.71,3.31,2.43-2.13,4.06-5.11,6.07-7.66,4.99-6.88,9.13-14.42,13.04-21.95,2.78-6.76,3.84-14.27,6.95-21.02.56-1.2,1.27-2.62,2.21-2.94.71-.27,1.57.43,2.11,1.03,1.35,1.45,2.76,2.93,3.93,4.7,1.63,2.39,2.49,5.27,3.69,7.85,2.97,5.59,5.98,11.24,8.63,17.06,2.5,5.31,3.76,11.62,8.32,15.65l.13.06c3.6.26,3.11-6.16,2.82-8.74-.49-6.24-1.44-12.33-2.51-18.48-1.31-6.03-2.51-12.02-3.82-18.09-.26-1.24-.55-2.9.25-3.92.47-.62,1.26-.88,2.01-.99,2.01-.31,4.6-.15,6.76-.63.9-.24-.62-1.12.26-1.66,1.06-.56,2.62-.52,3.87-.61,4.4-.17,10.05-.15,15.1-.24,1.83,0,3.61-.53,5.41-.77,1.01-.2,2.55.24,1.01,1.15-1.01.62-6.21.24-5.4,1.41.16.92,6.75-.77,10.08-1.81,1.04-.34,2.07-.71,2.89-1.42,3.04-2.41,1.64-6.96-1.61-8.76ZM154.33,80.44c-5.34,3.08-11.72,3.28-17.63,4.85l-.16.03c-.6.15-2.47.49-2.53.13,0-.09.17-.2.44-.3,2.31-.66,4.69-.95,7.11-1.58,3.54-.61,6.96-1.9,10.2-3.52,1.06-.35,2.28-1.4,3.28-.92.46.41-.26,1.07-.71,1.31ZM161.93,76.46s-.82.66-1.57.97c-2.8.81-.27-.66.04-.99,0,0,1.72-1.65,2.1-1.1.39.55-.57,1.11-.57,1.11ZM169.7,70.29c.69,1.22-2.82,3.33-3.08,2.88h-.02s-.25-.36-.13-.61c.13-.25.27-.23.4-.35.7-.51,2.27-2.36,2.83-1.92ZM113.55,113.05c-1.24.15-2-.18-1.65-.49s2.58-.6,2.73-.09c.15.5.16.43-1.08.58ZM138.53,109.72c-1.65.08-2.89,0-4.56-.08-7.09-.69-13.85,1.1-20.84-.08-1.34-.39-2.4-1.48-3.6-2.27-1.3-.92-3.53-.76-4.55.33-.88,1.08.13,2.45.15,3.71.06.97-.11,2.02-.04,3.1-.76,2.58,9.83,45.13,4.2,38.74-4.2-7.11-6.18-15.4-9.9-22.91-2.33-4.53-5.29-8.62-7.47-13.13-.79-1.56-1.65-3.26-3.05-4.35-1.24-1.08-3.79-1.47-4.79.12-.53.92-.09,2.27-.41,3.33-.4,1.4-1.4,2.56-1.95,3.96-2.97,5.94-4.56,12.22-6.49,18.53-2.2,6.16-4.96,11.85-8.76,17.21-.2.24-.54.56-.79.43-.06-.04-.1-.1-.14-.17-.05-.1-.05-.09-.15-.33-.19-.69-1.03,0-1.5-.04-.88.09-1.11-.93-1.15-1.64.13-12.83,2.5-26.09,2.57-38.88.07-3.21.42-6.31.8-9.51.37-2.04-1.03-2.92-2.87-3.1-3.25-.62-6.88-1.09-10.24-.9-3.63-.33-7.22-.7-10.82-.95-4.21-.46-8.35-.08-12.51-.7-3.65-.71-6.72-2.25-10.16-3.95-4.88-2.67,3-3.36,5.05-3.77,4.87-.83,9.84-.89,14.73-1.54,4.74-.54,9.4-1.91,14.15-2.24,3.78-.16,7.87-.36,11.61-.53,1.9-.08,3.9.1,5.76-.37,2.63-.51,4.35-3.69,3.34-6.16-.66-1.67-2.7-2.25-3.64-3.68-4.12-7.16-6.96-14.85-9.88-22.52-1.91-4.25-3.21-8.93-4.92-13.16-.25-.66-.55-1.94-.05-2.28.61-.4,1.64.42,2.22.91,5.93,5.06,11.51,10.65,17.55,15.63,1.89,1.6,2.54,4.09,4.22,5.95,1.63,2.01,4.61,2.95,6.94,1.65,4.01-2.62,1.27-6.98,1.21-10.63.48-5.24,2.43-10.34,4.08-15.36,1.03-3.72,2.96-7,5.12-10.16,1.17-1.9,2.59-3.56,4.5-4.78,1.39-1.02,2.26-.17,2.47,1.21,1.01,6.06,1.29,12.14-.54,18.01-1.09,4.21-3.24,8.55-2.02,12.97,1.18,2.92,1.21,6.5,2.37,9.17.7,1.35,1.75,2.92,3.32,3.28,3.63.37,7.74-4.94,8.81-8.06,1.8-4.03,4.53-7.47,7.25-10.88,1.7-1.9,3.89-3.5,5.6-5.49,2.81-3.28,5.59-6.42,8.82-9.3.46-.38.91-.63,1.2-.6.23.01.36.19.38.48,0,.78-.43,1.6-.81,2.31-1.1,1.88-2.18,3.93-3.27,5.78-.24.4-3.68,7.22-4.98,9.81-2.03,3.59-3.61,7.8-5.73,11.3-.94,1.62-2.49,2.94-3.75,4.21-1.12,1.14-.85,2.52-.2,3.98,2.82,5.36,10.01.55,14.29.41,3.73-.46,7.64.03,11.33-.55,3.77-.31,7.4-1.21,11.17-1.27,2.98-.06,6.01-1.36,8.99-1.11.74.09,1.18.35,1.11.73-.06.44-.67,1.03-1.6,1.69-3.67,2.46-8.95,4.96-12.97,6.77-7.5,3.09-16.01,4.2-24.01,5.76-1.66.27-3.38.69-5.07.63-2.65-.12-6.86-1.79-8.38,1.43-1.19,2.56,1.52,3.3,3.27,4.24,2.26,1.65,4.72,3.15,7.1,4.43,2.74,2.02,27.67,14.48,12.88,15.17Z"/>
      <path d="M122.04,64.67c.12-.17,1.38-1.39,1.62-1.86.05-.13.49-.63.21-.88-.28-.26-.82.31-.82.31-.38.34-1.23,1.36-1.54,1.67-.15.15-.55.71-.27.92.26.22.74-.09.8-.16Z"/>
      <path d="M125.18,58.74c.46.17.75-.37.75-.37,0,0,.62-1.67.35-1.7-.28-.03-.79-.24-1.28.95,0,0-.28.94.18,1.12Z"/>
      <path d="M131.73,46.45c.15-.67-1.29-1.4-.84.39.27,1.2.84.91.84-.39Z"/>
    </svg>
  </div>
));
StarBottom.displayName = "StarBottom";

// Over-the-photo decorative accent — desktop only, sits above the headshot
// (positive z-index, unlike StarLeft/StarBottom which sit behind
// everything) with the same wrapper/inner-svg repulsion split as those two.
const StarOverlay = forwardRef(({ style }, ref) => (
  <div
    style={{
      position: "fixed",
      pointerEvents: "none",
      zIndex: 1,
      transform: "rotate(-10deg)",
      ...style,
    }}
  >
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 122.64 114.84"
      aria-hidden="true"
      style={{ display: "block", width: "100%", height: "100%", fill: "#ffd6f9", willChange: "transform" }}
    >
      <path d="M101.4,69.53c-1.63-1.82-11.61-6.16-15.07-8.22-1.45-.86-2.18-1.59-2.04-2.32s4.3-2.39,5.62-3.4c3.5-2.3,5.81-4.05,7.68-5.3,1.86-1.26,3.65-2.47,4.49-4.76.84-4.71-.71-6.83-3.46-8.83-4.43-2.44-9.1,1.4-13.79.34-2.85-.43-5.49-.87-8.44-1.15-.62-.07-1.28-.21-1.79-.55-1.98-1.58-2.36-8.07-3.19-10.36-.66-1.91-1.72-4.14-2.47-5.4-1.71-2.54-4.67-3.27-7.64-2.76-2.97.51-4.28,1.58-5.51,3.26-2.52,3.7-3.47,3.77-5.58,7.99-.22.7-1.36,3.15-1.36,3.15-.98,1.61-1.69,3.3-2.94,4.74-3.16,1.43-6.05-.06-7.93-.58-1.24-.31-7.99-1.76-9.22-2.44-1.91-.36-3.09-.18-5.2.33-2.61.58-3.85,2.54-4.49,3.7-.63,1.16-.85,3.04-.73,4.05.12,1.01.35,1.81,1.36,2.99,1.01,1.19,2.6,2.38,4.23,3.68,1.49,1.28,3.77,2.25,4.97,4.28,1.2,2.03,1.38,4.05,1.18,4.96-.27,2.13-3.01,4.6-4.38,6.26l-1.7,2.23c-1.71,2.5-3.41,5.3-5.35,7.66-.56.84-1.22,1.46-1.98,2.18-.26.39-.99.98-1.28,1.44-.52.99-.97,2.29-1.24,3.43-.8,2.98,1.03,9.21,7.51,7.37,4.76-1.6,11.27-5.54,13.72-6.77,2.23-1.11,2.93-1.37,3.2.95s.92,10.78,1.6,12.79.46,1.78.97,3.8c.51,2.02.99,5.42,3.52,6.55.75.42,3.47.47,4.33.07,1.17-.6,1.42-2.22,1.77-3.31.35-1.09,2.04-4.72,2.56-6.17.53-1.46,2.71-6.06,3.25-7.21.54-1.16,1.71-5.83,4.22-4.51,1,.35,4.25,4.29,5.46,5.64,2.25,2.18,4.27,4.45,4.27,4.45,0,0,3.27,3.27,4.63,3.81,1.36.54,4.7,1.12,7.52-1.86,3.45-3.96-.88-8.72-1.75-12.73-.89-3.29-4.69-7.56-2.87-8.11,1.82-.54,6.36.73,6.36.73,0,0,8.67,2.45,11.71,2.63,2.09.27,4.36.27,6.45-1.54,2.09-1.82.45-5.36-1.18-7.17ZM93.63,47.08c-.69,1.02-1.77,1.73-2.66,2.49-1.06,1.18-2.36,2.05-3.7,2.88-.67.45-1.39,1.03-2.19,1.19-.19.02-.36,0-.36-.09l.02-.08c.74-.7,1.6-1.34,2.54-1.84,1.21-.7,2.13-1.69,3.13-2.61.43-.42.6-1.21,1.03-1.64.3-.24.77-.52,1.08-.82.55-.71,1.31-.31,1.11.51ZM33.18,77.62c-1.13,1.69-3.28,2.07-5.08,2.48l-.18.05c-2.41.59,1.49-1.7,2.1-1.77,1.12-.3,2.08-1.27,3.18-1.4.24.08.06.47-.02.65ZM97.33,73.01c-1.05,2.52-12.21-.65-15.38-2.43-3.16-1.78-6.04-.89-6.45-.16-.68,1.2-1.01,2.93-1.31,4.23-1.31,5.79,3.14,6.95,3.57,14.34.04,3.13-1.45,2.6-2.55,1.94-.5-.43-3.98-4.06-4.72-4.59-.73-.53-2.85-2.81-4.73-4.5-.97-.94-2.12-1.67-2.92-2.98s-2.02-4-4.3-4.78c-.88-.08-1.7-.07-2.34.45-2.06,2.04-3.45,5.65-4.08,8.29-.17,2.45-1.05,4.46-1.82,6.64-.34.9-.36,9.12-3.66,8.23-3.7-.99-3.67-17.62-4.06-18.43-2.94-4.58-1.13-2.83-7.52-4.7-5.29-.44-5.86,2.1-8.24,4.02-1.26.86-2.64,2.03-4.17,2.17-2.2-.16-.89-3.07.31-5.14,2.57-4.41,13.24-11.54,13.99-14.91.33-1.47,1.69-3.61,1.54-5.34s-4.84-7.67-6.71-10.01c-.29-.44-.56-.94-.61-1.49.07-.72.72-1.26.94-1.96.42-1.03,1.62-.78,2.47-.58,2.51.38,4.67,2.12,6.82,3.36.79.5,7.16,1.41,9,.12,1.7-1.23,3.37-2.67,4.09-4.69.58-1.36.34-2.95.89-4.3.81-1.82,2.35-3.32,3.52-4.85,1.19-1.21,2.62-2.73,4.45-2.03,1.35.22,3.48-.93,3.78,1.37s-.11,8.5-.11,8.5c0,0,.02,3.46,1.01,4.18,1,.72,1.85.86,3.37.37,4.17-1.17,5.8-2.65,7.77-2.53,1.52.09,6.49-.51,8.31-.26,1.93.26,4.14-.56,5.35.97,1.21,1.74-2.16,5.53-3.39,6.36-1.23.82-3.59,3.52-5.67,5.21-2.08,1.69-1.69,1.86-2.97,6.8-.38,1.46,4.47,2.7,10.8,7.39,6.33,4.69,7.41,1.7,5.72,5.74Z"/>
    </svg>
  </div>
));
StarOverlay.displayName = "StarOverlay";

export default function AboutContact() {
  const [hovered, setHovered] = useState(false);
  const starLeftRef = useRef(null);
  const starBottomRef = useRef(null);
  const starOverlayRef = useRef(null);
  // Same 640px breakpoint used sitewide (Work.jsx, WorkDetail.jsx) — drives
  // both the star-mask box ratio below and skipping the hover-tilt inline
  // style, which would otherwise fight the mobile-only float animation for
  // the same transform property.
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < 640);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    // See Work.jsx — Liquid Glass falls back to html/body's real
    // background-color, so body needs this synced too, not just html.
    document.documentElement.style.backgroundColor = "#FAF7F2";
    document.body.style.backgroundColor = "#FAF7F2";
    return () => {
      document.documentElement.style.backgroundColor = "";
      document.body.style.backgroundColor = "";
    };
  }, []);

  // Cursor-repulsion motion — desktop only (no real cursor on touch), same
  // physics as Home's stars (Radialgradient.jsx). StarLeft/StarBottom
  // render (static) on mobile too; StarOverlay is desktop-only entirely.
  // Reads all rects before writing any styles (same batching as
  // Radialgradient's handleMouseMove) to avoid layout thrashing.
  useEffect(() => {
    if (isMobile) return;
    const handleMouseMove = (e) => {
      const leftEl = starLeftRef.current;
      const bottomEl = starBottomRef.current;
      const overlayEl = starOverlayRef.current;

      const leftStyle = leftEl && computeRepulsion(leftEl.getBoundingClientRect(), e.clientX, e.clientY, 150, 45, 5);
      const bottomStyle = bottomEl && computeRepulsion(bottomEl.getBoundingClientRect(), e.clientX, e.clientY, 150, 45, 5);
      const overlayStyle = overlayEl && computeRepulsion(overlayEl.getBoundingClientRect(), e.clientX, e.clientY, 150, 45, 5);

      if (leftStyle) applyRepulsionStyle(leftEl, leftStyle);
      if (bottomStyle) applyRepulsionStyle(bottomEl, bottomStyle);
      if (overlayStyle) applyRepulsionStyle(overlayEl, overlayStyle);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [isMobile]);

  return (
    <div className={styles.page}>
      <StarLeft
        ref={starLeftRef}
        style={isMobile
          // Original (unscaled) size — cropped off the left edge instead
          // of the top, sitting behind the text/photo (z-index below
          // .page's own 2, same as desktop). position: absolute (not
          // fixed) on mobile so the star scrolls with the page instead of
          // staying pinned to the viewport — .page is position: relative,
          // so percentages resolve against its box instead.
          ? { position: "absolute", left: "-15%", top: "24%", width: 220, height: 197 }
          : { left: "2.3%", top: "-36px", width: 253, height: 227 }
        }
      />
      <StarBottom
        ref={starBottomRef}
        style={isMobile
          ? { position: "absolute", right: "-15%", top: "80%", width: 240, height: 230 }
          : { left: "24%", bottom: "-76px", width: 240, height: 230 }
        }
      />
      {!isMobile && (
        <StarOverlay
          ref={starOverlayRef}
          style={{ left: "77%", top: "25%", width: 200, height: 187, transform: "rotate(-16deg)" }}
        />
      )}
      <h1 className="sr-only">About Melanie Patterson</h1>
      <div className={styles.content}>
        <div className={styles.text}>
          <p className={styles.bio}>
            <span className={styles.name}>Melanie Patterson</span> is an Indo-Jamaican American artist and designer drawing inspiration from oratory histories, community dynamics, and just societal concepts. Through her work, she is compelled to document rare stories, celebrate difficult truths, and make meaningful work across print, code, and handmade processes alike.
          </p>
          <p className={styles.bio}>
            Born and raised in Miami, FL and based in Providence, RI since earning her BFA from Rhode Island School of Design, she works at the intersection of design, code, and community.
          </p>
          <p className={styles.bio}>
            Available for freelance projects and open to new opportunities.
          </p>
         
          <div className={styles.links}>
            <a href="/images/Melanie_Patterson_Resume.pdf" target="_blank" rel="noopener noreferrer">
              <SplitText>CV</SplitText>
              <span className="sr-only"> (opens in new window)</span>
            </a>
            <span> / </span>
            <a href="mailto:hello@melanie.studio"><SplitText>Email</SplitText></a>
          </div>

          <p className={styles.stack}>Site built with React, Vite &amp; Supabase.</p>
        </div>
        <div className={styles.photo}>
          <ShimmerImage
            src="/images/melanie-patterson-headshot.webp"
            srcSet="/images/melanie-patterson-headshot-mobile.webp 480w, /images/melanie-patterson-headshot.webp 960w"
            sizes="(max-width: 640px) 234px, 480px"
            alt="Melanie Patterson"
            // Mobile swaps to the star mask's own ratio — not the raw
            // SVG viewBox, but the ROTATED shape's true bounding box
            // (103.59/102.69, measured via getBoundingClientRect with
            // the -10deg transform applied — a rotated shape's bbox is
            // larger than its unrotated one, so reusing the unrotated
            // bbox here clipped the star's bottom-right points) — so
            // mask-size: contain fills the box edge-to-edge with
            // nothing cut off.
            width={isMobile ? 104 : 960}
            height={isMobile ? 103 : 1440}
            className={styles.photoShimmer}
            imgClassName={isMobile ? styles.photoImgMobile : undefined}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            // On mobile the hover tilt never fires (no real hover) and
            // would otherwise sit inline forever, blocking the CSS
            // float animation below from ever touching `transform` on
            // the same element. Omit it there instead of relying on
            // animations' cascade precedence over inline styles.
            style={isMobile ? undefined : {
              transform: hovered ? "translateX(6px) rotate(0.75deg)" : "translateX(0px) rotate(0deg)",
              transition: "transform 0.5s cubic-bezier(0.22, 0.61, 0.36, 1)",
              transformOrigin: "bottom center",
            }}
          />
        </div>
      </div>
    </div>
  );
}

