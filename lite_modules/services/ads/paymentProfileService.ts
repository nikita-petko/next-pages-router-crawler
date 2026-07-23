import { PaymentMethod } from '@stripe/stripe-js';

import adsClient from '@clients/ads';
import { CreatePaymentProfileSetupResponse, GetPaymentProfilesResponseType } from '@type/payment';

export interface VerifyPaymentProfileCreationResponse {
  is_removed: boolean | null | undefined;
  payment_profile_id: string | null;
}

export const createPaymentProfileSetup = async (body: Record<string, unknown>) => {
  const response = await adsClient.post<CreatePaymentProfileSetupResponse>({
    body,
    url: '/v1/payment/paymentProfile',
  });
  return response.data;
};

export const verifyPaymentProfileCreation = async (
  paymentProviderId: number,
  providerPaymentProfileId: string | null | PaymentMethod,
) => {
  const response = await adsClient.post<VerifyPaymentProfileCreationResponse>({
    body: {
      payment_provider: paymentProviderId,
      provider_payment_profile_id: providerPaymentProfileId,
    },
    url: '/v1/payment/verifyPaymentProfileCreation',
  });
  return response.data;
};

export const getPaymentProfiles = async (isAuthorizeOnly: boolean) => {
  const response = await adsClient.get<GetPaymentProfilesResponseType>({
    url: `/v1/payment/paymentProfiles?is_authorize_only=${isAuthorizeOnly}`,
  });
  return response.data;
};
