import type { CheckInMethod } from "@/context/caregiver-setup";
import type { Tables } from "@/lib/database.types";
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

/**
 * "I'm okay", for someone using Mira for themselves (their own account):
 * - recorded: counted (on time, late, or early, before today's window)
 * - already: today's check-in was already done
 * - notToday: today isn't one of their check-in days
 * - paused: they're taking a break
 * - nothingOpen: nothing to check in for right now
 * - offline / failed: couldn't save it (so it does NOT count yet)
 * The server uses its own clock, so the phone's time can't make it late or early.
 */
export type SelfCheckInResult =
  | "recorded"
  | "already"
  | "notToday"
  | "paused"
  | "nothingOpen"
  | "offline"
  | "failed";

const SELF_RESULTS: Record<string, SelfCheckInResult> = {
  recorded: "recorded",
  already: "already",
  not_today: "notToday",
  paused: "paused",
  nothing_open: "nothingOpen",
};

export async function checkInMyself(): Promise<SelfCheckInResult> {
  const { data, error } = await supabase.rpc("check_in_myself");
  if (error) return error.code ? "failed" : "offline";
  return SELF_RESULTS[data] ?? "failed";
}

export type CheckInRow = Pick<
  Tables<"check_ins">,
  | "id"
  | "kind"
  | "local_date"
  | "status"
  | "responded_at"
  | "responded_via"
  | "confirmed_by_caregiver"
  | "window_starts_at"
  | "window_ends_at"
  | "alert_at"
>;

export type SendRow = Pick<
  Tables<"sends">,
  "id" | "purpose" | "channel" | "status" | "created_at" | "backup_id" | "provider_id"
>;

export type Activity = {
  /** Daily check-ins (not "Check in now" ones) between the two dates, oldest first */
  checkIns: CheckInRow[];
  /** draft / invited / active */
  takerStatus: Tables<"takers">["status"] | null;
  /** Everything sent for today's check-in (reminder, alerts…), oldest first */
  todaySends: SendRow[];
};

/** One person's check-ins between two "YYYY-MM-DD" days, plus today's sends */
export async function fetchActivity(
  takerId: string,
  fromKey: string,
  toKey: string,
  todayKey: string,
): Promise<Activity> {
  const [checkIns, taker] = await Promise.all([
    supabase
      .from("check_ins")
      .select(
        "id, kind, local_date, status, responded_at, responded_via, confirmed_by_caregiver, window_starts_at, window_ends_at, alert_at",
      )
      .eq("taker_id", takerId)
      .eq("kind", "scheduled")
      .gte("local_date", fromKey)
      .lte("local_date", toKey)
      .order("local_date"),
    supabase.from("takers").select("status").eq("id", takerId).maybeSingle(),
  ]);
  if (checkIns.error) throw checkIns.error;
  if (taker.error) throw taker.error;

  const today = checkIns.data.find((c) => c.local_date === todayKey);
  let todaySends: SendRow[] = [];
  if (today) {
    const sends = await supabase
      .from("sends")
      .select("id, purpose, channel, status, created_at, backup_id, provider_id")
      .eq("check_in_id", today.id)
      .order("created_at");
    if (sends.error) throw sends.error;
    todaySends = sends.data;
  }

  return { checkIns: checkIns.data, takerStatus: taker.data?.status ?? null, todaySends };
}

export type TodaySummary = {
  joined: boolean;
  /** Status of today's daily check-in, or null if there isn't one (yet) */
  today: CheckInRow["status"] | null;
};

/** Today's status for several people at once (each with their own "today") */
export async function fetchTodaySummaries(
  people: { takerId: string; todayKey: string }[],
): Promise<Record<string, TodaySummary>> {
  if (people.length === 0) return {};
  const ids = people.map((p) => p.takerId);
  const earliest = people.map((p) => p.todayKey).sort()[0];
  const [checkIns, takers] = await Promise.all([
    supabase
      .from("check_ins")
      .select("taker_id, local_date, status")
      .in("taker_id", ids)
      .eq("kind", "scheduled")
      .gte("local_date", earliest),
    supabase.from("takers").select("id, status").in("id", ids),
  ]);
  if (checkIns.error) throw checkIns.error;
  if (takers.error) throw takers.error;

  const result: Record<string, TodaySummary> = {};
  for (const p of people) {
    const row = checkIns.data.find((c) => c.taker_id === p.takerId && c.local_date === p.todayKey);
    result[p.takerId] = {
      joined: takers.data.find((t) => t.id === p.takerId)?.status === "active",
      today: row?.status ?? null,
    };
  }
  return result;
}

