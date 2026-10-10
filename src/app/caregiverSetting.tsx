import { AppText } from "@/components/app-test";
import { CaregiverTabBar } from "@/components/caregiver-tab-bar";
import ArrowRightIcon from "@/components/icons/ArrowRightIcon";
import { FigtreeFont, FontFamily } from "@/constants/fonts";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";

const BACKGROUND = "#F5F4FA";
const INK = "#15163A";
const SUBTITLE = "#54566E";
const BORDERCOLOR = "#E6E4EF";
const SWITCH_BACKGROUND = "#DCD9E8";

export default function CaregiverSetting() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <AppText style={styles.title}>Settings</AppText>
        <View style={styles.checkIn}>
          <AppText style={styles.checkInText}>Lin&apos;s check in</AppText>
          <View style={styles.group}>
            <View style={styles.row}>
              <AppText style={styles.rowText}>Check-in window</AppText>
              <AppText style={styles.rowValue}>9–11 AM</AppText>
              <ArrowRightIcon size={18} />
            </View>
            <View style={styles.row}>
              <AppText style={styles.rowText}>How Lin checks in</AppText>
              <AppText style={styles.rowValue}>Text reply</AppText>
              <ArrowRightIcon size={18} />
            </View>
            <View style={styles.row}>
              <AppText style={styles.rowText}>Extra time before alerts</AppText>
              <AppText style={styles.rowValue}>30 min</AppText>
              <ArrowRightIcon size={18} />
            </View>
            <View style={styles.rowLast}>
              <View style={styles.rowFrame}>
                <AppText style={styles.rowText2}>
                  Pause check-ins
                </AppText>
                <AppText style={styles.rowValue2}>
                  For trips or hospital stays
                </AppText>
              </View>
              <Pressable style={styles.switch}>
                <Svg width={32} height={31} viewBox="0 0 32 31" fill="none">
                  <Circle cx={16} cy={15} r={13} fill="white" />
                </Svg>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
      <CaregiverTabBar active="settings" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    gap: 16,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 108,
    marginTop: 56,
  },
  title: {
    color: INK,
    fontFamily: FontFamily.bold,
    fontSize: 32,
    lineHeight: 35.2,
    letterSpacing: -0.7,
  },
  checkIn: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 8,
    alignSelf: "stretch",
  },
  checkInText: {
    color: SUBTITLE,
    fontSize: 16,
    lineHeight: 20.8,
    fontFamily: FigtreeFont.bold,
  },
  group: {
    flexDirection: "column",
    alignItems: "flex-start",
    alignSelf: "stretch",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: BORDERCOLOR,
    backgroundColor: "#fff",
  },
  row: {
    height: 56,
    paddingHorizontal: 16,
    alignItems: "center",
    gap: 12,
    alignSelf: "stretch",
    borderBottomWidth: 1,
    borderBottomColor: BORDERCOLOR,
    flexDirection: "row",
  },
  rowText: {
    flex: 1,
    color: INK,
    fontFamily: FigtreeFont.bold,
    fontSize: 17,
    lineHeight: 22.1,
  },
  rowValue: {
    color: SUBTITLE,
    fontFamily: FigtreeFont.semiBold,
    fontSize: 16,
    lineHeight: 23.2,
  },
  rowLast: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    gap: 12,
    alignSelf: "stretch",
    flexDirection: "row",
  },
  rowFrame: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 2,
    flex: 1,
  },
  rowText2: {
    color: INK,
    fontFamily: FigtreeFont.bold,
    fontSize: 17,
    lineHeight: 22.1,
  },
  rowValue2: {
    color: SUBTITLE,
    fontFamily: FigtreeFont.medium,
    fontSize: 14,
    lineHeight: 19.6,
  },
  switch: {
    width: 52,
    height: 32,
    padding: 3,
    alignItems: "center",
    borderRadius: 16,
    backgroundColor: SWITCH_BACKGROUND,
    flexDirection: "row",
  },
});
