import type {
  V1CatalogItemsDetailsPostRequest,
  RobloxWebWebAPIModelsApiArrayResponseRobloxCatalogApiCatalogSearchDetailedResponseItemV2,
  RobloxCatalogApiCatalogSearchDetailedResponseItem,
  RobloxCatalogApiMultigetItemDetailsRequestModel,
  RobloxCatalogApiCatalogSearchDetailedResponseItemCreatorTypeEnum,
  RobloxCatalogApiMultigetItemDetailsRequestItem,
  V1SearchItemsDetailsGetRequest,
  RobloxCatalogApiCatalogSearchPageResponseRobloxCatalogApiCatalogSearchDetailedResponseItem,
} from '@rbx/client-catalog/v1';
import {
  CatalogApi,
  RobloxCatalogApiMultigetItemDetailsRequestItemItemTypeEnum,
  SearchApi,
} from '@rbx/client-catalog/v1';
import { createClientConfiguration } from './utils/createClientConfiguration';

type CatalogAssetDetailsResponseArray =
  RobloxWebWebAPIModelsApiArrayResponseRobloxCatalogApiCatalogSearchDetailedResponseItemV2;

export type CatalogAssetDetailsResponse = RobloxCatalogApiCatalogSearchDetailedResponseItem;
export type CreatorType = RobloxCatalogApiCatalogSearchDetailedResponseItemCreatorTypeEnum;

export class CatalogClient {
  private catalogAPI: CatalogApi;

  private searchAPI: SearchApi;

  constructor() {
    const configuration = createClientConfiguration('catalog', 'bedev1');
    this.catalogAPI = new CatalogApi(configuration);
    this.searchAPI = new SearchApi(configuration);
  }

  getAssetDetails(assetId: number): Promise<CatalogAssetDetailsResponseArray> {
    const model: RobloxCatalogApiMultigetItemDetailsRequestModel = {
      items: [
        {
          itemType: RobloxCatalogApiMultigetItemDetailsRequestItemItemTypeEnum.NUMBER_1,
          id: assetId,
        },
      ],
    };
    const request: V1CatalogItemsDetailsPostRequest = {
      model,
    };
    return this.catalogAPI.v1CatalogItemsDetailsPost(request);
  }

  postAssetDetails(assetIds: number[]): Promise<CatalogAssetDetailsResponseArray> {
    const items = [] as RobloxCatalogApiMultigetItemDetailsRequestItem[];
    assetIds.forEach((item) => {
      items.push({
        id: item,
        itemType: RobloxCatalogApiMultigetItemDetailsRequestItemItemTypeEnum.NUMBER_1,
      } as RobloxCatalogApiMultigetItemDetailsRequestItem);
    });
    const model: RobloxCatalogApiMultigetItemDetailsRequestModel = {
      items,
    };
    const request: V1CatalogItemsDetailsPostRequest = {
      model,
    };
    return this.catalogAPI.v1CatalogItemsDetailsPost(request);
  }

  postBundleDetails(assetIds: number[]): Promise<CatalogAssetDetailsResponseArray> {
    const items = [] as RobloxCatalogApiMultigetItemDetailsRequestItem[];
    assetIds.forEach((item) => {
      items.push({
        id: item,
        itemType: RobloxCatalogApiMultigetItemDetailsRequestItemItemTypeEnum.NUMBER_2,
      } as RobloxCatalogApiMultigetItemDetailsRequestItem);
    });
    const model: RobloxCatalogApiMultigetItemDetailsRequestModel = {
      items,
    };
    const request: V1CatalogItemsDetailsPostRequest = {
      model,
    };
    return this.catalogAPI.v1CatalogItemsDetailsPost(request);
  }

  postItemDetails(
    catalogItems: RobloxCatalogApiMultigetItemDetailsRequestItem[],
  ): Promise<CatalogAssetDetailsResponseArray> {
    const items = [] as RobloxCatalogApiMultigetItemDetailsRequestItem[];
    catalogItems.forEach((item) => {
      items.push({
        id: item.id,
        itemType: item.itemType,
      } as RobloxCatalogApiMultigetItemDetailsRequestItem);
    });
    const model: RobloxCatalogApiMultigetItemDetailsRequestModel = {
      items,
    };
    const request: V1CatalogItemsDetailsPostRequest = {
      model,
    };
    return this.catalogAPI.v1CatalogItemsDetailsPost(request);
  }

  getItems(
    request: V1SearchItemsDetailsGetRequest,
  ): Promise<RobloxCatalogApiCatalogSearchPageResponseRobloxCatalogApiCatalogSearchDetailedResponseItem> {
    return this.searchAPI.v1SearchItemsDetailsGet(request);
  }
}

const catalogClient = new CatalogClient();

export default catalogClient;
