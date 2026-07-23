import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import {
  Configuration,
  CollectiblesApi,
  DelistingApi,
  ItemApi,
  RobloxItemConfigurationApiAssetCreationsDetailsResponseStatusEnum,
  RobloxItemConfigurationApiModelsResponseBundleBundleInfoBundleTypeEnum,
  RobloxItemConfigurationApiModelsResponseBundleBundleInfoModerationStatusEnum,
  RobloxItemConfigurationApiModelsRequestPublishCollectibleItemRequest,
  RobloxItemConfigurationApiModelsRequestPublishCollectibleItemRequestTargetTypeEnum,
  RobloxItemConfigurationApiModelsRequestPublishCollectibleItemRequestPublishingTypeEnum,
  RobloxItemConfigurationApiModelsRequestUpdateCollectibleItemRequest,
  RobloxItemConfigurationApiModelsRequestCollectiblesSaleLocationConfigurationModel,
  RobloxItemConfigurationApiPriceConfigurationModel,
  V1CollectiblesCollectibleItemIdPatchRequest,
  V1CollectiblesPostRequest,
  V1CollectiblesPublishingFeesGetRequest,
  V1CollectiblesPublishingFeesGetTargetTypeEnum,
  V1CollectiblesTargetTypeIdGetRequest,
  V1CollectiblesTargetTypeIdGetTargetTypeEnum,
  V1CreationsGetAssetsGetLimitEnum,
  V1CreationsGetAssetsGetRequest,
  RobloxItemConfigurationApiCollectiblesMetadataResponse,
  RobloxItemConfigurationApiIsCollectibleItemResponse,
  RobloxItemConfigurationApiModelsRequestPublishCollectibleItemRequestResaleRestrictionEnum,
  V1CollectiblesPublishingFeesGetPublishingTypeEnum,
  V1CollectiblesUpdateItemDisplayInformationPatchRequest,
  RobloxItemConfigurationApiModelsRequestUpdateItemDisplayInformationRequestTargetTypeEnum,
  RobloxItemConfigurationApiModelsRequestUpdateItemDisplayInformationRequest,
  RobloxItemConfigurationApiModelsRequestUpdateCollectibleItemRequestSaleStatusEnum,
  RobloxItemConfigurationApiModelsRequestUpdateCollectibleItemRequestResaleRestrictionEnum,
  V1CollectiblesPublishingFeesGetResaleRestrictionEnum,
  V1CollectiblesItemConfigurationCollectibleItemIdGetRequest,
  V1CollectiblesCheckItemPublishAccessGetRequest,
  V1CollectiblesCheckItemPublishAccessGetTargetTypeEnum,
  V1CollectiblesCheckItemPublishAccessGetPublishingTypeEnum,
  V1CollectiblesCheckItemConfigurationAccessGetRequest,
  V1CollectiblesCheckItemConfigurationAccessGetTargetTypeEnum,
  V1DelistItemPostRequest,
  V1DelistItemPostTargetTypeEnum,
  V1CollectiblesCollectibleItemIdSaleScheduleDeleteRequest,
  V1CollectiblesPriceFloorGetRequest,
  V1CollectiblesPriceFloorGetTargetTypeEnum,
  V1CollectiblesPriceFloorGetPublishingTypeEnum,
  MarketplaceItemApi,
  V1ItemsByCreatorGetBundleTypeEnum,
  V1ItemsByCreatorGetAssetTypeEnum,
  V1ItemsByCreatorGetRequest,
  V1CollectiblesRegionalPricingPreviewGetRequest,
  V1ItemsGetRequest,
  V1ItemsGetItemTypeEnum,
  V1CollectiblesRevenueSplitGetRequest,
  PermissionsApi,
  V1PermissionsItemTypesGetRequest,
  V1PermissionsItemTypesGetActionEnum,
  V1PermissionsItemTypesGetTargetTypesEnum,
  // Content Metadata Appeal types from version 4.137.0+
  RobloxItemConfigurationApiModelsRequestCreateContentMetadataAppealRequest,
  RobloxItemConfigurationApiModelsResponseCreateContentMetadataAppealResponse,
  RobloxItemConfigurationApiGetAppealStatusResponse,
  ContentMetadataApi,
  FoldersApi,
  RobloxItemConfigurationApiModelsRequestFolderAddItemRequest,
  RobloxItemConfigurationApiModelsRequestFolderCreateFolderRequest,
  RobloxItemConfigurationApiModelsRequestFolderDeleteItemRequest,
  RobloxItemConfigurationApiModelsRequestFolderUpdateFolderRequest,
  RobloxItemConfigurationApiModelsResponseFolderCreateFolderResponse,
  RobloxItemConfigurationApiModelsResponseFolderGetFolderItemsResponse,
  RobloxItemConfigurationApiModelsResponseFolderGetFoldersResponse,
  RobloxItemConfigurationApiModelsFolderFolder,
  RobloxItemConfigurationApiModelsFolderFolderItemDetails,
  V1FoldersFolderIdDeleteRequest,
  V1FoldersFolderIdGetRequest,
  V1FoldersFolderIdItemDeleteRequest,
  V1FoldersGetRequest,
  V1FoldersPostRequest,
  V1FoldersFolderIdItemsGetRequest,
  V1FoldersFolderIdItemsPostRequest,
  V1FoldersFolderIdPatchRequest,
  RobloxItemConfigurationApiModelsRequestFolderAddItemRequestItemTypeEnum,
  RobloxItemConfigurationApiModelsRequestFolderDeleteItemRequestItemTypeEnum,
  V1ItemsUploadFeeGetRequest,
  V1ItemsUploadFeeGetAssetTypeEnum,
  V1ItemsUploadFeeGetBundleTypeEnum,
  V1ItemsPriceFloorGetRequest,
  V1ItemsPriceFloorGetCollectibleItemTypeEnum,
  V1ItemsPriceFloorGetCreationTypeEnum,
  V1ItemsPriceFloorGetAssetTypeEnum,
  V1ItemsPriceFloorGetBundleTypeEnum,
  V1CollectiblesRentalPricingPreviewGetRequest,
  V1CollectiblesBulkUpdatePatchRequest,
  RobloxItemConfigurationApiModelsRequestCollectiblesBulkUpdateTargetsAssetTypeEnum,
} from '@rbx/client-itemconfiguration/v1';
import { SaleLocationEnum, PurchasePlatformEnum } from '@modules/creations';
import { getBEDEV1ServiceBasePath } from './utils';

