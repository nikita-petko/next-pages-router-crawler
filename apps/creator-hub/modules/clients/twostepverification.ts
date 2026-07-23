import { Configuration } from '@rbx/clients';
import { ConfigurationApi } from '@rbx/clients/twostepverification';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import { getBEDEV1ServiceBasePath } from './utils';

const basePath = getBEDEV1ServiceBasePath('twostepverification');

const configuration = new Configuration({
  robloxSiteDomain: process.env.robloxSiteDomain,
  basePath,
  credentials: 'include',
  unifiedLogger: unifiedLoggerClient,
});

const configurationApi = new ConfigurationApi(configuration);

const twoStepVerificationClient = {
  getUserConfiguration: async (userId: number) => {
    return configurationApi.v1UsersUserIdConfigurationGet({
      userId,
    });
  },
};

export default twoStepVerificationClient;
