import { AppText } from "@/components/app-test";
import { BackButton } from "@/components/back-button";
import { FigtreeFont, FontFamily } from "@/constants/fonts";
import { AuthProblem, sendCode } from "@/lib/auth";
import { toE164 } from "@/utils/phone";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Path, Rect } from "react-native-svg";

const INK = "#15163A";
const SUBTITLE = "#54566E";
const PRIMARY = "#4338CA";
const BACKGROUND = "#F5F4FA";
const BORDER = "#E6E4EF";
const SURFACE = "#DCD9E8";
const SUN = "#FFE8DB";
const ORANGE = "#C2551F";
const SUN_TEXT = "#6B3A1D";
const MUTED = "#8B8DA3";

type Problem = AuthProblem | "badNumber";

const MESSAGES: Record<Problem, { title: string; body: string }> = {
  noAccount: {
    title: "We don't have an account for this number",
    body: "Check the number, or set up Mira as someone new.",
  },
  badNumber: {
    title: "That number looks too short",
    body: "Enter all 10 digits, like (317) 555-0123.",
  },
  offline: {
    title: "We couldn't reach Mira",
    body: "Check that you're online, then try again.",
  },
  tooSoon: {
    title: "Just a moment",
    body: "We just sent a code. Wait a minute, then try again.",
  },
  notSent: {
    title: "We couldn't send a text right now",
    body: "Please try again in a few minutes.",
  },
  wrongCode: { title: "Something went wrong", body: "Please try again." },
  expired: { title: "Something went wrong", body: "Please try again." },
  unknown: { title: "Something went wrong", body: "Please try again." },
};

/** The words that differ between "Welcome back" and "Someone invited me" */
const WORDS = {
  signIn: {
    title: "Welcome back",
    body: "Enter the phone number you used to set up Mira. We'll text you a 6-digit code.",
    note: "This is also the number we'll alert if someone misses a check-in.",
  },
  invited: {
    title: "Someone invited you?",
    body: "Enter the phone number your family or friend set up Mira with. We'll text you a 6-digit code.",
    note: "Signing in with this number tells the people who invited you that you've joined.",
  },
};

/**
 * Enter your phone number, then get a code.
 * - signIn: "I already have an account" (never creates an account)
 * - invited: "Someone invited me" (creates Lin's account the first time;
 *   signing in with the invited number is her YES)
 */
