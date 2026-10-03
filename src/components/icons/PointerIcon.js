import Svg, { Path } from "react-native-svg";

export default function PointerIcon({
  size = 20,
  color = "#C2551F",
  strokeWidth = 1.83333,
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Path
        d="M3.33325 10L16.6666 3.33337L11.6666 16.6667L9.58325 11.25L3.33325 10Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
