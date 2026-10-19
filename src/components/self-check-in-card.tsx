import { AppText } from "@/components/app-test";
import { Dot } from "@/components/dot";
import { Rise } from "@/components/rise";
import { FigtreeFont, FontFamily } from "@/constants/fonts";
import { EASE_IN_OUT, useLoop } from "@/hooks/use-entrance";
import { formatTime } from "@/utils/format-time";
import { ActivityIndicator, Animated, Pressable, StyleSheet, View } from "react-native";
import Svg, { Path } from "react-native-svg";

const INK = "#15163A";
const SUBTITLE = "#54566E";
const PRIMARY = "#4338CA";
const MINT = "#DDF3EE";
const GREEN = "#075E4F";
const SUN = "#FFE8DB";
const LILAC = "#E7E4FB";
const AMBER_BG = "#FFF3D1";
const AMBER_TEXT = "#8A5A06";

type Props = {
  /** Minutes after midnight */
  windowEnd: number;
  /** Minutes after midnight when they tapped "I'm okay" today, or null if they haven't yet */
  checkedInMinutes: number | null;
  /** The window has closed and they haven't checked in */
  late: boolean;
  /** Who gets told, e.g. "Maya" (null if nobody is set up) */
  told: string | null;
  /** "Tomorrow", "Today", "Monday"… or null */
  nextLabel: string | null;
  /** Minutes after midnight of the usual check-in time */
  windowStart: number;
  onCheckIn: () => void;
  /** Taking a break (Settings): no check-ins, nobody is told */
  paused?: boolean;
  /** Turns the break off, or opens where they can */
  onOpenSettings?: () => void;
  /** Today hasn't loaded yet: don't show a button that may be wrong */
  loading?: boolean;
};

