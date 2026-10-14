import { isRunningInExpoGo } from "expo";
import { Platform } from "react-native";

type NotificationsModule = typeof import("expo-notifications");

let loaded: NotificationsModule | null | undefined;

/**
 * expo-notifications, or null where it can't work.
 *
 * Why not a normal import: since SDK 53, just *importing* expo-notifications in
 * Expo Go on Android throws ("…removed from Expo Go…"), because it sets up push
 * token listeners as soon as it loads. So it's only loaded on demand, and never
 * in Expo Go or on web. (`typeof import(...)` above is type-only: it loads nothing.)
 */
export function loadNotifications(): NotificationsModule | null {
  if (loaded !== undefined) return loaded;
  if (Platform.OS === "web" || isRunningInExpoGo()) {
    loaded = null;
  } else {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    loaded = require("expo-notifications") as NotificationsModule;
  }
  return loaded;
}
