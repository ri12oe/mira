import { ReactNode } from "react";
import { Animated, StyleProp, ViewStyle } from "react-native";

import { useEntrance } from "@/hooks/use-entrance";

/**
 * Wrap anything to make it fade in while rising 14px when the screen opens,
 * like the headings, cards and buttons on the canvas.
 *
 *   <Rise delay={500}>
 *     <AppText>…</AppText>
 *   </Rise>
 *
 * `style` is for layout only (margins, alignSelf); keep visual styles on the child.
 */
export function Rise({
  delay = 0,
  duration = 550,
  style,
  children,
}: {
  delay?: number;
  duration?: number;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}) {
  const progress = useEntrance({ delay, duration });
  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [14, 0] });

  return <Animated.View style={[style, { opacity: progress, transform: [{ translateY }] }]}>{children}</Animated.View>;
}