function CheckMark({ size = 30 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 30 30" fill="none">
      <Path
        d="M7 15.5L12.5 21L23 9.5"
        stroke="#fff"
        strokeWidth={3.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** "Today's check-in": the big I'm okay button, which turns into a thank-you once tapped. */
export function SelfCheckInCard({
  windowEnd,
  checkedInMinutes,
  late,
  told,
  nextLabel,
  windowStart,
  onCheckIn,
  paused = false,
  onOpenSettings,
  loading = false,
}: Props) {
  const done = checkedInMinutes !== null;
  // Checked in counts even on a break day; otherwise the break is what matters
  const onBreak = paused && !done;
  const pulse = useLoop({ duration: 2400, easing: EASE_IN_OUT });
  const ringScale = pulse.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.05, 1],
  });

  const pill = done
    ? { label: "Checked in", bg: MINT, color: GREEN }
    : onBreak
      ? { label: "On a break", bg: LILAC, color: PRIMARY }
      : loading
        ? { label: "Checking…", bg: LILAC, color: SUBTITLE }
        : late
      ? { label: "Running late", bg: SUN, color: "#8A3A12" }
      : { label: "Not yet", bg: AMBER_BG, color: AMBER_TEXT };

  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <AppText style={styles.title}>Today&apos;s check-in</AppText>
        <View style={[styles.pill, { backgroundColor: pill.bg }]}>
          <AppText style={[styles.pillText, { color: pill.color }]}>
            {pill.label}
          </AppText>
        </View>
      </View>

      {checkedInMinutes !== null ? (
        <Rise duration={450} style={styles.center}>
          <Dot size={150} pose="cheer" label={null} />
          <AppText style={styles.doneTitle} accessibilityRole="alert">
            Thank you, you&apos;re checked in
          </AppText>
          <AppText style={styles.doneLine}>
            {told ? `${told} knows` : "Everyone knows"} you&apos;re okay.
            {"\n"}You checked in at {formatTime(checkedInMinutes)}.
          </AppText>
          {paused ? (
            <View style={styles.nextRow}>
              <AppText style={styles.nextLabel}>You&apos;re taking a break</AppText>
              <AppText style={styles.nextValue}>No check-ins until you turn it off</AppText>
            </View>
          ) : nextLabel && (
            <View style={styles.nextRow}>
              <AppText style={styles.nextLabel}>Next check-in</AppText>
              <AppText style={styles.nextValue}>
                {nextLabel}, around {formatTime(windowStart)}
              </AppText>
            </View>
          )}
        </Rise>
      ) : onBreak ? (
        <View style={styles.center}>
          <View style={styles.breakIcon}>
            <Svg width={44} height={44} viewBox="0 0 20 20" fill="none">
              <Path
                d="M7.5 5.5V14.5M12.5 5.5V14.5"
                stroke={PRIMARY}
                strokeWidth={2.4}
                strokeLinecap="round"
              />
            </Svg>
          </View>
          <AppText style={styles.doneTitle} accessibilityRole="header">
            You&apos;re taking a break
          </AppText>
          <AppText style={styles.doneLine}>
            We won&apos;t ask you to check in, and nobody will be told.
          </AppText>
          {onOpenSettings && (
            <Pressable
              onPress={onOpenSettings}
              accessibilityRole="button"
              accessibilityLabel="Turn off the break in Settings"
              style={({ pressed }) => [styles.breakButton, pressed && styles.pressed]}
            >
              <AppText style={styles.breakButtonText}>Turn off in Settings</AppText>
            </Pressable>
          )}
        </View>
      ) : loading ? (
        <View style={[styles.center, styles.loading]} accessibilityLabel="Checking today's check-in">
          <ActivityIndicator size="large" color={PRIMARY} />
          <AppText style={styles.tapBy}>Checking today…</AppText>
        </View>
      ) : (
        <View style={styles.center}>
          <Animated.View style={[styles.outerRing, { transform: [{ scale: ringScale }] }]}>
            <View style={styles.innerRing}>
              <Pressable
                onPress={onCheckIn}
                accessibilityRole="button"
                accessibilityLabel="I'm okay"
                accessibilityHint="Lets the people on your list know you're okay"
                style={({ pressed }) => [styles.button, pressed && styles.pressed]}
              >
                <CheckMark />
                <AppText style={styles.buttonText}>I&apos;m okay</AppText>
              </Pressable>
            </View>
          </Animated.View>
          <AppText style={styles.tapBy}>Tap by {formatTime(windowEnd)}</AppText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 20,
    borderRadius: 30,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E6E4EF",
    shadowColor: INK,
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  top: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    color: INK,
    fontFamily: FigtreeFont.bold,
    fontSize: 17,
  },
  pill: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 999,
  },
  pillText: {
    fontFamily: FigtreeFont.extraBold,
    fontSize: 14,
  },
  center: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 8,
  },
  breakIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: LILAC,
    justifyContent: "center",
    alignItems: "center",
  },
  breakButton: {
    marginTop: 18,
    minHeight: 52,
    paddingHorizontal: 22,
    borderRadius: 16,
    backgroundColor: LILAC,
    justifyContent: "center",
    alignItems: "center",
  },
  breakButtonText: {
    color: PRIMARY,
    fontFamily: FigtreeFont.extraBold,
    fontSize: 17,
  },
  // About the height of the button and its rings, so nothing jumps when it loads
  loading: {
    height: 244,
    justifyContent: "center",
    gap: 14,
  },
  outerRing: {
    width: 244,
    height: 244,
    borderRadius: 122,
    backgroundColor: SUN,
    justifyContent: "center",
    alignItems: "center",
  },
  innerRing: {
    width: 204,
    height: 204,
    borderRadius: 102,
    backgroundColor: LILAC,
    justifyContent: "center",
    alignItems: "center",
  },
  button: {
    width: 156,
    height: 156,
    borderRadius: 78,
    backgroundColor: PRIMARY,
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    shadowColor: PRIMARY,
    shadowOpacity: 0.4,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  buttonText: {
    color: "#fff",
    fontFamily: FontFamily.bold,
    fontSize: 26,
    lineHeight: 30,
  },
  pressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.92,
  },
  tapBy: {
    marginTop: 18,
    color: SUBTITLE,
    fontFamily: FigtreeFont.semiBold,
    fontSize: 16,
  },
  doneTitle: {
    marginTop: 8,
    color: INK,
    textAlign: "center",
    fontFamily: FontFamily.bold,
    fontSize: 24,
    lineHeight: 28,
  },
  doneLine: {
    marginTop: 8,
    color: SUBTITLE,
    textAlign: "center",
    fontFamily: FigtreeFont.medium,
    fontSize: 16,
    lineHeight: 23,
  },
  nextRow: {
    marginTop: 16,
    alignSelf: "stretch",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: "#F5F4FA",
    gap: 2,
  },
  nextLabel: {
    color: SUBTITLE,
    fontFamily: FigtreeFont.semiBold,
    fontSize: 14,
  },
  nextValue: {
    color: INK,
    fontFamily: FigtreeFont.extraBold,
    fontSize: 17,
  },
});
