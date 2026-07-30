// Reusable loading placeholder — a shimmering block matching content shape,
// composed into larger skeletons (product cards, list rows) by whatever
// screen needs one. Shimmer animation + base color live in App.css as
// .gu-skeleton so every instance shares one running animation timeline.
export default function Skeleton({ width = '100%', height = 16, radius, style }) {
  return (
    <div
      className="gu-skeleton"
      style={{ width, height, borderRadius: radius ?? 6, ...style }}
    />
  )
}
