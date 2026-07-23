import { getBEDEV2ServiceBasePath } from '@modules/clients/utils';
import { Configuration } from '@rbx/clients';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import {
  CommerceApi,
  CommerceItemsApi,
  CreateCommerceGrantableRequest,
  CreateCommerceItemResponse,
  CreateCommerceProductResponse,
  FailureReason,
  GetVirtualBenefitResponse,
  GrantableType,
  ListCommerceItemsResponse,
  type CommerceGrantableModel,
  type GetCommerceEligibilityStatusResponse as CommerceEligibilityStatus,
  type InventoryType,
  type MerchantType,
  type OwnerType,
  type ProductStatusType,
} from '@rbx/clients/commerceApi/v1';

export { FailureReason as CommerceFailureReason };
export { BundlingEligibilityRecourse, TermsAcceptanceStatus } from '@rbx/clients/commerceApi/v1';
export type {
  BaselineEligibility,
  CommerceGrantableModel,
  CommerceItemModel,
  CommerceProductModel,
  GetCommerceEligibilityStatusResponse as CommerceEligibilityStatus,
  GetCommerceEligibilityStatusResponseBundlingEligibility as CommerceBundlingEligibility,
  MerchantType,
  Money,
  ProductStatusType,
} from '@rbx/clients/commerceApi/v1';

/**
 * API client for commerce. This wraps the underlying generated API clients to simplify usage and exclude unnecessary APIs.
 */
export class CommerceApiClient {
  private commerceApi: CommerceApi;

  private commerceItemsApi: CommerceItemsApi;

  constructor(basePathAuth: string = getBEDEV2ServiceBasePath('commerce')) {
    const configuration = new Configuration({
      robloxSiteDomain: process.env.robloxSiteDomain,
      basePath: basePathAuth,
      credentials: 'include',
      unifiedLogger: unifiedLoggerClient,
    });
    this.commerceApi = new CommerceApi(configuration);
    this.commerceItemsApi = new CommerceItemsApi(configuration);
  }

  async listCommerceItems(
    universeId: number,
    merchantType: MerchantType,
    ownerType: OwnerType,
    cursor: string | undefined,
    limit = 10,
  ): Promise<ListCommerceItemsResponse> {
    return this.commerceApi.commerceListCommerceItems({
      experienceId: universeId,
      merchantType,
      ownerType,
      cursor,
      limit,
    });
  }

  async listCommerceItemsV2(
    ownerType: OwnerType,
    ownerId: string,
    merchantType: MerchantType,
    cursor: string | undefined,
    limit = 10,
  ): Promise<ListCommerceItemsResponse> {
    return this.commerceItemsApi.commerceItemsListCommerceItemsV2({
      ownerType,
      ownerId,
      merchantType,
      cursor,
      limit,
    });
  }

  async createCommerceItem(
    universeId: number,
    merchantType: MerchantType,
    merchantItemId: string,
  ): Promise<CreateCommerceItemResponse> {
    return this.commerceApi.commerceCreateCommerceItem({
      experienceId: universeId,
      commerceCreateCommerceItemRequest: {
        merchantType,
        merchantItemId,
      },
    });
  }

  async archiveCommerceItem(universeId: number, commerceItemId: string) {
    return this.commerceApi.commerceArchiveCommerceItem({
      experienceId: universeId,
      commerceItemId,
    });
  }

  async listCommerceProducts(universeId: number, cursor: string | undefined, limit = 10) {
    return this.commerceApi.commerceListCommerceProducts({
      experienceId: universeId,
      cursor,
      limit,
    });
  }

  async createCommerceProduct(
    universeId: number,
    commerceItemId: string,
    commerceGrantables: Array<CreateCommerceGrantableRequest>,
    initialStatus?: ProductStatusType,
  ): Promise<CreateCommerceProductResponse> {
    return this.commerceApi.commerceCreateCommerceProduct({
      experienceId: universeId,
      commerceCreateCommerceProductRequest: {
        commerceItemId,
        commerceGrantables,
        initialStatus,
      },
    });
  }

  async getVirtualBenefit(
    universeId: number,
    assetId: string,
    grantableType: GrantableType,
  ): Promise<GetVirtualBenefitResponse> {
    return this.commerceApi.commerceGetVirtualBenefit({
      assetId,
      experienceId: universeId,
      benefitType: grantableType,
    });
  }

  async updateDraftCommerceProduct(
    universeId: number,
    commerceProductId: string,
    draftGrantables: Array<CommerceGrantableModel>,
  ) {
    return this.commerceApi.commerceUpdateCommerceProductDraft({
      experienceId: universeId,
      commerceProductId,
      commerceUpdateCommerceProductDraftRequest: {
        draftGrantables,
      },
    });
  }

  async uploadDraftCommerceProductImage(
    universeId: number,
    commerceProductId: string,
    imageFile: File,
  ) {
    return this.commerceApi.commerceUploadVirtualBenefitImage({
      experienceId: universeId,
      universeId,
      commerceProductId,
      imageFile: imageFile as Blob,
    });
  }

  async updateCommerceProductStatus(
    universeId: number,
    commerceProductId: string,
    newStatus: ProductStatusType,
  ) {
    return this.commerceApi.commerceUpdateCommerceProductStatus({
      experienceId: universeId,
      commerceProductId,
      commerceUpdateCommerceProductStatusRequest: { newStatus },
    });
  }

  async createCommerceProductBundlingFee(
    universeId: number,
    commerceProductId: string,
    quantity: number,
    inventoryType: InventoryType,
  ) {
    return this.commerceApi.commerceCreateCommerceProductBundlingFee({
      experienceId: universeId,
      commerceProductId,
      commerceCreateCommerceProductBundlingFeeRequest: {
        quantity,
        inventoryType,
      },
    });
  }

  async acceptCommerceProductBundlingFee(universeId: number, commerceProductId: string) {
    return this.commerceApi.commerceAcceptCommerceProductBundlingFee({
      experienceId: universeId,
      commerceProductId,
    });
  }

  async applyForCreatorBundlingEligibility(universeId: number) {
    return this.commerceApi.commerceApplyForCreatorBundlingEligibility({
      experienceId: universeId,
    });
  }

  async archiveCommerceProduct(universeId: number, commerceProductId: string) {
    return this.commerceApi.commerceArchiveCommerceProduct({
      experienceId: universeId,
      commerceProductId,
    });
  }

  async getCommerceExperienceConfiguration(universeId: number) {
    return this.commerceApi.commerceGetCommerceExperienceConfiguration({
      experienceId: universeId,
    });
  }

  async getCommerceEligibilityStatus(universeId: number): Promise<CommerceEligibilityStatus> {
    return this.commerceApi.commerceGetCommerceEligibilityStatus({
      experienceId: universeId,
    });
  }
}

const commerceApiClient = new CommerceApiClient();
export default commerceApiClient;
