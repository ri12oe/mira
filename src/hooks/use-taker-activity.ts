import { useEffect, useState } from "react";

import { Activity, fetchActivity, listenToTaker } from "@/lib/check-ins";
import { addDays, localDateKey, weekKeys } from "@/utils/local-date";

const REFRESH_MS = 60 * 1000;

/**
 * The last load for each person and range. Switching tabs unmounts the
 * screen, so without this it would start empty each time and briefly show
 * the wrong state (e.g. the "I'm okay" button after checking in). Shown at
 * once on the way back, then refreshed.
 */
const lastLoaded = new Map<string, Activity>();

/** Signing out or deleting the account: drop what was remembered */
export function forgetLoadedActivity() {
  lastLoaded.clear();
}

/** Which days to load: this week (Home), or a month plus the last 60 days (History) */
export type ActivityRange = { kind: "week" } | { kind: "month"; year: number; month: number };

/**
 * One person's check-ins (and today's sends), kept fresh: it reloads whenever
 * the database changes (Realtime) and once a minute, so "today" and times like
 * "Window open until 11 AM" move on by themselves.
 *
 * "Today" is the person's own day, in their time zone.
 */
export function useTakerActivity(takerId: string | undefined, timeZone: string, range: ActivityRange) {
  const [version, setVersion] = useState(0);
  const [now, setNow] = useState(() => new Date());
  const [result, setResult] = useState<{ key: string; data: Activity | null; failed: boolean } | null>(null);

  const todayKey = localDateKey(now, timeZone);
  let fromKey: string;
  let toKey: string;
  if (range.kind === "week") {
    const week = weekKeys(todayKey);
    fromKey = week[0];
    toKey = week[6];
  } else {
    const first = `${range.year}-${String(range.month + 1).padStart(2, "0")}-01`;
    const nextFirst = range.month === 11
      ? `${range.year + 1}-01-01`
      : `${range.year}-${String(range.month + 2).padStart(2, "0")}-01`;
    const last = addDays(nextFirst, -1);
    const recentStart = addDays(todayKey, -60);
    fromKey = first < recentStart ? first : recentStart;
    toKey = last > todayKey ? last : todayKey;
  }
  const key = `${takerId}|${fromKey}|${toKey}|${todayKey}`;

  useEffect(() => {
    if (!takerId) return;
    const thisKey = `${takerId}|${fromKey}|${toKey}|${todayKey}`;
    let cancelled = false;
    fetchActivity(takerId, fromKey, toKey, todayKey)
      .then((data) => {
        // Remembered even if the screen has gone, so it's fresh next time
        lastLoaded.set(thisKey, data);
        if (!cancelled) setResult({ key: thisKey, data, failed: false });
      })
      .catch((error) => {
        console.warn("Couldn't load check-ins", error);
        // Keep showing what we had; just note that this refresh failed
        if (!cancelled) {
          setResult((prev) => ({ key: thisKey, data: prev?.key === thisKey ? prev.data : null, failed: true }));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [takerId, fromKey, toKey, todayKey, version]);

  useEffect(() => {
    if (!takerId) return;
    const stop = listenToTaker(takerId, () => setVersion((v) => v + 1));
    const timer = setInterval(() => {
      setNow(new Date());
      setVersion((v) => v + 1);
    }, REFRESH_MS);
    return () => {
      stop();
      clearInterval(timer);
    };
  }, [takerId]);

  const current = result?.key === key ? result : null;
  return {
    activity: current?.data ?? lastLoaded.get(key) ?? null,
    /** Loaded, but the last refresh failed (offline?) */
    failed: current?.failed ?? false,
    now,
    todayKey,
    reload: () => setVersion((v) => v + 1),
  };
}
