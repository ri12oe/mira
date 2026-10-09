import { AddPersonSheets } from "@/components/add-person-sheets";
import { AlertOrder } from "@/components/alert-order";
import { AppText } from "@/components/app-test";
import { BackupSheet } from "@/components/backup-sheet";
import { CaregiverTabBar } from "@/components/caregiver-tab-bar";
import { FigtreeFont, FontFamily } from "@/constants/fonts";
import {
  Backup,
  CheckInMethod,
  useCaregiverSetup,
} from "@/context/caregiver-setup";
import { formatTimeShort, formatTimeRange } from "@/utils/format-time-short";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

const INK = "#15163A";
const SUBTITLE = "#54566E";
const PRIMARY = "#4338CA";
const BACKGROUND = "#F5F4FA";
const BORDERCOLOR = "#E6E4EF";
const SUN = "#FFE8DB";
const RED = "#8A3A12";
const MINT = "#DDF3EE";
const GREEN = "#075E4F";
const LILAC = "#E7E4FB";
const PRIMARY_ID = "primary";
const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

const METHOD_LABELS: Record<CheckInMethod, string> = {
  text: "Text reply",
  call: "Phone call",
  app: "Mira app",
};

// Avatar colors, cycled by position in the list
const AVATAR_COLORS = [
  { background: SUN, text: RED },
  { background: MINT, text: GREEN },
  { background: LILAC, text: PRIMARY },
];

/** Where today's check-in stands for someone with this schedule */
function todayStatus(windowStart: number, days: number[], now: Date) {
  if (!days.includes((now.getDay() + 6) % 7)) {
    return { label: "Day off", background: LILAC, color: PRIMARY };
  }
  const minutes = now.getHours() * 60 + now.getMinutes();
  if (minutes < windowStart) {
    return {
      label: `Due ${formatTimeShort(windowStart)}`,
      background: BACKGROUND,
      color: SUBTITLE,
    };
  }
  return { label: "Okay today", background: MINT, color: GREEN };
}

