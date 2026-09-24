import { StyleSheet, useWindowDimensions, View } from "react-native";
import Svg, { Circle, Rect } from "react-native-svg";

const CLOUD_BLUE = "#32CBFF";

// The clouds were designed on a 390pt-wide screen.
const DESIGN_WIDTH = 390;
const TOP_DESIGN_HEIGHT = 330;
const BOTTOM_DESIGN_HEIGHT = 140;

// Never let the clouds take more than this share of the screen height,
// so short phones (iPhone SE, small Androids) still have room for content.
const TOP_MAX_SHARE = 0.36;
const BOTTOM_MAX_SHARE = 0.14;

/**
 * Cloud sizes for the current screen. Screens use this to keep their
 * content out from under the clouds.
 */
export function useCloudSizes() {
  const { width, height } = useWindowDimensions();
  const scale = width / DESIGN_WIDTH;

  return {
    width,
    scale,
    top: Math.min(TOP_DESIGN_HEIGHT * scale, height * TOP_MAX_SHARE),
    bottom: Math.min(BOTTOM_DESIGN_HEIGHT * scale, height * BOTTOM_MAX_SHARE),
  };
}

type CloudProps = { color?: string };

export function TopCloud({ color = CLOUD_BLUE }: CloudProps) {
  const { width, top } = useCloudSizes();

  // "slice" fills the full width and anchors the bumps to the bottom edge.
  // When the height is capped on short phones, only the solid top of the
  // cloud gets trimmed, so the bumps never squash or stretch.
  return (
    <View pointerEvents="none" style={[styles.top, { width, height: top }]}>
      <Svg
        width={width}
        height={top}
        viewBox={`0 0 ${DESIGN_WIDTH} ${TOP_DESIGN_HEIGHT}`}
        preserveAspectRatio="xMidYMax slice"
      >
        <Rect x={0} y={0} width={390} height={210} fill={color} />
        <Circle cx={30} cy={215} r={85} fill={color} />
        <Circle cx={175} cy={235} r={95} fill={color} />
        <Circle cx={340} cy={205} r={90} fill={color} />
      </Svg>
    </View>
  );
}

export function BottomCloud({ color = CLOUD_BLUE }: CloudProps) {
  const { width, bottom } = useCloudSizes();

  // Same idea, mirrored: bumps stay anchored to the top edge.
  return (
    <View pointerEvents="none" style={[styles.bottom, { width, height: bottom }]}>
      <Svg
        width={width}
        height={bottom}
        viewBox={`0 0 ${DESIGN_WIDTH} ${BOTTOM_DESIGN_HEIGHT}`}
        preserveAspectRatio="xMidYMin slice"
      >
        <Rect x={0} y={80} width={390} height={60} fill={color} />
        <Circle cx={45} cy={100} r={62} fill={color} />
        <Circle cx={190} cy={85} r={78} fill={color} />
        <Circle cx={345} cy={98} r={66} fill={color} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  top: { position: "absolute", top: 0, left: 0 },
  bottom: { position: "absolute", bottom: 0, left: 0 },
});