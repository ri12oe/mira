import type { NotificationResponse } from "expo-notifications";
import { router } from "expo-router";
import { useEffect, useRef } from "react";

import { useAuth } from "@/context/auth";
import { PRIMARY_PERSON_ID, useCaregiverSetup } from "@/context/caregiver-setup";
import { loadNotifications } from "@/lib/notifications-module";
import { REMINDER_SOUND, readPreference } from "@/lib/preferences";
import { alertsPermission, alertsUnavailableReason, registerThisPhone } from "@/lib/push";

/** The last alert we already opened, so it isn't handled twice */
let lastHandled: string | null = null;

/**
 * Connects push notifications to the app (renders nothing):
 * - once signed in, refreshes this phone's push address if alerts are on
 * - tapping an alert opens Home on the person it's about; tapping a
 *   reminder opens the check-in
 *
 * Only where alerts can work (Mira's own build on a real phone). On web and in
 * Expo Go, expo-notifications isn't even loaded (see notifications-module.ts).
 */
export function NotificationsBridge() {
  if (alertsUnavailableReason()) return null;
  return <ActiveNotificationsBridge />;
}

function ActiveNotificationsBridge() {
  const { session } = useAuth();
  const { takerId: primaryTakerId, people, setSelectedId, isInvited, syncStatus } = useCaregiverSetup();
  const userId = session?.user.id;
  // Wait until the account has loaded: until then it isn't known yet which
  // Home it has (a caregiver's, a self user's, or an invited person's)
  const settled = syncStatus === "ready" || syncStatus === "failed";

  // The listener below is set up once; it reads the current people from here
  const latest = useRef({ primaryTakerId, people, setSelectedId, isInvited });
  useEffect(() => {
    latest.current = { primaryTakerId, people, setSelectedId, isInvited };
  });

  // Push addresses can change (reinstall, new phone); keep ours current
  useEffect(() => {
    if (!userId) return;
    alertsPermission().then((status) => {
      if (status === "granted") registerThisPhone();
    });
  }, [userId]);

  useEffect(() => {
    const Notifications = loadNotifications();
    if (!Notifications || !userId || !settled) return;

    // While the app is open, still show alerts as a banner with a sound.
    // A self user's daily reminder follows their "Reminder sound" setting.
    // (When the app is closed, the phone plays the sound itself.)
    Notifications.setNotificationHandler({
      handleNotification: async (notification) => {
        const isReminder = notification.request.content.data?.type === "check_in";
        return {
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: !(isReminder && readPreference(REMINDER_SOUND) === "0"),
          shouldSetBadge: false,
        };
      },
    });

    const open = (response: NotificationResponse) => {
      const id = response.notification.request.identifier;
      if (id === lastHandled) return;
      lastHandled = id;
      // "Sam said yes" (to someone using Mira for themselves): show their people
      const type = response.notification.request.content.data?.type;
      if (type === "backup_joined") {
        router.navigate("/selfPeople");
        return;
      }
      // "Time to check in" / the reminder: Home has the check-in button
      // (someone using Mira for themselves, or someone who was invited)
      if (type === "check_in") {
        router.navigate(latest.current.isInvited ? "/invitedHome" : "/selfHome");
        return;
      }
      const takerId = response.notification.request.content.data?.takerId;
      const { primaryTakerId, people, setSelectedId } = latest.current;
      if (typeof takerId === "string") {
        if (takerId === primaryTakerId) setSelectedId(PRIMARY_PERSON_ID);
        else if (people.some((p) => p.id === takerId)) setSelectedId(takerId);
      }
      router.navigate("/caregiverHome");
    };

    // An alert that opened the app from closed, then any tapped while it runs
    const opening = Notifications.getLastNotificationResponse();
    if (opening) open(opening);
    const subscription = Notifications.addNotificationResponseReceivedListener(open);
    return () => subscription.remove();
  }, [userId, settled]);

  return null;
}