export function PhoneSignIn({ mode }: { mode: "signIn" | "invited" }) {
  const words = WORDS[mode];
  const [phone, setPhone] = useState("");
  const [sending, setSending] = useState(false);
  const [problem, setProblem] = useState<Problem | null>(null);

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/");
  };

  const textMeACode = async () => {
    const e164 = toE164(phone);
    if (!e164) {
      setProblem("badNumber");
      return;
    }
    setProblem(null);
    setSending(true);
    const result = await sendCode(e164, { createAccount: mode === "invited" });
    setSending(false);
    if (result) {
      setProblem(result);
      return;
    }
    router.push({
      pathname: "/verifyCode",
      params: { phone: e164, context: mode, sentAt: String(Date.now()) },
    });
  };

  const message = problem ? MESSAGES[problem] : null;
  const highlightField = problem === "noAccount" || problem === "badNumber";

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        <View style={styles.header}>
          <BackButton onPress={goBack} />
        </View>

        <View style={styles.callout}>
          <AppText style={styles.title} accessibilityRole="header">
            {words.title}
          </AppText>
          <AppText style={styles.body}>{words.body}</AppText>
        </View>

        <View style={styles.field}>
          <AppText style={styles.label}>Your phone number</AppText>
          <View
            style={[styles.inputRow, highlightField && styles.inputRowProblem]}
          >
            <View style={styles.countryCode}>
              <AppText style={styles.countryCodeText}>US +1</AppText>
            </View>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={(text) => {
                setPhone(text);
                setProblem(null);
              }}
              onSubmitEditing={textMeACode}
              placeholder="(555) 123-4567"
              placeholderTextColor={MUTED}
              accessibilityLabel="Your phone number"
              keyboardType="phone-pad"
              autoComplete="tel"
              textContentType="telephoneNumber"
              returnKeyType="send"
              autoFocus
            />
          </View>
        </View>

        {message && (
          <View
            style={[
              styles.problem,
              problem === "noAccount" ? styles.problemSun : styles.problemPlain,
            ]}
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
          >
            <View style={styles.problemRow}>
              <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                <Circle
                  cx={12}
                  cy={12}
                  r={10}
                  stroke={problem === "noAccount" ? ORANGE : SUBTITLE}
                  strokeWidth={2.2}
                />
                <Path
                  d="M12 7.5v5.5M12 16.5v.5"
                  stroke={problem === "noAccount" ? ORANGE : SUBTITLE}
                  strokeWidth={2.2}
                  strokeLinecap="round"
                />
              </Svg>
              <View style={styles.problemText}>
                <AppText style={styles.problemTitle}>{message.title}</AppText>
                <AppText
                  style={[
                    styles.problemBody,
                    problem === "noAccount" && { color: SUN_TEXT },
                  ]}
                >
                  {message.body}
                </AppText>
              </View>
            </View>
            {problem === "noAccount" && (
              <>
                <Pressable
                  style={({ pressed }) => [
                    styles.problemButton,
                    pressed && styles.pressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Get started instead"
                  onPress={() => router.replace("/whoUsesMira")}
                >
                  <AppText style={styles.problemButtonText}>
                    Get started instead
                  </AppText>
                </Pressable>
                {/* Lin's first time: she has no account yet, just an invite */}
                <Pressable
                  style={({ pressed }) => [
                    styles.problemButton,
                    pressed && styles.pressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Someone invited me"
                  onPress={() => router.replace("/invited")}
                >
                  <AppText style={styles.problemButtonText}>
                    Someone invited me
                  </AppText>
                </Pressable>
              </>
            )}
          </View>
        )}

        <View style={styles.footer}>
          <View style={styles.note}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Rect
                x={5}
                y={10.5}
                width={14}
                height={10}
                rx={2.5}
                stroke={SUBTITLE}
                strokeWidth={2}
              />
              <Path
                d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"
                stroke={SUBTITLE}
                strokeWidth={2}
                strokeLinecap="round"
              />
            </Svg>
            <AppText style={styles.noteText}>{words.note}</AppText>
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.button,
              sending && styles.buttonBusy,
              pressed && styles.pressed,
            ]}
            onPress={textMeACode}
            disabled={sending}
            accessibilityRole="button"
            accessibilityLabel={sending ? "Sending your code" : "Text me a code"}
            accessibilityState={{ busy: sending, disabled: sending }}
          >
            {sending && <ActivityIndicator color="#fff" />}
            <AppText style={styles.buttonText}>
              {sending ? "Sending your code…" : "Text me a code"}
            </AppText>
          </Pressable>
          <Pressable
            style={styles.linkButton}
            accessibilityRole="link"
            accessibilityLabel="New to Mira? Get started"
            onPress={() => router.replace("/whoUsesMira")}
          >
            <AppText style={styles.linkText}>New to Mira? Get started</AppText>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: BACKGROUND,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    gap: 26,
  },
  header: {
    marginTop: 36,
    flexDirection: "row",
  },
  callout: {
    gap: 12,
  },
  title: {
    color: INK,
    fontFamily: FontFamily.bold,
    fontSize: 32,
    lineHeight: 35.2,
    letterSpacing: -0.7,
  },
  body: {
    color: SUBTITLE,
    fontFamily: FigtreeFont.medium,
    fontSize: 18,
    lineHeight: 27,
  },
  field: {
    gap: 8,
  },
  label: {
    color: INK,
    fontFamily: FigtreeFont.bold,
    fontSize: 17,
    lineHeight: 22.1,
  },
  inputRow: {
    height: 56,
    flexDirection: "row",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: SURFACE,
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  // Thicker orange border; 1px less inside so the field doesn't jump
  inputRowProblem: {
    borderWidth: 2,
    borderColor: ORANGE,
  },
  countryCode: {
    paddingHorizontal: 14,
    justifyContent: "center",
    backgroundColor: "#FAF9FD",
    borderRightWidth: 1,
    borderRightColor: BORDER,
  },
  countryCodeText: {
    color: INK,
    fontFamily: FigtreeFont.bold,
    fontSize: 18,
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    color: INK,
    fontFamily: FigtreeFont.bold,
    fontSize: 20,
  },
  problem: {
    padding: 16,
    paddingHorizontal: 18,
    borderRadius: 20,
    gap: 12,
  },
  problemSun: {
    backgroundColor: SUN,
  },
  problemPlain: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: BORDER,
  },
  problemRow: {
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
    color: SUBTITLE,
    fontFamily: FigtreeFont.medium,
    fontSize: 16,
    lineHeight: 23,
  },
  problemButton: {
    height: 48,
    borderRadius: 14,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  problemButtonText: {
    color: ORANGE,
    fontFamily: FigtreeFont.extraBold,
    fontSize: 17,
  },
  footer: {
    marginTop: "auto",
    gap: 16,
  },
  note: {
    flexDirection: "row",
    gap: 10,
  },
  noteText: {
    flex: 1,
    color: SUBTITLE,
    fontFamily: FigtreeFont.medium,
    fontSize: 15,
    lineHeight: 21.75,
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
  buttonText: {
    color: "#fff",
    fontFamily: FigtreeFont.bold,
    fontSize: 19,
    lineHeight: 22.8,
  },
  linkButton: {
    alignSelf: "center",
    minHeight: 44,
    padding: 10,
    justifyContent: "center",
  },
  linkText: {
    color: INK,
    fontFamily: FigtreeFont.semiBold,
    fontSize: 17,
    textDecorationLine: "underline",
  },
  pressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.9,
  },
});
