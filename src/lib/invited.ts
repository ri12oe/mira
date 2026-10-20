import { supabase } from "@/lib/supabase";

/**
 * Someone a caregiver set up (e.g. Lin) using the Mira app. Her account looks
 * after nobody; it's linked to the people who set her up only by her verified
 * phone number, so everything goes through the invited-person functions
 * (supabase/migrations/…_invited_person.sql). She has no table access.
 */

/**
 * Signing in with the number she was invited on counts as her YES. Returns
 * true if she's now connected with at least one caregiver, false if nobody
 * has invited this number (or the account looks after people itself).
 * Throws if Mira couldn't be reached, so loading can show "Try again".
 */
export async function joinAsInvited(): Promise<boolean> {
  const { data, error } = await supabase.rpc("join_as_invited");
  if (!error) return (data ?? 0) > 0;
  if (error.message === "not_invited" || error.message === "account_type_mismatch") return false;
  throw error;
}

/** Her day: one row per caregiver who set her up (see my_invited_day) */
export type InvitedDayRow = {
  takerId: string;
  /** Her name as that caregiver wrote it */
  firstName: string;
  caregiverName: string;
  caregiverPhone: string | null;
  windowStart: number;
  windowEnd: number;
  days: number[];
  paused: boolean;
  timeZone: string;
  /** Today's check-in status, or null before it has started */
  status: "pending" | "on_time" | "late" | "missed" | "skipped" | null;
  respondedAt: string | null;
};

export async function fetchMyInvitedDay(): Promise<InvitedDayRow[]> {
  const { data, error } = await supabase.rpc("my_invited_day");
  if (error) throw error;
  return (data ?? []).map((r) => ({
    takerId: r.taker_id,
    firstName: r.first_name,
    caregiverName: r.caregiver_name,
    caregiverPhone: r.caregiver_phone,
    windowStart: r.window_start,
    windowEnd: r.window_end,
    days: r.days,
    paused: r.paused,
    timeZone: r.time_zone,
    status: r.check_in_status,
    respondedAt: r.responded_at,
  }));
}
