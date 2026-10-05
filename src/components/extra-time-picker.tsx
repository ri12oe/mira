import { AppText } from "@/components/app-test";
import { RadioCircle } from "@/components/radio-circle";
import { ITEM_H, WheelColumn } from "@/components/wheels-column";
import { FigtreeFont } from "@/constants/fonts";
import { formatTime } from "@/utils/format-time";
import { Pressable, StyleSheet, View } from "react-native";
import Svg, { Path } from "react-native-svg";

const INK = "#15163A";
const SUBTITLE = "#54566E";
const BACKGROUND = "#F5F4FA";
const BORDERCOLOR = "#E6E4EF";
const SELECTED_BG = "#F1EFFD";
const MINT = "#DDF3EE";
const GREEN = "#075E4F";
const ALERT = "#C43A2B";

export const RECOMMENDED_EXTRA_MINUTES = 30;
const EXTRA_OPTIONS = [15, 30, 60, 120];
const EXTRA_HOURS = [0, 1, 2, 3];
const EXTRA_MINUTES = [0, 15, 30, 45];

/** "30 minutes", "1 hour", "1 hour 15 min" */
export function formatMinutes(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m} minutes`;
  const hourText = h === 1 ? "1 hour" : `${h} hours`;
  return m === 0 ? hourText : `${hourText} ${m} min`;
}

type Props = {
  extraMinutes: number;
  onChange: (minutes: number) => void;
  /** When the check-in window ends, in minutes after midnight */
  windowEnd: number;
};

/** Preset delays, hour/minute wheels, and a preview of when the alert goes out. */
export function ExtraTimePicker({ extraMinutes, onChange, windowEnd }: Props) {
  const extraHour = Math.floor(extraMinutes / 60);
  const extraMin = extraMinutes % 60;

  const setExtra = (hour: number, minute: number) => {
    onChange(Math.max(15, hour * 60 + minute)); // never allow 0 minutes
  };

  return (
    <>
      <View style={styles.optionList}>
        {EXTRA_OPTIONS.map((min, index) => {
          const selected = extraMinutes === min;
          const isLast = index === EXTRA_OPTIONS.length - 1;
          return (
            <Pressable
              key={min}
              onPress={() => onChange(min)}
              style={[
                styles.optionRow,
                selected && styles.optionRowSelected,
                !isLast && styles.optionRowDivider,
              ]}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
            >
              <View style={styles.optionLabel}>
                <AppText style={styles.optionText}>{formatMinutes(min)}</AppText>
                {min === RECOMMENDED_EXTRA_MINUTES && (
                  <AppText style={styles.recommend}>Recommended</AppText>
                )}
              </View>
              <RadioCircle selected={selected} />
            </Pressable>
          );
        })}
      </View>

      <AppText style={styles.orCustom}>Or pick your own</AppText>

      <View style={styles.wheel}>
        <View style={[styles.wheelHighlight, { pointerEvents: "none" }]} />
        <WheelColumn
          label="Hours"
          items={EXTRA_HOURS}
          selectedIndex={Math.max(0, EXTRA_HOURS.indexOf(extraHour))}
          onChange={(i) => setExtra(EXTRA_HOURS[i], extraMin)}
          format={(h) => `${h} hr`}
          width={110}
        />
        <WheelColumn
          label="Minutes"
          items={EXTRA_MINUTES}
          selectedIndex={Math.max(0, EXTRA_MINUTES.indexOf(extraMin))}
          onChange={(i) => setExtra(extraHour, EXTRA_MINUTES[i])}
          format={(m) => `${String(m).padStart(2, "0")} min`}
          width={130}
        />
      </View>

      <View style={styles.timeSummary}>
        <View style={styles.timeSummaryEnds}>
          <AppText style={styles.timeSummaryText}>Windows ends</AppText>
          <AppText style={styles.timeSummaryTime}>
            {formatTime(windowEnd)}
          </AppText>
        </View>
        <Svg width={48} height={12} viewBox="0 0 48 12" fill="none">
          <Path
            d="M2 6H42M36 11L42 6L36 1"
            stroke="#8B8DA3"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
        <View style={styles.timeSummaryAlert}>
          <AppText style={styles.timeSummaryText}>You&apos;re alerted</AppText>
          <AppText style={styles.timeSummaryTimeHighlighted}>
            {formatTime(windowEnd + extraMinutes)}
          </AppText>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  optionList: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDERCOLOR,
    overflow: "hidden",
  },
  optionRow: {
    height: 56,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
  },
  optionRowSelected: {
    backgroundColor: SELECTED_BG,
  },
  optionRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: "#EFEDF5",
  },
  optionLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  optionText: {
    fontFamily: FigtreeFont.bold,
    fontSize: 17,
    color: INK,
  },
  recommend: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    alignItems: "flex-start",
    borderRadius: 999,
    backgroundColor: MINT,
    color: GREEN,
    fontFamily: FigtreeFont.extraBold,
    fontSize: 12,
  },
  orCustom: {
    fontFamily: FigtreeFont.bold,
    fontSize: 15,
    color: SUBTITLE,
  },
  wheel: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 28,
    position: "relative",
  },
  wheelHighlight: {
    position: "absolute",
    left: 0,
    right: 0,
    top: ITEM_H * 2,
    height: ITEM_H,
    borderRadius: 16,
    backgroundColor: SELECTED_BG,
  },
  timeSummary: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    justifyContent: "space-between",
    alignItems: "center",
    alignSelf: "stretch",
    flexDirection: "row",
    borderRadius: 16,
    backgroundColor: BACKGROUND,
  },
  timeSummaryEnds: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 2,
  },
  timeSummaryText: {
    fontFamily: FigtreeFont.extraBold,
    fontSize: 13,
    lineHeight: 16.9,
    color: SUBTITLE,
  },
  timeSummaryTime: {
    color: INK,
    fontSize: 17,
    lineHeight: 22.1,
    fontFamily: FigtreeFont.extraBold,
  },
  timeSummaryAlert: {
    flexDirection: "column",
    alignItems: "flex-end",
    gap: 2,
  },
  timeSummaryTimeHighlighted: {
    fontSize: 17,
    lineHeight: 22.1,
    fontFamily: FigtreeFont.extraBold,
    color: ALERT,
  },
});
