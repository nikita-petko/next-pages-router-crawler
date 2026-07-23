import { translationKey } from '@modules/analytics-translations';
import { ChartType } from '@modules/charts-generic';
import {
  AnalyticsComponentType,
  RAQIV2PredefinedChartKey,
  ChartConfig,
  RAQIV2PredefinedTabbedChartKey,
  TabbedChartConfig,
} from '@modules/experience-analytics-shared';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { RAQIV2Metric } from '@rbx/creator-hub-analytics-config';

export const chartConfigStoreAssetSales = {
  type: AnalyticsComponentType.Chart,
  chartKey: RAQIV2PredefinedChartKey.StoreAssetSales,
  titleKey: translationKey('Title.TotalSales', TranslationNamespace.Analytics),
  definitionTooltipKey: translationKey('Description.TotalSales', TranslationNamespace.Analytics),
  metric: RAQIV2Metric.StoreTransactions,
  overrides: {},
  chartType: ChartType.Spline,
} as const satisfies ChartConfig;

export const chartConfigStoreAssetRevenue = {
  type: AnalyticsComponentType.Chart,
  chartKey: RAQIV2PredefinedChartKey.StoreAssetRevenue,
  titleKey: translationKey('Title.TotalRevenue', TranslationNamespace.Analytics),
  definitionTooltipKey: translationKey('Description.TotalRevenue', TranslationNamespace.Analytics),
  metric: RAQIV2Metric.StoreRevenue,
  overrides: {},
  chartType: ChartType.Spline,
} as const satisfies ChartConfig;

export const tabbedChartConfigStoreAssetMonetization = {
  type: AnalyticsComponentType.TabbedChart,
  chartKey: RAQIV2PredefinedTabbedChartKey.StoreAssetMonetization,
  titleKey: translationKey('Heading.RevenueAndSales', TranslationNamespace.StoreAnalytics),
  tabs: [
    {
      chart: chartConfigStoreAssetSales,
      tabLabel: translationKey('Title.TotalSales', TranslationNamespace.Analytics),
    },
    {
      chart: chartConfigStoreAssetRevenue,
      tabLabel: translationKey('Title.TotalRevenue', TranslationNamespace.Analytics),
    },
  ],
} as const satisfies TabbedChartConfig;
