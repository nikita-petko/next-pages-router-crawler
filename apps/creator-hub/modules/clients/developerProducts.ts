import type {
  DeveloperProductsApiListDeveloperProductsCursoredRequest,
  ListDeveloperProductsResponse,
  ErrorResponse,
  DeveloperProductsApiListDeveloperProductsByUniverseIdForCreatorCursoredRequest,
  ListDeveloperProductsWithCreatorDetailsResponse,
  DeveloperProductsApiBulkUpdateDeveloperProductsRequest,
  DeveloperProductsApiBulkUpdateDeveloperProductsOperationRequest,
  DeveloperProductsApiSetGiftingTradingStatusOperationRequest,
  DeveloperProductsGetDeveloperProductConfigV2Request,
  DeveloperProductsCreateDeveloperProductV2Request,
  DeveloperProductConfigV2,
  DeveloperProductsUpdateDeveloperProductV2Request,
  DeveloperProductsBatchGetDeveloperProductConfigsOperationRequest,
  DeveloperProductsListDeveloperProductConfigsByUniverseV2Request,
  ListDeveloperProductConfigsV2Response,
  BatchGetDeveloperProductConfigsResponse,
} from '@rbx/client-developer-products-api/v1';
import {
  DeveloperProductsApiApi,
  ErrorCode,
  DeveloperProductsApi,
} from '@rbx/client-developer-products-api/v1';
import { createClientConfiguration } from './utils/createClientConfiguration';

export type {
  ErrorResponse,
  DeveloperProductConfigV2,
  ListDeveloperProductConfigsV2Response,
  BatchGetDeveloperProductConfigsResponse,
};

export { ErrorCode as DeveloperProductsErrorCodes };

export class DeveloperProductsApiClient {
  private developerProductsApi;

  private developerProductsV2Api;

  constructor() {
    const configuration = createClientConfiguration('developer-products', 'bedev2');
    this.developerProductsApi = new DeveloperProductsApiApi(configuration);
    this.developerProductsV2Api = new DeveloperProductsApi(configuration);
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

  batchUpdateDeveloperProducts(
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
