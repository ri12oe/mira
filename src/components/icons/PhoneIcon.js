import Svg, { Path } from "react-native-svg";

export default function PhoneIcon({
  size = 22,
  color = "#C2551F",
  strokeWidth = 2.01667,
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 22 22" fill="none">
      <Path
        d="M4.58333 3.66663H8.25L10.0833 8.24996L7.79166 9.62496C8.77338 11.6155 10.3844 13.2266 12.375 14.2083L13.75 11.9166L18.3333 13.75V17.4166C18.3333 17.6597 18.2368 17.8929 18.0648 18.0648C17.8929 18.2367 17.6598 18.3333 17.4167 18.3333C13.841 18.116 10.4685 16.5976 7.93542 14.0645C5.40238 11.5315 3.88396 8.15897 3.66666 4.58329C3.66666 4.34018 3.76324 4.10702 3.93515 3.93511C4.10706 3.7632 4.34022 3.66663 4.58333 3.66663Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
    </Svg>
  );
}
