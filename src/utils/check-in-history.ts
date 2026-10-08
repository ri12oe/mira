import { CheckInMethod } from "@/context/caregiver-setup";
import { formatTime } from "@/utils/format-time";

export type CheckInStatus = "onTime" | "late" | "missed";

export type HistoryEntry = {
  date: Date;
  status: CheckInStatus;
  minutes: number | null; // minutes after midnight when they checked in; null if missed
};

/** What the history needs to know about the person being checked in on */
export type HistorySubject = {
  id: string;
  windowStart: number;
  windowEnd: number;
  extraMinutes: number;
  days: number[]; // 0 = Monday … 6 = Sunday
};

export const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

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

export function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function monthLabel(year: number, month: number) {
  return `${MONTHS[month]} ${year}`;
}

function hash(text: string) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Check-in result for one day, or null when there is nothing to show
 * (today or later, or a day the person isn't scheduled).
 * There is no backend yet, so results are generated deterministically per
 * person and date: the same day always gives the same answer.
 */
export function getEntry(
  subject: HistorySubject,
  date: Date,
  today: Date,
): HistoryEntry | null {
  const day = startOfDay(date);
  if (day >= startOfDay(today)) return null;
  if (!subject.days.includes((day.getDay() + 6) % 7)) return null;

  const h = hash(
    `${subject.id}:${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`,
  );
  const roll = h % 100;
  const fraction = ((h >>> 8) % 1000) / 1000;
  const windowLength = Math.max(subject.windowEnd - subject.windowStart, 1);

  if (roll < 85) {
    return {
      date: day,
      status: "onTime",
      minutes: subject.windowStart + Math.floor(fraction * windowLength),
    };
  }
  if (roll < 95) {
    const grace = Math.max(subject.extraMinutes, 15);
    return {
      date: day,
      status: "late",
      minutes: subject.windowEnd + 1 + Math.floor(fraction * grace),
    };
  }
  return { date: day, status: "missed", minutes: null };
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

export function getMonthTotals(
  subject: HistorySubject,
  year: number,
  month: number,
  today: Date,
) {
  const totals = { onTime: 0, late: 0, missed: 0 };
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    const entry = getEntry(subject, new Date(year, month, d), today);
    if (entry) totals[entry.status] += 1;
  }
  return totals;
}

/** Most recent results first, looking back up to 60 days */
export function getRecentEntries(
  subject: HistorySubject,
  today: Date,
  limit = 5,
) {
  const entries: HistoryEntry[] = [];
  const start = startOfDay(today);
  for (let back = 1; back <= 60 && entries.length < limit; back++) {
    const entry = getEntry(
      subject,
      new Date(start.getFullYear(), start.getMonth(), start.getDate() - back),
      today,
    );
    if (entry) entries.push(entry);
  }
  return entries;
}

/** "Yesterday" or "Wed, Oct 23" */
export function formatEntryDate(date: Date, today: Date) {
  const diff = Math.round(
    (startOfDay(today).getTime() - startOfDay(date).getTime()) / 86400000,
  );
  if (diff === 1) return "Yesterday";
  return `${WEEKDAYS[date.getDay()]}, ${MONTHS[date.getMonth()].slice(0, 3)} ${date.getDate()}`;
}

export function describeEntry(entry: HistoryEntry, method: CheckInMethod) {
  if (entry.minutes === null) return "Missed, no check-in";
  const time = formatTime(entry.minutes);
  return entry.status === "late"
    ? `${time}, after reminder`
    : `${time} ${METHOD_PHRASES[method]}`;
}
