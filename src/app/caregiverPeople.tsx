import { randomUUID } from "expo-crypto";
import { AddPersonSheets } from "@/components/add-person-sheets";
import { AlertOrder } from "@/components/alert-order";
import { AppText } from "@/components/app-test";
import { ConfirmSheet } from "@/components/confirm-sheet";
import { SyncBanner } from "@/components/sync-banner";
import { BackupSheet } from "@/components/backup-sheet";
import { CaregiverTabBar } from "@/components/caregiver-tab-bar";
import { FigtreeFont, FontFamily } from "@/constants/fonts";
import {
  Backup,
  CheckInMethod,
  PRIMARY_PERSON_ID as PRIMARY_ID,
  useCaregiverSetup,
} from "@/context/caregiver-setup";
import { usePeopleToday } from "@/hooks/use-people-today";
import type { TodaySummary } from "@/lib/check-ins";
import { defaultInviteMessage } from "@/lib/invites";
import { formatTimeShort, formatTimeRange } from "@/utils/format-time-short";
import { dayIndex, localDateKey, localMinutes } from "@/utils/local-date";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
// Gesture Handler's ScrollView coordinates with the drag/swipe gestures inside it
import { ScrollView } from "react-native-gesture-handler";
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
const MISSED = "#A52F22";
const MISSED_BG = "#FDE7E3";
const PAUSED_BG = "#EFEDF5";

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

/** Where today's check-in stands, from the database (each in their own time zone) */
function todayStatus(
  entry: { windowStart: number; windowEnd: number; days: number[]; paused: boolean; timeZone: string },
  summary: TodaySummary | undefined,
  now: Date,
) {
  if (!summary) return { label: "…", background: BACKGROUND, color: SUBTITLE };
  if (!summary.joined) return { label: "Invite sent", background: SUN, color: RED };
  switch (summary.today) {
    case "on_time":
    case "late":
      return { label: "Okay today", background: MINT, color: GREEN };
    case "pending":
      return { label: "Waiting", background: LILAC, color: PRIMARY };
    case "missed":
      return { label: "Missed", background: MISSED_BG, color: MISSED };
    case "skipped":
      return { label: "Paused", background: PAUSED_BG, color: SUBTITLE };
  }
  if (entry.paused) return { label: "Paused", background: PAUSED_BG, color: SUBTITLE };
  const key = localDateKey(now, entry.timeZone);
  if (!entry.days.includes(dayIndex(key))) {
    return { label: "Day off", background: LILAC, color: PRIMARY };
  }
  if (localMinutes(now, entry.timeZone) < entry.windowEnd) {
    return { label: `Due ${formatTimeShort(entry.windowStart)}`, background: BACKGROUND, color: SUBTITLE };
  }
  return { label: "Done for today", background: BACKGROUND, color: SUBTITLE };
}

