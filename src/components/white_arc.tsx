import { ReactNode } from "react";
import { StyleSheet, useWindowDimensions, View, ViewStyle } from "react-native";
import Svg, { Ellipse } from "react-native-svg";

// In the mockup (390 wide), the ellipse is 600 wide x 720 tall,
// so it's about 1.54x the screen width and hangs past both edges.
const WIDTH_RATIO = 600 / 390;
const HEIGHT_RATIO = 720 / 390;

type Props = {
  children: ReactNode;
  color?: string;
  style?: ViewStyle;
};

/**
 * A section whose background is the top of a big white oval.
 * Put the question and option cards inside it as children.
 */
export function WhiteArcSection({ children, color = "#1C2E9D", style }: Props) {
  const { width, height: screenH } = useWindowDimensions();

  const ovalW = width * WIDTH_RATIO;
  const ovalH = width * HEIGHT_RATIO;
  // Tall enough to always reach the bottom of the screen.
  const svgH = Math.max(ovalH, screenH);

  return (
    <View style={[styles.section, style]}>
      {/* Stretches across the section and centers the oval inside it,
          so padding, margins or a scrollbar can't push it sideways. */}
      <View pointerEvents="none" style={[styles.arcLayer, { height: svgH }]}>
        <Svg width={ovalW} height={svgH}>
          <Ellipse
            cx={ovalW / 2}
            cy={ovalH / 2}
            rx={ovalW / 2}
            ry={ovalH / 2}
            fill={color}
          />
        </Svg>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    flexGrow: 1,
    paddingTop: 48, // room between the curve and the heading
  },
  arcLayer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    alignItems: "center", // centers the wider-than-screen oval
  },
});