import {
  CreatorAnalyticsEmbeddedSurfaceConfig,
  ItemMetadata,
} from '@modules/experience-analytics-shared';
import { translationKey } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { dashboard } from '@modules/miscellaneous/common/urls/creatorHub';
import { Item } from '@modules/miscellaneous/common';
import { ThumbnailTypes } from '@rbx/thumbnails';
import { RAQIV2ProductType } from '@rbx/creator-hub-analytics-config';
import { RAQIV2BreakdownValue } from '@modules/clients/analytics';
import { ItemMonetizationApiClient } from '../../context/ItemMonetizationClientProvider';
import {
  ItemMonetizationContentConfig,
  buildItemMonetizationPageConfig,
} from '../../utils/buildItemMonetizationPageConfig';
import parseProductKeyBreakdownValue, {
  ParsedProductKey,
} from '../../utils/parseProductKeyBreakdownValue';

const getGamePassConfigureUrl = dashboard.getConfigurePassUrl;

const makeGetGamePassItemMetadata =
  (universeIdForUrl: number) =>
  (breakdowns: RAQIV2BreakdownValue[]): Promise<ItemMetadata> => {
    const passId = parseProductKeyBreakdownValue(breakdowns)?.itemId;
    return Promise.resolve({
      itemId: passId ?? 0,
      url: passId ? getGamePassConfigureUrl(universeIdForUrl, passId) : undefined,
      itemType: Item.GamePass,
    });
  };

const getGamePassThumbnailUrl = async (
  client: ItemMonetizationApiClient,
  key: ParsedProductKey,
): Promise<string> => client.getThumbnailImageUrl(ThumbnailTypes.gamePassIcon, key.itemId);

const buildGamePassPageConfig = (
  universeId: number,
  client: ItemMonetizationApiClient,
  transactionPageUrl: string,
  isGamePassBonusPromotionsTableEnabled: boolean = false,
): CreatorAnalyticsEmbeddedSurfaceConfig => {
  const contentConfig: ItemMonetizationContentConfig = {
    productType: RAQIV2ProductType.GamePass,
    getItemType: () => Item.GamePass,
    tableKeysPrefix: 'PassesTable',
    topItemsHeadingKey: translationKey('Heading.TopPasses', TranslationNamespace.Analytics),
    nameColumnTitleKey: translationKey('Label.GamePass', TranslationNamespace.Analytics),
    revenueTitleKey: translationKey('Title.TotalRevenue', TranslationNamespace.Analytics),
    salesTitleKey: translationKey('Title.TotalSales', TranslationNamespace.Analytics),
    makeGetItemMetadataForSummaryCard: makeGetGamePassItemMetadata,
    getItemsByIds: async (
      universeIdParam: number,
      keys: ParsedProductKey[],
      apiClient: ItemMonetizationApiClient,
    ) => {
      const { data } = await apiClient.getCachedGamePasses(
        universeIdParam,
        keys.map((k) => k.itemId),
      );
      return data.map((p) => ({
        id: p.gamePassId,
        name: p.name,
        priceInRobux: p.defaultPriceInRobux ?? 0,
      }));
    },
    getThumbnailUrl: (key: ParsedProductKey) => getGamePassThumbnailUrl(client, key),
    getConfigureUrl: (universeIdParam, key) => getGamePassConfigureUrl(universeIdParam, key.itemId),
  };

  return buildItemMonetizationPageConfig(
    universeId,
    client,
    transactionPageUrl,
    contentConfig,
    isGamePassBonusPromotionsTableEnabled,
  );
};

export default buildGamePassPageConfig;
