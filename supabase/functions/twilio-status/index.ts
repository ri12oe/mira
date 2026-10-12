// twilio-status: Twilio calls this as a text moves along (sent → delivered, or
// failed/undelivered), so every send in the log ends with its real outcome.

import { admin } from "../_shared/supabase.ts";
import { functionUrl, isFromTwilio } from "../_shared/twilio.ts";

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const params = new URLSearchParams(await req.text());
  if (!(await isFromTwilio(req, params, functionUrl("twilio-status")))) {
    return new Response("Forbidden", { status: 403 });
  }

  // Texts report MessageStatus; calls report CallStatus. For a call,
  // "completed" means it was answered; busy / no answer means it wasn't.
  const callStatus = params.get("CallStatus");
  const sid = params.get("MessageSid") ?? params.get("CallSid");
  const twilioStatus = callStatus
    ? ({ completed: "delivered", busy: "failed", "no-answer": "failed", failed: "failed", canceled: "failed" } as Record<string, string>)[callStatus] ?? "other"
    : params.get("MessageStatus");
  if (!sid || !twilioStatus) return new Response("Missing fields", { status: 400 });

  // Updates can arrive out of order: never move a send backwards
  let query;
  if (twilioStatus === "delivered") {
    query = admin.from("sends").update({ status: "delivered", error: null })
      .eq("provider_id", sid);
  } else if (twilioStatus === "failed" || twilioStatus === "undelivered") {
    const code = params.get("ErrorCode");
    query = admin.from("sends")
      .update({ status: "failed", error: `Twilio ${callStatus ?? twilioStatus}${code ? ` (error ${code})` : ""}` })
      .eq("provider_id", sid)
      .neq("status", "delivered");
  } else if (twilioStatus === "sent") {
    query = admin.from("sends").update({ status: "sent" })
      .eq("provider_id", sid)
      .eq("status", "queued");
  } else {
    return new Response(null, { status: 204 }); // queued, sending, …: nothing to record
  }

  const { error } = await query;
  if (error) {
    console.error(`Couldn't record status ${twilioStatus} for ${sid}:`, error.message);
    return new Response("Server error", { status: 500 }); // Twilio will show the failure
  }
  return new Response(null, { status: 204 });
});
