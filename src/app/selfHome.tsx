import { AppText } from "@/components/app-test";
import { BottomSheet } from "@/components/bottom-sheet";
import { SelfTabBar } from "@/components/caregiver-tab-bar";
import { Dot } from "@/components/dot";
import { SelfCheckInCard } from "@/components/self-check-in-card";
import { FigtreeFont, FontFamily } from "@/constants/fonts";
import { Backup, useCaregiverSetup } from "@/context/caregiver-setup";
import { readPreference, writePreference } from "@/lib/preferences";
import { joinNames } from "@/utils/day-period";
import { localDateKey, localMinutes } from "@/utils/local-date";
import { nextCheckInLabel } from "@/utils/today-state";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Path } from "react-native-svg";
import PhoneIcon from "@/components/icons/PhoneIcon";

const INK = "#15163A";
const SUBTITLE = "#54566E";
const PRIMARY = "#4338CA";
const BACKGROUND = "#F5F4FA";
const BORDERCOLOR = "#E6E4EF";
const MINT = "#DDF3EE";
const GREEN = "#075E4F";
const LILAC = "#E7E4FB";
const HELP = "#B3261E";
const HELP_BG = "#FDE4E1";
const HELP_BORDER = "#E8998F";

// Kept on this phone as "YYYY-MM-DD|time", so today's check-in survives a restart
const CHECK_IN_KEY = "mira.selfCheckIn";

function readCheckIn(todayKey: string): Date | null {
  const [day, at] = (readPreference(CHECK_IN_KEY) ?? "").split("|");
  if (day !== todayKey || !at) return null;
  const date = new Date(at);
  return Number.isNaN(date.getTime()) ? null : date;
}

function HelpIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
      <Circle cx={11} cy={11} r={8.5} stroke={HELP} strokeWidth={2} />
      <Path d="M11 6.5V11.5" stroke={HELP} strokeWidth={2} strokeLinecap="round" />
      <Circle cx={11} cy={15} r={1.2} fill={HELP} />
    </Svg>
  );
}

