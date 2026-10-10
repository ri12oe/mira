import { useCallback, useEffect, useMemo, useState } from "react";
import { Animated, PanResponder, StyleSheet } from "react-native";

const TRACK_WIDTH = 52;
const TRACK_HEIGHT = 32;
const PADDING = 3;
const KNOB = TRACK_HEIGHT - PADDING * 2;
const TRAVEL = TRACK_WIDTH - PADDING * 2 - KNOB;

const OFF_COLOR = "#DCD9E8";
const ON_COLOR = "#4338CA";

const clamp = (n: number) => Math.min(TRAVEL, Math.max(0, n));

type Props = {
  value: boolean;
  onValueChange: (value: boolean) => void;
  label: string;
};

/** On/off switch: tap it, or slide the knob left/right. */
export function ToggleSwitch({ value, onValueChange, label }: Props) {
  const [x] = useState(() => new Animated.Value(value ? TRAVEL : 0));

  const settle = useCallback(
    (on: boolean) =>
      Animated.spring(x, {
        toValue: on ? TRAVEL : 0,
        useNativeDriver: false,
        bounciness: 4,
        speed: 20,
      }).start(),
    [x],
  );

  useEffect(() => {
    settle(value);
  }, [value, settle]);

  const pan = useMemo(() => {
    let dragStart = 0;
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        x.stopAnimation((current) => {
          dragStart = current;
        });
      },
      onPanResponderMove: (_, g) => x.setValue(clamp(dragStart + g.dx)),
      onPanResponderRelease: (_, g) => {
        // A tiny movement counts as a tap
        const next =
          Math.abs(g.dx) < 4 ? !value : clamp(dragStart + g.dx) > TRAVEL / 2;
        if (next === value) settle(value);
        else onValueChange(next);
      },
      onPanResponderTerminate: () => settle(value),
    });
  }, [x, value, onValueChange, settle]);

  const backgroundColor = x.interpolate({
    inputRange: [0, TRAVEL],
    outputRange: [OFF_COLOR, ON_COLOR],
  });

  return (
    <Animated.View
      {...pan.panHandlers}
      accessible
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value }}
      accessibilityActions={[{ name: "activate" }]}
      onAccessibilityAction={() => onValueChange(!value)}
      hitSlop={8}
      style={[styles.track, { backgroundColor }]}
    >
      <Animated.View style={[styles.knob, { transform: [{ translateX: x }] }]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    padding: PADDING,
    borderRadius: TRACK_HEIGHT / 2,
    justifyContent: "center",
  },
  knob: {
    width: KNOB,
    height: KNOB,
    borderRadius: KNOB / 2,
    backgroundColor: "#fff",
    shadowColor: "#15163A",
    shadowOpacity: 0.15,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
});
