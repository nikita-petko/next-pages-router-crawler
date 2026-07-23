import { CreatorSettingsAPIApi } from '@rbx/client-creator-settings/v1';
import type { NotificationChannel } from '@modules/clients/creatorSettings';
import { createClientConfiguration } from '@modules/clients/utils/createClientConfiguration';

const configuration = createClientConfiguration('creator-settings', 'bedev2');

const creatorSettingsApi = new CreatorSettingsAPIApi(configuration);

const getCreatorSettings = (userId: string, notificationChannels?: Array<NotificationChannel>) => {
  const getCreatorSettingsRequest = {
    getAllCreatorNotificationSettingsRequest: {
      userId: Number(userId),
      notificationChannels,
    },
  };

  return creatorSettingsApi.v1NotificationsSettingsPost(getCreatorSettingsRequest);
};

export default getCreatorSettings;
