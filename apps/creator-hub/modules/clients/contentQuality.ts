import { Configuration } from '@rbx/clients';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import {
  ContentQualityV1Api,
  ContentQualityV1GetThumbnailSignalsRequest,
  ThumbnailSignalsResponse,
} from '@rbx/clients/contentQualityApi/v1';
import { getBEDEV2ServiceBasePath } from './utils';

class ContentQualityClient {
  private contentQualityV1Api: ContentQualityV1Api;

  constructor(basePath: string = getBEDEV2ServiceBasePath('content-quality-api')) {
    const configuration = new Configuration({
      robloxSiteDomain: process.env.robloxSiteDomain,
      basePath,
      credentials: 'include',
      unifiedLogger: unifiedLoggerClient,
    });

    this.contentQualityV1Api = new ContentQualityV1Api(configuration);
  }

  async getThumbnailSignals(
    universeId: number,
    assetIds: number[],
  ): Promise<ThumbnailSignalsResponse> {
    const assetIdsParam = assetIds.join(',');

    const request: ContentQualityV1GetThumbnailSignalsRequest = {
      universeId,
      assetIds: assetIdsParam,
    };
    return this.contentQualityV1Api.contentQualityV1GetThumbnailSignals(request);
  }
}

const contentQualityClient = new ContentQualityClient();
export default contentQualityClient;
