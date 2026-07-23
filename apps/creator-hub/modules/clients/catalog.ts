import { Configuration } from '@rbx/clients';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import {
  CatalogApi,
  V1CatalogItemsDetailsPostRequest,
  RobloxWebWebAPIModelsApiArrayResponseRobloxCatalogApiCatalogSearchDetailedResponseItemV2,
  RobloxCatalogApiCatalogSearchDetailedResponseItem,
  RobloxCatalogApiMultigetItemDetailsRequestModel,
  RobloxCatalogApiMultigetItemDetailsRequestItemItemTypeEnum,
  RobloxCatalogApiCatalogSearchDetailedResponseItemCreatorTypeEnum,
  RobloxCatalogApiMultigetItemDetailsRequestItem,
  SearchApi,
  V1SearchItemsDetailsGetRequest,
  RobloxCatalogApiCatalogSearchPageResponseRobloxCatalogApiCatalogSearchDetailedResponseItem,
} from '@rbx/clients/catalogApi';
import { getBEDEV1ServiceBasePath } from './utils';

type CatalogAssetDetailsResponseArray =
  RobloxWebWebAPIModelsApiArrayResponseRobloxCatalogApiCatalogSearchDetailedResponseItemV2;

export type CatalogAssetDetailsResponse = RobloxCatalogApiCatalogSearchDetailedResponseItem;
export type CreatorType = RobloxCatalogApiCatalogSearchDetailedResponseItemCreatorTypeEnum;

export class CatalogClient {
  private catalogAPI: CatalogApi;

  private searchAPI: SearchApi;

  constructor(basePathCatalog: string = getBEDEV1ServiceBasePath('catalog')) {
    const defaultConfiguration = new Configuration({
      robloxSiteDomain: process.env.robloxSiteDomain,
      basePath: basePathCatalog,
      credentials: 'include',
      unifiedLogger: unifiedLoggerClient,
    });
    this.catalogAPI = new CatalogApi(defaultConfiguration);
    this.searchAPI = new SearchApi(defaultConfiguration);
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
