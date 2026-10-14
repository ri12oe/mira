import type { CheckInMethod } from "@/context/caregiver-setup";
import type { CheckInRow } from "@/lib/check-ins";
import { formatTime } from "@/utils/format-time";
import { dateFromKey, localMinutes } from "@/utils/local-date";

export type CheckInStatus = "onTime" | "late" | "missed" | "skipped";

export type HistoryEntry = {
  /** "YYYY-MM-DD", the day in the person's own time zone */
  key: string;
  date: Date;
  status: CheckInStatus;
  minutes: number | null; // minutes after midnight when they checked in; null if not
  via: CheckInMethod | null;
  byCaregiver: boolean; // you marked them as checked in
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const METHOD_PHRASES: Record<CheckInMethod, string> = {
  text: "by text",
  call: "by phone call",
  app: "in the Mira app",
};

const STATUSES: Partial<Record<CheckInRow["status"], CheckInStatus>> = {
  on_time: "onTime",
  late: "late",
  missed: "missed",
  skipped: "skipped",
};

export function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function monthLabel(year: number, month: number) {
  return `${MONTHS[month]} ${year}`;
}

/** "YYYY-MM-DD" for a calendar cell */
export function dayKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/**
 * Finished check-ins by day. A check-in still in progress (pending) isn't
 * history yet, so it's left out.
 */
export function entriesByDay(rows: CheckInRow[], timeZone: string) {
  const entries = new Map<string, HistoryEntry>();
  for (const row of rows) {
    const status = STATUSES[row.status];
    if (!status) continue;
    entries.set(row.local_date, {
      key: row.local_date,
      date: dateFromKey(row.local_date),
      status,
      minutes: row.responded_at ? localMinutes(new Date(row.responded_at), timeZone) : null,
      via: row.responded_via,
      byCaregiver: row.confirmed_by_caregiver,
    });
  }
  return entries;
}

/** Weeks starting on Monday; null marks cells outside the month */
export function getMonthGrid(year: number, month: number) {
  const offset = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array<null>(offset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

export function getMonthTotals(entries: Map<string, HistoryEntry>, year: number, month: number) {
  const totals = { onTime: 0, late: 0, missed: 0 };
  const prefix = dayKey(year, month, 1).slice(0, 8); // "YYYY-MM-"
  for (const entry of entries.values()) {
    if (entry.key.startsWith(prefix) && entry.status !== "skipped") totals[entry.status] += 1;
  }
  return totals;
}

/** Most recent results first */
export function getRecentEntries(entries: Map<string, HistoryEntry>, limit = 5) {
  return [...entries.values()].sort((a, b) => (a.key < b.key ? 1 : -1)).slice(0, limit);
}

/** "Today", "Yesterday" or "Wed, Oct 23" */
export function formatEntryDate(date: Date, today: Date) {
  const diff = Math.round(
    (startOfDay(today).getTime() - startOfDay(date).getTime()) / 86400000,
  );
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return `${WEEKDAYS[date.getDay()]}, ${MONTHS[date.getMonth()].slice(0, 3)} ${date.getDate()}`;
}

export function describeEntry(entry: HistoryEntry) {
  if (entry.status === "skipped") return "Paused, no check-in";
  if (entry.minutes === null) return "Missed, no check-in";
  const time = formatTime(entry.minutes);
  if (entry.byCaregiver) return `${time}, you confirmed`;
  const how = entry.via ? ` ${METHOD_PHRASES[entry.via]}` : "";
  return entry.status === "late" ? `${time}, late${how}` : `${time}${how}`;
}
