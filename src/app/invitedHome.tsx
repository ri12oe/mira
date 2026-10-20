import { AppText } from "@/components/app-test";
import { FigtreeFont, FontFamily } from "@/constants/fonts";
import { useCaregiverSetup } from "@/context/caregiver-setup";
import { signOut as signOutOfMira } from "@/lib/auth";
import { fetchMyInvitedDay, InvitedDayRow } from "@/lib/invited";
import { forgetThisPhone } from "@/lib/push";
import { joinNames } from "@/utils/day-period";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const INK = "#15163A";
const SUBTITLE = "#54566E";
const PRIMARY = "#4338CA";
const BACKGROUND = "#F5F4FA";
const BORDER = "#E6E4EF";
const MINT = "#DDF3EE";
const GREEN = "#075E4F";
const RED_TEXT = "#A52F22";

/**
 * Home for someone a caregiver set up (e.g. Lin), signed in with the number
 * she was invited on. For now: who set her up and today's status, so the
 * whole sign-in path can be tried. The CheckIn design (the big I'm okay
 * button, Call, I need help) replaces this in the next step.
 */
export default function InvitedHome() {
  const { reset } = useCaregiverSetup();
  const [rows, setRows] = useState<InvitedDayRow[] | null>(null);
  const [failed, setFailed] = useState(false);

  // Fresh each time Home shows
  useFocusEffect(
    useCallback(() => {
      let active = true;
      fetchMyInvitedDay()
        .then((data) => {
          if (!active) return;
          setRows(data);
          setFailed(false);
        })
        .catch(() => {
          if (active) setFailed(true);
        });
      return () => {
        active = false;
      };
    }, []),
  );

  const signOut = async () => {
    await forgetThisPhone();
    await signOutOfMira();
    reset();
  };

  const name = rows?.[0]?.firstName.trim();
  const caregivers = joinNames([...new Set((rows ?? []).map((r) => r.caregiverName.trim() || "Your family"))]);
  const checkedIn = rows?.some((r) => r.respondedAt) ?? false;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <AppText style={styles.title} accessibilityRole="header">
          {name ? `Hi, ${name}` : "Hi there"}
        </AppText>

        {rows === null && !failed && (
          <View style={styles.row}>
            <ActivityIndicator color={PRIMARY} />
            <AppText style={styles.body}>Loading your day…</AppText>
          </View>
        )}
        {failed && (
          <AppText style={styles.problem} accessibilityRole="alert">
            We couldn&apos;t reach Mira. Check that you&apos;re online, then come back to this screen.
          </AppText>
        )}

        {rows && (
          <View style={styles.card}>
            <AppText style={styles.cardTitle}>You&apos;re connected</AppText>
            <AppText style={styles.body}>
              {caregivers} set up Mira for you. They&apos;ll see when you check in each day.
            </AppText>
            <View style={[styles.pill, checkedIn && styles.pillDone]}>
              <AppText style={[styles.pillText, checkedIn && styles.pillTextDone]}>
                {checkedIn ? "Checked in today" : "Not checked in yet today"}
              </AppText>
            </View>
          </View>
        )}

        <Pressable
          style={({ pressed }) => [styles.signOut, pressed && styles.pressed]}
          onPress={signOut}
          accessibilityRole="button"
        >
          <AppText style={styles.signOutText}>Sign out</AppText>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },
  content: {
    flexGrow: 1,
    gap: 20,
    padding: 24,
    paddingTop: 72,
  },
  title: {
    color: INK,
    fontFamily: FontFamily.bold,
    fontSize: 36,
    lineHeight: 40,
    letterSpacing: -0.9,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  body: {
    color: SUBTITLE,
    fontFamily: FigtreeFont.medium,
    fontSize: 18,
    lineHeight: 26,
  },
  problem: {
    color: RED_TEXT,
    fontFamily: FigtreeFont.semiBold,
    fontSize: 16,
    lineHeight: 23,
  },
  card: {
    padding: 20,
    gap: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: "#fff",
  },
  cardTitle: {
    color: INK,
    fontFamily: FigtreeFont.extraBold,
    fontSize: 19,
  },
  pill: {
    alignSelf: "flex-start",
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: "#FFF3D1",
  },
  pillDone: {
    backgroundColor: MINT,
  },
  pillText: {
    color: "#7A4F06",
    fontFamily: FigtreeFont.extraBold,
    fontSize: 14,
  },
  pillTextDone: {
    color: GREEN,
  },
  signOut: {
    marginTop: "auto",
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  signOutText: {
    color: RED_TEXT,
    fontFamily: FigtreeFont.bold,
    fontSize: 17,
  },
  pressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.9,
  },
});
