import { StyleSheet, useWindowDimensions, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

const SKY_AQUA = "#414DC7";

// The puffs were designed on a 390pt-wide screen.
const DESIGN_WIDTH = 390;
// Each corner group is drawn in its own 140 x 120 box.
const BOX_W = 140;
const BOX_H = 120;

/**
 * How big the corner puffs are on this phone. Scales with screen width,
 * but is clamped so they never look tiny on small phones or huge on
 * Pro Max / large Androids.
 */
export function useCornerCloudSize() {
  const { width } = useWindowDimensions();
  const scale = Math.min(Math.max(width / DESIGN_WIDTH, 0.85), 1.15);
  return { scale, width: BOX_W * scale, height: BOX_H * scale };
}

type Props = { color?: string };

export function CornerClouds({ color = SKY_AQUA }: Props) {
  const { width, height } = useCornerCloudSize();

  // Two separate SVGs, one pinned to each corner. On wide phones they
  // stay tucked in the corners instead of drifting toward the middle.
  return (
    <>
      <View pointerEvents="none" style={[styles.topLeft, { width, height }]}>
        <Svg width={width} height={height} viewBox={`0 0 ${BOX_W} ${BOX_H}`}>
          <Circle cx={-10} cy={10} r={70} fill={color} />
          <Circle cx={70} cy={-10} r={55} fill={color} />
        </Svg>
      </View>

      <View pointerEvents="none" style={[styles.topRight, { width, height }]}>
        {/* Mirror of the design's right-side puffs (x 330 and 400 on a
            390-wide screen), re-measured from the box's right edge. */}
        <Svg width={width} height={height} viewBox={`0 0 ${BOX_W} ${BOX_H}`}>
          <Circle cx={BOX_W - 60} cy={-20} r={60} fill={color} />
          <Circle cx={BOX_W + 10} cy={30} r={58} fill={color} />
        </Svg>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  topLeft: { position: "absolute", top: 0, left: 0 },
  topRight: { position: "absolute", top: 0, right: 0 },
});