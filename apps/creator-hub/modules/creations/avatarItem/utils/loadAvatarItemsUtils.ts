import {
  RobloxItemConfigurationApiMarketplaceItemModerationStatusEnum,
  RobloxItemConfigurationApiMarketplaceItemSaleStatusEnum,
} from '@rbx/client-itemconfiguration/v1';
import type { Timestamp } from '@rbx/client-marketplace-items-api/v1';
import { CollectibleItemType } from '@rbx/client-marketplace-items-api/v1';
import type { PageResponse } from '@rbx/core';
import itemConfigurationApi, {
  BundleModerationStatus,
  ItemStatus,
} from '@modules/clients/itemconfiguration';
import type { LookType } from '@modules/clients/look';
import lookClient from '@modules/clients/look';
import type { Asset } from '@modules/miscellaneous/common';
import { assetTypeToItemType, Item } from '@modules/miscellaneous/common';
import type CreationData from '../../common/interfaces/CreationData';
import creationsMenuManager from '../../menu/implementations/CreationsMenuManager';
import {
  DurationOptionsEnum,
  mapAssetTypeToString,
} from '../../unifiedFeeSystem/helper/UnifiedFeeSystemConstants';
import { translateAssetType } from '../../unifiedFeeSystem/helper/UnifiedFeeSystemHelper';
import type { AvatarItemDropdown } from '../constants/avatarItemConstants';
import {
  BundleType,
  GetItemsByCreatorApiLimit,
  UnfolderedDropdownOption,
} from '../constants/avatarItemConstants';
import type { AvatarItemsGridPagingParameters } from '../containers/AvatarItemsGridContainer';

enum RobloxItemConfigurationBodyType {
  Unknown = 'Unknown',
  Body = 'Body',
  DynamicHead = 'DynamicHead',
  Shoes = 'Shoes',
  AvatarAnimations = 'AvatarAnimations',
}

export const shouldHidePricing = (moderationStatus?: BundleModerationStatus): boolean => {
  return (
    moderationStatus === BundleModerationStatus.NUMBER_1 ||
    moderationStatus === BundleModerationStatus.NUMBER_2 ||
    moderationStatus === BundleModerationStatus.NUMBER_4
  );
};

export function getDateForScheduledRelease(
  scheduledRelease: Timestamp | null | undefined,
): Date | null {
  if (scheduledRelease && scheduledRelease.seconds) {
    return new Date(scheduledRelease.seconds * 1000);
  }
  return null;
}

export function translateBundleType(bundleType?: BundleType): RobloxItemConfigurationBodyType {
  let translatedType: RobloxItemConfigurationBodyType = RobloxItemConfigurationBodyType.Unknown;

  switch (bundleType) {
    case BundleType.Body: {
      translatedType = RobloxItemConfigurationBodyType.Body;
      break;
    }
    case BundleType.DynamicHead: {
      translatedType = RobloxItemConfigurationBodyType.DynamicHead;
      break;
    }
    case BundleType.Shoes: {
      translatedType = RobloxItemConfigurationBodyType.Shoes;
      break;
    }
    case BundleType.AvatarAnimations: {
      translatedType = RobloxItemConfigurationBodyType.AvatarAnimations;
      break;
    }
    default: {
      translatedType = RobloxItemConfigurationBodyType.Unknown;
      break;
    }
  }
  return translatedType;
}

export function translateItemStatus(
  saleStatus: RobloxItemConfigurationApiMarketplaceItemSaleStatusEnum | undefined,
  moderationStatus: RobloxItemConfigurationApiMarketplaceItemModerationStatusEnum | undefined,
): ItemStatus {
  if (moderationStatus === RobloxItemConfigurationApiMarketplaceItemModerationStatusEnum.NUMBER_2) {
    return ItemStatus.Moderated;
  }
  switch (saleStatus) {
    case RobloxItemConfigurationApiMarketplaceItemSaleStatusEnum.NUMBER_0: {
      return ItemStatus.OnSale;
    }
    case RobloxItemConfigurationApiMarketplaceItemSaleStatusEnum.NUMBER_1: {
      return ItemStatus.OffSale;
    }
    case RobloxItemConfigurationApiMarketplaceItemSaleStatusEnum.NUMBER_2: {
      return ItemStatus.Free;
    }
    default: {
      return ItemStatus.OffSale;
    }
  }
}

