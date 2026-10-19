import { AppText } from "@/components/app-test";
import { BackupSheet } from "@/components/backup-sheet";
import { SelfTabBar } from "@/components/caregiver-tab-bar";
import { SwipeToDelete } from "@/components/swipe-to-delete";
import { FigtreeFont, FontFamily } from "@/constants/fonts";
import { Backup, useCaregiverSetup } from "@/context/caregiver-setup";
import { inviteText, openMessages } from "@/lib/invites";
import { loadConfirmedBackups, saveConfirmedBackups } from "@/lib/self-backups";
import { avatarColors } from "@/utils/avatar-colors";
import { toE164 } from "@/utils/phone";
import * as Linking from "expo-linking";
import { randomUUID } from "expo-crypto";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
// Gesture Handler's ScrollView coordinates with the swipe gesture inside it
import { ScrollView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import LockIcon from "@/components/icons/LockIcon";
import MessageIcon from "@/components/icons/MessageIcon";
import PhoneIcon from "@/components/icons/PhoneIcon";
import PlusIcon from "@/components/icons/PlusIcon";

const INK = "#15163A";
const SUBTITLE = "#54566E";
const PRIMARY = "#4338CA";
const BACKGROUND = "#F5F4FA";
const BORDERCOLOR = "#E6E4EF";
const MINT = "#DDF3EE";
const GREEN = "#075E4F";
const SUN = "#FFE8DB";
const RISE = "#8A3A12";
const LILAC = "#E7E4FB";
const PROBLEM = "#B3261E";

export default function SelfPeople() {
  const { yourFirstName, backups, update } = useCaregiverSetup();
  const [confirmed, setConfirmed] = useState(loadConfirmedBackups);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingBackup, setEditingBackup] = useState<Backup | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  const openSheet = (backup: Backup | null) => {
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
    removeBackup(editingBackup.id);
    setSheetOpen(false);
  };

  const removeBackup = (id: string) => {
    update({ backups: backups.filter((b) => b.id !== id) });
    if (confirmed.includes(id)) {
      const next = confirmed.filter((c) => c !== id);
      setConfirmed(next);
      saveConfirmedBackups(next);
    }
  };

  const markConfirmed = (id: string) => {
    const next = [...confirmed, id];
    setConfirmed(next);
    saveConfirmedBackups(next);
  };

  const reach = (backup: Backup, action: "call" | "text" | "invite") => {
    const number = backup.phone.trim().replace(/[^\d+]/g, "");
    if (!/\d/.test(number)) {
      setProblem(`We don't have a phone number for ${backup.name}.`);
      return;
    }
    setProblem(null);
    const opening =
      action === "call"
        ? Linking.openURL(`tel:${number}`)
        : action === "text"
          ? Linking.openURL(`sms:${number}`)
          : openMessages(
              toE164(backup.phone) ?? number,
              inviteText(
                `Hi ${backup.name}, it's ${yourFirstName.trim() || "your friend"}. I set up Mira so someone knows I'm okay each day, and I'd like you to be one of the people it tells.`,
              ),
            );
    opening.catch(() =>
      setProblem(`We couldn't open that. You can reach ${backup.name} at ${backup.phone}.`),
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <AppText style={styles.title}>My people</AppText>
          <AppText style={styles.subtitle}>
            They get a message if you don&apos;t check in.
          </AppText>
        </View>

        {backups.map((backup, index) => {
          const isConnected = confirmed.includes(backup.id);
          const colors = avatarColors(index);
          return (
            <View
              key={backup.id}
              style={[styles.cardShadow, isConnected && styles.cardConnected]}
            >
              <View style={styles.cardClip}>
                <SwipeToDelete label={backup.name} onDelete={() => removeBackup(backup.id)}>
                  <View style={styles.card}>
              <Pressable
                onPress={() => openSheet(backup)}
                style={styles.cardTop}
                accessibilityRole="button"
                accessibilityLabel={`Edit ${backup.name}`}
              >
                <View style={[styles.avatar, { backgroundColor: colors.background }]}>
                  <AppText style={[styles.avatarText, { color: colors.text }]}>
                    {backup.name.charAt(0).toUpperCase()}
                  </AppText>
                </View>
                <View style={styles.cardText}>
                  <AppText style={styles.name}>{backup.name}</AppText>
                  <AppText style={styles.subtext}>
                    {isConnected
                      ? `My ${backup.relationship.toLowerCase()}`
                      : `Waiting for ${backup.name} to say yes`}
                  </AppText>
                </View>
                {isConnected && (
                  <View style={styles.pill}>
                    <AppText style={styles.pillText}>Connected</AppText>
                  </View>
                )}
              </Pressable>

              {isConnected ? (
                <View style={styles.actions}>
                  <Pressable
                    onPress={() => reach(backup, "call")}
                    accessibilityRole="button"
                    accessibilityLabel={`Call ${backup.name}`}
                    style={({ pressed }) => [
                      styles.action,
                      { backgroundColor: LILAC },
                      pressed && styles.pressed,
                    ]}
                  >
                    <PhoneIcon size={20} color={PRIMARY} />
                    <AppText style={[styles.actionText, { color: PRIMARY }]}>Call</AppText>
                  </Pressable>
                  <Pressable
                    onPress={() => reach(backup, "text")}
                    accessibilityRole="button"
                    accessibilityLabel={`Text ${backup.name}`}
                    style={({ pressed }) => [
                      styles.action,
                      { backgroundColor: SUN },
                      pressed && styles.pressed,
                    ]}
                  >
                    <MessageIcon size={20} color={RISE} />
                    <AppText style={[styles.actionText, { color: RISE }]}>Text</AppText>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.links}>
                  <Pressable
                    onPress={() => reach(backup, "invite")}
                    hitSlop={10}
                    accessibilityRole="button"
                    accessibilityLabel={`Send the invite to ${backup.name} again`}
                  >
                    <AppText style={styles.linkText}>Send again</AppText>
                  </Pressable>
                  <Pressable
                    onPress={() => markConfirmed(backup.id)}
                    hitSlop={10}
                    accessibilityRole="button"
                    accessibilityLabel={`${backup.name} said yes`}
                  >
                    <AppText style={styles.linkText}>{backup.name} said yes</AppText>
                  </Pressable>
                </View>
              )}
                  </View>
                </SwipeToDelete>
              </View>
            </View>
          );
        })}

        {problem && (
          <AppText style={styles.problem} accessibilityRole="alert">
            {problem}
          </AppText>
        )}

        <Pressable
          style={styles.addButton}
          onPress={() => openSheet(null)}
          accessibilityRole="button"
          accessibilityLabel="Add someone"
        >
          <PlusIcon />
          <AppText style={styles.addButtonText}>Add someone</AppText>
        </Pressable>

        <View style={styles.privacy}>
          <LockIcon size={24} color={GREEN} />
          <AppText style={styles.privacyText}>
            They only see whether you checked in. Nothing else.
          </AppText>
        </View>
      </ScrollView>
      <SelfTabBar active="people" />
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
    backgroundColor: BACKGROUND,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    gap: 14,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 108,
    marginTop: 56,
  },
  header: {
    gap: 6,
  },
  title: {
    color: INK,
    fontFamily: FontFamily.bold,
    fontSize: 32,
    lineHeight: 35.2,
    letterSpacing: -0.7,
  },
  subtitle: {
    color: SUBTITLE,
    fontFamily: FigtreeFont.medium,
    fontSize: 17,
    lineHeight: 24.65,
  },
  // The shadow and the rounded clip are separate layers: clipping would cut the shadow off
  cardShadow: {
    borderRadius: 24,
    backgroundColor: "#fff",
  },
  cardClip: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: BORDERCOLOR,
    overflow: "hidden",
  },
  card: {
    padding: 16,
    gap: 14,
    backgroundColor: "#fff",
  },
  cardConnected: {
    shadowColor: INK,
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 22,
    fontFamily: FigtreeFont.extraBold,
  },
  cardText: {
    flex: 1,
    gap: 2,
  },
  name: {
    color: INK,
    fontSize: 18,
    fontFamily: FigtreeFont.extraBold,
  },
  subtext: {
    color: SUBTITLE,
    fontSize: 15,
    lineHeight: 21,
    fontFamily: FigtreeFont.medium,
  },
  pill: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: MINT,
  },
  pillText: {
    color: GREEN,
    fontSize: 13,
    fontFamily: FigtreeFont.extraBold,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
  },
  action: {
    flex: 1,
    minHeight: 52,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    borderRadius: 16,
  },
  actionText: {
    fontSize: 17,
    fontFamily: FigtreeFont.extraBold,
  },
  links: {
    flexDirection: "row",
    gap: 20,
    paddingLeft: 70, // lines up under the name, past the avatar
  },
  linkText: {
    color: PRIMARY,
    fontSize: 15,
    fontFamily: FigtreeFont.extraBold,
  },
  problem: {
    color: PROBLEM,
    fontFamily: FigtreeFont.semiBold,
    fontSize: 15,
    lineHeight: 21,
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
    color: INK,
    fontSize: 17,
    fontFamily: FigtreeFont.extraBold,
  },
  privacy: {
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 18,
    backgroundColor: MINT,
  },
  privacyText: {
    flex: 1,
    color: "#134A40",
    fontFamily: FigtreeFont.semiBold,
    fontSize: 15,
    lineHeight: 21,
  },
  pressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.9,
  },
});
