import { ReactNode, useEffect, useState } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import Svg, { Circle, Ellipse, Path } from "react-native-svg";

import { DOT_COLORS as c } from "@/components/dot";
import { EASE_POP, useEntrance, useReduceMotion } from "@/hooks/use-entrance";

/**
 * The hero on the "You're all set" screen (Self setup, all set):
 * Dot cheering with both arms up inside a green ring, two sparkles,
 * a faint outer ring and three confetti dots.
 *
 * Canvas animation, once when the screen opens:
 *   0ms     the green ring pops in
 *   200ms   Dot pops up from its feet, with a little overshoot
 *   300ms   the faint outer ring fades in
 *   500ms   the confetti pops in
 *   700ms   the sparkles pop in
 *   900ms   Dot hops twice for joy
 * With Reduce motion on, everything simply appears and Dot doesn't hop.
 *
 * How it's built (same idea as the other heroes): each moving piece is a
 * full-size layer (a View holding an Svg with the same viewBox), stacked on top
 * of each other. `around()` makes a layer grow from a chosen point of the drawing
 * (like CSS transform-origin), e.g. Dot grows up from his feet.
 */

// The design's drawing space: Dot's 200-unit drawing, widened to fit the confetti
const VB_X = -25;
const VB_Y = 5;
const VB_W = 250;
const VB_H = 190;
const VIEW_BOX = `${VB_X} ${VB_Y} ${VB_W} ${VB_H}`;
const CENTER_X = VB_X + VB_W / 2; // 100
const CENTER_Y = VB_Y + VB_H / 2; // 100

type Props = {
  /** Width in px. 240 matches the design; the height follows. */
  width?: number;
};

/** One stacked, animatable layer of the picture. */
function Layer({ w, h, style, children }: { w: number; h: number; style?: object; children: ReactNode }) {
  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, style]}>
      <Svg width={w} height={h} viewBox={VIEW_BOX}>
        {children}
      </Svg>
    </Animated.View>
  );
}

/** A layer that holds other layers (no drawing of its own), so they move together. */
function Group({ style, children }: { style?: object; children: ReactNode }) {
  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, style]}>
      {children}
    </Animated.View>
  );
}

/** Dot's happy hop: up 8 units and back, twice, after `delay` ms. */
function useHop(delay: number) {
  const [progress] = useState(() => new Animated.Value(0));
  const reduced = useReduceMotion();

  useEffect(() => {
    if (reduced) return;
    const hop = Animated.loop(
      Animated.timing(progress, { toValue: 1, duration: 800, easing: Easing.linear, useNativeDriver: true }),
      { iterations: 2 },
    );
    const timer = setTimeout(() => hop.start(), delay);
    return () => {
      clearTimeout(timer);
      hop.stop();
    };
  }, [reduced, delay, progress]);

  return progress;
}

