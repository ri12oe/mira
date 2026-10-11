import { ReactNode, useState } from "react";
import { Animated, Easing, LayoutChangeEvent, StyleSheet, View } from "react-native";
import Svg, { Circle, Ellipse, G, Path } from "react-native-svg";

import { DOT_COLORS as c } from "@/components/dot";
import { EASE_POP, useEntrance, useLoop } from "@/hooks/use-entrance";

/**
 * The picture in the middle of the Welcome screen:
 * a peach "sunrise" circle, two faint rings, Dot waving inside the logo ring,
 * and three small coloured dots.
 *
 * It's drawn in the design's own 300 × 290 space and scaled as one piece,
 * so it looks identical on every phone.
 *
 * Canvas animation, once on open:
 *   0ms     the sunrise rises 40 units and fades in
 *   200ms   Dot's ring pops in
 *   450ms   Dot pops up with a little overshoot
 *   900ms   the three confetti dots pop in
 * and then, on repeat:
 *   Dot waves (every 2.6s), blinks (every 5s), a ring pulses out (every 3.2s),
 *   and the confetti gently floats up and down.
 * With Reduce motion on, everything appears in place and nothing loops.
 *
 * How it's built: every moving piece is a full-size layer (a View holding an Svg
 * with the same viewBox), stacked on top of each other, so the native driver can
 * move each one on its own. `around()` makes a layer scale or rotate around a
 * chosen point of the drawing (like CSS transform-origin), instead of its middle.
 */

const VB_W = 300;
const VB_H = 290;

// Dot's own 200-unit drawing is moved by translate(26 26) and scaled 1.24×.
// These convert a point in Dot's drawing to the 300 × 290 picture.
const dotX = (x: number) => 26 + x * 1.24;
const dotY = (y: number) => 26 + y * 1.24;

/** One stacked, animatable layer of the picture. */
function Layer({ style, children }: { style?: object; children: ReactNode }) {
  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, style]}>
      {children}
    </Animated.View>
  );
}

/** An Svg that fills its layer and uses the picture's 300 × 290 space. */
function Drawing({ children }: { children: ReactNode }) {
  return (
    <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} viewBox={`0 0 ${VB_W} ${VB_H}`}>
      {children}
    </Svg>
  );
}

