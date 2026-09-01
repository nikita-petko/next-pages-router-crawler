import type {
  AssetTextFilterSettingsGetPublicUniverseSettingsRequest,
  AssetTextFilterSettingsPutPublicUniverseSettingsRequest,
  InternalControllerPutUniverseSettingsRequest,
  InternalControllerPutUniverseSettingsResponse,
} from '@rbx/client-asset-text-filter-settings/v1';
import { DefaultApi as AtfsApi } from '@rbx/client-asset-text-filter-settings/v1';
import { createClientConfiguration } from './utils/createClientConfiguration';

export class AtfsApiClient {
  private atfsApi: AtfsApi;

  constructor() {
    const defaultConfiguration = createClientConfiguration('asset-text-filter-settings', 'bedev2');
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
