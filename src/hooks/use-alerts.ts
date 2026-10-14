import { useEffect, useState } from "react";
import { AppState } from "react-native";

import {
  AlertsProblem,
  alertsPermission,
  alertsUnavailableReason,
  registerThisPhone,
  turnOnAlerts,
} from "@/lib/push";

/**
 * - checking: reading the phone's permission
 * - on: this phone gets alerts
 * - off: never asked yet (show "Turn on alerts")
 * - denied: turned off in the phone's Settings
 * - needsBuild: running in Expo Go, which can't receive push
 * - unsupported: web, or a device without push
 */
export type AlertsStatus = "checking" | "on" | "off" | "denied" | "needsBuild" | "unsupported";

/** Are alerts on for this phone? Re-checked when you come back to the app. */
export function useAlerts() {
  const [status, setStatus] = useState<AlertsStatus>("checking");
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<AlertsProblem | null>(null);

  useEffect(() => {
    const check = async () => {
      const unavailable = alertsUnavailableReason();
      if (unavailable === "needsBuild" || unavailable === "unsupported") {
        setStatus(unavailable);
        return;
      }
      const permission = await alertsPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "denied" : "off");
        return;
      }
      // Permission alone isn't enough: "on" only once Mira has this phone's
      // push address. Otherwise show the problem instead of a false "on".
      const result = await registerThisPhone();
      setProblem(result.ok ? null : result.problem);
      setStatus(result.ok ? "on" : "off");
    };
    check();
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") check();
    });
    return () => subscription.remove();
  }, []);

  const turnOn = async () => {
    if (busy) return;
    setBusy(true);
    setProblem(null);
    const result = await turnOnAlerts();
    setBusy(false);
    if (result.ok) {
      setStatus("on");
    } else {
      setProblem(result.problem);
      if (result.problem === "denied") setStatus("denied");
    }
  };

  return { status, busy, problem, turnOn };
}
