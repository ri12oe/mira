import { AppText } from "@/components/app-test";
import { ITEM_H, WheelColumn } from "@/components/wheels-column";
import { FigtreeFont } from "@/constants/fonts";
import { formatTime } from "@/utils/format-time";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

const INK = "#15163A";
const SUBTITLE = "#54566E";
const PRIMARY = "#4338CA";
const SURFACE = "#DCD9E8";
const SELECTED_BG = "#F1EFFD";

const HOURS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const MINUTES = [0, 15, 30, 45];
const PERIODS = ["AM", "PM"] as const;

type Period = (typeof PERIODS)[number];

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

type Props = {
  /** Minutes after midnight */
  start: number;
  end: number;
  onChangeStart: (value: number) => void;
  onChangeEnd: (value: number) => void;
};

/** From / Until boxes with hour, minute and AM/PM wheels for the box that is selected. */
export function TimeWindowPicker({
  start,
  end,
  onChangeStart,
  onChangeEnd,
}: Props) {
  const [editing, setEditing] = useState<"from" | "until">("from");
  const parts = toParts(editing === "from" ? start : end);

  const setEditingValue = (hour: number, minute: number, period: Period) => {
    const next = fromParts(hour, minute, period);
    if (editing === "from") onChangeStart(next);
    else onChangeEnd(next);
  };

  return (
    <>
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
              <AppText style={styles.timeBoxValue}>{formatTime(value)}</AppText>
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
          onChange={(i) => setEditingValue(HOURS[i], parts.minute, parts.period)}
        />
        <WheelColumn
          label="Minute"
          items={MINUTES}
          selectedIndex={Math.max(0, MINUTES.indexOf(parts.minute))}
          onChange={(i) => setEditingValue(parts.hour, MINUTES[i], parts.period)}
          format={(m) => String(m).padStart(2, "0")}
        />
        <WheelColumn
          label="AM or PM"
          items={[...PERIODS]}
          selectedIndex={PERIODS.indexOf(parts.period)}
          onChange={(i) => setEditingValue(parts.hour, parts.minute, PERIODS[i])}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
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
});
