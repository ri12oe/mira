// Twilio helpers shared by the Edge Functions.
//
// Test mode is the default: nothing is texted unless the SMS_MODE secret is
// exactly "live". In test mode, sends are logged and recorded as sent with a
// "test-…" id, so the whole flow can be tried without a registered number.

export const isLive = Deno.env.get("SMS_MODE") === "live";

export type SmsResult = { ok: true; sid: string } | { ok: false; error: string };

/** The public URL Twilio calls for one of our functions (also what Twilio signs) */
export function functionUrl(name: string) {
  return `${Deno.env.get("SUPABASE_URL")}/functions/v1/${name}`;
}

/** "+13175550123" → "+1•••••••0123", so logs don't hold whole phone numbers */
export function maskPhone(phone: string) {
  return phone.length > 6 ? `${phone.slice(0, 2)}•••••••${phone.slice(-4)}` : "•••";
}

export async function sendSms(to: string, body: string): Promise<SmsResult> {
  if (!isLive) {
    console.log(`[test mode] would text ${maskPhone(to)} (${body.length} characters)`);
    return { ok: true, sid: `test-${crypto.randomUUID()}` };
  }

  const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
  const messagingServiceSid = Deno.env.get("TWILIO_MESSAGING_SERVICE_SID");
  if (!accountSid || !authToken || !messagingServiceSid) {
    return { ok: false, error: "Twilio secrets are missing" };
  }

  try {
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          To: to,
          MessagingServiceSid: messagingServiceSid,
          Body: body,
          // Twilio reports delivered/failed here later
          StatusCallback: functionUrl("twilio-status"),
        }),
      },
    );
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      return { ok: false, error: `Twilio ${json.code ?? response.status}: ${json.message ?? "send failed"}` };
    }
    return { ok: true, sid: json.sid };
  } catch (error) {
    return { ok: false, error: `Couldn't reach Twilio: ${error instanceof Error ? error.message : error}` };
  }
}

/**
 * Checks the X-Twilio-Signature header, so only Twilio can call our webhooks.
 * Twilio signs: the full URL, then every POST field sorted by name as name+value,
 * with HMAC-SHA1 using the account's auth token, base64-encoded.
 * https://www.twilio.com/docs/usage/security#validating-requests
 */
export async function isFromTwilio(req: Request, params: URLSearchParams, url: string) {
  const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
  const signature = req.headers.get("X-Twilio-Signature");
  if (!authToken || !signature) return false;

  const data = [...params.keys()]
    .sort()
    .reduce((text, key) => text + key + (params.get(key) ?? ""), url);

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(authToken),
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  const expected = btoa(String.fromCharCode(...new Uint8Array(mac)));
  return timingSafeEqual(expected, signature);
}

/** Compares without leaking, through timing, how many characters matched */
function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** A TwiML reply: an optional text back to the sender */
export function twiml(message?: string) {
  const escaped = message
    ?.replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  const body = escaped ? `<Message>${escaped}</Message>` : "";
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><Response>${body}</Response>`, {
    headers: { "Content-Type": "text/xml" },
  });
}
