// twilio-voice: what Mira says on its phone calls, and listening for "1".
//
// Twilio calls this when someone answers (step=start), and again with the
// key they pressed (step=answer). The send id in the URL says which call it is.
//   prompt / reminder: "…please press 1" → 1 records the check-in
//   alerts:            the alert is read out twice, then goodbye

import { type Send, callScriptFor, expectsAnswer } from "../_shared/messages.ts";
import { admin } from "../_shared/supabase.ts";
import { functionUrl, isFromTwilio, voiceResponse, xmlEscape } from "../_shared/twilio.ts";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Slow, clear speech for older listeners */
const say = (text: string) => `<Say voice="Polly.Joanna" language="en-US"><prosody rate="90%">${xmlEscape(text)}</prosody></Say>`;

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  // Twilio signs the full URL it called, query string included
  const query = new URL(req.url).search;
  const params = new URLSearchParams(await req.text());
  if (!(await isFromTwilio(req, params, functionUrl("twilio-voice") + query))) {
    return new Response("Forbidden", { status: 403 });
  }

  const search = new URLSearchParams(query);
  const sendId = search.get("send") ?? "";
  const step = search.get("step") ?? "start";
  if (!UUID.test(sendId)) return voiceResponse(say("Sorry, something went wrong. Goodbye.") + "<Hangup/>");

  const { data, error } = await admin.rpc("get_send_details", { p_send_id: sendId }).maybeSingle();
  const send = data as Send | null;
  if (error || !send) {
    console.error("get_send_details failed:", error?.message ?? "not found");
    return voiceResponse(say("Sorry, something went wrong. Goodbye.") + "<Hangup/>");
  }
  const caregiver = send.caregiver_name?.trim() || "your family";
  const answerUrl = xmlEscape(`${functionUrl("twilio-voice")}?send=${sendId}&step=answer`);

  if (step === "answer") {
    if (params.get("Digits") === "1") {
      const { error: recordError } = await admin.rpc("record_call_answer", { p_send_id: sendId });
      if (recordError) {
        console.error("record_call_answer failed:", recordError.message);
        return voiceResponse(say("Sorry, we couldn't save that. Please try again later. Goodbye.") + "<Hangup/>");
      }
      return voiceResponse(say(`Thank you. ${caregiver} will know you're okay. Have a good day. Goodbye.`) + "<Hangup/>");
    }
    // Any other key: ask once more
    return voiceResponse(
      `<Gather numDigits="1" timeout="8" action="${answerUrl}" method="POST">${say("Please press 1 if you're okay.")}</Gather>` +
        say("We didn't hear anything. Goodbye.") + "<Hangup/>",
    );
  }

  // step=start: the person just answered
  const script = callScriptFor(send);
  if (expectsAnswer(send)) {
    return voiceResponse(
      `<Gather numDigits="1" timeout="8" action="${answerUrl}" method="POST">${say(script)}</Gather>` +
        // No key pressed: repeat once, then hang up (the reminder/alerts follow on schedule)
        `<Gather numDigits="1" timeout="8" action="${answerUrl}" method="POST">${say(script)}</Gather>` +
        say("We didn't hear anything. Goodbye.") + "<Hangup/>",
    );
  }
  return voiceResponse(say(script) + '<Pause length="1"/>' + say(script) + say("Goodbye.") + "<Hangup/>");
});
