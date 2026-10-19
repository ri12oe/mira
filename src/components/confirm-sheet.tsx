import { AppText } from "@/components/app-test";
import { BottomSheet } from "@/components/bottom-sheet";
import { FigtreeFont } from "@/constants/fonts";
import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import Svg, { Path } from "react-native-svg";

const INK = "#15163A";
const SUBTITLE = "#54566E";
const BORDER = "#E6E4EF";
const DANGER = "#B3261E";
const DANGER_BG = "#FDECEC";

type Props = {
  visible: boolean;
  title: string;
  /** What will happen, one plain sentence per line */
  consequences: string[];
  confirmLabel: string;
  /**
   * Optional second tap for things that can't be undone: the first tap shows
   * this question and button instead of acting straight away.
   */
  secondStep?: { question: string; confirmLabel: string };
  busy: boolean;
  /** A problem to show (e.g. "We couldn't reach Mira…") */
  problem: string | null;
  onConfirm: () => void;
  onClose: () => void;
};

/** "Are you sure?" for removing someone or deleting the account */
export function ConfirmSheet(props: Props) {
  const { visible, title, consequences, confirmLabel, secondStep, busy, problem, onConfirm, onClose } = props;
  const [step, setStep] = useState<1 | 2>(1);
  const asking = step === 2 && !!secondStep;

  const close = () => {
    if (busy) return;
    setStep(1);
    onClose();
  };
  const pressConfirm = () => {
    if (secondStep && step === 1) setStep(2);
    else onConfirm();
  };

  return (
    <BottomSheet visible={visible} title={title} onClose={close}>
      <View style={styles.list}>
        {consequences.map((line) => (
          <View key={line} style={styles.item}>
            <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
              <Path d="M6 6l8 8M14 6l-8 8" stroke={DANGER} strokeWidth={2.2} strokeLinecap="round" />
            </Svg>
            <AppText style={styles.itemText}>{line}</AppText>
          </View>
        ))}
      </View>

      {asking && (
        <AppText style={styles.question} accessibilityRole="alert">
          {secondStep.question}
        </AppText>
      )}
      {problem && (
        <AppText style={styles.problem} accessibilityRole="alert">
          {problem}
        </AppText>
      )}

      <View style={styles.buttons}>
        <Pressable
          style={({ pressed }) => [styles.danger, busy && styles.busy, pressed && styles.pressed]}
          onPress={pressConfirm}
          disabled={busy}
          accessibilityRole="button"
          accessibilityState={{ busy, disabled: busy }}
        >
          {busy && <ActivityIndicator color="#fff" />}
          <AppText style={styles.dangerText}>{asking ? secondStep.confirmLabel : confirmLabel}</AppText>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.cancel, pressed && styles.pressed]}
          onPress={close}
          disabled={busy}
          accessibilityRole="button"
        >
          <AppText style={styles.cancelText}>Cancel</AppText>
        </Pressable>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 12,
    padding: 16,
    borderRadius: 18,
    backgroundColor: DANGER_BG,
  },
  item: {
    flexDirection: "row",
    gap: 10,
  },
  itemText: {
    flex: 1,
    color: INK,
    fontFamily: FigtreeFont.semiBold,
    fontSize: 16,
    lineHeight: 22,
  },
  question: {
    marginTop: 16,
    color: DANGER,
    fontFamily: FigtreeFont.extraBold,
    fontSize: 17,
    lineHeight: 23,
    textAlign: "center",
  },
  problem: {
    marginTop: 12,
    color: "#8C1D18",
    fontFamily: FigtreeFont.semiBold,
    fontSize: 16,
    lineHeight: 23,
  },
  buttons: {
    marginTop: 18,
    gap: 10,
  },
  danger: {
    height: 58,
    borderRadius: 18,
    backgroundColor: DANGER,
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  busy: {
    opacity: 0.75,
  },
  dangerText: {
    color: "#fff",
    fontFamily: FigtreeFont.bold,
    fontSize: 18,
  },
  cancel: {
    height: 52,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  cancelText: {
    color: SUBTITLE,
    fontFamily: FigtreeFont.bold,
    fontSize: 17,
  },
  pressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.9,
  },
});
