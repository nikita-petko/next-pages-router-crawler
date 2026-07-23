import { useLocalStorage } from '@rbx/react-utilities';
import { useState, useCallback, useMemo } from 'react';
import type TNotificationGroup from '../types/TNotificationGroup';

export default function useNotificationsM2Tracking({
  notifications,
  userId,
}: {
  notifications: TNotificationGroup[];
  userId: number;
}): {
  reportNewUnseenNotifFrontier: (notifId: string) => void;
  lastSeenNotificationId: string;
  setLastSeenNotificationId: (lastSeenNotificationId: string) => void;
  setNewUnseenNotifFrontier: (notifId?: string) => void;
  unseenNotifFrontierIndex: number;
} {
  const [newLastSeenNotificationId, setNewLastSeenNotificationId] = useState<string | undefined>(
    notifications[0]?.titleNotification.notificationId,
  );
  const [lastSeenNotificationId, setLastSeenNotificationId] = useLocalStorage<string>(
    `NotificationTraySeen.${userId}`,
    '',
  );

  // we report the frontier of # unseen notifs for next time tray opens.
  const reportNewUnseenNotifFrontier = useCallback(
    (notifId: string) => {
      if (!notifId) return;

      setNewLastSeenNotificationId(notifId);
    },
    [setNewLastSeenNotificationId],
  );

  const unseenNotifFrontierIndex = useMemo(() => {
    return notifications.findIndex(
      (n) =>
        n.titleNotification.notificationId ===
        (newLastSeenNotificationId ?? lastSeenNotificationId),
    );
  }, [newLastSeenNotificationId, lastSeenNotificationId, notifications]);

  const setNewUnseenNotifFrontier = useCallback(
    (notifId: string | undefined = newLastSeenNotificationId ?? undefined) => {
      if (notifId === undefined) return;
      setNewLastSeenNotificationId(notifId);
      setLastSeenNotificationId(notifId);
    },
    [newLastSeenNotificationId, setNewLastSeenNotificationId, setLastSeenNotificationId],
  );
  return {
    reportNewUnseenNotifFrontier,
    lastSeenNotificationId,
    setLastSeenNotificationId, // TODO (@ahua, 2-7-2026): remove once M2 is fully released
    setNewUnseenNotifFrontier,
    unseenNotifFrontierIndex,
  };
}
