import Svg, { Path } from "react-native-svg";

export default function CheckBadgeIcon({
  size = 64,
  outerColor = "white",
  innerColor = "#0B7A66",
  checkColor = "white",
  strokeWidth = 4,
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      {/* Outer circle */}
      <Path
        d="M32 62C48.5685 62 62 48.5685 62 32C62 15.4315 48.5685 2 32 2C15.4315 2 2 15.4315 2 32C2 48.5685 15.4315 62 32 62Z"
        fill={outerColor}
      />

      {/* Inner circle */}
      <Path
        d="M32 53C43.598 53 53 43.598 53 32C53 20.402 43.598 11 32 11C20.402 11 11 20.402 11 32C11 43.598 20.402 53 32 53Z"
        fill={innerColor}
      />

      {/* Checkmark */}
      <Path
        d="M23.5 32.5L29.5 38.5L41 27"
        stroke={checkColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
