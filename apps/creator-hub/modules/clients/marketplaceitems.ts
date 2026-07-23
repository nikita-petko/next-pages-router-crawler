import { Configuration } from '@rbx/clients';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import {
  MarketplaceItemsApi,
  CollectibleItemDetail,
  MarketplaceItemsGetCollectibleItemsDetailsOperationRequest,
} from '@rbx/clients/marketplaceItemsApi'; // this path will likely be different
import { getBEDEV2ServiceBasePath } from './utils';

const basePath = getBEDEV2ServiceBasePath('marketplace-items');

const configuration = new Configuration({
  robloxSiteDomain: process.env.robloxSiteDomain,
  basePath,
  credentials: 'include',
  unifiedLogger: unifiedLoggerClient,
});

const marketplaceItemsApi = new MarketplaceItemsApi(configuration);

const marketplaceItemsClient = {
  getCollectibleItemsDetails: async (
    itemIds: Array<string>,
  ): Promise<Array<CollectibleItemDetail>> => {
    const request: MarketplaceItemsGetCollectibleItemsDetailsOperationRequest = {
      marketplaceItemsGetCollectibleItemsDetailsRequest: {
        itemIds,
      },
    };
    return marketplaceItemsApi.marketplaceItemsGetCollectibleItemsDetails(request);
  },
};

export default marketplaceItemsClient;
