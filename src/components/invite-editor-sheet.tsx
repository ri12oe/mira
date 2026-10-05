import { AppText } from "@/components/app-test";
import { BottomSheet } from "@/components/bottom-sheet";
import { FigtreeFont } from "@/constants/fonts";
import { formatTimeShort } from "@/utils/format-time-short";
import { useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import Svg, { Path } from "react-native-svg";

const INK = "#15163A";
const SUBTITLE = "#54566E";
const PRIMARY = "#4338CA";
const BACKGROUND = "#F5F4FA";
const SURFACE = "#DCD9E8";
const LILAC = "#E7E4FB";
const MUTED = "#8B8DA3";

/** Appended to every invite so the recipient always knows how to opt in. */
export const INVITE_SUFFIX = "Reply YES to start.";
const SMS_LENGTH = 160;

const INVITE_SNIPPETS = [
  {
    label: "Brief explanation",
    text: "Mira sends a quick daily check-in so I know you're doing okay.",
  },
  {
    label: "Reassurance",
    text: "It only takes a few seconds, and there's nothing to set up.",
  },
];

type Props = {
  visible: boolean;
  onClose: () => void;
  /** Who receives the invite */
  recipientName: string;
  /** What "Reset" brings back (the invite without the locked suffix) */
  defaultInvite: string;
  /** The invite currently in use; the editor starts from this */
  invite: string;
  /** Minutes after midnight, used by the "Check-in time" snippet */
  windowStart: number;
  windowEnd: number;
  onSave: (invite: string) => void;
};

function PlusIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
      <Path
        d="M8.00011 3.35986V12.6399M3.36011 7.99986H12.6401"
        stroke="#2D2A8C"
        strokeWidth={1.52}
        strokeLinecap="round"
      />
    </Svg>
  );
}

type FormProps = Omit<Props, "visible" | "onClose">;

// Rendered only while the sheet is open, so each opening starts from the current invite
function InviteForm({
  recipientName,
  defaultInvite,
  invite,
  windowStart,
  windowEnd,
  onSave,
}: FormProps) {
  const [draft, setDraft] = useState(invite);

  const canSave = draft.trim().length > 0;
  const length = (draft.trim() ? `${draft.trim()} ` : "").concat(
    INVITE_SUFFIX,
  ).length;
  const texts = Math.max(1, Math.ceil(length / SMS_LENGTH));

  const addToInvite = (text: string) =>
    setDraft((current) => {
      const trimmed = current.trimEnd();
      return trimmed ? `${trimmed} ${text}` : text;
    });

  const save = () => {
    if (canSave) onSave(draft.trim());
  };

  return (
    <>
      <View style={styles.content}>
        <View style={styles.labelRow}>
          <AppText style={styles.labelText}>Your message</AppText>
          <Pressable
            onPress={() => setDraft(defaultInvite)}
            accessibilityRole="button"
            accessibilityLabel="Reset message"
          >
            <View style={styles.resetButton}>
              <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
                <Path
                  d="M2.66676 7.99987C2.66473 9.23185 3.08928 10.4265 3.86828 11.381C4.64727 12.3354 5.73267 12.9907 6.94008 13.2356C8.14748 13.4804 9.40242 13.2997 10.4917 12.7242C11.581 12.1486 12.4374 11.2137 12.9155 10.0783C13.3935 8.94283 13.4638 7.6769 13.1143 6.49554C12.7648 5.31418 12.017 4.29025 10.9981 3.59771C9.97921 2.90518 8.75197 2.58674 7.52489 2.69651C6.29781 2.80628 5.14657 3.33748 4.26676 4.19987"
                  stroke="#4338CA"
                  strokeWidth={1.6}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <Path
                  d="M2.66675 2.6665V5.33317H5.33341"
                  stroke="#4338CA"
                  strokeWidth={1.6}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
              <AppText style={styles.resetText}>Reset</AppText>
            </View>
          </Pressable>
        </View>
        <View style={styles.field}>
          <View style={styles.textContainer}>
            <TextInput
              style={styles.fieldText}
              value={draft}
              onChangeText={setDraft}
              multiline
              textAlignVertical="top"
              placeholder="Write your message"
              placeholderTextColor={MUTED}
              accessibilityLabel="Invite message"
            />
          </View>
          <View style={styles.lockedLineContainer}>
            <View style={styles.lockedLine}>
              <View style={styles.lockedLabel}>
                <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
                  <Path
                    d="M11.3333 7.3335H4.66659C3.93021 7.3335 3.33325 7.93045 3.33325 8.66683V12.0002C3.33325 12.7365 3.93021 13.3335 4.66659 13.3335H11.3333C12.0696 13.3335 12.6666 12.7365 12.6666 12.0002V8.66683C12.6666 7.93045 12.0696 7.3335 11.3333 7.3335Z"
                    stroke="#54566E"
                    strokeWidth={1.46667}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <Path
                    d="M5.33325 7.33317V5.33317C5.33325 4.62593 5.6142 3.94765 6.1143 3.44755C6.6144 2.94746 7.29267 2.6665 7.99992 2.6665C8.70716 2.6665 9.38544 2.94746 9.88554 3.44755C10.3856 3.94765 10.6666 4.62593 10.6666 5.33317V7.33317"
                    stroke="#54566E"
                    strokeWidth={1.46667}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
                <AppText style={styles.lockedText}>{INVITE_SUFFIX}</AppText>
              </View>
              <View style={styles.tag}>
                <AppText style={styles.tagText}>Added</AppText>
              </View>
            </View>
          </View>
        </View>
        <View style={styles.helper}>
          <AppText style={styles.helperText}>
            {recipientName} replies YES to connect.
          </AppText>
          <AppText style={styles.helperText}>
            {length} / {SMS_LENGTH} · {texts} {texts === 1 ? "text" : "texts"}
          </AppText>
        </View>
      </View>
      <View style={styles.addOptions}>
        <AppText style={styles.labelText}>Add to message</AppText>
        <View style={styles.optionChips}>
          {INVITE_SNIPPETS.map((snippet) => (
            <Pressable
              key={snippet.label}
              style={styles.optionChip}
              onPress={() => addToInvite(snippet.text)}
              accessibilityRole="button"
            >
              <PlusIcon />
              <AppText style={styles.optionChipText}>{snippet.label}</AppText>
            </Pressable>
          ))}
          <Pressable
            style={styles.optionChip}
            onPress={() =>
              addToInvite(
                `Please check in between ${formatTimeShort(windowStart)} and ${formatTimeShort(windowEnd)} each day.`,
              )
            }
            accessibilityRole="button"
          >
            <PlusIcon />
            <AppText style={styles.optionChipText}>Check-in time</AppText>
          </Pressable>
        </View>
      </View>
      <Pressable
        onPress={save}
        disabled={!canSave}
        accessibilityRole="button"
        accessibilityLabel="Save message"
        style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
      >
        <AppText style={styles.saveButtonText}>Save message</AppText>
      </Pressable>
    </>
  );
}

