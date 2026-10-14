import Constants, { ExecutionEnvironment } from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

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

export function alertsUnavailableReason(): AlertsProblem | null {
  if (Platform.OS === "web" || !Device.isDevice) return "unsupported";
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) return "needsBuild";
  return null;
}

async function ensureAlertsChannel() {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(ALERTS_CHANNEL, {
    name: "Check-in alerts",
    description: "When someone you look after misses a check-in, or checks in late",
    importance: Notifications.AndroidImportance.MAX,
    sound: "default",
    vibrationPattern: [0, 400, 200, 400],
    lightColor: "#4338CA",
  });
}

function projectId(): string | undefined {
  return Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
}

/** Is the notification permission already on? (never shows a prompt) */
export async function alertsPermission() {
  if (alertsUnavailableReason()) return "unavailable" as const;
  const { status } = await Notifications.getPermissionsAsync();
  return status; // "granted" | "denied" | "undetermined"
}

/** Saves this phone's push address for the signed-in caregiver */
export async function registerThisPhone(): Promise<{ ok: true } | { ok: false; problem: AlertsProblem }> {
  const unavailable = alertsUnavailableReason();
  if (unavailable) return { ok: false, problem: unavailable };
  const id = projectId();
  if (!id) return { ok: false, problem: "noProject" };
  try {
    await ensureAlertsChannel();
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId: id });
    const { error } = await supabase.rpc("register_push_token", {
      p_token: token,
      p_platform: Platform.OS === "ios" ? "ios" : "android",
    });
    if (error) return { ok: false, problem: error.code ? "failed" : "offline" };
    return { ok: true };
  } catch (error) {
    console.warn("Couldn't get a push token", error);
    return { ok: false, problem: "failed" };
  }
}

/** "Turn on alerts": asks the phone for permission (once), then registers it */
export async function turnOnAlerts(): Promise<{ ok: true } | { ok: false; problem: AlertsProblem }> {
  const unavailable = alertsUnavailableReason();
  if (unavailable) return { ok: false, problem: unavailable };
  // Android 13+ only shows the permission prompt once a channel exists
  await ensureAlertsChannel();
  let { status } = await Notifications.getPermissionsAsync();
  if (status !== "granted") ({ status } = await Notifications.requestPermissionsAsync());
  if (status !== "granted") return { ok: false, problem: "denied" };
  return registerThisPhone();
}

/** On sign-out: stop sending this caregiver's alerts to this phone */
export async function forgetThisPhone() {
  if (alertsUnavailableReason()) return;
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
