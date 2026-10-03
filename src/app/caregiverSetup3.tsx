import { AppText } from "@/components/app-test";
import { BottomSheet } from "@/components/bottom-sheet";
import { DragHandle } from "@/components/drag-handle";
import { SegmentedSlider } from "@/components/segmented-slider";
import { SwipeToDelete } from "@/components/swipe-to-delete";
import { FigtreeFont, FontFamily } from "@/constants/fonts";
import { CheckInMethod, useCaregiverSetup } from "@/context/caregiver-setup";
import { formatTime } from "@/utils/format-time";
import { router } from "expo-router";
import { useRef, useState } from "react";
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
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

const CHECK_IN_METHOD_LABELS: Record<CheckInMethod, string> = {
  text: "Text and Call",
  call: "Phone call",
  app: "Mira app",
};

const RELATIONSHIPS = ["Family", "Friend", "Neighbor"];

// Appended to every invite so the recipient always knows how to opt in.
const INVITE_SUFFIX = "Reply YES to start.";
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

const ALERT_DELAYS = [
  { label: "15 min", value: 15 },
  { label: "30 min", value: 30 },
  { label: "1 hour", value: 60 },
];

type BackupContact = {
  name: string;
  phone: string;
  relationship: string;
  alertAfter: number;
};

// The caregiver is a row too, so anyone can be dragged to first.
type Row =
  | { id: string; kind: "you" }
  | ({ id: string; kind: "backup" } & BackupContact);

