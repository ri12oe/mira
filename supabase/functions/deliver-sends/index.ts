// deliver-sends: pg_cron calls this every minute, right after scheduler_tick().
// It claims the sends that are due, delivers them (in test mode: logs them),
// and records each result. Failures are retried by finish_send (3 tries).
//
// Only the scheduler may call it: it must send the shared secret that's kept
// in Vault (for pg_cron) and in the MIRA_CRON_SECRET Edge Function secret.

import { type Send, textFor } from "../_shared/messages.ts";
import { admin, json } from "../_shared/supabase.ts";
import { isLive, makeCall, maskPhone, sendSms, type SmsResult } from "../_shared/twilio.ts";

async function deliver(s: Send): Promise<SmsResult> {
  switch (s.send_channel) {
    case "sms":
      if (!s.send_to) return { ok: false, error: "No phone number" };
      return sendSms(s.send_to, textFor(s));
    case "call":
      // What the call says comes from twilio-voice when it's answered
      if (!s.send_to) return { ok: false, error: "No phone number" };
      return makeCall(s.send_to, s.send_id);
    case "push":
      // Push notifications come in step 10; until then they're only logged
      console.log(`[test mode] would notify the app (${s.send_purpose})`);
      return { ok: true, sid: `test-push-${crypto.randomUUID()}` };
  }
}

Deno.serve(async (req) => {
  const secret = Deno.env.get("MIRA_CRON_SECRET");
  if (!secret || req.headers.get("x-mira-cron-secret") !== secret) {
    return new Response("Forbidden", { status: 403 });
  }

  const { data, error } = await admin.rpc("claim_due_sends", { p_limit: 50 });
  if (error) {
    console.error("claim_due_sends failed:", error.message);
    return json({ error: "claim_failed" }, 500);
  }
  const sends = (data ?? []) as Send[];

  const results = await Promise.all(
    sends.map(async (s) => {
      let result: SmsResult;
      try {
        result = await deliver(s);
      } catch (e) {
        result = { ok: false, error: e instanceof Error ? e.message : String(e) };
      }
      const { error: finishError } = await admin.rpc("finish_send", {
        p_send_id: s.send_id,
        p_ok: result.ok,
        p_provider_id: result.ok ? result.sid : null,
        p_error: result.ok ? null : result.error,
      });
      if (finishError) console.error(`finish_send failed for ${s.send_id}:`, finishError.message);
      if (!result.ok) {
        console.error(`${s.send_purpose} ${s.send_channel} to ${maskPhone(s.send_to ?? "")} failed (try ${s.attempt}): ${result.error}`);
      }
      return result.ok;
    }),
  );

  const delivered = results.filter(Boolean).length;
  return json({ claimed: sends.length, delivered, failed: sends.length - delivered, testMode: !isLive });
});
