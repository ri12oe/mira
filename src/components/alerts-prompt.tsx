import { AppText } from "@/components/app-test";
import { BottomSheet } from "@/components/bottom-sheet";
import BellIcon from "@/components/icons/BellIcon";
import { FigtreeFont, FontFamily } from "@/constants/fonts";
import type { AlertsStatus } from "@/hooks/use-alerts";
import type { AlertsProblem } from "@/lib/push";
import { ActivityIndicator, Linking, Pressable, StyleSheet, View } from "react-native";

const INK = "#15163A";
const SUBTITLE = "#54566E";
const PRIMARY = "#4338CA";
const BORDER = "#E6E4EF";
const LILAC = "#E7E4FB";
const MINT = "#DDF3EE";
const GREEN = "#075E4F";

const PROBLEMS: Record<AlertsProblem, string> = {
  unsupported: "This device can't receive alerts.",
  needsBuild: "Alerts can't arrive in Expo Go. Open Mira's own test app instead.",
  denied: "Notifications for Mira are turned off in your phone's settings.",
  noProject: "Alerts aren't set up in this version of the app yet.",
  offline: "We couldn't reach Mira. Check that you're online, then try again.",
  failed: "Something went wrong. Please try again.",
};

type Props = {
  status: AlertsStatus;
  busy: boolean;
  problem: AlertsProblem | null;
  onTurnOn: () => void;
  /** Who it's about, for the wording ("if Lin misses a check-in") */
  name: string;
  /**
   * Someone using Mira for themselves: the same push, but it's their daily
   * reminder to check in, so it's called "reminders"
   */
  self?: boolean;
};

/** The words for each situation, shared by the sheet and the Home card */
function describe(status: AlertsStatus, name: string, self = false) {
  if (self) {
    switch (status) {
      case "on":
        return { title: "Reminders are on", body: "Each day this phone reminds you when it's time to check in." };
      case "denied":
        return {
          title: "Reminders are blocked",
          body: "Notifications for Mira are turned off in your phone's settings. Turn them on there so Mira can remind you.",
        };
      case "needsBuild":
        return {
          title: "Reminders need the Mira app",
          body: "Expo Go can't receive reminders. Open Mira's own test app (the development build) to turn them on.",
        };
      case "unsupported":
        return { title: "No reminders on this device", body: "This device can't receive notifications." };
      default:
        return {
          title: "Turn on reminders",
          body: "So Mira can remind you each day when it's time to check in. Without them, you'll need to remember to open Mira.",
        };
    }
  }
  const who = name.trim() || "someone";
  switch (status) {
    case "on":
      return { title: "Alerts are on", body: `If ${who} misses a check-in, this phone gets a notification right away.` };
    case "denied":
      return {
        title: "Alerts are blocked",
        body: "Notifications for Mira are turned off in your phone's settings. Turn them on there to get alerts.",
      };
    case "needsBuild":
      return {
        title: "Alerts need the Mira app",
        body: "Expo Go can't receive alerts. Open Mira's own test app (the development build) to turn them on.",
      };
    case "unsupported":
      return { title: "No alerts on this device", body: "This device can't receive notifications." };
    default:
      return { title: "Turn on alerts", body: `So you know right away if ${who} misses a check-in.` };
  }
}

/** Home's bell: what alerts do, and the button to turn them on */
export function AlertsSheet({ visible, onClose, ...props }: Props & { visible: boolean; onClose: () => void }) {
  const { title, body } = describe(props.status, props.name, props.self);
  return (
    <BottomSheet visible={visible} title={title} onClose={onClose}>
      <AppText style={styles.body}>{body}</AppText>
      <AlertsActions {...props} />
    </BottomSheet>
  );
}

/**
 * The one-time card on Home, until alerts are on or you tap "Not now".
 * Without `onDismiss` there's no "Not now" (e.g. at the end of setup, where
 * the next button already is the "not now").
 */
