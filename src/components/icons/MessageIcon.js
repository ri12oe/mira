import Svg, { Path } from "react-native-svg";

export default function MessageIcon({
  size = 22,
  color = "#4338CA",
  strokeWidth = 2.01667,
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 22 22" fill="none">
      <Path
        d="M3.66666 4.58337H18.3333V14.6667H8.25L3.66666 18.3334V4.58337Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
    </Svg>
  );
}
