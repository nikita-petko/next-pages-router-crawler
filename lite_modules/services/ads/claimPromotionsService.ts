import adsClient from '@clients/ads';

export const claimPromotions = async (promotion_id: number) => {
  // Response from AMA for claim promotion is empty
  const response = await adsClient.post<Record<string, never>>({
    body: { promotion_id },
    url: '/v1/promotions/claim',
  });

  return response.data;
};
