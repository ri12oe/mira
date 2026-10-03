import Svg, { Path } from "react-native-svg";

export default function HomeIcon({
  size = 24,
  color = "#4338CA",
  strokeWidth = 2.2,
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 11L12 4L20 11V20H15V14H9V20H4V11Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
    </Svg>
  );
}