export async function loadCreationsByCreator(
  creationsParameters: AvatarItemsGridPagingParameters,
  userId: number,
): Promise<PageResponse<CreationData>> {
  const isBundle = creationsParameters.avatarItem?.bundleType !== undefined;
  const bundleType = translateBundleType(creationsParameters.avatarItem?.bundleType);
  const assetTypeFound = creationsParameters.avatarItem.assetType as Asset;
  const itemType = isBundle ? Item.Bundle : assetTypeToItemType[assetTypeFound];
  const { isArchived: isDelisted } = creationsParameters;

  let formattedData: CreationData[] = [];
  let nextCursorResponse: string | undefined;
  try {
    const { items, nextCursor } = await itemConfigurationApi.getItemsByCreator(
      GetItemsByCreatorApiLimit,
      creationsParameters.cursor,
      creationsParameters.groupId,
      isBundle ? creationsParameters.avatarItem?.bundleType : undefined,
      isBundle ? undefined : translateAssetType(assetTypeFound),
    );
    nextCursorResponse = nextCursor;

    if (!items) {
      return { nextPageCursor: undefined, items: [] };
    }

    const isDirectlyArchivable =
      isBundle || !assetTypeFound
        ? false
        : creationsMenuManager.isAssetTypeDirectlyArchivable(assetTypeFound);

    formattedData = items
      .filter((item) => item.delistingStatus?.status === (isDelisted ? 1 : 2))
      .map((item) => ({
        itemType,
        assetType: isBundle ? undefined : assetTypeFound,
        assetId: isBundle ? undefined : item.id,
        bundleType,
        bundleId: isBundle ? item.id : undefined,
        name: item.name,
        price: item.price !== undefined ? item.price : null,
        isDirectlyArchivable: isBundle ? false : isDirectlyArchivable,
        isArchived: creationsParameters.isArchived,
        isClickable: creationsParameters.isClickable,
        created: item.createdTime,
        status: translateItemStatus(item.saleStatus, item.moderationStatus),
        isLimited2: item.collectibleItemType === CollectibleItemType.NUMBER_1,
        isDelisted: item.delistingStatus?.status === 1,
        isCreatedForBundle: item.cannotBePublishedReason === 3,
        scheduledStartDate: getDateForScheduledRelease(item.scheduledRelease?.onSaleTime),
        scheduledEndDate: getDateForScheduledRelease(item.scheduledRelease?.offSaleTime),
        bundleModerationStatus: item.moderationStatus,
        hidePricingInfo: shouldHidePricing(item.moderationStatus),
        isSellable: item.cannotBePublishedReason === 0,
        isCollectible: item.collectibleItemType !== 0,
        wearTime: DurationOptionsEnum.Permanent, // TODO @mryumae: durables - replace with item.wearTime once the BE is ready
        isRentalOptIn: item.isRentalOptIn,
        rentalOptions: item.rentalOptions,
        userId,
      }));
  } catch {
    formattedData = [];
  }

  return { nextPageCursor: nextCursorResponse, items: formattedData };
}

export async function loadLooksByCreator(
  creatorId: number,
  creationsParameters: AvatarItemsGridPagingParameters,
): Promise<PageResponse<CreationData>> {
  const { avatarItem } = creationsParameters;
  const { lookType } = avatarItem;
  if (lookType === undefined) {
    return { items: [], nextPageCursor: undefined };
  }

  let formattedData: CreationData[] = [];
  let nextCursorResponse: string | undefined;
  const { cursor } = creationsParameters;

  try {
    const { data, nextCursor } = await lookClient.getLooksByCuratorAndType(
      creatorId.toString(),
      lookType as LookType,
      GetItemsByCreatorApiLimit,
      cursor,
    );

    nextCursorResponse = nextCursor ?? undefined;

    if (!data) {
      return { items: [], nextPageCursor: undefined };
    }

    formattedData = data.map((item) => ({
      itemType: Item.Look,
      lookId: item.lookId ?? undefined,
      lookModerationStatus: item.moderationStatus,
      lookType: item.lookType,
      lookAssets: item.assets ?? undefined,
      lookBundles: item.bundles ?? undefined,
      lookDisplayProperties: item.displayProperties,
      isClickable: true,
      userId: creatorId,
      name: item.name ?? undefined,
      created: item.createdTime,
      price: item.totalValue,
    }));
  } catch {
    formattedData = [];
  }

  return { nextPageCursor: nextCursorResponse, items: formattedData };
}

