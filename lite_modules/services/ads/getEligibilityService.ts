import adsClient from '@clients/ads';
import { GetEligibilityResponse } from '@type/eligibility';

export const getEligibility = async (universeId: number): Promise<GetEligibilityResponse> => {
  const response = await adsClient.get<GetEligibilityResponse>({
    url: `/v1/eligibility?universe_id=${universeId}`,
  });
  return response.data;
};
