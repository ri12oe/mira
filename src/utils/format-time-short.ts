import { formatTime } from "@/utils/format-time";

/** "11 AM" on the hour, "11:30 AM" when the time has minutes. */
export function formatTimeShort(totalMinutes: number): string {
  return formatTime(totalMinutes).replace(":00", "");
}

/** "11 AM – 1 PM" */
export function formatTimeRange(start: number, end: number): string {
  return `${formatTimeShort(start)} – ${formatTimeShort(end)}`;
}
