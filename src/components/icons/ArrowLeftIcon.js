import Svg, { Path } from "react-native-svg";

export default function ArrowLeftIcon({
  size = 22,
  color = "#15163A",
  strokeWidth = 2.2,
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 22 22" fill="none">
      <Path
        d="M13.75 5.5L8.25 11L13.75 16.5"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
