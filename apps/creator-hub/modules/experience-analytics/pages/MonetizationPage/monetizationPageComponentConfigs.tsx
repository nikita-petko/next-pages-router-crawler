import React from 'react';
import {
  AnalyticsConfigChart,
  GenericAnalyticsLayoutItem,
  AnalyticsComponentType,
  ArbitraryComponentConfig,
  RAQIV2ChartContext,
  RAQIV2SpecialLayoutType,
  ChartConfig,
  RAQIV2SummaryType,
  MonetizationBreakglassBanner,
} from '@modules/experience-analytics-shared';
import { ChartType, getCurrentDate, subHours } from '@modules/charts-generic';
import {
  RAQIV2Dimension,
  RAQIV2Metric,
  RAQIV2MetricGranularity,
} from '@rbx/creator-hub-analytics-config';
import { translationKey } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useRouter } from 'next/router';
import RegionalPricingPromotionBanner from '@modules/regional-pricing/components/RegionalPricingPromotionBanner/OverviewRegionalPricingPromotionBanner';
import MonetizationSubpageDiscoveryCards from './components/MonetizationSubpageDiscoveryCards';

export const chartConfigHourlyRevenueBySource = {
  type: AnalyticsComponentType.Chart,
  titleKey: translationKey('Title.RobuxHourly', TranslationNamespace.Analytics),
  definitionTooltipKey: translationKey('Description.RobuxHourly', TranslationNamespace.Analytics),
  metric: RAQIV2Metric.ItemMonetizationRevenue,
  overrides: {
    breakdown: {
      override: [RAQIV2Dimension.ProductType],
    },
    granularity: { override: RAQIV2MetricGranularity.OneHour },
    filter: {
      override: [], // cannot filter the realtime revenue
    },
  },
  summarySpec: {
    totalSummaryTypes: [{ type: RAQIV2SummaryType.Total }],
    perBreakdownSummaryTypes: [{ type: RAQIV2SummaryType.Total }],
    aggregatedBreakdownSummaryTypes: [],
  },
  chartType: ChartType.Spline,
} as const satisfies ChartConfig;

export const arbitraryComponentConfigMonetizationHourlyChart = {
  type: AnalyticsComponentType.NonGeneric,
  metrics: [RAQIV2Metric.ItemMonetizationRevenue],
  renderer: {
    type: 'withChartContext',
    render: (chartContext, onSelectChartRegion) => {
      // Handle MonetizationHourlyChart
      // TODO(gperkins@20240708): DSA-2650 -- Add date range override to chartSpec, remove non-generic component
      const endTime = getCurrentDate();
      const startTime = subHours(endTime, 72);

      const hourlyContext: RAQIV2ChartContext = {
        ...chartContext,
        timeSpec: { startTime, endTime },
        timeAxisBounds: [startTime, endTime],
      };

      return (
        <GenericAnalyticsLayoutItem layout={RAQIV2SpecialLayoutType.FullWidthLayout}>
          <AnalyticsConfigChart
            chartKeyOrConfig={chartConfigHourlyRevenueBySource}
            chartContext={hourlyContext}
            onSelectChartRegion={onSelectChartRegion}
          />
        </GenericAnalyticsLayoutItem>
      );
    },
  },
} as const satisfies ArbitraryComponentConfig;

export const arbitraryComponentConfigRegionalPricingBanner = {
  type: AnalyticsComponentType.NonGeneric,
  metrics: [],
  renderer: {
    type: 'isolated',
    render: function RegionalPricingPromotionBannerInContext() {
      return <RegionalPricingPromotionBanner universeId={Number(useRouter().query.id)} />;
    },
  },
} as const satisfies ArbitraryComponentConfig;

export const arbitraryComponentConfigMonetizationSubpageSummaryCards = {
  type: AnalyticsComponentType.NonGeneric,
  metrics: [],
  renderer: {
    type: 'isolated',
    render: () => {
      return <MonetizationSubpageDiscoveryCards />;
    },
  },
} as const satisfies ArbitraryComponentConfig;

export const arbitraryComponentConfigMonetizationBreakglassBanner = {
  type: AnalyticsComponentType.NonGeneric,
  metrics: [],
  renderer: {
    type: 'isolated',
    render: () => {
      return <MonetizationBreakglassBanner />;
    },
  },
} as const satisfies ArbitraryComponentConfig;
