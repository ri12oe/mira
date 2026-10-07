import { AppText } from "@/components/app-test";
import { BackButton } from "@/components/back-button";
import CheckBadgeLargeIcon from "@/components/icons/CheckBadgeLargeIcon";
import TinyCircleIcon from "@/components/icons/TinyCircleIcon";
import PhoneIcon from "@/components/icons/PhoneIcon";
import { WaitingHero } from "@/components/waiting-hero";
import { FigtreeFont } from "@/constants/fonts";
import { useCaregiverSetup } from "@/context/caregiver-setup";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { AppState, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

const INK = "#15163A";
const BACKGROUND = "#F5F4FA";
const SUBTITLE = "#54566E";
const PRIMARY = "#4338CA";
const BORDER = "#E6E4EF";
const RED = "#B3261E";
export default function Waiting() {
  const {
    displayName,
    method: primaryMethod,
    extraMinutes: primaryExtraMinutes,
    people,
  } = useCaregiverSetup();
  const params = useLocalSearchParams<{
    personId?: string;
    method?: string;
    waitMinutes?: string;
    sentAt?: string;
  }>();
  const person = people.find((person) => person.id === params.personId);
  const name = person?.firstName.trim() || displayName;
  const method = params.method ?? person?.method ?? primaryMethod;
  const waitMinutes = params.waitMinutes === undefined
    ? person?.extraMinutes ?? primaryExtraMinutes
    : Number(params.waitMinutes);
  const [openedAt] = useState(Date.now);
  const sentAt = params.sentAt === undefined ? openedAt : Number(params.sentAt);
  const duration = waitMinutes * 60_000;
  const deadline = sentAt + duration;
  const validCheckIn =
    (params.personId === undefined || params.personId === "primary" || !!person) &&
    (method === "text" || method === "call" || method === "app") &&
    Number.isSafeInteger(waitMinutes) && waitMinutes > 0 &&
    Number.isSafeInteger(sentAt) && sentAt > 0 &&
    Number.isSafeInteger(deadline) && deadline <= 8_640_000_000_000_000;
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    if (!validCheckIn) return;
    const updateTime = () => setNow(Date.now());
    updateTime();
    const interval = setInterval(updateTime, 1000);
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") updateTime();
    });
    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [validCheckIn, sentAt, duration]);

  const goHome = () => router.dismissTo("/caregiverHome");

  if (!validCheckIn) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.scrollContent}>
          <AppText accessibilityRole="alert">Unable to load this check-in. Its recipient, method, or timing is invalid.</AppText>
          <Pressable
            onPress={goHome}
            style={styles.cancelButton}
            accessibilityRole="button"
            accessibilityLabel="Return to home"
          >
            <AppText style={styles.cancelText}>Return to home</AppText>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const remainingSeconds = Math.ceil(Math.max(0, deadline - now) / 1000);
  const hours = Math.floor(remainingSeconds / 3600);
  const minutes = Math.floor((remainingSeconds % 3600) / 60);
  const seconds = String(remainingSeconds % 60).padStart(2, "0");
  const countdown = hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")}:${seconds}`
    : `${minutes}:${seconds}`;
  const remainingFraction = Math.min(1, Math.max(0, (deadline - now) / duration));
  const formatTimestamp = (timestamp: number) =>
    new Date(timestamp).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  const sentLabel = formatTimestamp(sentAt);
  const deadlineLabel = formatTimestamp(deadline);
  const sentDescription = method === "text" ? "Text sent to" : method === "call" ? "Call started for" : "Mira app check-in sent to";

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <BackButton />
          <View style={styles.pill}>
            <TinyCircleIcon />
            <AppText style={styles.pillText}>
              {remainingSeconds === 0 ? "Reply time ended" : method === "text" ? "Waiting for a reply" : "Waiting for confirmation"}
            </AppText>
          </View>
        </View>
        <View style={styles.hero}>
          <WaitingHero name={name} sentAt={sentLabel} method={method} />
        </View>
        <View style={styles.countdownCard}>
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
          <View style={styles.steps}>
            <View style={styles.step}>
              <CheckBadgeLargeIcon size={24} />
              <AppText style={styles.stepText}>
                {sentDescription} {name}
              </AppText>
              <AppText style={styles.stepTimestamp}>{sentLabel}</AppText>
            </View>
            <View style={styles.step}>
              <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                  fill="white"
                  stroke="#4338CA"
                  strokeWidth={2}
                />
                <Path
                  d="M12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16Z"
                  fill="#4338CA"
                />
              </Svg>
              <AppText style={styles.stepText}>
                {name} {method === "text" ? "replies YES" : method === "call" ? "confirms by phone" : "checks in with Mira"}
              </AppText>
              <AppText style={styles.stepTimestamp}>Waiting</AppText>
            </View>
            <View style={styles.step}>
              <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                  fill="white"
                  stroke="#CFCBE3"
                  strokeWidth={2}
                  strokeDasharray="3 3"
                />
              </Svg>
              <AppText style={styles.stepText}>If not, we alert you</AppText>
              <AppText style={styles.stepTimestamp}>{deadlineLabel}</AppText>
            </View>
          </View>
        </View>
        <View style={styles.spacer}></View>
        <View style={styles.actions}>
            <Pressable style={styles.actionButton}>
                <PhoneIcon  size={20} color={PRIMARY}/>
                <AppText style={styles.actionButtonText}>Call {name} yourself</AppText>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}
              onPress={goHome}
              accessibilityRole="button"
              accessibilityLabel="Cancel this check-in"
              accessibilityHint="Returns to the caregiver home screen"
            >
                <AppText style={styles.cancelText}>Cancel this check-in</AppText>
            </Pressable>
        </View>
      </ScrollView>
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
});
