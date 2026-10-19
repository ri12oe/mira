import { AuthError, isAuthRetryableFetchError } from "@supabase/supabase-js";

import { forgetLoadedActivity } from "@/hooks/use-taker-activity";
import { forgetOnSignOut } from "@/lib/preferences";
import { supabase } from "@/lib/supabase";

/** What went wrong, in terms the screens can turn into plain words */
export type AuthProblem =
  | "noAccount" // signing in with a number that never set up Mira
  | "offline"
  | "tooSoon" // asked for another code too quickly
  | "notSent" // the SMS provider refused (e.g. Twilio account not approved)
  | "wrongCode"
  | "expired"
  | "unknown";

/** How long a texted code works (Twilio Verify's default) */
export const CODE_LIFETIME_MS = 10 * 60 * 1000;
/** How long the code screen waits before offering a new code */
export const RESEND_AFTER_MS = 60 * 1000;

/**
 * Texts a 6-digit code to `phone` (E.164).
 * `createAccount: false` is for "I already have an account": unknown numbers
 * get "noAccount" instead of quietly becoming a new caregiver.
 */
export async function sendCode(
  phone: string,
  { createAccount }: { createAccount: boolean },
): Promise<AuthProblem | null> {
  const { error } = await supabase.auth.signInWithOtp({
    phone,
    options: { shouldCreateUser: createAccount },
  });
  return error ? describe(error) : null;
}

/** Checks the code; on success Supabase saves the session and the app is signed in */
export async function checkCode(
  phone: string,
  code: string,
  sentAt: number,
): Promise<AuthProblem | null> {
  const { error } = await supabase.auth.verifyOtp({
    phone,
    token: code,
    type: "sms",
  });
  if (!error) return null;

  const problem = describe(error);
  // Supabase answers "otp_expired" for a wrong code AND an old one, so use the clock
  if (problem === "wrongCode" && Date.now() - sentAt > CODE_LIFETIME_MS) {
    return "expired";
  }
  return problem;
}

export async function signOut() {
  await supabase.auth.signOut();
  forgetOnSignOut();
  forgetLoadedActivity();
}

function describe(error: AuthError): AuthProblem {
  if (isAuthRetryableFetchError(error)) return "offline";
  switch (error.code) {
    case "otp_disabled":
    case "signup_disabled":
      return "noAccount";
    case "otp_expired":
      return "wrongCode";
    case "over_sms_send_rate_limit":
    case "over_request_rate_limit":
      return "tooSoon";
    case "sms_send_failed":
      return "notSent";
    default:
      return "unknown";
  }
}
