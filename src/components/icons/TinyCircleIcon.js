import Svg, { Path } from "react-native-svg";

export default function TinyCircleIcon({
  size = 8,
  color = "#D98E0B",
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 8 8" fill="none">
      <Path
        d="M4 8C6.20914 8 8 6.20914 8 4C8 1.79086 6.20914 0 4 0C1.79086 0 0 1.79086 0 4C0 6.20914 1.79086 8 4 8Z"
        fill={color}
      />
    </Svg>
  );
}
