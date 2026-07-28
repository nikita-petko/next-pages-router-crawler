import { ThumbnailTypes } from '@rbx/thumbnails';
import { www } from '@modules/miscellaneous/urls';

// The v2 transaction-records API returns the enriched sale payload in the record's `details`
// field, typed only as `object` by the generated client. For a SaleOfGood the concrete shape is
// the service's `VirtualSaleDetails`; we read the fields the virtual view needs defensively.
export type VirtualSaleDetails = {
  productName?: string;
  productTypeId?: number;
  productTargetId?: number;
  assetId?: number;
  productUniverseId?: number;
  // Root place of the product's universe + the universe name, resolved server-side (client >=1.2.0).
  placeId?: number;
  universeName?: string;
  collectibleItemTargetId?: number;
  collectibleItemTargetTypeId?: number;
};

// Mirrors transaction-records' ProductTypeId enum (robux_spent_event.proto). Kept in parity with
// Economy's values. Value 1 is intentionally omitted — it isn't a creator-sellable product type,
// so it never appears in this seller-side view (and falls through to the default if it ever does).
const ProductTypeId = {
  UserProduct: 2,
  ResellableProduct: 3,
  DeveloperProduct: 4,
  PrivateServerProduct: 5,
  GamePass: 6,
  BundleProduct: 7,
  CollectibleItem: 8,
  CollectibleItemInstance: 9,
  CollectibleRobuxProduct: 10,
  DeveloperSubscription: 11,
} as const;

// collectibleItemTargetTypeId values: 1 = asset, 2 = bundle, 3 = IEC token.
const COLLECTIBLE_TARGET_TYPE_BUNDLE = 2;

// The sold item's thumbnail + the main-site link for its name. Mirrors the personal
// my-transactions page (transactionsThumbnailService + urlService.getItemUrl). All fields are
// optional: the name (rendered by the caller) always shows, the thumbnail only when both a type
// and target id resolve, and the link only when the type has a description page.
export type VirtualProductMedia = {
  thumbnailType?: ThumbnailTypes;
  targetId?: number;
  href?: string;
};

// The experience a product belongs to (the "place" line on my-transactions), shown for any
// product that carries a universe.
export type VirtualExperienceLink = {
  name: string;
  href?: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const asNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number') {
    return Number.isNaN(value) ? undefined : value;
  }
  if (typeof value === 'string' && value !== '') {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  }
  return undefined;
};

export const parseSaleDetails = (details: unknown): VirtualSaleDetails => {
  if (!isRecord(details)) {
    return {};
  }
  return {
    productName: typeof details.productName === 'string' ? details.productName : undefined,
    productTypeId: asNumber(details.productTypeId),
    productTargetId: asNumber(details.productTargetId),
    assetId: asNumber(details.assetId),
    productUniverseId: asNumber(details.productUniverseId),
    placeId: asNumber(details.placeId),
    universeName: typeof details.universeName === 'string' ? details.universeName : undefined,
    collectibleItemTargetId: asNumber(details.collectibleItemTargetId),
    collectibleItemTargetTypeId: asNumber(details.collectibleItemTargetTypeId),
  };
};

const assetMedia = (id: number): VirtualProductMedia => ({
  thumbnailType: ThumbnailTypes.assetThumbnail,
  targetId: id,
  href: www.getCatalogUrl(id),
});

const bundleMedia = (id: number): VirtualProductMedia => ({
  thumbnailType: ThumbnailTypes.bundleThumbnail,
  targetId: id,
  href: www.getBundleUrl(id),
});

// Maps a sold product to its thumbnail + name link, matching the per-type handling on the
// personal my-transactions page. The experience/place line is handled separately by
// getVirtualExperienceLink (my-transactions shows it for any item with a universe).
export const getVirtualProductMedia = (details: VirtualSaleDetails): VirtualProductMedia => {
  const { productTypeId, productTargetId, assetId, productUniverseId, placeId } = details;
  const experienceHref = placeId ? www.getGameDetailsUrl(placeId) : undefined;

  switch (productTypeId) {
    case ProductTypeId.UserProduct:
    case ProductTypeId.ResellableProduct:
      // `assetId` is the resolved catalog asset id; productTargetId is the unresolved product
      // target (not a catalog id), so it is not used.
      return assetId ? assetMedia(assetId) : {};
    case ProductTypeId.GamePass:
      return productTargetId
        ? {
            thumbnailType: ThumbnailTypes.gamePassIcon,
            targetId: productTargetId,
            href: www.getGamePassUrl(productTargetId),
          }
        : {};
    case ProductTypeId.BundleProduct:
      return productTargetId ? bundleMedia(productTargetId) : {};
    case ProductTypeId.DeveloperProduct:
      // Developer products have no standalone public page, so the name is NOT linked (matches
      // my-transactions and the subscription case); the experience line carries the game link
      // separately. We still show the developer-product icon when its target id is present.
      return productTargetId
        ? { thumbnailType: ThumbnailTypes.developerProductIcon, targetId: productTargetId }
        : {};
    case ProductTypeId.PrivateServerProduct:
      // Game icon on the universe; name links to the experience.
      return productUniverseId
        ? {
            thumbnailType: ThumbnailTypes.gameIcon,
            targetId: productUniverseId,
            href: experienceHref,
          }
        : { href: experienceHref };
    case ProductTypeId.DeveloperSubscription:
      // Subscriptions have no dedicated product page, so the name is NOT linked (matches
      // my-transactions). We still show the experience's game icon as the thumbnail, and the
      // experience is linked separately via getVirtualExperienceLink. (my-transactions uses the
      // subscription's own ImageAssetId, which the v2 payload doesn't carry.)
      return productUniverseId
        ? { thumbnailType: ThumbnailTypes.gameIcon, targetId: productUniverseId }
        : {};
    case ProductTypeId.CollectibleItem:
    case ProductTypeId.CollectibleItemInstance:
    case ProductTypeId.CollectibleRobuxProduct: {
      // collectibleItemTargetId holds the resolved asset/bundle id (interpreted by
      // collectibleItemTargetTypeId). productTargetId is not an asset/bundle id.
      const id = details.collectibleItemTargetId ?? assetId;
      if (!id) {
        return {};
      }
      return details.collectibleItemTargetTypeId === COLLECTIBLE_TARGET_TYPE_BUNDLE
        ? bundleMedia(id)
        : assetMedia(id);
    }
    case undefined:
    default:
      return assetId ? assetMedia(assetId) : {};
  }
};

// A private server has no per-item name — the payload echoes the experience name — so the caller
// renders a generic "Private Server" label and lets the experience line carry the game name,
// matching the personal my-transactions view (avoids showing the experience name twice).
export const isPrivateServerProduct = (details: VirtualSaleDetails): boolean =>
  details.productTypeId === ProductTypeId.PrivateServerProduct;

// The experience/place line: shown for any product that carries a universe (data-driven, like
// my-transactions' `showPlaceName`), linked to the experience when a placeId is resolved.
export const getVirtualExperienceLink = (
  details: VirtualSaleDetails,
): VirtualExperienceLink | null => {
  if (!details.universeName) {
    return null;
  }
  return {
    name: details.universeName,
    href: details.placeId ? www.getGameDetailsUrl(details.placeId) : undefined,
  };
};
