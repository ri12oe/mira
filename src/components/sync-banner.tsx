import { AppText } from "@/components/app-test";
import { FigtreeFont } from "@/constants/fonts";
import { useCaregiverSetup } from "@/context/caregiver-setup";
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";

const INK = "#15163A";
const SUN = "#FFE8DB";
const ORANGE = "#C2551F";
const SUN_TEXT = "#6B3A1D";

/**
 * Shows when loading or saving to Supabase failed, with a "Try again" button.
 * Renders nothing when everything is fine.
 */
export function SyncBanner({ style }: { style?: StyleProp<ViewStyle> }) {
  const { syncStatus, saveFailed, retry } = useCaregiverSetup();
  const loadFailed = syncStatus === "failed";
  if (!loadFailed && !saveFailed) return null;

  return (
    <View
      style={[styles.banner, style]}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <View style={styles.row}>
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
          <Circle cx={12} cy={12} r={10} stroke={ORANGE} strokeWidth={2.2} />
          <Path
            d="M12 7.5v5.5M12 16.5v.5"
            stroke={ORANGE}
            strokeWidth={2.2}
            strokeLinecap="round"
          />
        </Svg>
        <View style={styles.text}>
          <AppText style={styles.title}>
            {loadFailed
              ? "We couldn't load your information"
              : "We couldn't save your latest changes"}
          </AppText>
          <AppText style={styles.body}>
            Check that you&apos;re online, then try again.
          </AppText>
        </View>
      </View>
      <Pressable
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        onPress={retry}
        accessibilityRole="button"
        accessibilityLabel="Try again"
      >
        <AppText style={styles.buttonText}>Try again</AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    marginTop: 16,
    padding: 16,
    borderRadius: 20,
    backgroundColor: SUN,
    gap: 12,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  text: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: INK,
    fontFamily: FigtreeFont.extraBold,
    fontSize: 17,
    lineHeight: 22,
  },
  body: {
    color: SUN_TEXT,
    fontFamily: FigtreeFont.medium,
    fontSize: 16,
    lineHeight: 22,
  },
  button: {
    height: 48,
    borderRadius: 14,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: ORANGE,
    fontFamily: FigtreeFont.extraBold,
    fontSize: 17,
  },
  pressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.9,
  },
});
