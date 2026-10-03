import Svg, { Path } from "react-native-svg";

export default function CalendarIcon({ size = 20, color = "#4338CA" }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Path
        d="M14.5834 4.16663H5.41671C4.26611 4.16663 3.33337 5.09937 3.33337 6.24996V14.5833C3.33337 15.7339 4.26611 16.6666 5.41671 16.6666H14.5834C15.734 16.6666 16.6667 15.7339 16.6667 14.5833V6.24996C16.6667 5.09937 15.734 4.16663 14.5834 4.16663Z"
        stroke={color}
        strokeWidth={1.83333}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M3.33337 8.33333H16.6667M7.50004 2.5V5.83333M12.5 2.5V5.83333"
        stroke={color}
        strokeWidth={1.83333}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}



