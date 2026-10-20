import { AlertsCard } from "@/components/alerts-prompt";
import { AppText } from "@/components/app-test";
import { BottomSheet } from "@/components/bottom-sheet";
import { Dot } from "@/components/dot";
import MessageIcon from "@/components/icons/MessageIcon";
import PhoneIcon from "@/components/icons/PhoneIcon";
import { Rise } from "@/components/rise";
import { FigtreeFont, FontFamily } from "@/constants/fonts";
import { useCaregiverSetup } from "@/context/caregiver-setup";
import { useAlerts } from "@/hooks/use-alerts";
import { EASE_OUT, EASE_POP, useEntrance, useLoop } from "@/hooks/use-entrance";
import { signOut as signOutOfMira } from "@/lib/auth";
import { checkInAsInvited, fetchMyInvitedDay, InvitedDayRow } from "@/lib/invited";
import { openMessages } from "@/lib/invites";
import { REMINDERS_CARD_DISMISSED, readPreference, writePreference } from "@/lib/preferences";
import { forgetThisPhone } from "@/lib/push";
import { joinNames, periodOf } from "@/utils/day-period";
import { dayIndex, localDateKey, localMinutes } from "@/utils/local-date";
import { nextCheckInLabel } from "@/utils/today-state";
import * as Linking from "expo-linking";
import { useFocusEffect } from "expo-router";
import { ReactNode, useCallback, useState } from "react";
import { ActivityIndicator, Animated, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

const INK = "#15163A";
const SUBTITLE = "#54566E";
const PRIMARY = "#4338CA";
const BACKGROUND = "#F5F4FA";
const BORDER = "#E6E4EF";
const LILAC = "#E7E4FB";
const MINT = "#DDF3EE";
const SUN = "#FFE8DB";
const TEAL = "#0B7A66";
const GREEN_TEXT = "#075E4F";
const AMBER_BG = "#FFF3D1";
const AMBER_TEXT = "#9A6408";
const HELP_BG = "#FDE7E3";
const HELP_BORDER = "#C43A2B";
const HELP_TEXT = "#A52F22";
const RISE_TEXT = "#8A3A12";

const REFRESH_MS = 60 * 1000;

// The design's sizes: a 310px peach circle, a 264px lilac ring, a 216px button
const OUTER = 310;
const INNER = 264;
const BUTTON = 216;

/**
 * Today, as last loaded. Kept outside the screen so coming back to it (or
 * reopening the app) shows the right state at once, not a wrong one first.
 */
let lastRows: InvitedDayRow[] | null = null;

function CheckMark({ size, color = "#fff" }: { size: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5 12.5l4.5 4.5L19 7.5" stroke={color} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function PauseMark() {
  return (
    <Svg width={64} height={64} viewBox="0 0 20 20" fill="none">
      <Path d="M7.5 5.5V14.5M12.5 5.5V14.5" stroke={PRIMARY} strokeWidth={2.2} strokeLinecap="round" />
    </Svg>
  );
}

/** The big "I'm okay": a peach circle that gently breathes, around the button */
function OkayButton({ onPress, busy }: { onPress: () => void; busy: boolean }) {
  const breathe = useLoop({ duration: 2800 });
  const scale = breathe.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.05, 1] });
  return (
    <View style={styles.rings}>
      <Animated.View style={[styles.outer, { transform: [{ scale }] }]} />
      <View style={styles.inner} />
      <Pressable
        onPress={onPress}
        disabled={busy}
        accessibilityRole="button"
        accessibilityLabel="I'm okay. Check in for today."
        accessibilityState={{ busy }}
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
      >
        <CheckMark size={56} />
        <AppText style={styles.buttonText}>I&apos;m okay</AppText>
      </Pressable>
    </View>
  );
}

/** After the tap: the button turns green with a check, and a ring ripples out */
function DoneCircle() {
  const pop = useEntrance({ duration: 550, easing: EASE_POP });
  const ripple = useEntrance({ duration: 1100, easing: EASE_OUT });
  return (
    <View style={styles.rings}>
      <View style={[styles.inner, { backgroundColor: MINT }]} />
      <Animated.View
        style={[
          styles.ripple,
          {
            opacity: ripple.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] }),
            transform: [{ scale: ripple.interpolate({ inputRange: [0, 1], outputRange: [1, 1.5] }) }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.button,
          styles.buttonDone,
          { transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }] },
        ]}
      >
        <CheckMark size={92} />
      </Animated.View>
    </View>
  );
}

