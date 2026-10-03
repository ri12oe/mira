import Svg, { Path } from "react-native-svg";

export default function PhoneSquareIcon({
  size = 22,
  color = "#0B7A66",
  strokeWidth = 2.01667,
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 22 22" fill="none">
      <Path
        d="M13.75 2.29163H8.25C6.73122 2.29163 5.5 3.52284 5.5 5.04163V16.9583C5.5 18.4771 6.73122 19.7083 8.25 19.7083H13.75C15.2688 19.7083 16.5 18.4771 16.5 16.9583V5.04163C16.5 3.52284 15.2688 2.29163 13.75 2.29163Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M9.625 16.9584H12.375"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
