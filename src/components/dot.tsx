import { View } from "react-native";
import Svg, { Circle, Ellipse, G, Path } from "react-native-svg";

/**
 * Dot, Mira's mascot: the orange dot from the logo, standing inside its ring.
 *
 * Everything is drawn in a 200 × 200 space centred on (100, 100),
 * so <DotShape /> can be dropped into any <Svg> and moved with a <G transform>.
 * Use <Dot /> when you just want Dot on its own.
 */

export type DotPose = "wave" | "cheer";

export const DOT_COLORS = {
  indigo: "#4338CA",
  lilac: "#E7E4FB",
  teal: "#0B7A66",
  mint: "#DDF3EE",
  leaf: "#19917A",
  orange: "#FF9F6B",
  orangeDark: "#E07A4A",
  foot: "#F08A55",
  cheek: "#E8553A",
  ink: "#15163A",
  amber: "#F5B53D",
  white: "#FFFFFF",
};

const c = DOT_COLORS;

type DotShapeProps = {
  pose?: DotPose;
  /** Ring colour. Defaults to indigo for "wave" and teal for "cheer". */
  ringColor?: string;
  /** Colour inside the ring. Defaults to lilac for "wave" and mint for "cheer". */
  fillColor?: string;
};

function Hand({ cx, cy }: { cx: number; cy: number }) {
  return <Circle cx={cx} cy={cy} r={7.5} fill={c.orange} stroke={c.orangeDark} strokeWidth={2} />;
}

function Sprout() {
  return (
    <G>
      <Path d="M100 86Q99 78 101 72" fill="none" stroke={c.teal} strokeWidth={3.5} strokeLinecap="round" />
      <Path d="M100 77C94 71 86 71 84 75C88 81 96 81 100 77Z" fill={c.teal} />
      <Path d="M101 74C106 65 114 63 118 66C115 73 107 76 101 74Z" fill={c.leaf} />
    </G>
  );
}

function BodyAndFeet() {
  return (
    <G>
      <Ellipse cx={88} cy={158} rx={9} ry={5} fill={c.foot} />
      <Ellipse cx={112} cy={158} rx={9} ry={5} fill={c.foot} />
      <Circle cx={100} cy={122} r={38} fill={c.orange} />
      {/* soft highlight */}
      <Ellipse cx={82} cy={99} rx={7} ry={4.5} transform="rotate(-35 82 99)" fill={c.white} opacity={0.4} />
    </G>
  );
}

function Cheeks() {
  return (
    <G>
      <Ellipse cx={78} cy={128} rx={6} ry={4} fill={c.cheek} opacity={0.35} />
      <Ellipse cx={122} cy={128} rx={6} ry={4} fill={c.cheek} opacity={0.35} />
    </G>
  );
}

export function DotShape({ pose = "wave", ringColor, fillColor }: DotShapeProps) {
  const ring = ringColor ?? (pose === "cheer" ? c.teal : c.indigo);
  const inside = fillColor ?? (pose === "cheer" ? c.mint : c.lilac);

  if (pose === "cheer") {
    return (
      <G>
        <Circle cx={100} cy={100} r={60} fill={inside} />
        <Circle cx={100} cy={100} r={68} fill="none" stroke={ring} strokeWidth={16} />
        {/* sparkles */}
        <Path d="M70 54Q70 60 76 60Q70 60 70 66Q70 60 64 60Q70 60 70 54Z" fill={c.amber} />
        <Path d="M128 49Q128 54 133 54Q128 54 128 59Q128 54 123 54Q128 54 128 49Z" fill={c.amber} />
        {/* both arms up (drawn before the body so the shoulders tuck behind it) */}
        <Path d="M74 102Q66 90 60 77M126 102Q134 90 140 77" fill="none" stroke={c.orange} strokeWidth={7} strokeLinecap="round" />
        <Sprout />
        <BodyAndFeet />
        <Hand cx={60} cy={77} />
        <Hand cx={140} cy={77} />
        <Cheeks />
        {/* happy closed eyes + open smile */}
        <Path d="M83 119Q88 112 93 119M107 119Q112 112 117 119" fill="none" stroke={c.ink} strokeWidth={3.5} strokeLinecap="round" />
        <Path d="M91 126Q100 138 109 126Z" fill={c.ink} />
        <Ellipse cx={100} cy={130.5} rx={4} ry={1.8} fill={c.cheek} />
      </G>
    );
  }

  // "wave": left hand holds the ring, right arm waves outside it
  return (
    <G>
      <Circle cx={100} cy={100} r={60} fill={inside} />
      <Circle cx={100} cy={100} r={68} fill="none" stroke={ring} strokeWidth={16} />
      {/* waving arm + hand (kept in its own group so it can be animated later) */}
      <G>
        <Path d="M134 114Q158 100 168 68" fill="none" stroke={c.orange} strokeWidth={7} strokeLinecap="round" />
        <Hand cx={170} cy={62} />
      </G>
      {/* arm holding the ring */}
      <Path d="M66 116Q54 110 45 104" fill="none" stroke={c.orange} strokeWidth={7} strokeLinecap="round" />
      <Sprout />
      <BodyAndFeet />
      <Hand cx={43} cy={103} />
      <Cheeks />
      {/* eyes (own group so a blink can be added later) */}
      <G>
        <Ellipse cx={88} cy={118} rx={4.5} ry={6} fill={c.ink} />
        <Ellipse cx={112} cy={118} rx={4.5} ry={6} fill={c.ink} />
        <Circle cx={89.5} cy={115.5} r={1.5} fill={c.white} />
        <Circle cx={113.5} cy={115.5} r={1.5} fill={c.white} />
      </G>
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
  );
}

type DotProps = DotShapeProps & {
  size?: number;
  /** Read out by screen readers. Pass null when Dot is purely decorative. */
  label?: string | null;
};

/** Dot on its own, cropped tight to the ring (and the waving hand). */
export function Dot({ size = 120, pose = "wave", ringColor, fillColor, label }: DotProps) {
  const viewBox = pose === "wave" ? "20 20 170 170" : "15 15 170 170";
  const a11yLabel =
    label === null ? undefined : label ?? (pose === "wave" ? "Dot, Mira's helper, waving hello" : "Dot cheering");

  return (
    <View
      style={{ width: size, height: size }}
      accessible={!!a11yLabel}
      accessibilityRole={a11yLabel ? "image" : undefined}
      accessibilityLabel={a11yLabel}
      importantForAccessibility={a11yLabel ? "yes" : "no-hide-descendants"}
    >
      <Svg width={size} height={size} viewBox={viewBox}>
        <DotShape pose={pose} ringColor={ringColor} fillColor={fillColor} />
      </Svg>
    </View>
  );
}