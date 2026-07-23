import { RAQIV2ProductType } from '@rbx/creator-hub-analytics-config';
import { ThumbnailTypes } from '@rbx/thumbnails';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import type { RAQIV2BreakdownValue } from '@modules/clients/analytics';
import type { CreatorAnalyticsEmbeddedSurfaceConfig } from '@modules/experience-analytics-shared/types/RAQIV2PageConfig';
import type { ItemMetadata } from '@modules/experience-analytics-shared/types/RAQIV2SummaryCardShared';
import { Item } from '@modules/miscellaneous/common';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { dashboard } from '@modules/miscellaneous/urls/creatorHub';
import type { ItemMonetizationApiClient } from '../../context/ItemMonetizationClientProvider';
import type { ItemMonetizationContentConfig } from '../../utils/buildItemMonetizationPageConfig';
import { buildItemMonetizationPageConfig } from '../../utils/buildItemMonetizationPageConfig';
import type { ParsedProductKey } from '../../utils/parseProductKeyBreakdownValue';
import parseProductKeyBreakdownValue from '../../utils/parseProductKeyBreakdownValue';

const getDevProductConfigureUrl = dashboard.getConfigureDeveloperProductUrl;

const makeGetDevProductItemMetadata =
  (universeIdForUrl: number, client: ItemMonetizationApiClient) =>
  async (breakdowns: RAQIV2BreakdownValue[]): Promise<ItemMetadata> => {
    const productId = parseProductKeyBreakdownValue(breakdowns)?.itemId ?? 0;
    let iconImageAssetId = 0;
    try {
      const { data } = await client.getCachedDeveloperProducts(universeIdForUrl, [productId]);
      iconImageAssetId = data[0]?.iconImageAssetId ?? 0;
    } catch {
      // Fallback to 0 if the product is not found
    }
    return {
      itemId: productId,
      url: productId ? getDevProductConfigureUrl(universeIdForUrl, productId) : undefined,
      itemType: Item.DeveloperProduct,
      iconImageAssetId,
    };
  };

const getDevProductThumbnailUrl = async (
  universeId: number,
  client: ItemMonetizationApiClient,
  key: ParsedProductKey,
): Promise<string> => {
  try {
    const { data } = await client.getCachedDeveloperProducts(universeId, [key.itemId]);
    const iconImageAssetId = data[0]?.iconImageAssetId ?? 0;
    return client.getThumbnailImageUrl(ThumbnailTypes.assetThumbnail, iconImageAssetId);
  } catch {
    return '';
  }
};

const buildDevProductsPageConfig = (
  universeId: number,
  client: ItemMonetizationApiClient,
  transactionPageUrl: string,
): CreatorAnalyticsEmbeddedSurfaceConfig => {
  const contentConfig: ItemMonetizationContentConfig = {
    productType: RAQIV2ProductType.DevProduct,
    getItemType: () => Item.DeveloperProduct,
    tableKeysPrefix: 'DevProductsTable',
    topItemsHeadingKey: translationKey(
      'Heading.TopDeveloperProducts',
      TranslationNamespace.Analytics,
    ),
    nameColumnTitleKey: translationKey('Label.DeveloperProducts', TranslationNamespace.Analytics),
    revenueTitleKey: translationKey('Title.TotalRevenue', TranslationNamespace.Analytics),
    salesTitleKey: translationKey('Title.TotalSales', TranslationNamespace.Analytics),
    makeGetItemMetadataForSummaryCard: (universeIdParam: number) =>
      makeGetDevProductItemMetadata(universeIdParam, client),
    getItemsByIds: async (
      universeIdParam: number,
      keys: ParsedProductKey[],
      apiClient: ItemMonetizationApiClient,
    ) => {
      const { data } = await apiClient.getCachedDeveloperProducts(
        universeIdParam,
        keys.map((k) => k.itemId),
      );
      return data.map((p) => ({
        id: p.productId,
        name: p.name,
        priceInRobux: p.defaultPriceInRobux ?? 0,
      }));
    },
    getThumbnailUrl: async (key: ParsedProductKey) => {
      return getDevProductThumbnailUrl(universeId, client, key);
    },
    getConfigureUrl: (universeIdParam, key) =>
      getDevProductConfigureUrl(universeIdParam, key.itemId),
  };

  return buildItemMonetizationPageConfig(
    universeId,
    client,
    transactionPageUrl,
    contentConfig,
    365 * 2,
  );
};

export default buildDevProductsPageConfig;
