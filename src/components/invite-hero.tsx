import { ReactNode } from "react";
import { Animated, StyleProp, StyleSheet, useWindowDimensions, View, ViewStyle } from "react-native";
import Svg, { Circle, Line, Path, Rect, Text as SvgText } from "react-native-svg";

import { FontFamily } from "@/constants/fonts";
import { useEntrance, useLoop } from "@/hooks/use-entrance";

/**
 * The picture at the top of "Invite sent, waiting for YES" (Mira Redesign canvas):
 * the same two avatars as Connected, an envelope travelling along the dotted
 * line, a ring pulsing around the person who hasn't replied yet, and a small
 * clock badge (or "!" if the invite didn't go out).
 *
 * Built like ConnectedHero: stacked layers sharing one 300 × 150 drawing space.
 * The envelope and the ring are small positioned layers, so they move and
 * scale around their own centre. Reduce motion: everything holds still.
 */

const VB_W = 300;
const VB_H = 150;
const PRIMARY = "#4338CA";
const AMBER = "#D98E0B";
const ORANGE = "#C2551F";

type Props = {
  leftInitial?: string;
  rightInitial?: string;
  /** Envelope travels and ring pulses while sending/waiting */
  moving: boolean;
  failed: boolean;
};

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

export function InviteHero({ leftInitial = "J", rightInitial = "L", moving, failed }: Props) {
  const { width: screenW } = useWindowDimensions();
  const w = Math.max(0, Math.min(300, screenW - 48));
  const h = w * (VB_H / VB_W);
  const unit = w / VB_W;

  const avatars = useEntrance({ duration: 600 });
  const line = useEntrance({ delay: 350, duration: 500 });
  const travel = useLoop({ delay: 900, duration: 2400 });
  const ping = useLoop({ delay: 1200, duration: 2400 });

  const slideFrom = (x: number) => ({
    opacity: avatars,
    transform: [{ translateX: avatars.interpolate({ inputRange: [0, 1], outputRange: [x * unit, 0] }) }],
  });

  return (
    <View
      style={[styles.wrap, { width: w, height: h }]}
      // decorative: the heading below says what's happening
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Layer w={w} h={h} style={{ transform: [{ scaleX: line }] }}>
        <Line x1={80} y1={75} x2={220} y2={75} stroke={PRIMARY} strokeOpacity={0.45} strokeWidth={3} strokeDasharray="2 8" strokeLinecap="round" />
      </Layer>

      {/* the envelope, travelling left → right and fading at both ends */}
      {moving && (
        <Animated.View
          pointerEvents="none"
          style={{
            position: "absolute",
            left: 78 * unit,
            top: 62 * unit,
            opacity: travel.interpolate({ inputRange: [0, 0.15, 0.85, 1], outputRange: [0, 1, 1, 0] }),
            transform: [{ translateX: travel.interpolate({ inputRange: [0, 1], outputRange: [0, 120 * unit] }) }],
          }}
        >
          <Svg width={34 * unit} height={26 * unit} viewBox="78 62 34 26">
            <Rect x={78} y={62} width={34} height={26} rx={7} fill={PRIMARY} />
            <Path d="M84 69l11 8 11-8" fill="none" stroke="#FFFFFF" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </Animated.View>
      )}

      <Layer w={w} h={h} style={slideFrom(-46)}>
        <Circle cx={72} cy={75} r={40} fill="#E7E4FB" stroke="#FFFFFF" strokeWidth={4} />
        <SvgText x={72} y={85} textAnchor="middle" fontFamily={FontFamily.extraBold} fontSize={28} fill="#2D2A8C">
          {leftInitial}
        </SvgText>
      </Layer>

      {/* the ring pulsing around the person we're waiting on */}
      {moving && !failed && (
        <Animated.View
          pointerEvents="none"
          style={{
            position: "absolute",
            left: (228 - 44) * unit,
            top: (75 - 44) * unit,
            opacity: ping.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] }),
            transform: [{ scale: ping.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.35] }) }],
          }}
        >
          <Svg width={88 * unit} height={88 * unit} viewBox="0 0 88 88">
            <Circle cx={44} cy={44} r={43} fill="none" stroke={AMBER} strokeWidth={2} />
          </Svg>
        </Animated.View>
      )}

      <Layer w={w} h={h} style={slideFrom(46)}>
        <Circle cx={228} cy={75} r={40} fill="#FFE8DB" stroke="#FFFFFF" strokeWidth={4} />
        <SvgText x={228} y={85} textAnchor="middle" fontFamily={FontFamily.extraBold} fontSize={28} fill="#8A3A12">
          {rightInitial}
        </SvgText>
        <Circle cx={256} cy={105} r={15} fill={failed ? ORANGE : AMBER} stroke="#F5F4FA" strokeWidth={4} />
        {failed ? (
          <Path d="M256 98v8M256 111v.5" stroke="#FFFFFF" strokeWidth={2.6} strokeLinecap="round" />
        ) : (
          <Path d="M256 99v6.5l4 2.5" fill="none" stroke="#FFFFFF" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
        )}
      </Layer>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: "center",
  },
});
