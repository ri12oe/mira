import { ReactNode } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import Svg, { Circle, Ellipse, Path } from "react-native-svg";

import { AppText } from "@/components/app-test";
import { DOT_COLORS as c } from "@/components/dot";
import { Rise } from "@/components/rise";
import { FontFamily } from "@/constants/fonts";
import { useLoop } from "@/hooks/use-entrance";

/**
 * The hero on the "Let's set up your daily check-in" screen (Self setup intro):
 * Dot waving inside the logo ring, with a speech bubble saying "Hi, I'm Dot!".
 *
 * Canvas animation:
 *   300ms   the speech bubble rises in
 *   800ms   Dot starts waving (repeats every 2.6s)
 *   2s      Dot starts blinking (repeats every 5s)
 * With Reduce motion on, Dot stays still and the bubble just appears.
 *
 * How it's built (same idea as WelcomeHero): Dot is split into stacked layers,
 * each a full-size View holding an Svg with the same viewBox. From back to front:
 *   the ring (still)
 *   1. the waving arm, which rotates around the shoulder
 *   2. the rest of Dot (still), covering the shoulder
 *   3. the eyes, which squash flat for a blink
 * `around()` makes a layer rotate or squash around a chosen point of the drawing
 * (like CSS transform-origin) instead of the layer's middle.
 */

// Dot is drawn in a 200-unit space; this crop shows the ring plus the waving hand.
const VB_X = 20;
const VB_Y = 20;
const VB_SIZE = 170;
const VIEW_BOX = `${VB_X} ${VB_Y} ${VB_SIZE} ${VB_SIZE}`;
const CENTER = VB_X + VB_SIZE / 2; // 105: the middle of the crop, in drawing units

const INK = "#15163A";
const BORDER = "#E6E4EF";

type Props = {
  /** What Dot says in the bubble. */
  message?: string;
  /** Width and height of Dot in px. 164 matches the design. */
  size?: number;
};

/** One stacked, animatable layer of Dot. */
function Layer({ size, style, children }: { size: number; style?: object; children: ReactNode }) {
  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, style]}>
      <Svg width={size} height={size} viewBox={VIEW_BOX}>
        {children}
      </Svg>
    </Animated.View>
  );
}

