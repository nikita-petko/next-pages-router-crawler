import { Configuration } from '@rbx/clients';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import {
  LuobuDeveloperExchangeApi,
  DeveloperExchangeApi,
  RobloxApiBillingModelsResponseGetLuobuDevexEligibilityResponseEligibilityEnum as LuobuDevexEligibilityEnum,
  RobloxApiBillingModelsResponseGetLuobuLatestRequestStatusResponseStatusEnum as LuobuDevexRequestStatusEnum,
  V1DeveloperExchangeRequestPostRequest,
} from '@rbx/clients/billing';
import { getBEDEV1ServiceBasePath } from './utils';

const basePath = getBEDEV1ServiceBasePath('billing');

const configuration = new Configuration({
  robloxSiteDomain: process.env.robloxSiteDomain,
  basePath,
  credentials: 'include',
  unifiedLogger: unifiedLoggerClient,
});

const LuobuDevexAPI = new LuobuDeveloperExchangeApi(configuration);
const DevexAPI = new DeveloperExchangeApi(configuration);

export { LuobuDevexEligibilityEnum, LuobuDevexRequestStatusEnum };

export type DevexRequest = V1DeveloperExchangeRequestPostRequest;

export default {
  LuobuDevexAPI,
  DevexAPI,
};
