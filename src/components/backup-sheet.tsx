import { AppText } from "@/components/app-test";
import { BottomSheet } from "@/components/bottom-sheet";
import { Chip } from "@/components/chip";
import { SegmentedSlider } from "@/components/segmented-slider";
import { FigtreeFont } from "@/constants/fonts";
import { Backup } from "@/context/caregiver-setup";
import { toE164 } from "@/utils/phone";
import { useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";

const INK = "#15163A";
const PRIMARY = "#4338CA";
const SURFACE = "#DCD9E8";
const MUTED = "#8B8DA3";
const ORANGE_TEXT = "#9A4416";

const RELATIONSHIPS = ["Family", "Friend", "Neighbor"];

const ALERT_DELAYS = [
  { label: "15 min", value: 15 },
  { label: "30 min", value: 30 },
  { label: "1 hour", value: 60 },
];

type Props = {
  visible: boolean;
  onClose: () => void;
  /** Name of the person being cared for, used in the headings */
  recipientName: string;
  /** The backup being edited, or null to add a new one */
  backup: Backup | null;
  onSave: (backup: Omit<Backup, "id">) => void;
  /** Wording for someone setting Mira up for themselves ("They are your…") */
  self?: boolean;
  /** Shows a Remove button when editing an existing backup */
  onDelete?: () => void;
};

type FormProps = {
  recipientName: string;
  backup: Backup | null;
  onSave: (backup: Omit<Backup, "id">) => void;
  self?: boolean;
  onDelete?: () => void;
};

// Rendered only while the sheet is open, so each opening starts from `backup` (or a blank form)
function BackupForm({ recipientName, backup, onSave, self, onDelete }: FormProps) {
  const [name, setName] = useState(backup?.name ?? "");
  const [phone, setPhone] = useState(backup?.phone ?? "");
  const [relationship, setRelationship] = useState(backup?.relationship ?? "");
  // A saved custom role reopens as Custom
  const [isCustomRelationship, setIsCustomRelationship] = useState(
    !!backup && !RELATIONSHIPS.includes(backup.relationship),
  );
  const [alertAfter, setAlertAfter] = useState(backup?.alertAfter ?? 30);

  // A number Mira can't use would stop the whole person from saving, so it
  // has to be a full one (US, 10 digits) before Save works
  const phoneOk = !!toE164(phone);
  // Say why Save is grey: once the number is long enough to be "done", or
  // once it's the only thing missing (not on every keystroke while typing)
  const digits = phone.replace(/\D/g, "").length;
  const showPhoneHint =
    digits > 0 &&
    !phoneOk &&
    (digits >= 10 || (!!name.trim() && !!relationship.trim()));
  const canSave = !!name.trim() && phoneOk && !!relationship.trim();

  const save = () => {
    if (!canSave) return;
    onSave({
      name: name.trim(),
      phone: phone.trim(),
      relationship: relationship.trim(),
      alertAfter,
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.userInfo}>
        <View style={styles.nameField}>
          <AppText style={styles.headerText}>Name</AppText>
          <TextInput
            style={styles.inputField}
            value={name}
            onChangeText={setName}
            placeholder="e.g. John"
            accessibilityLabel="First Name"
            placeholderTextColor={MUTED}
            autoCapitalize="words"
            autoComplete="given-name"
            textContentType="givenName"
          />
        </View>
        <View style={styles.nameField}>
          <AppText style={styles.headerText}>Phone</AppText>
          <TextInput
            style={styles.inputField}
            value={phone}
            onChangeText={setPhone}
            placeholder="(555) 123-4567"
            accessibilityLabel="Their Phone Number"
            placeholderTextColor={MUTED}
            keyboardType="phone-pad"
            autoComplete="tel"
            textContentType="telephoneNumber"
          />
        </View>
      </View>
      {showPhoneHint && (
        <AppText style={styles.hint} accessibilityLiveRegion="polite">
          Check the phone number. It should be a 10-digit US number, like (555)
          123-4567.
        </AppText>
      )}
      <View style={styles.relationship}>
        <AppText style={styles.headerText}>
          {self ? "They are your" : `They are ${recipientName}'s`}
        </AppText>
        <View style={styles.chips}>
          {RELATIONSHIPS.map((option) => (
            <Chip
              key={option}
              variant="pill"
              label={option}
              selected={!isCustomRelationship && relationship === option}
              onPress={() => {
                setIsCustomRelationship(false);
                setRelationship(option);
              }}
            />
          ))}
          <Chip
            variant="pill"
            label="Custom"
            selected={isCustomRelationship}
            onPress={() => {
              setIsCustomRelationship(true);
              setRelationship(""); // clear a preset so the user types their own
            }}
          />
        </View>
        {isCustomRelationship && (
          <TextInput
            style={styles.inputField}
            value={relationship}
            onChangeText={setRelationship}
            placeholder="e.g. Coworker"
            placeholderTextColor={MUTED}
            accessibilityLabel="Custom relationship"
            autoCapitalize="words"
          />
        )}
      </View>
      <View style={styles.alerts}>
        <AppText style={styles.headerText}>Alert them after</AppText>
        <SegmentedSlider
          options={ALERT_DELAYS}
          value={alertAfter}
          onChange={setAlertAfter}
        />
      </View>
      <Pressable
        onPress={save}
        disabled={!canSave}
        accessibilityRole="button"
        accessibilityLabel="Save backup contact"
        style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
      >
        <AppText style={styles.saveButtonText}>
          {backup ? "Save changes" : "Add backup"}
        </AppText>
      </Pressable>
      {backup && onDelete ? (
        <Pressable
          onPress={onDelete}
          accessibilityRole="button"
          accessibilityLabel={`Remove ${backup.name}`}
          style={styles.removeButton}
        >
          <AppText style={styles.removeButtonText}>Remove</AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

/** Bottom sheet form for adding or editing a backup contact. */
export function BackupSheet({
  visible,
  onClose,
  recipientName,
  backup,
  onSave,
  self,
  onDelete,
}: Props) {
  return (
    <BottomSheet
      visible={visible}
      title={backup ? "Edit backup contact" : "Add a backup contact"}
      subtitle={
        self
          ? "If you miss a check-in and don't respond, we'll tell them."
          : `If ${recipientName} misses a check-in and you don't respond, we'll tell them.`
      }
      onClose={onClose}
    >
      <BackupForm
        recipientName={recipientName}
        backup={backup}
        onSave={onSave}
        self={self}
        onDelete={onDelete}
      />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 16,
    alignSelf: "stretch",
  },
  userInfo: {
    alignItems: "flex-start",
    gap: 10,
    alignSelf: "stretch",
    flexDirection: "row",
  },
  nameField: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 8,
    flex: 1,
  },
  headerText: {
    color: INK,
    fontSize: 16,
    lineHeight: 20.8,
    fontFamily: FigtreeFont.bold,
  },
  inputField: {
    height: 54,
    paddingVertical: 0,
    paddingHorizontal: 14,
    alignItems: "center",
    alignSelf: "stretch",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: SURFACE,
    backgroundColor: "#fff",
  },
  hint: {
    marginTop: -6,
    color: ORANGE_TEXT,
    fontFamily: FigtreeFont.semiBold,
    fontSize: 15,
    lineHeight: 21,
  },
  relationship: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 8,
    alignSelf: "stretch",
  },
  chips: {
    alignItems: "flex-start",
    flexDirection: "row",
    alignContent: "flex-start",
    gap: 8,
    alignSelf: "stretch",
    flexWrap: "wrap",
  },
  alerts: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 8,
    alignSelf: "stretch",
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
  removeButton: {
    height: 48,
    alignSelf: "stretch",
    justifyContent: "center",
    alignItems: "center",
  },
  removeButtonText: {
    color: "#8C1D18",
    fontFamily: FigtreeFont.extraBold,
    fontSize: 17,
  },
  saveButtonText: {
    color: "#fff",
    fontFamily: FigtreeFont.extraBold,
    fontSize: 19,
    lineHeight: 22.8,
  },
});
