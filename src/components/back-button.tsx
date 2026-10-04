import ArrowLeftIcon from "@/components/icons/ArrowLeftIcon";
import { router } from "expo-router";
import { Pressable, StyleProp, StyleSheet, ViewStyle } from "react-native";

const BORDERCOLOR = "#E6E4EF";

/** Square back button with a left chevron. Defaults to `router.back()`. */
export function BackButton({
  onPress = () => router.back(),
  style,
}: {
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel="Go Back"
      accessibilityRole="button"
      hitSlop={12}
      style={[styles.backButton, style]}
    >
      <ArrowLeftIcon />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    borderColor: BORDERCOLOR,
    borderWidth: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
});
