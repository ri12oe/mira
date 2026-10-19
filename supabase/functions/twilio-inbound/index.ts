// twilio-inbound: Twilio calls this when someone texts Mira's number.
//
//   YES → joins, if there's a pending invite for this number (as a taker,
//         or as a self user's backup)
//   OK (or YES, "I'm fine", …) → records today's check-in
//
// Privacy: the message text is read to find these words, then thrown away.
// It is never stored or logged.

import { pushToCaregiver } from "../_shared/expo-push.ts";
import { admin } from "../_shared/supabase.ts";
import { functionUrl, isFromTwilio, maskPhone, twiml } from "../_shared/twilio.ts";

const YES_WORDS = new Set(["YES", "Y", "YEP", "YEAH", "YES PLEASE"]);
const OK_WORDS = new Set([
  ...YES_WORDS,
  "OK", "OKAY", "OKAY THANKS", "OK THANKS", "OK THANK YOU", "K", "KK",
  "IM OK", "IM OKAY", "I AM OK", "I AM OKAY", "IM FINE", "I AM FINE", "FINE", "GOOD", "ALL GOOD",
  "DONE", "HERE", "1",
]);

/** " I'm OK! " → "IM OK" */
function normalize(body: string) {
  return body.toUpperCase().replace(/[^A-Z0-9 ]/g, "").replace(/\s+/g, " ").trim();
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const params = new URLSearchParams(await req.text());
  if (!(await isFromTwilio(req, params, functionUrl("twilio-inbound")))) {
    return new Response("Forbidden", { status: 403 });
  }

  const from = params.get("From") ?? "";
  const word = normalize(params.get("Body") ?? "");

  // 1. YES to an invite
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

    // …or to be someone's backup
    const { data: backups, error: backupError } = await admin.rpc("accept_backup_invites", { p_phone: from });
    if (backupError) {
      console.error(`accept_backup_invites failed for ${maskPhone(from)}:`, backupError.message);
      return new Response("Server error", { status: 500 });
    }
    const accepted = (backups ?? []) as { owner_id: string; backup_name: string; owner_name: string }[];
    if (accepted.length > 0) {
      console.log(`${maskPhone(from)} is now a backup (${accepted.length} invite(s) accepted)`);
      // Tell each person their backup said yes. A failed push isn't fatal:
      // the backup shows as Connected in the app either way.
      await Promise.all(
        accepted.map(async (a) => {
          const result = await pushToCaregiver(
            a.owner_id,
            `${a.backup_name} said yes`,
            `${a.backup_name} will be told if you miss a check-in.`,
            { type: "backup_joined" },
          );
          if (!result.ok) console.warn(`Couldn't tell the owner that a backup joined: ${result.error}`);
        }),
      );
      const owners = [...new Set(accepted.map((a) => a.owner_name?.trim()).filter(Boolean))];
      const whose = owners.length > 0 ? `${owners.join(" and ")}'s` : "a";
      return twiml(`Thank you! You're now ${whose} backup. Mira will only text you if a check-in is missed. Reply STOP anytime to stop.`);
    }
  }

  // 2. A check-in
  if (OK_WORDS.has(word)) {
    const { data, error } = await admin.rpc("record_check_in_by_phone", {
      p_phone: from,
      p_via: "text",
    });
    if (error) {
      console.error(`record_check_in_by_phone failed for ${maskPhone(from)}:`, error.message);
      return new Response("Server error", { status: 500 });
    }
    const recorded = (data ?? []) as { taker_name: string; caregiver_name: string }[];
    if (recorded.length > 0) {
      const name = recorded[0].taker_name?.trim();
      const who = [...new Set(recorded.map((r) => r.caregiver_name?.trim()).filter(Boolean))];
      const told = who.length > 0 ? who.join(" and ") : "Your family";
      return twiml(`Thanks${name ? `, ${name}` : ""}! ${told} will see you're okay today.`);
    }
    return twiml("Thanks! There's no check-in waiting right now. Mira will text you at your usual time.");
  }

  // Anything else: no reply
  return twiml();
});
