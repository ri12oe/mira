import { StyleSheet, useWindowDimensions, View } from "react-native";
import Svg, { Circle, G, Line, Text as SvgText } from "react-native-svg";

import { DOT_COLORS, DotShape } from "@/components/dot";
import { FontFamily } from "@/constants/fonts";

/**
 * The picture at the top of the "Connected" screen:
 * two faint rings, a dotted line joining the caregiver (left) and the
 * person they look after (right), and Dot cheering in the middle.
 *
 * Drawn in the design's own 300 × 180 space and scaled as one piece,
 * the same way WelcomeHero works.
 */

const VB_W = 300;
const VB_H = 180;

const PRIMARY = "#4338CA";

type Props = {
  /** Caregiver's initial, shown on the left. */
  leftInitial?: string;
  /** Initial of the person being looked after, shown on the right. */
  rightInitial?: string;
  /** Largest width it may grow to. 300 matches the design. */
  maxWidth?: number;
  /** Horizontal padding of the screen, so it never touches the edges. */
  horizontalPadding?: number;
};

export function ConnectedHero({
  leftInitial = "J",
  rightInitial = "L",
  maxWidth = 300,
  horizontalPadding = 24,
}: Props) {
  const { width: screenW } = useWindowDimensions();

  const w = Math.min(maxWidth, screenW - horizontalPadding * 2);
  const h = w * (VB_H / VB_W);

  return (
    <View
      style={styles.wrap}
      // decorative: the headline below says "You and Lin are connected"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Svg width={w} height={h} viewBox={`0 0 ${VB_W} ${VB_H}`}>
        {/* faint rings behind everything */}
        <Circle cx={150} cy={90} r={86} fill="none" stroke={DOT_COLORS.orange} strokeOpacity={0.35} strokeWidth={2} />
        <Circle cx={150} cy={90} r={62} fill="none" stroke={PRIMARY} strokeOpacity={0.24} strokeWidth={2} />

        {/* dotted line joining the two people */}
        <Line
          x1={80}
          y1={90}
          x2={220}
          y2={90}
          stroke={PRIMARY}
          strokeWidth={3}
          strokeDasharray="2 8"
          strokeLinecap="round"
        />

        {/* left avatar: the caregiver */}
        <Circle cx={72} cy={90} r={40} fill="#E7E4FB" stroke="#FFFFFF" strokeWidth={4} />
        <SvgText x={72} y={100} textAnchor="middle" fontFamily={FontFamily.extraBold} fontSize={28} fill="#2D2A8C">
          {leftInitial}
        </SvgText>

        {/* right avatar: the person being looked after */}
        <Circle cx={228} cy={90} r={40} fill="#FFE8DB" stroke="#FFFFFF" strokeWidth={4} />
        <SvgText x={228} y={100} textAnchor="middle" fontFamily={FontFamily.extraBold} fontSize={28} fill="#8A3A12">
          {rightInitial}
        </SvgText>

        {/* Dot in the middle: its 200-unit drawing, shrunk to 40% and centred on (150, 90) */}
        <G transform="translate(110 50) scale(0.4)">
          {/* background-coloured disc so the dotted line stops at Dot's edge */}
          <Circle cx={100} cy={100} r={78} fill="#F5F4FA" />
          <DotShape pose="cheer" />
        </G>

        {/* confetti dots */}
        <Circle cx={40} cy={28} r={6} fill={DOT_COLORS.amber} />
        <Circle cx={266} cy={160} r={5} fill={PRIMARY} fillOpacity={0.5} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
  },
});