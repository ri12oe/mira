import Svg, { Path } from "react-native-svg";

export default function AfternoonIcon({ size = 24, color = "#9A6408" }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M16.5 12C16.5 14.4853 14.4853 16.5 12 16.5C9.51472 16.5 7.5 14.4853 7.5 12C7.5 9.51472 9.51472 7.5 12 7.5C14.4853 7.5 16.5 9.51472 16.5 12Z"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        stroke={color}
      />
      <Path
        d="M12 3V5M12 19V21M3 12H5M19 12H21M5.6 5.6L7 7M17 17L18.4 18.4M5.6 18.4L7 17M17 7L18.4 5.6"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        stroke={color}
      />
    </Svg>
  );
}
