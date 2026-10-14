import { AppText } from "@/components/app-test";
import CheckBadgeIcon from "@/components/icons/CheckBadgeIcon";
import ClockIcon from "@/components/icons/ClockIcon";
import PhoneIcon from "@/components/icons/PhoneIcon";
import { FigtreeFont, FontFamily } from "@/constants/fonts";
import type { Backup, CheckInMethod } from "@/context/caregiver-setup";
import type { SendRow } from "@/lib/check-ins";
import { formatClock } from "@/utils/local-date";
import { formatTimeRange } from "@/utils/format-time-short";
import type { TodayState } from "@/utils/today-state";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";

const INK = "#15163A";
const SUBTITLE = "#54566E";
const PRIMARY = "#4338CA";
const BORDERCOLOR = "#E6E4EF";
const MINT = "#DDF3EE";
const SUN = "#FFE8DB";
const ORANGE = "#C2551F";
const GREEN = "#075E4F";
const RED = "#A52F22";
const ALERT = "#C43A2B";
const MUTED = "#8B8DA3";
const WAITING_BG = "#F1EFFD";
const PAUSED_BG = "#EFEDF5";

// Matches the canvas: "9:14 AM by text"
const VIA: Record<CheckInMethod, string> = {
  text: "by text",
  call: "by phone call",
  app: "in the Mira app",
};
const ASKED_BY: Record<CheckInMethod, string> = {
  text: "Mira texts",
  call: "Mira calls",
  app: "Mira reminds",
};
const REMINDER_BY: Record<CheckInMethod, string> = {
  text: "Reminder text sent",
  call: "Reminder call made",
  app: "Reminder sent in the app",
};

type Props = {
  state: TodayState;
  name: string;
  method: CheckInMethod;
  windowStart: number;
  windowEnd: number;
  timeZone: string;
  backups: Backup[];
  /** Everything sent for today's check-in, for the missed timeline */
  sends: SendRow[];
  /** "Tomorrow", "Friday"…: the next check-in after today */
  nextLabel: string | null;
  onMarkCheckedIn: () => void;
  marking: boolean;
  /** A short message after tapping "checked in" (e.g. nothing was open) */
  markMessage: string | null;
  onCall: () => void;
  onConfirmJoined: () => void;
  confirming: boolean;
  confirmMessage: string | null;
  onOpenSettings: () => void;
};

