import {
  CollectibleItemType,
  ItemTargetType,
  ResaleRestriction,
} from '@rbx/client-marketplace-items-api/v1';
import { AssetThumbnailSize, BundleThumbnailSize, ThumbnailTypes } from '@rbx/thumbnails';
import { getCreatorDisplayName, normalizeCreatorType } from '../../utils/creatorName';
import type { CollectibleMatchItemDetails } from '../hooks/useCollectibleMatchItemDetails';

export interface CollectibleMatchPresentation {
  creatorDisplayName: string;
  description?: string;
  isBundle: boolean;
  isLimited: boolean;
  isResellAllowed: boolean;
  name?: string;
  price?: number | null;
  size: AssetThumbnailSize | BundleThumbnailSize;
  targetId?: number;
  thumbnailAlt: string;
  thumbnailTargetId: number;
  type: ThumbnailTypes;
}

/**
 * Resolves the values shared by Collectible table rows and content tiles.
 * Marketplace is the primary source because it is required for Collectible hydration; Catalog is
 * optional enrichment and therefore only supplies fallbacks or fields Marketplace does not expose.
 */
export const getCollectibleMatchPresentation = (
  details: CollectibleMatchItemDetails,
  candidateCreatorType?: string | number,
): CollectibleMatchPresentation => {
  const { catalogItem, collectible } = details;
  const creatorName = collectible.creatorName ?? catalogItem?.creatorName ?? '';
  const creatorType =
    normalizeCreatorType(catalogItem?.creatorType) ??
    normalizeCreatorType(collectible.creatorType ?? undefined) ??
    normalizeCreatorType(candidateCreatorType);
  const isBundle =
    collectible.itemTargetType === ItemTargetType.NUMBER_2 ||
    (collectible.itemTargetType == null && catalogItem?.itemType === 2);
  const name = collectible.name ?? catalogItem?.name;
  const targetId = collectible.itemTargetId ?? catalogItem?.id;

  return {
    creatorDisplayName: getCreatorDisplayName(creatorType, creatorName),
    description: catalogItem?.description,
    isBundle,
    isLimited: collectible.itemType === CollectibleItemType.NUMBER_1,
    isResellAllowed: collectible.resaleRestriction === ResaleRestriction.NUMBER_1,
    name,
    price: collectible.price ?? catalogItem?.price,
    // eslint-disable-next-line no-underscore-dangle -- Swagger generated enum has underscore
    size: isBundle ? BundleThumbnailSize._150x150 : AssetThumbnailSize._50x50,
    targetId,
    thumbnailAlt: name ?? '',
    thumbnailTargetId: targetId ?? 0,
    type: isBundle ? ThumbnailTypes.bundleThumbnail : ThumbnailTypes.assetThumbnail,
  };
};
