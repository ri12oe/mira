import { AppText } from "@/components/app-test";
import { BackButton } from "@/components/back-button";
import CheckBadgeLargeIcon from "@/components/icons/CheckBadgeLargeIcon";
import MessageIcon from "@/components/icons/MessageIcon";
import PhoneIcon from "@/components/icons/PhoneIcon";
import { FigtreeFont, FontFamily } from "@/constants/fonts";
import { useCaregiverSetup } from "@/context/caregiver-setup";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
const INK = "#15163A";
const BACKGROUND = "#F5F4FA";
const SUBTITLE = "#54566E";
const MINT = "#DDF3EE";
const GREEN = "#134A40";
const PRIMARY = "#4338CA";
const BACKGROUNDSLIDER = "#E9E7F2";
const BORDER = "#E6E4EF";

export default function CheckInNow() {
  const {
    displayName: primaryName,
    phone: primaryPhone,
    yourFirstName,
    method: primaryMethod,
    windowStart: primaryWindowStart,
    windowEnd: primaryWindowEnd,
    people,
    backups: primaryBackups,
    addPerson,
  } = useCaregiverSetup();
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <BackButton />
          <AppText style={styles.topBarText}>Check in now</AppText>
        </View>
        <View style={styles.header}>
          <AppText style={styles.headerText}>
            Check on {primaryName} now
          </AppText>
          <AppText style={styles.headerSubtitle}>
            We&apos;ll ask {primaryName} to confirm okay, even outside usual
            time.
          </AppText>
        </View>
        <View style={styles.alreadyCheckedIn}>
          <CheckBadgeLargeIcon />
          <AppText style={styles.alreadyCheckedInText}>
            {primaryName} checked in today at{" "}
            <AppText style={styles.alreadyCheckedInTextBold}>9:14 AM</AppText>{" "}
            by text.
          </AppText>
        </View>
        <View style={styles.howtoReach}>
          <AppText style={styles.howtoReachText}>
            How should we reach {primaryName}?
          </AppText>
          <View style={styles.Segmeneted}>
            <View style={[styles.option, styles.optionPressed]}>
              <MessageIcon size={20} color={PRIMARY} />
              <AppText style={[styles.optionText, styles.optionPressedText]}>
                Text
              </AppText>
            </View>
            <View style={styles.option}>
              <PhoneIcon size={20} color={SUBTITLE} />
              <AppText style={styles.optionText}>Phone Call</AppText>
            </View>
          </View>
        </View>
        <View style={styles.message}>
          <View style={styles.labelrow}>
            <AppText style={styles.labelrowText}>
              {primaryName} will get
            </AppText>
            <Pressable>
              <AppText style={styles.editButtonText}>Edit</AppText>
            </Pressable>
          </View>
          <View style={styles.messagePreview}>
            <View style={styles.bubble}>
              <AppText style={styles.bubbleText}>
                Hi {primaryName}, Jordan is checking you&apos;re okay. Reply YES
                if you&apos;re fine.
              </AppText>
            </View>
          </View>
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
    gap: 20,
    paddingHorizontal: 24,
    paddingVertical: 24,
    paddingBottom: 108,
    marginTop: 56,
  },
  topBar: {
    alignItems: "center",
    gap: 16,
    alignSelf: "stretch",
    flexDirection: "row",
  },
  topBarText: {
    fontFamily: FigtreeFont.bold,
    fontSize: 16,
    color: SUBTITLE,
  },
  header: {
    flexDirection: "column",
    gap: 8,
    alignItems: "flex-start",
    alignSelf: "stretch",
  },
  headerText: {
    color: INK,
    alignSelf: "stretch",
    fontSize: 32,
    lineHeight: 35.2,
    letterSpacing: -0.8,
    fontFamily: FontFamily.bold,
  },
  headerSubtitle: {
    alignSelf: "stretch",
    color: SUBTITLE,
    fontSize: 17,
    lineHeight: 24.65,
    fontFamily: FigtreeFont.medium,
  },
  alreadyCheckedIn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
    alignSelf: "stretch",
    borderRadius: 16,
    backgroundColor: MINT,
    flexDirection: "row",
    alignItems: "center",
  },
  alreadyCheckedInText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 21,
    fontFamily: FigtreeFont.semiBold,
    color: GREEN,
  },
  alreadyCheckedInTextBold: {
    fontSize: 15,
    lineHeight: 21,
    fontFamily: FigtreeFont.extraBold,
    color: GREEN,
  },
  howtoReach: {
    flexDirection: "column",
    gap: 8,
    alignItems: "flex-start",
    alignSelf: "stretch",
  },
  howtoReachText: {
    color: INK,
    fontSize: 16,
    fontFamily: FigtreeFont.bold,
  },
  Segmeneted: {
    flexDirection: "row",
    padding: 4,
    alignItems: "flex-start",
    gap: 4,
    alignSelf: "stretch",
    borderRadius: 18,
    backgroundColor: BACKGROUNDSLIDER,
  },
  option: {
    height: 52,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    flex: 1,
    flexDirection: "row",
  },
  optionPressed: {
    borderRadius: 14,
    backgroundColor: "#fff",
    shadowColor: "rgba(20, 23, 59, 0.10)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  optionPressedText: {
    color: PRIMARY,
    fontSize: 16,
    fontFamily: FigtreeFont.extraBold,
  },
  optionText: {
    color: SUBTITLE,
    fontSize: 16,
    fontFamily: FigtreeFont.bold,
  },
  message: {
    flexDirection: "column",
    gap: 8,
    alignItems: "flex-start",
    alignSelf: "stretch",
  },
  labelrow: {
    justifyContent: "space-between",
    alignItems: "center",
    alignSelf: "stretch",
    flexDirection: "row",
  },
  labelrowText: {
    color: INK,
    fontSize: 16,
    fontFamily: FigtreeFont.bold,
  },
  editButtonText: {
    color: PRIMARY,
    fontSize: 15,
    fontFamily: FigtreeFont.extraBold,
  },
  messagePreview: {
    padding: 14,
    flexDirection: "column",
    alignItems: "flex-start",
    alignSelf: "stretch",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: "#fff",
  },
  bubble: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: "flex-start",
    alignSelf: "stretch",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomRightRadius: 18,
    borderBottomLeftRadius: 6,
    backgroundColor: "#F1EFFD",
  },
  bubbleText: {
    flex: 1,
    color: INK,
    fontSize: 16,
    lineHeight: 23.2,
    fontFamily: FigtreeFont.semiBold,
  },
});