/** Home's "Today" card: how today is going for one person */
export function TodayCard(props: Props) {
  const { state, name, windowStart, windowEnd } = props;
  const range = formatTimeRange(windowStart, windowEnd);

  switch (state.kind) {
    case "loading":
      return (
        <View style={[styles.card, styles.plainCard, styles.loading]} accessibilityLabel="Loading today's check-in">
          <ActivityIndicator color={PRIMARY} />
          <AppText style={styles.line}>Loading today…</AppText>
        </View>
      );

    case "checkedIn": {
      const { row } = state;
      const late = row.status === "late";
      const at = row.responded_at ? formatClock(row.responded_at, props.timeZone) : "";
      return (
        <View style={[styles.card, { backgroundColor: MINT }]}>
          <View style={styles.top}>
            <CheckBadgeIcon size={64} />
            <View style={styles.texts}>
              <AppText style={[styles.label, { color: GREEN }]}>{late ? "Checked in late" : "Checked in"}</AppText>
              <AppText style={styles.headline}>{name} is okay today</AppText>
              <AppText style={[styles.line, { color: GREEN }]}>
                {row.confirmed_by_caregiver
                  ? `You confirmed it at ${at}`
                  : `${at} ${VIA[row.responded_via ?? "text"]}`}
              </AppText>
            </View>
          </View>
          <NextRow label="Next check-in" value={props.nextLabel ? `${props.nextLabel}, ${range}` : "Not scheduled"} />
        </View>
      );
    }

    case "waiting": {
      const { row, afterWindow } = state;
      return (
        <View style={[styles.card, { backgroundColor: WAITING_BG }]}>
          <View style={styles.top}>
            <View style={styles.iconCircle}>
              <ClockIcon size={30} color={PRIMARY} />
            </View>
            <View style={styles.texts}>
              <AppText style={[styles.label, { color: PRIMARY }]}>{afterWindow ? "Reminder sent" : "Check-in open"}</AppText>
              <AppText style={styles.headline}>Waiting for {name}</AppText>
              <AppText style={styles.line}>
                {afterWindow
                  ? `If ${name} doesn't check in, we'll alert you at ${formatClock(row.alert_at, props.timeZone)}.`
                  : `Window open until ${formatClock(row.window_ends_at, props.timeZone)}`}
              </AppText>
            </View>
          </View>
          <MarkButton {...props} label={`${name} checked in`} tone="primary" />
        </View>
      );
    }

    case "missed":
      return <MissedCard {...props} row={state.row} />;

    case "upcoming":
      return (
        <View style={[styles.card, styles.plainCard]}>
          <View style={styles.top}>
            <View style={[styles.iconCircle, { backgroundColor: WAITING_BG }]}>
              <ClockIcon size={30} color={PRIMARY} />
            </View>
            <View style={styles.texts}>
              <AppText style={[styles.label, { color: PRIMARY }]}>Next check-in</AppText>
              <AppText style={styles.headline}>
                {state.dayLabel === "Not scheduled" ? "No days selected" : `${state.dayLabel}, ${range}`}
              </AppText>
              <AppText style={styles.line}>
                {ASKED_BY[props.method]} {name} when the window opens.
              </AppText>
            </View>
          </View>
        </View>
      );

    case "notJoined":
      return (
        <View style={[styles.card, { backgroundColor: SUN }]}>
          <View style={styles.texts}>
            <AppText style={[styles.label, { color: ORANGE }]}>Invite sent</AppText>
            <AppText style={styles.headline}>Waiting for {name} to reply YES</AppText>
            <AppText style={styles.line}>Daily check-ins start once {name} says yes to your invite.</AppText>
          </View>
          {props.confirmMessage && (
            <AppText style={styles.message} accessibilityRole="alert">
              {props.confirmMessage}
            </AppText>
          )}
          <Pressable
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
            onPress={props.onConfirmJoined}
            disabled={props.confirming}
            accessibilityRole="button"
            accessibilityState={{ busy: props.confirming }}
          >
            {props.confirming && <ActivityIndicator color={INK} />}
            <AppText style={styles.secondaryButtonText}>{name} replied YES</AppText>
          </Pressable>
        </View>
      );

    case "paused":
    case "skipped":
      return (
        <View style={[styles.card, { backgroundColor: PAUSED_BG }]}>
          <View style={styles.texts}>
            <AppText style={[styles.label, { color: SUBTITLE }]}>Paused</AppText>
            <AppText style={styles.headline}>
              {state.kind === "skipped" ? `No check-in for ${name} today` : `Check-ins for ${name} are paused`}
            </AppText>
            <AppText style={styles.line}>Nobody gets alerted while check-ins are paused.</AppText>
          </View>
          <Pressable
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
            onPress={props.onOpenSettings}
            accessibilityRole="button"
          >
            <AppText style={styles.secondaryButtonText}>Resume in Settings</AppText>
          </Pressable>
        </View>
      );
  }
}

function NextRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.nextRow}>
      <AppText style={styles.nextLabel}>{label}</AppText>
      <AppText style={styles.nextValue}>{value}</AppText>
    </View>
  );
}

function MarkButton(props: Props & { label: string; tone: "primary" | "alert" }) {
  return (
    <View style={styles.markArea}>
      {props.markMessage && (
        <AppText style={styles.message} accessibilityRole="alert">
          {props.markMessage}
        </AppText>
      )}
      <Pressable
        style={({ pressed }) => [
          styles.secondaryButton,
          props.tone === "alert" && styles.alertSecondary,
          pressed && styles.pressed,
        ]}
        onPress={props.onMarkCheckedIn}
        disabled={props.marking}
        accessibilityRole="button"
        accessibilityHint="Stops any alerts still to come"
        accessibilityState={{ busy: props.marking }}
      >
        {props.marking && <ActivityIndicator color={INK} />}
        <AppText style={styles.secondaryButtonText}>{props.label}</AppText>
      </Pressable>
    </View>
  );
}

type TimelineItem = { key: string; kind: "done" | "now" | "later" | "failed"; text: string };