export { RobloxItemConfigurationApiAssetCreationsDetailsResponseStatusEnum as ItemStatus };
export { RobloxItemConfigurationApiModelsResponseBundleBundleInfoModerationStatusEnum as BundleModerationStatus };
export { RobloxItemConfigurationApiModelsResponseBundleBundleInfoBundleTypeEnum as BundleType };
export type { RobloxItemConfigurationApiPriceConfigurationModel as ItemPriceConfiguration };
export type ItemConfigurationCollectiblesMetadataResponse =
  RobloxItemConfigurationApiCollectiblesMetadataResponse;

export type CreateContentMetadataAppealRequest =
  RobloxItemConfigurationApiModelsRequestCreateContentMetadataAppealRequest;
export type CreateContentMetadataAppealResponse =
  RobloxItemConfigurationApiModelsResponseCreateContentMetadataAppealResponse;
export type GetAppealStatusResponse = RobloxItemConfigurationApiGetAppealStatusResponse;
export type CreateFolderResponse =
  RobloxItemConfigurationApiModelsResponseFolderCreateFolderResponse;
export type GetFolderItemsResponse =
  RobloxItemConfigurationApiModelsResponseFolderGetFolderItemsResponse;
export type GetFoldersResponse = RobloxItemConfigurationApiModelsResponseFolderGetFoldersResponse;
export type AddItemRequest = RobloxItemConfigurationApiModelsRequestFolderAddItemRequest;
export type CreateFolderRequest = RobloxItemConfigurationApiModelsRequestFolderCreateFolderRequest;
export type DeleteItemRequest = RobloxItemConfigurationApiModelsRequestFolderDeleteItemRequest;
export type UpdateFolderRequest = RobloxItemConfigurationApiModelsRequestFolderUpdateFolderRequest;
export type Folder = RobloxItemConfigurationApiModelsFolderFolder;
export type FolderItemDetails = RobloxItemConfigurationApiModelsFolderFolderItemDetails;

export class ItemConfigurationClient {
  private collectiblesApi: CollectiblesApi;

  private delistingApi: DelistingApi;

  private itemConfigurationApi: ItemApi;

