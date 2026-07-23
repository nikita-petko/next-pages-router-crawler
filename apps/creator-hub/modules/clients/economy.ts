import { Configuration } from '@rbx/clients';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import {
  CurrencyApi,
  CashOutApi,
  ProductApi,
  V1UsersUserIdCurrencyGetRequest,
  V1GroupsGroupIdCurrencyGetRequest,
  RobloxWebResponsesEconomyCurrencyResponse,
  V1DeveloperExchangeInfoGetRequest,
  RobloxEconomyApiControllersV1CashoutInfoResponseModel,
  V1ProductsProductIdGetRequest,
  GroupPayoutsApi,
  V1GroupsGroupIdUsersPayoutEligibilityGetRequest,
  RobloxEconomyApiModelsUserGroupPayoutEligibilityResponseModel,
  V1GroupsGroupIdSnapshotRobuxGetRequest,
} from '@rbx/clients/economy';
import { getBEDEV1ServiceBasePath } from './utils';

export type GetCurrencyResponse = RobloxWebResponsesEconomyCurrencyResponse;
export type GetDevExInfoResponse = RobloxEconomyApiControllersV1CashoutInfoResponseModel;
export type GetGroupUserPayoutEligibilityResponse =
  RobloxEconomyApiModelsUserGroupPayoutEligibilityResponseModel;

export class EconomyClient {
  private currencyApi: CurrencyApi;

  private cashoutApi: CashOutApi;

  private productApi: ProductApi;

  private groupPayoutsApi: GroupPayoutsApi;

  constructor(basePath: string = getBEDEV1ServiceBasePath('economy')) {
    const defaultConfig = new Configuration({
      robloxSiteDomain: process.env.robloxSiteDomain,
      basePath,
      credentials: 'include',
      unifiedLogger: unifiedLoggerClient,
    });

    this.currencyApi = new CurrencyApi(defaultConfig);
    this.cashoutApi = new CashOutApi(defaultConfig);
    this.productApi = new ProductApi(defaultConfig);
    this.groupPayoutsApi = new GroupPayoutsApi(defaultConfig);
  }

  getUserCurrency(userId: number) {
    const request: V1UsersUserIdCurrencyGetRequest = {
      userId,
    };
    return this.currencyApi.v1UsersUserIdCurrencyGet(request);
  }

  getGroupCurrency(groupId: number) {
    const request: V1GroupsGroupIdCurrencyGetRequest = { groupId };
    return this.currencyApi.v1GroupsGroupIdCurrencyGet(request);
  }

  getDeveloperExchangeInfo(fromDevExPage?: boolean) {
    const request: V1DeveloperExchangeInfoGetRequest = { fromDevExPage };
    return this.cashoutApi.v1DeveloperExchangeInfoGet(request);
  }

  getProductPrice(productId: number, showPurchasable?: boolean) {
    const request: V1ProductsProductIdGetRequest = { productId, showPurchasable };
    return this.productApi.v1ProductsProductIdGet(request);
  }

  getGroupUserPayoutEligibility(
    groupId: number,
    userIds: number[],
  ): Promise<GetGroupUserPayoutEligibilityResponse> {
    const request: V1GroupsGroupIdUsersPayoutEligibilityGetRequest = {
      userIds,
      groupId,
    };
    return this.groupPayoutsApi.v1GroupsGroupIdUsersPayoutEligibilityGet(request);
  }

  getGroupSnapshotRobux(groupId: number) {
    const request: V1GroupsGroupIdSnapshotRobuxGetRequest = { groupId };
    return this.groupPayoutsApi.v1GroupsGroupIdSnapshotRobuxGet(request);
  }
}

const economyClient = new EconomyClient();
export default economyClient;
