export type PeriodId = "morning" | "afternoon" | "evening";

/** How long someone using Mira for themselves has to check in after their time */
export const CHECK_IN_MINUTES = 120;

/** The end of that window, kept inside the same day */
export function windowEndFor(start: number) {
  return Math.min(start + CHECK_IN_MINUTES, 24 * 60 - 1);
}

/** Which part of the day a time (minutes after midnight) falls in. */
export function periodOf(minutes: number): PeriodId {
  if (minutes < 12 * 60) return "morning";
  if (minutes < 17 * 60) return "afternoon";
  return "evening";
}

/** "Maya" / "Maya and Sam" / "Maya, Sam and Lee" */
export function joinNames(names: string[]) {
  if (names.length <= 1) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}
