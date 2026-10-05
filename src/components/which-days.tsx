import { AppText } from "@/components/app-test";
import { FigtreeFont } from "@/constants/fonts";
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from "react-native";

const INK = "#15163A";
const SUBTITLE = "#54566E";
const PRIMARY = "#4338CA";
const SURFACE = "#DCD9E8";

const DAY_LETTERS = ["M", "T", "W", "T", "F", "S", "S"];
const DAY_NAMES = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

/** Plain-English summary of the selected days, e.g. "Weekdays" */
export function describeDays(days: number[]): string {
  const key = days.join(",");

  if (days.length === 7) return "Every day";
  if (days.length === 0) return "Pick at least one day";
  if (key === "0,1,2,3,4") return "Weekdays";
  if (key === "5,6") return "Weekends";

  const names = days.map((i) => DAY_NAMES[i]);

  if (names.length === 1) return `Every ${names[0]}`;

  const allButLast = names.slice(0, -1).join(", ");
  const last = names[names.length - 1];
  return `Every ${allButLast} and ${last}`;
}

type Props = {
  /** Selected days, 0 = Monday … 6 = Sunday, sorted ascending */
  days: number[];
  onChange: (days: number[]) => void;
  style?: StyleProp<ViewStyle>;
};

/** "Which days" header with a summary, plus a row of M–S toggles. */
export function WhichDays({ days, onChange, style }: Props) {
  const toggleDay = (i: number) => {
    onChange(
      days.includes(i)
        ? days.filter((d) => d !== i)
        : [...days, i].sort((a, b) => a - b),
    );
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <AppText style={styles.headerText}>Which days</AppText>
        <AppText style={styles.headerSubText}>{describeDays(days)}</AppText>
      </View>
      <View style={styles.content}>
        {DAY_LETTERS.map((letter, i) => {
          const on = days.includes(i);

          return (
            <Pressable
              key={i}
              onPress={() => toggleDay(i)}
              style={[styles.day, on ? styles.dayOn : styles.dayOff]}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              accessibilityLabel={DAY_NAMES[i]}
            >
              <AppText
                style={[styles.dayText, on ? styles.dayTextOn : styles.dayTextOff]}
              >
                {letter}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerText: {
    color: INK,
    fontSize: 17,
    fontFamily: FigtreeFont.bold,
    lineHeight: 22.1,
  },
  headerSubText: {
    color: SUBTITLE,
    fontSize: 15,
    lineHeight: 21,
    fontFamily: FigtreeFont.bold,
    flexShrink: 1,
    textAlign: "right",
    marginLeft: 12,
  },
  content: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  day: {
    flex: 1,
    maxWidth: 44,
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 22,
  },
  dayOn: {
    backgroundColor: PRIMARY,
  },
  dayOff: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: SURFACE,
  },
  dayText: {
    fontSize: 16,
    fontFamily: FigtreeFont.bold,
  },
  dayTextOn: {
    color: "#fff",
  },
  dayTextOff: {
    color: INK,
  },
});
