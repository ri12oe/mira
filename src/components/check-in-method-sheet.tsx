import { AppText } from "@/components/app-test";
import { BottomSheet } from "@/components/bottom-sheet";
import MessageIcon from "@/components/icons/MessageIcon";
import PhoneIcon from "@/components/icons/PhoneIcon";
import PhoneSquareIcon from "@/components/icons/PhoneSquareIcon";
import { FigtreeFont } from "@/constants/fonts";
import { CheckInMethod } from "@/context/caregiver-setup";
import { ReactNode, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Svg, { Path } from "react-native-svg";
const PRIMARY = "#4338CA";
const SUBTITLE = "#54566E";
const INK = "#15163A";
const MUTED = "#8B8DA3";

export const METHOD_LABELS: Record<CheckInMethod, string> = {
  text: "Text reply",
  call: "Phone call",
  app: "Mira app",
};

const OPTIONS: {
  id: CheckInMethod;
  subtitle: string;
  iconBg: string;
  icon: ReactNode;
}[] = [
  {
    id: "text",
    subtitle: "Replies OK to a daily text",
    iconBg: "#E7E4FB",
    icon: <MessageIcon size={22} />,
  },
  {
    id: "call",
    subtitle: "Presses 1 on a short call",
    iconBg: "#FFE8DB",
    icon: <PhoneIcon size={22} />,
  },
  {
    id: "app",
    subtitle: "Taps one button in the app",
    iconBg: "#DDF3EE",
    icon: <PhoneSquareIcon size={22} />,
  },
];

type Props = {
  visible: boolean;
  /** The person's first name; may be empty */
  name: string;
  method: CheckInMethod;
  onChange: (method: CheckInMethod) => void;
  onClose: () => void;
};

/** Bottom sheet for changing how the person checks in. */
export function CheckInMethodSheet({
  visible,
  name,
  method,
  onChange,
  onClose,
}: Props) {
  // The choice is only a draft until the user taps Save
  const [draft, setDraft] = useState<CheckInMethod>(method);
  const [wasVisible, setWasVisible] = useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) setDraft(method);
  }

  const save = () => {
    onChange(draft);
    onClose();
  };

  return (
    <BottomSheet
      visible={visible}
      title={name ? `How ${name} checks in` : "How they check in"}
      onClose={onClose}
    >
      <View style={styles.choices} accessibilityRole="radiogroup">
        {OPTIONS.map((option) => {
          const selected = draft === option.id;
          return (
            <Pressable
              key={option.id}
              onPress={() => setDraft(option.id)}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              accessibilityLabel={`${METHOD_LABELS[option.id]}. ${option.subtitle}`}
              style={({ pressed }) => [
                styles.choice,
                selected && styles.choiceSelected,
                pressed && styles.choicePressed,
              ]}
            >
              <View
                style={[styles.IconTile, { backgroundColor: option.iconBg }]}
              >
                {option.icon}
              </View>
              <View style={styles.frame}>
                <AppText style={styles.choiceText}>
                  {METHOD_LABELS[option.id]}
                </AppText>
                <AppText style={styles.choiceSubtitle}>
                  {option.subtitle}
                </AppText>
              </View>
              <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
                <Path
                  d="M11 21C16.5228 21 21 16.5228 21 11C21 5.47715 16.5228 1 11 1C5.47715 1 1 5.47715 1 11C1 16.5228 5.47715 21 11 21Z"
                  stroke={selected ? PRIMARY : MUTED}
                  strokeWidth={2}
                />
                {selected && (
                  <Path
                    d="M11 16.5C14.0376 16.5 16.5 14.0376 16.5 11C16.5 7.96243 14.0376 5.5 11 5.5C7.96243 5.5 5.5 7.96243 5.5 11C5.5 14.0376 7.96243 16.5 11 16.5Z"
                    fill={PRIMARY}
                  />
                )}
              </Svg>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.note}>
        <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
          <Path
            d="M10 17.5C14.1421 17.5 17.5 14.1421 17.5 10C17.5 5.85786 14.1421 2.5 10 2.5C5.85786 2.5 2.5 5.85786 2.5 10C2.5 14.1421 5.85786 17.5 10 17.5Z"
            stroke="#9A6408"
            strokeWidth={1.83333}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M10 9.1665V13.3332"
            stroke="#9A6408"
            strokeWidth={1.83333}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M10 6.25V6.66667"
            stroke="#9A6408"
            strokeWidth={1.83333}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
        <AppText style={styles.noteText}>
          We&apos;ll send Lin a short message so the change isn&apos;t a surprise.
        </AppText>
      </View>

      <Pressable
        style={({ pressed }) => [styles.saveButton, pressed && styles.pressed]}
        onPress={save}
        accessibilityRole="button"
      >
        <AppText style={styles.saveButtonText}>Save</AppText>
      </Pressable>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
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
  pressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.9,
  },
  choices: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 10,
    alignSelf: "stretch",
  },
  choice: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    gap: 14,
    alignSelf: "stretch",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#DCD9E8",
    backgroundColor: "#fff",
    flexDirection: "row",
  },
  // Border grows 1 → 2, so padding shrinks by 1 to keep the card the same size
  choiceSelected: {
    borderWidth: 2,
    borderColor: PRIMARY,
    backgroundColor: "#F1EFFD",
    paddingVertical: 11,
    paddingHorizontal: 15,
  },
  choicePressed: {
    transform: [{ scale: 0.98 }],
  },
  IconTile: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 14,
  },
  frame: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 2,
    flex: 1,
  },
  choiceText: {
    alignSelf: "stretch",
    color: INK,
    fontSize: 17,
    lineHeight: 22.1,
    fontFamily: FigtreeFont.bold,
  },
  choiceSubtitle: {
    alignSelf: "stretch",
    color: SUBTITLE,
    fontSize: 14,
    fontFamily: FigtreeFont.medium,
    lineHeight: 21.75,
  },
  note: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 10,
    alignSelf: "stretch",
    borderRadius: 14,
    backgroundColor: "#FFF3D1",
    flexDirection: "row",
    alignItems: "center",
  },
  noteText: {
    flex: 1,
    color: "#7A4F06",
    fontSize: 15,
    lineHeight: 21,
    fontFamily: FigtreeFont.semiBold,
  },
});
