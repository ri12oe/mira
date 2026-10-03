import { AppText } from "@/components/app-test";
import { WelcomeHero } from "@/components/welcome-hero";
import { FigtreeFont, FontFamily } from "@/constants/fonts";
import { useScreenScale } from "@/hooks/use-screen-scale";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MiraIcon from "../components/icons/MiraIcon";
const INK = "#15163A";
const SUBTITLE = "#54566E";
const PRIMARY = "#4338CA";
const BACKGROUND = "#F5F4FA";

export default function HomeScreen() {
  const { space, font } = useScreenScale();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={[styles.logoheader, { marginTop: space(64) }]}>
          <View>
            <MiraIcon />
          </View>
          <AppText style={styles.headerTitle}>mira</AppText>
        </View>
        <View style={[styles.welcomeHero, { marginTop: space(48.2) }]}>
          <WelcomeHero />
        </View>
        <View
          style={[styles.callout, { marginTop: space(48.5), gap: space(14) }]}
        >
          <AppText
            style={[
              styles.calloutHeader,
              { fontSize: font(38), lineHeight: font(41.04) },
            ]}
          >
            A daily check-in that keeps family close.
          </AppText>
          <AppText style={styles.calloutBody}>
            One tap a day lets the people who love you know you&apos;re okay.
          </AppText>
        </View>
        <View style={[styles.buttons, { marginTop: space(28) }]}>
          <Pressable
            style={({ pressed }) => [styles.button, pressed && styles.pressed]}
            accessibilityLabel="button"
            onPress={() => router.push("/whoUsesMira")}
          >
            <AppText style={styles.buttonText}>Get Started</AppText>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.buttonSecondary,
              pressed && styles.pressed,
            ]}
            accessibilityLabel="button"
            onPress={() => router.push("/whoUsesMira")}
          >
            <AppText style={styles.buttonTextSecondary}>
              I already have an account
            </AppText>
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
  // Fills the screen on any phone; only scrolls if a very short phone still cannot fit everything.
  scrollContent: {
    flexGrow: 1,
  },
  logoheader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 64,
  },
  headerTitle: {
    fontFamily: FontFamily.extraBold,
    fontSize: 28,
    color: INK,
  },
  // Takes the space left over: 290 tall at most (the design size), shrinks on short phones.
  welcomeHero: {
    flexGrow: 1,
    flexShrink: 0,
    flexBasis: 150,
    maxHeight: 290,
    alignItems: "center",
  },
  callout: {
    gap: 14,
    marginTop: 48.5,
  },
  calloutHeader: {
    color: INK,
    fontSize: 38,
    fontWeight: 700,
    lineHeight: 41.04,
    letterSpacing: -1,
    fontFamily: FontFamily.bold,
  },
  calloutBody: {
    fontSize: 17,
    fontFamily: FigtreeFont.medium,
    color: SUBTITLE,
    lineHeight: 24.65,
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
