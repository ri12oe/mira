import Svg, { Path } from "react-native-svg";

export default function SoftCircleIcon({
  size = 32,
  fillColor = "#FFE8DB",
  strokeColor = "#F5F4FA",
  strokeWidth = 2,
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <Path
        d="M16 31C24.2843 31 31 24.2843 31 16C31 7.71573 24.2843 1 16 1C7.71573 1 1 7.71573 1 16C1 24.2843 7.71573 31 16 31Z"
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
      />
    </Svg>
  );
}
