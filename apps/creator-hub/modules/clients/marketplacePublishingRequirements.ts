import { Configuration } from '@rbx/clients';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import {
  MarketplaceType,
  AssetSubType,
  AssetType,
  MarketplacePublishingRequirementsApiApi,
  GetRequirementsResponse,
  RequirementCheck,
} from '@rbx/clients/marketplacePublishingRequirementsApi/v1';

import { getBEDEV2ServiceBasePath } from './utils';

class MarketplacePublishingRequirementsClient {
  private marketplacePublishingRequirementsApi: MarketplacePublishingRequirementsApiApi;

  constructor(basePath = getBEDEV2ServiceBasePath('marketplace-publishing-requirements-api')) {
    const configuration = new Configuration({
      robloxSiteDomain: process.env.robloxSiteDomain,
      basePath,
      credentials: 'include',
      unifiedLogger: unifiedLoggerClient,
    });

    this.marketplacePublishingRequirementsApi = new MarketplacePublishingRequirementsApiApi(
      configuration,
    );
  }

  async getRequirements(
    marketplaceType: MarketplaceType,
    assetType: AssetType,
    assetSubTypes?: Array<AssetSubType>,
    requirementChecks?: Array<RequirementCheck>,
    assetId?: number,
  ): Promise<GetRequirementsResponse> {
    const response =
      await this.marketplacePublishingRequirementsApi.marketplacePublishingRequirementsApiGetRequirements(
        {
          marketplaceType,
          assetType,
          assetSubTypes,
          requirementChecks,
          assetId,
        },
      );
    return response;
  }
}

const marketplacePublishingRequirementsClient = new MarketplacePublishingRequirementsClient();
export default marketplacePublishingRequirementsClient;
