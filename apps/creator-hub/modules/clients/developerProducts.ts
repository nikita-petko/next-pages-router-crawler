import { Configuration } from '@rbx/clients';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import {
  DeveloperProductsApiApi,
  DeveloperProductsApiListDeveloperProductsCursoredRequest,
  ListDeveloperProductsResponse,
  DeveloperProductDetailsResponse,
  ErrorResponse,
  DeveloperProductsApiListDeveloperProductsByUniverseIdForCreatorCursoredRequest,
  ListDeveloperProductsWithCreatorDetailsResponse,
  DeveloperProductsApiGetProductFromDeveloperProductTargetIdRequest,
  ErrorCode,
  ProductResultV2,
  DeveloperProductsApiBulkUpdateDeveloperProductsRequest,
  DeveloperProductsApiBulkUpdateDeveloperProductsOperationRequest,
  DeveloperProductsApiSetGiftingTradingStatusOperationRequest,
  DeveloperProductsApi,
  DeveloperProductsGetDeveloperProductConfigV2Request,
  DeveloperProductsCreateDeveloperProductV2Request,
  DeveloperProductConfigV2,
  DeveloperProductsUpdateDeveloperProductV2Request,
  DeveloperProductsBatchGetDeveloperProductConfigsOperationRequest,
  DeveloperProductsListDeveloperProductConfigsByUniverseV2Request,
  ListDeveloperProductConfigsV2Response,
  BatchGetDeveloperProductConfigsResponse,
} from '@rbx/clients/developerProductsApi';
import { getBEDEV2ServiceBasePath } from './utils';

export type {
  DeveloperProductDetailsResponse,
  ErrorResponse,
  DeveloperProductConfigV2,
  ListDeveloperProductConfigsV2Response,
  BatchGetDeveloperProductConfigsResponse,
};

export { ErrorCode as DeveloperProductsErrorCodes };

export class DeveloperProductsApiClient {
  private developerProductsApi;

  private developerProductsV2Api;

  constructor(basePathAuth: string = getBEDEV2ServiceBasePath('developer-products')) {
    const apiConfiguration = new Configuration({
      robloxSiteDomain: process.env.robloxSiteDomain,
      basePath: basePathAuth,
      credentials: 'include',
      unifiedLogger: unifiedLoggerClient,
    });
    this.developerProductsApi = new DeveloperProductsApiApi(apiConfiguration);
    this.developerProductsV2Api = new DeveloperProductsApi(apiConfiguration);
  }

  listDeveloperProducts(
    request: DeveloperProductsApiListDeveloperProductsCursoredRequest,
    options: RequestInit = {},
  ): Promise<ListDeveloperProductsResponse> {
    return this.developerProductsApi.developerProductsApiListDeveloperProductsCursored(
      request,
      options,
    );
  }

  createDeveloperProduct(
    request: DeveloperProductsCreateDeveloperProductV2Request,
    options: RequestInit = {},
  ) {
    return this.developerProductsV2Api.developerProductsCreateDeveloperProductV2(request, options);
  }

  updateDeveloperProduct(
    request: DeveloperProductsUpdateDeveloperProductV2Request,
    options: RequestInit = {},
  ) {
    return this.developerProductsV2Api.developerProductsUpdateDeveloperProductV2(request, options);
  }

  /**
   * TODO(jeminpark, 20260302): Deprecating this endpoint in favor of using listDeveloperProductConfigsByUniverse.
   * This should be removed after deprecating the price optimization page.
   */
  listDeveloperProductsWithCreatorDetails(
    request: DeveloperProductsApiListDeveloperProductsByUniverseIdForCreatorCursoredRequest,
    options: RequestInit = {},
  ): Promise<ListDeveloperProductsWithCreatorDetailsResponse> {
    return this.developerProductsApi.developerProductsApiListDeveloperProductsByUniverseIdForCreatorCursored(
      request,
      options,
    );
  }

  /**
   * TODO(jeminpark, 20250506): Deprecating this endpoint in favor of using product id.
   * ProductResultV2 is a legacy response model from virtual-economy-products-service that
   * we no longer use. Note the `id` returned in the response is the `productId` of the
   * corresponding dev product - it is not the same as the `developerProductId` in the request.
   *
   * See https://roblox.atlassian.net/browse/VEO-413
   */
  getDeveloperProductFromTargetId(
    request: DeveloperProductsApiGetProductFromDeveloperProductTargetIdRequest,
    options: RequestInit = {},
  ): Promise<ProductResultV2> {
    return this.developerProductsApi.developerProductsApiGetProductFromDeveloperProductTargetId(
      request,
      options,
    );
  }

  updateDeveloperProducts(
    request: { universeId: number; body: DeveloperProductsApiBulkUpdateDeveloperProductsRequest },
    options: RequestInit = {},
  ) {
    return this.developerProductsApi.developerProductsApiBulkUpdateDeveloperProducts(
      {
        universeId: request.universeId,
        developerProductsApiBulkUpdateDeveloperProductsRequest: request.body,
      } satisfies DeveloperProductsApiBulkUpdateDeveloperProductsOperationRequest,
      options,
    );
  }

  getGiftingTradingStatus(universeId: number, options: RequestInit = {}) {
    return this.developerProductsApi.developerProductsApiGetGiftingTradingStatus(
      { universeId },
      options,
    );
  }

  setGiftingTradingStatus(
    request: { universeId: number; hasGiftingTrading: boolean },
    options: RequestInit = {},
  ) {
    return this.developerProductsApi.developerProductsApiSetGiftingTradingStatus(
      {
        universeId: request.universeId,
        developerProductsApiSetGiftingTradingStatusRequest: {
          hasGiftingTrading: request.hasGiftingTrading,
        },
      } satisfies DeveloperProductsApiSetGiftingTradingStatusOperationRequest,
      options,
    );
  }

  getDeveloperProductConfig(
    request: DeveloperProductsGetDeveloperProductConfigV2Request,
    options: RequestInit = {},
  ) {
    return this.developerProductsV2Api.developerProductsGetDeveloperProductConfigV2(
      request,
      options,
    );
  }

  batchGetDeveloperProductConfigs(
    request: { universeId: number; productIds: number[] },
    options: RequestInit = {},
  ) {
    return this.developerProductsV2Api.developerProductsBatchGetDeveloperProductConfigs(
      {
        universeId: request.universeId,
        developerProductsBatchGetDeveloperProductConfigsRequest: {
          productIds: request.productIds,
        },
      } satisfies DeveloperProductsBatchGetDeveloperProductConfigsOperationRequest,
      options,
    );
  }

  listDeveloperProductConfigsByUniverse(
    request: DeveloperProductsListDeveloperProductConfigsByUniverseV2Request,
    options: RequestInit = {},
  ) {
    return this.developerProductsV2Api.developerProductsListDeveloperProductConfigsByUniverseV2(
      request,
      options,
    );
  }
}

const developerProductsClient = new DeveloperProductsApiClient();
export default developerProductsClient;
