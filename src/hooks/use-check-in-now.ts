import { useEffect, useState } from "react";

import { CheckInNow, fetchCheckInNow, listenToCheckIn } from "@/lib/check-ins";

/**
 * One "Check in now", kept live: it reloads the moment it's answered,
 * missed (alerts sent) or cancelled, and every 30 seconds as a fallback.
 */
export function useCheckInNow(checkInId: string | undefined) {
  const [version, setVersion] = useState(0);
  const [state, setState] = useState<{ id: string; data: CheckInNow | null; failed: boolean } | null>(null);

  useEffect(() => {
    if (!checkInId) return;
    let cancelled = false;
    fetchCheckInNow(checkInId)
      .then((data) => {
        if (!cancelled) setState({ id: checkInId, data, failed: false });
      })
      .catch((error) => {
        console.warn("Couldn't load the check-in", error);
        if (!cancelled) setState((prev) => ({ id: checkInId, data: prev?.id === checkInId ? prev.data : null, failed: true }));
      });
    return () => {
      cancelled = true;
    };
  }, [checkInId, version]);

  useEffect(() => {
    if (!checkInId) return;
    const stop = listenToCheckIn(checkInId, () => setVersion((v) => v + 1));
    const timer = setInterval(() => setVersion((v) => v + 1), 30_000);
    return () => {
      stop();
      clearInterval(timer);
    };
  }, [checkInId]);

  const current = state?.id === checkInId ? state : null;
  return {
    checkIn: current?.data ?? null,
    loaded: !!current,
    failed: current?.failed ?? false,
    reload: () => setVersion((v) => v + 1),
  };
}
