import type {
  BatchUpdateShopItemsRequest,
  CreateShopConfigByScopeResponse,
  EntryPoint,
  ListShopItemsResponse,
  ListShopsByScopeResponse,
  Scope,
  ScopeType,
  ShopViewType,
} from '@rbx/client-shops-api/v1';
import { ShopsCreatorApi } from '@rbx/client-shops-api/v1';
import { createClientConfiguration } from './utils/createClientConfiguration';

export type {
  BatchUpdateShopItemsRequest,
  CreateShopConfigByScopeResponse,
  EntryPoint as ShopsEntryPoint,
  ListShopItemsResponse,
  ListShopsByScopeResponse,
  Scope as ShopsScope,
};
export type { ScopeType as ShopsScopeType };

export class ShopsApiClient {
  private shopsCreatorApi: ShopsCreatorApi;

  constructor() {
    this.shopsCreatorApi = new ShopsCreatorApi(createClientConfiguration('shops-api', 'bedev2'));
  }

  async listShopsByScope(
    scopeType: ScopeType,
    scopeId: string | number,
    initOverrides?: RequestInit,
  ) {
    return this.shopsCreatorApi.v1ShopsGet(
      { scopeType, scopeScopeId: String(scopeId) },
      initOverrides,
    );
  }

  async listShopItems(
    shopId: number,
    params: { pageToken?: string; pageSize?: number },
    initOverrides?: RequestInit,
  ) {
    return this.shopsCreatorApi.v1ShopsShopIdItemsCreatorGet({ shopId, ...params }, initOverrides);
  }

  async batchUpdateShopItems(
    shopId: number,
    requestParameters: BatchUpdateShopItemsRequest,
    initOverrides?: RequestInit,
  ) {
    return this.shopsCreatorApi.v1ShopsShopIdItemsPatch(
      { shopId, batchUpdateShopItemsRequest: requestParameters },
      initOverrides,
    );
  }

  async createShopConfigByScope(
    scope: Scope,
    entryPoints?: EntryPoint[],
    initOverrides?: RequestInit,
  ) {
    return this.shopsCreatorApi.v1ShopsPost(
      { createShopConfigByScopeRequest: { scope, entryPoints } },
      initOverrides,
    );
  }

  async getCreatorShopConfig(
    shopId: number,
    shopView: ShopViewType = 'Full',
    initOverrides?: RequestInit,
  ) {
    return this.shopsCreatorApi.v1ShopsShopIdCreatorGet({ shopId, shopView }, initOverrides);
  }
}

const shopsApiClient = new ShopsApiClient();
export default shopsApiClient;
