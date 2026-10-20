// What Mira says, by text or by phone call. Shared by deliver-sends (texts)
// and twilio-voice (calls), so both always say the same thing.
//
// Privacy: only WHETHER someone checked in, and when. Nothing else.

/** One send, as returned by claim_due_sends / get_send_details */
export type Send = {
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
  /** "Check in now": the caregiver's own words (null: the usual words) */
  prompt_message: string | null;
  /** For someone using Mira for themselves (no caregiver; they check in with the app) */
  taker_is_self: boolean;
};

/** 540 → "9:00 AM" */
export function clock(minutes: number) {
  const h = Math.floor(minutes / 60) % 24;
  const m = String(minutes % 60).padStart(2, "0");
  return `${h % 12 || 12}:${m} ${h < 12 ? "AM" : "PM"}`;
}

function names(s: Send) {
  return {
    name: s.taker_name?.trim() || "They",
    caregiver: s.caregiver_name?.trim() || "your family",
  };
}

/** The text message for one send */
export function textFor(s: Send) {
  const { name, caregiver } = names(s);
  const window = s.taker_window_start != null && s.taker_window_end != null
    ? ` (${clock(s.taker_window_start)}–${clock(s.taker_window_end)})`
    : "";
  switch (s.send_purpose) {
    case "check_in_prompt":
      if (s.prompt_message) return `Mira: ${s.prompt_message}`;
      return `Mira: Hi ${name}! Reply OK to let ${caregiver} know you're okay today.`;
    case "reminder":
      return `Mira: A gentle reminder, ${name}. Reply OK when you see this.`;
    case "caregiver_alert":
      return s.check_in_kind === "on_demand"
        ? `Mira: ${name} hasn't answered your Check in now yet. Please check on ${name}.`
        : `Mira: ${name} hasn't checked in today${window}. Please check on ${name}.`;
    case "backup_alert":
      // A self user has no caregiver: the backups are the first to know
      return s.taker_is_self
        ? `Mira: ${name} hasn't checked in today${window}. As ${name}'s backup contact, please check on ${name}.`
        : `Mira: ${name} hasn't checked in today, and ${caregiver} has been alerted. As ${name}'s backup contact, please check on ${name} too.`;
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

/** What a phone call says (no "Mira:" prefix, and the press-1 instruction for prompts) */
export function callScriptFor(s: Send) {
  const { name, caregiver } = names(s);
  switch (s.send_purpose) {
    case "check_in_prompt":
      if (s.prompt_message) {
        // The caregiver's words, always ending with how to answer
        return /press 1/i.test(s.prompt_message)
          ? `This is Mira. ${s.prompt_message}`
          : `This is Mira. ${s.prompt_message} If you're okay, please press 1.`;
      }
      return `Hi ${name}, this is Mira, calling for ${caregiver}. If you're okay today, please press 1.`;
    case "reminder":
      return `Hi ${name}, this is Mira with a gentle reminder. If you're okay, please press 1.`;
    default:
      // Alerts: the same words as the text, spoken
      return textFor(s).replace(/^Mira: /, "This is Mira. ");
  }
}

/**
 * The push a self user gets on their own phone: the daily ask and the
 * reminder. Tapping it opens the check-in (data.type = "check_in").
 */
export function selfPushFor(s: Send): { title: string; body: string } {
  const name = s.taker_name?.trim();
  if (s.send_purpose === "reminder") {
    return {
      title: "A gentle reminder",
      body: `${name ? `${name}, tap` : "Tap"} to let your people know you're okay.`,
    };
  }
  return {
    title: "Time to check in",
    body: `${name ? `Hi ${name}! Tap` : "Tap"} to let your people know you're okay today.`,
  };
}

/** "Jordan", "Jordan and Maya", "Jordan, Maya and Sam" */
function joinNames(names: string[]) {
  if (names.length <= 1) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

/**
 * The push someone a caregiver set up on the Mira app (Lin) gets on her own
 * phone: the daily ask, the reminder, or a "Check in now". It names everyone
 * one tap tells, like her Home does. Tapping it opens her check-in.
 */
export function invitedPushFor(
  s: Send,
  her: { name: string | null; caregivers: string[] },
): { title: string; body: string } {
  const name = her.name?.trim();
  const told = joinNames(her.caregivers) || s.caregiver_name?.trim() || "your family";
  if (s.check_in_kind === "on_demand") {
    // One caregiver asking right now, in their own words if they wrote some
    const asker = s.caregiver_name?.trim() || "Your family";
    return {
      title: `${asker} is checking on you`,
      body: s.prompt_message?.trim() || `${name ? `${name}, tap` : "Tap"} to let ${asker} know you're okay.`,
    };
  }
  if (s.send_purpose === "reminder") {
    return {
      title: "A gentle reminder",
      body: `${name ? `${name}, tap` : "Tap"} to let ${told} know you're okay.`,
    };
  }
  return {
    title: "Time to check in",
    body: `${name ? `Hi ${name}! Tap` : "Tap"} to let ${told} know you're okay today.`,
  };
}

/** Prompts and reminders wait for "1"; alerts just speak */
export function expectsAnswer(s: Send) {
  return s.send_purpose === "check_in_prompt" || s.send_purpose === "reminder";
}