export function WelcomeHero() {
  // How big the drawing really is on this phone, so design units can become pixels
  const [box, setBox] = useState({ w: VB_W, h: VB_H });
  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setBox({ w: width, h: height });
  };
  const scale = Math.min(box.w / VB_W, box.h / VB_H); // the Svg keeps its proportions

  /** Apply transforms around point (x, y) of the drawing instead of the layer's centre. */
  const around = (x: number, y: number, transforms: object[]) => {
    const dx = (x - VB_W / 2) * scale;
    const dy = (y - VB_H / 2) * scale;
    return [{ translateX: dx }, { translateY: dy }, ...transforms, { translateX: -dx }, { translateY: -dy }];
  };

  // ---- one-time entrances ----
  const sunrise = useEntrance({ duration: 900 });
  const ring = useEntrance({ delay: 200, duration: 600, easing: EASE_POP });
  const body = useEntrance({ delay: 450, duration: 600, easing: EASE_POP });
  const conf1 = useEntrance({ delay: 900, duration: 500, easing: EASE_POP });
  const conf2 = useEntrance({ delay: 1000, duration: 500, easing: EASE_POP });
  const conf3 = useEntrance({ delay: 1100, duration: 500, easing: EASE_POP });

  // ---- loops ----
  const pulse = useLoop({ delay: 1200, duration: 3200, easing: Easing.out(Easing.ease) });
  const wave = useLoop({ delay: 1300, duration: 2600, easing: Easing.linear });
  const blink = useLoop({ delay: 2000, duration: 5000, easing: Easing.linear });
  const float1 = useLoop({ delay: 1000, duration: 4000 });
  const float2 = useLoop({ delay: 1400, duration: 5000 });
  const float3 = useLoop({ delay: 1200, duration: 4500 });

  // ---- 0 → 1 values turned into styles ----
  const popAt = (v: Animated.Value, x: number, y: number) => ({
    opacity: v.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 1] }),
    transform: around(x, y, [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) }]),
  });
  const floatStyle = (v: Animated.Value) => ({
    transform: [{ translateY: v.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, -6 * scale, 0] }) }],
  });

  const sunriseStyle = {
    opacity: sunrise,
    transform: [{ translateY: sunrise.interpolate({ inputRange: [0, 1], outputRange: [40 * scale, 0] }) }],
  };
  const pulseStyle = {
    opacity: pulse.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 0] }),
    transform: around(150, 150, [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1.06] }) }]),
  };
  // The waving arm swings from its shoulder: 0°, -18°, 4°, -14°, back to 0°, then rests
  const waveStyle = {
    transform: around(dotX(134), dotY(114), [
      {
        rotate: wave.interpolate({
          inputRange: [0, 0.12, 0.25, 0.38, 0.55, 1],
          outputRange: ["0deg", "-18deg", "4deg", "-14deg", "0deg", "0deg"],
        }),
      },
    ]),
  };
  // A quick blink near the end of every 5 seconds
  const blinkStyle = {
    transform: around(150, dotY(118), [
      { scaleY: blink.interpolate({ inputRange: [0, 0.94, 0.97, 1], outputRange: [1, 1, 0.1, 1] }) },
    ]),
  };

  return (
    <View
      style={styles.wrap}
      onLayout={onLayout}
      // decorative: the headline below says the same thing
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {/* sunrise */}
      <Layer style={sunriseStyle}>
        <Drawing>
          <Circle cx={182} cy={112} r={100} fill="#FFE8DB" />
        </Drawing>
      </Layer>

      {/* faint rings around Dot (still) */}
      <Layer>
        <Drawing>
          <Circle cx={150} cy={150} r={132} fill="none" stroke={c.indigo} strokeOpacity={0.14} strokeWidth={2} />
          <Circle cx={150} cy={150} r={104} fill="none" stroke={c.indigo} strokeOpacity={0.26} strokeWidth={2} />
        </Drawing>
      </Layer>

      {/* a ring that pulses outwards, over and over */}
      <Layer style={pulseStyle}>
        <Drawing>
          <Circle cx={150} cy={150} r={104} fill="none" stroke={c.indigo} strokeOpacity={0.4} strokeWidth={2} />
        </Drawing>
      </Layer>

      {/* Dot's ring (the logo ring) */}
      <Layer style={popAt(ring, 150, 150)}>
        <Drawing>
          <G transform="translate(26 26) scale(1.24)">
            <Circle cx={100} cy={100} r={60} fill={c.lilac} />
            <Circle cx={100} cy={100} r={68} fill="none" stroke={c.indigo} strokeWidth={16} />
          </G>
        </Drawing>
      </Layer>

      {/* Dot, popping up from its feet. The arm and eyes are layers inside it, so they pop with it. */}
      <Layer style={popAt(body, 150, dotY(163))}>
        {/* waving arm + hand (behind the body) */}
        <Layer style={waveStyle}>
          <Drawing>
            <G transform="translate(26 26) scale(1.24)">
              <Path d="M134 114Q158 100 168 68" fill="none" stroke={c.orange} strokeWidth={7} strokeLinecap="round" />
              <Circle cx={170} cy={62} r={7.5} fill={c.orange} stroke={c.orangeDark} strokeWidth={2} />
            </G>
          </Drawing>
        </Layer>

        {/* the rest of Dot */}
        <Drawing>
          <G transform="translate(26 26) scale(1.24)">
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
          </G>
        </Drawing>

        {/* eyes, which blink */}
        <Layer style={blinkStyle}>
          <Drawing>
            <G transform="translate(26 26) scale(1.24)">
              <Ellipse cx={88} cy={118} rx={4.5} ry={6} fill={c.ink} />
              <Ellipse cx={112} cy={118} rx={4.5} ry={6} fill={c.ink} />
              <Circle cx={89.5} cy={115.5} r={1.5} fill={c.white} />
              <Circle cx={113.5} cy={115.5} r={1.5} fill={c.white} />
            </G>
          </Drawing>
        </Layer>
      </Layer>

      {/* confetti dots: each pops in, then floats */}
      <Layer style={floatStyle(float1)}>
        <Layer style={popAt(conf1, 262, 206)}>
          <Drawing>
            <Circle cx={262} cy={206} r={10} fill={c.teal} />
          </Drawing>
        </Layer>
      </Layer>
      <Layer style={floatStyle(float2)}>
        <Layer style={popAt(conf2, 40, 92)}>
          <Drawing>
            <Circle cx={40} cy={92} r={7} fill={c.amber} />
          </Drawing>
        </Layer>
      </Layer>
      <Layer style={floatStyle(float3)}>
        <Layer style={popAt(conf3, 58, 236)}>
          <Drawing>
            <Circle cx={58} cy={236} r={5} fill={c.orange} />
          </Drawing>
        </Layer>
      </Layer>
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
});
