import { AppText } from "@/components/app-test";
import { ConnectedHero } from "@/components/connected-hero";
import { FigtreeFont, FontFamily } from "@/constants/fonts";
import { useCaregiverSetup } from "@/context/caregiver-setup";
import CalendarIcon from "../components/icons/CalendarIcon";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const INK = "#15163A";
const SUBTITLE = "#54566E";
const PRIMARY = "#4338CA";
const BACKGROUND = "#F5F4FA";
const BORDERCOLOR = "#E6E4EF";
const MINT = "#DDF3EE";
const GREEN = "#075E4F";
const SUN = "#FFE8DB";
const SURFACE = "#DCD9E8";
const LILAC = "#E7E4FB";
const SELECTED_BG = "#F1EFFD";
const MUTED = "#8B8DA3";
const PURPLE = "#2D2A8C";
const ALERT = "#C43A2B";

export default function ConnectedScreen() {
  const { firstName, yourFirstName } = useCaregiverSetup();
  const initialOf = (name: string) =>
    name.trim().charAt(0).toUpperCase() || undefined; // undefined keeps the hero's placeholder
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <ConnectedHero
            leftInitial={initialOf(yourFirstName)}
            rightInitial={initialOf(firstName)}
          />
        </View>
        <View style={styles.header}>
          <AppText style={styles.headerText}>
            You and {firstName} are connected
          </AppText>
          <AppText style={styles.subHeaderText}>
            {firstName} replied YES. Mira checks in with {firstName} every day
            from now on.
          </AppText>
        </View>
        <View style={styles.summary}>
          <View style={styles.row}>
                  <CalendarIcon size={20} color={PRIMARY} />
          </View>
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
  scrollContent: {
    flexGrow: 1,
  },
  hero: {
    marginTop: 72,
  },
  header: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 10,
    alignSelf: "stretch",
  },
  headerText: {
    color: INK,
    textAlign: "center",
    fontFamily: FontFamily.bold,
    fontSize: 32,
    lineHeight: 35.2,
    letterSpacing: -0.7,
    alignSelf: "stretch",
  },
  subHeaderText: {
    textAlign: "center",
    fontFamily: FigtreeFont.medium,
    fontSize: 17,
    lineHeight: 24.65,
    alignSelf: "stretch",
    color: SUBTITLE,
  },
});
