import { AppText } from "@/components/app-test";
import { BottomSheet } from "@/components/bottom-sheet";
import { DragHandle } from "@/components/drag-handle";
import { SegmentedSlider } from "@/components/segmented-slider";
import { SwipeToDelete } from "@/components/swipe-to-delete";
import { FigtreeFont, FontFamily } from "@/constants/fonts";
import { CheckInMethod, useCaregiverSetup } from "@/context/caregiver-setup";
import { router } from "expo-router";
import { useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, TextInput, View } from "react-native";
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
  const { firstName, method, displayName } = useCaregiverSetup();
  const recipientName = firstName.trim() || "Caregiver";
  const [rows, setRows] = useState<Row[]>([{ id: "you", kind: "you" }]);
  const nextId = useRef(0);
  const [sheet, setSheet] = useState<null | "backup">(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [backupName, setBackupName] = useState("");
  const [backupPhone, setBackupPhone] = useState("");
  const [backupRelationship, setBackupRelationship] = useState("");
  const [isCustomRelationship, setIsCustomRelationship] = useState(false);
  const [alertAfter, setAlertAfter] = useState(30);

  const [drag, setDrag] = useState<{ id: string; from: number } | null>(null);
  const [hoverIndex, setHoverIndex] = useState(0);
  const dragY = useRef(new Animated.Value(0)).current;
  const rowHeight = useRef(0);

  const targetIndex = (from: number, dy: number) =>
    Math.min(
      Math.max(Math.round(from + dy / (rowHeight.current || 1)), 0),
      rows.length - 1,
    );

  const startDrag = (id: string, from: number) => {
    dragY.setValue(0);
    setHoverIndex(from);
    setDrag({ id, from });
  };

  const moveDrag = (dy: number) => {
    if (!drag) return;
    dragY.setValue(dy);
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
    if (to < 0 || to >= rows.length) return;
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
      <View style={styles.content}>
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
                      <AppText style={styles.pillText}>
                        {index === 0 ? "First" : "Backup"}
                      </AppText>
                    </View>
                    {handle}
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
                          {recipientName}'s {row.relationship}
                          {index > 0 && " · Backup"}
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
      </View>
      <BottomSheet
        visible={sheet === "backup"}
        title={
          editingId === null ? "Add a backup contact" : "Edit backup contact"
        }
        subtitle={`If ${recipientName} misses a check-in and you don't respond, we'll tell them.`}
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
});
