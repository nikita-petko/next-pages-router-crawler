import type {
  CollectibleItemDetail,
  MarketplaceItemsGetCollectibleItemsDetailsOperationRequest,
} from '@rbx/client-marketplace-items-api/v1';
import { MarketplaceItemsApi } from '@rbx/client-marketplace-items-api/v1';
import { createClientConfiguration } from './utils/createClientConfiguration';

export type { CollectibleItemDetail };

const configuration = createClientConfiguration('marketplace-items', 'bedev2');

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
