import Svg, { Path } from "react-native-svg";

export default function CheckBadgeLargeIcon({
  size = 28,
  fillColor = "#0B7A66",
  checkColor = "white",
  strokeWidth = 2.6,
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      {/* Circle */}
      <Path
        d="M14 27C21.1797 27 27 21.1797 27 14C27 6.8203 21.1797 1 14 1C6.8203 1 1 6.8203 1 14C1 21.1797 6.8203 27 14 27Z"
        fill={fillColor}
      />

      {/* Checkmark */}
      <Path
        d="M8.5 14.5L12 18L19.5 10.5"
        stroke={checkColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
