import { readPreference, writePreference } from "@/lib/preferences";

/**
 * Which backup contacts have said yes (replied YES to their invite) for someone
 * using Mira for themselves. Kept on the phone, since this flow has no account yet.
 */

const KEY = "mira.selfConfirmedBackups";

export function loadConfirmedBackups(): string[] {
  try {
    const saved = JSON.parse(readPreference(KEY) ?? "[]");
    return Array.isArray(saved) ? saved.filter((id) => typeof id === "string") : [];
  } catch {
    return [];
  }
}

export function saveConfirmedBackups(ids: string[]) {
  writePreference(KEY, JSON.stringify(ids));
}
