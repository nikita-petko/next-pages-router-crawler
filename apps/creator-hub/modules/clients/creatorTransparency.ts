import { Configuration } from '@rbx/clients';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import {
  DefaultApi,
  type GetRestrictionResponse,
} from '@rbx/clients/creatorTransparencyService/v1';
import { getBEDEV2ServiceBasePath } from './utils';

export type { GetRestrictionResponse };

class CreatorTransparencyClient {
  private api: DefaultApi;

  constructor(basePath: string = getBEDEV2ServiceBasePath('creator-transparency-service')) {
    const configuration = new Configuration({
      robloxSiteDomain: process.env.robloxSiteDomain,
      basePath,
      credentials: 'include',
      unifiedLogger: unifiedLoggerClient,
    });

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
