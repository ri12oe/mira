import { AppText } from "@/components/app-test";
import { AlertOrder } from "@/components/alert-order";
import { BackButton } from "@/components/back-button";
import { BackupSheet } from "@/components/backup-sheet";
import { BottomSheet } from "@/components/bottom-sheet";
import { formatMinutes } from "@/components/extra-time-picker";
import BellIcon from "@/components/icons/BellIcon";
import CheckBadgeLargeIcon from "@/components/icons/CheckBadgeLargeIcon";
import ClockIcon from "@/components/icons/ClockIcon";
import MessageIcon from "@/components/icons/MessageIcon";
import PhoneIcon from "@/components/icons/PhoneIcon";
import { RadioCircle } from "@/components/radio-circle";
import { SegmentedSlider } from "@/components/segmented-slider";
import { FigtreeFont, FontFamily } from "@/constants/fonts";
import { Backup, useCaregiverSetup } from "@/context/caregiver-setup";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

const INK = "#15163A";
const BACKGROUND = "#F5F4FA";
const SUBTITLE = "#54566E";
const MINT = "#DDF3EE";
const GREEN = "#134A40";
const PRIMARY = "#4338CA";
const BORDER = "#E6E4EF";
const ORANGE = "#C2551F";
const SUN = "#FFE8DB";
const REACH_OPTIONS = [
  { label: "Text", value: "text", icon: (color: string) => <MessageIcon size={20} color={color} /> },
  { label: "Phone Call", value: "call", icon: (color: string) => <PhoneIcon size={20} color={color} /> },
];
const WAIT_OPTIONS = [15, 30, 60, 120];

