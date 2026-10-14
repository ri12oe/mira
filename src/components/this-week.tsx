import { AppText } from "@/components/app-test";
import CircleIcon from "@/components/icons/CircleIcon";
import { FigtreeFont } from "@/constants/fonts";
import type { CheckInRow } from "@/lib/check-ins";
import { dayIndex, weekdayName } from "@/utils/local-date";
import { StyleSheet, View } from "react-native";

const INK = "#15163A";
const SUBTITLE = "#54566E";
const PRIMARY = "#4338CA";
const BORDERCOLOR = "#E6E4EF";
const ON_TIME = "#0B7A66";
const LATE = "#F5B53D";
const MISSED = "#C43A2B";
const SKIPPED = "#B9B6C8";
const OFF_DAY = "#D6D4E0";

const LETTERS = ["M", "T", "W", "Th", "F", "S", "Su"];

type Props = {
  /** Monday..Sunday "YYYY-MM-DD" keys */
  week: string[];
  todayKey: string;
  checkIns: CheckInRow[];
  /** Days Mira checks in (0 = Monday) */
  days: number[];
};

/** Home's "This week": one dot per day, coloured by how the check-in went */
export function ThisWeek({ week, todayKey, checkIns, days }: Props) {
  return (
    <View style={styles.card}>
      <AppText style={styles.title}>This week</AppText>
      <View style={styles.days}>
        {week.map((key, i) => {
          const row = checkIns.find((c) => c.local_date === key);
          const { color, outlined, words } = look(row, key, todayKey, days);
          return (
            <View
              key={key}
              style={styles.day}
              accessible
              accessibilityLabel={`${weekdayName(key)}: ${words}`}
            >
              <AppText style={[styles.dayLabel, key === todayKey && styles.today]}>{LETTERS[i]}</AppText>
              <CircleIcon size={30} color={color} outlined={outlined} />
            </View>
          );
        })}
      </View>
      <View style={styles.legend}>
        <Legend color={ON_TIME} label="On time" />
        <Legend color={LATE} label="Late" />
        <Legend color={MISSED} label="Missed" />
      </View>
    </View>
  );
}

function look(row: CheckInRow | undefined, key: string, todayKey: string, days: number[]) {
  switch (row?.status) {
    case "on_time":
      return { color: ON_TIME, outlined: false, words: "checked in on time" };
    case "late":
      return { color: LATE, outlined: false, words: "checked in late" };
    case "missed":
      return { color: MISSED, outlined: false, words: "missed" };
    case "skipped":
      return { color: SKIPPED, outlined: false, words: "paused" };
    case "pending":
      return { color: PRIMARY, outlined: true, words: "waiting for a check-in" };
  }
  if (!days.includes(dayIndex(key))) return { color: OFF_DAY, outlined: true, words: "no check-in this day" };
  if (key >= todayKey) return { color: SUBTITLE, outlined: true, words: "coming up" };
  return { color: OFF_DAY, outlined: true, words: "no check-in" };
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <CircleIcon size={10} color={color} />
      <AppText style={styles.legendLabel}>{label}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingVertical: 18,
    paddingHorizontal: 20,
    gap: 14,
    alignSelf: "stretch",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: BORDERCOLOR,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 16,
    color: INK,
    fontFamily: FigtreeFont.bold,
    lineHeight: 20.8,
  },
  days: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignSelf: "stretch",
  },
  day: {
    alignItems: "center",
    gap: 8,
  },
  dayLabel: {
    fontSize: 14,
    color: SUBTITLE,
    lineHeight: 16.9,
    fontFamily: FigtreeFont.extraBold,
  },
  today: {
    color: PRIMARY,
  },
  legend: {
    flexDirection: "row",
    gap: 16,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendLabel: {
    color: SUBTITLE,
    fontSize: 14,
    lineHeight: 19.6,
    fontFamily: FigtreeFont.semiBold,
  },
});
