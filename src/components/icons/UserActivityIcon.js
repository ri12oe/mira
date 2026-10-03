import Svg, { Path } from "react-native-svg";

export default function UserActivityIcon({
  size = 24,
  color = "#54566E",
  strokeWidth = 2,
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Main user circle */}
      <Path
        d="M9 11.5C10.933 11.5 12.5 9.933 12.5 8C12.5 6.067 10.933 4.5 9 4.5C7.067 4.5 5.5 6.067 5.5 8C5.5 9.933 7.067 11.5 9 11.5Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />

      {/* User base / body */}
      <Path
        d="M2.5 20C2.5 18.2761 3.18482 16.6228 4.40381 15.4038C5.62279 14.1848 7.27609 13.5 9 13.5C10.7239 13.5 12.3772 14.1848 13.5962 15.4038C14.8152 16.6228 15.5 18.2761 15.5 20"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />

      {/* Activity / secondary user indicator */}
      <Path
        d="M16 5C16.6883 5.17624 17.2984 5.57656 17.7341 6.13785C18.1698 6.69914 18.4063 7.38946 18.4063 8.1C18.4063 8.81054 18.1698 9.50086 17.7341 10.0622C17.2984 10.6234 16.6883 11.0238 16 11.2M18 14.5C19.0514 14.9819 19.9412 15.7574 20.5621 16.7332C21.1831 17.709 21.5088 18.8434 21.5 20"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </Svg>
  );
}
