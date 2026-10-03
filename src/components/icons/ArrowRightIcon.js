import Svg, { Path } from "react-native-svg";

export default function ArrowRightIcon({
  size = 22,
  color = "#8B8DA3",
  strokeWidth = 2.2,
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 22 22" fill="none">
      <Path
        d="M8.25 5.5L13.75 11L8.25 16.5"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
