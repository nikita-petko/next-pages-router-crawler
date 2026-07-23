import {
  AnalyticsComponentType,
  TAnalyticsSerializableTableConfig,
  TAnalyticsMetricTableColumnConfig,
} from '@modules/experience-analytics-shared';
import {
  RAQIV2Dimension,
  RAQIV2Metric,
  RAQIV2MetricGranularity,
} from '@rbx/creator-hub-analytics-config';
import {
  CommerceProductEventsTitleTranslationKey,
  CommerceUniqueProductEventsDefinitionTooltipKey,
} from './constants';

export const commerceEventsTableConfig: TAnalyticsSerializableTableConfig = {
  type: AnalyticsComponentType.Table,
  tableKey: 'CommerceEvents',
  breakdowns: [RAQIV2Dimension.CommerceProductId],
  tableConfig: {
    stickyHeader: true,
    stickyFirstColumn: true,
    columnDivider: true,
    firstDataRowIsSummary: false,
    hover: true,
  },
  dataColumns: [
    {
      key: 'CommerceClicks',
      metric: RAQIV2Metric.CommerceClicks,
      overrides: {
        breakdown: {
          override: [RAQIV2Dimension.CommerceProductId],
        },
        granularity: { override: RAQIV2MetricGranularity.None },
      },
    } as const satisfies TAnalyticsMetricTableColumnConfig,
    {
      key: 'CommerceUniqueClicks',
      metric: RAQIV2Metric.CommerceUniqueClicks,
      overrides: {
        breakdown: {
          override: [RAQIV2Dimension.CommerceProductId],
        },
        granularity: { override: RAQIV2MetricGranularity.None },
      },
    } as const satisfies TAnalyticsMetricTableColumnConfig,
    {
      key: 'CommerceCheckouts',
      metric: RAQIV2Metric.CommerceCheckouts,
      overrides: {
        breakdown: {
          override: [RAQIV2Dimension.CommerceProductId],
        },
        granularity: { override: RAQIV2MetricGranularity.None },
      },
    } as const satisfies TAnalyticsMetricTableColumnConfig,
    {
      key: 'CommerceUniqueCheckouts',
      metric: RAQIV2Metric.CommerceUniqueCheckouts,
      overrides: {
        breakdown: {
          override: [RAQIV2Dimension.CommerceProductId],
        },
        granularity: { override: RAQIV2MetricGranularity.None },
      },
    } as const satisfies TAnalyticsMetricTableColumnConfig,
    {
      key: 'CommerceOrders',
      metric: RAQIV2Metric.CommerceOrders,
      overrides: {
        breakdown: {
          override: [RAQIV2Dimension.CommerceProductId],
        },
        granularity: { override: RAQIV2MetricGranularity.None },
      },
    } as const satisfies TAnalyticsMetricTableColumnConfig,
  ],
  isTotalRowIncluded: false,
  titleKey: CommerceProductEventsTitleTranslationKey,
  definitionTooltipKey: CommerceUniqueProductEventsDefinitionTooltipKey,
};

export default {
  commerceEventsTableConfig,
};
