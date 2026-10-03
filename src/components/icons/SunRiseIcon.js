import Svg, { Path } from "react-native-svg";

export default function SunRiseIcon({
  size = 22,
  color = "#C2551F",
  strokeWidth = 2.01667,
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 22 22" fill="none">
      <Path
        d="M3.66669 15.5834H18.3334"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M6.41669 15.5833C6.41669 14.3678 6.89957 13.202 7.75911 12.3424C8.61866 11.4829 9.78444 11 11 11C12.2156 11 13.3814 11.4829 14.2409 12.3424C15.1005 13.202 15.5834 14.3678 15.5834 15.5833"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M11 4.58337V7.33337M5.04169 8.70837L6.69169 9.90004M16.9584 8.70837L15.3084 9.90004"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
