import { authStorage } from "@/lib/session-storage";

/**
 * Small settings kept on this phone only (not in the database), like
 * "the caregiver dismissed the 'Turn on alerts' card". Uses the same
 * on-device storage as the sign-in session.
 */

export const ALERTS_CARD_DISMISSED = "mira.alertsCardDismissed";
/** Self Home: they tapped "Not now" on the "Turn on reminders" card */
export const REMINDERS_CARD_DISMISSED = "mira.remindersCardDismissed";
/** "Reminder sound" in the self Settings: "0" = off, anything else = on */
export const REMINDER_SOUND = "mira.reminderSound";

/**
 * Left on phones by older versions, when the "I'm checking in" flow kept
 * check-ins (with their times) and "said yes" on the phone. Now on the server.
 */
const OLD_SELF_DATA = ["mira.selfCheckIns", "mira.selfConfirmedBackups"];

/** Settings that belong to an account rather than to the phone */
const ACCOUNT_PREFERENCES = [ALERTS_CARD_DISMISSED, REMINDERS_CARD_DISMISSED, REMINDER_SOUND];

function removePreferences(keys: string[]) {
  for (const key of keys) {
    try {
      authStorage?.removeItem(key);
    } catch {
      // Couldn't remove it: nothing else to do
    }
  }
}

/**
 * Signing out: forget anything personal kept on this phone. (Phone settings
 * like Bigger text stay: they're about the phone, not about anyone.)
 */
export function forgetOnSignOut() {
  removePreferences(OLD_SELF_DATA);
}

/** Deleting the account: forget everything of theirs on this phone too */
export function forgetOnDelete() {
  removePreferences([...OLD_SELF_DATA, ...ACCOUNT_PREFERENCES]);
}

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
