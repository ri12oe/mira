import { AppText } from "@/components/app-test";
import { BottomSheet } from "@/components/bottom-sheet";
import { RadioCircle } from "@/components/radio-circle";
import { ITEM_H, WheelColumn } from "@/components/wheels-column";
import { FigtreeFont, FontFamily } from "@/constants/fonts";
import { useCaregiverSetup } from "@/context/caregiver-setup";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
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

const WINDOWS = [
  {
    id: "early",
    label: "7–9 AM",
    range: "7:00 AM – 9:00 AM",
    start: 7 * 60,
    end: 9 * 60,
  },
  {
    id: "mid",
    label: "9–11 AM",
    range: "9:00 AM – 11:00 AM",
    start: 9 * 60,
    end: 11 * 60,
  },
  {
    id: "late",
    label: "11 AM – 1 PM",
    range: "11:00 AM – 1:00 PM",
    start: 11 * 60,
    end: 13 * 60,
  },
  // add the third one yourself
];
const DAY_LETTERS = ["M", "T", "W", "T", "F", "S", "S"];
const DAY_NAMES = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

function describeDays(days: number[]): string {
  const key = days.join(",");

  if (days.length === 7) return "Every day";
  if (days.length === 0) return "Pick at least one day";
  if (key === "0,1,2,3,4") return "Weekdays";
  if (key === "5,6") return "Weekends";

  const names = days.map((i) => DAY_NAMES[i]);

  if (names.length === 1) return `Every ${names[0]}`;

  const allButLast = names.slice(0, -1).join(", ");
  const last = names[names.length - 1];
  return `Every ${allButLast} and ${last}`;
}

const EXTRA_OPTIONS = [15, 30, 60, 120];

