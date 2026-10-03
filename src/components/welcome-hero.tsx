import { StyleSheet, View } from "react-native";
import Svg, { Circle, G } from "react-native-svg";

import { DOT_COLORS, DotShape } from "@/components/dot";

/**
 * The picture in the middle of the Welcome screen:
 * a peach "sunrise" circle, two faint rings, Dot waving inside the logo ring,
 * and three small coloured dots.
 *
 * It's drawn in the design's own 300 × 290 space and scaled as one piece,
 * so it looks identical on every phone.
 */

const VB_W = 300;
const VB_H = 290;

/**
 * Fills the box it is placed in: the drawing keeps its proportions and shrinks
 * to fit, up to its natural 300 x 290 size. Give the parent a height (or flex).
 */
export function WelcomeHero() {
  return (
    <View
      style={styles.wrap}
      // decorative: the headline below says the same thing
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Svg width="100%" height="100%" style={styles.svg} viewBox={`0 0 ${VB_W} ${VB_H}`}>
        {/* sunrise */}
        <Circle cx={182} cy={112} r={100} fill="#FFE8DB" />

        {/* faint rings around Dot */}
        <Circle cx={150} cy={150} r={132} fill="none" stroke={DOT_COLORS.indigo} strokeOpacity={0.14} strokeWidth={2} />
        <Circle cx={150} cy={150} r={104} fill="none" stroke={DOT_COLORS.indigo} strokeOpacity={0.26} strokeWidth={2} />

        {/* Dot: moves its 200-unit drawing so its centre lands on (150, 150), 1.24× bigger */}
        <G transform="translate(26 26) scale(1.24)">
          <DotShape pose="wave" />
        </G>

        {/* confetti dots */}
        <Circle cx={262} cy={206} r={10} fill={DOT_COLORS.teal} />
        <Circle cx={40} cy={92} r={7} fill={DOT_COLORS.amber} />
        <Circle cx={58} cy={236} r={5} fill={DOT_COLORS.orange} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    width: "100%",
    maxWidth: VB_W,
    maxHeight: VB_H,
  },
  svg: {
    flex: 1,
  },
});