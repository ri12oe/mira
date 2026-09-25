import { useEffect } from 'react';
import { StyleProp, StyleSheet, TextStyle, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { AppText } from '@/components/app-text';

/** Where the tapped button sits on the screen, from measureInWindow. */
export type MorphRect = { x: number; y: number; width: number; height: number };

// Timings and curves from the approved demo.
const LABEL_FADE_MS = 120;
const SHRINK_MS = 300;
const EXPAND_MS = 480;
const SHRINK_EASE = Easing.bezier(0.4, 0, 0.2, 1); // smooth squeeze into a circle
const EXPAND_EASE = Easing.bezier(0.55, 0, 0.75, 0.2); // starts slow, bursts outward

type MorphOverlayProps = {
  from: MorphRect;
  color: string;
  label: string;
  labelStyle?: StyleProp<TextStyle>;
  /** Called once the circle covers the whole screen. Navigate here. */
  onCovered: () => void;
};

/**
 * A copy of the tapped button that squeezes into a circle, then grows until it
 * fills the screen. Render it as the last child of a full-screen container.
 */
export function MorphOverlay({ from, color, label, labelStyle, onCovered }: MorphOverlayProps) {
  const { width: screenW, height: screenH } = useWindowDimensions();
  const { x, y, width, height } = from;

  const left = useSharedValue(x);
  const w = useSharedValue(width);
  const scale = useSharedValue(1);
  const labelOpacity = useSharedValue(1);

  useEffect(() => {
    // How far the circle must grow: twice the distance from its centre to the
    // farthest screen corner, plus a little extra so no edge peeks through.
    const cx = x + width / 2;
    const cy = y + height / 2;
    const farthest = Math.max(
      Math.hypot(cx, cy),
      Math.hypot(screenW - cx, cy),
      Math.hypot(cx, screenH - cy),
      Math.hypot(screenW - cx, screenH - cy)
    );
    const fullScale = (farthest * 2) / height + 0.2;

    // 1. Morph: label fades, pill squeezes into a circle around its centre.
    labelOpacity.value = withTiming(0, { duration: LABEL_FADE_MS });
    left.value = withTiming(x + (width - height) / 2, { duration: SHRINK_MS, easing: SHRINK_EASE });
    w.value = withTiming(height, { duration: SHRINK_MS, easing: SHRINK_EASE });

    // 2. Expand: once it's a circle, grow it past every corner, then hand off.
    scale.value = withDelay(
      SHRINK_MS,
      withTiming(fullScale, { duration: EXPAND_MS, easing: EXPAND_EASE }, (finished) => {
        if (finished) scheduleOnRN(onCovered);
      })
    );
    // Runs once per tap: the parent mounts a fresh overlay for each one.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const circleStyle = useAnimatedStyle(() => ({
    left: left.value,
    width: w.value,
    transform: [{ scale: scale.value }],
  }));
  const labelFade = useAnimatedStyle(() => ({ opacity: labelOpacity.value }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.circle,
        { top: y, height, borderRadius: height / 2, backgroundColor: color },
        circleStyle,
      ]}>
      <Animated.View style={labelFade}>
        <AppText numberOfLines={1} style={labelStyle}>
          {label}
        </AppText>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  circle: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    boxShadow: '0px 6px 8px rgba(0, 0, 0, 0.25)',
    zIndex: 10,
  },
});