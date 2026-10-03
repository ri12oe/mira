import Svg, { Path } from "react-native-svg";

export default function AlarmIcon({
  size = 22,
  color = "#9A6408",
  strokeWidth = 2.01667,
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 22 22" fill="none">
      <Path
        d="M5.5 14.6667V10.0834C5.5 8.62468 6.07946 7.22574 7.11091 6.19429C8.14236 5.16284 9.54131 4.58337 11 4.58337C12.4587 4.58337 13.8576 5.16284 14.8891 6.19429C15.9205 7.22574 16.5 8.62468 16.5 10.0834V14.6667L17.875 16.5H4.125L5.5 14.6667Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M9.16669 18.7916C9.16669 19.2779 9.35984 19.7442 9.70366 20.088C10.0475 20.4318 10.5138 20.625 11 20.625C11.4863 20.625 11.9526 20.4318 12.2964 20.088C12.6402 19.7442 12.8334 19.2779 12.8334 18.7916"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
