import { DefaultApi } from '@rbx/client-ads-management-api/v1';

import adsClient from '@clients/ads';
import {
  AdCreditPurchaseQuoteRequest,
  AdCreditPurchaseQuoteResponse,
  ConvertRobuxToAdCreditRequest,
  ConvertRobuxToAdCreditResponse,
  GetAdCreditBalanceResponseType,
} from '@type/payment';
import { createAdsManagementApiConfiguration } from '@utils/adsManagementApiDevOverride';

const configuration = createAdsManagementApiConfiguration();

export const getAdCreditBalance = async (groupId?: number) => {
  const url = groupId ? `/v1/adCreditBalance?groupId=${groupId}` : '/v1/adCreditBalance';
  const response = await adsClient.get<GetAdCreditBalanceResponseType>({
    url,
  });
  return response.data;
};

// This client has a 2SV built in to stop users from purchasing ad credits without an email verification code if they haven't verified in the last 30m
export const purchaseAdCreditClient = new DefaultApi(configuration);

export const purchaseAdCredit = async (ad_credit_quantity_micros: number, groupId?: number) => {
  const purchaseAdCreditRequest = {
    ...(groupId ? { groupId } : {}),
    shouldReturnMetadata: {
      adCreditQuantityMicros: ad_credit_quantity_micros,
    },
  };

  return purchaseAdCreditClient.purchaseAdCredit(purchaseAdCreditRequest);
};

export const getAdCreditQuotePreview = async (
  request: AdCreditPurchaseQuoteRequest,
): Promise<AdCreditPurchaseQuoteResponse> => {
  const params = new URLSearchParams({ source_field: request.source_field });
  if (request.robux_amount !== undefined) {
    params.set('robux_amount', String(request.robux_amount));
  }
  if (request.ad_credit_amount !== undefined) {
    params.set('ad_credit_amount', String(request.ad_credit_amount));
  }
  if (request.groupId !== undefined) {
    params.set('groupId', String(request.groupId));
  }
  const response = await adsClient.get<AdCreditPurchaseQuoteResponse>({
    url: `/v1/adCreditQuotePreview?${params.toString()}`,
  });
  return response.data;
};

export const convertRobuxToAdCredit = async (
  request: ConvertRobuxToAdCreditRequest,
): Promise<ConvertRobuxToAdCreditResponse> => {
  const response = await adsClient.post<ConvertRobuxToAdCreditResponse>({
    body: {
      ad_credit_quantity_micros: request.ad_credit_quantity_micros,
      robux_amount: request.robux_amount,
      ...(request.groupId !== undefined ? { groupId: request.groupId } : {}),
    },
    url: '/v1/convertRobuxToAdCredit',
  });
  return response.data;
};

export const retryPaymentCharges = async () => {
  const response = await adsClient.post({
    body: {},
    url: '/v1/payment/retryPaymentCharges',
  });
  return response.data;
};
