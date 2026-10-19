import ArrowLeftIcon from "@/components/icons/ArrowLeftIcon";
import { useAuth } from "@/context/auth";
import { router } from "expo-router";
import { Pressable, StyleProp, StyleSheet, ViewStyle } from "react-native";

const BORDERCOLOR = "#E6E4EF";

/** Goes back, or to the start screen when there is no history (e.g. a page refresh on web). */
export function useGoBack() {
  const { session } = useAuth();
  return () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(session ? "/caregiverHome" : "/");
    }
  };
}

/** Square back button with a left chevron. Defaults to going back one screen. */
export function BackButton({
  onPress,
  style,
}: {
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const goBack = useGoBack();
  return (
    <Pressable
      onPress={onPress ?? goBack}
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
