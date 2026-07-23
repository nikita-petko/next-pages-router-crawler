import { RAQIV2Dimension, RAQIV2Metric } from '@rbx/creator-hub-analytics-config';
import AnalyticsComponentType from '@modules/analytics-configurations/AnalyticsComponentType';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { ChartType } from '@modules/charts-generic/charts/types/ChartTypes';
import type { ChartConfig } from '@modules/experience-analytics-shared/constants/RAQIV2PredefinedChartConfig';
import { RAQIV2SummaryType } from '@modules/experience-analytics-shared/enums/RAQIV2SummaryType';
import type { SpecOverride } from '@modules/experience-analytics-shared/utils/computeRAQIV2SpecOverride';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

// Permanent, non-editable scoping baked into every chart query on this
// dashboard: only uploaded videos, always broken down by PlaybackSegment.
const videoServiceSharedOverrides: SpecOverride = {
  filter: {
    intersect: [{ dimension: RAQIV2Dimension.VideoType, values: ['VideoUpload'] }],
  },
  breakdown: {
    override: [RAQIV2Dimension.PlaybackSegment],
  },
};

export const chartConfigVideoServicePlaybackSecondsByPlaybackType = {
  type: AnalyticsComponentType.Chart,
  titleKey: translationKey(
    'Title.VideoServicePlaybackBreakdown',
    TranslationNamespace.CloudServices,
  ),
  definitionTooltipKey: translationKey(
    'Description.VideoServicePlaybackBreakdown',
    TranslationNamespace.CloudServices,
  ),
  metric: RAQIV2Metric.VideoServiceExclusivePlaybackSeconds,
  overrides: videoServiceSharedOverrides,
  chartType: ChartType.Pie,
  labelDataAsPercent: true,
  summarySpec: {
    totalSummaryTypes: [{ type: RAQIV2SummaryType.Total }],
    perBreakdownSummaryTypes: [],
    aggregatedBreakdownSummaryTypes: [],
  },
} as const satisfies ChartConfig;

export const chartConfigVideoServicePlaybackSeconds = {
  type: AnalyticsComponentType.Chart,
  titleKey: translationKey('Title.VideoServicePlaybackSeconds', TranslationNamespace.CloudServices),
  definitionTooltipKey: translationKey(
    'Description.VideoServicePlaybackSeconds',
    TranslationNamespace.CloudServices,
  ),
  // Shares the pie chart's metric so both charts are powered by the same data.
  // The metric is ingested in seconds and rendered in hours (see its display
  // config override).
  metric: RAQIV2Metric.VideoServiceExclusivePlaybackSeconds,
  // Same permanent VideoUpload filter + PlaybackSegment breakdown as the pie.
  overrides: videoServiceSharedOverrides,
  chartType: ChartType.Spline,
  // No previous-period comparison (or benchmark) line on this chart.
  overlays: [],
} as const satisfies ChartConfig;
