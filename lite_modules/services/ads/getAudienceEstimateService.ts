import adsClient from '@clients/ads';
import {
  GetAudienceEstimateRequestType,
  GetAudienceEstimateResponseType,
} from '@type/advancedTargeting';

export const getAudienceEstimate = async (data: GetAudienceEstimateRequestType) => {
  const response = await adsClient.post<GetAudienceEstimateResponseType>({
    body: { ...data },
    url: '/v1/audience',
  });
  return response.data;
};
