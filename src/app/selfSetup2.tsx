import { AppText } from "@/components/app-test";
import { BackButton } from "@/components/back-button";
import { BottomSheet } from "@/components/bottom-sheet";
import { SingleTimePicker } from "@/components/time-window-picker";
import { FigtreeFont, FontFamily } from "@/constants/fonts";
import { useCaregiverSetup } from "@/context/caregiver-setup";
import { formatTime } from "@/utils/format-time";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StepProgress } from "@/components/step-progress";
import AfternoonIcon from "@/components/icons/AfternoonIcon";
import EveningIcon from "@/components/icons/EveningIcon";
import MessageIcon from "@/components/icons/MessageIcon";
import MiraIcon from "@/components/icons/MiraIcon";
import MorningIcon from "@/components/icons/MorningIcon";
import PhoneIcon from "@/components/icons/PhoneIcon";
const INK = "#15163A";
const SUBTITLE = "#54566E";
const PRIMARY = "#4338CA";
const BACKGROUND = "#F5F4FA";
const BORDERCOLOR = "#E6E4EF";
const SUN = "#FFE8DB";
const SURFACE = "#DCD9E8";
const LILAC = "#E7E4FB";
const SELECTED_BG = "#F1EFFD";
const PURPLE = "#2D2A8C";
const AMBER_BG = "#FFF3D1";

// How long the person has to check in after the time they pick
const CHECK_IN_MINUTES = 120;

type PeriodId = "morning" | "afternoon" | "evening";

const PERIODS: {
  id: PeriodId;
  label: string;
  start: number; // minutes after midnight
  iconBg: string;
  Icon: typeof MorningIcon;
}[] = [
  { id: "morning", label: "Morning", start: 9 * 60, iconBg: SUN, Icon: MorningIcon },
  { id: "afternoon", label: "Afternoon", start: 13 * 60, iconBg: AMBER_BG, Icon: AfternoonIcon },
  { id: "evening", label: "Evening", start: 19 * 60, iconBg: LILAC, Icon: EveningIcon },
];

function periodOf(minutes: number): PeriodId {
  if (minutes < 12 * 60) return "morning";
  if (minutes < 17 * 60) return "afternoon";
  return "evening";
}

