// deliver-sends: pg_cron calls this every minute, right after scheduler_tick().
// It claims the sends that are due, delivers them (in test mode: logs them),
// and records each result. Failures are retried by finish_send (3 tries).
//
// Only the scheduler may call it: it must send the shared secret that's kept
// in Vault (for pg_cron) and in the MIRA_CRON_SECRET Edge Function secret.
//
// Privacy: messages say only WHETHER someone checked in, and when.

import { admin, json } from "../_shared/supabase.ts";
import { isLive, maskPhone, sendSms, type SmsResult } from "../_shared/twilio.ts";

type Send = {
  send_id: string;
  send_purpose: "check_in_prompt" | "reminder" | "caregiver_alert" | "backup_alert" | "all_clear" | "invite";
  send_channel: "sms" | "call" | "push";
  send_to: string | null;
  attempt: number;
  taker_name: string | null;
  caregiver_name: string | null;
  backup_name: string | null;
  taker_time_zone: string | null;
  taker_window_start: number | null;
  taker_window_end: number | null;
  check_in_kind: "scheduled" | "on_demand" | null;
  checked_in_at: string | null;
};

/** 540 → "9:00 AM" */
function clock(minutes: number) {
  const h = Math.floor(minutes / 60) % 24;
  const m = String(minutes % 60).padStart(2, "0");
  return `${h % 12 || 12}:${m} ${h < 12 ? "AM" : "PM"}`;
}

/** The text for one send (also what a call will say, from step 7) */
function messageFor(s: Send) {
  const name = s.taker_name?.trim() || "They";
  const caregiver = s.caregiver_name?.trim() || "your family";
  const window = s.taker_window_start != null && s.taker_window_end != null
    ? ` (${clock(s.taker_window_start)}–${clock(s.taker_window_end)})`
    : "";
  switch (s.send_purpose) {
    case "check_in_prompt":
      return `Mira: Hi ${name}! Reply OK to let ${caregiver} know you're okay today.`;
    case "reminder":
      return `Mira: A gentle reminder, ${name}. Reply OK when you see this.`;
    case "caregiver_alert":
      return s.check_in_kind === "on_demand"
        ? `Mira: ${name} hasn't answered your check-in from 15 minutes ago. Please check on ${name}.`
        : `Mira: ${name} hasn't checked in today${window}. Please check on ${name}.`;
    case "backup_alert":
      return `Mira: ${name} hasn't checked in today, and ${caregiver} has been alerted. As ${name}'s backup contact, please check on ${name} too.`;
    case "all_clear": {
      const at = s.checked_in_at
        ? new Date(s.checked_in_at).toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          timeZone: s.taker_time_zone ?? "America/New_York",
        })
        : "";
      return `Mira: Good news, ${name} just checked in${at ? ` at ${at}` : ""}. No need to worry.`;
    }
    default:
      return `Mira: an update about ${name}.`;
  }
}

async function deliver(s: Send): Promise<SmsResult> {
  const text = messageFor(s);
  switch (s.send_channel) {
    case "sms":
      if (!s.send_to) return { ok: false, error: "No phone number" };
      return sendSms(s.send_to, text);
    case "call":
      // The press-1 call is built in step 7; until then calls only work in test mode
      if (!isLive) {
        console.log(`[test mode] would call ${maskPhone(s.send_to ?? "")} (${s.send_purpose})`);
        return { ok: true, sid: `test-call-${crypto.randomUUID()}` };
      }
      return { ok: false, error: "Phone calls aren't set up yet" };
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