/** A calm circle for "taking a break", "no check-in today" and "loading" */
function QuietCircle({ children, color = LILAC }: { children: ReactNode; color?: string }) {
  return (
    <View style={styles.rings}>
      <View style={[styles.inner, { backgroundColor: color }]}>{children}</View>
    </View>
  );
}

/**
 * Home for someone who was invited (Lin): the CheckIn design. One "I'm okay"
 * tells every caregiver who set her up. Also the screen for a self user's
 * backup who joined from "Someone invited me" (nothing to check in).
 */
export default function InvitedHome() {
  const { reset, invitedBackupFor } = useCaregiverSetup();
  const [rows, setRows] = useState<InvitedDayRow[] | null>(() => lastRows);
  const [failed, setFailed] = useState(false);
  const [now, setNow] = useState(() => new Date());
  /** "pressed": the tap shows at once, before the server answers */
  const [phase, setPhase] = useState<"idle" | "pressed" | "done">("idle");
  /** The day of the last tap here ("Thanks" is only for that day) */
  const [tappedDay, setTappedDay] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);

  // The daily ask is a push to this phone (if a caregiver chose "Mira app"):
  // a card until reminders are on, or "Not now"
  const reminders = useAlerts();
  const [remindersCardDismissed, setRemindersCardDismissed] = useState(
    () => readPreference(REMINDERS_CARD_DISMISSED) === "1",
  );
  const dismissRemindersCard = () => {
    writePreference(REMINDERS_CARD_DISMISSED, "1");
    setRemindersCardDismissed(true);
  };

  const load = useCallback(async () => {
    try {
      const data = await fetchMyInvitedDay();
      lastRows = data;
      setRows(data);
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, []);

  // Fresh each time Home shows, and once a minute while it's open
  useFocusEffect(
    useCallback(() => {
      load();
      const timer = setInterval(() => {
        setNow(new Date());
        load();
      }, REFRESH_MS);
      return () => clearInterval(timer);
    }, [load]),
  );

  // ---- what to show
  const backupFor = joinNames(invitedBackupFor);
  const checksIn = (rows?.length ?? 0) > 0;
  const timeZone = rows?.[0]?.timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
  const name = rows?.[0]?.firstName.trim() ?? "";
  const caregiverNames = [...new Set((rows ?? []).map((r) => r.caregiverName.trim()).filter(Boolean))];
  const told = joinNames(caregiverNames) || "your family";
  const active = (rows ?? []).filter((r) => !r.paused);
  // Texts and calls reach her anyway; only "Mira app" needs this phone
  const showRemindersCard =
    active.some((r) => r.method === "app") &&
    (reminders.status === "off" || reminders.status === "denied") &&
    !remindersCardDismissed;
  const todayKey = localDateKey(now, timeZone);
  const isToday = (r: InvitedDayRow) => r.days.includes(dayIndex(todayKey));
  const done =
    (phase === "done" && tappedDay === todayKey) || (rows ?? []).some((r) => !!r.respondedAt);
  const onBreak = checksIn && active.length === 0;
  const dayOff = checksIn && !onBreak && !done && !active.some(isToday);
  const hour = Math.floor(localMinutes(now, timeZone) / 60);
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const dateLabel = now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", timeZone });

  // The next check-in among the caregivers still checking in
  const next = active
    .map((r) => ({
      label: nextCheckInLabel({ paused: false, days: r.days, windowEnd: -1, timeZone: r.timeZone }, todayKey, now),
      period: periodOf(r.windowStart),
    }))
    .find((n) => n.label);
  const nextText = next ? `${next.label === "Tomorrow" ? "tomorrow" : next.label} ${next.period}` : null;

  const firstCaregiver = (rows ?? []).find((r) => r.caregiverPhone);

  // ---- actions
  const checkIn = async () => {
    if (phase !== "idle") return;
    setProblem(null);
    setPhase("pressed");
    const started = Date.now();
    const result = await checkInAsInvited();
    if (result === "recorded" || result === "already") {
      // Let the press be seen for a moment, then say thanks
      setTappedDay(todayKey);
      setTimeout(() => setPhase("done"), Math.max(0, 900 - (Date.now() - started)));
      load();
      return;
    }
    setPhase("idle");
    setProblem(
      result === "notToday"
        ? "Today isn't a check-in day, so there's nothing to do. See you next time!"
        : result === "paused"
          ? "Check-ins are turned off for now, so there's nothing to do."
          : result === "nothingOpen"
            ? "There's no check-in waiting right now."
            : result === "offline"
              ? "We couldn't let them know. Check that you're online, then tap I'm okay again."
              : "Something went wrong. Please tap I'm okay again.",
    );
  };

  const call = (phone: string | null) => {
    if (!phone) return;
    Linking.openURL(`tel:${phone}`).catch(() =>
      setProblem(`We couldn't start the call. You can call ${phone}.`),
    );
  };
  const text = (row: InvitedDayRow) => {
    if (!row.caregiverPhone) return;
    openMessages(
      row.caregiverPhone,
      `Hi ${row.caregiverName.trim() || "there"}, it's ${name || "me"}. I need help. Please call me back.`,
    ).catch(() => setProblem(`We couldn't open Messages. You can text ${row.caregiverPhone}.`));
  };

  const signOut = async () => {
    await forgetThisPhone();
    await signOutOfMira();
    lastRows = null;
    reset();
  };

  // ---- a self user's backup (nothing to check in)
  if (rows && !checksIn && backupFor) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.top}>
            <Dot size={76} pose="cheer" label={null} />
            <AppText style={styles.date}>{dateLabel}</AppText>
            <AppText style={styles.heading} accessibilityRole="header">
              Thank you!
            </AppText>
          </View>
          <View style={styles.middle}>
            <QuietCircle color={MINT}>
              <CheckMark size={92} color={TEAL} />
            </QuietCircle>
            <AppText style={styles.caption}>You&apos;re {backupFor}&apos;s backup.</AppText>
            <AppText style={styles.captionSmall}>
              There&apos;s nothing else to do here. Mira only texts you if {backupFor} misses a
              check-in, and tells you when they&apos;re okay again.
            </AppText>
          </View>
          <SignOutLink onPress={signOut} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {showRemindersCard && (
          <AlertsCard
            self
            status={reminders.status}
            busy={reminders.busy}
            problem={reminders.problem}
            onTurnOn={reminders.turnOn}
            onDismiss={dismissRemindersCard}
            name={name}
          />
        )}
        {/* Dot, the date and the greeting */}
        <Rise style={styles.top}>
          <Dot size={76} pose={done ? "cheer" : "wave"} label={null} />
          <AppText style={styles.date}>{dateLabel}</AppText>
          <AppText style={styles.heading} accessibilityRole="header">
            {done ? `Thanks${name ? `, ${name}` : ""}!` : `${greeting}${name ? `, ${name}` : ""}`}
          </AppText>
        </Rise>

        {/* The big circle and the line under it */}
        <Rise delay={150} style={styles.middle}>
          {rows === null ? (
            failed ? (
              <QuietCircle>
                <AppText style={styles.quietText}>Can&apos;t reach Mira</AppText>
              </QuietCircle>
            ) : (
              <QuietCircle>
                <ActivityIndicator size="large" color={PRIMARY} />
              </QuietCircle>
            )
          ) : done ? (
            <Rise>
              <DoneCircle />
            </Rise>
          ) : onBreak ? (
            <QuietCircle>
              <PauseMark />
            </QuietCircle>
          ) : dayOff ? (
            <QuietCircle color={AMBER_BG}>
              <AppText style={[styles.quietText, { color: AMBER_TEXT }]}>No check-in{"\n"}today</AppText>
            </QuietCircle>
          ) : (
            <OkayButton onPress={checkIn} busy={phase === "pressed"} />
          )}

          <AppText
            style={[styles.caption, phase === "pressed" && styles.captionBusy]}
            accessibilityLiveRegion="polite"
          >
            {rows === null
              ? failed
                ? "Check that you're online. We'll try again in a minute."
                : "Checking today…"
              : done
                ? `${told} can see you're okay today.`
                : onBreak
                  ? `You're taking a break. ${told} turned off check-ins for now.`
                  : dayOff
                    ? nextText
                      ? `Your next check-in is ${nextText}.`
                      : "There's no check-in today."
                    : phase === "pressed"
                      ? `Letting ${told} know…`
                      : `Tap once to let ${told} know.`}
          </AppText>

          {done && nextText && (
            <Rise delay={150}>
              <View style={styles.nextPill}>
                <View style={styles.nextIcon}>
                  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                    <Path d="M12 7v5l3 2" stroke={AMBER_TEXT} strokeWidth={2.2} strokeLinecap="round" />
                    <Path
                      d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z"
                      stroke={AMBER_TEXT}
                      strokeWidth={2.2}
                    />
                  </Svg>
                </View>
                <AppText style={styles.nextText}>Next check-in {nextText}</AppText>
              </View>
            </Rise>
          )}

          {problem && (
            <AppText style={styles.problem} accessibilityRole="alert">
              {problem}
            </AppText>
          )}
          {backupFor ? <AppText style={styles.captionSmall}>You&apos;re also {backupFor}&apos;s backup.</AppText> : null}
        </Rise>

        {/* Reach someone: always here, also after checking in */}
        {checksIn && (
          <Rise delay={300} style={styles.bottom}>
            {firstCaregiver && (
              <Pressable
                style={({ pressed }) => [styles.callButton, pressed && styles.pressed]}
                onPress={() => call(firstCaregiver.caregiverPhone)}
                accessibilityRole="button"
                accessibilityLabel={`Call ${firstCaregiver.caregiverName}`}
              >
                <View style={styles.callIcon}>
                  <PhoneIcon size={18} color={PRIMARY} />
                </View>
                <AppText style={styles.callText} numberOfLines={1}>
                  Call {firstCaregiver.caregiverName.trim() || "family"}
                </AppText>
              </Pressable>
            )}
            <Pressable
              style={({ pressed }) => [styles.helpButton, pressed && styles.pressed]}
              onPress={() => setHelpOpen(true)}
              accessibilityRole="button"
              accessibilityLabel="I need help"
            >
              <AppText style={styles.helpText}>I need help</AppText>
            </Pressable>
          </Rise>
        )}
        <Rise delay={450}>
          <SignOutLink onPress={signOut} />
        </Rise>
      </ScrollView>

      <BottomSheet
        visible={helpOpen}
        title="Who should we contact?"
        subtitle="Pick someone to call or text."
        onClose={() => setHelpOpen(false)}
      >
        <View style={styles.helpList}>
          {(rows ?? [])
            .filter((r) => r.caregiverPhone)
            .filter((r, i, all) => all.findIndex((o) => o.caregiverPhone === r.caregiverPhone) === i)
            .map((row) => (
              <View key={row.takerId} style={styles.helpRow}>
                <View style={styles.avatar}>
                  <AppText style={styles.avatarText}>
                    {(row.caregiverName.trim() || "?").charAt(0).toUpperCase()}
                  </AppText>
                </View>
                <AppText style={styles.helpName} numberOfLines={1}>
                  {row.caregiverName.trim() || "Family"}
                </AppText>
                <Pressable
                  style={({ pressed }) => [styles.helpCall, pressed && styles.pressed]}
                  accessibilityRole="button"
                  accessibilityLabel={`Call ${row.caregiverName}`}
                  onPress={() => {
                    setHelpOpen(false);
                    call(row.caregiverPhone);
                  }}
                >
                  <PhoneIcon size={18} color="#fff" />
                  <AppText style={styles.helpCallText}>Call</AppText>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [styles.helpMessage, pressed && styles.pressed]}
                  accessibilityRole="button"
                  accessibilityLabel={`Text ${row.caregiverName}`}
                  onPress={() => {
                    setHelpOpen(false);
                    text(row);
                  }}
                >
                  <MessageIcon size={18} color={RISE_TEXT} />
                  <AppText style={styles.helpMessageText}>Text</AppText>
                </Pressable>
              </View>
            ))}
        </View>
        <Pressable style={styles.sheetCancel} accessibilityRole="button" onPress={() => setHelpOpen(false)}>
          <AppText style={styles.sheetCancelText}>Not now</AppText>
        </Pressable>
      </BottomSheet>
    </SafeAreaView>
  );
}

