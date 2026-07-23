import type {
  V1UsersUserIdSubscriptionsGetRequest,
  V1UsersUserIdSubscriptionsMetadataGetRequest,
  RobloxPremiumFeaturesModelsResponsesSubscriptionProductResponse,
  RobloxPremiumFeaturesApiSubscriptionsMetadataDisplayResponse,
} from '@rbx/client-premiumfeatures/v1';
import { PremiumFeaturesUsersApi } from '@rbx/client-premiumfeatures/v1';
import { createClientConfiguration } from './utils/createClientConfiguration';

export type UserSubscriptionResponse =
  RobloxPremiumFeaturesModelsResponsesSubscriptionProductResponse;

export type UserSubscriptionMetadataResponse =
  RobloxPremiumFeaturesApiSubscriptionsMetadataDisplayResponse;

export class PremiumfeaturesClient {
  private premiumFeaturesUsersApi: PremiumFeaturesUsersApi;

  constructor() {
    this.premiumFeaturesUsersApi = new PremiumFeaturesUsersApi(
      createClientConfiguration('premiumfeatures', 'bedev1'),
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
