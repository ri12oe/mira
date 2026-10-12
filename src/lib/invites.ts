import { FunctionsHttpError } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";

/**
 * - sent: the text went out (or already had, for this same invite)
 * - joined: they already replied YES, nothing to send
 * - tooMany: the daily invite limit was reached
 * - offline: couldn't reach Mira
 * - failed: Mira was reached but the text couldn't be sent
 */
export type InviteOutcome = "sent" | "joined" | "tooMany" | "offline" | "failed";

/**
 * The exact text the person receives. Keep in step with
 * supabase/functions/send-invite (which builds the real one).
 */
export function inviteText(message: string) {
  return `Mira: ${message.trim()} Reply YES to start, or STOP to opt out.`;
}

/**
 * Asks the send-invite Edge Function to text the invite. Safe to call again
 * with the same inviteId: the server never texts the same invite twice.
 */
export async function sendInvite(
  takerId: string,
  inviteId: string,
  message: string,
): Promise<InviteOutcome> {
  const { error } = await supabase.functions.invoke("send-invite", {
    body: { takerId, inviteId, message },
  });
  if (!error) return "sent";
  if (error instanceof FunctionsHttpError) {
    const status = (error.context as Response).status;
    if (status === 409) return "joined";
    if (status === 429) return "tooMany";
    return "failed";
  }
  return "offline";
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