  private marketplaceItemApi: MarketplaceItemApi;

  private permissionsApi: PermissionsApi;

  private contentMetadataApi: ContentMetadataApi;

  private foldersApi: FoldersApi;

  constructor(basePath: string = getBEDEV1ServiceBasePath('itemconfiguration')) {
    const configuration = new Configuration({
      robloxSiteDomain: process.env.robloxSiteDomain,
      basePath,
      credentials: 'include',
      unifiedLogger: unifiedLoggerClient,
    });

    this.collectiblesApi = new CollectiblesApi(configuration);

    this.delistingApi = new DelistingApi(configuration);

    this.itemConfigurationApi = new ItemApi(configuration);

    this.marketplaceItemApi = new MarketplaceItemApi(configuration);

    this.permissionsApi = new PermissionsApi(configuration);

    this.contentMetadataApi = new ContentMetadataApi(configuration);

    this.foldersApi = new FoldersApi(configuration);
  }

  checkItemConfigurationAccess(isBundle: boolean, targetId: number) {
    const request: V1CollectiblesCheckItemConfigurationAccessGetRequest = {
      targetType: isBundle
        ? V1CollectiblesCheckItemConfigurationAccessGetTargetTypeEnum.NUMBER_1
        : V1CollectiblesCheckItemConfigurationAccessGetTargetTypeEnum.NUMBER_0,
      targetId,
    };
    return this.collectiblesApi.v1CollectiblesCheckItemConfigurationAccessGet(request);
  }

  checkItemPublishAccess(isBundle: boolean, targetId: number, isLimited: boolean) {
    const request: V1CollectiblesCheckItemPublishAccessGetRequest = {
      targetType: isBundle
        ? V1CollectiblesCheckItemPublishAccessGetTargetTypeEnum.NUMBER_1
        : V1CollectiblesCheckItemPublishAccessGetTargetTypeEnum.NUMBER_0,
      targetId,
      publishingType: isLimited
        ? V1CollectiblesCheckItemPublishAccessGetPublishingTypeEnum.NUMBER_1
        : V1CollectiblesCheckItemPublishAccessGetPublishingTypeEnum.NUMBER_2,
    };
    return this.collectiblesApi.v1CollectiblesCheckItemPublishAccessGet(request);
  }

  delistItem(isBundle: boolean, targetId: number) {
    const request: V1DelistItemPostRequest = {
      targetType: isBundle
        ? V1DelistItemPostTargetTypeEnum.NUMBER_1
        : V1DelistItemPostTargetTypeEnum.NUMBER_0,
      targetId,
    };
    return this.delistingApi.v1DelistItemPost(request);
  }

  getCollectiblesMetadata() {
    return this.collectiblesApi.v1CollectiblesMetadataGet();
  }

  getDynamicPriceConfiguration(collectibleItemId: string) {
    const request: V1CollectiblesItemConfigurationCollectibleItemIdGetRequest = {
      collectibleItemId,
    };
    return this.collectiblesApi.v1CollectiblesItemConfigurationCollectibleItemIdGet(request);
  }

  getCollectibleItemId(
    targetId: number,
    isBundle: boolean = false,
  ): Promise<RobloxItemConfigurationApiIsCollectibleItemResponse> {
    const request: V1CollectiblesTargetTypeIdGetRequest = {
      targetType: isBundle
        ? V1CollectiblesTargetTypeIdGetTargetTypeEnum.NUMBER_1
        : V1CollectiblesTargetTypeIdGetTargetTypeEnum.NUMBER_0,
      id: targetId,
    };
    return this.collectiblesApi.v1CollectiblesTargetTypeIdGet(request);
  }

  getCollectibleCommissionRates() {
    return this.collectiblesApi.v1CollectiblesCommissionRatesGet();
  }

  getCollectiblePublishingMetadata() {
    return this.collectiblesApi.v1CollectiblesMetadataGet();
  }

