import { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";

const ACTION_WIDTH = 80;
/** Settles without bouncing past the edge */
const SPRING = { damping: 26, stiffness: 260, overshootClamping: true };

type Props = {
  children: ReactNode;
  onDelete: () => void;
  label: string;
};

export function SwipeToDelete({ children, onDelete, label }: Props) {
  // Shared values change during a swipe without re-rendering; .get()/.set()
  // keep them friendly to the React Compiler (no refs needed).
  const x = useSharedValue(0);
  const resting = useSharedValue(0); // 0 = closed, -ACTION_WIDTH = open
  const rowStyle = useAnimatedStyle(() => ({ transform: [{ translateX: x.get() }] }));

  const clamp = (v: number) => Math.min(Math.max(v, -ACTION_WIDTH), 0);

  // Only mostly-horizontal swipes, so taps and vertical scrolls still work
  const swipe = Gesture.Pan()
    .runOnJS(true)
    .activeOffsetX([-8, 8])
    .failOffsetY([-10, 10])
    .onUpdate((e) => x.set(clamp(resting.get() + e.translationX)))
    .onEnd((e, success) => {
      const to = success && clamp(resting.get() + e.translationX) < -ACTION_WIDTH / 2 ? -ACTION_WIDTH : 0;
      resting.set(success ? to : resting.get());
      x.set(withSpring(resting.get(), SPRING));
    });

  return (
    <View style={styles.container}>
      <Pressable
        onPress={onDelete}
        style={styles.action}
        accessibilityRole="button"
        accessibilityLabel={`Delete ${label}`}
      >
        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
          <Path
            d="M3 6h18M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m5 5v6m4-6v6"
            stroke="#fff"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </Pressable>
      <GestureDetector gesture={swipe}>
        <Animated.View
          style={[styles.row, rowStyle]}
          accessibilityActions={[{ name: "delete", label: `Delete ${label}` }]}
          onAccessibilityAction={(e) => {
            if (e.nativeEvent.actionName === "delete") onDelete();
          }}
        >
          {children}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: "stretch",
  },
  action: {
    position: "absolute",
    top: 0,
    bottom: 0,
    right: 0,
    width: ACTION_WIDTH,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#C43A2B",
  },
  row: {
    backgroundColor: "#fff",
  },
});
