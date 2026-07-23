import type {
  V1PayoutCreateAccountPostRequest,
  V1ProductSellerGetRequest,
  V1PurchaseListGetRequest,
  V1ProductDeactivatePostRequest,
} from '@rbx/client-fiat-paid-access-service/v1';
import { FiatPaidAccessServiceAPIApi } from '@rbx/client-fiat-paid-access-service/v1';
import { createClientConfiguration } from '@modules/clients/utils/createClientConfiguration';

const configuration = createClientConfiguration('fiat-paid-access-service', 'bedev2');

const fiatPaidAccessServiceApi = new FiatPaidAccessServiceAPIApi(configuration);

export const getPayoutAccountStatus = async () => {
  return fiatPaidAccessServiceApi.v1PayoutAccountStatusGet();
};

export const createPayoutAccount = async (userId: number, fullName: string) => {
  const requestPayload: V1PayoutCreateAccountPostRequest = {
    robloxPaidAccessFiatPaidAccessServiceV1CreateFiatPayoutAccountRequest: {
      userId,
      fullName,
    },
  };

  return fiatPaidAccessServiceApi.v1PayoutCreateAccountPost(requestPayload);
};

export const deactivateProduct = async (rootPlaceId: number) => {
  const requestPayload: V1ProductDeactivatePostRequest = {
    robloxPaidAccessFiatPaidAccessServiceV1DeactivateProductRequest: {
      rootPlaceId,
    },
  };

  return fiatPaidAccessServiceApi.v1ProductDeactivatePost(requestPayload);
};

export const getConfiguredPrices = async () => {
  return fiatPaidAccessServiceApi.v1ProductPricesGet();
};

export const getPurchasesByProduct = async (
  rootPlaceId: number,
  limit: number,
  fetchBackwardsFromCursor?: boolean,
  startTime?: Date,
  endTime?: Date,
  cursor?: string,
) => {
  const getPurchasesRequest: V1PurchaseListGetRequest = {
    rootPlaceId,
    limit,
    fetchBackwardsFromCursor,
    startTime,
    endTime,
    cursor,
  };

  return fiatPaidAccessServiceApi.v1PurchaseListGet(getPurchasesRequest);
};

export const getProductsBySeller = async (
  limit: number,
  groupId?: number,
  cursor?: string,
  fetchBackwardsFromCursor?: boolean,
) => {
  const getProductsRequest: V1ProductSellerGetRequest = {
    limit,
    groupId,
    cursor,
    fetchBackwardsFromCursor,
  };

  return fiatPaidAccessServiceApi.v1ProductSellerGet(getProductsRequest);
};
