import {
  type GetPerformanceEstimateRequest,
  type GetPerformanceEstimateResponse,
  PerformanceEstimateApi,
} from '@rbx/client-ads-management-api/v1';

import { createAdsManagementApiConfiguration } from '@utils/adsManagementApiDevOverride';

const configuration = createAdsManagementApiConfiguration();

const performanceEstimateApi = new PerformanceEstimateApi(configuration);

export const postPerformanceEstimate = async (
  body: GetPerformanceEstimateRequest,
): Promise<GetPerformanceEstimateResponse> => {
  const response = await performanceEstimateApi.getPerformanceEstimate({ request: body });
  return response;
};
