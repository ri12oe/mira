import { useEffect, useState } from "react";

import { useCaregiverSetup } from "@/context/caregiver-setup";
import { hasJoined, InviteOutcome, listenForJoin, sendInvite } from "@/lib/invites";

/**
 * - sending: waiting for the person to be saved, or for the text to go out
 * - waiting: invite sent, waiting for YES
 * - failed / tooMany: the invite didn't go out (see InviteOutcome)
 * - joined: they replied YES
 */
export type InviteStatus = "sending" | "waiting" | "failed" | "tooMany" | "joined";

type Result = { attempt: number; outcome: InviteOutcome; at: Date };

/** Sends this taker's queued invite (if any) and watches for their YES */
export function useInvite(takerId: string | undefined) {
  const { invites, savedTakerIds } = useCaregiverSetup();
  const invite = takerId ? invites[takerId] : undefined;
  const isSaved = !!takerId && savedTakerIds.has(takerId);

  const [joined, setJoined] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<Result | null>(null);

  // Listen for the YES, and check once in case it came before we started listening
  useEffect(() => {
    if (!takerId) return;
    const stop = listenForJoin(takerId, () => setJoined(true));
    hasJoined(takerId).then((yes) => {
      if (yes) setJoined(true);
    });
    return stop;
  }, [takerId]);

  // Send once the person exists in the database. Same inviteId every time,
  // so React running this twice, or "Try again", can never text twice.
  useEffect(() => {
    if (!takerId || !invite || !isSaved) return;
    let cancelled = false;
    sendInvite(takerId, invite.inviteId, invite.message).then((outcome) => {
      if (!cancelled) setResult({ attempt, outcome, at: new Date() });
    });
    return () => {
      cancelled = true;
    };
  }, [takerId, invite, isSaved, attempt]);

  const current = result?.attempt === attempt ? result : null;
  let status: InviteStatus;
  if (joined || current?.outcome === "joined") status = "joined";
  else if (!invite) status = "waiting"; // sent earlier, e.g. reopened from People
  else if (!current) status = "sending";
  else if (current.outcome === "sent") status = "waiting";
  else if (current.outcome === "tooMany") status = "tooMany";
  else status = "failed";

  return {
    status,
    /** When the text went out (for "Invite texted · 12:11 PM") */
    sentAt: current?.outcome === "sent" ? current.at : null,
    offline: current?.outcome === "offline",
    retry: () => setAttempt((n) => n + 1),
  };
}
