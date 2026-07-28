import type { GetCreatorDevexEligibleRobuxResponse } from '@rbx/client-creator-devex-data-service/v1';
import { CreatorDevexApi } from '@rbx/client-creator-devex-data-service/v1';
import { createClientConfiguration } from './utils/createClientConfiguration';

const configuration = createClientConfiguration('creator-devex-data-service', 'bedev2');

const creatorDevexApi = new CreatorDevexApi(configuration);

const creatorDevexDataClient = {
  getDevexEligibleRobux: async (): Promise<GetCreatorDevexEligibleRobuxResponse> => {
    return creatorDevexApi.creatorDevexGetDevexEligibleRobux();
  },
};

export type DevexEligibleData = GetCreatorDevexEligibleRobuxResponse;

export default creatorDevexDataClient;
