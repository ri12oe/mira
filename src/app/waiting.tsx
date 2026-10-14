import { AppText } from "@/components/app-test";
import { BackButton } from "@/components/back-button";
import CheckBadgeLargeIcon from "@/components/icons/CheckBadgeLargeIcon";
import TinyCircleIcon from "@/components/icons/TinyCircleIcon";
import PhoneIcon from "@/components/icons/PhoneIcon";
import { WaitingHero, WaitingOutcome } from "@/components/waiting-hero";
import { FigtreeFont } from "@/constants/fonts";
import { CheckInMethod, useCaregiverSetup } from "@/context/caregiver-setup";
import { useCheckInNow } from "@/hooks/use-check-in-now";
import { cancelCheckInNow } from "@/lib/check-ins";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, AppState, Linking, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Path } from "react-native-svg";

const INK = "#15163A";
const BACKGROUND = "#F5F4FA";
const SUBTITLE = "#54566E";
const PRIMARY = "#4338CA";
const BORDER = "#E6E4EF";
const RED = "#B3261E";
const ALERT = "#C43A2B";

const CHANNEL_TO_METHOD: Record<string, CheckInMethod> = { sms: "text", call: "call", push: "app" };

/** A time from the database, on this phone's clock: "12:11 PM" */
const clock = (iso: string | number) =>
  new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

/**
 * "Waiting for Lin": follows one Check in now, live. Counts down to the alert,
 * then shows how it ended: Lin checked in, you were alerted, or you cancelled.
 */
