import type {
  ContentQualityV1GetThumbnailSignalsRequest,
  ThumbnailSignalsResponse,
  UniverseQualityStatusResponse,
} from '@rbx/client-content-quality-api/v1';
import {
  ContentQualityV1Api,
  UniverseQualityStatusUseCase,
} from '@rbx/client-content-quality-api/v1';
import { createClientConfiguration } from './utils/createClientConfiguration';

class ContentQualityClient {
  private contentQualityV1Api: ContentQualityV1Api;

  constructor() {
    const configuration = createClientConfiguration('content-quality-api', 'bedev2');

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

  async getUniverseQualityStatus(universeId: number): Promise<UniverseQualityStatusResponse> {
    return this.contentQualityV1Api.contentQualityV1GetUniverseQualityStatus({
      universeId,
      useCase: UniverseQualityStatusUseCase.NUMBER_1,
    });
  }
}

const contentQualityClient = new ContentQualityClient();
export default contentQualityClient;
