import { RAQIV2Metric, RAQIV2UIPseudoDimension } from '@rbx/creator-hub-analytics-config';
import AnalyticsComponentType from '@modules/analytics-configurations/AnalyticsComponentType';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { ChartType } from '@modules/charts-generic/charts/types/ChartTypes';
import type { TRAQIV2NumericUIMetric } from '@modules/experience-analytics-shared/constants/AnalyticsMetricDisplayConfig';
import type { ChartConfig } from '@modules/experience-analytics-shared/constants/RAQIV2PredefinedChartConfig';
import { RAQIV2SpecialLayoutType } from '@modules/experience-analytics-shared/types/RAQIV2SpecialLayoutConfig';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

const sectionTitle = (titleKey: string) =>
  ({
    type: RAQIV2SpecialLayoutType.SectionTitle,
    titleKey: translationKey(titleKey, TranslationNamespace.Analytics),
  }) as const;

// Each bandwidth chart is always broken down by DataModel instance type, using
// the per-metric TopN pseudo-dimension so the top 10 are ranked live per query
// (per selected metric + filters). Place/PlaceVersion/Platform/OS/MemoryGroup
// are page-level filters, not breakdowns.

const bwChart = (
  metric: TRAQIV2NumericUIMetric,
  breakdown: RAQIV2UIPseudoDimension,
  labelKey: string,
  chartType: ChartType.Area | ChartType.Spline,
): ChartConfig => ({
  type: AnalyticsComponentType.Chart,
  titleKey: translationKey(labelKey, TranslationNamespace.Analytics),
  metric,
  overrides: {
    breakdown: { override: [breakdown] },
  },
  chartType,
});

// Group 1 — Bandwidth (bytes/sec), area charts
export const chartConfigBandwidthTotalBps = bwChart(
  RAQIV2Metric.BandwidthTotalBps,
  RAQIV2UIPseudoDimension.TopInstanceTypeBwTotalBps,
  'Label.Metric.BandwidthTotalBps',
  ChartType.Area,
);
export const chartConfigBandwidthNewInstanceBps = bwChart(
  RAQIV2Metric.BandwidthNewInstanceBps,
  RAQIV2UIPseudoDimension.TopInstanceTypeBwNewInstanceBps,
  'Label.Metric.BandwidthNewInstanceBps',
  ChartType.Area,
);
export const chartConfigBandwidthEventBps = bwChart(
  RAQIV2Metric.BandwidthEventBps,
  RAQIV2UIPseudoDimension.TopInstanceTypeBwEventBps,
  'Label.Metric.BandwidthEventBps',
  ChartType.Area,
);
export const chartConfigBandwidthPropertiesBps = bwChart(
  RAQIV2Metric.BandwidthPropertiesBps,
  RAQIV2UIPseudoDimension.TopInstanceTypeBwPropertiesBps,
  'Label.Metric.BandwidthPropertiesBps',
  ChartType.Area,
);
export const chartConfigBandwidthAttributesBps = bwChart(
  RAQIV2Metric.BandwidthAttributesBps,
  RAQIV2UIPseudoDimension.TopInstanceTypeBwAttributesBps,
  'Label.Metric.BandwidthAttributesBps',
  ChartType.Area,
);

