import { AppText } from "@/components/app-test";
import { BackButton } from "@/components/back-button";
import { BottomSheet } from "@/components/bottom-sheet";
import { Chip } from "@/components/chip";
import { ExtraTimePicker, formatMinutes } from "@/components/extra-time-picker";
import { TimeWindowPicker } from "@/components/time-window-picker";
import { WhichDays } from "@/components/which-days";
import { WINDOWS } from "@/constants/check-in-windows";
import { FigtreeFont, FontFamily } from "@/constants/fonts";
import { useCaregiverSetup } from "@/context/caregiver-setup";
import { formatTimeRange } from "@/utils/format-time-short";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StepProgress } from "@/components/step-progress";
import SunRiseIcon from "@/components/icons/SunRiseIcon";
import AlarmIcon from "@/components/icons/AlarmIcon";
import ClockIcon from "@/components/icons/ClockIcon";
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
const MUTED = "#8B8DA3";

export default function CaregiverSetup2() {
  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/whoUsesMira");
    }
  };
  const {
    displayName,
    windowStart: start,
    windowEnd: end,
    update,
  } = useCaregiverSetup();

  const setStart = (value: number) => update({ windowStart: value });
  const setEnd = (value: number) => update({ windowEnd: value });

  // Which chip matches the current times? (undefined if the user picked custom times)
  const matchingWindowId = WINDOWS.find(
    (w) => w.start === start && w.end === end,
  )?.id;
  const rangeText = formatTimeRange(start, end);
  const isValid = end > start;

  const [days, setDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [sheet, setSheet] = useState<null | "window" | "extraTime">(null);
  const [extraMinutes, setExtraMinutes] = useState(30);
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.header}>
          <BackButton onPress={goBack} />
          <StepProgress step={2} total={3} />
        </View>
        <View style={styles.callout}>
          <AppText style={styles.calloutText}>
            When should {displayName} be checked in?
          </AppText>
        </View>
        <View style={styles.checkInWindow}>
          <AppText style={styles.checkInWindowText}>Check-in window</AppText>
          <View style={styles.chips}>
            {WINDOWS.map((w) => {
              const selected = matchingWindowId === w.id;
              return (
                <Chip
                  key={w.id}
                  label={w.label}
                  selected={selected}
                  onPress={() => {
                    setStart(w.start);
                    setEnd(w.end);
                  }}
                />
              );
            })}
          </View>
          <View style={styles.windowSummary}>
            <View style={styles.windowSummaryContent}>
              <View style={styles.windowSummaryIcon}>
                <SunRiseIcon />
              </View>
              <View style={styles.windowSummaryLabel}>
                <AppText style={styles.windowSummaryHeader}>
                  {displayName} checks in between
                </AppText>
                <AppText style={styles.windowSummaryBody}>{rangeText}</AppText>
              </View>
            </View>
            <Pressable
              onPress={() => setSheet("window")}
              hitSlop={10}
              accessibilityRole="button"
            >
              <AppText style={styles.windowSummaryButtonText}>Change</AppText>
            </Pressable>
          </View>
        </View>
        <WhichDays days={days} onChange={setDays} style={styles.whichDays} />
        <View style={styles.ifdontCheckIn}>
          <AppText style={styles.ifdontCheckInText}>
            If {displayName} doesn&apos; check in
          </AppText>
          <View style={styles.methods}>
            <View style={styles.reminder}>
              <View style={styles.reminderIcon}>
                <AlarmIcon />
              </View>
              <AppText style={styles.reminderText}>
                We send {displayName} a gentle reminder
              </AppText>
            </View>
            <View style={styles.divider}></View>
            <View style={styles.alert}>
              <View style={styles.alertIcon}>
                <ClockIcon />
              </View>
              <View style={styles.alertLabel}>
                <AppText style={styles.alertLabelHeader}>
                  Then wait before alerting you
                </AppText>
                <View style={styles.alertLabelDescription}>
                  <AppText style={styles.alertLabelDescriptionText}>
                    {formatMinutes(extraMinutes)}
                  </AppText>
                  {extraMinutes === 30 && (
                    <AppText style={styles.alertLabelRecommend}>
                      Recommended
                    </AppText>
                  )}
                </View>
              </View>
              <Pressable
                onPress={() => setSheet("extraTime")}
                hitSlop={10}
                accessibilityRole="button"
              >
                <AppText style={styles.windowSummaryButtonText}>Change</AppText>
              </Pressable>
            </View>
          </View>
        </View>
        <View style={styles.buttons}>
          <Pressable
            disabled={days.length === 0}
            style={({ pressed }) => [
              styles.nextButton,
              pressed && styles.pressed,
              days.length === 0 && styles.disabled,
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
        visible={sheet === "window"}
        title="Check-in window"
        onClose={() => setSheet(null)}
      >
        <View style={styles.chips}>
          {WINDOWS.map((w) => {
            const selected = matchingWindowId === w.id;
            return (
              <Chip
                key={w.id}
                label={w.label}
                selected={selected}
                onPress={() => {
                  setStart(w.start);
                  setEnd(w.end);
                }}
              />
            );
          })}
        </View>
        <TimeWindowPicker
          start={start}
          end={end}
          onChangeStart={setStart}
          onChangeEnd={setEnd}
        />

        <Pressable
          style={styles.nextButton}
          onPress={() => setSheet(null)}
          accessibilityRole="button"
        >
          <AppText style={styles.nextButtonText}>Save</AppText>
        </Pressable>
      </BottomSheet>
      <BottomSheet
        visible={sheet === "extraTime"}
        title="Extra time before alerts"
        subtitle="After the window ends, how long should we wait before alerting you?"
        onClose={() => setSheet(null)}
      >
        <ExtraTimePicker
          extraMinutes={extraMinutes}
          onChange={setExtraMinutes}
          windowEnd={end}
        />

        <Pressable
          style={styles.nextButton}
          onPress={() => setSheet(null)}
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
    fontFamily: FigtreeFont.extraBold,
  },
  windowSummaryButtonText: {
    color: PRIMARY,
    fontFamily: FigtreeFont.extraBold,
    fontSize: 16,
  },
  whichDays: {
    marginTop: 24,
  },
  ifdontCheckIn: {
    marginTop: 24,
    gap: 10,
    flexDirection: "column",
  },
  ifdontCheckInText: {
    color: INK,
    fontSize: 17,
    lineHeight: 22.1,
    fontFamily: FigtreeFont.bold,
  },
  methods: {
    flexDirection: "column",
    alignItems: "flex-start",
    alignSelf: "stretch",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDERCOLOR,
    backgroundColor: "#fff",
  },
  reminder: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "center",
    gap: 14,
    alignSelf: "stretch",
    flexDirection: "row",
  },
  reminderIcon: {
    width: 42,
    height: 42,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 13,
    backgroundColor: "#FFF3D1",
  },
  reminderText: {
    flex: 1,
    color: INK,
    fontSize: 16,
    fontFamily: FigtreeFont.bold,
  },
  divider: {
    height: 1,
    backgroundColor: "#EFEDF5",
  },
  alert: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 14,
    alignItems: "center",
    alignSelf: "stretch",
    flexDirection: "row",
  },
  alertIcon: {
    width: 42,
    height: 42,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 13,
    backgroundColor: LILAC,
  },
  alertLabel: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 2,
    flex: 1,
  },
  alertLabelHeader: {
    alignSelf: "stretch",
    fontSize: 16,
    fontFamily: FigtreeFont.bold,
    color: INK,
  },
  alertLabelDescription: {
    alignItems: "center",
    columnGap: 8,
    rowGap: 4,
    flexDirection: "row",
    flexWrap: "wrap",
  },
  alertLabelDescriptionText: {
    color: SUBTITLE,
    fontSize: 15,
    fontFamily: FigtreeFont.bold,
  },
  alertLabelRecommend: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    alignItems: "flex-start",
    borderRadius: 999,
    backgroundColor: MINT,
    color: GREEN,
    fontFamily: FigtreeFont.extraBold,
    fontSize: 12,
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
