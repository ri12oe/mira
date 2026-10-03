import { AppText } from "@/components/app-test";
import { ConnectedHero } from "@/components/connected-hero";
import { FigtreeFont, FontFamily } from "@/constants/fonts";
import { CheckInMethod, useCaregiverSetup } from "@/context/caregiver-setup";
import { formatTimeRange } from "@/utils/format-time-short";
import { ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AlarmIcon from "../components/icons/AlarmIcon";
import CalendarIcon from "../components/icons/CalendarIcon";
import MessageIcon from "../components/icons/MessageIcon";
import PhoneIcon from "../components/icons/PhoneIcon";
import PhoneSquareIcon from "../components/icons/PhoneSquareIcon";
import { router } from "expo-router";

const INK = "#15163A";
const SUBTITLE = "#54566E";
const PRIMARY = "#4338CA";
const BACKGROUND = "#F5F4FA";
const BORDERCOLOR = "#E6E4EF";
const MINT = "#DDF3EE";
const SUN = "#FFE8DB";
const LILAC = "#E7E4FB";
const ORANGE = "#C2551F";
// Row icons that never overlap with the check-in method palette above.
const SKY = "#DCEBFA";
const SKY_ICON = "#1D5FA8";
const ROSE = "#FDE4EC";
const ROSE_ICON = "#B4325A";

// Matches the options on the "how do they check in" step.
const METHOD_SUMMARY: Record<
  CheckInMethod,
  { label: string; bg: string; icon: ReactNode }
> = {
  text: {
    label: "Text reply",
    bg: LILAC,
    icon: <MessageIcon size={20} color={PRIMARY} />,
  },
  call: {
    label: "Phone call",
    bg: SUN,
    icon: <PhoneIcon size={20} color={ORANGE} />,
  },
  app: {
    label: "Mira app",
    bg: MINT,
    icon: <PhoneSquareIcon size={20} color="#0B7A66" />,
  },
};

export default function ConnectedScreen() {
  const { firstName, yourFirstName, method, backups, windowStart, windowEnd } =
    useCaregiverSetup();
  const checkIn = METHOD_SUMMARY[method];
  const firstBackup = backups[0]?.name;
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
            <View style={[styles.icon, { backgroundColor: SKY }]}>
              <CalendarIcon size={20} color={SKY_ICON} />
            </View>
            <AppText style={styles.rowText}>First check-in</AppText>
            <AppText style={[styles.rowValue, styles.rowValueStacked]}>
              Tomorrow{"\n"}
              {formatTimeRange(windowStart, windowEnd)}
            </AppText>
          </View>
          <View style={styles.row}>
            <View style={[styles.icon, { backgroundColor: checkIn.bg }]}>
              {checkIn.icon}
            </View>
            <AppText style={styles.rowText}>Checks in by</AppText>
            <AppText style={styles.rowValue}>{checkIn.label}</AppText>
          </View>
          <View style={styles.row}>
            <View style={[styles.icon, { backgroundColor: ROSE }]}>
              <AlarmIcon size={20} color={ROSE_ICON} />
            </View>
            <AppText style={styles.rowText}>If one is missed</AppText>
            <AppText style={styles.rowValue}>
              {firstBackup ? `You, then ${firstBackup}` : "You"}
            </AppText>
          </View>
        </View>
        <View style={styles.buttons}>
          <Pressable
            style={({ pressed }) => [
              styles.nextButton,
              pressed && styles.pressed,
            ]}
            accessibilityLabel="Next"
            accessibilityRole="button"
            onPress={() => router.push("/connected")}
          >
            <AppText style={styles.nextButtonText}>
              Go to my dashboard
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
  summary: {
    flexDirection: "column",
    alignItems: "flex-start",
    alignSelf: "stretch",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: BORDERCOLOR,
    backgroundColor: "#fff",
    marginTop: 32,
  },
  row: {
    flexDirection: "row",
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignItems: "center",
    gap: 14,
    alignSelf: "stretch",
    borderBottomWidth: 1,
    borderBottomColor: BORDERCOLOR,
  },
  icon: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 13,
  },
  rowText: {
    flex: 1,
    fontFamily: FigtreeFont.semiBold,
    color: SUBTITLE,
    fontSize: 16,
    lineHeight: 23.2,
  },
  rowValue: {
    color: INK,
    fontSize: 16,
    lineHeight: 28.8,
    fontFamily: FigtreeFont.bold,
  },
  rowValueStacked: {
    textAlign: "right",
    lineHeight: 22,
  },
  buttons: {
    marginTop: 89,
  },
  nextButton: {
    height: 60,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "stretch",
    flexShrink: 0,
    borderRadius: 18,
    backgroundColor: PRIMARY,
    flexDirection: "row",
    gap: 10,
  },
  nextButtonText: {
    color: "#fff",
    fontFamily: FigtreeFont.bold,
    fontSize: 19,
    lineHeight: 22.8,
  },
  pressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.9,
  },
  disabled: {
    opacity: 0.4,
  },
});
