import { AppText } from "@/components/app-test";
import { BottomSheet } from "@/components/bottom-sheet";
import { FigtreeFont } from "@/constants/fonts";
import type { CheckInMethod } from "@/context/caregiver-setup";
import { demoAdvance, demoReply, type DemoProblem, type DemoStep } from "@/lib/demo";
import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";

const INK = "#15163A";
const SUBTITLE = "#54566E";
const PRIMARY = "#4338CA";
const BORDER = "#E6E4EF";
const LILAC = "#E7E4FB";
const MINT = "#DDF3EE";

type Props = {
  visible: boolean;
  onClose: () => void;
  /** The person whose day to fast-forward */
  takerId: string;
  /** Their first name; empty (or "they") reads as "them" */
  name: string;
  method: CheckInMethod;
  /** Someone using Mira for themselves: "you", and no caregiver step */
  forSelf?: boolean;
  /** After a step worked (Home also updates live) */
  onChanged?: () => void;
};

type Action = DemoStep | "reply";

const PROBLEMS: Record<DemoProblem, string> = {
  notDemo: "These controls only work for the demo accounts.",
  paused: "Check-ins are paused. Turn them back on first.",
  notJoined: "They haven't joined yet, so there's nothing to show.",
  noCheckInToday: "There's no check-in today yet. Tap Start the day first.",
  alreadyCheckedIn: "Today's check-in is already done. Tap Start the day to show it again.",
  offline: "We couldn't reach Mira. Check that you're online, then try again.",
  failed: "Something went wrong. Please try again.",
};

/** Demo only: show a whole day (ask → reminder → alerts → all clear) in a few minutes */
export function DemoSheet({ visible, onClose, takerId, name, method, forSelf = false, onChanged }: Props) {
  const [running, setRunning] = useState<Action | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [done, setDone] = useState<Action | null>(null);

  const named = name.trim() !== "" && name !== "they";
  const them = forSelf ? "you" : named ? name : "them";
  const They = forSelf ? "You" : named ? name : "They";

  const replyLabel = forSelf
    ? "Pretend I tapped I'm okay"
    : method === "text"
      ? `Pretend ${them} texted OK`
      : method === "call"
        ? `Pretend ${them} pressed 1`
        : `Pretend ${them} tapped I'm okay`;

  const actions: { action: Action; title: string; detail: string }[] = [
    { action: "start", title: "Start the day", detail: `Mira asks ${them} to check in now.` },
    { action: "window_end", title: "Skip to the end of the window", detail: `${They} get${forSelf || !named ? "" : "s"} a gentle reminder.` },
    {
      action: "alert",
      title: "Skip to the alert",
      detail: forSelf ? "Today counts as missed." : `Today counts as missed, and you're alerted.`,
    },
    { action: "backups", title: "Skip to the backups", detail: "Backups are alerted, one after another." },
    { action: "reply", title: replyLabel, detail: "Counts as checked in. Anyone alerted gets an all clear." },
  ];

  const run = async (action: Action) => {
    if (running) return;
    setRunning(action);
    setProblem(null);
    setDone(null);
    const result = action === "reply" ? await demoReply(takerId) : await demoAdvance(takerId, action);
    setRunning(null);
    if (result) {
      setProblem(PROBLEMS[result]);
    } else {
      setDone(action);
      onChanged?.();
    }
  };

  const close = () => {
    setProblem(null);
    setDone(null);
    onClose();
  };

  return (
    <BottomSheet
      visible={visible}
      title="Demo controls"
      subtitle="Moves today's check-in earlier, so the next part of the day happens now. Texts and calls are only logged; app notifications are real."
      onClose={close}
    >
      <View style={styles.list}>
        {actions.map(({ action, title, detail }, i) => {
          const busy = running === action;
          return (
            <Pressable
              key={action}
              style={({ pressed }) => [
                styles.row,
                done === action && styles.rowDone,
                pressed && styles.pressed,
              ]}
              onPress={() => run(action)}
              disabled={running !== null}
              accessibilityRole="button"
              accessibilityLabel={title}
              accessibilityHint={detail}
              accessibilityState={{ busy, disabled: running !== null }}
            >
              <View style={styles.number}>
                {busy ? (
                  <ActivityIndicator color={PRIMARY} />
                ) : (
                  <AppText style={styles.numberText}>{done === action ? "✓" : i + 1}</AppText>
                )}
              </View>
              <View style={styles.rowText}>
                <AppText style={styles.title}>{title}</AppText>
                <AppText style={styles.detail}>{detail}</AppText>
              </View>
            </Pressable>
          );
        })}
      </View>
      {problem && (
        <AppText style={styles.problem} accessibilityRole="alert">
          {problem}
        </AppText>
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 10,
  },
  row: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: "#fff",
  },
  rowDone: {
    backgroundColor: MINT,
    borderColor: MINT,
  },
  number: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: LILAC,
    justifyContent: "center",
    alignItems: "center",
  },
  numberText: {
    color: PRIMARY,
    fontFamily: FigtreeFont.extraBold,
    fontSize: 16,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: INK,
    fontFamily: FigtreeFont.bold,
    fontSize: 17,
    lineHeight: 22,
  },
  detail: {
    color: SUBTITLE,
    fontFamily: FigtreeFont.medium,
    fontSize: 15,
    lineHeight: 20,
  },
  problem: {
    marginTop: 12,
    color: "#8C1D18",
    fontFamily: FigtreeFont.semiBold,
    fontSize: 16,
    lineHeight: 23,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
});