import { AlertOrder } from "@/components/alert-order";
import { AppText } from "@/components/app-test";
import { BackButton } from "@/components/back-button";
import { BackupSheet } from "@/components/backup-sheet";
import { BottomSheet } from "@/components/bottom-sheet";
import { Chip } from "@/components/chip";
import {
  ExtraTimePicker,
  formatMinutes,
  RECOMMENDED_EXTRA_MINUTES,
} from "@/components/extra-time-picker";
import ArrowRightIcon from "@/components/icons/ArrowRightIcon";
import ClockIcon from "@/components/icons/ClockIcon";
import DashedCircleIcon from "@/components/icons/DashedCircleIcon";
import MessageIcon from "@/components/icons/MessageIcon";
import PhoneIcon from "@/components/icons/PhoneIcon";
import PhoneSquareIcon from "@/components/icons/PhoneSquareIcon";
import PlusIcon from "@/components/icons/PlusIcon";
import SoftCircleIcon from "@/components/icons/SoftCircleIcon";
import {
  INVITE_SUFFIX,
  InviteEditorSheet,
} from "@/components/invite-editor-sheet";
import { InviteMessage } from "@/components/invite-message";
import { SegmentedSlider } from "@/components/segmented-slider";
import { StepProgress } from "@/components/step-progress";
import { TimeWindowPicker } from "@/components/time-window-picker";
import { WhichDays } from "@/components/which-days";
import { WINDOWS } from "@/constants/check-in-windows";
import { FigtreeFont } from "@/constants/fonts";
import {
  Backup,
  CheckInMethod,
  Person,
  useCaregiverSetup,
} from "@/context/caregiver-setup";
import { formatTime } from "@/utils/format-time";
import { useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import Svg, { Path } from "react-native-svg";

const INK = "#15163A";
const SUBTITLE = "#54566E";
const PRIMARY = "#4338CA";
const BACKGROUND = "#F5F4FA";
const BORDERCOLOR = "#E6E4EF";
const MINT = "#DDF3EE";
const RISE = "#8A3A12";
const GREEN = "#075E4F";
const PLACEHOLDER = "#8B8DA3";
const ALERT = "#C43A2B";

const METHOD_OPTIONS = [
  {
    label: "Text",
    value: "text" as CheckInMethod,
    icon: (color: string) => <MessageIcon size={20} color={color} />,
  },
  {
    label: "Call",
    value: "call" as CheckInMethod,
    icon: (color: string) => <PhoneIcon size={20} color={color} />,
  },
  {
    label: "App",
    value: "app" as CheckInMethod,
    icon: (color: string) => <PhoneSquareIcon size={20} color={color} />,
  },
];

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

type Step =
  | "person"
  | "time"
  | "window"
  | "extraTime"
  | "alert"
  | "backup"
  | "editInvite";

type Props = {
  visible: boolean;
  onClose: () => void;
  /** Called after the invite is sent and the person has been added */
  onAdded: (person: Person) => void;
};

/**
 * The "Who else are you caring for?" flow as a chain of bottom sheets:
 * person → check-in time → who we alert (with backup and invite editors).
 */
export function AddPersonSheets({ visible, onClose, onAdded }: Props) {
  const {
    displayName: primaryName,
    yourFirstName,
    windowStart: primaryWindowStart,
    windowEnd: primaryWindowEnd,
    backups: primaryBackups,
    addPerson,
  } = useCaregiverSetup();
  const [step, setStep] = useState<Step>("person");
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newMethod, setNewMethod] = useState<CheckInMethod>("text");
  const [newStart, setNewStart] = useState(primaryWindowStart);
  const [newEnd, setNewEnd] = useState(primaryWindowEnd);
  const [customWindow, setCustomWindow] = useState(false);
  const [newDays, setNewDays] = useState<number[]>(ALL_DAYS);
  const [newExtraMinutes, setNewExtraMinutes] = useState(
    RECOMMENDED_EXTRA_MINUTES,
  );
  const [newBackups, setNewBackups] = useState<Backup[]>([]);
  const [editingBackup, setEditingBackup] = useState<Backup | null>(null);
  const [newInvite, setNewInvite] = useState<string | null>(null); // null = use the default

  const sheet = visible ? step : null;

  // The first person's first backup can be reused without entering them again
  const existingBackup = primaryBackups[0];
  const canReuseBackup =
    !!existingBackup &&
    !newBackups.some(
      (b) => b.name === existingBackup.name && b.phone === existingBackup.phone,
    );
  const newRecipientName = newName.trim() || "They";
  const defaultInvite = `Hi ${newName.trim() || "there"}, it's ${yourFirstName.trim() || "your caregiver"}. I set up Mira so I know you're okay each day.`;
  const matchingWindowId = customWindow
    ? undefined
    : WINDOWS.find((w) => w.start === newStart && w.end === newEnd)?.id;
  const canSavePerson =
    newName.trim().length > 0 && newPhone.replace(/\D/g, "").length >= 10;

  const close = () => {
    setStep("person");
    setNewName("");
    setNewPhone("");
    setNewMethod("text");
    setNewStart(primaryWindowStart);
    setNewEnd(primaryWindowEnd);
    setCustomWindow(false);
    setNewDays(ALL_DAYS);
    setNewExtraMinutes(RECOMMENDED_EXTRA_MINUTES);
    setNewBackups([]);
    setEditingBackup(null);
    setNewInvite(null);
    onClose();
  };

  const openBackupSheet = (backup: Backup | null) => {
    setEditingBackup(backup);
    setStep("backup");
  };

  const saveBackup = (data: Omit<Backup, "id">) => {
    setNewBackups((current) =>
      editingBackup
        ? current.map((b) =>
            b.id === editingBackup.id ? { ...b, ...data } : b,
          )
        : [...current, { id: `backup-${Date.now()}`, ...data }],
    );
    setStep("alert");
  };

  const savePerson = () => {
    if (!canSavePerson) return;
    const added = addPerson({
      firstName: newName.trim(),
      phone: newPhone.trim(),
      method: newMethod,
      windowStart: newStart,
      windowEnd: newEnd,
      days: newDays,
      extraMinutes: newExtraMinutes,
      backups: newBackups,
    });
    close();
    onAdded(added);
  };

  return (
    <>
      <BottomSheet
        visible={sheet === "person"}
        title="Who else are you caring for?"
        onClose={close}
      >
        <StepProgress step={1} total={3} />
        <View style={styles.notes}>
          <View style={styles.avatars}>
            <View style={styles.avatar}>
              <View style={styles.avatarCircle}>
                <SoftCircleIcon size={32} />
              </View>
              <AppText style={styles.avatarLabel}>
                {primaryName.charAt(0).toUpperCase()}
              </AppText>
            </View>
            <View style={[styles.avatar, styles.avatarOverlap]}>
              <View style={styles.avatarCircle}>
                <DashedCircleIcon size={32} />
              </View>
              <View style={styles.avatarContent}>
                <PlusIcon size={14} />
              </View>
            </View>
          </View>
          <AppText style={styles.notesText}>
            {primaryName} stays on your home screen. You&apos;ll switch between
            people with the chips at the top.
          </AppText>
        </View>
        <View style={styles.fieldName}>
          <AppText style={styles.fieldLabel}>First Name</AppText>
          <TextInput
            style={styles.fieldInput}
            value={newName}
            onChangeText={setNewName}
            placeholder="Their First Name"
            placeholderTextColor={PLACEHOLDER}
            accessibilityLabel="First Name"
            autoCapitalize="words"
            autoComplete="given-name"
            textContentType="givenName"
          />
        </View>
        <View style={styles.fieldName}>
          <AppText style={styles.fieldLabel}>Phone Number</AppText>
          <TextInput
            style={styles.fieldInput}
            value={newPhone}
            onChangeText={setNewPhone}
            placeholder="(555) 123-4567"
            placeholderTextColor={PLACEHOLDER}
            accessibilityLabel="Phone Number"
            keyboardType="phone-pad"
            autoComplete="tel"
            textContentType="telephoneNumber"
          />
        </View>
        <View style={styles.methods}>
          <AppText style={styles.fieldLabel}>How will they check in?</AppText>
          <SegmentedSlider
            options={METHOD_OPTIONS}
            value={newMethod}
            onChange={setNewMethod}
            height={64}
          />
        </View>
        <Pressable
          style={[styles.nextButton, !canSavePerson && styles.disabled]}
          onPress={() => setStep("time")}
          disabled={!canSavePerson}
          accessibilityRole="button"
          accessibilityState={{ disabled: !canSavePerson }}
        >
          <AppText style={styles.nextButtonText}>Next: check-in time</AppText>
          <ArrowRightIcon size={20} color="#fff" strokeWidth={2} />
        </Pressable>
      </BottomSheet>
      <BottomSheet
        visible={sheet === "time"}
        title={`When should ${newName} check in?`}
        onClose={close}
      >
        <View style={styles.sheetHeader}>
          <BackButton onPress={() => setStep("person")} />
          <StepProgress step={2} total={3} />
        </View>
        <View style={styles.checkInWindow}>
          <AppText style={styles.fieldLabel}>Check-in window</AppText>
          <View style={styles.windowChips}>
            {WINDOWS.map((w) => (
              <Chip
                key={w.id}
                label={w.label}
                selected={matchingWindowId === w.id}
                onPress={() => {
                  setCustomWindow(false);
                  setNewStart(w.start);
                  setNewEnd(w.end);
                }}
              />
            ))}
          </View>
          <View style={styles.windowChips}>
            <Chip
              label="Custom"
              selected={customWindow}
              onPress={() => {
                setCustomWindow(true);
                setStep("window");
              }}
            />
          </View>
        </View>
        <WhichDays days={newDays} onChange={setNewDays} />

        <View style={styles.stepsCard}>
          <View style={styles.divider}></View>
          <View style={styles.row}>
            <View style={styles.iconTile}>
              <ClockIcon size={24} color={PRIMARY} strokeWidth={2} />
            </View>
            <View style={styles.textLabel}>
              <AppText style={styles.textLabelHeader}>
                Extra time before alerts
              </AppText>
              <View style={styles.value}>
                <AppText style={styles.minutes} numberOfLines={1}>
                  {formatMinutes(newExtraMinutes)}
                </AppText>
                {newExtraMinutes === RECOMMENDED_EXTRA_MINUTES && (
                  <View style={styles.pill}>
                    <AppText style={styles.pillText}>Recommended</AppText>
                  </View>
                )}
              </View>
            </View>
            <Pressable
              onPress={() => setStep("extraTime")}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Change extra time before alerts"
            >
              <AppText style={styles.changeButtonText}>Change</AppText>
            </Pressable>
          </View>
          <View style={styles.preview}>
            <View style={styles.frame2}>
              <AppText style={styles.frame2Text}>Window ends</AppText>
              <AppText style={styles.frame2Value}>{formatTime(newEnd)}</AppText>
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
            <View style={[styles.frame2, styles.frame2End]}>
              <AppText style={styles.frame2Text}>You&apos;re alerted</AppText>
              <AppText style={[styles.frame2Value, { color: ALERT }]}>
                {formatTime(newEnd + newExtraMinutes)}
              </AppText>
            </View>
          </View>
        </View>

        <Pressable
          style={[styles.nextButton, newDays.length === 0 && styles.disabled]}
          onPress={() => setStep("alert")}
          disabled={newDays.length === 0}
          accessibilityRole="button"
          accessibilityState={{ disabled: newDays.length === 0 }}
        >
          <AppText style={styles.nextButtonText}>Next: who we alert</AppText>
          <ArrowRightIcon size={20} color="#fff" strokeWidth={2} />
        </Pressable>
      </BottomSheet>
      <BottomSheet
        visible={sheet === "window"}
        title="Custom check-in window"
        onClose={() => setStep("time")}
      >
        <TimeWindowPicker
          start={newStart}
          end={newEnd}
          onChangeStart={setNewStart}
          onChangeEnd={setNewEnd}
        />
        <Pressable
          style={[styles.nextButton, newEnd <= newStart && styles.disabled]}
          onPress={() => setStep("time")}
          disabled={newEnd <= newStart}
          accessibilityRole="button"
          accessibilityState={{ disabled: newEnd <= newStart }}
        >
          <AppText style={styles.nextButtonText}>Save</AppText>
        </Pressable>
      </BottomSheet>
      <BottomSheet
        visible={sheet === "extraTime"}
        title="Extra time before alerts"
        subtitle="After the window ends, how long should we wait before alerting you?"
        onClose={() => setStep("time")}
      >
        <ExtraTimePicker
          extraMinutes={newExtraMinutes}
          onChange={setNewExtraMinutes}
          windowEnd={newEnd}
        />
        <Pressable
          style={styles.nextButton}
          onPress={() => setStep("time")}
          accessibilityRole="button"
        >
          <AppText style={styles.nextButtonText}>Save</AppText>
        </Pressable>
      </BottomSheet>
      <BottomSheet
        visible={sheet === "alert"}
        title={`Who should we alert if ${newName.trim() || "this person"} misses one?`}
        onClose={close}
      >
        <View style={styles.sheetHeader}>
          <BackButton onPress={() => setStep("time")} />
          <StepProgress step={3} total={3} />
        </View>
        <AlertOrder
          recipientName={newRecipientName}
          method={newMethod}
          backups={newBackups}
          onChangeBackups={setNewBackups}
          onEditBackup={openBackupSheet}
          onAddBackup={() => openBackupSheet(null)}
          suggestion={
            canReuseBackup
              ? {
                  label: `Add ${existingBackup.name}`,
                  avatarInitial: existingBackup.name
                    .trim()
                    .charAt(0)
                    .toUpperCase(),
                  note: `${existingBackup.name} is already a backup for ${primaryName}.`,
                  onPress: () =>
                    setNewBackups((current) => [
                      ...current,
                      { ...existingBackup, id: `backup-${Date.now()}` },
                    ]),
                }
              : undefined
          }
        />
        <InviteMessage
          recipientName={newName.trim() || "them"}
          phone={newPhone}
          message={`${newInvite ?? defaultInvite} ${INVITE_SUFFIX}`}
          onEdit={() => setStep("editInvite")}
        />

        <Pressable
          style={styles.nextButton}
          onPress={savePerson}
          accessibilityRole="button"
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
          <AppText style={styles.nextButtonText}>
            Send invite to {newName.trim() || "them"}
          </AppText>
        </Pressable>
      </BottomSheet>
      <BackupSheet
        visible={sheet === "backup"}
        onClose={() => setStep("alert")}
        recipientName={newName.trim() || "this person"}
        backup={editingBackup}
        onSave={saveBackup}
      />
      <InviteEditorSheet
        visible={sheet === "editInvite"}
        onClose={() => setStep("alert")}
        recipientName={newName.trim() || "they"}
        defaultInvite={defaultInvite}
        invite={newInvite ?? defaultInvite}
        windowStart={newStart}
        windowEnd={newEnd}
        onSave={(text) => {
          setNewInvite(text);
          setStep("alert");
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  sheetHeader: {
    flexDirection: "row",
    gap: 16,
    alignSelf: "stretch",
    alignItems: "center",
  },
  notes: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: "center",
    gap: 12,
    alignSelf: "stretch",
    flexDirection: "row",
    borderRadius: 16,
    backgroundColor: BACKGROUND,
  },
  avatars: {
    width: 56, // two 32px avatars overlapping by 8px
    height: 32,
    flexDirection: "row",
  },
  avatar: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  // Pulls the second avatar 8px over the first
  avatarOverlap: {
    marginLeft: -8,
  },
  // Circle sits behind the avatar content so the label/icon is centered on top
  avatarCircle: {
    position: "absolute",
    top: 0,
    left: 0,
  },
  // Keeps the label/icon above the absolutely positioned circle (needed on web,
  // where positioned elements paint over unpositioned ones like a raw <svg>)
  avatarContent: {
    position: "relative",
    zIndex: 1,
  },
  avatarLabel: {
    textAlign: "center",
    fontSize: 14,
    fontFamily: FigtreeFont.bold,
    color: RISE,
  },
  notesText: {
    flex: 1,
    fontSize: 15,
    color: SUBTITLE,
    fontFamily: FigtreeFont.semiBold,
  },
  fieldName: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 8,
    alignSelf: "stretch",
  },
  fieldLabel: {
    color: INK,
    fontSize: 16,
    fontFamily: FigtreeFont.bold,
    lineHeight: 20.8,
  },
  fieldInput: {
    height: 56,
    paddingHorizontal: 16,
    alignItems: "center",
    alignSelf: "stretch",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#DCD9E8",
    backgroundColor: "#fff",
    color: INK,
    fontSize: 18,
    lineHeight: 23.4,
    fontFamily: FigtreeFont.semiBold,
  },
  checkInWindow: {
    gap: 10,
    alignSelf: "stretch",
  },
  windowChips: {
    alignItems: "flex-start",
    gap: 8,
    alignSelf: "stretch",
    flexDirection: "row",
  },
  methods: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 8,
    alignSelf: "stretch",
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
  disabled: {
    opacity: 0.4,
  },
  stepsCard: {
    flexDirection: "column",
    alignItems: "flex-start",
    alignSelf: "stretch",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDERCOLOR,
    backgroundColor: "#fff",
  },
  divider: {
    height: 1,
    alignSelf: "stretch",
    backgroundColor: "#EFEDF5",
  },
  row: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    gap: 14,
    alignSelf: "stretch",
    flexDirection: "row",
  },
  iconTile: {
    width: 42,
    height: 42,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 13,
    backgroundColor: "#E7E4FB",
  },
  textLabel: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 2,
    flex: 1,
  },
  textLabelHeader: {
    color: INK,
    alignSelf: "stretch",
    fontSize: 16,
    fontFamily: FigtreeFont.bold,
  },
  value: {
    alignItems: "center",
    columnGap: 8,
    rowGap: 4,
    flexDirection: "row",
    flexWrap: "wrap",
  },
  minutes: {
    flexShrink: 0,
    color: SUBTITLE,
    fontSize: 15,
    fontFamily: FigtreeFont.bold,
  },
  pill: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    alignItems: "flex-start",
    borderRadius: 999,
    backgroundColor: MINT,
  },
  pillText: {
    color: GREEN,
    fontSize: 12,
    fontFamily: FigtreeFont.extraBold,
  },
  changeButtonText: {
    color: PRIMARY,
    fontSize: 16,
    fontFamily: FigtreeFont.extraBold,
  },
  preview: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    justifyContent: "space-between",
    alignItems: "center",
    alignSelf: "stretch",
    flexDirection: "row",
  },
  frame2End: {
    alignItems: "flex-end",
  },
  frame2: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 2,
  },
  frame2Text: {
    color: SUBTITLE,
    fontSize: 13,
    lineHeight: 16.9,
    fontFamily: FigtreeFont.extraBold,
  },
  frame2Value: {
    color: INK,
    fontSize: 17,
    lineHeight: 22.1,
    fontFamily: FigtreeFont.extraBold,
  },
});