// ---------------------------------------------------------------- Check in now

export type StartProblem = "not_joined" | "paused" | "too_many" | "bad_contacts" | "offline" | "failed";

/**
 * Starts a "Check in now". Returns the check-in to follow on the Waiting
 * screen (if one was already waiting, that one).
 */
export async function startCheckInNow(options: {
  takerId: string;
  method: CheckInMethod;
  waitMinutes: number;
  message: string | null;
  /** Extra people to alert for this check-in only, in order (default: only you) */
  contacts: { name: string; phone: string; alertAfter: number }[];
}): Promise<{ ok: true; checkInId: string } | { ok: false; problem: StartProblem }> {
  const { data, error } = await supabase.rpc("start_check_in_now", {
    p_taker_id: options.takerId,
    p_method: options.method,
    p_wait_minutes: options.waitMinutes,
    p_message: options.message ?? undefined,
    p_contacts: options.contacts.map((c) => ({
      name: c.name,
      phone: c.phone,
      alert_after_minutes: c.alertAfter,
    })),
  });
  if (error) {
    const known: StartProblem[] = ["not_joined", "paused", "too_many", "bad_contacts"];
    if (known.includes(error.message as StartProblem)) return { ok: false, problem: error.message as StartProblem };
    return { ok: false, problem: error.code ? "failed" : "offline" };
  }
  return { ok: true, checkInId: data };
}

/** "Cancel this check-in": true if it was still waiting and is now cancelled */
export async function cancelCheckInNow(checkInId: string) {
  const { data, error } = await supabase.rpc("cancel_check_in_now", { p_check_in_id: checkInId });
  if (error) throw error;
  return data;
}

export type CheckInNow = {
  row: Pick<
    Tables<"check_ins">,
    "id" | "status" | "responded_at" | "responded_via" | "confirmed_by_caregiver" | "window_starts_at" | "alert_at"
  >;
  sends: SendRow[];
};

/** One check-in and what was sent for it (for the Waiting screen) */
export async function fetchCheckInNow(checkInId: string): Promise<CheckInNow | null> {
  const [row, sends] = await Promise.all([
    supabase
      .from("check_ins")
      .select("id, status, responded_at, responded_via, confirmed_by_caregiver, window_starts_at, alert_at")
      .eq("id", checkInId)
      .maybeSingle(),
    supabase
      .from("sends")
      .select("id, purpose, channel, status, created_at, backup_id, provider_id")
      .eq("check_in_id", checkInId)
      .order("created_at"),
  ]);
  if (row.error) throw row.error;
  if (sends.error) throw sends.error;
  return row.data ? { row: row.data, sends: sends.data } : null;
}

let channelCount = 0;

/** Calls `onChange` when this one check-in or its sends change */
export function listenToCheckIn(checkInId: string, onChange: () => void) {
  const channel = supabase
    .channel(`check-in-${checkInId}-${++channelCount}`)
    .on("postgres_changes", { event: "*", schema: "public", table: "check_ins", filter: `id=eq.${checkInId}` }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "sends", filter: `check_in_id=eq.${checkInId}` }, onChange)
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Calls `onChange` whenever this person's check-ins, sends or status change
 * (Supabase Realtime; only your own people). Returns a function to stop.
 */
export function listenToTaker(takerId: string, onChange: () => void) {
  const channel = supabase
    .channel(`taker-activity-${takerId}-${++channelCount}`)
    .on("postgres_changes", { event: "*", schema: "public", table: "check_ins", filter: `taker_id=eq.${takerId}` }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "sends", filter: `taker_id=eq.${takerId}` }, onChange)
    .on("postgres_changes", { event: "UPDATE", schema: "public", table: "takers", filter: `id=eq.${takerId}` }, onChange)
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}
