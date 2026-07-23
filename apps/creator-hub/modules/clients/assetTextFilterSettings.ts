import { Configuration } from '@rbx/clients';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import {
  AssetTextFilterSettingsGetPublicUniverseSettingsRequest,
  AssetTextFilterSettingsPutPublicUniverseSettingsRequest,
  DefaultApi as AtfsApi,
  InternalControllerPutUniverseSettingsRequest,
  InternalControllerPutUniverseSettingsResponse,
} from '@rbx/clients/assetTextFilterSettings/v1';

import { getBEDEV2ServiceBasePath } from './utils';

export class AtfsApiClient {
  private atfsApi: AtfsApi;

  constructor(basePathAtfs: string = getBEDEV2ServiceBasePath('asset-text-filter-settings')) {
    const defaultConfiguration = new Configuration({
      robloxSiteDomain: process.env.robloxSiteDomain,
      basePath: basePathAtfs,
      credentials: 'include',
      unifiedLogger: unifiedLoggerClient,
    });
    this.atfsApi = new AtfsApi(defaultConfiguration);
  }

  getUniverseSettings(universeId: string): Promise<{
    [key: string]: boolean;
  }> {
    const request: AssetTextFilterSettingsGetPublicUniverseSettingsRequest = {
      universeid: universeId,
    };
    return this.atfsApi.assetTextFilterSettingsGetPublicUniverseSettings(request);
  }

  putUniverseSettings(
    universeId: string,
    category: 'Profanity',
    optedOut: boolean,
  ): Promise<InternalControllerPutUniverseSettingsResponse> {
    const settingOptions: InternalControllerPutUniverseSettingsRequest = {
      category,
      optedOut,
    };

    const request: AssetTextFilterSettingsPutPublicUniverseSettingsRequest = {
      universeid: universeId,
      settings: settingOptions,
    };

    return this.atfsApi.assetTextFilterSettingsPutPublicUniverseSettings(request);
  }
}

const atfsApiClient = new AtfsApiClient();

export default atfsApiClient;
