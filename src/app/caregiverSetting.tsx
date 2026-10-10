import { AppText } from "@/components/app-test";
import { BottomSheet } from "@/components/bottom-sheet";
import { CaregiverTabBar } from "@/components/caregiver-tab-bar";
import {
  CheckInMethodSheet,
  METHOD_LABELS,
} from "@/components/check-in-method-sheet";
import { Chip } from "@/components/chip";
import { ExtraTimePicker, formatMinutes } from "@/components/extra-time-picker";
import ArrowRightIcon from "@/components/icons/ArrowRightIcon";
import { TimeWindowPicker } from "@/components/time-window-picker";
import { WINDOWS } from "@/constants/check-in-windows";
import { FigtreeFont, FontFamily } from "@/constants/fonts";
import { useCaregiverSetup } from "@/context/caregiver-setup";
import { formatTimeRange } from "@/utils/format-time-short";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { ToggleSwitch } from "@/components/toggle-switch";

const BACKGROUND = "#F5F4FA";
const INK = "#15163A";
const SUBTITLE = "#54566E";
const BORDERCOLOR = "#E6E4EF";
const PRIMARY = "#4338CA";

export default function CaregiverSetting() {
  const {
    firstName,
    windowStart: start,
    windowEnd: end,
    method,
    extraMinutes,
    update,
  } = useCaregiverSetup();

  const name = firstName.trim();
  const [sheet, setSheet] = useState<null | "window" | "method" | "extraTime">(
    null,
  );
  const [paused, setPaused] = useState(false);
  const [alsoText, setAlsoText] = useState(true);

  const setStart = (value: number) => update({ windowStart: value });
  const setEnd = (value: number) => update({ windowEnd: value });
  const matchingWindowId = WINDOWS.find(
    (w) => w.start === start && w.end === end,
  )?.id;

  const signOut = () => {
    if (router.canDismiss()) router.dismissAll();
    router.replace("/");
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <AppText style={styles.title}>Settings</AppText>
        <View style={styles.checkIn}>
          <AppText style={styles.checkInText}>
            {name ? `${name}'s check in` : "Their check in"}
          </AppText>
          <View style={styles.group}>
            <Pressable
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
              onPress={() => setSheet("window")}
              accessibilityRole="button"
            >
              <AppText style={styles.rowText}>Check-in window</AppText>
              <AppText style={styles.rowValue}>
                {formatTimeRange(start, end)}
              </AppText>
              <ArrowRightIcon size={18} />
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
              onPress={() => setSheet("method")}
              accessibilityRole="button"
            >
              <AppText style={styles.rowText}>
                {name ? `How ${name} checks in` : "How they check in"}
              </AppText>
              <AppText style={styles.rowValue}>{METHOD_LABELS[method]}</AppText>
              <ArrowRightIcon size={18} />
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
              onPress={() => setSheet("extraTime")}
              accessibilityRole="button"
            >
              <AppText style={styles.rowText}>Extra time before alerts</AppText>
              <AppText style={styles.rowValue}>
                {formatMinutes(extraMinutes).replace("minutes", "min")}
              </AppText>
              <ArrowRightIcon size={18} />
            </Pressable>
            <View style={styles.rowLast}>
              <View style={styles.rowFrame}>
                <AppText style={styles.rowText2}>Pause check-ins</AppText>
                <AppText style={styles.rowValue2}>
                  For trips or hospital stays
                </AppText>
              </View>
              <ToggleSwitch
                value={paused}
                onValueChange={setPaused}
                label="Pause check-ins"
              />
            </View>
          </View>
        </View>
        <View style={styles.checkIn}>
          <AppText style={styles.checkInText}>Your alerts</AppText>
          <View style={styles.group}>
            <View style={styles.rowLast}>
              <View style={styles.rowFrame}>
                <AppText style={styles.rowText2}>Also text me</AppText>
                <AppText style={styles.rowValue2}>
                  In case notifications are off
                </AppText>
              </View>
              <ToggleSwitch
                value={alsoText}
                onValueChange={setAlsoText}
                label="Also text me"
              />
            </View>
          </View>
        </View>
        <View style={styles.checkIn}>
          <AppText style={styles.checkInText}>Account</AppText>
          <View style={styles.group}>
            <Pressable
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
              onPress={() => router.push("/caregiverProfile")}
              accessibilityRole="button"
            >
              <View style={styles.AvaterFrame}>
                <AppText style={styles.AvaterName}>J</AppText>
              </View>
              <AppText style={styles.rowText}>Your profile</AppText>
              <ArrowRightIcon size={18} />
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
              onPress={() => router.push("/helpAndSupport")}
              accessibilityRole="button"
            >
              <View
                style={[
                  styles.AvaterFrame,
                  { borderRadius: 10, backgroundColor: "#DDF3EE" },
                ]}
              >
                <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
                  <Path
                    d="M9 15.75C12.7279 15.75 15.75 12.7279 15.75 9C15.75 5.27208 12.7279 2.25 9 2.25C5.27208 2.25 2.25 5.27208 2.25 9C2.25 12.7279 5.27208 15.75 9 15.75Z"
                    stroke="#0B7A66"
                    strokeWidth={1.65}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <Path
                    d="M7.125 7.12505C7.12618 6.78729 7.21857 6.45612 7.39242 6.16653C7.56627 5.87694 7.81512 5.63969 8.11267 5.47984C8.41021 5.32 8.74542 5.2435 9.08285 5.25842C9.42029 5.27335 9.74742 5.37915 10.0297 5.56464C10.312 5.75014 10.5389 6.00844 10.6865 6.31224C10.8341 6.61605 10.8969 6.95409 10.8682 7.29064C10.8396 7.62719 10.7205 7.94975 10.5237 8.22424C10.3269 8.49872 10.0596 8.71494 9.75 8.85005C9.3 9.07505 9 9.52505 9 10.0501"
                    stroke="#0B7A66"
                    strokeWidth={1.65}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <Path
                    d="M9 12.75V13.125"
                    stroke="#0B7A66"
                    strokeWidth={1.65}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </View>
              <AppText style={styles.rowText}>Help and support</AppText>
              <ArrowRightIcon size={18} />
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
              onPress={signOut}
              accessibilityRole="button"
            >
              <View
                style={[
                  styles.AvaterFrame,
                  { borderRadius: 10, backgroundColor: "#FDE7E3" },
                ]}
              >
                <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
                  <Path
                    d="M10.5 3.75H13.5C13.6989 3.75 13.8897 3.82902 14.0303 3.96967C14.171 4.11032 14.25 4.30109 14.25 4.5V13.5C14.25 13.6989 14.171 13.8897 14.0303 14.0303C13.8897 14.171 13.6989 14.25 13.5 14.25H10.5"
                    stroke="#A52F22"
                    strokeWidth={1.65}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <Path
                    d="M7.5 6L4.5 9L7.5 12M4.5 9H11.25"
                    stroke="#A52F22"
                    strokeWidth={1.65}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </View>
              <AppText style={[styles.rowText, { color: "#A52F22" }]}>
                Sign out
              </AppText>
            </Pressable>
          </View>
        </View>
      </ScrollView>
      <CaregiverTabBar active="settings" />

      <BottomSheet
        visible={sheet === "window"}
        title="Check-in window"
        onClose={() => setSheet(null)}
      >
        <View style={styles.chips}>
          {WINDOWS.map((w) => (
            <Chip
              key={w.id}
              label={w.label}
              selected={matchingWindowId === w.id}
              onPress={() => {
                setStart(w.start);
                setEnd(w.end);
              }}
            />
          ))}
        </View>
        <TimeWindowPicker
          start={start}
          end={end}
          onChangeStart={setStart}
          onChangeEnd={setEnd}
        />
        <Pressable
          style={styles.saveButton}
          onPress={() => setSheet(null)}
          accessibilityRole="button"
        >
          <AppText style={styles.saveButtonText}>Save</AppText>
        </Pressable>
      </BottomSheet>

      <CheckInMethodSheet
        visible={sheet === "method"}
        name={name}
        method={method}
        onChange={(value) => update({ method: value })}
        onClose={() => setSheet(null)}
      />

      <BottomSheet
        visible={sheet === "extraTime"}
        title="Extra time before alerts"
        subtitle="After the window ends, how long should we wait before alerting you?"
        onClose={() => setSheet(null)}
      >
        <ExtraTimePicker
          extraMinutes={extraMinutes}
          onChange={(value) => update({ extraMinutes: value })}
          windowEnd={end}
        />
        <Pressable
          style={styles.saveButton}
          onPress={() => setSheet(null)}
          accessibilityRole="button"
        >
          <AppText style={styles.saveButtonText}>Save</AppText>
        </Pressable>
      </BottomSheet>
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
    color: INK,
    fontFamily: FontFamily.bold,
    fontSize: 32,
    lineHeight: 35.2,
    letterSpacing: -0.7,
  },
  checkIn: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 8,
    alignSelf: "stretch",
  },
  checkInText: {
    color: SUBTITLE,
    fontSize: 16,
    lineHeight: 20.8,
    fontFamily: FigtreeFont.bold,
  },
  group: {
    flexDirection: "column",
    alignItems: "flex-start",
    alignSelf: "stretch",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: BORDERCOLOR,
    backgroundColor: "#fff",
  },
  row: {
    height: 56,
    paddingHorizontal: 16,
    alignItems: "center",
    gap: 12,
    alignSelf: "stretch",
    borderBottomWidth: 1,
    borderBottomColor: BORDERCOLOR,
    flexDirection: "row",
  },
  rowText: {
    flex: 1,
    color: INK,
    fontFamily: FigtreeFont.bold,
    fontSize: 17,
    lineHeight: 22.1,
  },
  rowValue: {
    color: SUBTITLE,
    fontFamily: FigtreeFont.semiBold,
    fontSize: 16,
    lineHeight: 23.2,
  },
  rowLast: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    gap: 12,
    alignSelf: "stretch",
    flexDirection: "row",
  },
  rowFrame: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 2,
    flex: 1,
  },
  rowText2: {
    color: INK,
    fontFamily: FigtreeFont.bold,
    fontSize: 17,
    lineHeight: 22.1,
  },
  rowValue2: {
    color: SUBTITLE,
    fontFamily: FigtreeFont.medium,
    fontSize: 14,
    lineHeight: 19.6,
  },
  AvaterFrame: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 16,
    backgroundColor: "#E7E4FB",
  },
  AvaterName: {
    color: PRIMARY,
    fontSize: 14,
    lineHeight: 18.2,
    fontFamily: FigtreeFont.extraBold,
  },
  rowPressed: {
    backgroundColor: BACKGROUND,
  },
  chips: {
    alignItems: "flex-start",
    gap: 8,
    alignSelf: "stretch",
    flexDirection: "row",
  },
  saveButton: {
    height: 60,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "stretch",
    borderRadius: 18,
    backgroundColor: PRIMARY,
  },
  saveButtonText: {
    color: "#fff",
    fontFamily: FigtreeFont.bold,
    fontSize: 19,
    lineHeight: 22.8,
  },
});
