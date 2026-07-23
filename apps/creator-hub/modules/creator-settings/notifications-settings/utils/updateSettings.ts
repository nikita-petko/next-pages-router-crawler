import type { CreatorNotificationCategory } from '@rbx/client-creator-settings/v1';
import { NotificationPreferenceStatus } from '@rbx/client-creator-settings/v1';

const updateSettings = (
  categoryIndex: number,
  settingIndex: number,
  channelIndex: number,
  editedNotificationSettings: CreatorNotificationCategory[],
): CreatorNotificationCategory[] => {
  const newSettings = structuredClone(editedNotificationSettings);
  const prevStatus =
    newSettings[categoryIndex].notifications?.[settingIndex]?.notificationChannelPreferences?.[
      channelIndex
    ].status;

  const newStatus =
    prevStatus === NotificationPreferenceStatus.All ||
    prevStatus === NotificationPreferenceStatus.Personalized
      ? NotificationPreferenceStatus.None
      : NotificationPreferenceStatus.All;

  // * (@zwang 08/29/23) non-null assertion here is valid because the
  // * `undefined` check would've failed if any of the `?.` on line 13
  // * short-circuited
  if (typeof prevStatus !== 'undefined') {
    newSettings[categoryIndex].notifications![settingIndex].notificationChannelPreferences![
      channelIndex
    ].status = newStatus;
  }

  return newSettings;
};

export default updateSettings;
