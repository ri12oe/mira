import Svg, { Path } from "react-native-svg";

export default function MorningIcon({ size = 24, color = "#C2551F" }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 17H20"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        stroke={color}
      />
      <Path
        d="M7 17C7 15.6739 7.52678 14.4021 8.46447 13.4645C9.40215 12.5268 10.6739 12 12 12C13.3261 12 14.5979 12.5268 15.5355 13.4645C16.4732 14.4021 17 15.6739 17 17"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        stroke={color}
      />
      <Path
        d="M12 5V8M5.5 9.5L7.3 10.8M18.5 9.5L16.7 10.8"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        stroke={color}
      />
    </Svg>
  );
}
