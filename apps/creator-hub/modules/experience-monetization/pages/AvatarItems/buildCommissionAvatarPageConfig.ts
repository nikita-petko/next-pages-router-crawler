import { RAQIV2ProductType } from '@rbx/creator-hub-analytics-config';
import { ThumbnailClient, ThumbnailTypes, ReturnPolicy } from '@rbx/thumbnails';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import type { RAQIV2BreakdownValue } from '@modules/clients/analytics';
import type { CreatorAnalyticsEmbeddedSurfaceConfig } from '@modules/experience-analytics-shared/types/RAQIV2PageConfig';
import type { ItemMetadata } from '@modules/experience-analytics-shared/types/RAQIV2SummaryCardShared';
import { Item } from '@modules/miscellaneous/common';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { getUrlForItemType } from '@modules/miscellaneous/urls';
import type { ItemMonetizationApiClient } from '../../context/ItemMonetizationClientProvider';
import type { ItemMonetizationContentConfig } from '../../utils/buildItemMonetizationPageConfig';
import { buildItemMonetizationPageConfig } from '../../utils/buildItemMonetizationPageConfig';
import type { ParsedProductKey } from '../../utils/parseProductKeyBreakdownValue';
import parseProductKeyBreakdownValue from '../../utils/parseProductKeyBreakdownValue';

const getAvatarItemConfigureUrl = (key: ParsedProductKey) =>
  getUrlForItemType(key.subtype === 'bundle' ? Item.Bundle : Item.CatalogAsset, key.itemId) ??
  undefined;

const makeGetAvatarItemMetadata =
  () =>
  (breakdowns: RAQIV2BreakdownValue[]): Promise<ItemMetadata> => {
    const parsedKey = parseProductKeyBreakdownValue(breakdowns);
    if (!parsedKey) {
      return Promise.resolve({ itemId: 0, itemType: Item.CatalogAsset });
    }
    return Promise.resolve({
      itemId: parsedKey.itemId,
      url: getAvatarItemConfigureUrl(parsedKey),
      itemType: parsedKey.subtype === 'bundle' ? Item.Bundle : Item.CatalogAsset,
    });
  };

const getAvatarItemThumbnailUrl = async (
  universeId: number,
  key: ParsedProductKey,
): Promise<string> => {
  try {
    const { imageUrl } = await ThumbnailClient.getThumbnailImage(
      key.subtype === 'bundle' ? ThumbnailTypes.bundleThumbnail : ThumbnailTypes.assetThumbnail,
      key.itemId,
      ReturnPolicy.PlaceHolder,
    );
    return imageUrl || '';
  } catch {
    return '';
  }
};

const buildCommissionAvatarPageConfig = (
  universeId: number,
  client: ItemMonetizationApiClient,
  transactionPageUrl: string,
): CreatorAnalyticsEmbeddedSurfaceConfig => {
  const contentConfig: ItemMonetizationContentConfig = {
    productType: RAQIV2ProductType.CommissionAvatar,
    getItemType: (breakdowns) => {
      const parsedKey = parseProductKeyBreakdownValue(breakdowns);
      if (!parsedKey) {
        return Item.CatalogAsset;
      }
      return parsedKey.subtype === 'asset' ? Item.CatalogAsset : Item.Bundle;
    },
    tableKeysPrefix: 'AvatarItemsTable',
    topItemsHeadingKey: translationKey('Heading.TopAvatarItems', TranslationNamespace.Analytics),
    nameColumnTitleKey: translationKey('Label.AvatarItems', TranslationNamespace.Analytics),
    revenueTitleKey: translationKey('Title.TotalRevenue', TranslationNamespace.Analytics),
    salesTitleKey: translationKey('Title.TotalSales', TranslationNamespace.Analytics),
    makeGetItemMetadataForSummaryCard: makeGetAvatarItemMetadata,
    getItemsByIds: async (
      universeIdParam: number,
      keys: ParsedProductKey[],
      apiClient: ItemMonetizationApiClient,
    ) => {
      // for the keys, if asset we need to call asset details, if bundle we need to call bundle details
      // we need to first split the keys into assets and bundles
      const assets = keys.filter((key) => key.subtype === 'asset');
      const bundles = keys.filter((key) => key.subtype === 'bundle');
      const [assetsData, bundlesData] = await Promise.all([
        apiClient.getCachedAssetDetails(assets.map((key) => key.itemId)),
        apiClient.getCachedBundleDetails(bundles.map((key) => key.itemId)),
      ]);
      const data = [...assetsData.data, ...bundlesData.data];
      return data.map((d) => ({
        id: d.itemId,
        name: d.name,
        priceInRobux: d.price ?? 0,
      }));
    },
    getThumbnailUrl: async (key: ParsedProductKey) => {
      return getAvatarItemThumbnailUrl(universeId, key);
    },
    getConfigureUrl: (_universeIdParam, key) => getAvatarItemConfigureUrl(key),
  };

  return buildItemMonetizationPageConfig(universeId, client, transactionPageUrl, contentConfig);
};

export default buildCommissionAvatarPageConfig;
