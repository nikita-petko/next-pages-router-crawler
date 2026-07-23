import { Configuration } from '@rbx/clients';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import { ValidationApi } from '@rbx/clients/adsRewardService/v1';

import { getBEDEV2ServiceBasePath } from './utils';

const basePath = getBEDEV2ServiceBasePath('ads-reward-service');

const configuration = new Configuration({
  robloxSiteDomain: process.env.robloxSiteDomain,
  basePath,
  credentials: 'include',
  unifiedLogger: unifiedLoggerClient,
});

const adsRewardServiceClient = new ValidationApi(configuration);

export default adsRewardServiceClient;
