import type {
  MarketplaceType,
  AssetSubType,
  AssetType,
  GetRequirementsResponse,
  RequirementCheck,
} from '@rbx/client-marketplace-publishing-requirements-api/v1';
import { MarketplacePublishingRequirementsApiApi } from '@rbx/client-marketplace-publishing-requirements-api/v1';
import { createClientConfiguration } from './utils/createClientConfiguration';

class MarketplacePublishingRequirementsClient {
  private marketplacePublishingRequirementsApi: MarketplacePublishingRequirementsApiApi;

  constructor() {
    const configuration = createClientConfiguration(
      'marketplace-publishing-requirements-api',
      'bedev2',
    );

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