  getCollectiblePublishingFees(
    isBundle: boolean,
    targetId: number,
    quantity: number,
    publishingType: number,
    saleLocation: SaleLocationEnum,
    isResellable: boolean,
    isFree: boolean,
  ) {
    const request: V1CollectiblesPublishingFeesGetRequest = {
      targetType: isBundle
        ? V1CollectiblesPublishingFeesGetTargetTypeEnum.NUMBER_1
        : V1CollectiblesPublishingFeesGetTargetTypeEnum.NUMBER_0,
      targetID: targetId,
      quantity,
      publishingType:
        publishingType === 1
          ? V1CollectiblesPublishingFeesGetPublishingTypeEnum.NUMBER_1
          : V1CollectiblesPublishingFeesGetPublishingTypeEnum.NUMBER_2,
      saleLocation,
      resaleRestriction: isResellable
        ? V1CollectiblesPublishingFeesGetResaleRestrictionEnum.NUMBER_1
        : V1CollectiblesPublishingFeesGetResaleRestrictionEnum.NUMBER_2,
      isFree,
    };

    return this.collectiblesApi.v1CollectiblesPublishingFeesGet(request);
  }

  getPriceFloor(targetId: number, isBundle: boolean, isLimited: boolean) {
    const request: V1CollectiblesPriceFloorGetRequest = {
      targetType: isBundle
        ? V1CollectiblesPriceFloorGetTargetTypeEnum.NUMBER_1 // Bundle
        : V1CollectiblesPriceFloorGetTargetTypeEnum.NUMBER_0, // Asset
      targetId,
      publishingType: isLimited
        ? V1CollectiblesPriceFloorGetPublishingTypeEnum.NUMBER_1 // Limited
        : V1CollectiblesPriceFloorGetPublishingTypeEnum.NUMBER_2, // Non limited
    };

    return this.collectiblesApi.v1CollectiblesPriceFloorGet(request);
  }

  updateCollectibleItemDisplayInfo(
    isBundle: boolean,
    targetId: number,
    name: string,
    description: string,
  ) {
    const patchRequest: RobloxItemConfigurationApiModelsRequestUpdateItemDisplayInformationRequest =
      {
        targetType: isBundle
          ? RobloxItemConfigurationApiModelsRequestUpdateItemDisplayInformationRequestTargetTypeEnum.NUMBER_1
          : RobloxItemConfigurationApiModelsRequestUpdateItemDisplayInformationRequestTargetTypeEnum.NUMBER_0,
        targetId: targetId.toString(),
        name,
        description,
      };
    const request: V1CollectiblesUpdateItemDisplayInformationPatchRequest = {
      request: patchRequest,
    };
    return this.collectiblesApi.v1CollectiblesUpdateItemDisplayInformationPatch(request);
  }

  bulkUpdateCollectible(
    idempotencyKey: string,
    groupId: number | undefined,
    assetTypeIds: RobloxItemConfigurationApiModelsRequestCollectiblesBulkUpdateTargetsAssetTypeEnum[],
    isRentalOptIn?: boolean,
  ) {
    const request: V1CollectiblesBulkUpdatePatchRequest = {
      request: {
        idempotencyKey,
        groupId,
        updateTargets: {
          assetType: assetTypeIds,
        },
        updatePayload: {
          rentalOptIn: isRentalOptIn,
        },
      },
    };
    return this.collectiblesApi.v1CollectiblesBulkUpdatePatch(request);
  }

  publishCollectible(
    idempotencyToken: string | undefined,
    targetId: number,
    isBundle: boolean,
    isLimited: boolean,
    agreedPublishingFee: number,
    creatorUserId: number | undefined,
    creatorGroupId: number | undefined,
    publisherUserId: number | undefined,
    quantity: number,
    quantityLimitPerUser: number,
    isResellable: boolean,
    priceInRobux: number,
    priceOffset: number,
    isFree: boolean,
    saleLocationConfiguration: RobloxItemConfigurationApiModelsRequestCollectiblesSaleLocationConfigurationModel,
    name: string | undefined,
    description: string | undefined,
    onSaleTime?: Date | null,
    offSaleTime?: Date | null,
    optOutFromRegionalPricing?: boolean,
    isRentalOptIn?: boolean,
  ) {
    const publishRequest: RobloxItemConfigurationApiModelsRequestPublishCollectibleItemRequest = {
      idempotencyToken,
      targetId,
      targetType: isBundle
        ? RobloxItemConfigurationApiModelsRequestPublishCollectibleItemRequestTargetTypeEnum.NUMBER_1
        : RobloxItemConfigurationApiModelsRequestPublishCollectibleItemRequestTargetTypeEnum.NUMBER_0,
      publishingType: isLimited
        ? RobloxItemConfigurationApiModelsRequestPublishCollectibleItemRequestPublishingTypeEnum.NUMBER_1
        : RobloxItemConfigurationApiModelsRequestPublishCollectibleItemRequestPublishingTypeEnum.NUMBER_2,
      agreedPublishingFee,
      creatorUserId,
      creatorGroupId,
      publisherUserId,
      quantity,
      quantityLimitPerUser,
      resaleRestriction: isResellable
        ? RobloxItemConfigurationApiModelsRequestPublishCollectibleItemRequestResaleRestrictionEnum.NUMBER_1
        : RobloxItemConfigurationApiModelsRequestPublishCollectibleItemRequestResaleRestrictionEnum.NUMBER_2,
      priceInRobux,
      priceOffset,
      isFree,
      saleLocationConfiguration,
      name,
      description,
      onSaleTime: onSaleTime ?? undefined,
      offSaleTime: offSaleTime ?? undefined,
      optOutFromRegionalPricing: optOutFromRegionalPricing ?? false,
      isRentalOptIn: isRentalOptIn ?? false,
    };

    const request: V1CollectiblesPostRequest = {
      request: publishRequest,
    };

    return this.collectiblesApi.v1CollectiblesPost(request);
  }

