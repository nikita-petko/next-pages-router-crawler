import { translationKey } from '@modules/analytics-translations';
import { RAQIV2BreakdownValue } from '@modules/clients/analytics';
import {
  AnalyticsComponentType,
  RAQIV2SummaryCardType,
  RAQIV2SummaryType,
  ItemMetadata,
  AnalyticsSummaryCardConfig,
} from '@modules/experience-analytics-shared';
import { urls, Item } from '@modules/miscellaneous/common';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { RAQIV2Metric, RAQIV2Dimension } from '@rbx/creator-hub-analytics-config';

export const getLibraryAssetMetadata = (
  breakdowns: RAQIV2BreakdownValue[],
): Promise<ItemMetadata> => {
  const rawValue =
    breakdowns.find((breakdown) => breakdown.dimension === RAQIV2Dimension.StoreItemId)?.value ??
    '';
  const parsed = Number.parseInt(rawValue, 10);
  const itemId = Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  return Promise.resolve({ itemId, itemType: Item.LibraryAsset });
};

enum StoreSummaryCardKey {
  StoreTotalSold = 'StoreTotalSold',
  StoreTotalGross = 'StoreTotalGross',
}

const getAssetUrl = (itemId: number) => urls.creatorHub.creatorStore.getAssetUrl(itemId);

export const summaryCardConfigStoreTotalSold = {
  type: AnalyticsComponentType.SummaryCard,
  summaryKey: StoreSummaryCardKey.StoreTotalSold,
  cardType: RAQIV2SummaryCardType.Item,
  getItemMetadata: async (breakdowns: RAQIV2BreakdownValue[]) => {
    const { itemId } = await getLibraryAssetMetadata(breakdowns);
    return {
      itemId,
      url: itemId ? getAssetUrl(itemId) : undefined,
      itemType: Item.LibraryAsset,
    };
  },
  metric: RAQIV2Metric.StoreTransactions,
  summaryType: { type: RAQIV2SummaryType.Total },
  overrides: {
    breakdown: {
      override: [RAQIV2Dimension.StoreItemId],
    },
  },
  label: {
    key: translationKey('Label.TopSellingItem', TranslationNamespace.StoreAnalytics),
    type: 'dateAsStartDate',
  },
  fullWidth: true,
} as const satisfies AnalyticsSummaryCardConfig;

export const summaryCardConfigStoreTotalGross = {
  type: AnalyticsComponentType.SummaryCard,
  summaryKey: StoreSummaryCardKey.StoreTotalGross,
  cardType: RAQIV2SummaryCardType.Item,
  getItemMetadata: async (breakdowns: RAQIV2BreakdownValue[]) => {
    const { itemId } = await getLibraryAssetMetadata(breakdowns);
    return {
      itemId,
      url: itemId ? getAssetUrl(itemId) : undefined,
      itemType: Item.LibraryAsset,
    };
  },
  metric: RAQIV2Metric.StoreRevenue,
  summaryType: { type: RAQIV2SummaryType.Total },
  overrides: {
    breakdown: {
      override: [RAQIV2Dimension.StoreItemId],
    },
  },
  label: {
    key: translationKey('Label.TopGrossingItem', TranslationNamespace.StoreAnalytics),
    type: 'dateAsStartDate',
  },
  fullWidth: true,
} as const satisfies AnalyticsSummaryCardConfig;
