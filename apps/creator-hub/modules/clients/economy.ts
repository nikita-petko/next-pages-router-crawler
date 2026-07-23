import type {
  V1UsersUserIdCurrencyGetRequest,
  V1GroupsGroupIdCurrencyGetRequest,
  V1GroupsGroupIdDevExWatermarksGetRequest,
  RobloxWebResponsesEconomyCurrencyResponse,
  RobloxEconomyApiModelsGetDevExWatermarksResponse,
  V1DeveloperExchangeInfoGetRequest,
  RobloxEconomyApiControllersV1CashoutInfoResponseModel,
  V1GroupsGroupIdUsersPayoutEligibilityGetRequest,
  RobloxEconomyApiModelsUserGroupPayoutEligibilityResponseModel,
  V1GroupsGroupIdSnapshotRobuxGetRequest,
} from '@rbx/client-economy/v1';
import { CurrencyApi, CashOutApi, ProductApi, GroupPayoutsApi } from '@rbx/client-economy/v1';
import { createClientConfiguration } from './utils/createClientConfiguration';

export type GetCurrencyResponse = RobloxWebResponsesEconomyCurrencyResponse;
export type GetDevExInfoResponse = RobloxEconomyApiControllersV1CashoutInfoResponseModel;
export type GetGroupUserPayoutEligibilityResponse =
  RobloxEconomyApiModelsUserGroupPayoutEligibilityResponseModel;

export class EconomyClient {
  private currencyApi: CurrencyApi;

  private cashoutApi: CashOutApi;

  private productApi: ProductApi;

  private groupPayoutsApi: GroupPayoutsApi;

  constructor() {
    const configuration = createClientConfiguration('economy', 'bedev1');
    this.currencyApi = new CurrencyApi(configuration);
    this.cashoutApi = new CashOutApi(configuration);
    this.productApi = new ProductApi(configuration);
    this.groupPayoutsApi = new GroupPayoutsApi(configuration);
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

  async getDeveloperExchangeInfo(fromDevExPage?: boolean) {
    const request: V1DeveloperExchangeInfoGetRequest = { fromDevExPage };
    return this.cashoutApi.v1DeveloperExchangeInfoGet(request);
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

  getGroupDevExWatermarks(
    groupId: number,
  ): Promise<RobloxEconomyApiModelsGetDevExWatermarksResponse> {
    const request: V1GroupsGroupIdDevExWatermarksGetRequest = { groupId };
    return this.currencyApi.v1GroupsGroupIdDevExWatermarksGet(request);
  }
}

const economyClient = new EconomyClient();
export default economyClient;
