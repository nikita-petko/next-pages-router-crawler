import React from 'react';
import type { SelectionCallback } from '@rbx/analytics-ui';
import { RAQIV2Metric, RAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import AnalyticsComponentType from '@modules/analytics-configurations/AnalyticsComponentType';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { ChartType } from '@modules/charts-generic/charts/types/ChartTypes';
import AnalyticsConfigChart from '@modules/experience-analytics-shared/components/RAQIV2/AnalyticsConfigChart';
import type { ArbitraryComponentConfig } from '@modules/experience-analytics-shared/components/RAQIV2/layout/AnalyticsArbitraryComponent';
import type { ChartConfig } from '@modules/experience-analytics-shared/constants/RAQIV2PredefinedChartConfig';
import RAQIV2SummaryType from '@modules/experience-analytics-shared/enums/RAQIV2SummaryType';
import type RAQIV2ChartContext from '@modules/experience-analytics-shared/types/RAQIV2ChartContext';
import { ChartOverlay } from '@modules/experience-analytics-shared/types/RAQIV2ChartSpec';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import CreatorRewardsTimeSeriesChartExporter from './CreatorRewardsTimeSeriesChartExporter';

export const chartConfigCreatorRewardsEarnedRobux = {
  type: AnalyticsComponentType.Chart,
  titleKey: translationKey('Title.CreatorRewardsEarnedRobux', TranslationNamespace.Analytics),
  definitionTooltipKey: translationKey(
    'Description.CreatorRewardsEarnedRobux',
    TranslationNamespace.Analytics,
  ),
  metric: RAQIV2Metric.PayoutRobuxV2,
  overrides: {
    breakdown: {
      override: [RAQIV2Dimension.CreatorRewardsDailySource],
    },
  },
  chartType: ChartType.Spline,
  summarySpec: {
    totalSummaryTypes: [{ type: RAQIV2SummaryType.Total }, { type: RAQIV2SummaryType.Average }],
    perBreakdownSummaryTypes: [{ type: RAQIV2SummaryType.Total }],
    aggregatedBreakdownSummaryTypes: [],
  },
} as const satisfies ChartConfig;

// Custom component config that wraps the chart config with exporterClass prop
export const componentConfigCreatorRewardsEarnedRobux = {
  type: AnalyticsComponentType.NonGeneric as const,
  metrics: [RAQIV2Metric.PayoutRobuxV2],
  renderer: {
    type: 'withChartContext' as const,
    render: (
      chartContext: RAQIV2ChartContext,
      onSelectChartRegion: null | SelectionCallback<number>,
    ): React.ReactNode => {
      return React.createElement(AnalyticsConfigChart, {
        chartKeyOrConfig: chartConfigCreatorRewardsEarnedRobux,
        chartContext,
        onSelectChartRegion,
        customExporter: CreatorRewardsTimeSeriesChartExporter,
      } as React.ComponentProps<typeof AnalyticsConfigChart> & {
        customExporter: typeof CreatorRewardsTimeSeriesChartExporter;
      });
    },
  },
} as const satisfies ArbitraryComponentConfig;

export const chartConfigCreatorRewardsQualifiedSpenderPlays = {
  type: AnalyticsComponentType.Chart,
  titleKey: translationKey(
    'Title.CreatorRewardsQualifiedSpenderPlays',
    TranslationNamespace.Analytics,
  ),
  definitionTooltipKey: translationKey(
    'Description.CreatorRewardsQualifiedSpenderPlays',
    TranslationNamespace.Analytics,
  ),
  metric: RAQIV2Metric.SourceCount,
  overrides: {
    filter: {
      override: [
        {
          dimension: RAQIV2Dimension.CreatorRewardsDailySource,
          values: ['DailyEngagements'],
        },
      ],
    },
  },
  chartType: ChartType.Spline,
  overlays: [],
} as const satisfies ChartConfig;

export const chartConfigCreatorRewardsQualifiedSpenderRatio = {
  type: AnalyticsComponentType.Chart,
  titleKey: translationKey(
    'Title.CreatorRewardsQualifiedSpenderRatio',
    TranslationNamespace.Analytics,
  ),
  definitionTooltipKey: translationKey(
    'Description.CreatorRewardsQualifiedSpenderRatio',
    TranslationNamespace.Analytics,
  ),
  metric: RAQIV2Metric.SourceCountRatioKpi,
  overrides: {
    filter: {
      override: [
        {
          dimension: RAQIV2Dimension.CreatorRewardsDailySource,
          values: ['DailyEngagements'],
        },
      ],
    },
  },
  chartType: ChartType.Spline,
  overlays: [ChartOverlay.benchmark()],
} as const satisfies ChartConfig;

export const chartConfigCreatorRewardsQualifiedSignups = {
  type: AnalyticsComponentType.Chart,
  titleKey: translationKey('Title.CreatorRewardsRewardedSignups', TranslationNamespace.Analytics),
  definitionTooltipKey: translationKey(
    'Description.CreatorRewardsRewardedSignups',
    TranslationNamespace.Analytics,
  ),
  metric: RAQIV2Metric.SourceCount,
  overrides: {
    filter: {
      override: [
        {
          dimension: RAQIV2Dimension.CreatorRewardsDailySource,
          values: ['Signups'],
        },
      ],
    },
  },
  chartType: ChartType.Spline,
  overlays: [],
} as const satisfies ChartConfig;

export const chartConfigCreatorRewardsQualifiedSignupRatio = {
  type: AnalyticsComponentType.Chart,
  titleKey: translationKey(
    'Title.CreatorRewardsQualifiedSignupRatio',
    TranslationNamespace.Analytics,
  ),
  definitionTooltipKey: translationKey(
    'Description.CreatorRewardsQualifiedSignupRatio',
    TranslationNamespace.Analytics,
  ),
  metric: RAQIV2Metric.SourceCountRatioKpi,
  overrides: {
    filter: {
      override: [
        {
          dimension: RAQIV2Dimension.CreatorRewardsDailySource,
          values: ['Signups'],
        },
      ],
    },
    benchmarkPercentiles: {
      override: [90, 95],
    },
  },
  chartType: ChartType.Spline,
  overlays: [ChartOverlay.benchmark()],
} as const satisfies ChartConfig;

export const chartConfigCreatorRewardsQualifiedReactivations = {
  type: AnalyticsComponentType.Chart,
  titleKey: translationKey(
    'Title.CreatorRewardsRewardedReactivations',
    TranslationNamespace.Analytics,
  ),
  definitionTooltipKey: translationKey(
    'Description.CreatorRewardsRewardedReactivations',
    TranslationNamespace.Analytics,
  ),
  metric: RAQIV2Metric.SourceCount,
  overrides: {
    filter: {
      override: [
        {
          dimension: RAQIV2Dimension.CreatorRewardsDailySource,
          values: ['Reactivations'],
        },
      ],
    },
  },
  chartType: ChartType.Spline,
  overlays: [],
} as const satisfies ChartConfig;

export const chartConfigCreatorRewardsQualifiedReactivationRatio = {
  type: AnalyticsComponentType.Chart,
  titleKey: translationKey(
    'Title.CreatorRewardsQualifiedReactivationRatio',
    TranslationNamespace.Analytics,
  ),
  definitionTooltipKey: translationKey(
    'Description.CreatorRewardsQualifiedReactivationRatio',
    TranslationNamespace.Analytics,
  ),
  metric: RAQIV2Metric.SourceCountRatioKpi,
  overrides: {
    filter: {
      override: [
        {
          dimension: RAQIV2Dimension.CreatorRewardsDailySource,
          values: ['Reactivations'],
        },
      ],
    },
    benchmarkPercentiles: {
      override: [90, 95],
    },
  },
  chartType: ChartType.Spline,
  overlays: [ChartOverlay.benchmark()],
} as const satisfies ChartConfig;
