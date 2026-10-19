import { AppText } from "@/components/app-test";
import { BackButton } from "@/components/back-button";
import { FigtreeFont, FontFamily } from "@/constants/fonts";
import { useAuth } from "@/context/auth";
import { useCaregiverSetup } from "@/context/caregiver-setup";
import { useReduceMotion } from "@/hooks/use-entrance";
import {
  AuthProblem,
  checkCode,
  RESEND_AFTER_MS,
  sendCode,
} from "@/lib/auth";
import { formatPhone } from "@/utils/phone";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
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
const SURFACE = "#DCD9E8";
const SUN = "#FFE8DB";
const ORANGE = "#C2551F";
const SUN_TEXT = "#6B3A1D";
const RED = "#B3261E";
const RED_TEXT = "#8C1D18";
const RED_BG = "#FDECEC";
const DISABLED_BG = "#D9D6EA";
const FADED = "#8E8FA3";

const CODE_LENGTH = 6;

/** Problems shown as one plain line under the code boxes */
const LINES: Partial<Record<AuthProblem, string>> = {
  wrongCode: "That code didn't match. Check the text from Mira and try again.",
  offline: "We couldn't reach Mira. Check that you're online, then try again.",
  tooSoon: "We just sent a code. Wait a minute before asking for another.",
  notSent: "We couldn't send a text right now. Please try again in a few minutes.",
  noAccount: "We don't have an account for this number.",
  unknown: "Something went wrong. Please try again.",
};

type Params = {
  phone: string; // E.164
  context?: "signIn" | "setup" | "self";
  sentAt?: string; // set when the previous screen already sent the code
};

/**
 * Enter the 6-digit code.
 * - signIn: after "Welcome back" (the code is already sent)
 * - setup: at the end of Setup step 3 (this screen sends the code)
 * - self: at the end of the "I'm checking in" setup (this screen sends the code)
 */
