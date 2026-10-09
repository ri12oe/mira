import { AppText } from "@/components/app-test";
import { CaregiverTabBar } from "@/components/caregiver-tab-bar";
import { FigtreeFont, FontFamily } from "@/constants/fonts";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

const INK = "#15163A";
const SUBTITLE = "#54566E";
const PRIMARY = "#4338CA";
const BACKGROUND = "#F5F4FA";
const BORDERCOLOR = "#E6E4EF";
const SUN = "#FFE8DB";
const RED = "#8A3A12";
const MINT = "#DDF3EE";
const GREEN = "#075E4F";
export default function CaregiverPeople() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <AppText style={styles.title}>People</AppText>
        <View style={styles.wholookFor}>
          <AppText style={styles.subtitle}>Who you look after</AppText>
          <View style={styles.person}>
            <View style={styles.Avater}>
              <AppText style={styles.avatarText}>L</AppText>
            </View>
            <View style={styles.frame}>
              <AppText style={styles.frameText}>Lin</AppText>
              <AppText style={styles.frameSubtitle}>
                Text reply, 9–11 AM
              </AppText>
            </View>
            <View style={styles.pill}>
              <AppText style={styles.pillText}>Okay today</AppText>
            </View>
          </View>
          <Pressable style={styles.addButton}>
            <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
              <Path
                d="M10.0001 4.16663V15.8333M4.16675 9.99996H15.8334"
                stroke="#4338CA"
                strokeWidth={2.16667}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
            <AppText style={styles.addButtonText}>
              Look after someone else
            </AppText>
          </Pressable>
        </View>
        
      </ScrollView>
      <CaregiverTabBar active="people" />
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
    fontSize: 32,
    fontFamily: FontFamily.extraBold,
    color: INK,
    lineHeight: 35.2,
    letterSpacing: -0.7,
  },
  wholookFor: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 10,
    alignSelf: "stretch",
  },
  subtitle: {
    color: INK,
    fontSize: 17,
    fontFamily: FigtreeFont.bold,
    lineHeight: 22.1,
  },
  person: {
    padding: 16,
    alignItems: "center",
    gap: 14,
    alignSelf: "stretch",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: BORDERCOLOR,
    backgroundColor: "#fff",
    shadowColor: "rgba(20, 23, 59, 0.06)",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 12,
    flexDirection: "row",
  },
  Avater: {
    width: 54,
    height: 54,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 27,
    backgroundColor: SUN,
  },
  avatarText: {
    fontSize: 22,
    lineHeight: 28.6,
    fontFamily: FigtreeFont.extraBold,
    color: RED,
  },
  frame: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 3,
    flex: 1,
  },
  frameText: {
    color: INK,
    fontSize: 19,
    lineHeight: 24.7,
    fontFamily: FigtreeFont.bold,
  },
  frameSubtitle: {
    color: SUBTITLE,
    fontSize: 15,
    fontFamily: FigtreeFont.medium,
    lineHeight: 21,
  },
  pill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignItems: "flex-start",
    borderRadius: 999,
    backgroundColor: MINT,
  },
  pillText: {
    color: GREEN,
    fontSize: 14,
    fontFamily: FigtreeFont.extraBold,
    lineHeight: 18.2,
  },
  addButton: {
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    alignSelf: "stretch",
    borderRadius: 18,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#B9B4E6",
    backgroundColor: "#fff",
    flexDirection: "row",
  },
  addButtonText: {
    color: INK,
    fontSize: 17,
    fontFamily: FigtreeFont.bold,
    lineHeight: 22.1,
  },
});
