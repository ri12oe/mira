import { useEffect, useRef } from "react";
import { AccessibilityInfo, Animated, Easing, StyleSheet, View } from "react-native";

import { AppText } from "@/components/app-test";
import MessageIcon from "@/components/icons/MessageIcon";
import PhoneIcon from "@/components/icons/PhoneIcon";
import PhoneSquareIcon from "@/components/icons/PhoneSquareIcon";
import { FigtreeFont, FontFamily } from "@/constants/fonts";
import { CheckInMethod } from "@/context/caregiver-setup";

const INK = "#15163A";
const SUBTITLE = "#54566E";
const PRIMARY = "#4338CA";
const BACKGROUND = "#F5F4FA";
const SUN = "#FFE8DB";
const SUN_TEXT = "#8A3A12";

const SIZE = 168; // whole picture, rings included
const PLATE = 120; // white circle behind the avatar
const AVATAR = 96;
const BADGE = 44;

type Props = {
  name: string; // "Lin"
  sentAt: string; // "12:11 PM"
  method: CheckInMethod;
};

/** One ring that grows and fades out, forever. `delay` offsets the second ring. */
function PulseRing({ delay }: { delay: number }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let loop: Animated.CompositeAnimation | undefined;

    AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
      if (reduced) return; // leave the ring still for people who turn motion off
      loop = Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(progress, {
            toValue: 1,
            duration: 2400,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true, // scale + opacity run on the UI thread
          }),
        ])
      );
      loop.start();
    });

    return () => loop?.stop();
  }, [delay, progress]);

  const scale = progress.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1.35] });
  const opacity = progress.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] });

  return <Animated.View style={[styles.ring, { opacity, transform: [{ scale }] }]} />;
}

export function WaitingHero({ name, sentAt, method }: Props) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  const MethodIcon = method === "text" ? MessageIcon : method === "call" ? PhoneIcon : PhoneSquareIcon;
  const sentDescription = method === "text"
    ? `We texted ${name}`
    : method === "call"
      ? `We started a call to ${name}`
      : `We sent ${name} a Mira app check-in`;

  return (
    <View style={styles.wrap}>
      {/* the picture: rings, white plate, avatar, badge */}
      <View style={styles.picture} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <PulseRing delay={0} />
        <PulseRing delay={1200} />

        <View style={styles.plate} />

        <View style={styles.avatar}>
          <AppText style={styles.avatarText}>{initial}</AppText>
        </View>

        <View style={styles.badge}>
          <MethodIcon size={20} color="#FFFFFF" />
        </View>
      </View>

      {/* the words */}
      <View style={styles.text}>
        <AppText style={styles.title} accessibilityRole="header">
          Waiting for {name}…
        </AppText>
        <AppText style={styles.subtitle}>
          {sentDescription} at {sentAt}. You&apos;ll get a notification as soon as they confirm.
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    gap: 18,
  },
  picture: {
    width: SIZE,
    height: SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  ring: {
    position: "absolute",
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    borderWidth: 2,
    borderColor: PRIMARY,
  },
  plate: {
    position: "absolute",
    width: PLATE,
    height: PLATE,
    borderRadius: PLATE / 2,
    backgroundColor: "#FFFFFF",
    // soft shadow (iOS + web)
    shadowColor: INK,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3, // Android
  },
  avatar: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
    backgroundColor: SUN,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontFamily: FigtreeFont.extraBold,
    fontSize: 40,
    color: SUN_TEXT,
  },
  badge: {
    position: "absolute",
    right: 22,
    bottom: 22,
    width: BADGE,
    height: BADGE,
    borderRadius: BADGE / 2,
    backgroundColor: PRIMARY,
    borderWidth: 4,
    borderColor: BACKGROUND, // looks like a cut-out against the page
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    alignSelf: "stretch",
    gap: 8,
  },
  title: {
    fontFamily: FontFamily.extraBold,
    fontSize: 32,
    lineHeight: 35,
    letterSpacing: -0.8,
    color: INK,
    textAlign: "center",
  },
  subtitle: {
    fontFamily: FigtreeFont.medium,
    fontSize: 17,
    lineHeight: 24.6,
    color: SUBTITLE,
    textAlign: "center",
  },
});