export default function VerifyCode() {
  const params = useLocalSearchParams<Params>();
  const phone = params.phone;
  const selfSetup = params.context === "self";
  /** Either setup: this creates the account and saves what was typed */
  const inSetup = params.context === "setup" || selfSetup;
  const { session } = useAuth();
  const {
    syncStatus,
    retry,
    prepareSetupSave,
    cancelSetupSave,
    setupRefused,
    isSelf,
  } = useCaregiverSetup();
  const reduceMotion = useReduceMotion();

  const [code, setCode] = useState("");
  const [sentAt, setSentAt] = useState<number | null>(
    params.sentAt ? Number(params.sentAt) : null,
  );
  const [sending, setSending] = useState(!params.sentAt);
  const [checking, setChecking] = useState(false);
  const [verified, setVerified] = useState(false);
  const [problem, setProblem] = useState<AuthProblem | null>(null);
  /** The setup was refused and they chose to open the account they already have */
  const [openedExisting, setOpenedExisting] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [shake] = useState(() => new Animated.Value(0));
  const inputRef = useRef<TextInput>(null);
  const sentOnMount = useRef(false);

  const send = async () => {
    setSending(true);
    setProblem(null);
    setCode("");
    // Setup creates the caregiver's account; sign-in never does
    const result = await sendCode(phone, { createAccount: inSetup });
    setSending(false);
    if (result) setProblem(result);
    else setSentAt(Date.now());
  };

  // Setup arrives without a code sent yet. The ref stops React's dev-mode
  // double run from texting twice.
  useEffect(() => {
    if (params.sentAt || sentOnMount.current) return;
    sentOnMount.current = true;
    (async () => {
      const result = await sendCode(phone, { createAccount: true });
      setSending(false);
      if (result) setProblem(result);
      else setSentAt(Date.now());
    })();
  }, [params.sentAt, phone]);

  // Ticks once a second for the "new code in 0:42" countdown
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Move on once signed in AND the setup is saved/loaded. (Sign-in still goes
  // to Home if loading failed: Home shows a "Try again" banner.)
  const savedSetup = inSetup && !openedExisting;
  const dataDone =
    syncStatus === "ready" || (!savedSetup && syncStatus === "failed");
  useEffect(() => {
    if (!verified || !session || !dataDone) return;
    // Where to go depends on the account (a self account has its own Home)
    if (isSelf) router.replace(savedSetup ? "/selfSetup5" : "/selfHome");
    else router.replace(savedSetup ? "/connected" : "/caregiverHome");
  }, [verified, session, dataDone, savedSetup, isSelf]);
  const setupSaveFailed = verified && savedSetup && syncStatus === "failed";
  const openExisting = () => {
    setOpenedExisting(true);
    retry(); // loads the account as it is, without the setup
  };

  const playShake = () => {
    if (reduceMotion) return;
    shake.setValue(0);
    Animated.sequence(
      [-8, 7, -5, 3, 0].map((toValue) =>
        Animated.timing(shake, { toValue, duration: 70, useNativeDriver: true }),
      ),
    ).start();
  };

  const submit = async (value: string) => {
    if (!sentAt || value.length !== CODE_LENGTH || checking) return;
    setChecking(true);
    setProblem(null);
    // Setup: once this code signs them in, save what they typed in steps 1–3
    if (inSetup) prepareSetupSave({ isSelf: selfSetup });
    setOpenedExisting(false);
    const result = await checkCode(phone, value, sentAt);
    if (result) {
      cancelSetupSave();
      setChecking(false);
      setProblem(result);
      if (result === "wrongCode") playShake();
      return;
    }
    setVerified(true); // the effect above navigates once the session arrives
  };

  const onChangeCode = (text: string) => {
    const digits = text.replace(/\D/g, "").slice(0, CODE_LENGTH);
    setCode(digits);
    if (problem === "wrongCode") setProblem(null);
    if (digits.length === CODE_LENGTH) submit(digits);
  };

  const secondsLeft = sentAt
    ? Math.max(0, Math.ceil((sentAt + RESEND_AFTER_MS - now) / 1000))
    : 0;
  const busy = (checking || verified) && !setupSaveFailed;
  const canResend =
    !sending && !busy && (secondsLeft === 0 || problem === "expired");
  const wrong = problem === "wrongCode";
  const expired = problem === "expired";
  const canSubmit = code.length === CODE_LENGTH && !!sentAt && !busy;
  const line = problem ? LINES[problem] : undefined;

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace(selfSetup ? "/selfSetup4" : inSetup ? "/caregiverSetup3" : "/signIn");
  };
  const changeNumber = () => {
    if (selfSetup) router.navigate("/selfSetup1");
    else if (inSetup) router.navigate("/caregiverSetup1");
    else goBack();
  };

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
            {selfSetup
              ? "Confirm your number to start Mira"
              : inSetup
                ? "Confirm your number to send the invite"
                : "Enter the code we texted you"}
          </AppText>
          <AppText style={styles.body}>
            {inSetup
              ? "So we know this phone is yours, we texted a code to "
              : "We sent it to "}
            <AppText style={styles.bodyStrong}>{formatPhone(phone)}</AppText>.{" "}
            <AppText
              style={styles.bodyLink}
              onPress={changeNumber}
              accessibilityRole="link"
            >
              Wrong number?
            </AppText>
          </AppText>
        </View>

        <View style={styles.field}>
          <AppText style={styles.label}>6-digit code</AppText>
          <Pressable
            onPress={() => inputRef.current?.focus()}
            accessible={false}
          >
            <Animated.View
              style={[styles.boxes, { transform: [{ translateX: shake }] }]}
            >
              {Array.from({ length: CODE_LENGTH }, (_, i) => {
                const digit = code[i] ?? "";
                const active = i === code.length && !busy && !wrong;
                return (
                  <View
                    key={i}
                    style={[
                      styles.box,
                      active && styles.boxActive,
                      wrong && styles.boxWrong,
                      expired && styles.boxExpired,
                    ]}
                  >
                    <AppText
                      style={[
                        styles.digit,
                        wrong && { color: RED_TEXT },
                        expired && { color: FADED },
                      ]}
                    >
                      {digit}
                    </AppText>
                  </View>
                );
              })}
            </Animated.View>
            {/* One real (invisible) field on top of the boxes: lets the phone
                fill in the code from the text, and lets screen readers read it */}
            <TextInput
              ref={inputRef}
              style={styles.hiddenInput}
              value={code}
              onChangeText={onChangeCode}
              keyboardType="number-pad"
              textContentType="oneTimeCode"
              autoComplete="sms-otp"
              maxLength={CODE_LENGTH}
              accessibilityLabel="6-digit code"
              caretHidden
              autoFocus
              editable={!busy}
            />
          </Pressable>
        </View>

        {sending && (
          <View style={styles.statusRow} accessibilityRole="text">
            <ActivityIndicator color={PRIMARY} />
            <AppText style={styles.statusText}>Sending your code…</AppText>
          </View>
        )}
        {busy && (
          <View style={styles.statusRow} accessibilityRole="text">
            <ActivityIndicator color={PRIMARY} />
            <AppText style={styles.statusText}>
              {!verified
                ? "Checking your code…"
                : savedSetup
                  ? "Saving your setup…"
                  : "Loading your account…"}
            </AppText>
          </View>
        )}

        {setupSaveFailed && (
          <View
            style={styles.problemRow}
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
          >
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
              <Circle cx={12} cy={12} r={10} stroke={RED} strokeWidth={2.2} />
              <Path
                d="M12 7.5v5.5M12 16.5v.5"
                stroke={RED}
                strokeWidth={2.2}
                strokeLinecap="round"
              />
            </Svg>
            <AppText style={styles.problemText}>
              {setupRefused
                ? selfSetup
                  ? "This number already has a Mira account for looking after someone, so we didn't change it. Open it, or go back and use a different number."
                  : "This number already has a Mira account for checking in yourself, so we didn't change it. Open it, or go back and use a different number."
                : "Your number is confirmed, but we couldn't save your setup. Check that you're online, then try again."}
            </AppText>
          </View>
        )}

        {expired && (
          <View
            style={styles.expiredCard}
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
          >
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
              <Circle cx={12} cy={13} r={8} stroke={ORANGE} strokeWidth={2.2} />
              <Path
                d="M12 9v4l2.5 2M9.5 2.5h5"
                stroke={ORANGE}
                strokeWidth={2.2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
            <AppText style={styles.expiredText}>
              This code has expired. Send yourself a new one below.
            </AppText>
          </View>
        )}

        {line && (
          <View
            style={styles.problemRow}
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
          >
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
              <Circle cx={12} cy={12} r={10} stroke={RED} strokeWidth={2.2} />
              <Path
                d="M12 7.5v5.5M12 16.5v.5"
                stroke={RED}
                strokeWidth={2.2}
                strokeLinecap="round"
              />
            </Svg>
            <AppText style={styles.problemText}>{line}</AppText>
          </View>
        )}

        {canResend ? (
          <Pressable
            style={({ pressed }) => [styles.resend, pressed && styles.pressed]}
            onPress={send}
            accessibilityRole="button"
            accessibilityLabel="Send a new code"
          >
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Path
                d="M20 11a8 8 0 1 0-2.3 5.7M20 5v6h-6"
                stroke={PRIMARY}
                strokeWidth={2.2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
            <AppText style={styles.resendText}>Send a new code</AppText>
          </Pressable>
        ) : (
          sentAt !== null &&
          !busy && (
            <AppText style={styles.waitText}>
              Didn&apos;t get it? You can ask for a new code in{" "}
              <AppText style={styles.waitTime}>
                {`${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, "0")}`}
              </AppText>
              .
            </AppText>
          )
        )}

        <View style={styles.footer}>
          {inSetup && (
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
              <AppText style={styles.noteText}>
                This keeps check-ins private to you. Next time, sign in with
                this same number.
              </AppText>
            </View>
          )}
          {setupSaveFailed ? (
            <Pressable
              style={({ pressed }) => [styles.button, pressed && styles.pressed]}
              onPress={setupRefused ? openExisting : retry}
              accessibilityRole="button"
            >
              <AppText style={styles.buttonText}>
                {setupRefused ? "Open my account" : "Try again"}
              </AppText>
            </Pressable>
          ) : (
          <Pressable
            style={({ pressed }) => [
              styles.button,
              !canSubmit && !busy && styles.buttonDisabled,
              pressed && canSubmit && styles.pressed,
            ]}
            onPress={() => submit(code)}
            disabled={!canSubmit}
            accessibilityRole="button"
            accessibilityState={{ disabled: !canSubmit, busy }}
          >
            {busy && <ActivityIndicator color="#fff" />}
            <AppText
              style={[
                styles.buttonText,
                !canSubmit && !busy && styles.buttonTextDisabled,
              ]}
            >
              {busy
                ? inSetup
                  ? "Confirming…"
                  : "Signing in…"
                : selfSetup
                  ? "Confirm and start"
                  : inSetup
                    ? "Confirm and send invite"
                    : "Sign in"}
            </AppText>
          </Pressable>
          )}
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
  bodyStrong: {
    color: INK,
    fontFamily: FigtreeFont.extraBold,
  },
  bodyLink: {
    color: PRIMARY,
    fontFamily: FigtreeFont.bold,
    textDecorationLine: "underline",
  },
  field: {
    gap: 10,
  },
  label: {
    color: INK,
    fontFamily: FigtreeFont.bold,
    fontSize: 17,
    lineHeight: 22.1,
  },
  boxes: {
    flexDirection: "row",
    gap: 8,
  },
  box: {
    flex: 1,
    height: 64,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: SURFACE,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  boxActive: {
    borderWidth: 2,
    borderColor: PRIMARY,
  },
  boxWrong: {
    borderWidth: 2,
    borderColor: RED,
    backgroundColor: RED_BG,
  },
  boxExpired: {
    backgroundColor: "#F9F8FC",
  },
  digit: {
    color: INK,
    fontFamily: FigtreeFont.extraBold,
    fontSize: 28,
    fontVariant: ["tabular-nums"],
  },
  hiddenInput: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    opacity: 0.01, // fully invisible fields can't receive the code on some phones
    color: "transparent",
  },
  statusRow: {
    marginTop: -8,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  statusText: {
    color: SUBTITLE,
    fontFamily: FigtreeFont.semiBold,
    fontSize: 16,
  },
  expiredCard: {
    marginTop: -8,
    padding: 14,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: SUN,
    flexDirection: "row",
    gap: 10,
  },
  expiredText: {
    flex: 1,
    color: SUN_TEXT,
    fontFamily: FigtreeFont.semiBold,
    fontSize: 16,
    lineHeight: 23,
  },
  problemRow: {
    marginTop: -8,
    flexDirection: "row",
    gap: 10,
  },
  problemText: {
    flex: 1,
    color: RED_TEXT,
    fontFamily: FigtreeFont.semiBold,
    fontSize: 16,
    lineHeight: 23,
  },
  resend: {
    alignSelf: "flex-start",
    minHeight: 48,
    paddingHorizontal: 18,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: SURFACE,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  resendText: {
    color: INK,
    fontFamily: FigtreeFont.bold,
    fontSize: 17,
  },
  waitText: {
    color: SUBTITLE,
    fontFamily: FigtreeFont.medium,
    fontSize: 16,
    lineHeight: 23,
  },
  waitTime: {
    color: INK,
    fontFamily: FigtreeFont.extraBold,
    fontVariant: ["tabular-nums"],
  },
  footer: {
    marginTop: "auto",
    gap: 14,
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
  buttonDisabled: {
    backgroundColor: DISABLED_BG,
  },
  buttonText: {
    color: "#fff",
    fontFamily: FigtreeFont.bold,
    fontSize: 19,
    lineHeight: 22.8,
  },
  buttonTextDisabled: {
    color: SUBTITLE,
  },
  pressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.9,
  },
});
