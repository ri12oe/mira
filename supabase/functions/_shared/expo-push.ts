// Push notifications to the caregiver's phones, through Expo's push service.
// Free, and real even while texting is in test mode.
// https://docs.expo.dev/push-notifications/sending-notifications/

import { admin } from "./supabase.ts";
import type { SmsResult } from "./twilio.ts";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

type Ticket = { status: "ok"; id: string } | { status: "error"; message: string; details?: { error?: string } };

/**
 * Sends one notification to every phone where this caregiver turned on alerts.
 * Counts as delivered if at least one phone accepted it. Phones that no longer
 * have the app (DeviceNotRegistered) are removed.
 */
export async function pushToCaregiver(
  caregiverId: string,
  title: string,
  body: string,
  data: Record<string, unknown>,
  /**
   * reminder: a self user's own daily reminder, which follows each phone's
   * "Reminder sound" setting. Everything else (alerts about someone) always
   * makes a sound.
   */
  options: { reminder?: boolean } = {},
): Promise<SmsResult> {
  const { data: rows, error } = await admin
    .from("push_tokens")
    .select("token, reminder_sound")
    .eq("caregiver_id", caregiverId);
  if (error) return { ok: false, error: `Couldn't read phones: ${error.message}` };
  if (!rows || rows.length === 0) return { ok: false, error: "No phone has alerts turned on" };

  const messages = rows.map((r) => {
    const quiet = options.reminder && r.reminder_sound === false;
    return {
      to: r.token,
      title,
      body,
      data,
      // iOS: leaving `sound` out plays no sound
      ...(quiet ? {} : { sound: "default" }),
      priority: "high",
      // Android: the sound belongs to the channel. "reminders-quiet" only ever
      // goes to a phone whose app created it (it's that app that turned the
      // sound off), because a push to a missing channel isn't shown at all.
      channelId: quiet ? "reminders-quiet" : "alerts",
    };
  });

  const headers: Record<string, string> = { "Content-Type": "application/json", Accept: "application/json" };
  const accessToken = Deno.env.get("EXPO_ACCESS_TOKEN");
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  let tickets: Ticket[];
  try {
    const response = await fetch(EXPO_PUSH_URL, { method: "POST", headers, body: JSON.stringify(messages) });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      return { ok: false, error: `Expo push ${response.status}: ${json?.errors?.[0]?.message ?? "request failed"}` };
    }
    tickets = json.data ?? [];
  } catch (e) {
    return { ok: false, error: `Couldn't reach Expo push: ${e instanceof Error ? e.message : e}` };
  }

  // Forget phones that uninstalled the app or turned the token off
  const gone = tickets
    .map((t, i) => (t.status === "error" && t.details?.error === "DeviceNotRegistered" ? rows[i].token : null))
    .filter((t): t is string => !!t);
  if (gone.length > 0) await admin.from("push_tokens").delete().in("token", gone);

  const ok = tickets.find((t): t is { status: "ok"; id: string } => t.status === "ok");
  if (ok) return { ok: true, sid: `push-${ok.id}` };
  const firstError = tickets.find((t) => t.status === "error") as { message?: string } | undefined;
  return { ok: false, error: firstError?.message ?? "No phone accepted the notification" };
}
