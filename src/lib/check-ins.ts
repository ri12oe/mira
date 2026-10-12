import { supabase } from "@/lib/supabase";

/**
 * - recorded: today's check-in now counts (on time, or late after the window)
 * - nothing_open: no check-in is waiting (before the window, or already done)
 * - offline / failed: couldn't save it
 */
export type MarkResult = "recorded" | "nothing_open" | "offline" | "failed";

/**
 * The caregiver confirms "Lin checked in" (e.g. Lin phoned them). Stops any
 * alerts still to come; anyone already alerted gets an all-clear.
 */
export async function markCheckedIn(takerId: string): Promise<MarkResult> {
  const { data, error } = await supabase.rpc("mark_checked_in", { p_taker_id: takerId });
  if (error) {
    // supabase-js reports network trouble without an HTTP status code
    return error.code ? "failed" : "offline";
  }
  return data === "recorded" ? "recorded" : "nothing_open";
}
