import type {
  GetUniverseProductConfigurationResponse,
  ListUniverseProductConfigurationsResponse,
  CheckCreationAccessResponse,
  MarketplaceSalesUpdateUniverseProductConfigurationOperationRequest,
} from '@rbx/client-marketplace-sales-api/v1';
import { MarketplaceSalesApi } from '@rbx/client-marketplace-sales-api/v1';
import { createClientConfiguration } from './utils/createClientConfiguration';

export type { CheckCreationAccessResponse };

const configuration = createClientConfiguration('marketplace-sales', 'bedev2');

const marketplaceSalesApi = new MarketplaceSalesApi(configuration);

const marketplaceSalesClient = {
  getUniverseProductConfiguration: async (
    universeId: number,
    targetId: number,
    targetType = 'Asset',
  ): Promise<GetUniverseProductConfigurationResponse> => {
    return marketplaceSalesApi.marketplaceSalesGetUniverseProductConfiguration({
      universeId,
      targetId,
      targetType,
    });
  },
  listUniverseProductConfigurations: async (
    universeId: number,
    status: string,
    count?: number,
    cursor?: string,
  ): Promise<ListUniverseProductConfigurationsResponse> => {
    return marketplaceSalesApi.marketplaceSalesListUniverseProductConfigurations({
      universeId,
      status,
      limit: count ?? 0,
      cursor,
    });
  },
  checkCreationAccess: async (): Promise<CheckCreationAccessResponse> => {
    return marketplaceSalesApi.marketplaceSalesCheckCreationAccess();
  },
  updateUniverseProductConfiguration: async (
    universeId: number,
    targetId: number,
    status: string,
    collectibleItemId: string,
    collectibleProductId: string,
    targetType = 'Asset',
  ): Promise<void> => {
    const request: MarketplaceSalesUpdateUniverseProductConfigurationOperationRequest = {
      marketplaceSalesUpdateUniverseProductConfigurationRequest: {
        _configuration: {
          universeId,
          targetType,
          targetId,
          status,
          collectibleItemId,
          collectibleProductId,
        },
      },
    };
    await marketplaceSalesApi.marketplaceSalesUpdateUniverseProductConfiguration(request);
  },
};

export default marketplaceSalesClient;
