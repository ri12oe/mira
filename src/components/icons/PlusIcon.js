import Svg, { Path } from "react-native-svg";

export default function PlusIcon({
  size = 14,
  color = "#2D2A8C",
  strokeWidth = 2.2,
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      {/* Filled background shape */}
      <Path
        d="M6.6001 1.1001V12.1001V1.1001ZM1.1001 6.6001H12.1001H1.1001Z"
        fill="black"
      />

      {/* Stroked plus sign */}
      <Path
        d="M6.6001 1.1001V12.1001M1.1001 6.6001H12.1001"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </Svg>
  );
}
