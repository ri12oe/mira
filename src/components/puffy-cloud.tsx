import { ReactNode, useMemo } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';

/**
 * Builds a scalloped "puffy" outline: `lobes` semicircle bumps whose cusps sit
 * on an inner ring. The ring radius is chosen so the bumps touch the edges of
 * the width x height box exactly, so the shape never clips its own SVG.
 */
export function puffyPath(width: number, height: number, lobes = 8): string {
  const half = Math.PI / lobes;
  const ring = 0.5 / (Math.cos(half) + Math.sin(half)); // cusp ring, as a fraction of the box
  const bump = ring * Math.sin(half); // radius of each semicircle bump

  const cusp = (i: number) => {
    const a = -Math.PI / 2 + half + i * 2 * half; // start just right of 12 o'clock
    return [(0.5 + ring * Math.cos(a)) * width, (0.5 + ring * Math.sin(a)) * height];
  };

  const [x0, y0] = cusp(0);
  let d = `M${x0} ${y0}`;
  for (let i = 1; i <= lobes; i++) {
    const [x, y] = cusp(i);
    // sweep-flag 1 = clockwise, which bulges each arc away from the centre
    d += ` A${bump * width} ${bump * height} 0 0 1 ${x} ${y}`;
  }
  return `${d} Z`;
}

type PuffyCloudProps = {
  /** Size of the Figma instance box the shape sits in (789 in the design). */
  box?: number;
  /** Size of the shape itself inside that box (753.7 x 595.9 in the design). */
  width?: number;
  height?: number;
  lobes?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
  /** Content drawn on top of the cloud, e.g. the MIRA wordmark. */
  children?: ReactNode;
  /** Positions the children layer, which covers the whole box. */
  contentStyle?: StyleProp<ViewStyle>;
};

export function PuffyCloud({
  box = 789,
  width = 753.7,
  height = 595.9,
  lobes = 8,
  color = '#33CCFF',
  style,
  children,
  contentStyle,
}: PuffyCloudProps) {
  const d = useMemo(() => puffyPath(width, height, lobes), [width, height, lobes]);

  return (
    <View
      pointerEvents="none"
      style={[
        { position: 'absolute', width: box, height: box, alignItems: 'center', justifyContent: 'center' },
        style,
      ]}>
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <Path d={d} fill={color} />
      </Svg>
      {children && (
        <View style={[StyleSheet.absoluteFill, contentStyle]}>{children}</View>
      )}
    </View>
  );
}