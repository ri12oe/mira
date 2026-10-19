import type { HistoryEntry } from "@/utils/check-in-history";
import { readPreference, writePreference } from "@/lib/preferences";
import { addDays, dateFromKey, dayIndex } from "@/utils/local-date";

/**
 * Check-ins for someone using Mira for themselves. There's no account for them
 * yet, so this lives on the phone (like the other small preferences).
 */

const KEY = "mira.selfCheckIns";

export type SelfCheckIns = {
  /** "YYYY-MM-DD" of the first day we looked; earlier days can't be "missed" */
  startedOn: string;
  /** Check-ins by day */
  days: Record<string, { minutes: number; status: "onTime" | "late" }>;
};

/** Reads what's saved, starting the record today the first time. */
export function loadSelfCheckIns(todayKey: string): SelfCheckIns {
  try {
    const saved = JSON.parse(readPreference(KEY) ?? "null") as SelfCheckIns | null;
    if (saved && typeof saved.startedOn === "string" && saved.days) return saved;
  } catch {
    // Unreadable: start fresh
  }
  const fresh: SelfCheckIns = { startedOn: todayKey, days: {} };
  writePreference(KEY, JSON.stringify(fresh));
  return fresh;
}

/** Saves one check-in. On time up to the end of the window, late after it. */
export function recordSelfCheckIn(
  current: SelfCheckIns,
  dayKey: string,
  minutes: number,
  windowEnd: number,
): SelfCheckIns {
  const next: SelfCheckIns = {
    ...current,
    days: {
      ...current.days,
      [dayKey]: { minutes, status: minutes <= windowEnd ? "onTime" : "late" },
    },
  };
  writePreference(KEY, JSON.stringify(next));
  return next;
}

/**
 * The saved check-ins as history entries. A scheduled day that has passed
 * with no check-in counts as missed.
 */
export function selfHistoryEntries(
  data: SelfCheckIns,
  scheduledDays: number[],
  todayKey: string,
) {
  const entries = new Map<string, HistoryEntry>();
  for (const [key, day] of Object.entries(data.days)) {
    entries.set(key, {
      key,
      date: dateFromKey(key),
      status: day.status,
      minutes: day.minutes,
      via: "app",
      byCaregiver: false,
    });
  }
  for (let key = data.startedOn, i = 0; key < todayKey && i < 400; key = addDays(key, 1), i++) {
    if (entries.has(key) || !scheduledDays.includes(dayIndex(key))) continue;
    entries.set(key, {
      key,
      date: dateFromKey(key),
      status: "missed",
      minutes: null,
      via: null,
      byCaregiver: false,
    });
  }
  return entries;
}
