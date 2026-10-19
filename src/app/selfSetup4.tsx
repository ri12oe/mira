import { AppText } from "@/components/app-test";
import { Rise } from "@/components/rise";
import { FigtreeFont, FontFamily } from "@/constants/fonts";
import { useCaregiverSetup } from "@/context/caregiver-setup";
import { EASE_OUT, useLoop } from "@/hooks/use-entrance";
import { toE164 } from "@/utils/phone";
import { router } from "expo-router";
import { Animated, Pressable, StyleSheet, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

const INK = "#15163A";
const SUBTITLE = "#54566E";
const PRIMARY = "#4338CA";
const BACKGROUND = "#F5F4FA";
const SUN = "#FFE8DB";
const LILAC = "#E7E4FB";
const AMBER_BG = "#FFF3D1";
const AMBER_TEXT = "#7A4F06";

// The design's sizes: a 310px peach circle, a 264px lilac ring, a 216px button
const DESIGN_SIZE = 310;
const PLATE_RATIO = 264 / 310;
const BUTTON_RATIO = 216 / 310;

/**
 * Self setup, practice run: "Let's try it once".
 * The person taps the big "I'm okay" button once, so they know exactly what
 * to do each day. Nobody is alerted during practice.
 *
 * Canvas animation:
 *   - the heading rises in
 *   - the peach circle gently "breathes" (grows 5% and back, every 2.8s)
 *   - from 1s, a ring pulses out from the button, hinting "tap me" (every 2.2s)
 *   - the button shrinks a little while pressed
 * With Reduce motion on, the circles stay still (useLoop handles that).
 */
export default function SelfSetup4() {
  const { width: screenW } = useWindowDimensions();
  const { yourPhone } = useCaregiverSetup();
  // 310px like the design, but never wider than the screen minus its 24px padding
  const size = Math.max(0, Math.min(DESIGN_SIZE, screenW - 48));
  const plate = size * PLATE_RATIO;
  const button = size * BUTTON_RATIO;

  const breathe = useLoop({ duration: 2800 });
  const hint = useLoop({ delay: 1000, duration: 2200, easing: EASE_OUT });

  const breatheStyle = {
    transform: [{ scale: breathe.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.05, 1] }) }],
  };
  const hintStyle = {
    opacity: hint.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] }),
    transform: [{ scale: hint.interpolate({ inputRange: [0, 1], outputRange: [1, 1.45] }) }],
  };

  // Both buttons finish setup: confirm the phone with a code (that saves
  // everything and signs them in), then "You're all set". Step 1 only lets
  // them past with a full phone number; the fallback is just in case.
  const finish = () => {
    const phone = toE164(yourPhone);
    if (!phone) {
      router.navigate("/selfSetup1");
      return;
    }
    router.push({ pathname: "/verifyCode", params: { phone, context: "self" } });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Rise style={styles.callout}>
          <View style={styles.pill}>
            <AppText style={styles.pillText}>Practice run</AppText>
          </View>
          <AppText style={styles.calloutText} accessibilityRole="header">
            Let&apos;s try it once
          </AppText>
          <AppText style={styles.calloutSubtext}>
            This is all you&apos;ll do each day. Nobody gets alerted during practice.
          </AppText>
        </Rise>

        {/* the big button, with its circles behind it */}
        <View style={[styles.stage, { width: size, height: size }]}>
          <Animated.View
            pointerEvents="none"
            style={[styles.circle, { width: size, height: size, borderRadius: size / 2, backgroundColor: SUN }, breatheStyle]}
          />
          <View
            pointerEvents="none"
            style={[styles.circle, { width: plate, height: plate, borderRadius: plate / 2, backgroundColor: LILAC }]}
          />
          <Animated.View
            pointerEvents="none"
            style={[styles.circle, styles.hintRing, { width: button, height: button, borderRadius: button / 2 }, hintStyle]}
          />
          <Pressable
            onPress={finish}
            accessibilityRole="button"
            accessibilityLabel="I'm okay"
            accessibilityHint="Practice check-in. Nobody will be alerted."
            style={({ pressed }) => [
              styles.okayButton,
              { width: button, height: button, borderRadius: button / 2 },
              pressed && styles.okayPressed,
            ]}
          >
            <Svg width={56} height={56} viewBox="0 0 24 24" fill="none">
              <Path d="M5 12.5l4.5 4.5L19 7.5" stroke="#FFFFFF" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
            <AppText style={styles.okayText}>I&apos;m okay</AppText>
          </Pressable>
        </View>

        <Pressable
          onPress={finish}
          accessibilityRole="button"
          accessibilityLabel="Skip practice for now"
          hitSlop={8}
          style={({ pressed }) => [styles.skip, pressed && styles.pressedText]}
        >
          <AppText style={styles.skipText}>Skip for now</AppText>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: BACKGROUND,
  },
  // heading at the top, button in the middle, "Skip" at the bottom
  content: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 48,
  },
  callout: {
    alignSelf: "stretch",
    alignItems: "center",
    gap: 12,
  },
  pill: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: AMBER_BG,
  },
  pillText: {
    color: AMBER_TEXT,
    fontFamily: FigtreeFont.extraBold,
    fontSize: 15,
    lineHeight: 19.5,
  },
  calloutText: {
    color: INK,
    fontFamily: FontFamily.bold,
    fontSize: 36,
    lineHeight: 39.6,
    letterSpacing: -0.9,
    textAlign: "center",
  },
  calloutSubtext: {
    color: SUBTITLE,
    fontFamily: FigtreeFont.medium,
    fontSize: 19,
    lineHeight: 28.5,
    textAlign: "center",
  },
  // every circle is centred in this box
  stage: {
    alignItems: "center",
    justifyContent: "center",
  },
  circle: {
    position: "absolute",
  },
  hintRing: {
    borderWidth: 3,
    borderColor: PRIMARY,
  },
  okayButton: {
    backgroundColor: PRIMARY,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    // purple glow under the button (iOS + web), elevation for Android
    shadowColor: PRIMARY,
    shadowOpacity: 0.38,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 16 },
    elevation: 10,
  },
  okayPressed: {
    transform: [{ scale: 0.93 }],
  },
  okayText: {
    color: "#FFFFFF",
    fontFamily: FontFamily.bold,
    fontSize: 32,
    lineHeight: 36,
  },
  skip: {
    padding: 12,
  },
  pressedText: {
    opacity: 0.6,
  },
  skipText: {
    color: INK,
    fontFamily: FigtreeFont.bold,
    fontSize: 18,
    lineHeight: 23.4,
  },
});