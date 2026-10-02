import { AppText } from "@/components/app-test";
import { BottomSheet } from "@/components/bottom-sheet";
import { FigtreeFont, FontFamily } from "@/constants/fonts";
import { CheckInMethod, useCaregiverSetup } from "@/context/caregiver-setup";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
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

type BackupContact = {
  name: string;
  relationship: string;
};

export default function CaregiverSetup3() {
  const { firstName, phone, method, update, displayName } = useCaregiverSetup();
  const recipientName = firstName.trim() || "Caregiver";
  const [backups, setBackups] = useState<BackupContact[]>([]);
  const [sheet, setSheet] = useState<null | "backup">(null);
  const [editingBackupIndex, setEditingBackupIndex] = useState<number | null>(
    null,
  );
  const [backupName, setBackupName] = useState("");
  const [backupRelationship, setBackupRelationship] = useState("");
  const startEditingBackup = (index: number) => {
    setBackupName(backups[index].name);
    setBackupRelationship(backups[index].relationship);
    setEditingBackupIndex(index);
    setSheet("backup");
  };

  const saveBackup = () => {
    const name = backupName.trim();
    const relationship = backupRelationship.trim();
    if (!name || !relationship) return;

    const backup = { name, relationship };
    setBackups((current) =>
      editingBackupIndex === null
        ? [...current, backup]
        : current.map((item, index) =>
            index === editingBackupIndex ? backup : item,
          ),
    );
    setSheet(null);
  };

  const openAddBackup = () => {
    setBackupName("");
    setBackupRelationship("");
    setEditingBackupIndex(null);
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
            If Lin misses a check-in, we'll reach out in this order.
          </AppText>
        </View>
        <View style={styles.alertOrder}>
          <View style={styles.list}>
            <View style={styles.listItemYou}>
              <View style={styles.listOrder}>
                <AppText style={styles.listOrderText}>1</AppText>
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
            <View style={styles.divider}></View>
            {backups.map((backup, index) => (
              <View key={`${backup.name}-${index}`}>
                {index > 0 && <View style={styles.divider} />}
                <View style={styles.listItem}>
                  <View style={styles.listOrder}>
                    <AppText style={styles.listOrderText}>{index + 2}</AppText>
                  </View>
                  <View style={styles.listAvatar2}>
                    <AppText style={styles.listAvatarText2}>
                      {backup.name.charAt(0).toUpperCase()}
                    </AppText>
                  </View>
                  <View style={styles.listContent}>
                    <AppText style={styles.listContentHeader}>
                      {backup.name}
                    </AppText>
                    <AppText style={styles.listContentSubtext}>
                      {recipientName}'s {backup.relationship} · Backup
                    </AppText>
                  </View>
                  <Pressable
                    onPress={() => startEditingBackup(index)}
                    accessibilityRole="button"
                    accessibilityLabel={`Edit ${backup.name}`}
                  >
                    <AppText style={styles.editButtonText}>Edit</AppText>
                  </Pressable>
                </View>
              </View>
            ))}
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
        title="Add a backup contact"
        subtitle="If Lin misses a check-in and you don't respond, we'll tell them."
        onClose={() => setSheet(null)}
      >
        <View style={styles.userInfo}>
          <View style={styles.nameField}>
            <AppText style={styles.headerText}>Name</AppText>
            <TextInput
              style={styles.inputField}
              value={firstName}
              onChangeText={(text) => update({ firstName: text })}
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
              onChangeText={(text) => update({ phone: text })}
              placeholder="(555) 123-4567"
              accessibilityLabel="Their Phone Number"
              placeholderTextColor={MUTED}
              keyboardType="phone-pad"
              autoComplete="tel"
              textContentType="telephoneNumber"
            />
          </View>
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
});
