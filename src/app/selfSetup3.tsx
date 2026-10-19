import { randomUUID } from "expo-crypto";
import { AppText } from "@/components/app-test";
import { BackButton } from "@/components/back-button";
import { BackupSheet } from "@/components/backup-sheet";
import { FigtreeFont, FontFamily } from "@/constants/fonts";
import {
  Backup,
  useCaregiverSetup,
} from "@/context/caregiver-setup";
import { router } from "expo-router";
import { useState } from "react";
import {
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import { StepProgress } from "@/components/step-progress";
import BellIcon from "@/components/icons/BellIcon";
import PhoneIcon from "@/components/icons/PhoneIcon";
import PlusIcon from "@/components/icons/PlusIcon";
import UserIcon from "@/components/icons/UserIcon";
const INK = "#15163A";
const SUBTITLE = "#54566E";
const PRIMARY = "#4338CA";
const BACKGROUND = "#F5F4FA";
const BORDERCOLOR = "#E6E4EF";
const MINT = "#DDF3EE";
const GREEN = "#075E4F";
const TEAL = "#2F8F7C";
const AMBER_BG = "#FFF3D1";
const LILAC = "#E7E4FB";

// "Maya" / "Maya and Sam" / "Maya, Sam and Lee"
function joinNames(names: string[]) {
  if (names.length <= 1) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

export default function SelfSetup3() {
  const { backups, update } = useCaregiverSetup();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingBackup, setEditingBackup] = useState<Backup | null>(null);
  const hasBackup = backups.length > 0;

  const openAddBackup = () => {
    setEditingBackup(null);
    setSheetOpen(true);
  };

  const openEditBackup = (backup: Backup) => {
    setEditingBackup(backup);
    setSheetOpen(true);
  };

  const saveBackup = (data: Omit<Backup, "id">) => {
    update({
      backups: editingBackup
        ? backups.map((b) => (b.id === editingBackup.id ? { ...b, ...data } : b))
        : [...backups, { id: randomUUID(), ...data }],
    });
    setSheetOpen(false);
  };

  const deleteBackup = () => {
    if (!editingBackup) return;
    update({ backups: backups.filter((b) => b.id !== editingBackup.id) });
    setSheetOpen(false);
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
          <AppText style={styles.calloutText}>
            Who should we tell if you don&apos;t check in?
          </AppText>
          <AppText style={styles.calloutSubtext}>
            Add at least one person.
          </AppText>
        </View>
        <View style={styles.people}>
          {backups.map((backup) => (
            <View key={backup.id} style={styles.personCard}>
              <View style={styles.avatar}>
                <AppText style={styles.avatarText}>
                  {backup.name.charAt(0).toUpperCase()}
                </AppText>
              </View>
              <View style={styles.personText}>
                <AppText style={styles.personName}>{backup.name}</AppText>
                <AppText style={styles.personRelationship}>
                  My {backup.relationship.toLowerCase()}
                </AppText>
              </View>
              <Pressable
                onPress={() => openEditBackup(backup)}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel={`Edit ${backup.name}`}
              >
                <AppText style={styles.editText}>Edit</AppText>
              </Pressable>
            </View>
          ))}
          <Pressable
            style={styles.addButton}
            onPress={openAddBackup}
            accessibilityRole="button"
            accessibilityLabel={hasBackup ? "Add another person" : "Add a person"}
          >
            <PlusIcon />
            <AppText style={styles.addButtonText}>
              {hasBackup ? "Add another person" : "Add a person"}
            </AppText>
          </Pressable>
        </View>
        <View style={styles.missCard}>
          <AppText style={styles.missTitle}>If you miss a check-in</AppText>
          <View style={styles.missRow}>
            <View style={[styles.missIcon, { backgroundColor: AMBER_BG }]}>
              <BellIcon size={18} color="#9A6408" />
            </View>
            <AppText style={styles.missText}>We send you a reminder</AppText>
          </View>
          <View style={styles.missRow}>
            <View style={[styles.missIcon, { backgroundColor: LILAC }]}>
              <PhoneIcon size={18} color={PRIMARY} />
            </View>
            <AppText style={styles.missText}>We give you a call</AppText>
          </View>
          <View style={styles.missRow}>
            <View style={[styles.missIcon, { backgroundColor: MINT }]}>
              <UserIcon size={18} color={GREEN} />
            </View>
            <AppText style={styles.missText}>
              We let {hasBackup ? joinNames(backups.map((b) => b.name)) : "them"} know
            </AppText>
          </View>
        </View>
        <View style={styles.buttons}>
          <Pressable
            disabled={!hasBackup}
            style={({ pressed }) => [
              styles.nextButton,
              pressed && styles.pressed,
              !hasBackup && styles.disabled,
            ]}
            accessibilityLabel="Next"
            accessibilityRole="button"
            accessibilityState={{ disabled: !hasBackup }}
            onPress={() => router.push("/selfSetup4")}
          >
            <AppText style={styles.nextButtonText}>Next</AppText>
          </Pressable>
        </View>
      </ScrollView>
      <BackupSheet
        self
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        recipientName="you"
        backup={editingBackup}
        onSave={saveBackup}
        onDelete={deleteBackup}
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
  people: {
    marginTop: 22,
    gap: 12,
  },
  personCard: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: TEAL,
    backgroundColor: "#fff",
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: MINT,
  },
  avatarText: {
    color: GREEN,
    fontSize: 22,
    fontFamily: FigtreeFont.extraBold,
  },
  personText: {
    flex: 1,
    gap: 2,
  },
  personName: {
    color: INK,
    fontSize: 18,
    fontFamily: FigtreeFont.extraBold,
  },
  personRelationship: {
    color: SUBTITLE,
    fontSize: 15,
    fontFamily: FigtreeFont.medium,
  },
  editText: {
    color: PRIMARY,
    fontSize: 16,
    fontFamily: FigtreeFont.extraBold,
  },
  addButton: {
    height: 56,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "#CFCBE3",
    borderStyle: "dashed",
  },
  addButtonText: {
    color: PRIMARY,
    fontSize: 17,
    fontFamily: FigtreeFont.extraBold,
  },
  missCard: {
    marginTop: 22,
    padding: 16,
    gap: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDERCOLOR,
    backgroundColor: "#fff",
  },
  missTitle: {
    color: SUBTITLE,
    fontSize: 15,
    fontFamily: FigtreeFont.bold,
  },
  missRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  missIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  missText: {
    flex: 1,
    color: INK,
    fontSize: 16,
    fontFamily: FigtreeFont.bold,
  },
  buttons: {
    marginTop: 32,
    gap: 12,
  },
  nextButton: {
    height: 60,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "stretch",
    flexShrink: 0,
    borderRadius: 18,
    backgroundColor: PRIMARY,
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
