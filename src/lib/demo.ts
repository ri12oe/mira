import type { PostgrestError } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";

/**
 * Demo controls (supabase/migrations/20261109120000_demo_controls.sql).
 * They move today's check-in for one demo person earlier, so the scheduler
 * does the next part of the day right away:
 * - start: today's check-in opens now (Mira asks them)
 * - window_end: the window ends now (gentle reminder)
 * - alert: the extra time is up now (missed: the caregiver is alerted)
 * - backups: every backup's delay is up now (the backups are alerted)
 */
export type DemoStep = "start" | "window_end" | "alert" | "backups";

export type DemoProblem =
  | "notDemo" // not a demo account, or not one of their people
  | "paused"
  | "notJoined"
  | "noCheckInToday" // tap "Start the day" first
  | "alreadyCheckedIn"
  | "offline"
  | "failed";

const PROBLEMS: Record<string, DemoProblem> = {
  not_demo: "notDemo",
  paused: "paused",
  not_joined: "notJoined",
  no_check_in_today: "noCheckInToday",
  already_checked_in: "alreadyCheckedIn",
};

/** Whether this account gets the demo controls (only the seeded demo accounts) */
export async function isDemoAccount(): Promise<boolean> {
  const { data, error } = await supabase.rpc("is_demo_account");
  return !error && data === true;
}

/** Fast-forwards today's check-in. null = done (Home updates live) */
export async function demoAdvance(takerId: string, step: DemoStep): Promise<DemoProblem | null> {
  const { error } = await supabase.rpc("demo_advance", { p_taker_id: takerId, p_step: step });
  return describe(error);
}

/** "Pretend Lin texted OK": records a check-in the way they check in */
export async function demoReply(takerId: string): Promise<DemoProblem | null> {
  const { error } = await supabase.rpc("demo_reply", { p_taker_id: takerId });
  return describe(error);
}

function describe(error: PostgrestError | null): DemoProblem | null {
  if (!error) return null;
  // supabase-js reports network trouble without an error code
  if (!error.code) return "offline";
  // The server's errors arrive as the message (raise exception 'not_demo')
  return PROBLEMS[error.message] ?? "failed";
}