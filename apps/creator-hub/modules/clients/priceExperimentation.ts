import { Configuration } from '@rbx/clients';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import { PriceExperimentationApiApi as PriceExperimentationApi } from '@rbx/clients/priceExperimentationApi/v1';
import { getBEDEV2ServiceBasePath } from './utils';

const basePath = getBEDEV2ServiceBasePath('price-experimentation-api');

const configuration = new Configuration({
  robloxSiteDomain: process.env.robloxSiteDomain,
  basePath,
  credentials: 'include',
  unifiedLogger: unifiedLoggerClient,
});

const priceExperimentationApi = new PriceExperimentationApi(configuration);
export default priceExperimentationApi;
