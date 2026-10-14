import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { useEffect } from "react";

import { useAuth } from "@/context/auth";
import { PRIMARY_PERSON_ID, useCaregiverSetup } from "@/context/caregiver-setup";
import { alertsPermission, alertsUnavailableReason, registerThisPhone } from "@/lib/push";

// While the app is open, still show alerts as a banner with a sound
if (!alertsUnavailableReason()) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

/**
 * Connects push notifications to the app (renders nothing):
 * - once signed in, refreshes this phone's push address if alerts are on
 * - tapping an alert opens Home on the person it's about
 */
export function NotificationsBridge() {
  const { session } = useAuth();
  const { takerId: primaryTakerId, people, setSelectedId } = useCaregiverSetup();
  const userId = session?.user.id;
  const response = Notifications.useLastNotificationResponse();

  // Push addresses can change (reinstall, new phone); keep ours current
  useEffect(() => {
    if (!userId) return;
    alertsPermission().then((status) => {
      if (status === "granted") registerThisPhone();
    });
  }, [userId]);

  useEffect(() => {
    if (!response || !userId) return;
    const takerId = response.notification.request.content.data?.takerId;
    if (typeof takerId === "string") {
      if (takerId === primaryTakerId) setSelectedId(PRIMARY_PERSON_ID);
      else if (people.some((p) => p.id === takerId)) setSelectedId(takerId);
    }
    router.navigate("/caregiverHome");
    // Only when a new notification is tapped, not when people change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [response, userId]);

  return null;
}
