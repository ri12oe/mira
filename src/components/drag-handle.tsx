import { useRef } from "react";
import { PanResponder, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

type Props = {
  label: string;
  onStart: () => void;
  onMove: (dy: number) => void;
  onEnd: (dy: number) => void;
  onNudge: (delta: -1 | 1) => void;
};

export function DragHandle({ label, onStart, onMove, onEnd, onNudge }: Props) {
  // PanResponder is created once, so it reads the latest callbacks through this ref.
  const cb = useRef({ onStart, onMove, onEnd });
  cb.current = { onStart, onMove, onEnd };

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => cb.current.onStart(),
      onPanResponderMove: (_, g) => cb.current.onMove(g.dy),
      onPanResponderRelease: (_, g) => cb.current.onEnd(g.dy),
      onPanResponderTerminate: (_, g) => cb.current.onEnd(g.dy),
    }),
  ).current;

  return (
    <View
      {...pan.panHandlers}
      hitSlop={8}
      style={{ padding: 4 }}
      accessibilityRole="adjustable"
      accessibilityLabel={`Reorder ${label}`}
      accessibilityActions={[
        { name: "increment", label: "Move down" },
        { name: "decrement", label: "Move up" },
      ]}
      onAccessibilityAction={(e) =>
        onNudge(e.nativeEvent.actionName === "increment" ? 1 : -1)
      }
    >
      <Svg width={20} height={20} viewBox="0 0 20 20" fill="#8B8DA3">
        {[5, 10, 15].map((cy) =>
          [7, 13].map((cx) => (
            <Circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={1.5} />
          )),
        )}
      </Svg>
    </View>
  );
}