/** Bottom sheet for rewriting the text message that invites someone to Mira. */
export function InviteEditorSheet({ visible, onClose, ...form }: Props) {
  return (
    <BottomSheet
      visible={visible}
      title="Edit invite message"
      subtitle={`${form.recipientName} will get this as a text. Write it the way you'd say it.`}
      onClose={onClose}
    >
      <InviteForm {...form} />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  content: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 8,
    alignSelf: "stretch",
  },
  labelRow: {
    justifyContent: "space-between",
    alignItems: "center",
    alignSelf: "stretch",
    flexDirection: "row",
  },
  labelText: {
    color: INK,
    fontSize: 16,
    lineHeight: 22.1,
    fontFamily: FigtreeFont.bold,
  },
  resetButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    padding: 6,
  },
  resetText: {
    color: PRIMARY,
    fontSize: 15,
    fontFamily: FigtreeFont.extraBold,
  },
  field: {
    flexDirection: "column",
    alignItems: "flex-start",
    alignSelf: "stretch",
    borderRadius: 20,
    borderWidth: 2,
    borderColor: PRIMARY,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
    shadowColor: LILAC,
  },
  textContainer: {
    minHeight: 104,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "flex-start",
    alignSelf: "stretch",
  },
  fieldText: {
    color: INK,
    fontSize: 17,
    fontFamily: FigtreeFont.semiBold,
    lineHeight: 24.65,
    flex: 1,
    alignSelf: "stretch",
    padding: 0,
  },
  lockedLineContainer: {
    paddingHorizontal: 12,
    alignItems: "flex-start",
    alignSelf: "stretch",
  },
  lockedLine: {
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: "center",
    gap: 8,
    alignSelf: "stretch",
    flexDirection: "row",
    borderColor: SURFACE,
    borderStyle: "dashed",
    borderTopWidth: 1,
    justifyContent: "space-between",
  },
  lockedLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  lockedText: {
    color: SUBTITLE,
    fontSize: 15,
    fontFamily: FigtreeFont.bold,
  },
  tag: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    alignItems: "flex-start",
    borderRadius: 999,
    backgroundColor: BACKGROUND,
  },
  tagText: {
    color: SUBTITLE,
    fontSize: 12,
    fontFamily: FigtreeFont.extraBold,
  },
  helper: {
    justifyContent: "space-between",
    alignItems: "flex-start",
    alignSelf: "stretch",
    flexDirection: "row",
  },
  helperText: {
    color: SUBTITLE,
    fontSize: 14,
    fontFamily: FigtreeFont.semiBold,
  },
  addOptions: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 10,
    alignSelf: "stretch",
  },
  optionChips: {
    alignItems: "flex-start",
    alignContent: "flex-start",
    gap: 8,
    alignSelf: "stretch",
    flexWrap: "wrap",
    flexDirection: "row",
  },
  optionChip: {
    height: 44,
    paddingHorizontal: 14,
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: "#fff",
    borderColor: SURFACE,
    flexDirection: "row",
  },
  optionChipText: {
    color: PRIMARY,
    fontSize: 15,
    fontFamily: FigtreeFont.bold,
  },
  saveButton: {
    height: 60,
    alignSelf: "stretch",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 18,
    backgroundColor: PRIMARY,
  },
  saveButtonDisabled: {
    opacity: 0.45,
  },
  saveButtonText: {
    color: "#fff",
    fontFamily: FigtreeFont.extraBold,
    fontSize: 19,
    lineHeight: 22.8,
  },
});
