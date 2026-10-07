import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BackButton } from "@/components/back-button";
import TinyCircleIcon from "@/components/icons/TinyCircleIcon";
import { AppText } from "@/components/app-test";
import { FigtreeFont, FontFamily } from "@/constants/fonts";
import { WaitingHero } from "@/components/waiting-hero";
const INK = "#15163A";
const BACKGROUND = "#F5F4FA";
const SUBTITLE = "#54566E";
const MINT = "#DDF3EE";
const GREEN = "#134A40";
const PRIMARY = "#4338CA";
const BORDER = "#E6E4EF";
const ORANGE = "#C2551F";
const SUN = "#FFE8DB";

export default function Waiting() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
            <BackButton />
            <View style={styles.pill}>
              <TinyCircleIcon />
              <AppText style={styles.pillText}>Waiting for a reply</AppText>
            </View>
        </View>
        <View style={styles.hero}>
          <WaitingHero name="Lin" sentAt="12:11 PM" />
        </View>
      </ScrollView>
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
    gap: 22,
    paddingHorizontal: 24,
    paddingVertical: 24,
    paddingBottom: 108,
    marginTop: 56,
  },
  topBar: {
    justifyContent: "space-between",
    alignItems: "center",
    alignSelf: "stretch",
    flexDirection: "row",
  },
  pill: {
    height: 32,
    paddingHorizontal: 12,
    alignItems: "center",
    gap: 8,
    borderRadius: 999,
    backgroundColor: "#FFF3D1",
    flexDirection: "row",
  },
  pillText: {
    color: "#7A4E05",
    fontSize: 14,
    fontFamily: FigtreeFont.extraBold,
  },
  hero: {
    alignItems: "center",
  }
});