export async function loadLooksByGroup(
  groupId: number,
  creationsParameters: AvatarItemsGridPagingParameters,
): Promise<PageResponse<CreationData>> {
  const { avatarItem } = creationsParameters;
  const { lookType } = avatarItem;
  if (lookType === undefined) {
    return { items: [], nextPageCursor: undefined };
  }

  let formattedData: CreationData[] = [];
  let nextCursorResponse: string | undefined;
  const { cursor } = creationsParameters;

  try {
    const { data, nextCursor } = await lookClient.getLooksByGroupAndType(
      groupId.toString(),
      lookType as LookType,
      GetItemsByCreatorApiLimit,
      cursor,
    );

    nextCursorResponse = nextCursor ?? undefined;

    if (!data) {
      return { items: [], nextPageCursor: undefined };
    }

    formattedData = data.map((item) => ({
      itemType: Item.Look,
      lookId: item.lookId ?? undefined,
      lookModerationStatus: item.moderationStatus,
      lookType: item.lookType,
      lookAssets: item.assets ?? undefined,
      lookBundles: item.bundles ?? undefined,
      lookDisplayProperties: item.displayProperties,
      isClickable: true,
      userId: undefined,
      name: item.name ?? undefined,
      created: item.createdTime,
      price: item.totalValue,
    }));
  } catch {
    formattedData = [];
  }

  return { nextPageCursor: nextCursorResponse, items: formattedData };
}

export async function getFolderDropdownOptions(groupId?: number): Promise<AvatarItemDropdown[]> {
  try {
    const response = await itemConfigurationApi.getFolders(groupId);
    const folders =
      response.folders
        ?.map((folder) => ({
          nameKey: folder.name || '',
          folderId: folder.folderId,
          isFolder: true,
          skipTranslation: true,
        }))
        .filter((folder) => folder.nameKey !== '') || [];

    return [UnfolderedDropdownOption, ...folders];
  } catch {
    return [UnfolderedDropdownOption];
  }
}

export async function loadCreationsByFolder(
  creationsParameters: AvatarItemsGridPagingParameters,
): Promise<PageResponse<CreationData>> {
  const { avatarItem } = creationsParameters;

  let formattedData: CreationData[] = [];

  try {
    if (avatarItem.folderId) {
      const response = await itemConfigurationApi.getFolderItems(avatarItem.folderId);

      if (!response.items) {
        return { items: [], nextPageCursor: undefined };
      }

      formattedData = response.items.map((item) => {
        const { marketplaceItem } = item;
        const isAsset = marketplaceItem?.marketplaceItemDetails?.assetDetails !== undefined;
        const assetType =
          isAsset && marketplaceItem.marketplaceItemDetails?.assetDetails?.assetType !== undefined
            ? mapAssetTypeToString(marketplaceItem?.marketplaceItemDetails?.assetDetails?.assetType)
            : undefined;
        const isDirectlyArchivable = !isAsset
          ? false
          : creationsMenuManager.isAssetTypeDirectlyArchivable(assetType as Asset);

        return {
          itemType: isAsset ? Item.CatalogAsset : Item.Bundle,
          assetType: assetType as Asset | undefined,
          assetId: isAsset ? item.id : undefined,
          bundleId: isAsset ? undefined : item.id,
          name: marketplaceItem?.name,
          price: marketplaceItem?.price,
          isDirectlyArchivable: isAsset ? isDirectlyArchivable : false,
          isArchived: creationsParameters.isArchived,
          isClickable: creationsParameters.isClickable,
          created: marketplaceItem?.createdTime,
          status: translateItemStatus(
            marketplaceItem?.saleStatus,
            marketplaceItem?.moderationStatus,
          ),
          isLimited2: marketplaceItem?.collectibleItemType === CollectibleItemType.NUMBER_1,
          isDelisted: marketplaceItem?.delistingStatus?.status === 1,
          isCreatedForBundle: marketplaceItem?.cannotBePublishedReason === 3,
          scheduledStartDate: getDateForScheduledRelease(
            marketplaceItem?.scheduledRelease?.onSaleTime,
          ),
          scheduledEndDate: getDateForScheduledRelease(
            marketplaceItem?.scheduledRelease?.offSaleTime,
          ),
          bundleModerationStatus: marketplaceItem?.moderationStatus,
          hidePricingInfo: shouldHidePricing(marketplaceItem?.moderationStatus),
          isSellable: marketplaceItem?.cannotBePublishedReason === 0,
          isCollectible: marketplaceItem?.collectibleItemType !== 0,
          containingFolderId: avatarItem.folderId,
        };
      });
    }
  } catch {
    formattedData = [];
  }

  return { nextPageCursor: undefined, items: formattedData };
}
