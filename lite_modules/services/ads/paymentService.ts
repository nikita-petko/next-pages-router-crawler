import { DefaultApi } from '@rbx/client-ads-management-api/v1';

import adsClient from '@clients/ads';
import { GetAdCreditBalanceResponseType } from '@type/payment';
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

export const retryPaymentCharges = async () => {
  const response = await adsClient.post({
    body: {},
    url: '/v1/payment/retryPaymentCharges',
  });
  return response.data;
};