/** The missed timeline, from what was actually sent (and who's still to be told) */
function buildTimeline(props: Props, alertAt: string): TimelineItem[] {
  const { sends, backups, timeZone, method } = props;
  const ok = (s: SendRow) => s.status === "sent" || s.status === "delivered";
  // Really went out: not a test-mode stand-in (texting is off in free mode)
  const real = (s: SendRow) => ok(s) && !s.provider_id?.startsWith("test-");
  const at = (iso: string) => formatClock(iso, timeZone);
  const items: TimelineItem[] = [];

  const reminders = sends.filter((s) => s.purpose === "reminder");
  if (reminders.length > 0) {
    const sent = reminders.find(real);
    const recorded = reminders.find(ok);
    items.push(
      sent
        ? { key: "reminder", kind: "done", text: `${at(sent.created_at)} · ${REMINDER_BY[method]}` }
        : recorded
          ? { key: "reminder", kind: "failed", text: `${at(recorded.created_at)} · Texting is off, so no reminder went out` }
          : { key: "reminder", kind: "failed", text: `${at(reminders[0].created_at)} · The reminder couldn't be sent` },
    );
  }

  const alerts = sends.filter((s) => s.purpose === "caregiver_alert");
  if (alerts.length > 0) {
    const sent = alerts.find(real);
    const push = alerts.find((s) => s.channel === "push");
    const stillTrying = alerts.some((s) => s.status === "queued");
    items.push(
      sent
        ? { key: "you", kind: "now", text: `${at(sent.created_at)} · You were alerted` }
        : stillTrying
          ? { key: "you", kind: "now", text: "Now · You're being alerted" }
          : push?.status === "failed"
            ? { key: "you", kind: "failed", text: `${at(push.created_at)} · We couldn't reach your phone. Turn on alerts with the bell` }
            : { key: "you", kind: "failed", text: `${at(alerts[0].created_at)} · Texting is off, so no text or call went out` },
    );
  }

  // Each backup: told, couldn't be reached, or when they will be told
  let afterMinutes = 0;
  for (const b of backups) {
    afterMinutes += b.alertAfter;
    const theirs = sends.filter((s) => s.purpose === "backup_alert" && s.backup_id === b.id);
    const sent = theirs.find(real);
    const recorded = theirs.find(ok);
    if (sent) {
      items.push({ key: b.id, kind: "done", text: `${at(sent.created_at)} · ${b.name} was told` });
    } else if (recorded) {
      items.push({ key: b.id, kind: "failed", text: `${at(recorded.created_at)} · Texting is off, so ${b.name} wasn't told` });
    } else if (theirs.length > 0 && theirs.every((s) => s.status === "failed")) {
      items.push({ key: b.id, kind: "failed", text: `${at(theirs[0].created_at)} · We couldn't reach ${b.name}` });
    } else {
      const when = new Date(new Date(alertAt).getTime() + afterMinutes * 60000).toISOString();
      items.push({ key: b.id, kind: "later", text: `${at(when)} · ${b.name} will be told` });
    }
  }
  return items;
}

function MissedCard(props: Props & { row: { window_ends_at: string; alert_at: string } }) {
  const { name, row } = props;
  const items = buildTimeline(props, row.alert_at);
  return (
    <View style={styles.alertCard} accessibilityLiveRegion="polite">
      <View style={styles.top}>
        <Svg width={56} height={56} viewBox="0 0 56 56" fill="none">
          <Circle cx={28} cy={28} r={28} fill={ALERT} />
          <Path d="M28 18V32M28 38V39" stroke="white" strokeWidth={3.6} strokeLinecap="round" />
        </Svg>
        <View style={styles.texts}>
          <AppText style={styles.alertHeadline}>{name} hasn&apos;t checked in</AppText>
          <AppText style={styles.alertLine}>
            Window ended at {formatClock(row.window_ends_at, props.timeZone)}
          </AppText>
        </View>
      </View>
      {items.length > 0 && (
        <View style={styles.timeline}>
          {items.map((item) => (
            <View key={item.key} style={styles.timelineRow}>
              <TimelineIcon kind={item.kind} />
              <AppText
                style={[
                  styles.timelineText,
                  item.kind === "now" && styles.timelineNow,
                  item.kind === "failed" && styles.timelineFailed,
                ]}
              >
                {item.text}
              </AppText>
            </View>
          ))}
        </View>
      )}
      <View style={styles.actions}>
        <Pressable
          style={({ pressed }) => [styles.alertButton, pressed && styles.pressed]}
          onPress={props.onCall}
          accessibilityRole="button"
          accessibilityLabel={`Call ${name} now`}
        >
          <PhoneIcon size={20} color="#FFFFFF" />
          <AppText style={styles.alertButtonText}>Call {name} now</AppText>
        </Pressable>
        <MarkButton {...props} label={`I reached ${name}, ${name} is okay`} tone="alert" />
      </View>
    </View>
  );
}