  updateCollectibleInformation(
    collectibleItemId: string,
    saleLocationConfiguration: RobloxItemConfigurationApiModelsRequestCollectiblesSaleLocationConfigurationModel,
    isOnSale: boolean,
    quantityLimitPerUser: number,
    isResellable: boolean,
    priceInRobux: number,
    priceOffset: number,
    isFree: boolean,
    onSaleTime?: Date | null,
    offSaleTime?: Date | null,
    optOutFromRegionalPricing?: boolean,
    isRentalOptIn?: boolean,
  ) {
    const updateCollectibleItemRequest: RobloxItemConfigurationApiModelsRequestUpdateCollectibleItemRequest =
      {
        saleLocationConfiguration,
        saleStatus: isOnSale
          ? RobloxItemConfigurationApiModelsRequestUpdateCollectibleItemRequestSaleStatusEnum.NUMBER_0
          : RobloxItemConfigurationApiModelsRequestUpdateCollectibleItemRequestSaleStatusEnum.NUMBER_1,
        quantityLimitPerUser,
        resaleRestriction: isResellable
          ? RobloxItemConfigurationApiModelsRequestUpdateCollectibleItemRequestResaleRestrictionEnum.NUMBER_1
          : RobloxItemConfigurationApiModelsRequestUpdateCollectibleItemRequestResaleRestrictionEnum.NUMBER_2,
        priceInRobux,
        priceOffset,
        isFree,
        onSaleTime: onSaleTime ?? undefined,
        offSaleTime: offSaleTime ?? undefined,
        optOutFromRegionalPricing: optOutFromRegionalPricing ?? false,
        isRentalOptIn,
      };
    const request: V1CollectiblesCollectibleItemIdPatchRequest = {
      collectibleItemId,
      updateCollectibleItemRequest,
    };

    return this.collectiblesApi.v1CollectiblesCollectibleItemIdPatch(request);
  }

  cancelScheduledSaleStatus(collectibleItemId: string) {
    const request: V1CollectiblesCollectibleItemIdSaleScheduleDeleteRequest = {
      collectibleItemId,
    };

    return this.collectiblesApi.v1CollectiblesCollectibleItemIdSaleScheduleDelete(request);
  }

  getCreations(
    assetType: string,
    isArchived?: boolean,
    groupId?: number,
    limit?: V1CreationsGetAssetsGetLimitEnum,
    cursor?: string,
  ) {
    const request: V1CreationsGetAssetsGetRequest = {
      assetType,
      isArchived,
      groupId,
      limit,
      cursor,
    };

    return this.itemConfigurationApi.v1CreationsGetAssetsGet(request);
  }

  getAllowedAssetTypes(
    action: V1PermissionsItemTypesGetActionEnum,
    targetTypes: V1PermissionsItemTypesGetTargetTypesEnum[],
  ) {
    const request: V1PermissionsItemTypesGetRequest = {
      action,
      targetTypes,
    };

    return this.permissionsApi.v1PermissionsItemTypesGet(request);
  }

