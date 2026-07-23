import { Configuration } from '@rbx/clients';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import {
  PremiumFeaturesUsersApi,
  V1UsersUserIdSubscriptionsGetRequest,
  V1UsersUserIdSubscriptionsMetadataGetRequest,
  RobloxPremiumFeaturesModelsResponsesSubscriptionProductResponse,
  RobloxPremiumFeaturesApiSubscriptionsMetadataDisplayResponse,
} from '@rbx/clients/premiumfeatures';
import { getBEDEV1ServiceBasePath } from './utils';

export type UserSubscriptionResponse =
  RobloxPremiumFeaturesModelsResponsesSubscriptionProductResponse;

export type UserSubscriptionMetadataResponse =
  RobloxPremiumFeaturesApiSubscriptionsMetadataDisplayResponse;

export class PremiumfeaturesClient {
  private premiumFeaturesUsersApi: PremiumFeaturesUsersApi;

  constructor(basePath: string = getBEDEV1ServiceBasePath('premiumfeatures')) {
    this.premiumFeaturesUsersApi = new PremiumFeaturesUsersApi(
      new Configuration({
        robloxSiteDomain: process.env.robloxSiteDomain,
        basePath,
        credentials: 'include',
        unifiedLogger: unifiedLoggerClient,
      }),
    );
  }

  getUserSubscription(
    userId: number,
  ): Promise<RobloxPremiumFeaturesModelsResponsesSubscriptionProductResponse> {
    const request: V1UsersUserIdSubscriptionsGetRequest = {
      userId,
    };
    return this.premiumFeaturesUsersApi.v1UsersUserIdSubscriptionsGet(request);
  }

  getUserSubscriptionMetadata(
    userId: number,
  ): Promise<RobloxPremiumFeaturesApiSubscriptionsMetadataDisplayResponse> {
    const request: V1UsersUserIdSubscriptionsMetadataGetRequest = {
      userId,
    };
    return this.premiumFeaturesUsersApi.v1UsersUserIdSubscriptionsMetadataGet(request);
  }
}

const premiumfeaturesClient = new PremiumfeaturesClient();
export default premiumfeaturesClient;
