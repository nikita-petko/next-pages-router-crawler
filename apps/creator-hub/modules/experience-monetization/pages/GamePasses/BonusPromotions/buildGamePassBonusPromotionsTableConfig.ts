import {
  RAQIV2Dimension,
  RAQIV2Metric,
  RAQIV2MetricGranularity,
} from '@rbx/creator-hub-analytics-config';
import AnalyticsComponentType from '@modules/analytics-configurations/AnalyticsComponentType';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import type {
  TAnalyticsMetricTableColumnConfig,
  TAnalyticsCustomTableColumnConfig,
} from '@modules/experience-analytics-shared/constants/RAQIV2PredefinedTableColumnConfig';
import type { TAnalyticsNonSerializableTableConfig } from '@modules/experience-analytics-shared/constants/RAQIV2PredefinedTableConfig';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import type { ItemMonetizationApiClient } from '../../../context/ItemMonetizationClientProvider';

const tableKeysPrefix = 'BonusPromotionsTable';

const buildGamePassBonusPromotionsTableConfig = (
  universeId: number,
  client: ItemMonetizationApiClient,
  getOverviewColumn: (
    universeIdParam: number,
    clientParam: ItemMonetizationApiClient,
  ) => TAnalyticsCustomTableColumnConfig,
) => {
  const impressionCountColumn = {
    key: `${tableKeysPrefix}${RAQIV2Metric.BonusPromotionsImpressionCount}`,
    metric: RAQIV2Metric.BonusPromotionsImpressionCount,
    overrides: {
      granularity: { override: RAQIV2MetricGranularity.None },
      breakdown: {
        override: [RAQIV2Dimension.GamePassId],
      },
      limit: {
        override: 500,
      },
    },
    sort: {
      isFixedOrder: true,
      isServerSideSorting: true,
    },
  } as const satisfies TAnalyticsMetricTableColumnConfig;

  const awardedCountColumn = {
    key: `${tableKeysPrefix}${RAQIV2Metric.BonusPromotionsAwardedCount}`,
    metric: RAQIV2Metric.BonusPromotionsAwardedCount,
    overrides: {
      granularity: { override: RAQIV2MetricGranularity.None },
      breakdown: {
        override: [RAQIV2Dimension.GamePassId],
      },
      limit: {
        override: 500,
      },
    },
    sort: {
      isFixedOrder: true,
      isServerSideSorting: true,
    },
  } as const satisfies TAnalyticsMetricTableColumnConfig;

  const gameJoinCountColumn = {
    key: `${tableKeysPrefix}${RAQIV2Metric.BonusPromotionsGameJoinCount}`,
    metric: RAQIV2Metric.BonusPromotionsGameJoinCount,
    overrides: {
      granularity: { override: RAQIV2MetricGranularity.None },
      breakdown: {
        override: [RAQIV2Dimension.GamePassId],
      },
      limit: {
        override: 500,
      },
    },
    sort: {
      isFixedOrder: true,
      isServerSideSorting: true,
    },
  } as const satisfies TAnalyticsMetricTableColumnConfig;

  return {
    type: AnalyticsComponentType.Table,
    titleKey: translationKey('Heading.ItemsOnBuyRobuxPage', TranslationNamespace.Analytics),
    definitionTooltipKey: translationKey(
      'Description.ItemsOnBuyRobuxPage',
      TranslationNamespace.Analytics,
    ),
    tableConfig: {
      stickyHeader: true,
      stickyFirstColumn: true,
      columnDivider: false,
      defaultActiveSort: `${tableKeysPrefix}${RAQIV2Metric.BonusPromotionsImpressionCount}`,
    },
    breakdowns: [RAQIV2Dimension.GamePassId],
    hideBreakdownLabelColumns: true,
    pagination: { pageSizeOptions: [5, 10, 20, 50], initialPageSize: 10 },
    dataColumns: [
      getOverviewColumn(universeId, client),
      impressionCountColumn,
      awardedCountColumn,
      gameJoinCountColumn,
    ],
  } as const satisfies TAnalyticsNonSerializableTableConfig;
};

export default buildGamePassBonusPromotionsTableConfig;