// Group 2 — Update rate (updates/sec), area charts
export const chartConfigBandwidthTotalUps = bwChart(
  RAQIV2Metric.BandwidthTotalUpdatesPerSecond,
  RAQIV2UIPseudoDimension.TopInstanceTypeBwTotalUps,
  'Label.Metric.BandwidthTotalUpdatesPerSecond',
  ChartType.Area,
);
export const chartConfigBandwidthNewInstanceUps = bwChart(
  RAQIV2Metric.BandwidthNewInstanceUpdatesPerSecond,
  RAQIV2UIPseudoDimension.TopInstanceTypeBwNewInstanceUps,
  'Label.Metric.BandwidthNewInstanceUpdatesPerSecond',
  ChartType.Area,
);
export const chartConfigBandwidthEventUps = bwChart(
  RAQIV2Metric.BandwidthEventUpdatesPerSecond,
  RAQIV2UIPseudoDimension.TopInstanceTypeBwEventUps,
  'Label.Metric.BandwidthEventUpdatesPerSecond',
  ChartType.Area,
);
export const chartConfigBandwidthPropertiesUps = bwChart(
  RAQIV2Metric.BandwidthPropertiesUpdatesPerSecond,
  RAQIV2UIPseudoDimension.TopInstanceTypeBwPropertiesUps,
  'Label.Metric.BandwidthPropertiesUpdatesPerSecond',
  ChartType.Area,
);
export const chartConfigBandwidthAttributesUps = bwChart(
  RAQIV2Metric.BandwidthAttributesUpdatesPerSecond,
  RAQIV2UIPseudoDimension.TopInstanceTypeBwAttributesUps,
  'Label.Metric.BandwidthAttributesUpdatesPerSecond',
  ChartType.Area,
);

// Group 3 — Max single-update size (bytes), line (spline) charts
export const chartConfigBandwidthTotalMaxBytes = bwChart(
  RAQIV2Metric.BandwidthTotalMaxBytes,
  RAQIV2UIPseudoDimension.TopInstanceTypeBwTotalMaxBytes,
  'Label.Metric.BandwidthTotalMaxBytes',
  ChartType.Spline,
);
export const chartConfigBandwidthNewInstanceMaxBytes = bwChart(
  RAQIV2Metric.BandwidthNewInstanceMaxBytes,
  RAQIV2UIPseudoDimension.TopInstanceTypeBwNewInstanceMaxBytes,
  'Label.Metric.BandwidthNewInstanceMaxBytes',
  ChartType.Spline,
);
export const chartConfigBandwidthEventMaxBytes = bwChart(
  RAQIV2Metric.BandwidthEventMaxBytes,
  RAQIV2UIPseudoDimension.TopInstanceTypeBwEventMaxBytes,
  'Label.Metric.BandwidthEventMaxBytes',
  ChartType.Spline,
);
export const chartConfigBandwidthPropertiesMaxBytes = bwChart(
  RAQIV2Metric.BandwidthPropertiesMaxBytes,
  RAQIV2UIPseudoDimension.TopInstanceTypeBwPropertiesMaxBytes,
  'Label.Metric.BandwidthPropertiesMaxBytes',
  ChartType.Spline,
);
export const chartConfigBandwidthAttributesMaxBytes = bwChart(
  RAQIV2Metric.BandwidthAttributesMaxBytes,
  RAQIV2UIPseudoDimension.TopInstanceTypeBwAttributesMaxBytes,
  'Label.Metric.BandwidthAttributesMaxBytes',
  ChartType.Spline,
);

export const bandwidthNetworkTabBody = [
  // Section 1 — Bandwidth (bytes/sec)
  sectionTitle('Title.NetworkBandwidthSection'),
  chartConfigBandwidthTotalBps,
  chartConfigBandwidthNewInstanceBps,
  chartConfigBandwidthEventBps,
  chartConfigBandwidthPropertiesBps,
  chartConfigBandwidthAttributesBps,
  // Section 2 — Update rate (updates/sec)
  sectionTitle('Title.NetworkUpdateRateSection'),
  chartConfigBandwidthTotalUps,
  chartConfigBandwidthNewInstanceUps,
  chartConfigBandwidthEventUps,
  chartConfigBandwidthPropertiesUps,
  chartConfigBandwidthAttributesUps,
  // Section 3 — Max single-update size (bytes)
  sectionTitle('Title.NetworkMaxSizeSection'),
  chartConfigBandwidthTotalMaxBytes,
  chartConfigBandwidthNewInstanceMaxBytes,
  chartConfigBandwidthEventMaxBytes,
  chartConfigBandwidthPropertiesMaxBytes,
  chartConfigBandwidthAttributesMaxBytes,
] as const;
