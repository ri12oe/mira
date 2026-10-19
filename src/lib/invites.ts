import { FunctionsHttpError } from "@supabase/supabase-js";
import { Linking, Platform } from "react-native";

import { supabase } from "@/lib/supabase";

/**
 * - sent: the invite is recorded (and texted, unless Mira is in free mode)
 * - joined: they already replied YES, nothing to send
 * - tooMany: the daily invite limit was reached
 * - offline: couldn't reach Mira
 * - failed: Mira was reached but the text couldn't be sent
 */
export type InviteOutcome = "sent" | "joined" | "tooMany" | "offline" | "failed";

/**
 * The exact text Mira sends from its own number. Keep in step with
 * supabase/functions/send-invite (which builds the real one).
 */
export function inviteText(message: string) {
  return `Mira: ${message.trim()} Reply YES to start, or STOP to opt out.`;
}

/** The invite's usual words (the caregiver can edit them during setup) */
export function defaultInviteMessage(name: string, caregiverName: string) {
  return `Hi ${name.trim() || "there"}, it's ${caregiverName.trim() || "your caregiver"}. I set up Mira so I know you're okay each day.`;
}

/** Free mode: the text the caregiver sends from their own phone (they get the YES) */
export function manualInviteText(message: string) {
  return `${message.trim()} Reply YES to start.`;
}

/**
 * Asks the send-invite Edge Function to record (and, when texting is on,
 * send) the invite. Safe to call again with the same inviteId: the server
 * never texts the same invite twice.
 *
 * `freeMode`: Mira isn't texting yet, so the caregiver sends it themselves.
 */
export async function sendInvite(
  takerId: string,
  inviteId: string,
  message: string,
): Promise<{ outcome: InviteOutcome; freeMode: boolean }> {
  const { data, error } = await supabase.functions.invoke("send-invite", {
    body: { takerId, inviteId, message },
  });
  if (!error) return { outcome: "sent", freeMode: data?.testMode === true };
  if (error instanceof FunctionsHttpError) {
    const status = (error.context as Response).status;
    if (status === 409) return { outcome: "joined", freeMode: false };
    if (status === 429) return { outcome: "tooMany", freeMode: false };
    return { outcome: "failed", freeMode: false };
  }
  return { outcome: "offline", freeMode: false };
}

/** Opens the phone's Messages app with the invite filled in */
export function openMessages(phone: string, body: string) {
  // iOS separates the number and the body with "&", Android with "?"
  const separator = Platform.OS === "ios" ? "&" : "?";
  return Linking.openURL(`sms:${phone}${separator}body=${encodeURIComponent(body)}`);
}

/** Free mode: the caregiver says the person replied YES to them */
export async function confirmJoined(takerId: string): Promise<"joined" | "offline" | "failed"> {
  const { error } = await supabase.functions.invoke("confirm-invite", { body: { takerId } });
  if (!error) return "joined";
  return error instanceof FunctionsHttpError ? "failed" : "offline";
}

/** Is this taker already joined (replied YES)? */
export async function hasJoined(takerId: string) {
  const { data } = await supabase
    .from("takers")
    .select("status")
    .eq("id", takerId)
    .maybeSingle();
  return data?.status === "active";
}

/**
 * Calls `onJoined` the moment this taker replies YES (Supabase Realtime).
 * Returns a function that stops listening.
 */
export function listenForJoin(takerId: string, onJoined: () => void) {
  const channel = supabase
    .channel(`taker-joined-${takerId}`)
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "takers", filter: `id=eq.${takerId}` },
      (change) => {
        if ((change.new as { status?: string }).status === "active") onJoined();
      },
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

// ---------------------------------------------------------------- backups of someone using Mira for themselves
// A self user's backup is only alerted once they've said yes to an invite.

/**
 * Like InviteOutcome, plus:
 * - notSaved: the backup isn't in the database yet (just added; saving takes a moment)
 */
export type BackupInviteOutcome = InviteOutcome | "notSaved";

/** The backup invite's words */
export function backupInviteMessage(backupName: string, yourName: string) {
  return `Hi ${backupName.trim() || "there"}, it's ${yourName.trim() || "your friend"}. I set up Mira so someone knows I'm okay each day, and I'd like you to be one of the people it tells.`;
}

/**
 * Records (and, when texting is on, sends) an invite to one backup. Safe to
 * call again with the same inviteId. `freeMode`: send it from your own phone.
 */
export async function sendBackupInvite(
  backupId: string,
  inviteId: string,
  message: string,
): Promise<{ outcome: BackupInviteOutcome; freeMode: boolean }> {
  const { data, error } = await supabase.functions.invoke("send-invite", {
    body: { backupId, inviteId, message },
  });
  if (!error) return { outcome: "sent", freeMode: data?.testMode === true };
  if (error instanceof FunctionsHttpError) {
    const status = (error.context as Response).status;
    if (status === 404) return { outcome: "notSaved", freeMode: false };
    if (status === 409) return { outcome: "joined", freeMode: false };
    if (status === 429) return { outcome: "tooMany", freeMode: false };
    return { outcome: "failed", freeMode: false };
  }
  return { outcome: "offline", freeMode: false };
}

/**
 * Free mode: "Sam said yes". `noInvite`: there's no invite waiting for them
 * (send one first), or they're already confirmed.
 */
export async function confirmBackup(
  backupId: string,
): Promise<"joined" | "noInvite" | "offline" | "failed"> {
  const { error } = await supabase.functions.invoke("confirm-invite", { body: { backupId } });
  if (!error) return "joined";
  if (error instanceof FunctionsHttpError) {
    return (error.context as Response).status === 404 ? "noInvite" : "failed";
  }
  return "offline";
}

/** Which of this person's backups have said yes, by backup id (null if offline) */
export async function backupConfirmations(takerId: string) {
  const { data, error } = await supabase
    .from("backups")
    .select("id, confirmed_at")
    .eq("taker_id", takerId);
  if (error || !data) return null;
  return Object.fromEntries(data.map((b) => [b.id, b.confirmed_at !== null]));
}
