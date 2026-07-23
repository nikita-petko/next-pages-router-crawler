import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import { Configuration } from '@rbx/clients';
import {
  GetPlaceSafetyStatusByIdResponse,
  PlaceSafetyStatusApi,
} from '@rbx/clients/contentSafetyProxy/v1';
import { getBEDEV2ServiceBasePath } from './utils';

export class PlaceSafetyStatusApiClient {
  private placeSafetyStatusApi;

  constructor(basePathAuth: string = getBEDEV2ServiceBasePath('content-safety')) {
    const apiConfiguration = new Configuration({
      robloxSiteDomain: process.env.robloxSiteDomain,
      basePath: basePathAuth,
      credentials: 'include',
      unifiedLogger: unifiedLoggerClient,
    });
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
