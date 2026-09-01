import { ConfigurationApi } from '@rbx/client-twostepverification/v1';
import { createClientConfiguration } from './utils/createClientConfiguration';

const configuration = createClientConfiguration('twostepverification', 'bedev1');

const configurationApi = new ConfigurationApi(configuration);

const twoStepVerificationClient = {
  getUserConfiguration: async (userId: number) => {
    return configurationApi.v1UsersUserIdConfigurationGet({
      userId,
    });
  },
};

export default twoStepVerificationClient;
