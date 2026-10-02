import { ReactNode, useRef } from "react";
import {
    Animated,
    PanResponder,
    Pressable,
    StyleSheet,
    View,
} from "react-native";
import Svg, { Path } from "react-native-svg";

const ACTION_WIDTH = 80;

type Props = {
  children: ReactNode;
  onDelete: () => void;
  label: string;
};

export function SwipeToDelete({ children, onDelete, label }: Props) {
  const x = useRef(new Animated.Value(0)).current;
  const resting = useRef(0); // 0 = closed, -ACTION_WIDTH = open

  const clamp = (v: number) => Math.min(Math.max(v, -ACTION_WIDTH), 0);

  const settle = (to: number) => {
    resting.current = to;
    Animated.spring(x, {
      toValue: to,
      useNativeDriver: true,
      bounciness: 0,
    }).start();
  };

  const pan = useRef(
    PanResponder.create({
      // Only claim mostly-horizontal drags so taps and vertical scrolls still work.
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderMove: (_, g) => x.setValue(clamp(resting.current + g.dx)),
      onPanResponderRelease: (_, g) =>
        settle(
          clamp(resting.current + g.dx) < -ACTION_WIDTH / 2 ? -ACTION_WIDTH : 0,
        ),
      onPanResponderTerminate: () => settle(resting.current),
    }),
  ).current;

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
      <Animated.View
        style={[styles.row, { transform: [{ translateX: x }] }]}
        accessibilityActions={[{ name: "delete", label: `Delete ${label}` }]}
        onAccessibilityAction={(e) => {
          if (e.nativeEvent.actionName === "delete") onDelete();
        }}
        {...pan.panHandlers}
      >
        {children}
      </Animated.View>
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
