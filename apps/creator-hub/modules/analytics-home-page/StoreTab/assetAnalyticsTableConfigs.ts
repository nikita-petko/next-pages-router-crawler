import {
  RAQIV2MetricGranularity,
  RAQIV2Metric,
  RAQIV2Dimension,
} from '@rbx/creator-hub-analytics-config';
import AnalyticsComponentType from '@modules/analytics-configurations/AnalyticsComponentType';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import type { TAnalyticsMetricTableColumnConfig } from '@modules/experience-analytics-shared/constants/RAQIV2PredefinedTableColumnConfig';
import type { TAnalyticsSerializableTableConfig } from '@modules/experience-analytics-shared/constants/RAQIV2PredefinedTableConfig';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

enum StoreTableKey {
  StoreTransactionCount = 'StoreTransactionCount',
  StoreRevenueAmount = 'StoreRevenueAmount',
}

export const tableColumnConfigStoreTransactionCount = {
  key: StoreTableKey.StoreTransactionCount,
  metric: RAQIV2Metric.StoreTransactions,
  overrides: {
    breakdown: {
      override: [
        RAQIV2Dimension.StoreItemId,
        RAQIV2Dimension.StoreItemType,
        RAQIV2Dimension.PurchaseStatus,
      ],
    },
    granularity: { override: RAQIV2MetricGranularity.None },
  },
} as const satisfies TAnalyticsMetricTableColumnConfig;

export const tableColumnConfigStoreRevenueAmount = {
  key: StoreTableKey.StoreRevenueAmount,
  metric: RAQIV2Metric.StoreRevenue,
  overrides: {
    breakdown: {
      override: [
        RAQIV2Dimension.StoreItemId,
        RAQIV2Dimension.StoreItemType,
        RAQIV2Dimension.PurchaseStatus,
      ],
    },
    granularity: { override: RAQIV2MetricGranularity.None },
  },
} as const satisfies TAnalyticsMetricTableColumnConfig;

export const tableConfigStoreAssetTransactions = {
  type: AnalyticsComponentType.Table,
  tableKey: 'StoreAssetTransactions',
  tableConfig: {
    stickyHeader: true,
    stickyFirstColumn: true,
    columnDivider: true,
    defaultActiveSort: RAQIV2Dimension.StoreItemId,
  },
  dataColumns: [tableColumnConfigStoreTransactionCount, tableColumnConfigStoreRevenueAmount],
  breakdowns: [
    RAQIV2Dimension.StoreItemId,
    RAQIV2Dimension.StoreItemType,
    RAQIV2Dimension.PurchaseStatus,
  ],
  isTotalRowIncluded: false,
  titleKey: translationKey('Heading.StoreItems', TranslationNamespace.StoreAnalytics),
} as const satisfies TAnalyticsSerializableTableConfig;
