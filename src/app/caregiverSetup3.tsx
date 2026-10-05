import { AppText } from "@/components/app-test";
import { AlertOrder } from "@/components/alert-order";
import { BackButton } from "@/components/back-button";
import { BackupSheet } from "@/components/backup-sheet";
import { InviteEditorSheet, INVITE_SUFFIX } from "@/components/invite-editor-sheet";
import { InviteMessage } from "@/components/invite-message";
import { FigtreeFont, FontFamily } from "@/constants/fonts";
import {
  Backup,
  useCaregiverSetup,
} from "@/context/caregiver-setup";
import { router } from "expo-router";
import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StepProgress } from "@/components/step-progress";
import Svg, { Path } from "react-native-svg";
const INK = "#15163A";
const SUBTITLE = "#54566E";
const PRIMARY = "#4338CA";
const BACKGROUND = "#F5F4FA";

export default function CaregiverSetup3() {
  const {
    firstName,
    method,
    displayName,
    phone,
    yourFirstName,
    windowStart,
    windowEnd,
    backups,
    update,
  } = useCaregiverSetup();
  const recipientName = firstName.trim() || "Caregiver";
  const [sheet, setSheet] = useState<null | "backup" | "editInvite">(null);
  const [editingBackup, setEditingBackup] = useState<Backup | null>(null);

  const defaultInvite = `Hi ${displayName}, it's ${yourFirstName}. I set up Mira so I know you're okay each day.`;
  const [savedInvite, setSavedInvite] = useState<string | null>(null); // null = use the default

  const openAddBackup = () => {
    setEditingBackup(null);
    setSheet("backup");
  };

  const openEditBackup = (backup: Backup) => {
    setEditingBackup(backup);
    setSheet("backup");
  };

  const saveBackup = (data: Omit<Backup, "id">) => {
    update({
      backups: editingBackup
        ? backups.map((b) => (b.id === editingBackup.id ? { ...b, ...data } : b))
        : [...backups, { id: `backup-${Date.now()}`, ...data }],
    });
    setSheet(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <BackButton />
          <StepProgress step={3} total={3} />
        </View>
        <View style={styles.callout}>
          <AppText style={styles.calloutText}>Who should we alert?</AppText>
          <AppText style={styles.calloutSubtext}>
            If {recipientName} misses a check-in, we&apos;ll reach out in this
            order.
          </AppText>
        </View>
        <AlertOrder
          style={styles.alertOrder}
          recipientName={recipientName}
          method={method}
          backups={backups}
          onChangeBackups={(next) => update({ backups: next })}
          onEditBackup={openEditBackup}
          onAddBackup={openAddBackup}
        />
        <InviteMessage
          style={styles.invites}
          recipientName={displayName}
          phone={phone}
          message={`${savedInvite ?? defaultInvite} ${INVITE_SUFFIX}`}
          onEdit={() => setSheet("editInvite")}
        />
        <View style={styles.buttons}>
          <Pressable
            style={({ pressed }) => [
              styles.nextButton,
              pressed && styles.pressed,
            ]}
            accessibilityLabel="Next"
            accessibilityRole="button"
            onPress={() => router.push("/connected")}
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
      <BackupSheet
        visible={sheet === "backup"}
        onClose={() => setSheet(null)}
        recipientName={displayName}
        backup={editingBackup}
        onSave={saveBackup}
      />
      <InviteEditorSheet
        visible={sheet === "editInvite"}
        onClose={() => setSheet(null)}
        recipientName={displayName}
        defaultInvite={defaultInvite}
        invite={savedInvite ?? defaultInvite}
        windowStart={windowStart}
        windowEnd={windowEnd}
        onSave={(text) => {
          setSavedInvite(text);
          setSheet(null);
        }}
      />
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
  header: {
    flexDirection: "row",
    gap: 16,
    alignSelf: "stretch",
    alignItems: "center",
    marginTop: 36,
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
    marginTop: 22,
  },

  invites: {
    marginTop: 22,
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
