import { CreatorStreamNotification } from '@rbx/client-creator-notification-streams-api/v1';
import TNotificationGroup from '../types/TNotificationGroup';

/*
  Function that formats a single page of notifications, and outputs a list of notification groups.

  Grouping logic is as follows
    - Notifications with the same type, groupingType, and read state are grouped together
    - The first notification of that type will be the titleNotification of the notificationGroup
    - The rest of the notifications of the same type in the list will be the children of the notificationGroup
*/

const formatNotifications = (notifications?: CreatorStreamNotification[]): TNotificationGroup[] => {
  if (!notifications || !notifications.length) {
    return [];
  }

  const results: TNotificationGroup[] = [];
  notifications.forEach((notification) => {
    const current = notification;
    const group: TNotificationGroup = {
      type: current.notificationType,
      groupingType: 'None', // NOTE (@mbae, 03/04/2024): For now, we don't support grouping.
      titleNotification: current,
      children: [],
    };

    results.push(group);
  });

  return results;
};

export default formatNotifications;
