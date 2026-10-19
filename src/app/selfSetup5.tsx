import { AllSetHero } from "@/components/all-set-hero";
import { AppText } from "@/components/app-test";
import { Rise } from "@/components/rise";
import { FigtreeFont, FontFamily } from "@/constants/fonts";
import { CheckInMethod, useCaregiverSetup } from "@/context/caregiver-setup";
import { joinNames, periodOf } from "@/utils/day-period";
import { formatTime } from "@/utils/format-time";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AfternoonIcon from "@/components/icons/AfternoonIcon";
import EveningIcon from "@/components/icons/EveningIcon";
import MorningIcon from "@/components/icons/MorningIcon";

const INK = "#15163A";
const SUBTITLE = "#54566E";
const PRIMARY = "#4338CA";
const BACKGROUND = "#F5F4FA";
const BORDERCOLOR = "#E6E4EF";
const MINT = "#DDF3EE";
const GREEN = "#075E4F";
const SUN = "#FFE8DB";
const LILAC = "#E7E4FB";
const AMBER_BG = "#FFF3D1";
const AMBER_TEXT = "#9A6408";

const PERIOD_ICON = {
  morning: { bg: SUN, Icon: MorningIcon },
  afternoon: { bg: AMBER_BG, Icon: AfternoonIcon },
  evening: { bg: LILAC, Icon: EveningIcon },
};

const METHOD_PHRASE: Record<CheckInMethod, string> = {
  text: "by text",
  call: "by phone call",
  app: "in the app",
};

export default function SelfSetup5() {
  const { yourFirstName, windowStart, method, backups } = useCaregiverSetup();
  const name = yourFirstName.trim();
  const { bg, Icon } = PERIOD_ICON[periodOf(windowStart)];
  const names = backups.map((b) => b.name);
  const told = joinNames(names) || "Your backup";

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <AllSetHero />
        </View>
        {/* The hero animates itself; these rise in after it */}
        <Rise delay={1000}>
          <View style={styles.header}>
            <AppText style={styles.headerText}>
              You&apos;re all set{name ? `, ${name}` : ""}
            </AppText>
            <AppText style={styles.subHeaderText}>
              Your daily check-in starts tomorrow.
            </AppText>
          </View>
        </Rise>
        <Rise delay={1150}>
          <View style={styles.summary}>
            <View style={[styles.row, styles.rowDivider]}>
              <View style={[styles.icon, { backgroundColor: bg }]}>
                <Icon size={22} />
              </View>
              <View style={styles.rowText}>
                <AppText style={styles.rowLabel}>Each day</AppText>
                <AppText style={styles.rowValue}>
                  Around {formatTime(windowStart)}, {METHOD_PHRASE[method]}
                </AppText>
              </View>
            </View>
            <View style={styles.row}>
              <View style={[styles.icon, { backgroundColor: MINT }]}>
                <AppText style={styles.initial}>
                  {(names[0] ?? "").charAt(0).toUpperCase()}
                </AppText>
              </View>
              <View style={styles.rowText}>
                <AppText style={styles.rowLabel}>We&apos;ll tell</AppText>
                <AppText style={styles.rowValue}>{told}</AppText>
              </View>
              <View style={styles.pill}>
                <AppText style={styles.pillText}>Invite sent</AppText>
              </View>
            </View>
          </View>
        </Rise>
        <Rise delay={1300}>
          <AppText style={styles.note}>
            {told} {names.length > 1 ? "get" : "gets"} a text asking them to
            say yes. We&apos;ll let you know when they do.
          </AppText>
          <View style={styles.buttons}>
            <Pressable
              style={({ pressed }) => [
                styles.nextButton,
                pressed && styles.pressed,
              ]}
              accessibilityLabel="Go to my dashboard"
              accessibilityRole="button"
              onPress={() => router.push("/selfHome")}
            >
              <AppText style={styles.nextButtonText}>Go to my dashboard</AppText>
            </Pressable>
          </View>
        </Rise>
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
    alignSelf: "stretch",
    marginTop: 28,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: BORDERCOLOR,
    backgroundColor: "#fff",
  },
  row: {
    flexDirection: "row",
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignItems: "center",
    gap: 14,
    alignSelf: "stretch",
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: BORDERCOLOR,
  },
  icon: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 14,
  },
  initial: {
    color: GREEN,
    fontSize: 18,
    fontFamily: FigtreeFont.extraBold,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    color: SUBTITLE,
    fontFamily: FigtreeFont.semiBold,
    fontSize: 15,
  },
  rowValue: {
    color: INK,
    fontFamily: FigtreeFont.extraBold,
    fontSize: 17,
    lineHeight: 23,
  },
  pill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: AMBER_BG,
  },
  pillText: {
    color: AMBER_TEXT,
    fontFamily: FigtreeFont.extraBold,
    fontSize: 14,
  },
  note: {
    marginTop: 20,
    color: SUBTITLE,
    fontFamily: FigtreeFont.medium,
    fontSize: 16,
    lineHeight: 24,
  },
  buttons: {
    marginTop: 32,
  },
  nextButton: {
    height: 60,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "stretch",
    flexShrink: 0,
    borderRadius: 18,
    backgroundColor: PRIMARY,
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
});
