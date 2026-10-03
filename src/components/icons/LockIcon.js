import Svg, { Path } from "react-native-svg";

export default function LockIcon({
  size = 44,
  color = "#0B7A66",
  strokeWidth = 2.01667,
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 22 22" fill="none">
      <Path
        d="M15.5833 10.0833H6.41665C5.40412 10.0833 4.58331 10.9041 4.58331 11.9166V16.5C4.58331 17.5125 5.40412 18.3333 6.41665 18.3333H15.5833C16.5958 18.3333 17.4166 17.5125 17.4166 16.5V11.9166C17.4166 10.9041 16.5958 10.0833 15.5833 10.0833Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M7.33331 10.0834V7.33335C7.33331 6.36089 7.71962 5.42826 8.40725 4.74063C9.09489 4.053 10.0275 3.66669 11 3.66669C11.9724 3.66669 12.9051 4.053 13.5927 4.74063C14.2803 5.42826 14.6666 6.36089 14.6666 7.33335V10.0834"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
