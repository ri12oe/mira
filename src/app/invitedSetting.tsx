import { AlertsSheet } from "@/components/alerts-prompt";
import { AppText } from "@/components/app-test";
import { BackButton } from "@/components/back-button";
import { ConfirmSheet } from "@/components/confirm-sheet";
import ArrowRightIcon from "@/components/icons/ArrowRightIcon";
import BellIcon from "@/components/icons/BellIcon";
import LockIcon from "@/components/icons/LockIcon";
import { ToggleSwitch } from "@/components/toggle-switch";
import { FigtreeFont, FontFamily } from "@/constants/fonts";
import { useCaregiverSetup } from "@/context/caregiver-setup";
import { AlertsStatus, useAlerts } from "@/hooks/use-alerts";
import { deleteAccount } from "@/lib/account";
import { signOut as signOutOfMira } from "@/lib/auth";
import { fetchMyInvitedDay, InvitedDayRow, rememberedInvitedDay } from "@/lib/invited";
import { REMINDER_SOUND, readPreference } from "@/lib/preferences";
import { forgetThisPhone, saveReminderSound } from "@/lib/push";
import { isBiggerText, setBiggerText } from "@/lib/text-size";
import { joinNames } from "@/utils/day-period";
import { formatTimeRange } from "@/utils/format-time-short";
import { router, useFocusEffect } from "expo-router";
import { ReactNode, useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

const BACKGROUND = "#F5F4FA";
const INK = "#15163A";
const SUBTITLE = "#54566E";
const BORDERCOLOR = "#E6E4EF";
const PRIMARY = "#4338CA";
const LILAC = "#E7E4FB";
const MINT = "#DDF3EE";
const TEAL = "#0B7A66";
const RED_BG = "#FDE7E3";
const RED_TEXT = "#A52F22";

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** [0..6] → "Every day", [0..4] → "Weekdays", [0, 2] → "Mon, Wed" */
function daysLabel(days: number[]) {
  const sorted = [...days].sort((a, b) => a - b);
  const key = sorted.join(",");
  if (key === "0,1,2,3,4,5,6") return "Every day";
  if (key === "0,1,2,3,4") return "Weekdays";
  if (key === "5,6") return "Weekends";
  return sorted.map((d) => DAY_NAMES[d]).join(", ");
}

const HOW: Record<InvitedDayRow["method"], string> = {
  text: "Asks you by text",
  call: "Calls you",
  app: "Asks you in this app",
};

/** How the Reminders row reads */
const REMINDERS_VALUE: Record<AlertsStatus, string> = {
  checking: "…",
  on: "On",
  off: "Off",
  denied: "Blocked",
  needsBuild: "Off",
  unsupported: "Off",
};

function Tile({ background, children }: { background: string; children: ReactNode }) {
  return <View style={[styles.tile, { backgroundColor: background }]}>{children}</View>;
}

/**
 * Settings for someone who was invited (Lin). Her check-ins belong to the
 * caregivers who set her up, so here she only sees them; what she can change
 * is about this phone (reminders, sound, text size) and her own account.
 */
export default function InvitedSetting() {
  const { reset, invitedBackupFor } = useCaregiverSetup();
  const [rows, setRows] = useState<InvitedDayRow[] | null>(rememberedInvitedDay);
  const [sheet, setSheet] = useState<null | "reminders">(null);
  const reminders = useAlerts();
  const [bigger, setBigger] = useState(isBiggerText);

  useFocusEffect(
    useCallback(() => {
      fetchMyInvitedDay()
        .then(setRows)
        .catch(() => {}); // the remembered day stays; Home says when Mira can't be reached
    }, []),
  );

  // ---- what to show
  const backupFor = joinNames(invitedBackupFor);
  const checksIn = (rows?.length ?? 0) > 0;
  const caregiverNames = [...new Set((rows ?? []).map((r) => r.caregiverName.trim()).filter(Boolean))];
  const told = joinNames(caregiverNames) || "your family";
  const usesApp = (rows ?? []).some((r) => r.method === "app" && !r.paused);
  const appNames = joinNames([
    ...new Set(
      (rows ?? [])
        .filter((r) => r.method === "app")
        .map((r) => r.caregiverName.trim())
        .filter(Boolean),
    ),
  ]);

  // ---- Reminder sound: shown at once; saved to this phone and the server
  // (it works while Mira is closed). If the server can't be told, it flips back.
  const [reminderSound, setReminderSound] = useState(() => readPreference(REMINDER_SOUND) !== "0");
  const [soundProblem, setSoundProblem] = useState<string | null>(null);
  const changeReminderSound = async (on: boolean) => {
    setReminderSound(on);
    setSoundProblem(null);
    const result = await saveReminderSound(on);
    if (result.ok) return;
    setReminderSound(!on);
    setSoundProblem(
      result.problem === "offline"
        ? "We couldn't reach Mira, so the reminder sound wasn't changed. Check that you're online, then try again."
        : "Something went wrong, so the reminder sound wasn't changed. Please try again.",
    );
  };

  // ---- account
  const signOut = async () => {
    // Stop reminders for this account arriving on this phone (needs to be signed in)
    await forgetThisPhone();
    await signOutOfMira();
    reset();
  };

  const [deleteSheet, setDeleteSheet] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteProblem, setDeleteProblem] = useState<string | null>(null);
  const confirmDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    setDeleteProblem(null);
    const result = await deleteAccount();
    if (!result.ok) {
      setDeleting(false);
      setDeleteProblem(
        result.problem === "offline"
          ? "We couldn't reach Mira. Nothing was deleted. Check that you're online, then try again."
          : "Something went wrong and nothing was deleted. Please try again.",
      );
      return;
    }
    // Protected screens disappear, but old setup screens can remain in history.
    reset();
    router.dismissAll();
    router.replace("/");
  };

  // Only her own sign-in goes; say plainly what stays
  const consequences = [
    "You're signed out, and this phone stops reminding you.",
    ...(checksIn
      ? [`Your check-ins stay set up by ${told}, so they're still told if you don't check in.`]
      : []),
    ...(appNames ? [`We'll let ${appNames} know Mira can't ask you in this app any more.`] : []),
    ...(backupFor ? [`You stay ${backupFor}'s backup. Mira can still text you about them.`] : []),
    "You can come back any time: tap “Someone invited me” and sign in again.",
  ];

  const goBack = () => (router.canGoBack() ? router.back() : router.replace("/invitedHome"));

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <BackButton onPress={goBack} />
          <AppText style={styles.title} accessibilityRole="header">
            Settings
          </AppText>
        </View>

        {checksIn && (
          <View style={styles.section}>
            <AppText style={styles.sectionTitle}>Your check-ins</AppText>
            <View style={styles.group}>
              {(rows ?? []).map((row, i, all) => {
                const who = row.caregiverName.trim() || "Family";
                const detail = row.paused
                  ? "Taking a break for now"
                  : `${HOW[row.method]} · ${formatTimeRange(row.windowStart, row.windowEnd)} · ${daysLabel(row.days)}`;
                return (
                  <View
                    key={row.takerId}
                    style={[styles.rowLast, i < all.length - 1 && styles.rowDivider]}
                    accessible
                    accessibilityLabel={`${who}. ${detail}`}
                  >
                    <View style={styles.avatar}>
                      <AppText style={styles.avatarText}>{who.charAt(0).toUpperCase()}</AppText>
                    </View>
                    <View style={styles.rowFrame}>
                      <AppText style={styles.rowText2}>{who}</AppText>
                      <AppText style={styles.rowValue2}>{detail}</AppText>
                    </View>
                  </View>
                );
              })}
            </View>
            <AppText style={styles.note}>
              Only {told} can change these. If something should be different, ask them.
            </AppText>
          </View>
        )}

        {!checksIn && backupFor ? (
          <View style={styles.section}>
            <AppText style={styles.sectionTitle}>You&apos;re a backup</AppText>
            <View style={[styles.group, styles.rowLast]}>
              <Tile background={MINT}>
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                  <Path d="M5 12.5l4.5 4.5L19 7.5" stroke={TEAL} strokeWidth={2.6} strokeLinecap="round" />
                </Svg>
              </Tile>
              <AppText style={[styles.rowValue2, styles.flex]}>
                You&apos;re {backupFor}&apos;s backup. Mira only texts you if {backupFor} misses a check-in.
              </AppText>
            </View>
          </View>
        ) : null}

        {/* Reminders only matter if someone asks her in the app */}
        {usesApp && (
          <View style={styles.section}>
            <AppText style={styles.sectionTitle}>Reminders</AppText>
            <View style={styles.group}>
              <Pressable
                style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                onPress={() => setSheet("reminders")}
                accessibilityRole="button"
                accessibilityLabel={`Reminders, ${REMINDERS_VALUE[reminders.status]}`}
              >
                <Tile background={LILAC}>
                  <BellIcon size={20} color={PRIMARY} />
                </Tile>
                <AppText style={styles.rowText}>Reminders</AppText>
                <AppText style={styles.rowValue}>{REMINDERS_VALUE[reminders.status]}</AppText>
                <ArrowRightIcon size={18} />
              </Pressable>
              <View style={styles.rowLast}>
                <Tile background={MINT}>
                  <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
                    <Path d="M3.5 8H6L10 4.5V15.5L6 12H3.5V8Z" stroke={TEAL} strokeWidth={1.8} strokeLinejoin="round" />
                    <Path
                      d="M13 7.5C13.8 8.2 14.2 9 14.2 10C14.2 11 13.8 11.8 13 12.5"
                      stroke={TEAL}
                      strokeWidth={1.8}
                      strokeLinecap="round"
                    />
                  </Svg>
                </Tile>
                <AppText style={[styles.rowText, styles.rowTextBold]}>Reminder sound</AppText>
                <ToggleSwitch value={reminderSound} onValueChange={changeReminderSound} label="Reminder sound" />
              </View>
            </View>
            {soundProblem && (
              <AppText style={styles.problem} accessibilityRole="alert">
                {soundProblem}
              </AppText>
            )}
          </View>
        )}

        <View style={styles.section}>
          <AppText style={styles.sectionTitle}>Easier to use</AppText>
          <View style={styles.group}>
            <View style={styles.rowLast}>
              <Tile background={LILAC}>
                <AppText style={styles.aa}>Aa</AppText>
              </Tile>
              <AppText style={[styles.rowText, styles.rowTextBold]}>Bigger text</AppText>
              <ToggleSwitch
                value={bigger}
                onValueChange={(value) => {
                  setBigger(value);
                  setBiggerText(value);
                }}
                label="Bigger text"
              />
            </View>
          </View>
        </View>

        {/* The privacy promise, in her words */}
        <View style={[styles.group, styles.rowLast, styles.privacy]}>
          <Tile background={MINT}>
            <LockIcon size={20} color={TEAL} strokeWidth={1.9} />
          </Tile>
          <AppText style={[styles.rowValue2, styles.flex]}>
            {checksIn
              ? `${told} only see whether you checked in, and when. Never your messages or where you are.`
              : `Mira only tells you whether ${backupFor || "they"} checked in. Never their messages or where they are.`}
          </AppText>
        </View>

        <View style={styles.group}>
          <Pressable
            style={({ pressed }) => [styles.rowLast, pressed && styles.rowPressed]}
            onPress={signOut}
            accessibilityRole="button"
            accessibilityLabel="Sign out"
          >
            <Tile background={RED_BG}>
              <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
                <Path
                  d="M10.5 3.75H13.5C13.9142 3.75 14.25 4.08579 14.25 4.5V13.5C14.25 13.9142 13.9142 14.25 13.5 14.25H10.5"
                  stroke={RED_TEXT}
                  strokeWidth={1.65}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Path
                  d="M7.5 6L4.5 9L7.5 12M4.5 9H11.25"
                  stroke={RED_TEXT}
                  strokeWidth={1.65}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </Tile>
            <AppText style={[styles.rowText, styles.rowTextBold, { color: RED_TEXT }]}>Sign out</AppText>
          </Pressable>
        </View>

        <Pressable
          style={({ pressed }) => [styles.deleteButton, pressed && styles.rowPressed]}
          onPress={() => {
            setDeleteProblem(null);
            setDeleteSheet(true);
          }}
          accessibilityRole="button"
          accessibilityHint="Asks you to confirm twice"
        >
          <AppText style={styles.deleteButtonText}>Delete my account</AppText>
        </Pressable>
      </ScrollView>

      <ConfirmSheet
        visible={deleteSheet}
        title="Delete your account?"
        consequences={consequences}
        confirmLabel="Delete my account"
        secondStep={{
          question: "This can't be undone. Are you sure?",
          confirmLabel: "Yes, delete my account",
        }}
        busy={deleting}
        problem={deleteProblem}
        onConfirm={confirmDelete}
        onClose={() => setDeleteSheet(false)}
      />

      <AlertsSheet
        self
        visible={sheet === "reminders"}
        onClose={() => setSheet(null)}
        status={reminders.status}
        busy={reminders.busy}
        problem={reminders.problem}
        onTurnOn={reminders.turnOn}
        name=""
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
    paddingTop: 16,
    paddingBottom: 40,
  },
  header: {
    gap: 16,
    marginBottom: 4,
  },
  title: {
    color: INK,
    fontFamily: FontFamily.bold,
    fontSize: 32,
    lineHeight: 35.2,
    letterSpacing: -0.7,
  },
  section: {
    gap: 8,
    alignSelf: "stretch",
  },
  sectionTitle: {
    color: SUBTITLE,
    fontSize: 16,
    lineHeight: 20.8,
    fontFamily: FigtreeFont.bold,
  },
  group: {
    alignSelf: "stretch",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: BORDERCOLOR,
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  tile: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: LILAC,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: PRIMARY,
    fontFamily: FigtreeFont.extraBold,
    fontSize: 17,
  },
  aa: {
    color: PRIMARY,
    fontSize: 16,
    fontFamily: FigtreeFont.extraBold,
  },
  row: {
    minHeight: 64,
    paddingHorizontal: 16,
    alignItems: "center",
    gap: 12,
    alignSelf: "stretch",
    borderBottomWidth: 1,
    borderBottomColor: BORDERCOLOR,
    flexDirection: "row",
  },
  rowLast: {
    minHeight: 64,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    gap: 12,
    alignSelf: "stretch",
    flexDirection: "row",
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: BORDERCOLOR,
  },
  rowPressed: {
    backgroundColor: BACKGROUND,
  },
  rowText: {
    flex: 1,
    color: INK,
    fontFamily: FigtreeFont.bold,
    fontSize: 17,
    lineHeight: 22.1,
  },
  rowTextBold: {
    fontFamily: FigtreeFont.extraBold,
  },
  rowValue: {
    color: SUBTITLE,
    fontFamily: FigtreeFont.semiBold,
    fontSize: 16,
    lineHeight: 23.2,
  },
  rowFrame: {
    flex: 1,
    gap: 2,
  },
  rowText2: {
    color: INK,
    fontFamily: FigtreeFont.extraBold,
    fontSize: 17,
    lineHeight: 22.1,
  },
  rowValue2: {
    color: SUBTITLE,
    fontFamily: FigtreeFont.medium,
    fontSize: 15,
    lineHeight: 21,
  },
  flex: {
    flex: 1,
  },
  note: {
    color: SUBTITLE,
    fontFamily: FigtreeFont.medium,
    fontSize: 15,
    lineHeight: 21,
    paddingHorizontal: 4,
  },
  privacy: {
    backgroundColor: "#fff",
  },
  problem: {
    color: RED_TEXT,
    fontFamily: FigtreeFont.semiBold,
    fontSize: 15,
    lineHeight: 21,
  },
  deleteButton: {
    minHeight: 48,
    paddingHorizontal: 4,
    justifyContent: "center",
    alignSelf: "flex-start",
    borderRadius: 12,
  },
  deleteButtonText: {
    color: RED_TEXT,
    fontSize: 16,
    lineHeight: 20.8,
    fontFamily: FigtreeFont.bold,
  },
});
