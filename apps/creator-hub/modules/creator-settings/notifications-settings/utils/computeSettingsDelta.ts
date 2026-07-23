import type {
  CreatorNotification,
  CreatorNotificationCategory,
  NotificationChannelPreferences,
} from '@rbx/client-creator-settings/v1';

const computeSettingsDelta = (
  currentSettings?: CreatorNotificationCategory[],
  editedSettings?: CreatorNotificationCategory[],
) => {
  if (!editedSettings) {
    return false;
  }

  if (!currentSettings) {
    return true;
  }

  return currentSettings.some((surface: CreatorNotificationCategory, index: number) => {
    const currentCategorySurface = currentSettings[index];
    const editedCategorySurface = editedSettings[index];
    if (!editedCategorySurface) {
      return false;
    }

    if (!currentCategorySurface) {
      return true;
    }

    return currentCategorySurface.notifications?.some(
      (notificationSurface: CreatorNotification, notificationIndex: number) => {
        const currentNotificationSurface =
          currentCategorySurface.notifications?.[notificationIndex];
        const editedNotificationSurface = editedCategorySurface.notifications?.[notificationIndex];

        if (!editedNotificationSurface) {
          return false;
        }
        if (!currentNotificationSurface) {
          return true;
        }

        return currentNotificationSurface.notificationChannelPreferences?.some(
          (channelSurface: NotificationChannelPreferences, channelIndex: number) => {
            const currentChannelSurface =
              currentNotificationSurface.notificationChannelPreferences?.[channelIndex];
            const editedChannelSurface =
              editedNotificationSurface.notificationChannelPreferences?.[channelIndex];
            return currentChannelSurface?.status !== editedChannelSurface?.status;
          },
        );
      },
    );
  });
};

export default computeSettingsDelta;
