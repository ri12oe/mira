import { AppText } from "@/components/app-test";
import { FigtreeFont } from "@/constants/fonts";
import { ReactNode, useEffect, useRef, useState } from "react";
import { Animated, PanResponder, StyleSheet, View } from "react-native";

const PADDING = 4;
const HEIGHT = 45;
const SELECTED_COLOR = "#4338CA";
const IDLE_COLOR = "#54566E";

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
};

export function SegmentedSlider<T extends string | number>({
  options,
  value,
  onChange,
  height = HEIGHT,
}: Props<T>) {
  const [width, setWidth] = useState(0);
  const segWidth = width > 0 ? (width - PADDING * 2) / options.length : 0;
  const selectedIndex = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );

  const x = useRef(new Animated.Value(0)).current;
  const startTouchX = useRef(0);

  // PanResponder is created once, so it reads current values through this ref.
  const live = useRef({ segWidth, options, onChange, selectedIndex });
  live.current = { segWidth, options, onChange, selectedIndex };

  const snapTo = (index: number) => {
    Animated.spring(x, {
      toValue: index * live.current.segWidth,
      useNativeDriver: true,
      bounciness: 4,
    }).start();
  };

  useEffect(() => {
    snapTo(selectedIndex);
  }, [selectedIndex, segWidth]);

  // Thumb offset that centers it under the finger, clamped to the track.
  const thumbX = (touchX: number) => {
    const { segWidth, options } = live.current;
    const raw = touchX - PADDING - segWidth / 2;
    return Math.min(Math.max(raw, 0), segWidth * (options.length - 1));
  };

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        startTouchX.current = e.nativeEvent.locationX;
        x.setValue(thumbX(startTouchX.current));
      },
      onPanResponderMove: (_, g) => {
        x.setValue(thumbX(startTouchX.current + g.dx));
      },
      onPanResponderRelease: (_, g) => {
        const { segWidth, options, onChange } = live.current;
        if (segWidth === 0) return;
        const index = Math.round(thumbX(startTouchX.current + g.dx) / segWidth);
        snapTo(index);
        onChange(options[index].value);
      },
      onPanResponderTerminate: () => snapTo(live.current.selectedIndex),
    }),
  ).current;

  const step = (delta: number) => {
    const next = Math.min(
      Math.max(selectedIndex + delta, 0),
      options.length - 1,
    );
    onChange(options[next].value);
  };

  return (
    <View
      style={styles.track}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      accessibilityRole="adjustable"
      accessibilityValue={{ text: options[selectedIndex].label }}
      accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
      onAccessibilityAction={(e) =>
        step(e.nativeEvent.actionName === "increment" ? 1 : -1)
      }
      {...pan.panHandlers}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          styles.thumb,
          { width: segWidth, height, transform: [{ translateX: x }] },
        ]}
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
