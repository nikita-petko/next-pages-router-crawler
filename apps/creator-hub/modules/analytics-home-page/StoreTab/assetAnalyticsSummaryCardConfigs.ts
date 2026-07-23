import { RAQIV2Metric, RAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import AnalyticsComponentType from '@modules/analytics-configurations/AnalyticsComponentType';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import type { RAQIV2BreakdownValue } from '@modules/clients/analytics';
import type { AnalyticsSummaryCardConfig } from '@modules/experience-analytics-shared/constants/RAQIV2PredefinedSummaryCardConfig';
import RAQIV2SummaryCardType from '@modules/experience-analytics-shared/constants/RAQIV2SummaryCardType';
import RAQIV2SummaryType from '@modules/experience-analytics-shared/enums/RAQIV2SummaryType';
import type { ItemMetadata } from '@modules/experience-analytics-shared/types/RAQIV2SummaryCardShared';
import { Item } from '@modules/miscellaneous/common';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { creatorHub } from '@modules/miscellaneous/urls';

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

const getAssetUrl = (itemId: number) => creatorHub.creatorStore.getAssetUrl(itemId);

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
