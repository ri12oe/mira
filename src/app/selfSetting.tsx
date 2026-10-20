import { AlertsSheet } from "@/components/alerts-prompt";
import { AppText } from "@/components/app-test";
import BellIcon from "@/components/icons/BellIcon";
import { ConfirmSheet } from "@/components/confirm-sheet";
import { deleteAccount } from "@/lib/account";
import { AlertsStatus, useAlerts } from "@/hooks/use-alerts";
import { BottomSheet } from "@/components/bottom-sheet";
import { SelfTabBar } from "@/components/caregiver-tab-bar";
import ArrowRightIcon from "@/components/icons/ArrowRightIcon";
import ClockIcon from "@/components/icons/ClockIcon";
import PhoneSquareIcon from "@/components/icons/PhoneSquareIcon";
import { SyncBanner } from "@/components/sync-banner";
import { SingleTimePicker } from "@/components/time-window-picker";
import { ToggleSwitch } from "@/components/toggle-switch";
import { FigtreeFont, FontFamily } from "@/constants/fonts";
import { useCaregiverSetup } from "@/context/caregiver-setup";
import { signOut as signOutOfMira } from "@/lib/auth";
import { REMINDER_SOUND, readPreference } from "@/lib/preferences";
import { forgetThisPhone, saveReminderSound } from "@/lib/push";
import { isBiggerText, setBiggerText } from "@/lib/text-size";
import { windowEndFor } from "@/utils/day-period";
import { formatTime } from "@/utils/format-time";
import { router } from "expo-router";
import { ReactNode, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

const BACKGROUND = "#F5F4FA";
const INK = "#15163A";
const SUBTITLE = "#54566E";
const BORDERCOLOR = "#E6E4EF";
const PRIMARY = "#4338CA";
const SUN = "#FFE8DB";
const LILAC = "#E7E4FB";
const MINT = "#DDF3EE";
const AMBER_BG = "#FFF3D1";
const AMBER_TEXT = "#9A6408";
const TEAL = "#0B7A66";
const RED_BG = "#FDE7E3";
const RED_TEXT = "#A52F22";

function Tile({ background, children }: { background: string; children: ReactNode }) {
  return <View style={[styles.tile, { backgroundColor: background }]}>{children}</View>;
}

/** How the Reminders row reads */
const REMINDERS_VALUE: Record<AlertsStatus, string> = {
  checking: "…",
  on: "On",
  off: "Off",
  denied: "Blocked",
  needsBuild: "Off",
  unsupported: "Off",
};

export default function SelfSetting() {
  const { windowStart, paused, update, reset } = useCaregiverSetup();
  const [sheet, setSheet] = useState<null | "time" | "reminders">(null);
  const reminders = useAlerts();
  const [bigger, setBigger] = useState(isBiggerText);
  const [reminderSound, setReminderSound] = useState(
    () => readPreference(REMINDER_SOUND) !== "0",
  );
  const [soundProblem, setSoundProblem] = useState<string | null>(null);
  // Shown at once; saved to this phone and the server (works while Mira is
  // closed). If the server can't be told, it flips back and says so.
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

  const setTime = (value: number) =>
    update({ windowStart: value, windowEnd: windowEndFor(value) });

  // "Delete my account": a sheet that lists what's deleted, then a second tap
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

  // Signed-in screens are protected in _layout.tsx, so once the session is
  // gone the router goes back to Welcome by itself
  const signOut = async () => {
    // Stop reminders for this account arriving on this phone (needs to be signed in)
    await forgetThisPhone();
    await signOutOfMira();
    reset();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <AppText style={styles.title}>Settings</AppText>
        <SyncBanner />

        <View style={styles.section}>
          <AppText style={styles.sectionTitle}>My check-in</AppText>
          <View style={styles.group}>
            <Pressable
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
              onPress={() => setSheet("time")}
              accessibilityRole="button"
              accessibilityLabel={`Time, ${formatTime(windowStart)}`}
            >
              <Tile background={SUN}>
                <ClockIcon size={20} color="#C2551F" />
              </Tile>
              <AppText style={styles.rowText}>Time</AppText>
              <AppText style={styles.rowValue}>{formatTime(windowStart)}</AppText>
              <ArrowRightIcon size={18} />
            </Pressable>
            {/* Self users check in with the app (see selfSetup1), so nothing to pick */}
            <View
              style={styles.row}
              accessible
              accessibilityLabel="How I check in, This app"
            >
              <Tile background={MINT}>
                <PhoneSquareIcon size={20} color={TEAL} />
              </Tile>
              <AppText style={styles.rowText}>How I check in</AppText>
              <AppText style={styles.rowValue}>This app</AppText>
            </View>
            {/* The daily "Time to check in" push to this phone */}
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
              <Tile background={AMBER_BG}>
                <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
                  <Path
                    d="M7.5 5.5V14.5M12.5 5.5V14.5"
                    stroke={AMBER_TEXT}
                    strokeWidth={2.4}
                    strokeLinecap="round"
                  />
                </Svg>
              </Tile>
              <View style={styles.rowFrame}>
                <AppText style={styles.rowText2}>Take a break</AppText>
                <AppText style={styles.rowValue2}>
                  Going away? We won&apos;t ask you or tell anyone.
                </AppText>
              </View>
              <ToggleSwitch
                value={paused}
                onValueChange={(value) => update({ paused: value })}
                label="Take a break"
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <AppText style={styles.sectionTitle}>Easier to use</AppText>
          <View style={styles.group}>
            <View style={[styles.rowLast, styles.rowDivider]}>
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
            <View style={styles.rowLast}>
              <Tile background={MINT}>
                <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
                  <Path
                    d="M3.5 8H6L10 4.5V15.5L6 12H3.5V8Z"
                    stroke={TEAL}
                    strokeWidth={1.8}
                    strokeLinejoin="round"
                  />
                  <Path
                    d="M13 7.5C13.8 8.2 14.2 9 14.2 10C14.2 11 13.8 11.8 13 12.5"
                    stroke={TEAL}
                    strokeWidth={1.8}
                    strokeLinecap="round"
                  />
                </Svg>
              </Tile>
              <AppText style={[styles.rowText, styles.rowTextBold]}>Reminder sound</AppText>
              <ToggleSwitch
                value={reminderSound}
                onValueChange={changeReminderSound}
                label="Reminder sound"
              />
            </View>
          </View>
          {soundProblem && (
            <AppText style={styles.soundProblem} accessibilityRole="alert">
              {soundProblem}
            </AppText>
          )}
        </View>

        <View style={styles.group}>
          <Pressable
            style={({ pressed }) => [
              styles.rowLast,
              styles.rowDivider,
              pressed && styles.rowPressed,
            ]}
            onPress={() => router.push("/selfHelp")}
            accessibilityRole="button"
            accessibilityLabel="Help"
          >
            <Tile background={MINT}>
              <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
                <Path
                  d="M9 15.75C12.7279 15.75 15.75 12.7279 15.75 9C15.75 5.27208 12.7279 2.25 9 2.25C5.27208 2.25 2.25 5.27208 2.25 9C2.25 12.7279 5.27208 15.75 9 15.75Z"
                  stroke={TEAL}
                  strokeWidth={1.65}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Path
                  d="M7.125 7.12505C7.12618 6.78729 7.21857 6.45612 7.39242 6.16653C7.56627 5.87694 7.81512 5.63969 8.11267 5.47984C8.41021 5.32 8.74542 5.2435 9.08285 5.25842C9.42029 5.27335 9.74742 5.37915 10.0297 5.56464C10.312 5.75014 10.5389 6.00844 10.6865 6.31224C10.8341 6.61605 10.8969 6.95409 10.8682 7.29064C10.8396 7.62719 10.7205 7.94975 10.5237 8.22424C10.3269 8.49872 10.0596 8.71494 9.75 8.85005C9.3 9.07505 9 9.52505 9 10.0501"
                  stroke={TEAL}
                  strokeWidth={1.65}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Path
                  d="M9 12.75V13.125"
                  stroke={TEAL}
                  strokeWidth={1.65}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </Tile>
            <AppText style={[styles.rowText, styles.rowTextBold]}>Help</AppText>
            <ArrowRightIcon size={18} />
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.rowLast, pressed && styles.rowPressed]}
            onPress={signOut}
            accessibilityRole="button"
            accessibilityLabel="Sign out"
          >
            <Tile background={RED_BG}>
              <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
                <Path
                  d="M10.5 3.75H13.5C13.6989 3.75 13.8897 3.82902 14.0303 3.96967C14.171 4.11032 14.25 4.30109 14.25 4.5V13.5C14.25 13.6989 14.171 13.8897 14.0303 14.0303C13.8897 14.171 13.6989 14.25 13.5 14.25H10.5"
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
            <AppText style={[styles.rowText, styles.rowTextBold, { color: RED_TEXT }]}>
              Sign out
            </AppText>
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
      <SelfTabBar active="settings" />

      <BottomSheet
        visible={sheet === "time"}
        title="What time?"
        subtitle="We'll ask you to check in around this time each day."
        onClose={() => setSheet(null)}
      >
        <SingleTimePicker value={windowStart} onChange={setTime} />
        <Pressable
          style={styles.saveButton}
          onPress={() => setSheet(null)}
          accessibilityRole="button"
        >
          <AppText style={styles.saveButtonText}>Save</AppText>
        </Pressable>
      </BottomSheet>

      <ConfirmSheet
        visible={deleteSheet}
        title="Delete your account?"
        consequences={[
          "Mira stops asking you to check in.",
          "Your backups won't be told anything anymore, and invites waiting for them stop working.",
          "All your check-in history is deleted.",
          "Reminders stop on this phone.",
        ]}
        confirmLabel="Delete my account"
        secondStep={{
          question: "This can't be undone. Are you sure?",
          confirmLabel: "Yes, delete everything",
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
  soundProblem: {
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
    fontSize: 14,
    lineHeight: 19.6,
  },
  saveButton: {
    height: 60,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "stretch",
    borderRadius: 18,
    backgroundColor: PRIMARY,
  },
  saveButtonText: {
    color: "#fff",
    fontFamily: FigtreeFont.bold,
    fontSize: 19,
    lineHeight: 22.8,
  },
});
