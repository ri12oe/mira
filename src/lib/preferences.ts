import { authStorage } from "@/lib/session-storage";

/**
 * Small settings kept on this phone only (not in the database), like
 * "the caregiver dismissed the 'Turn on alerts' card". Uses the same
 * on-device storage as the sign-in session.
 */

export const ALERTS_CARD_DISMISSED = "mira.alertsCardDismissed";
/** "Reminder sound" in the self Settings: "0" = off, anything else = on */
export const REMINDER_SOUND = "mira.reminderSound";

export function readPreference(key: string): string | null {
  try {
    return authStorage?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

export function writePreference(key: string, value: string) {
  try {
    authStorage?.setItem(key, value);
  } catch {
    // Not saved: the card just shows again next time
  }
}
