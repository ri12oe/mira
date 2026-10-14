import { useEffect, useState } from "react";

import { fetchTodaySummaries, TodaySummary } from "@/lib/check-ins";
import { localDateKey } from "@/utils/local-date";

const REFRESH_MS = 60 * 1000;

/**
 * Today's check-in status for everyone on the People screen, refreshed every
 * minute. Each person's "today" is in their own time zone.
 */
export function usePeopleToday(people: { takerId: string; timeZone: string }[]) {
  const [now, setNow] = useState(() => new Date());
  const [tick, setTick] = useState(0);
  const [summaries, setSummaries] = useState<Record<string, TodaySummary>>({});

  const list = people.map((p) => ({ takerId: p.takerId, todayKey: localDateKey(now, p.timeZone) }));
  const listKey = JSON.stringify(list);

  useEffect(() => {
    let cancelled = false;
    fetchTodaySummaries(JSON.parse(listKey))
      .then((result) => {
        if (!cancelled) setSummaries(result);
      })
      .catch((error) => console.warn("Couldn't load today's check-ins", error));
    return () => {
      cancelled = true;
    };
  }, [listKey, tick]);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
      setTick((t) => t + 1);
    }, REFRESH_MS);
    return () => clearInterval(timer);
  }, []);

  return { summaries, now };
}
