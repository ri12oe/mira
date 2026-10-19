import { AppText } from "@/components/app-test";
import { SelfTabBar } from "@/components/caregiver-tab-bar";
import { HistoryCalendar } from "@/components/history-calendar";
import { MonthSummaryCard } from "@/components/month-summary-card";
import { FontFamily } from "@/constants/fonts";
import { useCaregiverSetup } from "@/context/caregiver-setup";
import { useTakerActivity } from "@/hooks/use-taker-activity";
import { dayKey, entriesByDay } from "@/utils/check-in-history";
import { useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const INK = "#15163A";
const BACKGROUND = "#F5F4FA";

export default function SelfHistory() {
  const { days, timeZone, takerId } = useCaregiverSetup();

  const [view, setView] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const { year, month } = view;

  // Check-ins from the server (this month + the last 60 days, live). Missed
  // days are real rows too: the scheduler marks them
  const { activity, todayKey } = useTakerActivity(takerId, timeZone, { kind: "month", year, month });
  const entries = entriesByDay(activity?.checkIns ?? [], timeZone);
  const isCurrentMonth = todayKey.startsWith(dayKey(year, month, 1).slice(0, 8));

  const changeMonth = (delta: number) => {
    const next = new Date(year, month + delta, 1);
    setView({ year: next.getFullYear(), month: next.getMonth() });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <AppText style={styles.title}>History</AppText>
        <HistoryCalendar
          entries={entries}
          days={days}
          todayKey={todayKey}
          year={year}
          month={month}
          onChangeMonth={changeMonth}
          belowMonth={
            <MonthSummaryCard
              entries={entries}
              year={year}
              month={month}
              isCurrentMonth={isCurrentMonth}
            />
          }
          emptyText="No check-ins yet."
        />
      </ScrollView>
      <SelfTabBar active="history" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    gap: 16,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 108,
    marginTop: 56,
  },
  title: {
    color: INK,
    fontFamily: FontFamily.bold,
    fontSize: 32,
    lineHeight: 35.2,
    letterSpacing: -0.7,
  },
});