export default function CheckInNow() {
  const {
    displayName,
    yourFirstName,
    method: primaryMethod,
    people,
    backups: primaryBackups,
  } = useCaregiverSetup();
  const { personId } = useLocalSearchParams<{ personId?: string }>();
  const person = people.find((person) => person.id === personId);
  const primaryName = person?.firstName ?? displayName;
  const [method, setMethod] = useState(
    (person?.method ?? primaryMethod) === "call" ? "call" : "text",
  );
  const defaultMessage = `Hi ${primaryName}, ${yourFirstName.trim() || "your caregiver"} is checking you're okay. Reply YES if you're fine.`;
  const defaultCallMessage = `Hi ${primaryName}, ${yourFirstName.trim() || "your caregiver"} is checking you're okay. Please confirm you're fine.`;
  const [textMessage, setTextMessage] = useState(defaultMessage);
  const [callMessage, setCallMessage] = useState(defaultCallMessage);
  const message = method === "text" ? textMessage : callMessage;
  const [waitMinutes, setWaitMinutes] = useState(15);
  const [backups, setBackups] = useState<Backup[]>(person?.backups ?? primaryBackups);
  const [sheet, setSheet] = useState<"message" | "wait" | "alerts" | "backup" | null>(null);
  const [draftMessage, setDraftMessage] = useState("");
  const [draftWait, setDraftWait] = useState(waitMinutes);
  const [customWait, setCustomWait] = useState(false);
  const [customMinutes, setCustomMinutes] = useState("");
  const customWaitMinutes = Number(customMinutes);
  const validCustomWait =
    /^\d+$/.test(customMinutes) &&
    Number.isSafeInteger(customWaitMinutes) &&
    customWaitMinutes > 0;
  const canSaveWait = !customWait || validCustomWait;
  const [draftBackups, setDraftBackups] = useState<Backup[]>([]);
  const [editingBackup, setEditingBackup] = useState<Backup | null>(null);
  const closeSheet = () => setSheet(null);
  const openBackup = (backup: Backup | null) => {
    setEditingBackup(backup);
    setSheet("backup");
  };
  const saveBackup = (data: Omit<Backup, "id">) => {
    setDraftBackups((current) =>
      editingBackup
        ? current.map((backup) => backup.id === editingBackup.id ? { ...backup, ...data } : backup)
        : [...current, { ...data, id: `backup-${Date.now()}` }],
    );
    setSheet("alerts");
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <BackButton />
          <AppText style={styles.topBarText}>Check in now</AppText>
        </View>
        <View style={styles.header}>
          <AppText style={styles.headerText}>
            Check on {primaryName} now
          </AppText>
          <AppText style={styles.headerSubtitle}>
            We&apos;ll ask {primaryName} to confirm okay, even outside usual
            time.
          </AppText>
        </View>
        <View style={styles.alreadyCheckedIn}>
          <CheckBadgeLargeIcon />
          <AppText style={styles.alreadyCheckedInText}>
            {primaryName} checked in today at{" "}
            <AppText style={styles.alreadyCheckedInTextBold}>9:14 AM</AppText>{" "}
            by text.
          </AppText>
        </View>
        <View style={styles.howtoReach}>
          <AppText style={styles.howtoReachText}>
            How should we reach {primaryName}?
          </AppText>
          <SegmentedSlider
            options={REACH_OPTIONS}
            value={method}
            onChange={setMethod}
            height={64}
          />
        </View>
        <View style={styles.message}>
          <View style={styles.labelrow}>
            <AppText style={styles.labelrowText}>
              {method === "text" ? `${primaryName} will get` : `${primaryName} will hear`}
            </AppText>
            <Pressable
              onPress={() => {
                setDraftMessage(message);
                setSheet("message");
              }}
              style={({ pressed }) => pressed && styles.pressed}
              accessibilityRole="button"
              accessibilityLabel="Edit check-in message"
              accessibilityHint="Opens the message editor"
              hitSlop={10}
            >
              <AppText style={styles.editButtonText}>Edit</AppText>
            </Pressable>
          </View>
          <View style={styles.messagePreview}>
            <View style={styles.bubble}>
              <AppText style={styles.bubbleText}>
                {message}
              </AppText>
            </View>
          </View>
        </View>
        <View style={styles.ifDontReply}>
          <AppText style={styles.ifDontReplyText}>
            If {primaryName} doesn&apos;t {method === "text" ? "reply" : "confirm"}
          </AppText>
          <View style={styles.stepCards}>
            <View style={styles.row}>
              <View style={styles.IconTile}>
                <ClockIcon size={20} color={PRIMARY} />
              </View>
              <View style={styles.texts}>
                <AppText style={styles.textsTitle}>We wait</AppText>
                <AppText style={styles.textsub}>{formatMinutes(waitMinutes)}</AppText>
              </View>
              <Pressable
                onPress={() => {
                  setDraftWait(waitMinutes);
                  setCustomWait(!WAIT_OPTIONS.includes(waitMinutes));
                  setCustomMinutes(String(waitMinutes));
                  setSheet("wait");
                }}
                style={({ pressed }) => pressed && styles.pressed}
                accessibilityRole="button"
                accessibilityLabel="Change wait time"
                hitSlop={10}
              >
                <AppText style={[styles.editButtonText, { fontSize: 16 }]}>
                  Change
                </AppText>
              </Pressable>
            </View>
            <View style={styles.row}>
              <View style={[styles.IconTile, { backgroundColor: SUN }]}>
                <BellIcon size={20} color={ORANGE} />
              </View>
              <View style={styles.texts}>
                <AppText style={styles.textsTitle}>Then we alert</AppText>
                <AppText style={styles.textsub}>
                  {backups.length ? `You, then ${backups.map((backup) => backup.name).join(", ")}` : "Only you"}
                </AppText>
              </View>
              <Pressable
                onPress={() => {
                  setDraftBackups(backups);
                  setSheet("alerts");
                }}
                style={({ pressed }) => pressed && styles.pressed}
                accessibilityRole="button"
                accessibilityLabel="Change who gets alerted"
                hitSlop={10}
              >
                <AppText style={[styles.editButtonText, { fontSize: 16 }]}>
                  Change
                </AppText>
              </Pressable>
            </View>
          </View>
        </View>
        <View style={styles.buttons}>
          <Pressable
            style={({ pressed }) => [
              styles.nextButton,
              pressed && styles.pressed,
            ]}
            accessibilityLabel={`Send check-in to ${primaryName}`}
            accessibilityRole="button"
            onPress={() => router.push("/caregiverHome")}
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
              Send check-in to {primaryName}
            </AppText>
          </Pressable>
        </View>
      </ScrollView>
      <BottomSheet
        visible={sheet === "message"}
        title={method === "text" ? "Edit check-in message" : "Edit call message"}
        onClose={closeSheet}
      >
        <TextInput
          value={draftMessage}
          onChangeText={setDraftMessage}
          multiline
          textAlignVertical="top"
          style={styles.messageInput}
          accessibilityLabel="Check-in message"
          placeholder="Write your check-in message"
        />
        <Pressable
          onPress={() => setDraftMessage(method === "text" ? defaultMessage : defaultCallMessage)}
          accessibilityRole="button"
          accessibilityLabel="Reset check-in message"
          style={({ pressed }) => [styles.sheetAction, pressed && styles.pressed]}
        >
          <AppText style={styles.editButtonText}>Reset message</AppText>
        </Pressable>
        <Pressable
          onPress={() => {
            if (method === "text") setTextMessage(draftMessage.trim());
            else setCallMessage(draftMessage.trim());
            closeSheet();
          }}
          disabled={!draftMessage.trim()}
          accessibilityRole="button"
          accessibilityLabel="Save message"
          accessibilityState={{ disabled: !draftMessage.trim() }}
          style={({ pressed }) => [
            styles.nextButton,
            !draftMessage.trim() && styles.disabled,
            pressed && styles.pressed,
          ]}
        >
          <AppText style={styles.nextButtonText}>Save message</AppText>
        </Pressable>
      </BottomSheet>
      <BottomSheet
        visible={sheet === "wait"}
        title="Time before alerts"
        subtitle={`How long should we wait for ${primaryName} to confirm?`}
        onClose={closeSheet}
      >
        {WAIT_OPTIONS.map((minutes) => (
          <Pressable
            key={minutes}
            onPress={() => {
              setDraftWait(minutes);
              setCustomWait(false);
            }}
            accessibilityRole="radio"
            accessibilityLabel={formatMinutes(minutes)}
            accessibilityState={{ checked: !customWait && draftWait === minutes }}
            style={({ pressed }) => [
              styles.waitOption,
              !customWait && draftWait === minutes && styles.waitOptionSelected,
              pressed && styles.pressed,
            ]}
          >
            <AppText style={styles.textsub}>{formatMinutes(minutes)}</AppText>
            <RadioCircle selected={!customWait && draftWait === minutes} />
          </Pressable>
        ))}
        <Pressable
          onPress={() => setCustomWait(true)}
          accessibilityRole="radio"
          accessibilityLabel="Custom wait time"
          accessibilityState={{ checked: customWait }}
          style={({ pressed }) => [
            styles.waitOption,
            customWait && styles.waitOptionSelected,
            pressed && styles.pressed,
          ]}
        >
          <AppText style={styles.textsub}>Custom</AppText>
          <RadioCircle selected={customWait} />
        </Pressable>
        {customWait && (
          <View style={styles.customWaitField}>
            <AppText style={styles.labelrowText}>Minutes before alerts</AppText>
            <TextInput
              value={customMinutes}
              onChangeText={setCustomMinutes}
              keyboardType="number-pad"
              style={styles.customWaitInput}
              accessibilityLabel="Custom wait time in minutes"
              accessibilityHint="Enter a positive whole number of minutes"
              placeholder="e.g. 45"
            />
            {!validCustomWait && (
              <AppText style={styles.validationError} accessibilityLiveRegion="polite">
                Enter a positive whole number of minutes.
              </AppText>
            )}
          </View>
        )}
        <Pressable
          onPress={() => {
            setWaitMinutes(customWait ? customWaitMinutes : draftWait);
            closeSheet();
          }}
          disabled={!canSaveWait}
          accessibilityRole="button"
          accessibilityLabel="Save wait time"
          accessibilityState={{ disabled: !canSaveWait }}
          style={({ pressed }) => [
            styles.nextButton,
            !canSaveWait && styles.disabled,
            pressed && styles.pressed,
          ]}
        >
          <AppText style={styles.nextButtonText}>Save wait time</AppText>
        </Pressable>
      </BottomSheet>
      <BottomSheet
        visible={sheet === "alerts"}
        title="Who should we alert?"
        subtitle="These changes apply to this check-in only."
        onClose={closeSheet}
      >
        <AlertOrder
          recipientName={yourFirstName.trim() || "You"}
          method={method === "call" ? "call" : "text"}
          backups={draftBackups}
          onChangeBackups={setDraftBackups}
          onEditBackup={openBackup}
          onAddBackup={() => openBackup(null)}
        />
        <Pressable
          onPress={() => {
            setBackups(draftBackups);
            closeSheet();
          }}
          accessibilityRole="button"
          accessibilityLabel="Save alert contacts"
          style={({ pressed }) => [styles.nextButton, pressed && styles.pressed]}
        >
          <AppText style={styles.nextButtonText}>Save alert contacts</AppText>
        </Pressable>
      </BottomSheet>
      <BackupSheet
        visible={sheet === "backup"}
        onClose={() => setSheet("alerts")}
        recipientName={primaryName}
        backup={editingBackup}
        onSave={saveBackup}
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
    gap: 20,
    paddingHorizontal: 24,
    paddingVertical: 24,
    paddingBottom: 108,
    marginTop: 56,
  },
  topBar: {
    alignItems: "center",
    gap: 16,
    alignSelf: "stretch",
    flexDirection: "row",
  },
  topBarText: {
    fontFamily: FigtreeFont.bold,
    fontSize: 16,
    color: SUBTITLE,
  },
  header: {
    flexDirection: "column",
    gap: 8,
    alignItems: "flex-start",
    alignSelf: "stretch",
  },
  headerText: {
    color: INK,
    alignSelf: "stretch",
    fontSize: 32,
    lineHeight: 35.2,
    letterSpacing: -0.8,
    fontFamily: FontFamily.bold,
  },
  headerSubtitle: {
    alignSelf: "stretch",
    color: SUBTITLE,
    fontSize: 17,
    lineHeight: 24.65,
    fontFamily: FigtreeFont.medium,
  },
  alreadyCheckedIn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
    alignSelf: "stretch",
    borderRadius: 16,
    backgroundColor: MINT,
    flexDirection: "row",
    alignItems: "center",
  },
  alreadyCheckedInText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 21,
    fontFamily: FigtreeFont.semiBold,
    color: GREEN,
  },
  alreadyCheckedInTextBold: {
    fontSize: 15,
    lineHeight: 21,
    fontFamily: FigtreeFont.extraBold,
    color: GREEN,
  },
  howtoReach: {
    flexDirection: "column",
    gap: 8,
    alignItems: "flex-start",
    alignSelf: "stretch",
  },
  howtoReachText: {
    color: INK,
    fontSize: 16,
    fontFamily: FigtreeFont.bold,
  },
  messageInput: {
    minHeight: 140,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDER,
    color: INK,
    fontFamily: FigtreeFont.semiBold,
    fontSize: 16,
    lineHeight: 24,
  },
  sheetAction: {
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  waitOption: {
    minHeight: 56,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  waitOptionSelected: {
    backgroundColor: "#F1EFFD",
    borderColor: PRIMARY,
  },
  customWaitField: {
    gap: 8,
  },
  customWaitInput: {
    minHeight: 56,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    color: INK,
    fontFamily: FigtreeFont.semiBold,
    fontSize: 16,
  },
  validationError: {
    color: "#C43A2B",
    fontFamily: FigtreeFont.medium,
    fontSize: 14,
  },
  message: {
    flexDirection: "column",
    gap: 8,
    alignItems: "flex-start",
    alignSelf: "stretch",
  },
  labelrow: {
    justifyContent: "space-between",
    alignItems: "center",
    alignSelf: "stretch",
    flexDirection: "row",
  },
  labelrowText: {
    color: INK,
    fontSize: 16,
    fontFamily: FigtreeFont.bold,
  },
  editButtonText: {
    color: PRIMARY,
    fontSize: 15,
    fontFamily: FigtreeFont.extraBold,
  },
  messagePreview: {
    padding: 14,
    flexDirection: "column",
    alignItems: "flex-start",
    alignSelf: "stretch",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: "#fff",
  },
  bubble: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: "flex-start",
    alignSelf: "stretch",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomRightRadius: 18,
    borderBottomLeftRadius: 6,
    backgroundColor: "#F1EFFD",
  },
  bubbleText: {
    flex: 1,
    color: INK,
    fontSize: 16,
    lineHeight: 23.2,
    fontFamily: FigtreeFont.semiBold,
  },
  ifDontReply: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 8,
    alignSelf: "stretch",
  },
  ifDontReplyText: {
    color: INK,
    fontSize: 16,
    fontFamily: FigtreeFont.bold,
  },
  stepCards: {
    flexDirection: "column",
    alignItems: "flex-start",
    alignSelf: "stretch",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: "#fff",
  },
  row: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    gap: 14,
    alignSelf: "stretch",
    borderBottomColor: "#EFEDF5",
    borderBottomWidth: 1,
  },
  IconTile: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 13,
    backgroundColor: "#E7E4FB",
  },
  texts: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 2,
    flex: 1,
  },
  textsTitle: {
    color: SUBTITLE,
    fontSize: 15,
    fontFamily: FigtreeFont.semiBold,
  },
  textsub: {
    color: INK,
    fontSize: 16,
    fontFamily: FigtreeFont.extraBold,
  },
  buttons: {},
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
