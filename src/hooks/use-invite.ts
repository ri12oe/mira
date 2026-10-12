import { useEffect, useState } from "react";

import { useCaregiverSetup } from "@/context/caregiver-setup";
import {
  confirmJoined,
  hasJoined,
  InviteOutcome,
  listenForJoin,
  sendInvite,
} from "@/lib/invites";

/**
 * - sending: waiting for the person to be saved, or for the invite to be recorded
 * - waiting: invite sent (or, in free mode, ready to send from your phone)
 * - failed / tooMany: the invite didn't go out (see InviteOutcome)
 * - joined: they replied YES
 */
export type InviteStatus = "sending" | "waiting" | "failed" | "tooMany" | "joined";

type Result = { attempt: number; outcome: InviteOutcome; freeMode: boolean; at: Date };

/** Sends this taker's queued invite (if any) and watches for their YES */
export function useInvite(takerId: string | undefined) {
  const { invites, savedTakerIds } = useCaregiverSetup();
  const invite = takerId ? invites[takerId] : undefined;
  const isSaved = !!takerId && savedTakerIds.has(takerId);

  const [joined, setJoined] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [confirmFailed, setConfirmFailed] = useState<null | "offline" | "failed">(null);

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
    sendInvite(takerId, invite.inviteId, invite.message).then(({ outcome, freeMode }) => {
      if (!cancelled) setResult({ attempt, outcome, freeMode, at: new Date() });
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

  /** Free mode: "Lin replied YES" */
  const confirm = async () => {
    if (!takerId || confirming) return;
    setConfirming(true);
    setConfirmFailed(null);
    const outcome = await confirmJoined(takerId);
    setConfirming(false);
    if (outcome === "joined") setJoined(true);
    else setConfirmFailed(outcome);
  };

  return {
    status,
    /** When the invite was recorded/texted (for "Invite texted · 12:11 PM") */
    sentAt: current?.outcome === "sent" ? current.at : null,
    /** Mira isn't texting yet: the caregiver sends the invite and confirms the YES */
    freeMode: current?.freeMode ?? false,
    offline: current?.outcome === "offline",
    retry: () => setAttempt((n) => n + 1),
    confirm,
    confirming,
    confirmFailed,
  };
}
