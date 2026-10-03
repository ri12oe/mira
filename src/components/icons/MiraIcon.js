import Svg, { G, Path, Defs, ClipPath, Rect } from "react-native-svg";

export default function MiraIcon({
  size = 30,
  strokeColor = "#4338CA",
  innerColor = "#FF9F6B",
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 30 30" fill="none">
      <G clipPath="url(#clip0)">
        <Path
          d="M15 28C22.1797 28 28 22.1797 28 15C28 7.8203 22.1797 2 15 2C7.8203 2 2 7.8203 2 15C2 22.1797 7.8203 28 15 28Z"
          stroke={strokeColor}
          strokeWidth={3}
        />
        <Path
          d="M15 20.5C18.0376 20.5 20.5 18.0376 20.5 15C20.5 11.9624 18.0376 9.5 15 9.5C11.9624 9.5 9.5 11.9624 9.5 15C9.5 18.0376 11.9624 20.5 15 20.5Z"
          fill={innerColor}
        />
      </G>

      <Defs>
        <ClipPath id="clip0">
          <Rect width={30} height={30} fill="white" />
        </ClipPath>
      </Defs>
    </Svg>
  );
}
