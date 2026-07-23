import {
  RAQIV2MetricGranularity,
  RAQIV2Metric,
  RAQIV2Dimension,
} from '@rbx/creator-hub-analytics-config';
import AnalyticsComponentType from '@modules/analytics-configurations/AnalyticsComponentType';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { ChartType } from '@modules/charts-generic/charts/types/ChartTypes';
import type { ChartConfig } from '@modules/experience-analytics-shared/constants/RAQIV2PredefinedChartConfig';
import RAQIV2PredefinedChartKey from '@modules/experience-analytics-shared/constants/RAQIV2PredefinedChartKey';
import RAQIV2PredefinedTabbedChartKey from '@modules/experience-analytics-shared/constants/RAQIV2PredefinedTabbedChartKey';
import type { TabbedChartConfig } from '@modules/experience-analytics-shared/types/RAQIV2TabbedChartConfig';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

export const chartConfigItemPurchaserAge = {
  type: AnalyticsComponentType.Chart,
  chartKey: RAQIV2PredefinedChartKey.ItemPurchaserAge,
  metric: RAQIV2Metric.ItemTotalTransactionCount,
  chartType: ChartType.Bar,
  titleKey: translationKey('Title.Age', TranslationNamespace.Analytics),
  definitionTooltipKey: translationKey(
    'Description.ItemPurchaserAge',
    TranslationNamespace.Analytics,
  ),
  overrides: {
    breakdown: { override: [RAQIV2Dimension.AgeGroupV2] },
    granularity: { override: RAQIV2MetricGranularity.None },
    timeSpec: { override: { snapGranularity: RAQIV2MetricGranularity.OneDay } },
  },
  sort: {
    byBreakdownTotal: true,
  },
  labelDataAsPercent: true,
  chartHeight: 230,
} as const satisfies ChartConfig;

export const chartConfigItemPurchaserDemographics = {
  type: AnalyticsComponentType.Chart,
  chartKey: RAQIV2PredefinedChartKey.ItemPurchaserDemographics,
  metric: RAQIV2Metric.ItemTotalTransactionCount,
  chartType: ChartType.Map,
  titleKey: translationKey('Title.Country', TranslationNamespace.Analytics),
  definitionTooltipKey: translationKey(
    'Description.PurchaserDemographics',
    TranslationNamespace.Analytics,
  ),
  overrides: {
    breakdown: { override: [RAQIV2Dimension.Country] },
    granularity: { override: RAQIV2MetricGranularity.None },
    timeSpec: { override: { snapGranularity: RAQIV2MetricGranularity.OneDay } },
  },
  sort: {
    byBreakdownTotal: true,
  },
  breakdownLimit: 10,
  labelDataAsPercent: true,
  mapLegendSplits: [2, 4, 8, 16],
} as const satisfies ChartConfig;

export const chartConfigItemPurchaserGender = {
  type: AnalyticsComponentType.Chart,
  chartKey: RAQIV2PredefinedChartKey.ItemPurchaserGender,
  metric: RAQIV2Metric.ItemTotalTransactionCount,
  chartType: ChartType.Bar,
  titleKey: translationKey('Title.Gender', TranslationNamespace.Analytics),
  definitionTooltipKey: translationKey(
    'Description.ItemPurchaserGender',
    TranslationNamespace.Analytics,
  ),
  overrides: {
    breakdown: { override: [RAQIV2Dimension.Gender] },
    granularity: { override: RAQIV2MetricGranularity.None },
    timeSpec: { override: { snapGranularity: RAQIV2MetricGranularity.OneDay } },
  },
  sort: {
    byBreakdownTotal: true,
  },
  labelDataAsPercent: true,
  chartHeight: 180,
} as const satisfies ChartConfig;

export const chartConfigItemPurchasePlatform = {
  type: AnalyticsComponentType.Chart,
  chartKey: RAQIV2PredefinedChartKey.ItemPurchasePlatform,
  metric: RAQIV2Metric.ItemTotalTransactionCount,
  chartType: ChartType.Bar,
  titleKey: translationKey('Title.Platform', TranslationNamespace.Analytics),
  definitionTooltipKey: translationKey(
    'Description.ItemPurchasePlatform',
    TranslationNamespace.Analytics,
  ),
  overrides: {
    breakdown: { override: [RAQIV2Dimension.Platform] },
    granularity: { override: RAQIV2MetricGranularity.None },
    timeSpec: { override: { snapGranularity: RAQIV2MetricGranularity.OneDay } },
  },
  sort: {
    byBreakdownTotal: true,
  },
  labelDataAsPercent: true,
  chartHeight: 480,
} as const satisfies ChartConfig;

export const chartConfigItemMarketplaceVersusInExperience = {
  type: AnalyticsComponentType.Chart,
  chartKey: RAQIV2PredefinedChartKey.ItemMarketplaceVersusInExperience,
  metric: RAQIV2Metric.ItemTotalTransactionCount,
  chartType: ChartType.Bar,
  titleKey: translationKey('Title.MarketplacevsInExperienceSales', TranslationNamespace.Analytics),
  definitionTooltipKey: translationKey(
    'Description.MarketplacevsInExperienceSales',
    TranslationNamespace.Analytics,
  ),
  overrides: {
    breakdown: { override: [RAQIV2Dimension.SaleLocation] },
    granularity: { override: RAQIV2MetricGranularity.None },
    timeSpec: { override: { snapGranularity: RAQIV2MetricGranularity.OneDay } },
  },
  sort: {
    byBreakdownTotal: true,
  },
  labelDataAsPercent: true,
  chartHeight: 230,
} as const satisfies ChartConfig;

export const chartConfigItemRevenue = {
  type: AnalyticsComponentType.Chart,
  chartKey: RAQIV2PredefinedChartKey.ItemRevenue,
  titleKey: translationKey('Title.TotalRevenue', TranslationNamespace.Analytics),
  metric: RAQIV2Metric.ItemTotalCreatorEarning,
  overrides: {},
  chartType: ChartType.Spline,
} as const satisfies ChartConfig;

export const chartConfigItemSales = {
  type: AnalyticsComponentType.Chart,
  chartKey: RAQIV2PredefinedChartKey.ItemSales,
  titleKey: translationKey('Title.TotalSales', TranslationNamespace.Analytics),
  metric: RAQIV2Metric.ItemTotalTransactionCount,
  overrides: {},
  chartType: ChartType.Spline,
} as const satisfies ChartConfig;

export const tabbedChartConfigItemRevenueAndSales = {
  type: AnalyticsComponentType.TabbedChart,
  chartKey: RAQIV2PredefinedTabbedChartKey.ItemRevenueAndSales,
  titleKey: translationKey('Title.RevenueAndSales', TranslationNamespace.Analytics),
  tabs: [
    {
      chart: chartConfigItemRevenue,
      tabLabel: translationKey('Title.TotalRevenue', TranslationNamespace.Analytics),
    },
    {
      chart: chartConfigItemSales,
      tabLabel: translationKey('Title.TotalSales', TranslationNamespace.Analytics),
    },
  ],
} as const satisfies TabbedChartConfig;