function TimelineIcon({ kind }: { kind: TimelineItem["kind"] }) {
  if (kind === "done") {
    return (
      <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
        <Path d="M4.17 10.42L7.92 14.17L15.83 6.25" stroke="#0B7A66" strokeWidth={2.17} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    );
  }
  if (kind === "now") {
    return (
      <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
        <Circle cx={10} cy={10} r={6} fill={ALERT} />
      </Svg>
    );
  }
  if (kind === "failed") {
    return (
      <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
        <Circle cx={10} cy={10} r={8} stroke={ORANGE} strokeWidth={2} />
        <Path d="M10 6v5M10 13.5v.5" stroke={ORANGE} strokeWidth={2} strokeLinecap="round" />
      </Svg>
    );
  }
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
      <Circle cx={10} cy={10} r={5} stroke={MUTED} strokeWidth={2} />
    </Svg>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 22,
    gap: 18,
    alignSelf: "stretch",
    borderRadius: 28,
  },
  plainCard: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: BORDERCOLOR,
  },
  loading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  top: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  texts: {
    flex: 1,
    gap: 3,
  },
  label: {
    fontSize: 14,
    lineHeight: 18.2,
    fontFamily: FigtreeFont.extraBold,
  },
  headline: {
    color: INK,
    fontSize: 25,
    lineHeight: 28.65,
    letterSpacing: -0.4,
    fontFamily: FontFamily.bold,
  },
  line: {
    color: SUBTITLE,
    fontSize: 16,
    lineHeight: 23.2,
    fontFamily: FigtreeFont.semiBold,
  },
  message: {
    color: INK,
    fontSize: 15,
    lineHeight: 21,
    fontFamily: FigtreeFont.semiBold,
  },
  nextRow: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: "#fff",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  nextLabel: {
    color: SUBTITLE,
    fontSize: 15,
    lineHeight: 21,
    fontFamily: FigtreeFont.semiBold,
  },
  nextValue: {
    flexShrink: 1,
    color: INK,
    fontSize: 16,
    lineHeight: 20.8,
    fontFamily: FigtreeFont.bold,
    textAlign: "right",
  },
  markArea: {
    gap: 10,
    alignSelf: "stretch",
  },
  secondaryButton: {
    minHeight: 58,
    paddingHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDERCOLOR,
    backgroundColor: "#fff",
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "stretch",
  },
  alertSecondary: {
    borderColor: "#F0C2BA",
  },
  secondaryButtonText: {
    color: INK,
    fontSize: 17,
    lineHeight: 22.1,
    fontFamily: FigtreeFont.bold,
    textAlign: "center",
  },
  alertCard: {
    padding: 22,
    gap: 18,
    alignSelf: "stretch",
    borderRadius: 28,
    borderWidth: 2,
    borderColor: RED,
    backgroundColor: "#FDE7E3",
  },
  alertHeadline: {
    color: INK,
    fontSize: 24,
    lineHeight: 27.6,
    letterSpacing: -0.4,
    fontFamily: FontFamily.bold,
  },
  alertLine: {
    color: RED,
    fontSize: 16,
    lineHeight: 23.2,
    fontFamily: FigtreeFont.semiBold,
  },
  timeline: {
    padding: 16,
    gap: 12,
    alignSelf: "stretch",
    borderRadius: 18,
    backgroundColor: "#fff",
  },
  timelineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  timelineText: {
    flex: 1,
    color: SUBTITLE,
    fontSize: 16,
    lineHeight: 23.2,
    fontFamily: FigtreeFont.semiBold,
  },
  timelineNow: {
    color: RED,
    fontFamily: FigtreeFont.extraBold,
  },
  timelineFailed: {
    color: ORANGE,
    fontFamily: FigtreeFont.bold,
  },
  actions: {
    gap: 10,
    alignSelf: "stretch",
  },
  alertButton: {
    height: 58,
    borderRadius: 18,
    backgroundColor: RED,
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "stretch",
  },
  alertButtonText: {
    color: "#fff",
    fontSize: 18,
    lineHeight: 21.6,
    fontFamily: FigtreeFont.bold,
  },
  pressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.9,
  },
});
