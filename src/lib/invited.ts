import type { SelfCheckInResult } from "@/lib/check-ins";
import { supabase } from "@/lib/supabase";

/**
 * Someone a caregiver set up (e.g. Lin) using the Mira app. Her account looks
 * after nobody; it's linked to the people who set her up only by her verified
 * phone number, so everything goes through the invited-person functions
 * (supabase/migrations/…_invited_person.sql). She has no table access.
 */

/**
 * What an invited number is (one or both):
 * - checksIn: she checks in for one or more caregivers (Lin)
 * - backupFor: first names of the people he's a backup for (Sam, for Ana)
 */
export type InvitedAs = { checksIn: boolean; backupFor: string[] };

/**
 * Signing in with the number they were invited on counts as their YES (as
 * the person who checks in, or as a backup). Returns null if nobody has
 * invited this number (or the account looks after people itself). Throws if
 * Mira couldn't be reached, so loading can show "Try again".
 */
export async function joinAsInvited(): Promise<InvitedAs | null> {
  const { data, error } = await supabase.rpc("join_as_invited");
  if (error) {
    if (error.message === "not_invited" || error.message === "account_type_mismatch") return null;
    throw error;
  }
  const result = (data ?? {}) as { checks_in_for?: number; backup_for?: string[] };
  return {
    checksIn: (result.checks_in_for ?? 0) > 0,
    backupFor: Array.isArray(result.backup_for) ? result.backup_for : [],
  };
}

/** Her day: one row per caregiver who set her up (see my_invited_day) */
export type InvitedDayRow = {
  takerId: string;
  /** Her name as that caregiver wrote it */
  firstName: string;
  caregiverName: string;
  caregiverPhone: string | null;
  /** How that caregiver asks her: "app" means pushes to her phone */
  method: "text" | "call" | "app";
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
    method: r.method,
    windowStart: r.window_start,
    windowEnd: r.window_end,
    days: r.days,
    paused: r.paused,
    timeZone: r.time_zone,
    status: r.check_in_status,
    respondedAt: r.responded_at,
  }));
}

/**
 * "I'm okay": one tap counts for every caregiver who set her up (the server
 * uses its own clock). Same results as checkInMyself: recorded, already,
 * notToday, paused, nothingOpen, or offline / failed (NOT counted yet).
 */
export async function checkInAsInvited(): Promise<SelfCheckInResult> {
  const { data, error } = await supabase.rpc("check_in_as_invited");
  if (error) return error.code ? "failed" : "offline";
  const results: Record<string, SelfCheckInResult> = {
    recorded: "recorded",
    already: "already",
    not_today: "notToday",
    paused: "paused",
    nothing_open: "nothingOpen",
  };
  return results[data] ?? "failed";
}
