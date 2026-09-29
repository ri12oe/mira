import Svg, { Circle } from "react-native-svg";

const PRIMARY = "#4338CA";
const MUTED = "#8B8DA3";

/** Radio circle: grey outline when off, indigo outline + filled dot when on. */
export function RadioCircle({ selected }: { selected: boolean }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
      <Circle cx={11} cy={11} r={10} stroke={selected ? PRIMARY : MUTED} strokeWidth={2} />
      {selected && <Circle cx={11} cy={11} r={5.5} fill={PRIMARY} />}
    </Svg>
  );
}