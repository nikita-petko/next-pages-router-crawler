import type {
  CreateCommerceGrantableRequest,
  CreateCommerceProductResponse,
  GetVirtualBenefitResponse,
  GrantableType,
  ListCommerceItemsResponse,
} from '@rbx/client-commerce-api/v1';
import {
  CommerceApi,
  CommerceItemsApi,
  FailureReason,
  type CommerceGrantableModel,
  type GetCommerceEligibilityStatusResponse as CommerceEligibilityStatus,
  type InventoryType,
  type MerchantType,
  type OwnerType,
  type ProductStatusType,
} from '@rbx/client-commerce-api/v1';
import { createClientConfiguration } from './utils/createClientConfiguration';

export { FailureReason as CommerceFailureReason };
export { BundlingEligibilityRecourse, TermsAcceptanceStatus } from '@rbx/client-commerce-api/v1';
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
} from '@rbx/client-commerce-api/v1';

/**
 * API client for commerce. This wraps the underlying generated API clients to simplify usage and exclude unnecessary APIs.
 */
export class CommerceApiClient {
  private commerceApi: CommerceApi;

  private commerceItemsApi: CommerceItemsApi;

  constructor() {
    const configuration = createClientConfiguration('commerce', 'bedev2');
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
