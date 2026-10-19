import { View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Svg, { Circle } from "react-native-svg";

type Props = {
  label: string;
  onStart: () => void;
  onMove: (dy: number) => void;
  onEnd: (dy: number) => void;
  onNudge: (delta: -1 | 1) => void;
};

export function DragHandle({ label, onStart, onMove, onEnd, onNudge }: Props) {
  // Built on every render, so it always calls the latest callbacks; Gesture
  // Handler keeps a drag going across re-renders (no refs needed).
  const drag = Gesture.Pan()
    .runOnJS(true) // the callbacks update React state
    .minDistance(0) // grab on touch, so the list doesn't scroll instead
    .shouldCancelWhenOutside(false)
    .onStart(() => onStart())
    .onUpdate((e) => onMove(e.translationY))
    // Runs when the finger lifts and also if the drag is interrupted
    .onEnd((e) => onEnd(e.translationY));

  return (
    <GestureDetector gesture={drag}>
      <View
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
    </GestureDetector>
  );
}
