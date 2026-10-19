import { AppText } from "@/components/app-test";
import { FigtreeFont } from "@/constants/fonts";
import { ReactNode, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

const PADDING = 4;
const HEIGHT = 45;
const SELECTED_COLOR = "#4338CA";
const IDLE_COLOR = "#54566E";
/** A gentle settle with almost no bounce (Reduce motion is respected by Reanimated) */
const SPRING = { damping: 20, stiffness: 220 };

type Option<T> = {
  label: string;
  value: T;
  /** Optional icon rendered above the label; receives the current text color */
  icon?: (color: string) => ReactNode;
};

type Props<T extends string | number> = {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Segment height in px (default 45) */
  height?: number;
  /** Track background color (default #F5F4FA) */
  backgroundColor?: string;
};

export function SegmentedSlider<T extends string | number>({
  options,
  value,
  onChange,
  height = HEIGHT,
  backgroundColor,
}: Props<T>) {
  const [width, setWidth] = useState(0);
  const segWidth = width > 0 ? (width - PADDING * 2) / options.length : 0;
  const selectedIndex = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );

  // Where the white thumb is. A shared value can change during a drag without
  // re-rendering, and .get()/.set() keep it friendly to the React Compiler.
  const x = useSharedValue(0);
  const thumbStyle = useAnimatedStyle(() => ({ transform: [{ translateX: x.get() }] }));

  // Follow the selected option (and the track's width once it's measured)
  useEffect(() => {
    x.set(withSpring(selectedIndex * segWidth, SPRING));
  }, [x, selectedIndex, segWidth]);

  // Thumb offset that centers it under the finger, clamped to the track.
  const thumbX = (touchX: number) => {
    const raw = touchX - PADDING - segWidth / 2;
    return Math.min(Math.max(raw, 0), segWidth * (options.length - 1));
  };
  const choose = (touchX: number) => {
    if (segWidth === 0) return;
    const index = Math.round(thumbX(touchX) / segWidth);
    x.set(withSpring(index * segWidth, SPRING));
    onChange(options[index].value);
  };

  // Built on every render, so they always use the latest options and onChange.
  // Sideways drags move the thumb; up/down movement is left to the page scroll.
  const drag = Gesture.Pan()
    .runOnJS(true)
    .activeOffsetX([-6, 6])
    .failOffsetY([-12, 12])
    .onUpdate((e) => x.set(thumbX(e.x)))
    .onEnd((e, success) => {
      if (success) choose(e.x);
      else x.set(withSpring(selectedIndex * segWidth, SPRING));
    });
  const tap = Gesture.Tap()
    .runOnJS(true)
    .onEnd((e, success) => {
      if (success) choose(e.x);
    });

  const step = (delta: number) => {
    const next = Math.min(
      Math.max(selectedIndex + delta, 0),
      options.length - 1,
    );
    onChange(options[next].value);
  };

  return (
    <GestureDetector gesture={Gesture.Race(drag, tap)}>
      <View
        style={[styles.track, backgroundColor ? { backgroundColor } : null]}
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        accessibilityRole="adjustable"
        accessibilityValue={{ text: options[selectedIndex].label }}
        accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
        onAccessibilityAction={(e) =>
          step(e.nativeEvent.actionName === "increment" ? 1 : -1)
        }
      >
        <Animated.View
          pointerEvents="none"
          style={[styles.thumb, { width: segWidth, height }, thumbStyle]}
        />
        {options.map((option, i) => (
          <View
            key={String(option.value)}
            style={[styles.segment, { height }]}
            pointerEvents="none"
          >
            {option.icon?.(i === selectedIndex ? SELECTED_COLOR : IDLE_COLOR)}
            <AppText
              style={[styles.label, i === selectedIndex && styles.labelSelected]}
            >
              {option.label}
            </AppText>
          </View>
        ))}
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  track: {
    padding: PADDING,
    alignSelf: "stretch",
    flexDirection: "row",
    borderRadius: 18,
    backgroundColor: "#F5F4FA",
  },
  thumb: {
    position: "absolute",
    top: PADDING,
    left: PADDING,
    borderRadius: 14,
    backgroundColor: "#FFF",
    shadowColor: "#14173B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  segment: {
    flex: 1,
    gap: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  label: {
    color: "#54566E",
    fontSize: 16,
    lineHeight: 20.8,
    fontFamily: FigtreeFont.bold,
  },
  labelSelected: {
    color: "#4338CA",
    fontFamily: FigtreeFont.extraBold,
  },
});
