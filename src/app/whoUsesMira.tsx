import { AppText } from "@/components/app-test";
import { FigtreeFont, FontFamily } from "@/constants/fonts";
import { useScreenScale } from "@/hooks/use-screen-scale";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import ArrowLeftIcon from "../components/icons/ArrowLeftIcon";
import HeartIcon from "../components/icons/HeartIcon";
import ArrowRightIcon from "../components/icons/ArrowRightIcon";
import CheckCircleIcon from "../components/icons/CheckCircleIcon";
import LockIcon from "../components/icons/LockIcon";
const INK = "#15163A";
const SUBTITLE = "#54566E";
const PRIMARY = "#4338CA";
const BACKGROUND = "#F5F4FA";
const BORDERCOLOR = "#E6E4EF";
const MINT = "#DDF3EE";
const SUN = "#FFE8DB";
const CALM = "#134A40";
export default function WhoUsesMira() {
  const { space } = useScreenScale();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <Pressable
          onPress={() => router.back()}
          accessibilityLabel="Go Back"
          accessibilityRole="button"
          hitSlop={12}
          style={[styles.backButton, { marginTop: space(36) }]}
        >
          <ArrowLeftIcon />
        </Pressable>
        <View style={[styles.callout, { marginTop: space(32) }]}>
          <AppText style={styles.calloutHeader}>Who is using Mira?</AppText>
          <AppText style={styles.calloutBody}>
            Pick the one that fits. You can add more people later.
          </AppText>
        </View>
        <View
          style={[
            styles.optionsContainer,
            { marginTop: space(32), marginBottom: space(14) },
          ]}
        >
          <Pressable 
            style={({ pressed }) => [styles.optionButton, pressed && styles.pressed]}
            accessibilityLabel="button"
            onPress={() => router.push("/caregiverSetup1")}
            >
            <View style={styles.optionButtonContent}>
              <View style={styles.optionButtonIcon}>
                <HeartIcon />
              </View>
              <View style={styles.optionButtonLabel}>
                <AppText style={styles.optionButtonLabelHeader}>
                  I'm a caregiver
                </AppText>
                <AppText style={styles.optionButtonLabelBody}>
                  Set up Mira for someone I look after
                </AppText>
              </View>
              <View style={styles.optionButtonArrow}>
                <ArrowRightIcon />
              </View>
            </View>
          </Pressable>
          <Pressable 
            style={({ pressed }) => [styles.optionButton, pressed && styles.pressed]}
            accessibilityLabel="button"
            >
            <View style={styles.optionButtonContent}>
              <View style={styles.optionButtonIcon2}>
                <CheckCircleIcon />
              </View>
              <View style={styles.optionButtonLabel}>
                <AppText style={styles.optionButtonLabelHeader}>
                  I'm checking in
                </AppText>
                <AppText style={styles.optionButtonLabelBody}>
                  Use Mira for myself
                </AppText>
              </View>
              <View style={styles.optionButtonArrow}>
                <ArrowRightIcon />
              </View>
            </View>
          </Pressable>
        </View>
        <View style={styles.info}>
          <LockIcon size={22}/>
          <AppText style={styles.infoText}>
            Mira only shares whether a check-in happened. Never messages or
            location.
          </AppText>
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
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    borderColor: BORDERCOLOR,
    borderWidth: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
    marginTop: 36,
  },
  callout: {
    marginTop: 32,
    gap: 10,
  },
  calloutHeader: {
    color: INK,
    fontSize: 32,
    lineHeight: 35.2,
    letterSpacing: -0.7,
    fontFamily: FontFamily.bold,
    alignSelf: "stretch",
  },
  calloutBody: {
    color: SUBTITLE,
    fontSize: 17,
    lineHeight: 24.65,
    fontFamily: FigtreeFont.medium,
    alignSelf: "stretch",
  },
  optionsContainer: {
    flexGrow: 1,
    gap: 14,
  },
  optionButton: {
    borderColor: BORDERCOLOR,
    borderWidth: 1,
    backgroundColor: "#fff",
    borderRadius: 24,
    boxShadow: "0px 8px 24px 0px rgba(20, 23, 59, 0.07)",
    gap: 16,
    alignSelf: "stretch",
    padding: 20,
  },
  optionButtonContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
  },
  optionButtonIcon: {
    width: 56,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 18,
    backgroundColor: "#F0F1F5",
  },
  optionButtonIcon2: {
    width: 56,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 18,
    backgroundColor: SUN,
  },
  optionButtonLabel: {
    flex: 1,
    gap: 4,
  },
  optionButtonLabelHeader: {
    color: INK,
    fontFamily: FigtreeFont.bold,
    fontSize: 19,
    lineHeight: 24.7,
    alignSelf: "stretch",
  },
  optionButtonLabelBody: {
    color: SUBTITLE,
    fontFamily: FigtreeFont.medium,
    fontSize: 17,
    lineHeight: 24.65,
    alignSelf: "stretch",
  },
  optionButtonArrow: {
    width: 22,
    height: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  info: {
    backgroundColor: MINT,
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
  },
  infoText: {
    fontFamily: FigtreeFont.bold,
    fontSize: 15,
    lineHeight: 21,
    color: CALM,
    flex: 1,
  },
  pressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.9,
  },
});
