import { AppText } from "@/components/app-test";
import { InviteHero } from "@/components/invite-hero";
import { Rise } from "@/components/rise";
import { FigtreeFont, FontFamily } from "@/constants/fonts";
import type { InviteStatus } from "@/hooks/use-invite";
import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Path } from "react-native-svg";

const INK = "#15163A";
const SUBTITLE = "#54566E";
const PRIMARY = "#4338CA";
const BACKGROUND = "#F5F4FA";
const BORDER = "#E6E4EF";
const SURFACE = "#DCD9E8";
const SUN = "#FFE8DB";
const ORANGE = "#C2551F";
const SUN_TEXT = "#6B3A1D";
const GREEN = "#0B7A66";
const PILL_WAIT_BG = "#FFF3D1";
const PILL_WAIT_TEXT = "#7A4E05";
const AMBER = "#D98E0B";

type Props = {
  status: Exclude<InviteStatus, "joined">;
  /** The person's first name, e.g. "Lin" */
  name: string;
  /** Their phone, formatted for reading */
  phone: string;
  /** The full text they receive, for "What Lin sees" (null: not known here) */
  preview: string | null;
  sentAt: Date | null;
  offline: boolean;
  leftInitial?: string;
  rightInitial?: string;
  onRetry: () => void;
  onDashboard: () => void;
  /** Free mode: Mira isn't texting yet, so the caregiver sends the invite */
  freeMode?: boolean;
  onOpenMessages?: () => void;
  onConfirm?: () => void;
  confirming?: boolean;
  confirmFailed?: null | "offline" | "failed";
};

