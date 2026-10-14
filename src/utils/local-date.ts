/**
 * Dates and times as they are for the person being looked after, in their own
 * time zone (not this phone's). Dates are "YYYY-MM-DD" keys, the same format
 * as `check_ins.local_date` in the database.
 */

const WEEKDAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function parts(date: Date, timeZone: string) {
  const values: Record<string, string> = {};
  for (const p of new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date)) {
    values[p.type] = p.value;
  }
  return values;
}

/** The calendar day in that time zone, e.g. "2026-10-14" */
export function localDateKey(date: Date, timeZone: string) {
  const p = parts(date, timeZone);
  return `${p.year}-${p.month}-${p.day}`;
}

/** Minutes after midnight in that time zone (540 = 9:00 AM) */
export function localMinutes(date: Date, timeZone: string) {
  const p = parts(date, timeZone);
  return (Number(p.hour) % 24) * 60 + Number(p.minute);
}

/** "2026-10-14" → a Date at local midnight on this phone (for display only) */
export function dateFromKey(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** "2026-10-14" + 1 → "2026-10-15" */
export function addDays(key: string, days: number) {
  const [y, m, d] = key.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + days));
  return date.toISOString().slice(0, 10);
}

/** 0 = Monday … 6 = Sunday, like `takers.days` */
export function dayIndex(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  return (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7;
}

export function weekdayName(key: string) {
  return WEEKDAY_NAMES[dayIndex(key)];
}

/** Monday..Sunday keys of the week containing `key` */
export function weekKeys(key: string) {
  const monday = addDays(key, -dayIndex(key));
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

/** A database time shown in that time zone: "9:42 AM" */
export function formatClock(iso: string, timeZone: string) {
  return new Date(iso).toLocaleTimeString("en-US", { timeZone, hour: "numeric", minute: "2-digit" });
}
