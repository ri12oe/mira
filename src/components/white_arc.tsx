import { ReactNode } from "react";
import { StyleSheet, useWindowDimensions, View, ViewStyle } from "react-native";
import Svg, { Ellipse, Rect } from "react-native-svg";

// In the mockup (390 wide), the oval is 600 wide x 720 tall,
// so it's about 1.54x the screen width and hangs past both edges.
const WIDTH_RATIO = 600 / 390;
const HEIGHT_RATIO = 720 / 390;

type Props = {
  children: ReactNode;
  color?: string;
  style?: ViewStyle;
};

/**
 * A section whose background has a curved top and is solid all the way
 * down. Put the question and option cards inside it as children.
 */
export function WhiteArcSection({ children, color = "#1C2E9D", style }: Props) {
  const { width, height: screenH } = useWindowDimensions();

  const ovalW = width * WIDTH_RATIO;
  const ovalH = width * HEIGHT_RATIO;
  // Always taller than the screen so the fill never runs out.
  const svgH = Math.max(ovalH, screenH);

  return (
    <View style={[styles.section, style]}>
      <View pointerEvents="none" style={[styles.arcLayer, { height: svgH }]}>
        <Svg width={ovalW} height={svgH}>
          {/* Curved top */}
          <Ellipse cx={ovalW / 2} cy={ovalH / 2} rx={ovalW / 2} ry={ovalH / 2} fill={color} />
          {/* Solid fill from the oval's middle to the bottom, so its
              lower curve never shows */}
          <Rect x={0} y={ovalH / 2} width={ovalW} height={svgH} fill={color} />
        </Svg>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    flex: 1, // fills whatever space is left at the bottom of the screen
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