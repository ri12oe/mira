import { AppText } from "@/components/app-test";
import { FigtreeFont } from "@/constants/fonts";
import { StyleSheet, View } from "react-native";

const SUBTITLE = "#54566E";
const PRIMARY = "#4338CA";
const SURFACE = "#DCD9E8";

/** "Step X of Y" label with a segmented progress bar. `step` is 1-based. */
export function StepProgress({ step, total }: { step: number; total: number }) {
  return (
    <View
      style={styles.barContainer}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 1, max: total, now: step }}
    >
      <AppText style={styles.barText}>
        Step {step} of {total}
      </AppText>
      <View style={styles.bar}>
        {Array.from({ length: total }, (_, i) => (
          <View
            key={i}
            style={[styles.barSegment, i < step && styles.barActive]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  barContainer: {
    alignItems: "flex-start",
    gap: 8,
    flexDirection: "column",
    flex: 1,
  },
  barText: {
    fontFamily: FigtreeFont.bold,
    color: SUBTITLE,
    fontSize: 14,
    lineHeight: 18.2,
  },
  bar: {
    alignSelf: "stretch",
    alignItems: "flex-start",
    gap: 6,
    flexDirection: "row",
  },
  barSegment: {
    height: 4,
    backgroundColor: SURFACE,
    borderRadius: 3,
    flex: 1,
  },
  barActive: {
    backgroundColor: PRIMARY,
  },
});