export default function SelfHome() {
  const { yourFirstName, windowStart, windowEnd, days, paused, backups, timeZone } =
    useCaregiverSetup();

  // Re-check the clock every 30 seconds so "late" and a new day show up on their own
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(timer);
  }, []);

  const todayKey = localDateKey(now, timeZone);
  const [checkIn, setCheckIn] = useState<{ key: string; at: Date } | null>(() => {
    const at = readCheckIn(localDateKey(new Date(), timeZone));
    return at ? { key: localDateKey(new Date(), timeZone), at } : null;
  });
  // A check-in only counts for the day it was made
  const checkedInAt = checkIn?.key === todayKey ? checkIn.at : null;
  const late = !checkedInAt && localMinutes(now, timeZone) >= windowEnd;

  const checkInNow = () => {
    const at = new Date();
    const key = localDateKey(at, timeZone);
    writePreference(CHECK_IN_KEY, `${key}|${at.toISOString()}`);
    setCheckIn({ key, at });
  };

  const nextLabel = nextCheckInLabel(
    { paused, days, windowEnd: -1, timeZone },
    todayKey,
    now,
  );

  const [helpOpen, setHelpOpen] = useState(false);
  const [callProblem, setCallProblem] = useState<string | null>(null);
  const names = backups.map((b) => b.name);

  const call = (backup: Backup) => {
    const dial = backup.phone.trim().replace(/[^\d+]/g, "");
    if (!/\d/.test(dial)) {
      setCallProblem(`We don't have a phone number for ${backup.name}.`);
      return;
    }
    setCallProblem(null);
    Linking.openURL(`tel:${dial}`).catch(() =>
      setCallProblem(
        `We couldn't open the phone. You can call ${backup.name} at ${backup.phone}.`,
      ),
    );
  };

  const hour = now.getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const name = yourFirstName.trim();
  const dateLabel = now.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerText}>
            <AppText style={styles.date}>{dateLabel}</AppText>
            <AppText style={styles.greeting}>
              {greeting}
              {name ? `, ${name}` : ""}
            </AppText>
          </View>
          <Dot size={64} pose={checkedInAt ? "cheer" : "wave"} label={null} />
        </View>

        <SelfCheckInCard
          windowStart={windowStart}
          windowEnd={windowEnd}
          checkedInAt={checkedInAt}
          late={late}
          told={names.length ? joinNames(names) : null}
          nextLabel={nextLabel}
          onCheckIn={checkInNow}
        />

        {backups.length > 0 && (
          <View style={styles.people}>
            <AppText style={styles.sectionTitle}>My people</AppText>
            <View style={styles.peopleList}>
              {backups.map((backup, index) => (
                <View
                  key={backup.id}
                  style={[styles.person, index > 0 && styles.personDivider]}
                >
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
                    onPress={() => call(backup)}
                    accessibilityRole="button"
                    accessibilityLabel={`Call ${backup.name}`}
                    style={({ pressed }) => [styles.callButton, pressed && styles.pressed]}
                  >
                    <PhoneIcon size={18} color={PRIMARY} />
                    <AppText style={styles.callText}>Call</AppText>
                  </Pressable>
                </View>
              ))}
            </View>
            {callProblem && (
              <AppText style={styles.problem} accessibilityRole="alert">
                {callProblem}
              </AppText>
            )}
          </View>
        )}

        <Pressable
          onPress={() => setHelpOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="I need help"
          style={({ pressed }) => [styles.helpButton, pressed && styles.pressed]}
        >
          <HelpIcon />
          <AppText style={styles.helpText}>I need help</AppText>
        </Pressable>
      </ScrollView>
      <SelfTabBar />

      <BottomSheet
        visible={helpOpen}
        title="Do you need help?"
        subtitle={
          backups[0]
            ? `We'll call ${backups[0].name} for you.`
            : "Add someone you trust first, then we can call them for you."
        }
        onClose={() => setHelpOpen(false)}
      >
        {backups[0] ? (
          <Pressable
            style={({ pressed }) => [styles.sheetHelp, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={`Call ${backups[0].name}`}
            onPress={() => {
              setHelpOpen(false);
              call(backups[0]);
            }}
          >
            <AppText style={styles.sheetHelpText}>Call {backups[0].name}</AppText>
          </Pressable>
        ) : (
          <Pressable
            style={({ pressed }) => [styles.sheetPrimary, pressed && styles.pressed]}
            accessibilityRole="button"
            onPress={() => {
              setHelpOpen(false);
              router.push("/selfSetup3");
            }}
          >
            <AppText style={styles.sheetPrimaryText}>Add someone</AppText>
          </Pressable>
        )}
        <Pressable
          style={styles.sheetCancel}
          accessibilityRole="button"
          onPress={() => setHelpOpen(false)}
        >
          <AppText style={styles.sheetCancelText}>Not now</AppText>
        </Pressable>
      </BottomSheet>
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
  scrollContent: {
    paddingBottom: 108, // room for the tab bar
  },
  header: {
    marginTop: 12,
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  date: {
    color: SUBTITLE,
    fontFamily: FigtreeFont.semiBold,
    fontSize: 16,
  },
  greeting: {
    color: INK,
    fontFamily: FontFamily.bold,
    fontSize: 30,
    lineHeight: 34,
    letterSpacing: -0.6,
  },
  people: {
    marginTop: 24,
    gap: 10,
  },
  sectionTitle: {
    color: INK,
    fontFamily: FigtreeFont.bold,
    fontSize: 17,
  },
  peopleList: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: BORDERCOLOR,
    backgroundColor: "#fff",
  },
  person: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  personDivider: {
    borderTopWidth: 1,
    borderTopColor: "#EFEDF5",
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: MINT,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: GREEN,
    fontSize: 20,
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
  callButton: {
    minHeight: 48,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 16,
    backgroundColor: LILAC,
  },
  callText: {
    color: PRIMARY,
    fontSize: 17,
    fontFamily: FigtreeFont.extraBold,
  },
  problem: {
    color: HELP,
    fontFamily: FigtreeFont.semiBold,
    fontSize: 15,
    lineHeight: 21,
  },
  helpButton: {
    marginTop: 24,
    height: 64,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: HELP_BORDER,
    backgroundColor: HELP_BG,
  },
  helpText: {
    color: HELP,
    fontSize: 18,
    fontFamily: FigtreeFont.extraBold,
  },
  pressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.9,
  },
  sheetHelp: {
    height: 60,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 18,
    backgroundColor: HELP,
  },
  sheetHelpText: {
    color: "#fff",
    fontSize: 19,
    fontFamily: FigtreeFont.bold,
  },
  sheetPrimary: {
    height: 60,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 18,
    backgroundColor: PRIMARY,
  },
  sheetPrimaryText: {
    color: "#fff",
    fontSize: 19,
    fontFamily: FigtreeFont.bold,
  },
  sheetCancel: {
    height: 52,
    justifyContent: "center",
    alignItems: "center",
  },
  sheetCancelText: {
    color: SUBTITLE,
    fontSize: 17,
    fontFamily: FigtreeFont.bold,
  },
});
