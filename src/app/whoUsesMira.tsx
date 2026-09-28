import { AppText } from "@/components/app-test";
import { FigtreeFont, FontFamily } from "@/constants/fonts";
import { router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

const INK = "#15163A";
const SUBTITLE = "#54566E";
const PRIMARY = "#4338CA";
const BACKGROUND = "#F5F4FA";
const BORDERCOLOR = "#E6E4EF";
const SUN = "#FFE8DB";
export default function whoUsesMira() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
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
        <View style={styles.callout}>
          <AppText style={styles.calloutHeader}>Who is using Mira?</AppText>
          <AppText style={styles.calloutBody}>
            Pick the one that fits. You can add more people later.
          </AppText>
        </View>
        <View style={styles.optionsContainer}>
          <Pressable style={styles.optionButton}>
            <View style={styles.optionButtonContent}>
              <View style={styles.optionButtonIcon}>
                <Svg width={28} height={28} viewBox="0 0 28 28" fill="none">
                  <Path
                    d="M14 23.3333C14 23.3333 5.83335 18.2 3.50002 13.3C2.81929 11.9076 2.71958 10.3018 3.2228 8.83592C3.72602 7.37001 4.79096 6.16405 6.18335 5.48332C7.57574 4.8026 9.18151 4.70288 10.6474 5.20611C12.1133 5.70933 13.3193 6.77427 14 8.16666C14.6807 6.77427 15.8867 5.70933 17.3526 5.20611C18.0785 4.95694 18.8463 4.85317 19.6122 4.90074C20.3782 4.9483 21.1272 5.14626 21.8167 5.48332C22.5061 5.82038 23.1224 6.28994 23.6304 6.86518C24.1384 7.44042 24.5281 8.11008 24.7772 8.83592C25.0264 9.56176 25.1302 10.3296 25.0826 11.0955C25.035 11.8615 24.8371 12.6105 24.5 13.3C22.1667 18.2 14 23.3333 14 23.3333Z"
                    stroke="#4338CA"
                    strokeWidth={2.56667}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
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
                <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
                  <Path
                    d="M8.25 5.5L13.75 11L8.25 16.5"
                    stroke="#8B8DA3"
                    strokeWidth={2.2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </View>
            </View>
          </Pressable>
          <Pressable style={styles.optionButton}>
            <View style={styles.optionButtonContent}>
              <View style={styles.optionButtonIcon2}>
                <Svg width={28} height={28} viewBox="0 0 28 28" fill="none">
                  <Path
                    d="M14 24.5C19.799 24.5 24.5 19.799 24.5 14C24.5 8.20101 19.799 3.5 14 3.5C8.20101 3.5 3.5 8.20101 3.5 14C3.5 19.799 8.20101 24.5 14 24.5Z"
                    stroke="#C2551F"
                    strokeWidth={2.56667}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <Path
                    d="M9.33331 14.5833L12.6 17.85L19.25 10.5"
                    stroke="#C2551F"
                    strokeWidth={2.56667}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
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
                <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
                  <Path
                    d="M8.25 5.5L13.75 11L8.25 16.5"
                    stroke="#8B8DA3"
                    strokeWidth={2.2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </View>
            </View>
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
    marginTop: 56,
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
    flex: 1,
    marginTop: 32,
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
});
