import { isRunningInExpoGo } from "expo";
import Constants from "expo-constants";
import * as Device from "expo-device";
import { Platform } from "react-native";

import { loadNotifications } from "@/lib/notifications-module";
import { REMINDER_SOUND, readPreference, writePreference } from "@/lib/preferences";
import { supabase } from "@/lib/supabase";

/**
 * Push alerts for the caregiver: if someone misses a check-in, this phone
 * gets a notification (free, and real even while texting is in test mode).
 *
 * - unsupported: web, or a simulator/emulator without push
 * - needsBuild: running in Expo Go, which can't receive push on Android
 *   since SDK 53. Use the Mira development build.
 * - denied: the phone's notification permission is off (fix in Settings)
 * - noProject: the app has no EAS project id yet (see app.json)
 */
export type AlertsProblem = "unsupported" | "needsBuild" | "denied" | "noProject" | "offline" | "failed";

/** Android channel for alerts: high importance, so they pop up and make a sound */
export const ALERTS_CHANNEL = "alerts";
/**
 * Android channel for a self user's daily reminder with "Reminder sound" off:
 * pops up and vibrates, no sound. (A channel's sound can't be changed once
 * it's made, hence a second channel.) Must exist before the server is told
 * the sound is off: a push to a missing channel isn't shown at all.
 */
export const QUIET_REMINDERS_CHANNEL = "reminders-quiet";

export function alertsUnavailableReason(): AlertsProblem | null {
  if (Platform.OS === "web") return "unsupported";
  if (isRunningInExpoGo()) return "needsBuild";
  if (!Device.isDevice) return "unsupported";
  return null;
}

async function ensureAlertsChannel() {
  const Notifications = loadNotifications();
  if (!Notifications || Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(ALERTS_CHANNEL, {
    name: "Check-ins and alerts",
    description: "Reminders to check in, and alerts when someone misses a check-in",
    importance: Notifications.AndroidImportance.MAX,
    // No `sound`: here it means a custom sound file. Left out, the channel uses
    // the phone's normal notification sound.
    vibrationPattern: [0, 400, 200, 400],
    lightColor: "#4338CA",
  });
  await Notifications.setNotificationChannelAsync(QUIET_REMINDERS_CHANNEL, {
    name: "Quiet reminders",
    description: "Your daily reminder to check in, without a sound (Reminder sound is off)",
    importance: Notifications.AndroidImportance.HIGH,
    sound: null, // "null" means "no sound" (expo-notifications, Android)
    enableVibrate: true,
    vibrationPattern: [0, 300, 150, 300],
    lightColor: "#4338CA",
  });
}

function projectId(): string | undefined {
  return Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
}

/** Is the notification permission already on? (never shows a prompt) */
export async function alertsPermission() {
  const Notifications = loadNotifications();
  if (alertsUnavailableReason() || !Notifications) return "unavailable" as const;
  const { status } = await Notifications.getPermissionsAsync();
  return status; // "granted" | "denied" | "undetermined"
}

/** Saves this phone's push address for the signed-in caregiver */
export async function registerThisPhone(): Promise<{ ok: true } | { ok: false; problem: AlertsProblem }> {
  const unavailable = alertsUnavailableReason();
  if (unavailable) return { ok: false, problem: unavailable };
  const Notifications = loadNotifications();
  if (!Notifications) return { ok: false, problem: "unsupported" };
  const id = projectId();
  if (!id) return { ok: false, problem: "noProject" };
  try {
    // The channels first: only then may the server send through the quiet one
    await ensureAlertsChannel();
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId: id });
    const { error } = await supabase.rpc("register_push_token", {
      p_token: token,
      p_platform: Platform.OS === "ios" ? "ios" : "android",
      // This phone's "Reminder sound" (self Settings); on unless turned off
      p_reminder_sound: readPreference(REMINDER_SOUND) !== "0",
    });
    if (error) {
      console.warn("Couldn't save this phone for alerts", error);
      return { ok: false, problem: error.code ? "failed" : "offline" };
    }
    return { ok: true };
  } catch (error) {
    console.warn("Couldn't get a push token", error);
    return { ok: false, problem: "failed" };
  }
}

/**
 * "Reminder sound" (self Settings). Saved on this phone, and, if reminders
 * are on, on the server too (so it works while Mira is closed). If the server
 * can't be told, the old choice is put back, so the switch never shows
 * something the reminders won't do.
 */
export async function saveReminderSound(on: boolean): Promise<{ ok: true } | { ok: false; problem: AlertsProblem }> {
  const before = readPreference(REMINDER_SOUND);
  writePreference(REMINDER_SOUND, on ? "1" : "0");
  // Reminders not on yet: nothing to tell the server; it's sent when they are
  if ((await alertsPermission()) !== "granted") return { ok: true };
  const result = await registerThisPhone();
  if (!result.ok) writePreference(REMINDER_SOUND, before ?? "1");
  return result;
}

/** "Turn on alerts": asks the phone for permission (once), then registers it */
export async function turnOnAlerts(): Promise<{ ok: true } | { ok: false; problem: AlertsProblem }> {
  const unavailable = alertsUnavailableReason();
  if (unavailable) return { ok: false, problem: unavailable };
  const Notifications = loadNotifications();
  if (!Notifications) return { ok: false, problem: "unsupported" };
  // Android 13+ only shows the permission prompt once a channel exists
  await ensureAlertsChannel();
  let { status } = await Notifications.getPermissionsAsync();
  if (status !== "granted") ({ status } = await Notifications.requestPermissionsAsync());
  if (status !== "granted") return { ok: false, problem: "denied" };
  return registerThisPhone();
}

/** On sign-out: stop sending this caregiver's alerts to this phone */
export async function forgetThisPhone() {
  const Notifications = loadNotifications();
  if (alertsUnavailableReason() || !Notifications) return;
  const id = projectId();
  if (!id) return;
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") return;
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId: id });
    await supabase.from("push_tokens").delete().eq("token", token);
  } catch (error) {
    console.warn("Couldn't remove this phone's alerts", error);
  }
}
