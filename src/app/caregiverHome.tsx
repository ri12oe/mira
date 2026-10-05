import { AlertOrder } from "@/components/alert-order";
import { AppText } from "@/components/app-test";
import { BackButton } from "@/components/back-button";
import { BackupSheet } from "@/components/backup-sheet";
import { BottomSheet } from "@/components/bottom-sheet";
import { CaregiverTabBar } from "@/components/caregiver-tab-bar";
import { Chip } from "@/components/chip";
import {
  ExtraTimePicker,
  formatMinutes,
  RECOMMENDED_EXTRA_MINUTES,
} from "@/components/extra-time-picker";
import ArrowRightIcon from "@/components/icons/ArrowRightIcon";
import BellIcon from "@/components/icons/BellIcon";
import CheckBadgeIcon from "@/components/icons/CheckBadgeIcon";
import CircleIcon from "@/components/icons/CircleIcon";
import ClockIcon from "@/components/icons/ClockIcon";
import DashedCircleIcon from "@/components/icons/DashedCircleIcon";
import MessageIcon from "@/components/icons/MessageIcon";
import PhoneIcon from "@/components/icons/PhoneIcon";
import PhoneSquareIcon from "@/components/icons/PhoneSquareIcon";
import PlusIcon from "@/components/icons/PlusIcon";
import PointerIcon from "@/components/icons/PointerIcon";
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
import { FigtreeFont, FontFamily } from "@/constants/fonts";
import {
  Backup,
  CheckInMethod,
  useCaregiverSetup,
} from "@/context/caregiver-setup";
import { formatTime } from "@/utils/format-time";
import { formatTimeRange } from "@/utils/format-time-short";
import { router } from "expo-router";
import { useState } from "react";
import {
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
const SUN = "#FFE8DB";
const LILAC = "#E7E4FB";
const RISE = "#8A3A12";
const GREEN = "#075E4F";
const YELLOW = "#F5B53D";
const ORANGE = "#C2551F";
const PLACEHOLDER = "#8B8DA3";
const ALERT = "#C43A2B";

const METHOD_LABELS: Record<CheckInMethod, string> = {
  text: "Text reply",
  call: "Phone call",
  app: "Mira app",
};

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

const DAYS = ["M", "T", "W", "Th", "F", "S", "Su"];
const PRIMARY_ID = "primary";
const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

export default function CaregiverHome() {
  const {
    displayName: primaryName,
    yourFirstName,
    method: primaryMethod,
    windowStart: primaryWindowStart,
    windowEnd: primaryWindowEnd,
    people,
    backups: primaryBackups,
    addPerson,
  } = useCaregiverSetup();
  const [notificationsActive, setNotificationsActive] = useState(false);
  const [sheet, setSheet] = useState<
    | "person"
    | "time"
    | "window"
    | "extraTime"
    | "alert"
    | "backup"
    | "editInvite"
    | null
  >(null);
  const [selectedId, setSelectedId] = useState(PRIMARY_ID);
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

  const selectedPerson = people.find((p) => p.id === selectedId);
  const displayName = selectedPerson?.firstName ?? primaryName;
  const method = selectedPerson?.method ?? primaryMethod;
  const windowStart = selectedPerson?.windowStart ?? primaryWindowStart;
  const windowEnd = selectedPerson?.windowEnd ?? primaryWindowEnd;

  const canSavePerson =
    newName.trim().length > 0 && newPhone.replace(/\D/g, "").length >= 10;

  const closeAddSheet = () => {
    setSheet(null);
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
  };

  const openBackupSheet = (backup: Backup | null) => {
    setEditingBackup(backup);
    setSheet("backup");
  };

  const saveBackup = (data: Omit<Backup, "id">) => {
    setNewBackups((current) =>
      editingBackup
        ? current.map((b) =>
            b.id === editingBackup.id ? { ...b, ...data } : b,
          )
        : [...current, { id: `backup-${Date.now()}`, ...data }],
    );
    setSheet("alert");
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
    setSelectedId(added.id);
    closeAddSheet();
    router.push("/connected2");
  };

  const now = new Date();
  const hour = now.getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const caregiverName = yourFirstName.trim();
  const dateLabel = now.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
  const checkInWindow = formatTimeRange(windowStart, windowEnd);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.frame}>
            <AppText style={styles.date}>{dateLabel}</AppText>
            <AppText style={styles.greeting}>
              {greeting}
              {caregiverName ? `, ${caregiverName}` : ""}
            </AppText>
          </View>
          <Pressable
            style={[
              styles.notifications,
              notificationsActive && styles.notificationsActive,
            ]}
            onPress={() => setNotificationsActive((active) => !active)}
            accessibilityRole="button"
            accessibilityLabel="Notifications"
            accessibilityState={{ selected: notificationsActive }}
          >
            <BellIcon size={22} color={notificationsActive ? ORANGE : INK} />
          </Pressable>
        </View>
        <View style={styles.peopleChips}>
          {[
            { id: PRIMARY_ID, name: primaryName },
            ...people.map((p) => ({ id: p.id, name: p.firstName })),
          ].map((person) => {
            const selected = person.id === selectedId;
            return (
              <Chip
                key={person.id}
                variant="person"
                label={person.name}
                avatar={person.name.charAt(0).toUpperCase()}
                selected={selected}
                onPress={() => setSelectedId(person.id)}
              />
            );
          })}
          <Chip
            variant="person"
            label="+ Add"
            accessibilityLabel="Add a person"
            onPress={() => setSheet("person")}
          />
        </View>
        <View style={styles.statusCard}>
          <View style={styles.frame3}>
            <CheckBadgeIcon size={64} />
            <View style={styles.texts}>
              <AppText style={styles.textHeader}>Checked in</AppText>
              <AppText style={styles.textSubHeader}>
                Mira checks in with {displayName}
              </AppText>
              <AppText style={styles.method}>
                Checks in by {METHOD_LABELS[method]}
              </AppText>
            </View>
          </View>
          <View style={styles.nextCheckIn}>
            <AppText style={styles.nextCheckInText}>Check-in window</AppText>
            <AppText style={styles.nextCheckInTime}>{checkInWindow}</AppText>
          </View>
        </View>
        <View style={styles.thisWeek}>
          <AppText style={styles.title}>This week</AppText>
          <View style={styles.days}>
            {DAYS.map((day) => (
              <View key={day} style={styles.day}>
                <AppText style={styles.dayLabel}>{day}</AppText>
                <CircleIcon size={30} outlined color={SUBTITLE} />
              </View>
            ))}
          </View>
          <View style={styles.Legend}>
            <View style={styles.legendItem}>
              <CircleIcon size={10} />
              <AppText style={styles.LegendLabel}>On time</AppText>
            </View>
            <View style={styles.legendItem}>
              <CircleIcon size={10} color={YELLOW} />
              <AppText style={styles.LegendLabel}>Late</AppText>
            </View>
          </View>
        </View>
        <View style={styles.quickActions}>
          <View style={styles.quickActionItem}>
            <View style={[styles.iconTile, { backgroundColor: LILAC }]}>
              <PhoneIcon size={20} color={PRIMARY} />
            </View>
            <AppText style={styles.iconTileLabel}>Call {displayName}</AppText>
          </View>
          <View style={styles.quickActionItem}>
            <View style={[styles.iconTile, { backgroundColor: SUN }]}>
              <PointerIcon size={20} />
            </View>
            <AppText style={styles.iconTileLabel}>Check in now</AppText>
          </View>
        </View>
      </ScrollView>
      <CaregiverTabBar />
      <BottomSheet
        visible={sheet === "person"}
        title="Who else are you caring for?"
        onClose={closeAddSheet}
      >
        <StepProgress step={1} total={3} />
        <View style={styles.notes}>
          <View style={styles.avatars}>
            <View style={styles.avatar}>
              <View style={styles.avatarCircle}>
                <SoftCircleIcon size={32} />
              </View>
              <AppText style={styles.avatarLabel}>L</AppText>
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
          onPress={() => setSheet("time")}
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
        onClose={closeAddSheet}
      >
        <View style={styles.sheetHeader}>
          <BackButton onPress={() => setSheet("person")} />
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
              label={customWindow ? `Custom` : "Custom"}
              selected={customWindow}
              onPress={() => {
                setCustomWindow(true);
                setSheet("window");
              }}
            />
          </View>
        </View>
        <WhichDays days={newDays} onChange={setNewDays} />

        <View style={styles.stepsCard}>
          <View style={styles.divider}></View>
          <View style={styles.row}>
            <View style={styles.IconTile}>
              <ClockIcon size={24} color={PRIMARY} strokeWidth={2} />
            </View>
            <View style={styles.textLabel}>
              <AppText style={styles.textLabelHeader}>
                Extra time before alerts
              </AppText>
              <View style={styles.value}>
                <AppText style={styles.minutues} numberOfLines={1}>
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
              onPress={() => setSheet("extraTime")}
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
          onPress={() => setSheet("alert")}
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
        onClose={() => setSheet("time")}
      >
        <TimeWindowPicker
          start={newStart}
          end={newEnd}
          onChangeStart={setNewStart}
          onChangeEnd={setNewEnd}
        />
        <Pressable
          style={[styles.nextButton, newEnd <= newStart && styles.disabled]}
          onPress={() => setSheet("time")}
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
        onClose={() => setSheet("time")}
      >
        <ExtraTimePicker
          extraMinutes={newExtraMinutes}
          onChange={setNewExtraMinutes}
          windowEnd={newEnd}
        />
        <Pressable
          style={styles.nextButton}
          onPress={() => setSheet("time")}
          accessibilityRole="button"
        >
          <AppText style={styles.nextButtonText}>Save</AppText>
        </Pressable>
      </BottomSheet>
      <BottomSheet
        visible={sheet === "alert"}
        title={`Who should we alert if ${newName.trim() || "this person"} misses one?`}
        onClose={closeAddSheet}
      >
        <View style={styles.sheetHeader}>
          <BackButton onPress={() => setSheet("time")} />
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
                  avatarInitial: existingBackup.name.trim().charAt(0).toUpperCase(),
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
          onEdit={() => setSheet("editInvite")}
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
        onClose={() => setSheet("alert")}
        recipientName={newName.trim() || "this person"}
        backup={editingBackup}
        onSave={saveBackup}
      />
      <InviteEditorSheet
        visible={sheet === "editInvite"}
        onClose={() => setSheet("alert")}
        recipientName={newName.trim() || "they"}
        defaultInvite={defaultInvite}
        invite={newInvite ?? defaultInvite}
        windowStart={newStart}
        windowEnd={newEnd}
        onSave={(text) => {
          setNewInvite(text);
          setSheet("alert");
        }}
      />
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
    gap: 18,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 108,
  },
  sheetHeader: {
    flexDirection: "row",
    gap: 16,
    alignSelf: "stretch",
    alignItems: "center",
  },
  header: {
    justifyContent: "space-between",
    alignItems: "center",
    flexDirection: "row",
    alignSelf: "stretch",
    gap: 12,
    marginTop: 56,
  },
  frame: {
    flex: 1,
    minWidth: 0,
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 2,
  },
  date: {
    color: SUBTITLE,
    fontSize: 15,
    lineHeight: 21,
    fontFamily: FigtreeFont.semiBold,
  },
  greeting: {
    color: INK,
    fontSize: 28,
    fontFamily: FontFamily.bold,
    lineHeight: 32.2,
    letterSpacing: -0.4,
    flexShrink: 1,
  },
  notifications: {
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDERCOLOR,
    backgroundColor: "#fff",
  },
  notificationsActive: {
    borderColor: ORANGE,
    backgroundColor: SUN,
  },
  peopleChips: {
    alignItems: "flex-start",
    gap: 8,
    flexDirection: "row",
  },
  statusCard: {
    padding: 22,
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 18,
    alignSelf: "stretch",
    borderRadius: 28,
    backgroundColor: MINT,
  },
  frame3: {
    alignItems: "center",
    gap: 16,
    alignSelf: "stretch",
    flexDirection: "row",
  },
  texts: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 3,
    flex: 1,
  },
  textHeader: {
    color: GREEN,
    fontSize: 14,
    lineHeight: 18.2,
    fontFamily: FigtreeFont.extraBold,
  },
  textSubHeader: {
    color: INK,
    fontSize: 25,
    lineHeight: 28.65,
    letterSpacing: -0.4,
    fontFamily: FontFamily.bold,
  },
  method: {
    color: GREEN,
    fontSize: 16,
    fontFamily: FigtreeFont.semiBold,
    lineHeight: 23.2,
  },
  nextCheckIn: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    justifyContent: "space-between",
    alignItems: "center",
    alignSelf: "stretch",
    borderRadius: 16,
    backgroundColor: "#fff",
    flexDirection: "row",
  },
  nextCheckInText: {
    color: SUBTITLE,
    fontSize: 15,
    fontFamily: FigtreeFont.semiBold,
    lineHeight: 21,
  },
  nextCheckInTime: {
    color: INK,
    fontSize: 16,
    lineHeight: 20.8,
    fontFamily: FigtreeFont.bold,
  },
  thisWeek: {
    paddingVertical: 18,
    paddingHorizontal: 20,
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 14,
    alignSelf: "stretch",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: BORDERCOLOR,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 16,
    color: INK,
    fontFamily: FigtreeFont.bold,
    lineHeight: 20.8,
  },
  days: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignSelf: "stretch",
    alignItems: "flex-start",
  },
  day: {
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
  },
  dayLabel: {
    fontSize: 14,
    color: SUBTITLE,
    lineHeight: 16.9,
    fontFamily: FigtreeFont.extraBold,
  },
  Legend: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
  },
  legendItem: {
    alignItems: "center",
    gap: 6,
    flexDirection: "row",
  },
  LegendLabel: {
    color: SUBTITLE,
    fontSize: 14,
    lineHeight: 19.6,
    fontFamily: FigtreeFont.semiBold,
  },
  quickActions: {
    alignItems: "flex-start",
    gap: 12,
    alignSelf: "stretch",
    flexDirection: "row",
  },
  quickActionItem: {
    padding: 16,
    alignItems: "center",
    gap: 12,
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDERCOLOR,
    backgroundColor: "#fff",
    flexDirection: "row",
  },
  iconTile: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 13,
  },
  iconTileLabel: {
    color: INK,
    fontSize: 16,
    lineHeight: 20.8,
    fontFamily: FigtreeFont.bold,
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
  pressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.9,
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
  IconTile: {
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
  minutues: {
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
