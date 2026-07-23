import adsClient from '@clients/ads';
import { GetPromotionsResponseType } from '@type/promotion';

export const getPromotions = async () => {
  const response = await adsClient.get<GetPromotionsResponseType>({
    url: '/v1/promotions',
  });
  return response.data;
};
