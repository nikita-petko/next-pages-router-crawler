import type { GetPlaceSafetyStatusByIdResponse } from '@rbx/client-content-safety-proxy/v1';
import { PlaceSafetyStatusApi } from '@rbx/client-content-safety-proxy/v1';
import { createClientConfiguration } from './utils/createClientConfiguration';

export class PlaceSafetyStatusApiClient {
  private placeSafetyStatusApi;

  constructor() {
    const apiConfiguration = createClientConfiguration('content-safety', 'bedev2');
    this.placeSafetyStatusApi = new PlaceSafetyStatusApi(apiConfiguration);
  }

  getPlaceSafetyStatusById(assetId: number): Promise<GetPlaceSafetyStatusByIdResponse> {
    return this.placeSafetyStatusApi.v1PlacesAssetIdSafetyStatusGet({
      assetId,
    });
  }
}

const placeSafetyStatusApi = new PlaceSafetyStatusApiClient();
export default placeSafetyStatusApi;
