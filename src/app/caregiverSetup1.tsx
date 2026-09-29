import { AppText } from "@/components/app-test";
import { FigtreeFont, FontFamily } from "@/constants/fonts";
import { router } from "expo-router";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

const INK = "#15163A";
const SUBTITLE = "#54566E";
const PRIMARY = "#4338CA";
const BACKGROUND = "#F5F4FA";
const BORDERCOLOR = "#E6E4EF";
const MINT = "#DDF3EE";
const SUN = "#FFE8DB";
const CALM = "#134A40";
const SURFACE = "#DCD9E8";

export default function CaregiverSetup1() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            accessibilityLabel="Go Back"
            accessibilityRole="button"
            hitSlop={12}
            style={styles.backButton}
          >
            <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
              <Path
                d="M13.75 5.5L8.25 11L13.75 16.5"
                stroke="#15163A"
                strokeWidth={2.2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </Pressable>
          <View style={styles.barContainer}>
            <AppText style={styles.barText}>Step 1 of 3</AppText>
            <View style={styles.bar}>
              <View style={styles.barone} />
              <View style={styles.bartwo} />
              <View style={styles.barthree} />
            </View>
          </View>
        </View>
        <View style={styles.callout}>
          <AppText style={styles.calloutText}>Who are you caring for?</AppText>
        </View>
        <View style={styles.information}>
          <View style={styles.NameContainer}>
            <AppText style={styles.inputLabel}>First Name</AppText>
            <TextInput
              style={styles.inputField}
              placeholder="e.x. John"
              accessibilityLabel="First Name"
              placeholderTextColor="#8B8DA3"
              autoCapitalize="words"
              autoComplete="family-name"
            />
          </View>
          <View style={styles.NameContainer}>
            <AppText style={styles.inputLabel}>Their Phone Number</AppText>
            <TextInput
              style={styles.inputField}
              placeholder="(555) 123-4567"
              accessibilityLabel="Their Phone Number"
              placeholderTextColor="#8B8DA3"
              autoCapitalize="none"
              autoComplete="tel"
            />
          </View>
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
    backgroundColor: BACKGROUND,
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
  },
  header: {
    flexDirection: "row",
    gap: 16,
    alignSelf: "stretch",
    alignItems: "center",
    marginTop: 36,
  },
  barContainer: {
    alignItems: "flex-start",
    gap: 8,
    flexDirection: "column",
    flex: 1,
  },
  barText: {
    fontFamily: FigtreeFont.bold,
    color: SUBTITLE,
    fontSize: 14,
    fontWeight: 800,
    lineHeight: 18.2,
  },
  bar: {
    alignSelf: "stretch",
    alignItems: "flex-start",
    gap: 6,
    flexDirection: "row",
  },
  barone: {
    height: 4,
    backgroundColor: PRIMARY,
    borderRadius: 3,
    flex: 1,
  },
  bartwo: {
    height: 4,
    backgroundColor: SURFACE,
    borderRadius: 3,
    flex: 1,
  },
  barthree: {
    height: 4,
    backgroundColor: SURFACE,
    borderRadius: 3,
    flex: 1,
  },
  callout: {
    alignSelf: "stretch",
    marginTop: 24,
  },
  calloutText: {
    color: INK,
    fontFamily: FontFamily.extraBold,
    fontSize: 32,
    lineHeight: 35.2,
    letterSpacing: -0.7,
  },
  information: {
    marginTop: 24,
    gap: 16,
    flexDirection: "column",
    alignItems: "flex-start",
    alignSelf: "stretch",
  },
  NameContainer: {
    flexDirection: "column",
    gap: 8,
    alignSelf: "stretch",
    alignItems: "flex-start",
  },
  inputLabel: {
    fontFamily: FigtreeFont.bold,
    fontSize: 17,
    color: INK,
    lineHeight: 22.1,
  },
  inputField: {
    height: 56,
    paddingHorizontal: 16,
    alignSelf: "stretch",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: SURFACE,
    backgroundColor: "#fff",
    color: INK,
    fontSize: 18,
    fontFamily: FigtreeFont.bold,
    lineHeight: 23.4,
  },
});
