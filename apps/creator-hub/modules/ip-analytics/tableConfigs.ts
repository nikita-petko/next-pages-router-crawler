import {
  RAQIV2Dimension,
  RAQIV2Metric,
  RAQIV2MetricGranularity,
} from '@rbx/creator-hub-analytics-config';
import AnalyticsComponentType from '@modules/analytics-configurations/AnalyticsComponentType';
import type { TAnalyticsMetricTableColumnConfig } from '@modules/experience-analytics-shared/constants/RAQIV2PredefinedTableColumnConfig';
import type { TAnalyticsSerializableTableConfig } from '@modules/experience-analytics-shared/constants/RAQIV2PredefinedTableConfig';

const tableColumnConfigIphEarningsRobux = {
  key: 'IphEarningsRobux',
  metric: RAQIV2Metric.IphEarningsRobux,
  overrides: {
    granularity: { override: RAQIV2MetricGranularity.None },
  },
} as const satisfies TAnalyticsMetricTableColumnConfig;

const tableColumnConfigIphTransactionCount = {
  key: 'IphTransactionCount',
  metric: RAQIV2Metric.IphTransactionCount,
  overrides: {
    granularity: { override: RAQIV2MetricGranularity.None },
  },
} as const satisfies TAnalyticsMetricTableColumnConfig;

export const tableConfigIphEarnings = {
  type: AnalyticsComponentType.Table,
  tableKey: 'IphEarnings',
  tableConfig: {
    stickyHeader: true,
    stickyFirstColumn: false,
    columnDivider: false,
  },
  dataColumns: [tableColumnConfigIphEarningsRobux, tableColumnConfigIphTransactionCount],
  breakdowns: [
    RAQIV2Dimension.IpFamilyName,
    RAQIV2Dimension.LicenseName,
    RAQIV2Dimension.EarningsType,
  ],
  isTotalRowIncluded: true,
} as const satisfies TAnalyticsSerializableTableConfig;
