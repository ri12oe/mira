import type { Activity, CheckInRow } from "@/lib/check-ins";
import { addDays, dayIndex, localMinutes, weekdayName } from "@/utils/local-date";

/** What Home's "Today" card shows for one person */
export type TodayState =
  | { kind: "loading" }
  | { kind: "notJoined" } // invite sent, no YES yet
  | { kind: "paused" }
  | { kind: "skipped"; row: CheckInRow } // paused partway through today
  | { kind: "upcoming"; dayLabel: string } // no check-in open right now
  | { kind: "waiting"; row: CheckInRow; afterWindow: boolean } // window open, or reminder sent
  | { kind: "checkedIn"; row: CheckInRow }
  | { kind: "missed"; row: CheckInRow };

type Schedule = {
  paused: boolean;
  days: number[];
  windowEnd: number;
  timeZone: string;
};

/** "Today", "Tomorrow" or a weekday name: the next day Mira checks in */
export function nextCheckInLabel(s: Schedule, todayKey: string, now: Date) {
  const minutesNow = localMinutes(now, s.timeZone);
  for (let i = 0; i < 8; i++) {
    const key = addDays(todayKey, i);
    if (!s.days.includes(dayIndex(key))) continue;
    if (i === 0 && minutesNow >= s.windowEnd) continue; // today's window is over
    return i === 0 ? "Today" : i === 1 ? "Tomorrow" : weekdayName(key);
  }
  return null;
}

export function todayState(
  activity: Activity | null,
  s: Schedule,
  todayKey: string,
  now: Date,
): TodayState {
  if (!activity) return { kind: "loading" };
  if (activity.takerStatus !== "active") return { kind: "notJoined" };

  const row = activity.checkIns.find((c) => c.local_date === todayKey);
  if (row) {
    switch (row.status) {
      case "on_time":
      case "late":
        return { kind: "checkedIn", row };
      case "missed":
        return { kind: "missed", row };
      case "skipped":
        return { kind: "skipped", row };
      case "pending":
        return { kind: "waiting", row, afterWindow: now >= new Date(row.window_ends_at) };
    }
  }
  if (s.paused) return { kind: "paused" };
  return { kind: "upcoming", dayLabel: nextCheckInLabel(s, todayKey, now) ?? "Not scheduled" };
}
