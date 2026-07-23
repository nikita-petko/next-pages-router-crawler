import { PaymentMethod } from '@stripe/stripe-js';

import adsClient from '@clients/ads';

interface VerifyPaymentProfileChallengeResponse {
  remaining_attempt: number;
  success: boolean;
}

export const startPaymentProfileChallenge = async (
  paymentProfileId: string | null | PaymentMethod,
) => {
  const response = await adsClient.post({
    body: {
      payment_profile_id: paymentProfileId,
    },
    url: '/v1/payment/startPaymentProfileChallenge',
  });
  return response.data;
};

export const verifyPaymentProfileChallenge = async (
  paymentProfileId: string | null | PaymentMethod,
  pinCode: string,
) => {
  const response = await adsClient.post<VerifyPaymentProfileChallengeResponse>({
    body: {
      payment_profile_id: paymentProfileId,
      pin_code: pinCode,
    },
    url: '/v1/payment/verifyPaymentProfileChallenge',
  });
  return response.data;
};
