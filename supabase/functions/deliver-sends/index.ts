// deliver-sends: pg_cron calls this every minute, right after scheduler_tick().
// It claims the sends that are due, delivers them (in test mode: logs them),
// and records each result. Failures are retried by finish_send (3 tries).
//
// Only the scheduler may call it: it must send the shared secret that's kept
// in Vault (for pg_cron) and in the MIRA_CRON_SECRET Edge Function secret.

import { pushToAccounts, pushToCaregiver } from "../_shared/expo-push.ts";
import { invitedPushFor, selfPushFor, type Send, textFor } from "../_shared/messages.ts";
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
    case "push": {
      // The caregiver's phones: always real (push is free)
      if (s.send_purpose === "caregiver_alert" || s.send_purpose === "all_clear") {
        const { data: owner } = await admin.from("sends").select("caregiver_id, taker_id").eq("id", s.send_id).single();
        if (!owner) return { ok: false, error: "Send not found" };
        const name = s.taker_name?.trim() || "They";
        const title = s.send_purpose === "all_clear" ? `${name} checked in` : `${name} hasn't checked in`;
        return pushToCaregiver(owner.caregiver_id, title, textFor(s).replace(/^Mira: /, ""), {
          takerId: owner.taker_id,
          purpose: s.send_purpose,
        });
      }
      // Someone using Mira for themselves: the ask and the reminder go to
      // their own phones (the account is theirs). Real, like all pushes.
      if (s.taker_is_self && (s.send_purpose === "check_in_prompt" || s.send_purpose === "reminder")) {
        const { data: owner } = await admin
          .from("sends")
          .select("caregiver_id, taker_id, check_in_id")
          .eq("id", s.send_id)
          .single();
        if (!owner) return { ok: false, error: "Send not found" };
        const { title, body } = selfPushFor(s);
        return pushToCaregiver(
          owner.caregiver_id,
          title,
          body,
          {
            type: "check_in",
            takerId: owner.taker_id,
            checkInId: owner.check_in_id,
            purpose: s.send_purpose,
          },
          { reminder: true },
        );
      }
      // Someone a caregiver set up on the Mira app (Lin): her own phones, the
      // ones where she signed in from "Someone invited me"
      if (s.send_purpose === "check_in_prompt" || s.send_purpose === "reminder") {
        return pushToInvited(s);
      }
      return { ok: false, error: `Nothing to push for ${s.send_purpose}` };
    }
  }
}

type InvitedTargets = { accounts: string[]; caregivers: string[]; name: string | null; duplicate: boolean };

async function pushToInvited(s: Send): Promise<SmsResult> {
  const { data, error } = await admin.rpc("invited_push_targets", { p_send_id: s.send_id });
  if (error) return { ok: false, error: `Couldn't find her phones: ${error.message}` };
  const her = data as InvitedTargets;
  // Two caregivers asking at once: her phone buzzes once (one tap answers both)
  if (her.duplicate) return { ok: true, sid: `same-as-other-push-${crypto.randomUUID()}` };
  // Not signed in to Mira anywhere yet: logged as failed, never as sent
  if (her.accounts.length === 0) {
    return { ok: false, error: `${s.taker_name?.trim() || "They"} hasn't signed in to Mira on a phone yet` };
  }
  const { data: owner } = await admin.from("sends").select("taker_id, check_in_id").eq("id", s.send_id).single();
  const { title, body } = invitedPushFor(s, her);
  return pushToAccounts(
    her.accounts,
    title,
    body,
    { type: "check_in", takerId: owner?.taker_id, checkInId: owner?.check_in_id, purpose: s.send_purpose },
    { reminder: true },
  );
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
