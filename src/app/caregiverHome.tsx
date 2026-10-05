import { AppText } from "@/components/app-test";
import { BottomSheet } from "@/components/bottom-sheet";
import { CaregiverTabBar } from "@/components/caregiver-tab-bar";
import BellIcon from "@/components/icons/BellIcon";
import CheckBadgeIcon from "@/components/icons/CheckBadgeIcon";
import CircleIcon from "@/components/icons/CircleIcon";
import DashedCircleIcon from "@/components/icons/DashedCircleIcon";
import MessageIcon from "@/components/icons/MessageIcon";
import PhoneIcon from "@/components/icons/PhoneIcon";
import PhoneSquareIcon from "@/components/icons/PhoneSquareIcon";
import PlusIcon from "@/components/icons/PlusIcon";
import PointerIcon from "@/components/icons/PointerIcon";
import SoftCircleIcon from "@/components/icons/SoftCircleIcon";
import { SegmentedSlider } from "@/components/segmented-slider";
import { StepProgress } from "@/components/step-progress";
import { FigtreeFont, FontFamily } from "@/constants/fonts";
import { CheckInMethod, useCaregiverSetup } from "@/context/caregiver-setup";
import { formatTimeRange } from "@/utils/format-time-short";
import { useState } from "react";
import ArrowRightIcon from "@/components/icons/ArrowRightIcon";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
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

export default function CaregiverHome() {
  const {
    displayName: primaryName,
    yourFirstName,
    method: primaryMethod,
    windowStart: primaryWindowStart,
    windowEnd: primaryWindowEnd,
    people,
    addPerson,
  } = useCaregiverSetup();
  const [notificationsActive, setNotificationsActive] = useState(false);
  const [sheet, setSheet] = useState<"person" | "time" | null>(null);
  const [selectedId, setSelectedId] = useState(PRIMARY_ID);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newMethod, setNewMethod] = useState<CheckInMethod>("text");

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
  };

  const savePerson = () => {
    if (!canSavePerson) return;
    const added = addPerson({
      firstName: newName.trim(),
      phone: newPhone.trim(),
      method: newMethod,
      windowStart: primaryWindowStart,
      windowEnd: primaryWindowEnd,
    });
    setSelectedId(added.id);
    closeAddSheet();
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
              <Pressable
                key={person.id}
                onPress={() => setSelectedId(person.id)}
                accessibilityRole="button"
                accessibilityLabel={person.name}
                accessibilityState={{ selected }}
              >
                <View style={selected ? styles.chip : styles.chip2}>
                  {selected && (
                    <View style={styles.frame2}>
                      <AppText style={styles.chipText}>
                        {person.name.charAt(0).toUpperCase()}
                      </AppText>
                    </View>
                  )}
                  <AppText
                    style={selected ? styles.chipLabel : styles.chipLabel2}
                  >
                    {person.name}
                  </AppText>
                </View>
              </Pressable>
            );
          })}
          <Pressable
            onPress={() => setSheet("person")}
            accessibilityRole="button"
            accessibilityLabel="Add a person"
          >
            <View style={styles.chip2}>
              <AppText style={styles.chipLabel2}>+ Add</AppText>
            </View>
          </Pressable>
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
        <StepProgress step={2} total={3} />

        <Pressable
          style={styles.nextButton}
          onPress={savePerson}
          accessibilityRole="button"
        >
          <AppText style={styles.nextButtonText}>Add person</AppText>
        </Pressable>
        <Pressable
          onPress={() => setSheet("person")}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <AppText style={styles.fieldLabel}>Back</AppText>
        </Pressable>
      </BottomSheet>
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
  chip: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "flex-start",
    alignSelf: "flex-start",
    gap: 8,
    borderRadius: 20,
    backgroundColor: INK,
    flexDirection: "row",
  },
  chip2: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: "center",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDERCOLOR,
    backgroundColor: "#fff",
  },
  frame2: {
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 15,
    backgroundColor: SUN,
  },
  chipText: {
    color: RISE,
    fontSize: 14,
    fontFamily: FigtreeFont.extraBold,
    lineHeight: 18.2,
  },
  chipLabel: {
    fontSize: 16,
    color: "#fff",
    fontFamily: FigtreeFont.bold,
    lineHeight: 20.8,
  },
  chipLabel2: {
    fontSize: 16,
    color: INK,
    fontFamily: FigtreeFont.bold,
    lineHeight: 20.8,
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
});
