import { AppText } from "@/components/app-test";
import { CaregiverTabBar } from "@/components/caregiver-tab-bar";
import { FigtreeFont, FontFamily } from "@/constants/fonts";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";


const INK = "#15163A";
const SUBTITLE = "#54566E";
const PRIMARY = "#4338CA";
const BACKGROUND = "#F5F4FA";
const BORDERCOLOR = "#E6E4EF";
const MINT = "#DDF3EE";
const SUN = "#FFE8DB";
const LILAC = "#E7E4FB";
const RISE = "#8A3A12";
const GREEN = "#075E4F";
const YELLOW = "#F5B53D";
const ORANGE = "#C2551F";
const PLACEHOLDER = "#8B8DA3";
const ALERT = "#C43A2B";


export default function CaregiverHistory() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
         style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <AppText style={styles.title}>History</AppText>
          <View style={styles.chip}>
            <View style={styles.frame}>
              <AppText style={styles.chipText}>L</AppText>
            </View>
            <AppText style={styles.chipLabel}>Lin</AppText>
          </View>
        </View>
      </ScrollView>
      <CaregiverTabBar active="history" />
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
  header: {
    justifyContent: "space-between",
    alignItems: "center",
    alignSelf: "stretch",
    flexDirection: "row",
  },
  title: {
    color: INK,
    fontFamily: FontFamily.bold,
    fontSize: 32,
    lineHeight: 35.2,
    letterSpacing: -0.7,
  },
  chip: {
    paddingVertical: 5,
    paddingHorizontal: 16,
    alignItems: "center",
    gap: 8,
    flexDirection: "row",
    borderRadius: 20,
    backgroundColor: INK,
  },
  frame: {
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 15,
    backgroundColor: SUN,
  },
  chipText: {
    color: RISE,
    fontFamily: FigtreeFont.extraBold,
    fontSize: 14,
    lineHeight: 18.2,
  },
  chipLabel: {
    color: "#fff",
    fontSize: 16,
    lineHeight: 20.8,
    fontFamily: FigtreeFont.bold,
  },
});