export default function CaregiverPeople() {
  const {
    displayName: primaryName,
    method: primaryMethod,
    windowStart: primaryWindowStart,
    windowEnd: primaryWindowEnd,
    backups: primaryBackups,
    days: primaryDays,
    takerId: primaryTakerId,
    timeZone: primaryTimeZone,
    paused: primaryPaused,
    people,
    update,
    updatePerson,
    removePerson,
    queueInvite,
    yourFirstName,
    firstName: primaryFirstName,
    selectedId,
    setSelectedId,
  } = useCaregiverSetup();
  const [sheet, setSheet] = useState<null | "person" | "backup" | "remove">(null);
  const [removing, setRemoving] = useState(false);
  const [removeProblem, setRemoveProblem] = useState<string | null>(null);
  const [editingBackup, setEditingBackup] = useState<Backup | null>(null);

  const entries = [
    ...(primaryFirstName.trim() ? [{
      id: PRIMARY_ID,
      name: primaryName,
      method: primaryMethod,
      windowStart: primaryWindowStart,
      windowEnd: primaryWindowEnd,
      days: primaryDays,
      backups: primaryBackups,
      takerId: primaryTakerId,
      timeZone: primaryTimeZone,
      paused: primaryPaused,
    }] : []),
    ...people.map((p) => ({
      id: p.id,
      name: p.firstName,
      method: p.method,
      windowStart: p.windowStart,
      windowEnd: p.windowEnd,
      days: p.days,
      backups: p.backups,
      takerId: p.id,
      timeZone: p.timeZone ?? primaryTimeZone,
      paused: !!p.paused,
    })),
  ];
  const { summaries, now } = usePeopleToday(entries);
  // Nobody left (the last person was removed): no selected person
  const selected: (typeof entries)[number] | undefined =
    entries.find((e) => e.id === selectedId) ?? entries[0];

  // Someone who hasn't said YES yet can be sent the invite again
  const notJoined = !!selected && summaries[selected.takerId]?.joined === false;
  const resendInvite = () => {
    if (!selected) return;
    queueInvite(selected.takerId, defaultInviteMessage(selected.name, yourFirstName));
    if (selected.id === PRIMARY_ID) router.push("/connected");
    else router.push({ pathname: "/connected2", params: { personId: selected.takerId } });
  };

  const confirmRemove = async () => {
    if (!selected || removing) return;
    setRemoving(true);
    setRemoveProblem(null);
    const result = await removePerson(selected.id);
    setRemoving(false);
    if (!result.ok) {
      setRemoveProblem(
        result.problem === "offline"
          ? "We couldn't reach Mira. Check that you're online, then try again."
          : "Something went wrong. Please try again.",
      );
      return;
    }
    setSheet(null);
  };

  const setBackups = (backups: Backup[]) => {
    if (!selected) return;
    if (selected.id === PRIMARY_ID) update({ backups });
    else updatePerson(selected.id, { backups });
  };

  const openBackupSheet = (backup: Backup | null) => {
    setEditingBackup(backup);
    setSheet("backup");
  };

  const saveBackup = (data: Omit<Backup, "id">) => {
    if (!selected) return;
    const addBackup = () => ({ id: randomUUID(), ...data });
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
        <SyncBanner />
        <View style={styles.wholookFor}>
          <AppText style={styles.subtitle}>Who you look after</AppText>
          {entries.map((entry, index) => {
            const colors = AVATAR_COLORS[index % AVATAR_COLORS.length];
            const status = todayStatus(entry, summaries[entry.takerId], now);
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
        {selected && (
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
          {notJoined && (
            <Pressable
              style={({ pressed }) => [styles.resendButton, pressed && styles.pressed]}
              onPress={resendInvite}
              accessibilityRole="button"
              accessibilityLabel={`Send the invite to ${selected.name} again`}
            >
              <AppText style={styles.resendButtonText}>Send the invite again</AppText>
            </Pressable>
          )}
          <Pressable
            style={({ pressed }) => [styles.removeButton, pressed && styles.pressed]}
            onPress={() => {
              setRemoveProblem(null);
              setSheet("remove");
            }}
            accessibilityRole="button"
            accessibilityLabel={`Remove ${selected.name}`}
            accessibilityHint="Asks you to confirm first"
          >
            <AppText style={styles.removeButtonText}>Remove {selected.name}</AppText>
          </Pressable>
        </View>
        )}
      </ScrollView>
      <CaregiverTabBar active="people" />
      {selected && (
        <ConfirmSheet
          visible={sheet === "remove"}
          title={`Remove ${selected.name}?`}
          consequences={[
            `Mira stops checking in on ${selected.name}.`,
            `Nobody gets alerted about ${selected.name} anymore.`,
            `${selected.name}'s backups and check-in history are deleted.`,
          ]}
          confirmLabel={`Remove ${selected.name}`}
          busy={removing}
          problem={removeProblem}
          onConfirm={confirmRemove}
          onClose={() => setSheet(null)}
        />
      )}
      <BackupSheet
        visible={sheet === "backup"}
        onClose={() => setSheet(null)}
        recipientName={selected?.name ?? ""}
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
  resendButton: {
    marginTop: 8,
    minHeight: 52,
    borderRadius: 18,
    backgroundColor: SUN,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "stretch",
  },
  resendButtonText: {
    color: RED,
    fontFamily: FigtreeFont.bold,
    fontSize: 17,
  },
  removeButton: {
    marginTop: 8,
    minHeight: 52,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#F0C2BA",
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "stretch",
  },
  removeButtonText: {
    color: "#B3261E",
    fontFamily: FigtreeFont.bold,
    fontSize: 17,
  },
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
