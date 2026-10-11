import { ReactNode } from "react";
import { Animated, StyleProp, StyleSheet, useWindowDimensions, View, ViewStyle } from "react-native";
import Svg, { Circle, G, Line, Text as SvgText } from "react-native-svg";

import { DOT_COLORS, DotShape } from "@/components/dot";
import { FontFamily } from "@/constants/fonts";
import { EASE_POP, useEntrance } from "@/hooks/use-entrance";

/**
 * The picture at the top of the "Connected" screen:
 * two faint rings, a dotted line joining the caregiver (left) and the
 * person they look after (right), and Dot cheering in the middle.
 *
 * It plays the canvas animation once when the screen opens:
 *   0ms     the two avatars slide in from the sides
 *   350ms   the dotted line grows out from the middle
 *   600ms   the rings pop in
 *   700ms   Dot pops in with a little overshoot
 *   1000ms  the confetti fades in
 *
 * How it's built: each moving piece is its own full-size layer (a View holding
 * an Svg with the same 300 × 180 drawing space), stacked on top of each other.
 * Every layer is the size of the whole picture, so its centre is the picture's
 * centre (150, 90), which is exactly where the rings and Dot are. So scaling a
 * layer grows it from the right spot, and the native driver can animate it.
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

/** One stacked, animatable layer of the picture. */
function Layer({
  w,
  h,
  style,
  children,
}: {
  w: number;
  h: number;
  style?: Animated.WithAnimatedValue<StyleProp<ViewStyle>>;
  children: ReactNode;
}) {
  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, style]}>
      <Svg width={w} height={h} viewBox={`0 0 ${VB_W} ${VB_H}`}>
        {children}
      </Svg>
    </Animated.View>
  );
}

export function ConnectedHero({
  leftInitial = "J",
  rightInitial = "L",
  maxWidth = 300,
  horizontalPadding = 24,
}: Props) {
  const { width: screenW } = useWindowDimensions();

  // Math.max(0, …): on web the first render can report a 0-wide screen
  const w = Math.max(0, Math.min(maxWidth, screenW - horizontalPadding * 2));
  const h = w * (VB_H / VB_W);
  const unit = w / VB_W; // one design unit in real pixels

  // One 0 → 1 value per piece, with the canvas timings
  const avatars = useEntrance({ duration: 600 });
  const line = useEntrance({ delay: 350, duration: 500 });
  const innerRing = useEntrance({ delay: 600, duration: 700, easing: EASE_POP });
  const outerRing = useEntrance({ delay: 700, duration: 800, easing: EASE_POP });
  const dot = useEntrance({ delay: 700, duration: 500, easing: EASE_POP });
  const confettiA = useEntrance({ delay: 1000, duration: 500 });
  const confettiB = useEntrance({ delay: 1050, duration: 500 });

  // Turn a 0 → 1 value into a style
  const pop = (v: Animated.Value) => ({
    opacity: v.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 1] }),
    transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) }],
  });
  const slideFrom = (x: number) => ({
    opacity: avatars,
    transform: [{ translateX: avatars.interpolate({ inputRange: [0, 1], outputRange: [x * unit, 0] }) }],
  });

  return (
    <View
      style={[styles.wrap, { width: w, height: h }]}
      // decorative: the headline below says "You and Lin are connected"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {/* faint rings behind everything */}
      <Layer w={w} h={h} style={pop(outerRing)}>
        <Circle cx={150} cy={90} r={86} fill="none" stroke={DOT_COLORS.orange} strokeOpacity={0.35} strokeWidth={2} />
      </Layer>
      <Layer w={w} h={h} style={pop(innerRing)}>
        <Circle cx={150} cy={90} r={62} fill="none" stroke={PRIMARY} strokeOpacity={0.24} strokeWidth={2} />
      </Layer>

      {/* dotted line joining the two people, growing sideways from the middle */}
      <Layer w={w} h={h} style={{ transform: [{ scaleX: line }] }}>
        <Line x1={80} y1={90} x2={220} y2={90} stroke={PRIMARY} strokeWidth={3} strokeDasharray="2 8" strokeLinecap="round" />
      </Layer>

      {/* left avatar: the caregiver, sliding in from the left */}
      <Layer w={w} h={h} style={slideFrom(-46)}>
        <Circle cx={72} cy={90} r={40} fill="#E7E4FB" stroke="#FFFFFF" strokeWidth={4} />
        <SvgText x={72} y={100} textAnchor="middle" fontFamily={FontFamily.extraBold} fontSize={28} fill="#2D2A8C">
          {leftInitial}
        </SvgText>
      </Layer>

      {/* right avatar: the person being looked after, sliding in from the right */}
      <Layer w={w} h={h} style={slideFrom(46)}>
        <Circle cx={228} cy={90} r={40} fill="#FFE8DB" stroke="#FFFFFF" strokeWidth={4} />
        <SvgText x={228} y={100} textAnchor="middle" fontFamily={FontFamily.extraBold} fontSize={28} fill="#8A3A12">
          {rightInitial}
        </SvgText>
      </Layer>

      {/* Dot in the middle: its 200-unit drawing, shrunk to 40% and centred on (150, 90) */}
      <Layer w={w} h={h} style={pop(dot)}>
        <G transform="translate(110 50) scale(0.4)">
          {/* background-coloured disc so the dotted line stops at Dot's edge */}
          <Circle cx={100} cy={100} r={78} fill="#F5F4FA" />
          <DotShape pose="cheer" />
        </G>
      </Layer>

      {/* confetti dots */}
      <Layer w={w} h={h} style={{ opacity: confettiA }}>
        <Circle cx={40} cy={28} r={6} fill={DOT_COLORS.amber} />
      </Layer>
      <Layer w={w} h={h} style={{ opacity: confettiB }}>
        <Circle cx={266} cy={160} r={5} fill={PRIMARY} fillOpacity={0.5} />
      </Layer>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: "center",
  },
});
