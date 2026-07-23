import {
  DefaultApi,
  type GetRestrictionResponse,
} from '@rbx/client-creator-transparency-service/v1';
import { createClientConfiguration } from './utils/createClientConfiguration';

export type { GetRestrictionResponse };

class CreatorTransparencyClient {
  private api: DefaultApi;

  constructor() {
    const configuration = createClientConfiguration('creator-transparency-service', 'bedev2');

    this.api = new DefaultApi(configuration);
  }

  async getRestriction(
    contentId: string,
    contentType: string,
    initOverrides?: RequestInit,
  ): Promise<GetRestrictionResponse> {
    return this.api.creatorTransparencyServiceGetRestriction(
      { contentId, contentType },
      initOverrides,
    );
  }
}

const creatorTransparencyClient = new CreatorTransparencyClient();
export default creatorTransparencyClient;
