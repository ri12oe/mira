import { AppText } from "@/components/app-test";
import { FigtreeFont } from "@/constants/fonts";
import {
  CheckInStatus,
  HistoryEntry,
  dayKey,
  describeEntry,
  formatEntryDate,
  getMonthGrid,
  getMonthTotals,
  getRecentEntries,
  monthLabel,
} from "@/utils/check-in-history";
import { dateFromKey } from "@/utils/local-date";
import { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";

const INK = "#15163A";
const SUBTITLE = "#54566E";
const PRIMARY = "#4338CA";
const BACKGROUND = "#F5F4FA";
const BORDERCOLOR = "#E6E4EF";
const WEEKDAY_LETTERS = ["M", "T", "W", "T", "F", "S", "S"];
const MAX_MONTHS_BACK = 11;

const STATUS_COLORS: Record<CheckInStatus, string> = {
  onTime: "#0B7A66",
  late: "#F5B53D",
  missed: "#C43A2B",
  skipped: "#B9B6C8", // paused that day
};

type Props = {
  entries: Map<string, HistoryEntry>;
  /** Days of the week they check in, 0 = Monday … 6 = Sunday */
  days: number[];
  /** "YYYY-MM-DD" for today in their time zone */
  todayKey: string;
  year: number;
  month: number;
  onChangeMonth: (delta: number) => void;
  /** Shown right under the month card, above Recent */
  belowMonth?: ReactNode;
  /** Shown in the Recent list when there is nothing yet */
  emptyText: string;
};

/** The month calendar, the on time / late / missed totals and the Recent list. */
export function HistoryCalendar({
  entries,
  days,
  todayKey,
  year,
  month,
  onChangeMonth,
  belowMonth,
  emptyText,
}: Props) {
  const today = dateFromKey(todayKey);
  const weeks = getMonthGrid(year, month);
  const totals = getMonthTotals(entries, year, month);
  const recent = getRecentEntries(entries);

  const monthsBack =
    (today.getFullYear() - year) * 12 + (today.getMonth() - month);
  const canGoBack = monthsBack < MAX_MONTHS_BACK;
  const canGoForward = monthsBack > 0;

  return (
    <>
      <View style={styles.month}>
        <View style={styles.monthHeader}>
          <Pressable
            style={[styles.containerMonth, !canGoBack && styles.disabled]}
            disabled={!canGoBack}
            onPress={() => onChangeMonth(-1)}
            accessibilityRole="button"
            accessibilityLabel="Previous month"
          >
            <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
              <Path
                d="M11.25 4.5L6.75 9L11.25 13.5"
                stroke={INK}
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </Pressable>
          <AppText style={styles.monthText}>{monthLabel(year, month)}</AppText>
          <Pressable
            style={[styles.containerMonth, !canGoForward && styles.disabled]}
            disabled={!canGoForward}
            onPress={() => onChangeMonth(1)}
            accessibilityRole="button"
            accessibilityLabel="Next month"
          >
            <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
              <Path
                d="M6.75 4.5L11.25 9L6.75 13.5"
                stroke={INK}
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </Pressable>
        </View>
        <View style={styles.calendarGrid}>
          <View style={styles.weekDays}>
            {WEEKDAY_LETTERS.map((letter, i) => (
              <View key={i} style={styles.letters}>
                <AppText style={styles.lettersText}>{letter}</AppText>
              </View>
            ))}
          </View>
          {weeks.map((week, w) => (
            <View key={w} style={styles.week}>
              {week.map((day, i) => {
                if (day === null) return <View key={i} style={styles.day} />;

                const key = dayKey(year, month, day);
                const entry = entries.get(key);
                const isToday = key === todayKey;
                const isFuture = key > todayKey;
                const scheduled = days.includes(i);

                let dayStyle;
                let textStyle;
                if (entry) {
                  dayStyle = { backgroundColor: STATUS_COLORS[entry.status] };
                  textStyle =
                    entry.status === "late" || entry.status === "skipped"
                      ? { color: INK }
                      : undefined;
                } else if (isToday) {
                  dayStyle = styles.today;
                  textStyle = { color: INK };
                } else if (isFuture && scheduled) {
                  dayStyle = styles.upcoming;
                  textStyle = { color: "#8B8DA3" };
                } else {
                  textStyle = { color: "#8B8DA3" };
                }

                return (
                  <View key={i} style={[styles.day, dayStyle]}>
                    <AppText style={[styles.dayText, textStyle]}>{day}</AppText>
                  </View>
                );
              })}
            </View>
          ))}
        </View>
        <View style={styles.totals}>
          <View style={styles.status}>
            <Svg width={10} height={10} viewBox="0 0 10 10" fill="none">
              <Circle cx={5} cy={5} r={5} fill={STATUS_COLORS.onTime} />
            </Svg>
            <AppText style={styles.statusText}>{totals.onTime} on time</AppText>
          </View>
          <View style={styles.status}>
            <Svg width={10} height={10} viewBox="0 0 10 10" fill="none">
              <Circle cx={5} cy={5} r={5} fill={STATUS_COLORS.late} />
            </Svg>
            <AppText style={styles.statusText}>{totals.late} late</AppText>
          </View>
          <View style={styles.status}>
            <Svg width={10} height={10} viewBox="0 0 10 10" fill="none">
              <Circle cx={5} cy={5} r={5} fill={STATUS_COLORS.missed} />
            </Svg>
            <AppText style={styles.statusText}>{totals.missed} missed</AppText>
          </View>
        </View>
      </View>
      {belowMonth}
      <View style={styles.recent}>
        <AppText style={styles.recentTitle}>Recent</AppText>
        <View style={styles.recentList}>
          {recent.length === 0 ? (
            <View style={styles.row}>
              <AppText style={styles.recentSubText}>{emptyText}</AppText>
            </View>
          ) : (
            recent.map((entry, i) => (
              <View
                key={entry.key}
                style={[styles.row, i === recent.length - 1 && styles.lastRow]}
              >
                <Svg width={12} height={12} viewBox="0 0 12 12" fill="none">
                  <Circle cx={6} cy={6} r={6} fill={STATUS_COLORS[entry.status]} />
                </Svg>
                <AppText style={styles.recentText}>
                  {formatEntryDate(entry.date, today)}
                </AppText>
                <AppText style={styles.recentSubText}>
                  {describeEntry(entry)}
                </AppText>
              </View>
            ))
          )}
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  month: {
    padding: 16,
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 10,
    alignSelf: "stretch",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: BORDERCOLOR,
    backgroundColor: "#fff",
  },
  monthHeader: {
    justifyContent: "space-between",
    alignItems: "center",
    alignSelf: "stretch",
    flexDirection: "row",
  },
  containerMonth: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    backgroundColor: BACKGROUND,
  },
  disabled: {
    opacity: 0.4,
  },
  monthText: {
    color: INK,
    fontSize: 18,
    lineHeight: 23.4,
    fontFamily: FigtreeFont.extraBold,
  },
  calendarGrid: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 6,
    alignSelf: "stretch",
  },
  weekDays: {
    justifyContent: "space-between",
    alignItems: "flex-start",
    alignSelf: "stretch",
    flexDirection: "row",
  },
  letters: {
    width: 36,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  lettersText: {
    color: SUBTITLE,
    fontSize: 14,
    lineHeight: 18.2,
    fontFamily: FigtreeFont.extraBold,
  },
  week: {
    justifyContent: "space-between",
    alignItems: "flex-start",
    alignSelf: "stretch",
    flexDirection: "row",
  },
  day: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 17,
  },
  today: {
    borderWidth: 2,
    borderColor: PRIMARY,
    backgroundColor: "#fff",
  },
  upcoming: {
    borderColor: "#DCD9E8",
    backgroundColor: "#fff",
    borderWidth: 2,
    borderStyle: "dashed",
  },
  dayText: {
    color: "#fff",
    fontSize: 14,
    lineHeight: 18.2,
    fontFamily: FigtreeFont.bold,
  },
  totals: {
    paddingTop: 12,
    justifyContent: "space-between",
    alignItems: "center",
    alignSelf: "stretch",
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: BORDERCOLOR,
  },
  status: {
    alignItems: "center",
    gap: 6,
    flexDirection: "row",
  },
  statusText: {
    color: INK,
    fontSize: 14,
    lineHeight: 18.2,
    fontFamily: FigtreeFont.bold,
  },
  recent: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 10,
    alignSelf: "stretch",
  },
  recentTitle: {
    color: INK,
    fontSize: 17,
    lineHeight: 22.1,
    fontFamily: FigtreeFont.bold,
  },
  recentList: {
    flexDirection: "column",
    alignItems: "flex-start",
    alignSelf: "stretch",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: BORDERCOLOR,
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  row: {
    height: 56,
    paddingHorizontal: 16,
    alignItems: "center",
    gap: 12,
    alignSelf: "stretch",
    borderBottomWidth: 1,
    borderBottomColor: BORDERCOLOR,
    flexDirection: "row",
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  recentText: {
    flex: 1,
    color: INK,
    fontSize: 16,
    lineHeight: 20.8,
    fontFamily: FigtreeFont.bold,
  },
  recentSubText: {
    color: SUBTITLE,
    fontSize: 15,
    lineHeight: 21,
    fontFamily: FigtreeFont.semiBold,
  },
});
