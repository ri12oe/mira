import { AppText } from "@/components/app-test";
import { CaregiverTabBar } from "@/components/caregiver-tab-bar";
import BellIcon from "@/components/icons/BellIcon";
import { FigtreeFont, FontFamily } from "@/constants/fonts";
import { CheckInMethod, useCaregiverSetup } from "@/context/caregiver-setup";
import { formatTimeRange } from "@/utils/format-time-short";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CheckBadgeIcon from "@/components/icons/CheckBadgeIcon";
import CircleIcon from "@/components/icons/CircleIcon";
import PhoneIcon from "@/components/icons/PhoneIcon";
import PointerIcon from "@/components/icons/PointerIcon";
import { useState } from "react";

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

const METHOD_LABELS: Record<CheckInMethod, string> = {
  text: "Text reply",
  call: "Phone call",
  app: "Mira app",
};

const DAYS = ["M", "T", "W", "Th", "F", "S", "Su"];

export default function CaregiverHome() {
  const {
    displayName,
    yourFirstName,
    method,
    windowStart,
    windowEnd,
  } = useCaregiverSetup();
  const [notificationsActive, setNotificationsActive] = useState(false);
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
              {greeting}{caregiverName ? `, ${caregiverName}` : ""}
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
            <BellIcon
              size={22}
              color={notificationsActive ? ORANGE : INK}
            />
          </Pressable>
        </View>
        <View style={styles.peopleChips}>
          <Pressable>
            <View style={styles.chip}>
              <View style={styles.frame2}>
                <AppText style={styles.chipText}>
                  {displayName.charAt(0).toUpperCase()}
                </AppText>
              </View>
              <AppText style={styles.chipLabel}>{displayName}</AppText>
            </View>
          </Pressable>
          <Pressable>
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
                    <PointerIcon size={20}  />
                </View>
                <AppText style={styles.iconTileLabel}>Check in now</AppText>
            </View>
        </View>
      </ScrollView>
      <CaregiverTabBar />
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
});