export default function CaregiverPeople() {
  const {
    displayName: primaryName,
    method: primaryMethod,
    windowStart: primaryWindowStart,
    windowEnd: primaryWindowEnd,
    backups: primaryBackups,
    people,
    update,
    updatePerson,
  } = useCaregiverSetup();
  const [selectedId, setSelectedId] = useState(PRIMARY_ID);
  const [sheet, setSheet] = useState<null | "person" | "backup">(null);
  const [editingBackup, setEditingBackup] = useState<Backup | null>(null);

  const now = new Date();
  const entries = [
    {
      id: PRIMARY_ID,
      name: primaryName,
      method: primaryMethod,
      windowStart: primaryWindowStart,
      windowEnd: primaryWindowEnd,
      days: ALL_DAYS,
      backups: primaryBackups,
    },
    ...people.map((p) => ({
      id: p.id,
      name: p.firstName,
      method: p.method,
      windowStart: p.windowStart,
      windowEnd: p.windowEnd,
      days: p.days,
      backups: p.backups,
    })),
  ];
  const selected = entries.find((e) => e.id === selectedId) ?? entries[0];

  const setBackups = (backups: Backup[]) => {
    if (selected.id === PRIMARY_ID) update({ backups });
    else updatePerson(selected.id, { backups });
  };

  const openBackupSheet = (backup: Backup | null) => {
    setEditingBackup(backup);
    setSheet("backup");
  };

  const saveBackup = (data: Omit<Backup, "id">) => {
    const addBackup = () => ({ id: `backup-${Date.now()}`, ...data });
    setBackups(
      editingBackup
        ? selected.backups.map((b) =>
            b.id === editingBackup.id ? { ...b, ...data } : b,
          )
        : [...selected.backups, addBackup()],
    );
    setSheet(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <AppText style={styles.title}>People</AppText>
        <View style={styles.wholookFor}>
          <AppText style={styles.subtitle}>Who you look after</AppText>
          {entries.map((entry, index) => {
            const colors = AVATAR_COLORS[index % AVATAR_COLORS.length];
            const status = todayStatus(entry.windowStart, entry.days, now);
            const isSelected = entry.id === selected.id;
            return (
              <Pressable
                key={entry.id}
                style={[styles.person, isSelected && styles.personSelected]}
                onPress={() => setSelectedId(entry.id)}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={`${entry.name}, ${METHOD_LABELS[entry.method]}, ${formatTimeRange(entry.windowStart, entry.windowEnd)}, ${status.label}`}
                accessibilityHint="Shows who we alert if they miss a check-in"
              >
                <View
                  style={[styles.Avater, { backgroundColor: colors.background }]}
                >
                  <AppText style={[styles.avatarText, { color: colors.text }]}>
                    {entry.name.charAt(0).toUpperCase()}
                  </AppText>
                </View>
                <View style={styles.frame}>
                  <AppText style={styles.frameText}>{entry.name}</AppText>
                  <AppText style={styles.frameSubtitle}>
                    {METHOD_LABELS[entry.method]},{" "}
                    {formatTimeRange(entry.windowStart, entry.windowEnd)}
                  </AppText>
                </View>
                <View
                  style={[styles.pill, { backgroundColor: status.background }]}
                >
                  <AppText style={[styles.pillText, { color: status.color }]}>
                    {status.label}
                  </AppText>
                </View>
              </Pressable>
            );
          })}
          <Pressable
            style={({ pressed }) => [
              styles.addButton,
              pressed && styles.pressed,
            ]}
            onPress={() => setSheet("person")}
            accessibilityRole="button"
            accessibilityLabel="Look after someone else"
          >
            <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
              <Path
                d="M10.0001 4.16663V15.8333M4.16675 9.99996H15.8334"
                stroke="#4338CA"
                strokeWidth={2.16667}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
            <AppText style={styles.addButtonText}>
              Look after someone else
            </AppText>
          </Pressable>
        </View>
        <View style={styles.alertOrder}>
          <View style={styles.frame2}>
            <AppText style={styles.frame2Text}>
              If {selected.name} misses a check-in
            </AppText>
            <AppText style={styles.frame2Subtitle}>
              We alert people in this order. Drag to change it.
            </AppText>
          </View>
          <AlertOrder
            recipientName={selected.name}
            method={selected.method}
            backups={selected.backups}
            onChangeBackups={setBackups}
            onEditBackup={openBackupSheet}
            onAddBackup={() => openBackupSheet(null)}
          />
        </View>
      </ScrollView>
      <CaregiverTabBar active="people" />
      <BackupSheet
        visible={sheet === "backup"}
        onClose={() => setSheet(null)}
        recipientName={selected.name}
        backup={editingBackup}
        onSave={saveBackup}
      />
      <AddPersonSheets
        visible={sheet === "person"}
        onClose={() => setSheet(null)}
        onAdded={(person) => {
          setSelectedId(person.id);
          router.push("/connected2");
        }}
      />
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
    fontSize: 32,
    fontFamily: FontFamily.extraBold,
    color: INK,
    lineHeight: 35.2,
    letterSpacing: -0.7,
  },
  wholookFor: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 10,
    alignSelf: "stretch",
  },
  subtitle: {
    color: INK,
    fontSize: 17,
    fontFamily: FigtreeFont.bold,
    lineHeight: 22.1,
  },
  person: {
    padding: 16,
    alignItems: "center",
    gap: 14,
    alignSelf: "stretch",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: BORDERCOLOR,
    backgroundColor: "#fff",
    shadowColor: "rgba(20, 23, 59, 0.06)",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 12,
    flexDirection: "row",
  },
  personSelected: {
    borderWidth: 2,
    borderColor: PRIMARY,
  },
  pressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.9,
  },
  Avater: {
    width: 54,
    height: 54,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 27,
  },
  avatarText: {
    fontSize: 22,
    lineHeight: 28.6,
    fontFamily: FigtreeFont.extraBold,
  },
  frame: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 3,
    flex: 1,
  },
  frameText: {
    color: INK,
    fontSize: 19,
    lineHeight: 24.7,
    fontFamily: FigtreeFont.bold,
  },
  frameSubtitle: {
    color: SUBTITLE,
    fontSize: 15,
    fontFamily: FigtreeFont.medium,
    lineHeight: 21,
  },
  pill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignItems: "flex-start",
    borderRadius: 999,
  },
  pillText: {
    fontSize: 14,
    fontFamily: FigtreeFont.extraBold,
    lineHeight: 18.2,
  },
  addButton: {
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    alignSelf: "stretch",
    borderRadius: 18,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#B9B4E6",
    backgroundColor: "#fff",
    flexDirection: "row",
  },
  addButtonText: {
    color: INK,
    fontSize: 17,
    fontFamily: FigtreeFont.bold,
    lineHeight: 22.1,
  },
  alertOrder: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 10,
    alignSelf: "stretch",
  },
  frame2: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 4,
    alignSelf: "stretch",
  },
  frame2Text: {
    color: INK,
    fontSize: 17,
    lineHeight: 22.1,
    fontFamily: FigtreeFont.bold,
  },
  frame2Subtitle: {
    alignSelf: "stretch",
    color: SUBTITLE,
    fontSize: 15,
    fontFamily: FigtreeFont.medium,
    lineHeight: 21,
  },
});
