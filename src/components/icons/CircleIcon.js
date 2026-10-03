import Svg, { Circle } from "react-native-svg";

export default function CircleIcon({
  size = 10,
  color = "#0B7A66",
  outlined = false,
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 10 10" fill="none">
      <Circle
        cx={5}
        cy={5}
        r={outlined ? 4.25 : 5}
        fill={outlined ? "none" : color}
        stroke={outlined ? color : "none"}
        strokeWidth={outlined ? 1.5 : 0}
      />
    </Svg>
  );
}
