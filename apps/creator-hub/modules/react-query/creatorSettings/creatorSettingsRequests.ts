import { NotificationChannel } from '@modules/clients/creatorSettings';
import { getBEDEV2ServiceBasePath } from '@modules/clients/utils';
import { Configuration } from '@rbx/clients';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import { CreatorSettingsAPIApi } from '@rbx/clients/creatorSettings';

const basePath = getBEDEV2ServiceBasePath('creator-settings');

const configuration = new Configuration({
  robloxSiteDomain: process.env.robloxSiteDomain,
  basePath,
  credentials: 'include',
  unifiedLogger: unifiedLoggerClient,
});

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
