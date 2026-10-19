import { AppText } from "@/components/app-test";
import { CaregiverTabBar } from "@/components/caregiver-tab-bar";
import { Chip } from "@/components/chip";
import { HistoryCalendar } from "@/components/history-calendar";
import { FontFamily } from "@/constants/fonts";
import {
  PRIMARY_PERSON_ID as PRIMARY_ID,
  useCaregiverSetup,
} from "@/context/caregiver-setup";
import { useTakerActivity } from "@/hooks/use-taker-activity";
import { entriesByDay } from "@/utils/check-in-history";
import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const INK = "#15163A";
const BACKGROUND = "#F5F4FA";

export default function CaregiverHistory() {
  const {
    displayName: primaryName,
    days: primaryDays,
    takerId: primaryTakerId,
    timeZone: primaryTimeZone,
    people,
    selectedId,
    setSelectedId,
  } = useCaregiverSetup();

  const [view, setView] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  const options = [
    { id: PRIMARY_ID, name: primaryName },
    ...people.map((p) => ({ id: p.id, name: p.firstName })),
  ];
  const selectedPerson = people.find((p) => p.id === selectedId);
  // Fall back to the primary person if the selected one no longer exists
  const selectedName = selectedPerson?.firstName ?? primaryName;
  const takerId = selectedPerson?.id ?? primaryTakerId;
  const timeZone = selectedPerson?.timeZone ?? primaryTimeZone;
  const days = selectedPerson?.days ?? primaryDays;

  const { year, month } = view;
  // Real check-ins from the database (this month + the last 60 days, live)
  const { activity, todayKey } = useTakerActivity(takerId, timeZone, { kind: "month", year, month });
  const entries = entriesByDay(activity?.checkIns ?? [], timeZone);

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
        <View style={styles.chips}>
          {options.map((person) => (
            <Chip
              key={person.id}
              variant="person"
              label={person.name}
              avatar={person.name.charAt(0).toUpperCase()}
              selected={person.id === (selectedPerson?.id ?? PRIMARY_ID)}
              onPress={() => setSelectedId(person.id)}
            />
          ))}
        </View>
        <HistoryCalendar
          entries={entries}
          days={days}
          todayKey={todayKey}
          year={year}
          month={month}
          onChangeMonth={changeMonth}
          emptyText={activity ? `No check-ins for ${selectedName} yet.` : "Loading…"}
        />
      </ScrollView>
      <CaregiverTabBar active="history" />
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
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
});
