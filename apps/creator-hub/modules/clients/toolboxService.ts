import Asset from '@modules/miscellaneous/common/enums/Asset';
import { Configuration } from '@rbx/clients';
import {
  CategoryType,
  FrontendFlagsApi,
  type FrontendFlagsGetValuesRequest,
  ToolboxApi,
  type ToolboxGetMarketplaceAssetsRequest,
  type ToolboxItemDetails,
} from '@rbx/clients/toolboxService';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import { getBEDEV2ServiceBasePath } from './utils';

export { CategoryType } from '@rbx/clients/toolboxService';
export type { ToolboxItemDetails } from '@rbx/clients/toolboxService';

export const toolboxServiceItemDetailsLimit = 30;

const assetTypeToCategoryType: { [key: string]: CategoryType } = {
  [Asset.Model]: CategoryType.Model,
  [Asset.Plugin]: CategoryType.Plugin,
};
export const assetTypeIdToAssetType: { [key: number]: Asset } = {
  3: Asset.Audio,
  10: Asset.Model,
  13: Asset.Decal,
  38: Asset.Plugin,
  40: Asset.MeshPart,
  62: Asset.Video,
};

class ToolboxClient {
  private frontendFlagsApi: FrontendFlagsApi;

  private toolboxApi: ToolboxApi;

  constructor(basePath = getBEDEV2ServiceBasePath('toolbox-service')) {
    const configuration = new Configuration({
      robloxSiteDomain: process.env.robloxSiteDomain,
      basePath,
      credentials: 'include',
      unifiedLogger: unifiedLoggerClient,
    });

    this.frontendFlagsApi = new FrontendFlagsApi(configuration);
    this.toolboxApi = new ToolboxApi(configuration);
  }

  async getUserSettingsFeatureKey(flagName: string): Promise<boolean> {
    const response = await this.frontendFlagsApi.frontendFlagsGetUserSetting({
      featureKey: flagName,
    });
    return Boolean(response?.value);
  }

  async setUserSettingsFeatureKey(flagName: string, enabled: boolean): Promise<void> {
    await this.frontendFlagsApi.frontendFlagsSetUserSetting({
      featureKey: flagName,
      frontendFlagsSetUserSettingRequest: {
        value: String(enabled),
      },
    });
  }

  async getItemDetails(ids: Array<number>): Promise<{ items: Array<ToolboxItemDetails> }> {
    const response = await this.toolboxApi.toolboxGetItemsDetails({
      assetIds: ids.join(','),
    });
    return {
      items: response.data || [],
    };
  }

  async getCreatorInsightTable(category: CategoryType) {
    return this.toolboxApi.toolboxGetCreatorInsights({ assetType: category });
  }

  async getCreations(
    userId: number,
    assetType: string,
    groupId?: number,
    limit?: number,
    cursor?: string,
    separateModelsAndPackages?: boolean,
    includeSharedAssets?: boolean,
  ) {
    if (groupId) {
      return this.toolboxApi.toolboxGetCreationAssets({
        ownerId: groupId,
        assetType: assetTypeToCategoryType[assetType],
        limit,
        cursor,
        separateModelsAndPackages,
        includeSharedAssets,
      });
    }
    return this.toolboxApi.toolboxGetUserCreationAssets({
      userId,
      assetType: assetTypeToCategoryType[assetType],
      limit,
      cursor,
    });
  }

  async getMarketplaceAssets(request: ToolboxGetMarketplaceAssetsRequest) {
    return this.toolboxApi.toolboxGetMarketplaceAssets(request);
  }

  getFrontendFlagsValues(request: FrontendFlagsGetValuesRequest) {
    return this.frontendFlagsApi.frontendFlagsGetValues(request);
  }
}

const toolboxClient = new ToolboxClient();
export default toolboxClient;
