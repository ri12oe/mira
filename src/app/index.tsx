import { AppText } from "@/components/app-test";
import { WelcomeHero } from "@/components/welcome-hero";
import { FigtreeFont, FontFamily } from "@/constants/fonts";
import { Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { ClipPath, Defs, G, Path, Rect } from "react-native-svg";

const INK = "#15163A";
const SUBTITLE = "#54566E";
const PRIMARY = "#4338CA";

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoheader}>
          <View>
            <Svg width={30} height={30} viewBox="0 0 30 30" fill="none">
              <G clipPath="url(#clip0_2_8)">
                <Path
                  d="M15 28C22.1797 28 28 22.1797 28 15C28 7.8203 22.1797 2 15 2C7.8203 2 2 7.8203 2 15C2 22.1797 7.8203 28 15 28Z"
                  stroke="#4338CA"
                  strokeWidth={3}
                />
                <Path
                  d="M15 20.5C18.0376 20.5 20.5 18.0376 20.5 15C20.5 11.9624 18.0376 9.5 15 9.5C11.9624 9.5 9.5 11.9624 9.5 15C9.5 18.0376 11.9624 20.5 15 20.5Z"
                  fill="#FF9F6B"
                />
              </G>
              <Defs>
                <ClipPath id="clip0_2_8">
                  <Rect width={30} height={30} fill="white" />
                </ClipPath>
              </Defs>
            </Svg>
          </View>
          <AppText style={styles.headerTitle}>mira</AppText>
        </View>
        <View style={styles.welcomeHero}>
          <WelcomeHero />
        </View>
        <View style={styles.callout}>
          <AppText style={styles.calloutHeader}>
            A daily check-in that keeps family close.
          </AppText>
          <AppText style={styles.calloutBody}>
            One tap a day lets the people who love you know you're okay.
          </AppText>
        </View>
        <View style={styles.buttons}>
          <Pressable style={styles.button}>
            <AppText style={styles.buttonText}>Get Started</AppText>
          </Pressable>
          <Pressable style={styles.buttonSecondary}>
            <AppText style={styles.buttonTextSecondary}>
              I already have an account
            </AppText>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  content: {
    flex: 1,
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
  welcomeHero: {
    marginTop: 48.2,
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
    paddingHorizontal: 121,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "stretch",
  },
  buttonSecondary: {},
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
});
