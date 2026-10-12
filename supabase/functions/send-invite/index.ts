// send-invite: texts a taker the "Reply YES to start" invite.
//
// Called by the app (signed in) with { takerId, inviteId, message }.
// The app makes inviteId, so calling again with the same one never texts twice:
// a send that already went out is reported as sent; a failed one is retried.

import { admin, callerId, corsHeaders, json } from "../_shared/supabase.ts";
import { isLive, maskPhone, sendSms } from "../_shared/twilio.ts";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_MESSAGE = 300;

/** prepare_invite's errors → HTTP status for the app */
const ERRORS: Record<string, number> = {
  not_found: 404,
  already_joined: 409,
  too_many_for_taker: 429,
  too_many_today: 429,
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const caregiverId = await callerId(req);
  if (!caregiverId) return json({ error: "not_signed_in" }, 401);

  const { takerId, inviteId, message } = await req.json().catch(() => ({}));
  const text = typeof message === "string" ? message.trim() : "";
  if (!UUID.test(takerId ?? "") || !UUID.test(inviteId ?? "") || !text || text.length > MAX_MESSAGE) {
    return json({ error: "bad_request" }, 400);
  }

  // Checks ownership + limits and records the invite and its send, all at once
  const { data: send, error } = await admin
    .rpc("prepare_invite", {
      p_caregiver_id: caregiverId,
      p_taker_id: takerId,
      p_invite_id: inviteId,
      p_message: text,
    })
    .single();
  if (error) {
    const status = ERRORS[error.message];
    if (status) return json({ error: error.message }, status);
    console.error("prepare_invite failed:", error.message);
    return json({ error: "server_error" }, 500);
  }

  // A retry of an invite that already went out: don't text again
  if (send.send_status === "sent" || send.send_status === "delivered") {
    return json({ status: "sent", testMode: !isLive });
  }

  const body = `Mira: ${text} Reply YES to start, or STOP to opt out.`;
  const result = await sendSms(send.to_phone, body);

  const { data: row } = await admin.from("sends").select("attempts").eq("id", send.send_id).single();
  const attempts = (row?.attempts ?? 0) + 1;
  const { error: logError } = await admin
    .from("sends")
    .update(
      result.ok
        ? { status: "sent", provider_id: result.sid, error: null, attempts }
        : { status: "failed", error: result.error, attempts },
    )
    .eq("id", send.send_id);
  if (logError) console.error("Couldn't record the send result:", logError.message);

  if (!result.ok) {
    console.error(`Invite to ${maskPhone(send.to_phone)} failed: ${result.error}`);
    return json({ error: "send_failed" }, 502);
  }
  return json({ status: "sent", testMode: !isLive });
});