function moveItem<T>(arr: T[], from: number, to: number): T[] {
  const next = [...arr];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export default function CaregiverSetup3() {
  const {
    firstName,
    method,
    displayName,
    phone,
    yourFirstName,
    windowStart,
    windowEnd,
  } = useCaregiverSetup();
  const recipientName = firstName.trim() || "Caregiver";
  const [rows, setRows] = useState<Row[]>([{ id: "you", kind: "you" }]);
  const nextId = useRef(0);
  const [sheet, setSheet] = useState<null | "backup" | "editInvite">(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [backupName, setBackupName] = useState("");
  const [backupPhone, setBackupPhone] = useState("");
  const [backupRelationship, setBackupRelationship] = useState("");
  const [isCustomRelationship, setIsCustomRelationship] = useState(false);
  const [alertAfter, setAlertAfter] = useState(30);

  const defaultInvite = `Hi ${displayName}, it's ${yourFirstName}. I set up Mira so I know you're okay each day.`;
  const [savedInvite, setSavedInvite] = useState<string | null>(null); // null = use the default
  const [inviteDraft, setInviteDraft] = useState("");
  const canSaveInvite = inviteDraft.trim().length > 0;
  const inviteLength = (
    inviteDraft.trim() ? `${inviteDraft.trim()} ` : ""
  ).concat(INVITE_SUFFIX).length;
  const inviteTexts = Math.max(1, Math.ceil(inviteLength / SMS_LENGTH));
  const [drag, setDrag] = useState<{ id: string; from: number } | null>(null);
  const [hoverIndex, setHoverIndex] = useState(0);
  const dragY = useRef(new Animated.Value(0)).current;
  const rowHeight = useRef(0);

  // Index 0 is the caregiver and stays pinned, so backups can only land at 1 or later.
  const targetIndex = (from: number, dy: number) =>
    Math.min(
      Math.max(Math.round(from + dy / (rowHeight.current || 1)), 1),
      rows.length - 1,
    );

  const startDrag = (id: string, from: number) => {
    dragY.setValue(0);
    setHoverIndex(from);
    setDrag({ id, from });
  };

  const moveDrag = (dy: number) => {
    if (!drag) return;
    // Keep the row visually inside the movable range (below the pinned caregiver, above the end).
    const h = rowHeight.current;
    const clamped = Math.min(
      Math.max(dy, (1 - drag.from) * h),
      (rows.length - 1 - drag.from) * h,
    );
    dragY.setValue(clamped);
    const target = targetIndex(drag.from, dy);
    if (target !== hoverIndex) setHoverIndex(target);
  };

  const endDrag = (dy: number) => {
    if (!drag) return;
    const target = targetIndex(drag.from, dy);
    setRows((current) => moveItem(current, drag.from, target));
    setDrag(null);
    dragY.setValue(0);
  };

  const nudgeRow = (index: number, delta: -1 | 1) => {
    const to = index + delta;
    if (to < 1 || to >= rows.length) return;
    setRows((current) => moveItem(current, index, to));
  };

  const startEditingBackup = (row: Extract<Row, { kind: "backup" }>) => {
    setBackupName(row.name);
    setBackupPhone(row.phone);
    setBackupRelationship(row.relationship);
    setAlertAfter(row.alertAfter);
    setIsCustomRelationship(!RELATIONSHIPS.includes(row.relationship)); // a saved custom role reopens as Custom
    setEditingId(row.id);
    setSheet("backup");
  };

  const saveBackup = () => {
    const name = backupName.trim();
    const phone = backupPhone.trim();
    const relationship = backupRelationship.trim();
    if (!name || !phone || !relationship) return;

    const backup = { name, phone, relationship, alertAfter };
    setRows((current) =>
      editingId === null
        ? [
            ...current,
            { id: `backup-${nextId.current++}`, kind: "backup", ...backup },
          ]
        : current.map((row) =>
            row.id === editingId && row.kind === "backup"
              ? { ...row, ...backup }
              : row,
          ),
    );
    setSheet(null);
  };

  const canSave =
    !!backupName.trim() && !!backupPhone.trim() && !!backupRelationship.trim();

  const openEditInvite = () => {
    setInviteDraft(savedInvite ?? defaultInvite);
    setSheet("editInvite");
  };

  const saveInvite = () => {
    if (!inviteDraft.trim()) return;
    setSavedInvite(inviteDraft.trim());
    setSheet(null);
  };

  const addToInvite = (text: string) =>
    setInviteDraft((draft) => {
      const trimmed = draft.trimEnd();
      return trimmed ? `${trimmed} ${text}` : text;
    });

  const openAddBackup = () => {
    setBackupName("");
    setBackupPhone("");
    setBackupRelationship("");
    setIsCustomRelationship(false);
    setAlertAfter(30);
    setEditingId(null);
    setSheet("backup");
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
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
            <AppText style={styles.barText}>Step 3 of 3</AppText>
            <View style={styles.bar}>
              <View style={[styles.barSegment, styles.barActive]} />
              <View style={[styles.barSegment, styles.barActive]} />
              <View style={[styles.barSegment, styles.barActive]} />
            </View>
          </View>
        </View>
        <View style={styles.callout}>
          <AppText style={styles.calloutText}>Who should we alert?</AppText>
          <AppText style={styles.calloutSubtext}>
            If {recipientName} misses a check-in, we'll reach out in this order.
          </AppText>
        </View>
        <View style={styles.alertOrder}>
          <View style={styles.list}>
            {rows.map((row, index) => {
              const isDragging = drag?.id === row.id;
              let shift = 0;
              if (drag && !isDragging) {
                const h = rowHeight.current;
                if (
                  drag.from < hoverIndex &&
                  index > drag.from &&
                  index <= hoverIndex
                )
                  shift = -h;
                if (
                  drag.from > hoverIndex &&
                  index < drag.from &&
                  index >= hoverIndex
                )
                  shift = h;
              }
              const label = row.kind === "you" ? recipientName : row.name;
              const handle = (
                <DragHandle
                  label={label}
                  onStart={() => startDrag(row.id, index)}
                  onMove={moveDrag}
                  onEnd={endDrag}
                  onNudge={(delta) => nudgeRow(index, delta)}
                />
              );
              const content =
                row.kind === "you" ? (
                  <View style={styles.listItemYou}>
                    <View style={styles.listOrder}>
                      <AppText style={styles.listOrderText}>
                        {index + 1}
                      </AppText>
                    </View>
                    <View style={styles.listAvatar}>
                      <AppText style={styles.listAvatarText}>
                        {recipientName.charAt(0).toUpperCase()}
                      </AppText>
                    </View>
                    <View style={styles.listContent}>
                      <AppText style={styles.listContentHeader}>
                        {recipientName}
                      </AppText>
                      <AppText style={styles.listContentSubtext}>
                        {CHECK_IN_METHOD_LABELS[method]}
                      </AppText>
                    </View>
                    <View style={styles.pill}>
                      <AppText style={styles.pillText}>First</AppText>
                    </View>
                  </View>
                ) : (
                  <SwipeToDelete
                    label={row.name}
                    onDelete={() =>
                      setRows((current) =>
                        current.filter((r) => r.id !== row.id),
                      )
                    }
                  >
                    <View style={styles.listItem}>
                      <View style={styles.listOrder}>
                        <AppText style={styles.listOrderText}>
                          {index + 1}
                        </AppText>
                      </View>
                      <View style={styles.listAvatar2}>
                        <AppText style={styles.listAvatarText2}>
                          {row.name.charAt(0).toUpperCase()}
                        </AppText>
                      </View>
                      <View style={styles.listContent}>
                        <AppText style={styles.listContentHeader}>
                          {row.name}
                        </AppText>
                        <AppText style={styles.listContentSubtext}>
                          {recipientName}'s {row.relationship} · Backup
                        </AppText>
                      </View>
                      <Pressable
                        onPress={() => startEditingBackup(row)}
                        accessibilityRole="button"
                        accessibilityLabel={`Edit ${row.name}`}
                      >
                        <AppText style={styles.editButtonText}>Edit</AppText>
                      </Pressable>
                      {handle}
                    </View>
                  </SwipeToDelete>
                );
              return (
                <Animated.View
                  key={row.id}
                  onLayout={(e) => {
                    rowHeight.current = e.nativeEvent.layout.height;
                  }}
                  style={[
                    styles.rowWrap,
                    isDragging
                      ? [
                          styles.rowDragging,
                          { transform: [{ translateY: dragY }] },
                        ]
                      : { transform: [{ translateY: shift }] },
                  ]}
                >
                  {index > 0 && <View style={styles.divider} />}
                  {content}
                </Animated.View>
              );
            })}
          </View>
          <Pressable
            style={styles.addButton}
            onPress={openAddBackup}
            accessibilityRole="button"
            accessibilityLabel="Add another backup"
          >
            <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
              <Path
                d="M9.99996 4.16663V15.8333M4.16663 9.99996H15.8333"
                stroke="#2D2A8C"
                strokeWidth={1.83333}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
            <AppText style={styles.addButtonText}>Add another backup</AppText>
          </Pressable>
        </View>
        <View style={styles.invites}>
          <View style={styles.labelRow}>
            <AppText style={styles.labelText}>
              We'll text {displayName} this invite
            </AppText>
            <Pressable
              onPress={openEditInvite}
              accessibilityRole="button"
              accessibilityLabel="Edit invite"
            >
              <AppText style={styles.editInviteText}>Edit</AppText>
            </Pressable>
          </View>
          <View style={styles.messagePreview}>
            <View style={styles.messageToPreview}>
              <Svg width={16} height={16} viewBox="0 0 22 22" fill="none">
                <Path
                  d="M3.66666 4.58337H18.3333V14.6667H8.25L3.66666 18.3334V4.58337Z"
                  stroke="#54566E"
                  strokeWidth={2.01667}
                  strokeLinejoin="round"
                />
              </Svg>
              <AppText style={styles.phonePreview}>TEXT TO {phone}</AppText>
            </View>
            <View style={styles.messageContent}>
              <AppText style={styles.messageText}>
                {savedInvite ?? defaultInvite} {INVITE_SUFFIX}
              </AppText>
            </View>
          </View>
        </View>
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
            <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
              <Path
                d="M3.33337 10L16.6667 3.33337L11.6667 16.6667L9.16671 10.8334L3.33337 10Z"
                stroke="white"
                strokeWidth={1.83333}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
            <AppText style={styles.nextButtonText}>Send invite to {displayName}</AppText>
          </Pressable>
        </View>
      </ScrollView>
      <BottomSheet
        visible={sheet === "backup"}
        title={
          editingId === null ? "Add a backup contact" : "Edit backup contact"
        }
        subtitle={`If ${displayName} misses a check-in and you don't respond, we'll tell them.`}
        onClose={() => setSheet(null)}
      >
        <View style={styles.userInfoContainer}>
          <View style={styles.userInfo}>
            <View style={styles.nameField}>
              <AppText style={styles.headerText}>Name</AppText>
              <TextInput
                style={styles.inputField}
                value={backupName}
                onChangeText={setBackupName}
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
                value={backupPhone}
                onChangeText={setBackupPhone}
                placeholder="(555) 123-4567"
                accessibilityLabel="Their Phone Number"
                placeholderTextColor={MUTED}
                keyboardType="phone-pad"
                autoComplete="tel"
                textContentType="telephoneNumber"
              />
            </View>
          </View>
          <View style={styles.relationship}>
            <AppText style={styles.headerText}>
              They are {displayName}'s
            </AppText>
            <View style={styles.chips}>
              {RELATIONSHIPS.map((option) => {
                const selected =
                  !isCustomRelationship && backupRelationship === option;
                return (
                  <Pressable
                    key={option}
                    onPress={() => {
                      setIsCustomRelationship(false);
                      setBackupRelationship(option);
                    }}
                    style={[styles.chip, selected && styles.chipSelected]}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: selected }}
                    accessibilityLabel={option}
                  >
                    <AppText
                      style={[
                        styles.chipText,
                        selected && styles.chipTextSelected,
                      ]}
                    >
                      {option}
                    </AppText>
                  </Pressable>
                );
              })}
              <Pressable
                onPress={() => {
                  setIsCustomRelationship(true);
                  setBackupRelationship(""); // clear a preset so the user types their own
                }}
                style={[
                  styles.chip,
                  isCustomRelationship && styles.chipSelected,
                ]}
                accessibilityRole="radio"
                accessibilityState={{ checked: isCustomRelationship }}
                accessibilityLabel="Custom"
              >
                <AppText
                  style={[
                    styles.chipText,
                    isCustomRelationship && styles.chipTextSelected,
                  ]}
                >
                  Custom
                </AppText>
              </Pressable>
            </View>
            {isCustomRelationship && (
              <TextInput
                style={styles.inputField}
                value={backupRelationship}
                onChangeText={setBackupRelationship}
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
            onPress={saveBackup}
            disabled={!canSave}
            accessibilityRole="button"
            accessibilityLabel="Save backup contact"
            style={[
              styles.saveBackupButton,
              !canSave && styles.saveBackupButtonDisabled,
            ]}
          >
            <AppText style={styles.saveBackupButtonText}>Add backup</AppText>
          </Pressable>
        </View>
      </BottomSheet>
      <BottomSheet
        visible={sheet === "editInvite"}
        title="Edit invite message"
        subtitle={`${displayName} will get this as a text. Write it the way you'd say it.`}
        onClose={() => setSheet(null)}
      >
        <View style={styles.editInviteContent}>
          <View style={styles.labelRow}>
            <AppText style={[styles.labelText, { fontSize: 16 }]}>
              Your message
            </AppText>
            <Pressable
              onPress={() => setInviteDraft(defaultInvite)}
              accessibilityRole="button"
              accessibilityLabel="Reset message"
            >
              <View style={styles.restButton}>
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
                <AppText style={styles.editInviteText}>Reset</AppText>
              </View>
            </Pressable>
          </View>
          <View style={styles.field}>
            <View style={styles.textContainer}>
              <TextInput
                style={styles.fieldText}
                value={inviteDraft}
                onChangeText={setInviteDraft}
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
                <View style={styles.tags}>
                  <AppText style={styles.tagText}>Added</AppText>
                </View>
              </View>
            </View>
          </View>
          <View style={styles.helper}>
            <AppText style={styles.helperText}>
              {displayName} replies YES to connect.
            </AppText>
            <AppText style={styles.helperText}>
              {inviteLength} / {SMS_LENGTH} · {inviteTexts}{" "}
              {inviteTexts === 1 ? "text" : "texts"}
            </AppText>
          </View>
        </View>
        <View style={styles.addMessageOptions}>
          <AppText style={[styles.labelText, { fontSize: 16 }]}>
            Add to message
          </AppText>
          <View style={styles.optionsChips}>
            {INVITE_SNIPPETS.map((snippet) => (
              <Pressable
                key={snippet.label}
                style={styles.optionChip}
                onPress={() => addToInvite(snippet.text)}
                accessibilityRole="button"
              >
                <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
                  <Path
                    d="M8.00011 3.35986V12.6399M3.36011 7.99986H12.6401"
                    stroke="#2D2A8C"
                    strokeWidth={1.52}
                    strokeLinecap="round"
                  />
                </Svg>
                <AppText style={styles.optionChipText}>{snippet.label}</AppText>
              </Pressable>
            ))}
            <Pressable
              style={styles.optionChip}
              onPress={() =>
                addToInvite(
                  `Please check in between ${formatTime(windowStart)} and ${formatTime(windowEnd)} each day.`,
                )
              }
              accessibilityRole="button"
            >
              <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
                <Path
                  d="M8.00011 3.35986V12.6399M3.36011 7.99986H12.6401"
                  stroke="#2D2A8C"
                  strokeWidth={1.52}
                  strokeLinecap="round"
                />
              </Svg>
              <AppText style={styles.optionChipText}>Check-in time</AppText>
            </Pressable>
          </View>
        </View>
        <Pressable
          onPress={saveInvite}
          disabled={!canSaveInvite}
          accessibilityRole="button"
          accessibilityLabel="Save message"
          style={[
            styles.saveBackupButton,
            !canSaveInvite && styles.saveBackupButtonDisabled,
          ]}
        >
          <AppText style={styles.saveBackupButtonText}>Save message</AppText>
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
    gap: 8,
    flexDirection: "column",
    alignItems: "flex-start",
  },
  calloutText: {
    color: INK,
    fontFamily: FontFamily.bold,
    fontSize: 32,
    lineHeight: 35.2,
    letterSpacing: -0.7,
  },
  calloutSubtext: {
    color: SUBTITLE,
    fontFamily: FigtreeFont.medium,
    fontSize: 17,
    lineHeight: 24.65,
  },
  alertOrder: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 10,
    alignSelf: "stretch",
    marginTop: 22,
  },
  list: {
    flexDirection: "column",
    alignItems: "flex-start",
    alignSelf: "stretch",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDERCOLOR,
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  rowWrap: {
    alignSelf: "stretch",
    backgroundColor: "#fff",
  },
  rowDragging: {
    zIndex: 2,
    shadowColor: "#14173B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  listItemYou: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    gap: 12,
    alignSelf: "stretch",
    flexDirection: "row",
  },
  listOrder: {
    width: 26,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  listOrderText: {
    color: SUBTITLE,
    fontFamily: FigtreeFont.extraBold,
    fontSize: 15,
  },
  listAvatar: {
    width: 56,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 23,
    backgroundColor: LILAC,
  },
  listAvatarText: {
    color: PRIMARY,
    fontSize: 19,
    fontFamily: FigtreeFont.extraBold,
  },
  listAvatar2: {
    width: 56,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 23,
    backgroundColor: MINT,
  },
  listAvatarText2: {
    color: GREEN,
    fontSize: 19,
    fontFamily: FigtreeFont.extraBold,
  },
  listContent: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 2,
    flex: 1,
  },
  listContentHeader: {
    color: INK,
    fontSize: 17,
    fontFamily: FigtreeFont.bold,
    lineHeight: 22.1,
  },
  listContentSubtext: {
    color: SUBTITLE,
    fontSize: 15,
    lineHeight: 21,
    fontFamily: FigtreeFont.medium,
  },
  pill: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    alignItems: "flex-start",
    borderRadius: 999,
    backgroundColor: SELECTED_BG,
  },
  pillText: {
    color: PRIMARY,
    fontSize: 13,
    fontFamily: FigtreeFont.extraBold,
  },
  divider: {
    height: 1,
    alignSelf: "stretch",
    backgroundColor: "#EFEDF5",
  },
  listItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    gap: 12,
    alignSelf: "stretch",
    flexDirection: "row",
  },
  editButtonText: {
    color: PRIMARY,
    fontSize: 16,
    fontFamily: FigtreeFont.extraBold,
  },

  userInfoContainer: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 16,
    alignSelf: "stretch",
  },

  addButton: {
    height: 52,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    alignSelf: "stretch",
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "#CFCBE3",
    borderStyle: "dashed",
    flexDirection: "row",
  },
  addButtonText: {
    color: PRIMARY,
    fontSize: 17,
    fontFamily: FigtreeFont.extraBold,
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
  saveBackupButton: {
    height: 60,
    alignSelf: "stretch",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 18,
    backgroundColor: PRIMARY,
  },
  saveBackupButtonDisabled: {
    opacity: 0.45,
  },
  saveBackupButtonText: {
    color: "#fff",
    fontFamily: FigtreeFont.extraBold,
    fontSize: 19,
    lineHeight: 22.8,
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
  chip: {
    height: 44,
    paddingVertical: 0,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: SURFACE,
    backgroundColor: "#fff",
  },
  chipText: {
    fontSize: 16,
    fontFamily: FigtreeFont.bold,
    lineHeight: 20.8,
    color: INK,
  },
  chipSelected: {
    borderColor: PRIMARY,
    borderWidth: 2,
    backgroundColor: SELECTED_BG,
  },
  chipTextSelected: {
    fontFamily: FigtreeFont.extraBold,
  },
  alerts: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 8,
    alignSelf: "stretch",
  },
  invites: {
    marginTop: 22,
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 10,
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
    fontSize: 17,
    lineHeight: 22.1,
    fontFamily: FigtreeFont.bold,
  },
  editInviteText: {
    color: PRIMARY,
    fontSize: 15,
    fontFamily: FigtreeFont.extraBold,
  },
  messagePreview: {
    padding: 16,
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 10,
    alignSelf: "stretch",
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: "#fff",
    borderColor: BORDERCOLOR,
  },
  messageToPreview: {
    alignItems: "center",
    gap: 8,
    flexDirection: "row",
  },
  phonePreview: {
    color: SUBTITLE,
    fontSize: 13,
    letterSpacing: 0.4,
    fontFamily: FigtreeFont.extraBold,
  },
  messageContent: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: "flex-start",
    alignSelf: "stretch",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomRightRadius: 18,
    borderBottomLeftRadius: 6,
    backgroundColor: SELECTED_BG,
  },
  messageText: {
    color: INK,
    fontSize: 16,
    lineHeight: 23.2,
    fontFamily: FigtreeFont.bold,
  },
  editInviteContent: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 8,
    alignSelf: "stretch",
  },
  restButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    padding: 6,
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
  tags: {
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
  addMessageOptions: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 10,
    alignSelf: "stretch",
  },
  optionsChips: {
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
    flexDirection: "row",
    gap: 10,
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
});