export default function SelfSetup2() {
  const {
    yourFirstName,
    windowStart: start,
    method,
    update,
  } = useCaregiverSetup();
  const name = yourFirstName.trim();
  const period = periodOf(start);

  // The window runs from the chosen time, kept inside the same day
  const setTime = (value: number) =>
    update({
      windowStart: value,
      windowEnd: Math.min(value + CHECK_IN_MINUTES, 24 * 60 - 1),
    });
  const windowMinutes = Math.min(CHECK_IN_MINUTES, 24 * 60 - 1 - start);
  const windowText =
    windowMinutes === CHECK_IN_MINUTES ? "2 hours" : `${windowMinutes} minutes`;

  const [sheetOpen, setSheetOpen] = useState(false);

  const greeting = `Good ${period}${name ? `, ${name}` : ""}!`;
  const preview =
    method === "call"
      ? {
          title: `Each ${period} you'll get a call`,
          sender: "Mira is calling",
          body: `${greeting} Press 1 to let everyone know you're okay.`,
          icon: <PhoneIcon />,
          iconBg: SUN,
        }
      : method === "text"
        ? {
            title: `Each ${period} you'll get a text`,
            sender: "Mira",
            body: `${greeting} Reply OK to let everyone know you're okay.`,
            icon: <MessageIcon />,
            iconBg: LILAC,
          }
        : {
            title: `Each ${period} you'll see`,
            sender: "Mira",
            body: `${greeting} Tap to let everyone know you're okay.`,
            icon: <MiraIcon size={26} strokeColor="#fff" />,
            iconBg: PRIMARY,
          };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.header}>
          <BackButton />
          <StepProgress step={2} total={3} />
        </View>
        <View style={styles.callout}>
          <AppText style={styles.calloutText}>
            When is a good time each day?
          </AppText>
        </View>
        <View style={styles.periods} accessibilityRole="radiogroup">
          {PERIODS.map(({ id, label, start: periodStart, iconBg, Icon }) => {
            const selected = period === id;
            return (
              <Pressable
                key={id}
                onPress={() => {
                  if (!selected) setTime(periodStart);
                }}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                accessibilityLabel={label}
                style={({ pressed }) => [
                  styles.periodCard,
                  selected && styles.periodCardSelected,
                  pressed && styles.pressed,
                ]}
              >
                <View style={[styles.periodIcon, { backgroundColor: iconBg }]}>
                  <Icon />
                </View>
                <AppText
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.8}
                  style={[styles.periodLabel, selected && styles.periodLabelSelected]}
                >
                  {label}
                </AppText>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.timeCard}>
          <View>
            <AppText style={styles.timeCardLabel}>Around</AppText>
            <AppText style={styles.timeCardValue}>{formatTime(start)}</AppText>
          </View>
          <Pressable
            onPress={() => setSheetOpen(true)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Change time"
          >
            <AppText style={styles.timeCardButtonText}>Change</AppText>
          </Pressable>
        </View>
        <View style={styles.preview}>
          <AppText style={styles.previewTitle}>{preview.title}</AppText>
          <View style={styles.previewCard}>
            <View style={[styles.previewIcon, { backgroundColor: preview.iconBg }]}>
              {preview.icon}
            </View>
            <View style={styles.previewText}>
              <AppText style={styles.previewSender}>{preview.sender}</AppText>
              <AppText style={styles.previewBody}>{preview.body}</AppText>
            </View>
          </View>
        </View>
        <AppText style={styles.note}>
          You&apos;ll have {windowText} to check in. We&apos;ll send a gentle
          reminder if you forget.
        </AppText>
        <View style={styles.buttons}>
          <Pressable
            style={({ pressed }) => [
              styles.nextButton,
              pressed && styles.pressed,
            ]}
            accessibilityLabel="Next"
            accessibilityRole="button"
            onPress={() => router.push("/caregiverSetup3")}
          >
            <AppText style={styles.nextButtonText}>Next</AppText>
          </Pressable>
        </View>
      </ScrollView>
      <BottomSheet
        visible={sheetOpen}
        title="What time?"
        onClose={() => setSheetOpen(false)}
      >
        <SingleTimePicker value={start} onChange={setTime} />
        <Pressable
          style={styles.nextButton}
          onPress={() => setSheetOpen(false)}
          accessibilityRole="button"
        >
          <AppText style={styles.nextButtonText}>Save</AppText>
        </Pressable>
      </BottomSheet>
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
    paddingBottom: 24,
  },
  header: {
    flexDirection: "row",
    gap: 16,
    alignSelf: "stretch",
    alignItems: "center",
    marginTop: 36,
  },
  callout: {
    alignSelf: "stretch",
    marginTop: 24,
  },
  calloutText: {
    color: INK,
    fontFamily: FontFamily.bold,
    fontSize: 32,
    lineHeight: 35.2,
    letterSpacing: -0.7,
  },
  periods: {
    marginTop: 24,
    flexDirection: "row",
    gap: 10,
  },
  periodCard: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 4,
    alignItems: "center",
    gap: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDERCOLOR,
    backgroundColor: "#fff",
  },
  periodCardSelected: {
    borderWidth: 2,
    borderColor: PRIMARY,
    backgroundColor: SELECTED_BG,
    paddingVertical: 13, // 1px less, because the border grew by 1px
    paddingHorizontal: 3,
  },
  periodIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  periodLabel: {
    color: INK,
    fontFamily: FigtreeFont.bold,
    fontSize: 16,
  },
  periodLabelSelected: {
    color: PURPLE,
    fontFamily: FigtreeFont.extraBold,
  },
  timeCard: {
    marginTop: 20,
    paddingVertical: 18,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "space-between",
    flexDirection: "row",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: SURFACE,
    backgroundColor: "#fff",
  },
  timeCardLabel: {
    fontFamily: FigtreeFont.regular,
    fontSize: 16,
    color: SUBTITLE,
  },
  timeCardValue: {
    color: INK,
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -0.6,
    fontFamily: FigtreeFont.extraBold,
  },
  timeCardButtonText: {
    color: PRIMARY,
    fontFamily: FigtreeFont.extraBold,
    fontSize: 18,
  },
  preview: {
    marginTop: 20,
    gap: 10,
    display: "flex",
    
  },
  previewTitle: {
    color: SUBTITLE,
    fontFamily: FigtreeFont.bold,
    fontSize: 16,
  },
  previewCard: {
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    gap: 14,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: BORDERCOLOR,
    backgroundColor: "#fff",
  },
  previewIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  previewText: {
    flex: 1,
    gap: 2,
  },
  previewSender: {
    color: INK,
    fontFamily: FigtreeFont.extraBold,
    fontSize: 16,
  },
  previewBody: {
    color: INK,
    fontFamily: FigtreeFont.medium,
    fontSize: 18,
    lineHeight: 26,
  },
  note: {
    marginTop: 20,
    color: SUBTITLE,
    fontFamily: FigtreeFont.medium,
    fontSize: 16,
    lineHeight: 24,
  },
  buttons: {
    marginTop: 49,
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
  disabled: {
    opacity: 0.4,
  },
  sheetNote: {
    fontFamily: FigtreeFont.medium,
    fontSize: 16,
    color: SUBTITLE,
  },
});