/** "Invite sent, waiting for YES" (Mira Redesign canvas) */
export function InviteWaiting({
  status,
  name,
  phone,
  preview,
  sentAt,
  offline,
  leftInitial,
  rightInitial,
  onRetry,
  onDashboard,
  freeMode = false,
  onOpenMessages,
  onConfirm,
  confirming = false,
  confirmFailed = null,
}: Props) {
  const [opened, setOpened] = useState(false);
  const sending = status === "sending";
  const waiting = status === "waiting";
  const failed = status === "failed" || status === "tooMany";
  const who = name || "them";
  const time = sentAt?.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) ?? "";

  // Free mode: the invite goes from the caregiver's phone, and the YES comes back to them
  const manual = freeMode && waiting;
  const replied = name ? `${name} replied YES` : "They replied YES";
  const heading = failed
    ? "The invite didn't go out"
    : sending
      ? `Sending the invite to ${who}`
      : manual
        ? `Text ${who} the invite`
        : `Invite sent to ${who}`;
  const intro = failed
    ? `${name ? `${name}'s` : "Their"} settings are saved. Only the text to ${phone} is missing.`
    : manual
      ? `Send this invite from your phone to ${phone}. When ${who} texts you back YES, tap “${replied}”.`
      : `We texted ${phone}. As soon as ${who} replies YES, you're connected and daily check-ins start.`;
  const openMessages = () => {
    setOpened(true);
    onOpenMessages?.();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.pillRow}>
          <View style={[styles.pill, failed && styles.pillFailed]} accessibilityRole="text">
            <View style={[styles.pillDot, { backgroundColor: failed ? ORANGE : AMBER }]} />
            <AppText style={[styles.pillText, failed && styles.pillTextFailed]}>
              {failed
                ? "Invite not sent"
                : sending
                  ? "Sending the invite"
                  : manual
                    ? "Send it from your phone"
                    : "Waiting for a reply"}
            </AppText>
          </View>
        </View>

        <InviteHero
          leftInitial={leftInitial}
          rightInitial={rightInitial}
          moving={!failed}
          failed={failed}
        />

        <Rise delay={500}>
          <View style={styles.header} accessibilityLiveRegion="polite">
            <AppText style={styles.title} accessibilityRole="header">
              {heading}
            </AppText>
            <AppText style={styles.intro}>{intro}</AppText>
          </View>
        </Rise>

        {failed && (
          <View style={styles.problem} accessibilityRole="alert">
            <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
              <Circle cx={12} cy={12} r={10} stroke={ORANGE} strokeWidth={2.2} />
              <Path d="M12 7.5v5.5M12 16.5v.5" stroke={ORANGE} strokeWidth={2.2} strokeLinecap="round" />
            </Svg>
            <View style={styles.problemText}>
              <AppText style={styles.problemTitle}>
                {status === "tooMany"
                  ? `That's 3 invites to ${who} today`
                  : "We couldn't send the text"}
              </AppText>
              <AppText style={styles.problemBody}>
                {status === "tooMany"
                  ? `To protect ${who} from too many texts, you can send another invite tomorrow.`
                  : offline
                    ? "Check that you're online, then try again."
                    : "Please try again in a few minutes."}
              </AppText>
            </View>
          </View>
        )}

        <Rise delay={650}>
          <View style={styles.card}>
            <View style={styles.step}>
              {sending ? (
                <ActivityIndicator color={PRIMARY} style={styles.stepIcon} />
              ) : manual && !opened ? (
                <Svg width={24} height={24} viewBox="0 0 24 24">
                  <Circle cx={12} cy={12} r={10} fill="#FFFFFF" stroke={PRIMARY} strokeWidth={2} />
                  <Circle cx={12} cy={12} r={4} fill={PRIMARY} />
                </Svg>
              ) : failed ? (
                <Svg width={24} height={24} viewBox="0 0 24 24">
                  <Circle cx={12} cy={12} r={11} fill={ORANGE} />
                  <Path d="M12 7v6M12 16.5v.5" stroke="#FFFFFF" strokeWidth={2.4} strokeLinecap="round" />
                </Svg>
              ) : (
                <Svg width={24} height={24} viewBox="0 0 24 24">
                  <Circle cx={12} cy={12} r={11} fill={GREEN} />
                  <Path d="M7.5 12.5l3 3 6-6" fill="none" stroke="#FFFFFF" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
              )}
              <AppText style={styles.stepLabel}>
                {failed
                  ? "Invite not sent yet"
                  : sending
                    ? "Sending the invite…"
                    : manual
                      ? `Text the invite to ${who}`
                      : `Invite texted to ${who}`}
              </AppText>
              {manual ? (
                <Pressable
                  style={({ pressed }) => [styles.smallButton, pressed && styles.pressed]}
                  onPress={openMessages}
                  accessibilityRole="button"
                  accessibilityLabel={`Open Messages to text ${who}`}
                  hitSlop={6}
                >
                  <AppText style={styles.smallButtonText}>
                    {opened ? "Open again" : "Open Messages"}
                  </AppText>
                </Pressable>
              ) : (
                <AppText style={styles.stepTime}>{waiting ? time : ""}</AppText>
              )}
            </View>
            <View style={styles.step}>
              {waiting && (!manual || opened) ? (
                <Svg width={24} height={24} viewBox="0 0 24 24">
                  <Circle cx={12} cy={12} r={10} fill="#FFFFFF" stroke={PRIMARY} strokeWidth={2} />
                  <Circle cx={12} cy={12} r={4} fill={PRIMARY} />
                </Svg>
              ) : (
                <DashedCircle />
              )}
              <AppText style={styles.stepLabel}>
                {name || "They"} replies YES{manual ? " to you" : ""}
              </AppText>
              <AppText style={styles.stepTime}>{waiting && !manual ? "Waiting" : ""}</AppText>
            </View>
            <View style={styles.step}>
              <DashedCircle />
              <AppText style={[styles.stepLabel, styles.stepLabelMuted]}>Daily check-ins start</AppText>
              <AppText style={styles.stepTime}>After YES</AppText>
            </View>

            {preview && (
              <View style={styles.preview}>
                <AppText style={styles.previewLabel}>
                  {manual ? `Your text to ${who}` : `What ${name || "they"} sees`}
                </AppText>
                <View style={styles.bubble}>
                  <AppText style={styles.bubbleText}>{preview}</AppText>
                </View>
              </View>
            )}
          </View>
        </Rise>

        <View style={styles.footer}>
          {manual && confirmFailed && (
            <AppText style={styles.confirmProblem} accessibilityRole="alert">
              {confirmFailed === "offline"
                ? "We couldn't reach Mira. Check that you're online, then try again."
                : "We couldn't confirm that. Please try again in a moment."}
            </AppText>
          )}
          {manual && (
            <Pressable
              style={({ pressed }) => [styles.button, confirming && styles.buttonBusy, pressed && styles.pressed]}
              onPress={onConfirm}
              disabled={confirming}
              accessibilityRole="button"
              accessibilityState={{ busy: confirming, disabled: confirming }}
            >
              {confirming && <ActivityIndicator color="#FFFFFF" />}
              <AppText style={styles.buttonText}>{replied}</AppText>
            </Pressable>
          )}
          {status === "failed" && (
            <Pressable
              style={({ pressed }) => [styles.button, pressed && styles.pressed]}
              onPress={onRetry}
              accessibilityRole="button"
            >
              <AppText style={styles.buttonText}>Try again</AppText>
            </Pressable>
          )}
          <Pressable
            style={({ pressed }) => [
              styles.button,
              (status === "failed" || manual) && styles.buttonSecondary,
              pressed && styles.pressed,
            ]}
            onPress={onDashboard}
            accessibilityRole="button"
          >
            <AppText
              style={[
                styles.buttonText,
                (status === "failed" || manual) && styles.buttonTextSecondary,
              ]}
            >
              Go to my dashboard
            </AppText>
          </Pressable>
          {waiting && (
            <AppText style={styles.leaveNote}>
              {manual
                ? "Mira's own texting isn't on yet, so the invite comes from your phone."
                : `You can leave this screen. We'll show it on your dashboard when ${who} replies.`}
            </AppText>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function DashedCircle() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={10} fill="#FFFFFF" stroke="#CFCBE3" strokeWidth={2} strokeDasharray="3 3" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    backgroundColor: BACKGROUND,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    gap: 22,
    paddingTop: 32,
    paddingBottom: 24,
  },
  pillRow: {
    alignItems: "center",
  },
  pill: {
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: PILL_WAIT_BG,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pillFailed: {
    backgroundColor: SUN,
  },
  pillDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  pillText: {
    color: PILL_WAIT_TEXT,
    fontFamily: FigtreeFont.extraBold,
    fontSize: 14,
  },
  pillTextFailed: {
    color: "#8A3A12",
  },
  header: {
    gap: 10,
  },
  title: {
    color: INK,
    fontFamily: FontFamily.bold,
    fontSize: 32,
    lineHeight: 35.2,
    letterSpacing: -0.7,
    textAlign: "center",
  },
  intro: {
    color: SUBTITLE,
    fontFamily: FigtreeFont.medium,
    fontSize: 17,
    lineHeight: 25.5,
    textAlign: "center",
  },
  problem: {
    padding: 16,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: SUN,
    flexDirection: "row",
    gap: 12,
  },
  problemText: {
    flex: 1,
    gap: 4,
  },
  problemTitle: {
    color: INK,
    fontFamily: FigtreeFont.extraBold,
    fontSize: 17,
    lineHeight: 22,
  },
  problemBody: {
    color: SUN_TEXT,
    fontFamily: FigtreeFont.medium,
    fontSize: 16,
    lineHeight: 23,
  },
  card: {
    padding: 16,
    paddingHorizontal: 18,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: BORDER,
    gap: 14,
  },
  step: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  stepIcon: {
    width: 24,
    height: 24,
  },
  stepLabel: {
    flex: 1,
    color: INK,
    fontFamily: FigtreeFont.bold,
    fontSize: 16,
  },
  stepLabelMuted: {
    color: SUBTITLE,
    fontFamily: FigtreeFont.semiBold,
  },
  stepTime: {
    color: SUBTITLE,
    fontFamily: FigtreeFont.semiBold,
    fontSize: 15,
  },
  preview: {
    borderTopWidth: 1,
    borderTopColor: "#EFEDF5",
    paddingTop: 14,
    gap: 8,
  },
  previewLabel: {
    color: SUBTITLE,
    fontFamily: FigtreeFont.bold,
    fontSize: 14,
  },
  bubble: {
    alignSelf: "flex-start",
    maxWidth: "92%",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderBottomLeftRadius: 6,
    backgroundColor: "#EFEDF5",
  },
  bubbleText: {
    color: INK,
    fontFamily: FigtreeFont.medium,
    fontSize: 15,
    lineHeight: 21.75,
  },
  footer: {
    marginTop: "auto",
    gap: 10,
  },
  button: {
    height: 60,
    borderRadius: 18,
    backgroundColor: PRIMARY,
    flexDirection: "row",
    gap: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonBusy: {
    opacity: 0.75,
  },
  smallButton: {
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: PRIMARY,
    justifyContent: "center",
  },
  smallButtonText: {
    color: "#FFFFFF",
    fontFamily: FigtreeFont.bold,
    fontSize: 15,
  },
  confirmProblem: {
    color: "#8C1D18",
    fontFamily: FigtreeFont.semiBold,
    fontSize: 16,
    lineHeight: 23,
    textAlign: "center",
  },
  buttonSecondary: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: SURFACE,
  },
  buttonText: {
    color: "#FFFFFF",
    fontFamily: FigtreeFont.bold,
    fontSize: 19,
    lineHeight: 22.8,
  },
  buttonTextSecondary: {
    color: INK,
  },
  leaveNote: {
    color: SUBTITLE,
    fontFamily: FigtreeFont.medium,
    fontSize: 15,
    lineHeight: 21.75,
    textAlign: "center",
  },
  pressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.9,
  },
});
