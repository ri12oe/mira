import { AppText } from "@/components/app-test";
import { FigtreeFont, FontFamily } from "@/constants/fonts";
import { useCaregiverSetup } from "@/context/caregiver-setup";
import { router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

const INK = "#15163A";
const SUBTITLE = "#54566E";
const PRIMARY = "#4338CA";
const BACKGROUND = "#F5F4FA";
const BORDERCOLOR = "#E6E4EF";
const MINT = "#DDF3EE";
const SUN = "#FFE8DB";
const SURFACE = "#DCD9E8";
const LILAC = "#E7E4FB";
const SELECTED_BG = "#F1EFFD";
const MUTED = "#8B8DA3";

export default function CaregiverSetup2() {
  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/whoUsesMira");
    }
  };
  const { displayName } = useCaregiverSetup();
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Pressable
            onPress={goBack}
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
            <AppText style={styles.barText}>Step 2 of 3</AppText>
            <View style={styles.bar}>
              <View style={[styles.barSegment, styles.barActive]} />
              <View style={[styles.barSegment, styles.barActive]} />
              <View style={styles.barSegment} />
            </View>
          </View>
        </View>
        <View style={styles.callout}>
          <AppText style={styles.calloutText}>
            When should {displayName} be checked in?
          </AppText>
        </View>
        <View style={styles.checkInWindow}>
          <AppText style={styles.checkInWindowText}>Check-in window</AppText>
          <View style={styles.chips}>
            <Pressable style={styles.chip}>
              <AppText style={styles.chipText}>7-9 AM</AppText>
            </Pressable>
            <Pressable style={styles.chip}>
              <AppText style={styles.chipText}>9-11 AM</AppText>
            </Pressable>
            <Pressable style={styles.chip}>
              <AppText style={styles.chipText}>11AM - 1PM</AppText>
            </Pressable>
          </View>
          <View style={styles.windowSummary}>
            <View style={styles.windowSummaryContent}>
              <View style={styles.windowSummaryIcon}>
              <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
                <Path
                  d="M3.66669 15.5834H18.3334"
                  stroke="#C2551F"
                  strokeWidth={2.01667}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Path
                  d="M6.41669 15.5833C6.41669 14.3678 6.89957 13.202 7.75911 12.3424C8.61866 11.4829 9.78444 11 11 11C12.2156 11 13.3814 11.4829 14.2409 12.3424C15.1005 13.202 15.5834 14.3678 15.5834 15.5833"
                  stroke="#C2551F"
                  strokeWidth={2.01667}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Path
                  d="M11 4.58337V7.33337M5.04169 8.70837L6.69169 9.90004M16.9584 8.70837L15.3084 9.90004"
                  stroke="#C2551F"
                  strokeWidth={2.01667}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
              </View>
          
              <View style={styles.windowSummaryLabel}>
              <AppText style={styles.windowSummaryHeader}>{displayName} checks in between</AppText>
              <AppText style={styles.windowSummaryBody}>9:00 AM - 11:00 AM</AppText>
              </View>
            </View>
            <Pressable>
              <AppText style={styles.windowSummaryButtonText}>Change</AppText>
            </Pressable>
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
    lineHeight: 18.2,
  },
  bar: {
    alignSelf: "stretch",
    alignItems: "flex-start",
    gap: 6,
    flexDirection: "row",
  },
  barSegment: {
    height: 4,
    backgroundColor: SURFACE,
    borderRadius: 3,
    flex: 1,
  },
  barActive: {
    backgroundColor: PRIMARY,
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
  checkInWindow: {
    marginTop: 24,
    gap: 10,
  },
  checkInWindowText: {
    color: INK,
    fontFamily: FigtreeFont.bold,
    fontSize: 17,
    lineHeight: 22.1,
  },
  chips: {
    alignItems: "flex-start",
    gap: 8,
    alignSelf: "stretch",
    flexDirection: "row",
  },
  chip: {
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: SURFACE,
    backgroundColor: "#fff",
  },
  chipText: {
    color: INK,
    fontSize: 16,
    fontFamily: FigtreeFont.bold,
  },
  windowSummary: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "center",
    gap: 14,
    alignSelf: "stretch",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: SURFACE,
    backgroundColor: "#fff",
    justifyContent: "space-between",
    flexDirection: "row",
  },
  windowSummaryContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  windowSummaryIcon: {
    width: 42,
    height: 42,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 13,
    backgroundColor: SUN,
  },
  windowSummaryLabel: {
    flexDirection: "column",
    gap: 2,
  },
  windowSummaryHeader: {
    fontFamily: FigtreeFont.regular,
    fontSize: 15,
    lineHeight: 21,
    color: SUBTITLE,
  },
  windowSummaryBody: {
    color: INK,
    fontSize: 18,
    fontFamily: FigtreeFont.bold,
    fontWeight: 800,
  },
  windowSummaryButtonText: {
    color: PRIMARY,
    fontFamily: FigtreeFont.bold,
    fontWeight: 800,
    fontSize: 16,
  },
});
