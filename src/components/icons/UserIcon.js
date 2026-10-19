import Svg, { Path } from "react-native-svg";

export default function UserIcon({
  size = 24,
  color = "#54566E",
  strokeWidth = 2,
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 11.5C13.933 11.5 15.5 9.933 15.5 8C15.5 6.067 13.933 4.5 12 4.5C10.067 4.5 8.5 6.067 8.5 8C8.5 9.933 10.067 11.5 12 11.5Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <Path
        d="M5.5 20C5.5 18.2761 6.18482 16.6228 7.40381 15.4038C8.62279 14.1848 10.2761 13.5 12 13.5C13.7239 13.5 15.3772 14.1848 16.5962 15.4038C17.8152 16.6228 18.5 18.2761 18.5 20"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </Svg>
  );
}
