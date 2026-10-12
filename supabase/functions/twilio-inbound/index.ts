// twilio-inbound: Twilio calls this when someone texts Mira's number.
//
// For now it handles YES (joining after an invite). Step 7 adds "OK" check-ins.
// Privacy: the message text is read to find YES, then thrown away. It is never
// stored or logged.

import { admin } from "../_shared/supabase.ts";
import { functionUrl, isFromTwilio, maskPhone, twiml } from "../_shared/twilio.ts";

const YES_WORDS = new Set(["YES", "Y", "YEP", "YEAH", "YES PLEASE"]);

/** " Yes! " → "YES" */
function normalize(body: string) {
  return body.toUpperCase().replace(/[^A-Z ]/g, "").replace(/\s+/g, " ").trim();
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const params = new URLSearchParams(await req.text());
  if (!(await isFromTwilio(req, params, functionUrl("twilio-inbound")))) {
    return new Response("Forbidden", { status: 403 });
  }

  const from = params.get("From") ?? "";
  const word = normalize(params.get("Body") ?? "");

  if (YES_WORDS.has(word)) {
    const { data, error } = await admin.rpc("accept_invite", { p_phone: from });
    if (error) {
      // A 500 shows up in Twilio's error log, so a lost YES is visible
      console.error(`accept_invite failed for ${maskPhone(from)}:`, error.message);
      return new Response("Server error", { status: 500 });
    }
    if (data && data.length > 0) {
      console.log(`${maskPhone(from)} joined (${data.length} invite(s) accepted)`);
      return twiml("You're all set! Mira will check in with you each day. Reply STOP anytime to stop.");
    }
  }

  // Anything else: no reply for now
  return twiml();
});
