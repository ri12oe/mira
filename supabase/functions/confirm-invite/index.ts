// confirm-invite: free mode only. The caregiver texted the invite from their
// own phone, the person replied YES to them, and the caregiver taps
// "Lin replied YES". Called by the app (signed in) with { takerId }.
//
// Once real texting is on (SMS_MODE=live), this refuses: then only a real YES
// to Mira's number (twilio-inbound) can mark someone as joined.

import { admin, callerId, corsHeaders, json } from "../_shared/supabase.ts";
import { isLive } from "../_shared/twilio.ts";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  if (isLive) return json({ error: "not_in_free_mode" }, 409);

  const caregiverId = await callerId(req);
  if (!caregiverId) return json({ error: "not_signed_in" }, 401);

  const { takerId } = await req.json().catch(() => ({}));
  if (!UUID.test(takerId ?? "")) return json({ error: "bad_request" }, 400);

  const { data: joined, error } = await admin.rpc("accept_invite_for_taker", {
    p_caregiver_id: caregiverId,
    p_taker_id: takerId,
  });
  if (error) {
    console.error("accept_invite_for_taker failed:", error.message);
    return json({ error: "server_error" }, 500);
  }
  // false: not theirs, no pending invite, or already joined
  return joined ? json({ status: "joined" }) : json({ error: "nothing_to_confirm" }, 404);
});
