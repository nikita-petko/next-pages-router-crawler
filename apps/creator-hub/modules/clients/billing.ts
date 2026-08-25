import type { V1DeveloperExchangeRequestPostRequest } from '@rbx/client-billing/v1';
import {
  LuobuDeveloperExchangeApi,
  DeveloperExchangeApi,
  RobloxApiBillingModelsResponseGetLuobuDevexEligibilityResponseEligibilityEnum as LuobuDevexEligibilityEnum,
  RobloxApiBillingModelsResponseGetLuobuLatestRequestStatusResponseStatusEnum as LuobuDevexRequestStatusEnum,
} from '@rbx/client-billing/v1';
import { createClientConfiguration } from './utils/createClientConfiguration';

const configuration = createClientConfiguration('billing', 'bedev1');

const LuobuDevexAPI = new LuobuDeveloperExchangeApi(configuration);
const DevexAPI = new DeveloperExchangeApi(configuration);

export { LuobuDevexEligibilityEnum, LuobuDevexRequestStatusEnum };

export type DevexRequest = V1DeveloperExchangeRequestPostRequest;

export default {
  LuobuDevexAPI,
  DevexAPI,
};
