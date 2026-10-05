import { AppText } from "@/components/app-test";
import { FigtreeFont } from "@/constants/fonts";
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from "react-native";

const INK = "#15163A";
const PRIMARY = "#4338CA";
const PURPLE = "#2D2A8C";
const SURFACE = "#DCD9E8";
const BORDERCOLOR = "#E6E4EF";
const SELECTED_BG = "#F1EFFD";
const SUN = "#FFE8DB";
const RISE = "#8A3A12";

/**
 * - `block`: equal-width option in a row (use inside a `flexDirection: "row"` parent)
 * - `pill`: content-width option, wraps well in a `flexWrap` row
 * - `person`: home-screen chip; the selected one turns dark and shows an avatar initial
 */
type Variant = "block" | "pill" | "person";

type Props = {
  label: string;
  selected?: boolean;
  onPress: () => void;
  variant?: Variant;
  /** Initial shown in a circle when a `person` chip is selected */
  avatar?: string;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

export function Chip({
  label,
  selected = false,
  onPress,
  variant = "block",
  avatar,
  accessibilityLabel,
  style,
}: Props) {
  const isPerson = variant === "person";
  const shrinkText = variant === "block";

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={isPerson ? "button" : "radio"}
      accessibilityState={isPerson ? { selected } : { checked: selected }}
      accessibilityLabel={accessibilityLabel ?? label}
      style={[
        styles.base,
        styles[variant],
        selected && selectedStyles[variant],
        style,
      ]}
    >
      {isPerson && selected && avatar ? (
        <View style={styles.avatar}>
          <AppText style={styles.avatarText}>{avatar}</AppText>
        </View>
      ) : null}
      <AppText
        numberOfLines={shrinkText ? 1 : undefined}
        adjustsFontSizeToFit={shrinkText}
        minimumFontScale={shrinkText ? 0.75 : undefined}
        style={[
          styles.text,
          selected && selectedTextStyles[variant],
        ]}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: SURFACE,
    backgroundColor: "#fff",
  },
  block: {
    height: 48,
    flex: 1,
    paddingHorizontal: 4,
    borderRadius: 16,
  },
  pill: {
    height: 44,
    paddingHorizontal: 14,
    borderRadius: 22,
  },
  person: {
    flexDirection: "row",
    alignSelf: "flex-start",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderColor: BORDERCOLOR,
  },
  text: {
    color: INK,
    fontSize: 16,
    lineHeight: 20.8,
    fontFamily: FigtreeFont.bold,
  },
  avatar: {
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 15,
    backgroundColor: SUN,
  },
  avatarText: {
    color: RISE,
    fontSize: 14,
    lineHeight: 18.2,
    fontFamily: FigtreeFont.extraBold,
  },
});

const selectedStyles = StyleSheet.create({
  block: {
    borderWidth: 2,
    borderColor: PRIMARY,
    backgroundColor: SELECTED_BG,
  },
  pill: {
    borderWidth: 2,
    borderColor: PRIMARY,
    backgroundColor: SELECTED_BG,
  },
  person: {
    // Less vertical padding because the 30px avatar makes the chip taller
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderColor: INK,
    backgroundColor: INK,
  },
});

const selectedTextStyles = StyleSheet.create({
  block: { color: PURPLE },
  pill: { fontFamily: FigtreeFont.extraBold },
  person: { color: "#fff" },
});
