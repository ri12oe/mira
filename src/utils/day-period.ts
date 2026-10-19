export type PeriodId = "morning" | "afternoon" | "evening";

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