export function AllSetHero({ width = 240 }: Props) {
  const w = width;
  const h = width * (VB_H / VB_W);
  const scale = w / VB_W; // one drawing unit in real pixels

  /** Apply transforms around point (x, y) of the drawing instead of the layer's centre. */
  const around = (x: number, y: number, transforms: object[]) => {
    const dx = (x - CENTER_X) * scale;
    const dy = (y - CENTER_Y) * scale;
    return [{ translateX: dx }, { translateY: dy }, ...transforms, { translateX: -dx }, { translateY: -dy }];
  };

  // ---- one-time entrances, with the canvas timings ----
  const ring = useEntrance({ duration: 550, easing: EASE_POP });
  const dot = useEntrance({ delay: 200, duration: 550, easing: EASE_POP });
  const outerRing = useEntrance({ delay: 300, duration: 600 });
  const confetti = useEntrance({ delay: 500, duration: 700, easing: EASE_POP });
  const sparkles = useEntrance({ delay: 700, duration: 450, easing: EASE_POP });
  const hop = useHop(900);

  /** Fade in while growing from 40% to full size, around (x, y). */
  const popAt = (v: Animated.Value, x: number, y: number) => ({
    opacity: v.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 1] }),
    transform: around(x, y, [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) }]),
  });
  const hopStyle = {
    transform: [
      { translateY: hop.interpolate({ inputRange: [0, 0.35, 0.7, 1], outputRange: [0, -8 * scale, 0, 0] }) },
    ],
  };

  return (
    <View
      style={[styles.wrap, { width: w, height: h }]}
      accessible
      accessibilityRole="image"
      accessibilityLabel="Dot cheering with both arms up inside a green ring"
    >
      {/* faint outer ring */}
      <Layer w={w} h={h} style={{ opacity: outerRing }}>
        <Circle cx={100} cy={100} r={88} fill="none" stroke={c.teal} strokeOpacity={0.16} strokeWidth={2} />
      </Layer>

      {/* green ring */}
      <Layer w={w} h={h} style={popAt(ring, 100, 100)}>
        <Circle cx={100} cy={100} r={60} fill={c.mint} />
        <Circle cx={100} cy={100} r={68} fill="none" stroke={c.teal} strokeWidth={16} />
      </Layer>

      {/* sparkles above Dot */}
      <Layer w={w} h={h} style={popAt(sparkles, 98.5, 57.5)}>
        <Path d="M70 54Q70 60 76 60Q70 60 70 66Q70 60 64 60Q70 60 70 54Z" fill={c.amber} />
        <Path d="M128 49Q128 54 133 54Q128 54 128 59Q128 54 123 54Q128 54 128 49Z" fill={c.amber} />
      </Layer>

      {/* Dot: pops up from his feet, then hops. The hop is a layer inside the pop. */}
      <Group style={popAt(dot, 100, 163)}>
        <Layer w={w} h={h} style={hopStyle}>
          {/* both arms up (drawn first so the shoulders tuck behind the body) */}
          <Path d="M74 102Q66 90 60 77M126 102Q134 90 140 77" fill="none" stroke={c.orange} strokeWidth={7} strokeLinecap="round" />
          {/* sprout */}
          <Path d="M100 86Q99 78 101 72" fill="none" stroke={c.teal} strokeWidth={3.5} strokeLinecap="round" />
          <Path d="M100 77C94 71 86 71 84 75C88 81 96 81 100 77Z" fill={c.teal} />
          <Path d="M101 74C106 65 114 63 118 66C115 73 107 76 101 74Z" fill={c.leaf} />
          {/* feet, body, highlight */}
          <Ellipse cx={88} cy={158} rx={9} ry={5} fill={c.foot} />
          <Ellipse cx={112} cy={158} rx={9} ry={5} fill={c.foot} />
          <Circle cx={100} cy={122} r={38} fill={c.orange} />
          <Ellipse cx={82} cy={99} rx={7} ry={4.5} transform="rotate(-35 82 99)" fill={c.white} opacity={0.4} />
          {/* hands */}
          <Circle cx={60} cy={77} r={7.5} fill={c.orange} stroke={c.orangeDark} strokeWidth={2} />
          <Circle cx={140} cy={77} r={7.5} fill={c.orange} stroke={c.orangeDark} strokeWidth={2} />
          {/* cheeks, happy closed eyes, open smile, tongue */}
          <Ellipse cx={78} cy={128} rx={6} ry={4} fill={c.cheek} opacity={0.35} />
          <Ellipse cx={122} cy={128} rx={6} ry={4} fill={c.cheek} opacity={0.35} />
          <Path d="M83 119Q88 112 93 119M107 119Q112 112 117 119" fill="none" stroke={c.ink} strokeWidth={3.5} strokeLinecap="round" />
          <Path d="M91 126Q100 138 109 126Z" fill={c.ink} />
          <Ellipse cx={100} cy={130.5} rx={4} ry={1.8} fill={c.cheek} />
        </Layer>
      </Group>

      {/* confetti */}
      <Layer w={w} h={h} style={popAt(confetti, 101, 101)}>
        <Circle cx={-2} cy={48} r={7} fill={c.orange} />
        <Circle cx={200} cy={30} r={6} fill={c.amber} />
        <Circle cx={204} cy={164} r={8} fill={c.indigo} fillOpacity={0.7} />
      </Layer>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: "center",
  },
});