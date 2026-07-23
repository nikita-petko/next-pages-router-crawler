import { Configuration } from '@rbx/clients-core';
import { UserSettingsApiApi } from '@rbx/client-user-settings-api/v1';
import getBEDEV2ServiceBasePath from './utils/getBEDEV2ServiceBasePath';

export type UserSettingsClient = {
  getUserSetting: (requestedUserSettings: string) => Promise<unknown>;
};

const createUserSettingsClient = (bedev2BaseUrl: string): UserSettingsClient => {
  const configuration = new Configuration({
    basePath: getBEDEV2ServiceBasePath('user-settings-api', bedev2BaseUrl),
    credentials: 'include',
  });

  const userSettingsApi = new UserSettingsApiApi(configuration);

  return {
    getUserSetting(requestedUserSettings: string): Promise<unknown> {
      const request = {
        requestedUserSettings,
      };
      return userSettingsApi.userSettingsApiGet(request);
    },
  };
};

export default createUserSettingsClient;
