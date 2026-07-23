import {
  RAQIV2Metric,
  RAQIV2Dimension,
  RAQIV2MetricGranularity,
} from '@rbx/creator-hub-analytics-config';
import AnalyticsComponentType from '@modules/analytics-configurations/AnalyticsComponentType';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import type { TAnalyticsMetricTableColumnConfig } from '@modules/experience-analytics-shared/constants/RAQIV2PredefinedTableColumnConfig';
import type { TAnalyticsSerializableTableConfig } from '@modules/experience-analytics-shared/constants/RAQIV2PredefinedTableConfig';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

export const tableColumnConfigItemSalesByExperienceCountDaily = {
  key: 'ItemSalesByExperienceCountDaily',
  metric: RAQIV2Metric.ItemTotalTransactionCount,
  overrides: {
    breakdown: { override: [RAQIV2Dimension.Universe] },
    granularity: { override: RAQIV2MetricGranularity.None },
    timeSpec: { override: { snapGranularity: RAQIV2MetricGranularity.OneDay } },
  },
} as const satisfies TAnalyticsMetricTableColumnConfig;

export const tableConfigItemSalesByExperience = {
  type: AnalyticsComponentType.Table,
  tableKey: 'ItemSalesByExperience',
  tableConfig: {
    stickyHeader: true,
    stickyFirstColumn: true,
    columnDivider: true,
    defaultActiveSort: RAQIV2Dimension.Universe,
  },
  dataColumns: [tableColumnConfigItemSalesByExperienceCountDaily],
  breakdowns: [RAQIV2Dimension.Universe],
  isTotalRowIncluded: false,
  titleKey: translationKey('Heading.SalesByExperience', TranslationNamespace.Analytics),
  definitionTooltipKey: translationKey('Description.Table.Sales', TranslationNamespace.Analytics),
} as const satisfies TAnalyticsSerializableTableConfig;