/** Quiet, at the very bottom (a Settings screen comes in a later step) */
function SignOutLink({ onPress }: { onPress: () => void }) {
  return (
    <Pressable style={styles.signOut} onPress={onPress} accessibilityRole="button">
      <AppText style={styles.signOutText}>Sign out</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 24,
    gap: 28,
  },
  top: {
    alignItems: "center",
    gap: 6,
  },
  date: {
    marginTop: 4,
    color: SUBTITLE,
    fontFamily: FigtreeFont.semiBold,
    fontSize: 18,
  },
  heading: {
    color: INK,
    fontFamily: FontFamily.bold,
    fontSize: 38,
    lineHeight: 42,
    letterSpacing: -1,
    textAlign: "center",
  },
  middle: {
    alignItems: "center",
    gap: 20,
  },
  rings: {
    width: OUTER,
    height: OUTER,
    maxWidth: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  outer: {
    position: "absolute",
    width: OUTER,
    height: OUTER,
    borderRadius: OUTER / 2,
    backgroundColor: SUN,
  },
  inner: {
    position: "absolute",
    width: INNER,
    height: INNER,
    borderRadius: INNER / 2,
    backgroundColor: LILAC,
    justifyContent: "center",
    alignItems: "center",
  },
  button: {
    width: BUTTON,
    height: BUTTON,
    borderRadius: BUTTON / 2,
    backgroundColor: PRIMARY,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    shadowColor: PRIMARY,
    shadowOpacity: 0.38,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 16 },
    elevation: 8,
  },
  buttonPressed: {
    transform: [{ scale: 0.93 }],
  },
  buttonDone: {
    backgroundColor: TEAL,
    shadowColor: TEAL,
  },
  buttonText: {
    color: "#fff",
    fontFamily: FontFamily.bold,
    fontSize: 32,
    lineHeight: 36,
  },
  ripple: {
    position: "absolute",
    width: BUTTON,
    height: BUTTON,
    borderRadius: BUTTON / 2,
    borderWidth: 3,
    borderColor: TEAL,
  },
  quietText: {
    color: PRIMARY,
    fontFamily: FontFamily.bold,
    fontSize: 26,
    lineHeight: 30,
    textAlign: "center",
  },
  caption: {
    color: SUBTITLE,
    fontFamily: FigtreeFont.semiBold,
    fontSize: 19,
    lineHeight: 27.5,
    textAlign: "center",
  },
  captionBusy: {
    color: GREEN_TEXT,
    fontFamily: FigtreeFont.bold,
  },
  captionSmall: {
    color: SUBTITLE,
    fontFamily: FigtreeFont.medium,
    fontSize: 16,
    lineHeight: 23,
    textAlign: "center",
  },
  nextPill: {
    paddingVertical: 12,
    paddingLeft: 12,
    paddingRight: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: "#fff",
  },
  nextIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: AMBER_BG,
    justifyContent: "center",
    alignItems: "center",
  },
  nextText: {
    color: INK,
    fontFamily: FigtreeFont.semiBold,
    fontSize: 17,
  },
  problem: {
    color: HELP_TEXT,
    fontFamily: FigtreeFont.semiBold,
    fontSize: 16,
    lineHeight: 23,
    textAlign: "center",
  },
  bottom: {
    marginTop: "auto",
    flexDirection: "row",
    gap: 12,
  },
  callButton: {
    flex: 1,
    height: 64,
    paddingHorizontal: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: "#fff",
  },
  callIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: LILAC,
    justifyContent: "center",
    alignItems: "center",
  },
  callText: {
    flexShrink: 1,
    color: INK,
    fontFamily: FigtreeFont.bold,
    fontSize: 18,
  },
  helpButton: {
    flex: 1,
    height: 64,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
    borderWidth: 2,
    borderColor: HELP_BORDER,
    backgroundColor: HELP_BG,
  },
  helpText: {
    color: HELP_TEXT,
    fontFamily: FigtreeFont.extraBold,
    fontSize: 18,
  },
  signOut: {
    alignSelf: "center",
    minHeight: 44,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  signOutText: {
    color: SUBTITLE,
    fontFamily: FigtreeFont.semiBold,
    fontSize: 15,
    textDecorationLine: "underline",
  },
  helpList: {
    gap: 10,
  },
  helpRow: {
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: "#fff",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: LILAC,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: PRIMARY,
    fontFamily: FigtreeFont.extraBold,
    fontSize: 18,
  },
  helpName: {
    flex: 1,
    color: INK,
    fontFamily: FigtreeFont.extraBold,
    fontSize: 17,
  },
  helpCall: {
    minHeight: 48,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 14,
    backgroundColor: HELP_BORDER,
  },
  helpCallText: {
    color: "#fff",
    fontFamily: FigtreeFont.extraBold,
    fontSize: 16,
  },
  helpMessage: {
    minHeight: 48,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 14,
    backgroundColor: SUN,
  },
  helpMessageText: {
    color: RISE_TEXT,
    fontFamily: FigtreeFont.extraBold,
    fontSize: 16,
  },
  sheetCancel: {
    height: 52,
    justifyContent: "center",
    alignItems: "center",
  },
  sheetCancelText: {
    color: SUBTITLE,
    fontFamily: FigtreeFont.bold,
    fontSize: 17,
  },
  pressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.9,
  },
});