  async getItemUploadFee(
    assetType: V1ItemsUploadFeeGetAssetTypeEnum | undefined,
    bundleType: V1ItemsUploadFeeGetBundleTypeEnum | undefined,
  ) {
    const request: V1ItemsUploadFeeGetRequest = {
      assetType,
      bundleType,
    };

    return this.marketplaceItemApi.v1ItemsUploadFeeGet(request);
  }

  async getPriceFloorVariables() {
    return this.marketplaceItemApi.v1ItemsPriceFloorVariablesGet();
  }

  async getPriceFloorFromVariables(
    collectibleItemType: V1ItemsPriceFloorGetCollectibleItemTypeEnum,
    creationType: V1ItemsPriceFloorGetCreationTypeEnum,
    isPbr: boolean,
    isBodysuit: boolean,
    assetType?: V1ItemsPriceFloorGetAssetTypeEnum,
    bundleType?: V1ItemsPriceFloorGetBundleTypeEnum,
    categoryId?: string,
  ) {
    const request: V1ItemsPriceFloorGetRequest = {
      collectibleItemType,
      creationType,
      isPbr,
      isBodysuit,
      assetType,
      bundleType,
      categoryId,
    };

    return this.marketplaceItemApi.v1ItemsPriceFloorGet(request);
  }

  getItem(isBundle: boolean, itemId: string) {
    const request: V1ItemsGetRequest = {
      itemType: isBundle ? V1ItemsGetItemTypeEnum.NUMBER_1 : V1ItemsGetItemTypeEnum.NUMBER_0,
      itemId,
    };

    return this.marketplaceItemApi.v1ItemsGet(request);
  }

  getItemsByCreator(
    limit?: number,
    cursor?: string,
    creatorGroupId?: number | undefined,
    bundleType?: V1ItemsByCreatorGetBundleTypeEnum,
    assetType?: V1ItemsByCreatorGetAssetTypeEnum,
  ) {
    const request: V1ItemsByCreatorGetRequest = {
      limit,
      cursor,
      groupId: creatorGroupId,
      bundleType,
      assetType,
    };

    return this.marketplaceItemApi.v1ItemsByCreatorGet(request);
  }

  getItemsByToken(tokenId: string, limit: number, cursor?: string) {
    return this.marketplaceItemApi.v1ItemsByTokenGet({
      tokenId,
      limit,
      cursor,
    });
  }

  getRepresentativeCountries() {
    return this.collectiblesApi.v1CollectiblesRegionalPricingRepresentativeCountriesGet();
  }

  getRegionalPricingPreview(
    isBundle: boolean,
    targetId: number,
    isLimited: boolean,
    minimumPrice: number,
    priceOffset: number,
  ) {
    const request: V1CollectiblesRegionalPricingPreviewGetRequest = {
      targetType: isBundle
        ? V1CollectiblesCheckItemConfigurationAccessGetTargetTypeEnum.NUMBER_1
        : V1CollectiblesCheckItemConfigurationAccessGetTargetTypeEnum.NUMBER_0,
      targetId,
      publishingType: isLimited
        ? V1CollectiblesPublishingFeesGetPublishingTypeEnum.NUMBER_1
        : V1CollectiblesPublishingFeesGetPublishingTypeEnum.NUMBER_2,
      minimumPrice,
      priceOffset,
    };
    return this.collectiblesApi.v1CollectiblesRegionalPricingPreviewGet(request);
  }

  getRentalPricingPreview(
    isBundle: boolean,
    targetId: number,
    isLimited: boolean,
    minimumPrice: number,
    priceOffset: number,
    includeRegionalPricing: boolean,
  ) {
    const request: V1CollectiblesRentalPricingPreviewGetRequest = {
      targetType: isBundle
        ? V1CollectiblesCheckItemConfigurationAccessGetTargetTypeEnum.NUMBER_1 // Bundle
        : V1CollectiblesCheckItemConfigurationAccessGetTargetTypeEnum.NUMBER_0, // Asset
      targetId,
      publishingType: isLimited
        ? V1CollectiblesPublishingFeesGetPublishingTypeEnum.NUMBER_1 // Limited
        : V1CollectiblesPublishingFeesGetPublishingTypeEnum.NUMBER_2, // Non limited
      minimumPrice,
      priceOffset,
      includeRegionalPricing,
    };
    return this.collectiblesApi.v1CollectiblesRentalPricingPreviewGet(request);
  }

