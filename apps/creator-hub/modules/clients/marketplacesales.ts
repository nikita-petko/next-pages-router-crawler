import { Configuration } from '@rbx/clients';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import {
  GetUniverseProductConfigurationResponse,
  ListUniverseProductConfigurationsResponse,
  CheckCreationAccessResponse,
  MarketplaceSalesApi,
  MarketplaceSalesUpdateUniverseProductConfigurationOperationRequest,
} from '@rbx/clients/marketplaceSalesApi';
import { getBEDEV2ServiceBasePath } from './utils';

export type { CheckCreationAccessResponse };

const basePath = getBEDEV2ServiceBasePath('marketplace-sales');

const configuration = new Configuration({
  robloxSiteDomain: process.env.robloxSiteDomain,
  basePath,
  credentials: 'include',
  unifiedLogger: unifiedLoggerClient,
});

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
