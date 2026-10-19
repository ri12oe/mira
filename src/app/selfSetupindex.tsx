import { AppText } from "@/components/app-test";
import { useGoBack } from "@/components/back-button";
import { DotGreeting } from "@/components/dot-greeting";
import { Rise } from "@/components/rise";
import { FigtreeFont, FontFamily } from "@/constants/fonts";
import { useScreenScale } from "@/hooks/use-screen-scale";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ArrowLeftIcon from "../components/icons/ArrowLeftIcon";

const BACKGROUND = "#F5F4FA";
const BORDERCOLOR = "#E6E4EF";
const INK = "#15163A";
const SUBTITLE = "#54566E";
const SUN = "#FFE8DB";
const AMBER = "#8A3A12";
const BUTTER = "#FFF3D1";
const BROWN = "#7A4F06";
const MINT = "#DDF3EE";
const GREEN = "#075E4F";
const PRIMARY = "#4338CA";

export default function SelfSetupIndex() {
  const { space } = useScreenScale();
  const goBack = useGoBack();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <Pressable
          onPress={goBack}
          accessibilityLabel="Go Back"
          accessibilityRole="button"
          hitSlop={12}
          style={[styles.backButton, { marginTop: space(36) }]}
        >
          <ArrowLeftIcon />
        </Pressable>
        <Rise>
          <DotGreeting />
        </Rise>
        <View style={styles.heading}>
          <Rise delay={500}>
            <AppText style={styles.title}>
              Let&apos;s set up your daily check-in
            </AppText>
          </Rise>
          <Rise delay={620}>
            <AppText style={styles.subtitle}>
              Each day, you let the people you choose know you&apos;re okay. It
              takes about a minute.
            </AppText>
          </Rise>
        </View>
        <View style={styles.steps}>
          <Rise delay={740}>
            <View style={styles.step}>
              <View style={[styles.frame, { backgroundColor: SUN }]}>
                <AppText style={[styles.stepNumber, { color: AMBER }]}>
                  1
                </AppText>
              </View>
              <AppText style={styles.stepDesp}>Tell us your name</AppText>
            </View>
          </Rise>
          <Rise delay={860}>
            <View style={styles.step}>
            <View style={[styles.frame, { backgroundColor: BUTTER }]}>
              <AppText style={[styles.stepNumber, { color: BROWN }]}>2</AppText>
            </View>
            <AppText style={styles.stepDesp}>Pick a time each day</AppText>
          </View>
          </Rise>
          <Rise delay={980}>
            <View style={styles.step}>
            <View style={[styles.frame, { backgroundColor: MINT }]}>
              <AppText style={[styles.stepNumber, { color: GREEN }]}>3</AppText>
            </View>
            <AppText style={styles.stepDesp}>Choose who we tell</AppText>
          </View>
          </Rise>
        </View>
        <View style={styles.spacer}></View>
        <Rise delay={750}>
          <View style={[styles.buttons, { marginTop: space(28) }]}>
            <Pressable
              style={({ pressed }) => [
                styles.button,
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Lets start"
              onPress={() => router.push("/selfSetup1")}
            >
              <AppText style={styles.buttonText}>Let&apos;s start</AppText>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.buttonSecondary,
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Someone invited me"
              onPress={() => router.push("/invited")}
            >
              <AppText style={styles.buttonTextSecondary}>
                Someone invited me
              </AppText>
            </Pressable>
          </View>
        </Rise>
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
    gap: 20,
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
  heading: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 12,
    alignSelf: "stretch",
  },
  title: {
    alignSelf: "stretch",
    fontFamily: FontFamily.bold,
    fontSize: 36,
    lineHeight: 38.88,
    letterSpacing: -1,
    color: INK,
  },
  subtitle: {
    alignSelf: "stretch",
    fontFamily: FigtreeFont.medium,
    fontSize: 19,
    lineHeight: 28.5,
    color: SUBTITLE,
  },
  steps: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 12,
    alignSelf: "stretch",
  },
  step: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    flexDirection: "row",
  },
  frame: {
    display: "flex",
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 13,
  },
  stepNumber: {
    fontFamily: FigtreeFont.extraBold,
    fontSize: 18,
    lineHeight: 23.4,
  },
  stepDesp: {
    color: INK,
    fontSize: 19,
    fontFamily: FigtreeFont.bold,
    lineHeight: 24.7,
  },
  spacer: {
    flex: 1,
    alignSelf: "stretch",
  },
  buttons: {
    marginTop: 28,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  button: {
    borderRadius: 18,
    backgroundColor: PRIMARY,
    paddingVertical: 18.5,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "stretch",
  },
  buttonText: {
    color: "#fff",
    fontFamily: FigtreeFont.bold,
    fontSize: 19,
    lineHeight: 22.8,
  },
  buttonTextSecondary: {
    color: INK,
    fontFamily: FigtreeFont.bold,
    lineHeight: 22.1,
    fontSize: 17,
    textDecorationLine: "underline",
    textDecorationStyle: "solid",
    marginTop: 8,
  },
  pressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.9,
  },
  buttonSecondary: {},
});