  getRevenueSplit(
    isBundle: boolean,
    targetId: string,
    isLimited: boolean,
    minimumPrice: number,
    priceOffset: number,
    purchasePlatform: PurchasePlatformEnum,
  ) {
    const request: V1CollectiblesRevenueSplitGetRequest = {
      targetType: isBundle
        ? V1CollectiblesCheckItemConfigurationAccessGetTargetTypeEnum.NUMBER_1
        : V1CollectiblesCheckItemConfigurationAccessGetTargetTypeEnum.NUMBER_0,
      targetID: targetId,
      collectibleItemType: isLimited
        ? V1CollectiblesPublishingFeesGetPublishingTypeEnum.NUMBER_1
        : V1CollectiblesPublishingFeesGetPublishingTypeEnum.NUMBER_2,
      minimumPrice,
      priceOffset,
      purchasePlatform,
    };

    return this.collectiblesApi.v1CollectiblesRevenueSplitGet(request);
  }

  // Content Metadata Appeal Methods
  getContentMetadataAppealStatus(
    targetType: 0 | 1,
    targetId: string,
    appealType: 1, // Default to BodysuitAppeal
  ): Promise<GetAppealStatusResponse> {
    return this.contentMetadataApi.v1ContentMetadataAppealStatusGet({
      targetType,
      targetId,
      appealType,
    });
  }

  createContentMetadataAppeal(
    request: CreateContentMetadataAppealRequest,
  ): Promise<CreateContentMetadataAppealResponse> {
    return this.contentMetadataApi.v1ContentMetadataAppealPost({
      request,
    });
  }

  getFolder(folderId: string): Promise<Folder> {
    const request: V1FoldersFolderIdGetRequest = {
      folderId,
    };
    return this.foldersApi.v1FoldersFolderIdGet(request);
  }

  getFolders(groupId?: number): Promise<GetFoldersResponse> {
    const request: V1FoldersGetRequest = {
      groupId,
    };
    return this.foldersApi.v1FoldersGet(request);
  }

  getFolderItems(folderId: string): Promise<GetFolderItemsResponse> {
    const request: V1FoldersFolderIdItemsGetRequest = {
      folderId,
    };
    return this.foldersApi.v1FoldersFolderIdItemsGet(request);
  }

  createFolder(
    name: string,
    parentFolderId?: string,
    groupId?: number,
  ): Promise<CreateFolderResponse> {
    const createFolderRequest: CreateFolderRequest = {
      name,
      parentFolderId,
      groupId,
    };
    const request: V1FoldersPostRequest = {
      request: createFolderRequest,
    };
    return this.foldersApi.v1FoldersPost(request);
  }

  addItemToFolder(
    itemId: string,
    itemType: RobloxItemConfigurationApiModelsRequestFolderAddItemRequestItemTypeEnum,
    folderId: string,
  ): Promise<void> {
    const addItemRequest: AddItemRequest = {
      itemId,
      itemType,
    };
    const request: V1FoldersFolderIdItemsPostRequest = {
      folderId,
      request: addItemRequest,
    };
    return this.foldersApi.v1FoldersFolderIdItemsPost(request);
  }

  removeItemFromFolder(
    itemId: string,
    itemType: RobloxItemConfigurationApiModelsRequestFolderDeleteItemRequestItemTypeEnum,
    folderId: string,
  ): Promise<void> {
    const deleteItemRequest: DeleteItemRequest = {
      itemId,
      itemType,
    };
    const request: V1FoldersFolderIdItemDeleteRequest = {
      folderId,
      request: deleteItemRequest,
    };
    return this.foldersApi.v1FoldersFolderIdItemDelete(request);
  }

  updateFolder(folderId: string, name: string): Promise<void> {
    const updateFolderRequest: UpdateFolderRequest = {
      name,
    };
    const request: V1FoldersFolderIdPatchRequest = {
      folderId,
      request: updateFolderRequest,
    };
    return this.foldersApi.v1FoldersFolderIdPatch(request);
  }

  deleteFolder(folderId: string): Promise<void> {
    const request: V1FoldersFolderIdDeleteRequest = {
      folderId,
    };
    return this.foldersApi.v1FoldersFolderIdDelete(request);
  }
}

const itemConfigurationClient = new ItemConfigurationClient();

export default itemConfigurationClient;