function formatMinutes(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m} minutes`;
  const hourText = h === 1 ? "1 hour" : `${h} hours`;
  return m === 0 ? hourText : `${hourText} ${m} min`;
}

function formatTime(totalMinutes: number): string {
  const inDay = ((totalMinutes % 1440) + 1440) % 1440;
  const h24 = Math.floor(inDay / 60);
  const m = inDay % 60;

  const period = h24 < 12 ? "AM" : "PM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  const mm = m.toString().padStart(2, "0");

  return `${h12}:${mm} ${period}`;
}

const HOURS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const MINUTES = [0, 15, 30, 45];
const PERIODS = ["AM", "PM"] as const;

type Period = (typeof PERIODS)[number]; // "AM" | "PM"

function toParts(total: number) {
  const h24 = Math.floor(total / 60);
  const minute = total % 60;
  const period: Period = h24 < 12 ? "AM" : "PM";
  const hour = h24 % 12 === 0 ? 12 : h24 % 12;
  return { hour, minute, period };
}

function fromParts(hour: number, minute: number, period: Period) {
  const h24 = (hour % 12) + (period === "PM" ? 12 : 0);
  return h24 * 60 + minute;
}

const EXTRA_HOURS = [0, 1, 2, 3];
const EXTRA_MINUTES = [0, 15, 30, 45];

export default function CaregiverSetup2() {
  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/whoUsesMira");
    }
  };
  const { displayName } = useCaregiverSetup();

  const [start, setStart] = useState(9 * 60);
  const [end, setEnd] = useState(11 * 60);
  const [editing, setEditing] = useState<"from" | "until">("from");

  // Which chip matches the current times? (undefined if the user picked custom times)
  const matchingWindowId = WINDOWS.find(
    (w) => w.start === start && w.end === end,
  )?.id;
  const rangeText = `${formatTime(start)} – ${formatTime(end)}`;
  const isValid = end > start;

  const [days, setDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const toggleDay = (i: number) => {
    setDays((prev) =>
      prev.includes(i)
        ? prev.filter((d) => d !== i)
        : [...prev, i].sort((a, b) => a - b),
    );
  };
  const [sheet, setSheet] = useState<null | "window" | "extraTime">(null);
  const [extraMinutes, setExtraMinutes] = useState(30);
  const extraHour = Math.floor(extraMinutes / 60);
  const extraMin = extraMinutes % 60;

  const setExtra = (hour: number, minute: number) => {
    const total = hour * 60 + minute;
    setExtraMinutes(Math.max(15, total)); // never allow 0 minutes
  };
  const windowEnds = end;
  const alertAt = windowEnds + extraMinutes;

  const editingValue = editing === "from" ? start : end;
  const parts = toParts(editingValue);

  const setEditingValue = (hour: number, minute: number, period: Period) => {
    const next = fromParts(hour, minute, period);
    if (editing === "from") setStart(next);
    else setEnd(next);
  };
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Pressable
            onPress={goBack}
            accessibilityLabel="Go Back"
            accessibilityRole="button"
            hitSlop={12}
            style={styles.backButton}
          >
            <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
              <Path
                d="M13.75 5.5L8.25 11L13.75 16.5"
                stroke="#15163A"
                strokeWidth={2.2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </Pressable>
          <View style={styles.barContainer}>
            <AppText style={styles.barText}>Step 2 of 3</AppText>
            <View style={styles.bar}>
              <View style={[styles.barSegment, styles.barActive]} />
              <View style={[styles.barSegment, styles.barActive]} />
              <View style={styles.barSegment} />
            </View>
          </View>
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
                <Pressable
                  key={w.id}
                  onPress={() => {
                    setStart(w.start);
                    setEnd(w.end);
                  }}
                  style={[styles.chip, selected && styles.chipSelected]}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  accessibilityLabel={w.label}
                >
                  <AppText
                    style={[
                      styles.chipText,
                      selected && styles.chipTextSelected,
                    ]}
                  >
                    {w.label}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
          <View style={styles.windowSummary}>
            <View style={styles.windowSummaryContent}>
              <View style={styles.windowSummaryIcon}>
                <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
                  <Path
                    d="M3.66669 15.5834H18.3334"
                    stroke="#C2551F"
                    strokeWidth={2.01667}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <Path
                    d="M6.41669 15.5833C6.41669 14.3678 6.89957 13.202 7.75911 12.3424C8.61866 11.4829 9.78444 11 11 11C12.2156 11 13.3814 11.4829 14.2409 12.3424C15.1005 13.202 15.5834 14.3678 15.5834 15.5833"
                    stroke="#C2551F"
                    strokeWidth={2.01667}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <Path
                    d="M11 4.58337V7.33337M5.04169 8.70837L6.69169 9.90004M16.9584 8.70837L15.3084 9.90004"
                    stroke="#C2551F"
                    strokeWidth={2.01667}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
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
        <View style={styles.whichDays}>
          <View style={styles.whichDaysHeader}>
            <AppText style={styles.whichDaysHeaderText}>Which days</AppText>
            <AppText style={styles.whichDaysHeaderSubText}>
              {describeDays(days)}
            </AppText>
          </View>
          <View style={styles.whichDaysContent}>
            {DAY_LETTERS.map((letter, i) => {
              const on = days.includes(i);

              return (
                <Pressable
                  key={i}
                  onPress={() => toggleDay(i)}
                  style={[styles.days, on ? styles.dayOn : styles.dayOff]}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: on }}
                  accessibilityLabel={DAY_NAMES[i]}
                >
                  <AppText
                    style={[
                      styles.daysText,
                      on ? styles.dayTextOn : styles.dayTextOff,
                    ]}
                  >
                    {letter}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        </View>
        <View style={styles.ifdontCheckIn}>
          <AppText style={styles.ifdontCheckInText}>
            If {displayName} doesn't check in
          </AppText>
          <View style={styles.methods}>
            <View style={styles.reminder}>
              <View style={styles.reminderIcon}>
                <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
                  <Path
                    d="M5.5 14.6667V10.0834C5.5 8.62468 6.07946 7.22574 7.11091 6.19429C8.14236 5.16284 9.54131 4.58337 11 4.58337C12.4587 4.58337 13.8576 5.16284 14.8891 6.19429C15.9205 7.22574 16.5 8.62468 16.5 10.0834V14.6667L17.875 16.5H4.125L5.5 14.6667Z"
                    stroke="#9A6408"
                    strokeWidth={2.01667}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <Path
                    d="M9.16669 18.7916C9.16669 19.2779 9.35984 19.7442 9.70366 20.088C10.0475 20.4318 10.5138 20.625 11 20.625C11.4863 20.625 11.9526 20.4318 12.2964 20.088C12.6402 19.7442 12.8334 19.2779 12.8334 18.7916"
                    stroke="#9A6408"
                    strokeWidth={2.01667}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </View>
              <AppText style={styles.reminderText}>
                We send {displayName} a gentle reminder
              </AppText>
            </View>
            <View style={styles.divider}></View>
            <View style={styles.alert}>
              <View style={styles.alertIcon}>
                <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
                  <Path
                    d="M11 19.25C15.5563 19.25 19.25 15.5563 19.25 11C19.25 6.44365 15.5563 2.75 11 2.75C6.44365 2.75 2.75 6.44365 2.75 11C2.75 15.5563 6.44365 19.25 11 19.25Z"
                    stroke="#4338CA"
                    strokeWidth={2.01667}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <Path
                    d="M11 6.41663V11L13.75 12.8333"
                    stroke="#4338CA"
                    strokeWidth={2.01667}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
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
            onPress={() => router.push("/caregiverSetup2")}
          >
            <AppText style={styles.nextButtonText}>Next</AppText>
          </Pressable>
        </View>
      </View>
      <BottomSheet
        visible={sheet === "window"}
        title="Check-in window"
        onClose={() => setSheet(null)}
      >
        <View style={styles.chips}>
          {WINDOWS.map((w) => {
            const selected = matchingWindowId === w.id;
            return (
              <Pressable
                key={w.id}
                onPress={() => {
                  setStart(w.start);
                  setEnd(w.end);
                }}
                style={[styles.chip, selected && styles.chipSelected]}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
              >
                <AppText
                  style={[styles.chipText, selected && styles.chipTextSelected]}
                >
                  {w.label}
                </AppText>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.fromUntil}>
          {(["from", "until"] as const).map((which) => {
            const active = editing === which;
            const value = which === "from" ? start : end;
            return (
              <Pressable
                key={which}
                onPress={() => setEditing(which)}
                style={[styles.timeBox, active && styles.timeBoxActive]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={`${which === "from" ? "From" : "Until"} ${formatTime(value)}`}
              >
                <AppText style={styles.timeBoxLabel}>
                  {which === "from" ? "From" : "Until"}
                </AppText>
                <AppText style={styles.timeBoxValue}>
                  {formatTime(value)}
                </AppText>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.wheel}>
          <View style={[styles.wheelHighlight, { pointerEvents: "none" }]} />
          <WheelColumn
            label="Hour"
            items={HOURS}
            selectedIndex={HOURS.indexOf(parts.hour)}
            onChange={(i) =>
              setEditingValue(HOURS[i], parts.minute, parts.period)
            }
          />
          <WheelColumn
            label="Minute"
            items={MINUTES}
            selectedIndex={Math.max(0, MINUTES.indexOf(parts.minute))}
            onChange={(i) =>
              setEditingValue(parts.hour, MINUTES[i], parts.period)
            }
            format={(m) => String(m).padStart(2, "0")}
          />
          <WheelColumn
            label="AM or PM"
            items={[...PERIODS]}
            selectedIndex={PERIODS.indexOf(parts.period)}
            onChange={(i) =>
              setEditingValue(parts.hour, parts.minute, PERIODS[i])
            }
          />
        </View>

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
        <View style={styles.optionList}>
          {EXTRA_OPTIONS.map((min, index) => {
            const selected = extraMinutes === min;
            const isLast = index === EXTRA_OPTIONS.length - 1;
            return (
              <Pressable
                key={min}
                onPress={() => setExtraMinutes(min)}
                style={[
                  styles.optionRow,
                  selected && styles.optionRowSelected,
                  !isLast && styles.optionRowDivider,
                ]}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
              >
                <View style={styles.optionLabel}>
                  <AppText style={styles.optionText}>
                    {formatMinutes(min)}
                  </AppText>
                  {min === 30 && (
                    <AppText style={styles.alertLabelRecommend}>
                      Recommended
                    </AppText>
                  )}
                </View>
                <RadioCircle selected={selected} />
              </Pressable>
            );
          })}
        </View>

        <AppText style={styles.orCustom}>Or pick your own</AppText>

        <View style={styles.wheel}>
          <View style={[styles.wheelHighlight, { pointerEvents: "none" }]} />
          <WheelColumn
            label="Hours"
            items={EXTRA_HOURS}
            selectedIndex={Math.max(0, EXTRA_HOURS.indexOf(extraHour))}
            onChange={(i) => setExtra(EXTRA_HOURS[i], extraMin)}
            format={(h) => `${h} hr`}
            width={90}
          />
          <WheelColumn
            label="Minutes"
            items={EXTRA_MINUTES}
            selectedIndex={Math.max(0, EXTRA_MINUTES.indexOf(extraMin))}
            onChange={(i) => setExtra(extraHour, EXTRA_MINUTES[i])}
            format={(m) => `${String(m).padStart(2, "0")} min`}
            width={100}
          />
        </View>

        <View style={styles.timeSummary}>
          <View style={styles.timeSummaryEnds}>
            <AppText style={styles.timeSummaryText}>Windows ends</AppText>
            <AppText style={styles.timeSummaryTime}>
              {formatTime(windowEnds)}
            </AppText>
          </View>
          <Svg width={48} height={12} viewBox="0 0 48 12" fill="none">
            <Path
              d="M2 6H42M36 11L42 6L36 1"
              stroke="#8B8DA3"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
          <View style={styles.timeSummaryAlert}>
            <AppText style={styles.timeSummaryText}>You're alerted</AppText>
            <AppText style={styles.timeSummaryTimeHightlighted}>
              {formatTime(alertAt)}
            </AppText>
          </View>
        </View>

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
  },
  content: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    borderColor: BORDERCOLOR,
    borderWidth: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  header: {
    flexDirection: "row",
    gap: 16,
    alignSelf: "stretch",
    alignItems: "center",
    marginTop: 36,
  },
  barContainer: {
    alignItems: "flex-start",
    gap: 8,
    flexDirection: "column",
    flex: 1,
  },
  barText: {
    fontFamily: FigtreeFont.bold,
    color: SUBTITLE,
    fontSize: 14,
    lineHeight: 18.2,
  },
  bar: {
    alignSelf: "stretch",
    alignItems: "flex-start",
    gap: 6,
    flexDirection: "row",
  },
  barSegment: {
    height: 4,
    backgroundColor: SURFACE,
    borderRadius: 3,
    flex: 1,
  },
  barActive: {
    backgroundColor: PRIMARY,
  },
  callout: {
    alignSelf: "stretch",
    marginTop: 24,
  },
  calloutText: {
    color: INK,
    fontFamily: FontFamily.extraBold,
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
  chip: {
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: SURFACE,
    backgroundColor: "#fff",
  },
  chipText: {
    color: INK,
    fontSize: 16,
    fontFamily: FigtreeFont.bold,
  },
  chipSelected: {
    borderWidth: 2,
    borderColor: PRIMARY,
    backgroundColor: SELECTED_BG,
  },
  chipTextSelected: {
    color: PURPLE,
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
    gap: 10,
  },
  whichDaysHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  whichDaysHeaderText: {
    color: INK,
    fontSize: 17,
    fontFamily: FigtreeFont.bold,
    lineHeight: 22.1,
  },
  whichDaysHeaderSubText: {
    color: SUBTITLE,
    fontSize: 15,
    lineHeight: 21,
    fontFamily: FigtreeFont.bold,
    flexShrink: 1,
    textAlign: "right",
    marginLeft: 12,
  },
  whichDaysContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  days: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 22,
  },
  dayOn: {
    backgroundColor: PRIMARY,
  },
  dayOff: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: SURFACE,
  },
  daysText: {
    fontSize: 16,
    fontFamily: FigtreeFont.bold,
  },
  dayTextOn: {
    color: "#fff",
  },
  dayTextOff: {
    color: INK,
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
    gap: 8,
    flexDirection: "row",
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
  optionList: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDERCOLOR,
    overflow: "hidden",
  },
  optionRow: {
    height: 56,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
  },
  optionRowSelected: {
    backgroundColor: SELECTED_BG,
  },
  optionRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: "#EFEDF5",
  },
  optionLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  optionText: {
    fontFamily: FigtreeFont.bold,
    fontSize: 17,
    color: INK,
  },
  timeSummary: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    justifyContent: "space-between",
    alignItems: "center",
    alignSelf: "stretch",
    flexDirection: "row",
    borderRadius: 16,
    backgroundColor: BACKGROUND,
  },
  timeSummaryEnds: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 2,
  },
  timeSummaryText: {
    fontFamily: FigtreeFont.extraBold,
    fontSize: 13,
    lineHeight: 16.9,
    color: SUBTITLE,
  },
  timeSummaryTime: {
    color: INK,
    fontSize: 17,
    lineHeight: 22.1,
    fontFamily: FigtreeFont.extraBold,
  },
  timeSummaryAlert: {
    flexDirection: "column",
    alignItems: "flex-end",
    gap: 2,
  },
  timeSummaryTimeHightlighted: {
    fontSize: 17,
    lineHeight: 22.1,
    fontFamily: FigtreeFont.extraBold,
    color: ALERT,
  },
  fromUntil: {
    flexDirection: "row",
    gap: 10,
  },
  timeBox: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: SURFACE,
    backgroundColor: "#fff",
    gap: 2,
  },
  timeBoxActive: {
    borderWidth: 2,
    borderColor: PRIMARY,
    backgroundColor: SELECTED_BG,
    paddingVertical: 11, // 1px less, because the border grew by 1px
    paddingHorizontal: 15,
  },
  timeBoxLabel: {
    fontFamily: FigtreeFont.bold,
    fontSize: 14,
    color: SUBTITLE,
    lineHeight: 18.2,
  },
  timeBoxValue: {
    fontFamily: FigtreeFont.extraBold,
    fontSize: 24,
    color: INK,
    lineHeight: 27.6,
    letterSpacing: -0.4,
  },
  wheel: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 28,
    position: "relative",
  },
  wheelHighlight: {
    position: "absolute",
    left: 0,
    right: 0,
    top: ITEM_H * 2,
    height: ITEM_H,
    borderRadius: 16,
    backgroundColor: SELECTED_BG,
  },
  orCustom: {
    fontFamily: FigtreeFont.bold,
    fontSize: 15,
    color: SUBTITLE,
  },
});