export function AlertsCard({ onDismiss, ...props }: Props & { onDismiss?: () => void }) {
  const { title, body } = describe(props.status, props.name, props.self);
  return (
    <View style={styles.card} accessibilityRole="summary">
      <View style={styles.cardTop}>
        <View style={styles.bell}>
          <BellIcon size={22} color={PRIMARY} />
        </View>
        <View style={styles.cardText}>
          <AppText style={styles.cardTitle}>{title}</AppText>
          <AppText style={styles.cardBody}>{body}</AppText>
        </View>
      </View>
      <AlertsActions {...props} />
      {onDismiss && (
        <Pressable
          style={({ pressed }) => [styles.notNow, pressed && styles.pressed]}
          onPress={onDismiss}
          accessibilityRole="button"
          accessibilityLabel="Not now"
        >
          <AppText style={styles.notNowText}>Not now</AppText>
        </Pressable>
      )}
    </View>
  );
}

function AlertsActions({ status, busy, problem, onTurnOn, self }: Props) {
  const thing = self ? "reminders" : "alerts";
  return (
    <View style={styles.actions}>
      {problem && problem !== "denied" && (
        <AppText style={styles.problem} accessibilityRole="alert">
          {PROBLEMS[problem]}
        </AppText>
      )}
      {status === "off" && (
        <Pressable
          style={({ pressed }) => [styles.button, busy && styles.busy, pressed && styles.pressed]}
          onPress={onTurnOn}
          disabled={busy}
          accessibilityRole="button"
          accessibilityState={{ busy, disabled: busy }}
        >
          {busy && <ActivityIndicator color="#fff" />}
          <AppText style={styles.buttonText}>Turn on {thing}</AppText>
        </Pressable>
      )}
      {status === "denied" && (
        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}
          onPress={() => Linking.openSettings()}
          accessibilityRole="button"
        >
          <AppText style={styles.buttonText}>Open phone settings</AppText>
        </Pressable>
      )}
      {status === "on" && (
        <View style={styles.onRow}>
          <AppText style={styles.onText}>✓ This phone gets {thing}</AppText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    color: SUBTITLE,
    fontFamily: FigtreeFont.medium,
    fontSize: 17,
    lineHeight: 24.65,
    marginBottom: 16,
  },
  card: {
    marginTop: 16,
    padding: 18,
    gap: 14,
    alignSelf: "stretch",
    borderRadius: 24,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: BORDER,
  },
  cardTop: {
    flexDirection: "row",
    gap: 14,
    alignItems: "center",
  },
  bell: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: LILAC,
    justifyContent: "center",
    alignItems: "center",
  },
  cardText: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    color: INK,
    fontFamily: FontFamily.bold,
    fontSize: 20,
    lineHeight: 24,
  },
  cardBody: {
    color: SUBTITLE,
    fontFamily: FigtreeFont.medium,
    fontSize: 16,
    lineHeight: 22,
  },
  actions: {
    gap: 10,
    alignSelf: "stretch",
  },
  problem: {
    color: "#8C1D18",
    fontFamily: FigtreeFont.semiBold,
    fontSize: 16,
    lineHeight: 23,
  },
  button: {
    height: 56,
    borderRadius: 18,
    backgroundColor: PRIMARY,
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  busy: {
    opacity: 0.75,
  },
  buttonText: {
    color: "#fff",
    fontFamily: FigtreeFont.bold,
    fontSize: 18,
  },
  onRow: {
    padding: 14,
    borderRadius: 16,
    backgroundColor: MINT,
  },
  onText: {
    color: GREEN,
    fontFamily: FigtreeFont.bold,
    fontSize: 16,
  },
  notNow: {
    alignSelf: "center",
    minHeight: 44,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  notNowText: {
    color: SUBTITLE,
    fontFamily: FigtreeFont.bold,
    fontSize: 16,
  },
  pressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.9,
  },
});