export function DotGreeting({ message = "Hi, I'm Dot!", size = 164 }: Props) {
  const scale = size / VB_SIZE; // one drawing unit in real pixels

  /** Apply transforms around point (x, y) of the drawing instead of the layer's centre. */
  const around = (x: number, y: number, transforms: object[]) => {
    const dx = (x - CENTER) * scale;
    const dy = (y - CENTER) * scale;
    return [{ translateX: dx }, { translateY: dy }, ...transforms, { translateX: -dx }, { translateY: -dy }];
  };

  const wave = useLoop({ delay: 800, duration: 2600, easing: Easing.linear });
  const blink = useLoop({ delay: 2000, duration: 5000, easing: Easing.linear });

  // The arm swings from its shoulder (134, 114): 0°, -18°, 4°, -14°, back to 0°, then rests
  const waveStyle = {
    transform: around(134, 114, [
      {
        rotate: wave.interpolate({
          inputRange: [0, 0.12, 0.25, 0.38, 0.55, 1],
          outputRange: ["0deg", "-18deg", "4deg", "-14deg", "0deg", "0deg"],
        }),
      },
    ]),
  };
  // A quick blink near the end of every 5 seconds, squashing around the eyes' middle
  const blinkStyle = {
    transform: around(100, 118, [
      { scaleY: blink.interpolate({ inputRange: [0, 0.94, 0.97, 1], outputRange: [1, 1, 0.1, 1] }) },
    ]),
  };

  return (
    <View
      style={styles.row}
      accessible
      accessibilityRole="image"
      accessibilityLabel={`Dot, Mira's helper, waving hello and saying: ${message}`}
    >
      {/* Dot */}
      <View style={{ width: size, height: size }}>
        {/* the ring (still) */}
        <Layer size={size}>
          <Circle cx={100} cy={100} r={60} fill={c.lilac} />
          <Circle cx={100} cy={100} r={68} fill="none" stroke={c.indigo} strokeWidth={16} />
        </Layer>
        <Layer size={size} style={waveStyle}>
          {/* 1. the waving arm + hand: on top of the ring, under the body, like the design */}
          <Path d="M134 114Q158 100 168 68" fill="none" stroke={c.orange} strokeWidth={7} strokeLinecap="round" />
          <Circle cx={170} cy={62} r={7.5} fill={c.orange} stroke={c.orangeDark} strokeWidth={2} />
        </Layer>
        {/* 2. the rest of Dot (still) */}
        <Layer size={size}>
          {/* arm holding the ring */}
          <Path d="M66 116Q54 110 45 104" fill="none" stroke={c.orange} strokeWidth={7} strokeLinecap="round" />
          {/* sprout */}
          <Path d="M100 86Q99 78 101 72" fill="none" stroke={c.teal} strokeWidth={3.5} strokeLinecap="round" />
          <Path d="M100 77C94 71 86 71 84 75C88 81 96 81 100 77Z" fill={c.teal} />
          <Path d="M101 74C106 65 114 63 118 66C115 73 107 76 101 74Z" fill={c.leaf} />
          {/* feet, body, highlight */}
          <Ellipse cx={88} cy={158} rx={9} ry={5} fill={c.foot} />
          <Ellipse cx={112} cy={158} rx={9} ry={5} fill={c.foot} />
          <Circle cx={100} cy={122} r={38} fill={c.orange} />
          <Ellipse cx={82} cy={99} rx={7} ry={4.5} transform="rotate(-35 82 99)" fill={c.white} opacity={0.4} />
          {/* hand on the ring */}
          <Circle cx={43} cy={103} r={7.5} fill={c.orange} stroke={c.orangeDark} strokeWidth={2} />
          {/* cheeks + mouth */}
          <Ellipse cx={78} cy={128} rx={6} ry={4} fill={c.cheek} opacity={0.35} />
          <Ellipse cx={122} cy={128} rx={6} ry={4} fill={c.cheek} opacity={0.35} />
          <Path d="M92 126Q100 136 108 126Z" fill={c.ink} />
          {/* motion lines next to the waving hand */}
          <Path
            d="M178 52Q183 55 184 61M181 66Q186 69 186 75"
            fill="none"
            stroke={c.teal}
            strokeWidth={3}
            strokeLinecap="round"
            opacity={0.6}
          />
        </Layer>

        {/* 3. eyes, which blink */}
        <Layer size={size} style={blinkStyle}>
          <Ellipse cx={88} cy={118} rx={4.5} ry={6} fill={c.ink} />
          <Ellipse cx={112} cy={118} rx={4.5} ry={6} fill={c.ink} />
          <Circle cx={89.5} cy={115.5} r={1.5} fill={c.white} />
          <Circle cx={113.5} cy={115.5} r={1.5} fill={c.white} />
        </Layer>
      </View>

      {/* speech bubble: its tail is the small square corner at the bottom-left, pointing at Dot */}
      <Rise delay={300} duration={450} style={styles.bubbleWrap}>
        <View style={styles.bubble}>
          <AppText style={styles.bubbleText} numberOfLines={1}>
            {message}
          </AppText>
        </View>
      </Rise>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-start",
    gap: 4,
  },
  bubbleWrap: {
    marginTop: 14,
    flexShrink: 1, // on a narrow phone the bubble shrinks instead of pushing Dot off-screen
  },
  bubble: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    borderBottomLeftRadius: 6,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: BORDER,
    // soft shadow (iOS + web), elevation for Android
    shadowColor: INK,
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  bubbleText: {
    color: INK,
    fontFamily: FontFamily.bold,
    fontSize: 20,
    lineHeight: 24,
  },
});