export default function Waiting() {
  const { displayName, phone: primaryPhone, people } = useCaregiverSetup();
  const params = useLocalSearchParams<{ checkInId?: string; personId?: string }>();
  const person = people.find((p) => p.id === params.personId);
  const name = person?.firstName.trim() || displayName;
  const phone = person?.phone ?? primaryPhone;
  const { checkIn, loaded } = useCheckInNow(params.checkInId);
  const [now, setNow] = useState(Date.now);
  const [cancelling, setCancelling] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  // The countdown ticks every second (and catches up when the app comes back)
  useEffect(() => {
    const updateTime = () => setNow(Date.now());
    const interval = setInterval(updateTime, 1000);
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") updateTime();
    });
    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, []);

  const goHome = () => router.dismissTo("/caregiverHome");

  const callPerson = () => {
    const dial = phone.replace(/[^\d+]/g, "");
    Linking.openURL(`tel:${dial}`).catch(() =>
      Alert.alert("Unable to make a call", `Could not open the phone app. You can call ${name} at ${phone}.`),
    );
  };

  const cancel = async () => {
    if (!params.checkInId || cancelling) return;
    setCancelling(true);
    setProblem(null);
    try {
      await cancelCheckInNow(params.checkInId);
      goHome();
    } catch {
      setCancelling(false);
      setProblem("We couldn't cancel it. Check that you're online, then try again.");
    }
  };

  if (!params.checkInId || (loaded && !checkIn)) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.scrollContent}>
          <AppText accessibilityRole="alert">We couldn&apos;t find this check-in.</AppText>
          <Pressable onPress={goHome} style={styles.cancelButton} accessibilityRole="button">
            <AppText style={styles.cancelText}>Return to home</AppText>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (!checkIn) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.scrollContent, styles.loading]}>
          <ActivityIndicator color={PRIMARY} />
          <AppText style={styles.stepText}>Loading the check-in…</AppText>
        </View>
      </SafeAreaView>
    );
  }

  const { row, sends } = checkIn;
  const prompt = sends.find((s) => s.purpose === "check_in_prompt");
  const method = CHANNEL_TO_METHOD[prompt?.channel ?? "sms"];
  const sentAt = new Date(row.window_starts_at).getTime();
  const deadline = new Date(row.alert_at).getTime();
  const duration = Math.max(1, deadline - sentAt);
  const yourAlert = sends.find((s) => s.purpose === "caregiver_alert");

  const outcome: WaitingOutcome =
    row.status === "on_time" || row.status === "late"
      ? "checkedIn"
      : row.status === "missed"
        ? "alerted"
        : row.status === "skipped"
          ? "cancelled"
          : "waiting";
  const endedAt =
    outcome === "checkedIn" && row.responded_at
      ? clock(row.responded_at)
      : outcome === "alerted"
        ? clock(yourAlert?.created_at ?? row.alert_at)
        : undefined;

  const remainingSeconds = Math.ceil(Math.max(0, deadline - now) / 1000);
  const hours = Math.floor(remainingSeconds / 3600);
  const minutes = Math.floor((remainingSeconds % 3600) / 60);
  const seconds = String(remainingSeconds % 60).padStart(2, "0");
  const countdown = hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")}:${seconds}`
    : `${minutes}:${seconds}`;
  const remainingFraction = Math.min(1, Math.max(0, (deadline - now) / duration));
  const sentLabel = clock(sentAt);
  const deadlineLabel = clock(deadline);
  const sentDescription = method === "text" ? "Text sent to" : method === "call" ? "Call started for" : "Mira app check-in sent to";
  const pillText =
    outcome === "checkedIn"
      ? `${name} checked in`
      : outcome === "alerted"
        ? "You were alerted"
        : outcome === "cancelled"
          ? "Cancelled"
          : remainingSeconds === 0
            ? "Alerting you now…"
            : method === "text"
              ? "Waiting for a reply"
              : "Waiting for confirmation";

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <BackButton />
          <View style={styles.pill} accessibilityLiveRegion="polite">
            <TinyCircleIcon />
            <AppText style={styles.pillText}>{pillText}</AppText>
          </View>
        </View>
        <View style={styles.hero}>
          <WaitingHero name={name} sentAt={sentLabel} method={method} outcome={outcome} endedAt={endedAt} />
        </View>
        <View style={styles.countdownCard}>
          {outcome === "waiting" && (
            <>
              <View style={styles.timeLeft}>
                <AppText style={styles.timeLeftText}>
                  Time left to {method === "text" ? "reply" : "confirm"}
                </AppText>
                <AppText style={styles.timeLeftValue}>{countdown}</AppText>
              </View>
              <View
                style={styles.progress}
                accessibilityRole="progressbar"
                accessibilityLabel="Time remaining before alerts"
                accessibilityValue={{ min: 0, max: 100, now: Math.round(remainingFraction * 100), text: countdown }}
              >
                <View style={[styles.progressBar, { width: `${remainingFraction * 100}%` }]} />
              </View>
            </>
          )}
          <View style={styles.steps}>
            <View style={styles.step}>
              <CheckBadgeLargeIcon size={24} />
              <AppText style={styles.stepText}>
                {sentDescription} {name}
              </AppText>
              <AppText style={styles.stepTimestamp}>{sentLabel}</AppText>
            </View>
            <View style={styles.step}>
              {outcome === "checkedIn" ? (
                <CheckBadgeLargeIcon size={24} />
              ) : outcome === "waiting" ? (
                <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                  <Circle cx={12} cy={12} r={10} fill="white" stroke={PRIMARY} strokeWidth={2} />
                  <Circle cx={12} cy={12} r={4} fill={PRIMARY} />
                </Svg>
              ) : (
                <DashedCircle />
              )}
              <AppText style={styles.stepText}>
                {name} {method === "text" ? "replies" : method === "call" ? "confirms by phone" : "checks in with Mira"}
              </AppText>
              <AppText style={styles.stepTimestamp}>
                {outcome === "checkedIn" ? endedAt : outcome === "waiting" ? "Waiting" : "No answer"}
              </AppText>
            </View>
            <View style={styles.step}>
              {outcome === "alerted" ? (
                <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                  <Circle cx={12} cy={12} r={8} fill={ALERT} />
                </Svg>
              ) : (
                <DashedCircle />
              )}
              <AppText style={styles.stepText}>
                {outcome === "alerted" ? "We alerted you" : outcome === "waiting" ? "If not, we alert you" : "Nobody was alerted"}
              </AppText>
              <AppText style={styles.stepTimestamp}>
                {outcome === "alerted" ? endedAt : outcome === "waiting" ? deadlineLabel : ""}
              </AppText>
            </View>
          </View>
        </View>
        <View style={styles.spacer}></View>
        <View style={styles.actions}>
          {problem && (
            <AppText style={styles.problemText} accessibilityRole="alert">
              {problem}
            </AppText>
          )}
          <Pressable
            style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
            onPress={callPerson}
            accessibilityRole="button"
            accessibilityLabel={`Call ${name} yourself`}
          >
            <PhoneIcon size={20} color={PRIMARY} />
            <AppText style={styles.actionButtonText}>Call {name} yourself</AppText>
          </Pressable>
          {outcome === "waiting" ? (
            <Pressable
              style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}
              onPress={cancel}
              disabled={cancelling}
              accessibilityRole="button"
              accessibilityLabel="Cancel this check-in"
              accessibilityHint="Nobody will be alerted"
              accessibilityState={{ busy: cancelling }}
            >
              {cancelling ? (
                <ActivityIndicator color={RED} />
              ) : (
                <AppText style={styles.cancelText}>Cancel this check-in</AppText>
              )}
            </Pressable>
          ) : (
            <Pressable
              style={({ pressed }) => [styles.homeButton, pressed && styles.pressed]}
              onPress={goHome}
              accessibilityRole="button"
            >
              <AppText style={styles.homeButtonText}>Back to home</AppText>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function DashedCircle() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
        fill="white"
        stroke="#CFCBE3"
        strokeWidth={2}
        strokeDasharray="3 3"
      />
    </Svg>
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
    gap: 22,
    paddingHorizontal: 24,
    paddingVertical: 24,
    paddingBottom: 108,
    marginTop: 56,
  },
  topBar: {
    justifyContent: "space-between",
    alignItems: "center",
    alignSelf: "stretch",
    flexDirection: "row",
  },
  pill: {
    height: 32,
    paddingHorizontal: 12,
    alignItems: "center",
    gap: 8,
    borderRadius: 999,
    backgroundColor: "#FFF3D1",
    flexDirection: "row",
  },
  pillText: {
    color: "#7A4E05",
    fontSize: 14,
    fontFamily: FigtreeFont.extraBold,
  },
  hero: {
    alignItems: "center",
  },
  countdownCard: {
    paddingVertical: 16,
    paddingHorizontal: 18,
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 12,
    alignSelf: "stretch",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: "#fff",
  },
  timeLeft: {
    justifyContent: "space-between",
    alignItems: "baseline",
    alignSelf: "stretch",
    flexDirection: "row",
  },
  timeLeftText: {
    color: SUBTITLE,
    fontSize: 15,
    fontFamily: FigtreeFont.semiBold,
  },
  timeLeftValue: {
    color: INK,
    fontSize: 22,
    fontFamily: FigtreeFont.extraBold,
  },
  progress: {
    height: 8,
    alignItems: "flex-start",
    alignSelf: "stretch",
    borderRadius: 4,
    backgroundColor: "#E9E7F2",
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: PRIMARY,
  },
  steps: {
    flexDirection: "column",
    gap: 12,
    alignItems: "flex-start",
    alignSelf: "stretch",
  },
  step: {
    alignItems: "center",
    gap: 12,
    alignSelf: "stretch",
    flexDirection: "row",
  },
  stepText: {
    flex: 1,
    color: INK,
    fontSize: 16,
    fontFamily: FigtreeFont.bold,
  },
  stepTimestamp: {
    color: SUBTITLE,
    fontSize: 15,
    fontFamily: FigtreeFont.semiBold,
  },
  spacer: {
    flexDirection: "column",
    alignItems: "flex-start",
    flex: 1,
    alignSelf: "stretch",
  },
  actions: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 10,
    alignSelf: "stretch",
  },
  actionButton: {
    height: 60,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    alignSelf: "stretch",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#DCD9E8",
    backgroundColor: "#fff",
    flexDirection: "row",
  },
  actionButtonText: {
    color: INK,
    fontSize: 19,
    fontFamily: FigtreeFont.bold,
  },
  cancelButton: {
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "stretch",
  },
  cancelText: {
    color: RED,
    fontSize: 16,
    fontFamily: FigtreeFont.extraBold,
  },
  pressed: {
    opacity: 0.7,
  },
  loading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  problemText: {
    color: "#8C1D18",
    fontSize: 16,
    lineHeight: 23,
    fontFamily: FigtreeFont.semiBold,
  },
  homeButton: {
    height: 60,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "stretch",
    borderRadius: 18,
    backgroundColor: PRIMARY,
  },
  homeButtonText: {
    color: "#fff",
    fontSize: 19,
    fontFamily: FigtreeFont.bold,
  },
});
