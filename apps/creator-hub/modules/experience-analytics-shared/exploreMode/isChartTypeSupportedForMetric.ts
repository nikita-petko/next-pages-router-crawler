import { ChartType } from '@modules/charts-generic';
import { TranslationKey, translationKey } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import {
  RAQIV2MetricDisplayConfig,
  RAQIV2MetricGranularity,
  RAQIV2MetricToSupportedGranularities,
  type TRAQIV2Metric,
} from '@rbx/creator-hub-analytics-config';
import getAnalyticsMetricDisplayConfig from '../constants/AnalyticsMetricDisplayConfig';

const DURATION_CHART_TYPES: ReadonlySet<ChartType> = new Set([
  ChartType.DurationSpline,
  ChartType.DurationArea,
]);

const isCountMetric = (metric: TRAQIV2Metric): boolean => {
  const config = RAQIV2MetricDisplayConfig[metric];
  if (!config) return true;
  return config.metricDisplayType !== 'NonCount';
};

const supportsCumulativeGranularity = (metric: TRAQIV2Metric): boolean => {
  const granularities = RAQIV2MetricToSupportedGranularities[metric];
  return granularities?.includes(RAQIV2MetricGranularity.None) ?? false;
};

const hasDurationChartType = (metric: TRAQIV2Metric): boolean => {
  const { exploreModeChartType } = getAnalyticsMetricDisplayConfig(metric);
  return exploreModeChartType !== undefined && DURATION_CHART_TYPES.has(exploreModeChartType);
};

const UnsupportedPieChartMetricReason = translationKey(
  'Description.ChartType.PieChartRequiresCount',
  TranslationNamespace.Analytics,
);

const GenericChartTypeNotSupported = translationKey(
  'Description.ChartType.GenericNotSupported',
  TranslationNamespace.Analytics,
);

export type ChartTypeMetricSupport =
  | {
      isSupported: true;
    }
  | {
      isSupported: false;
      unsupportedReason: TranslationKey;
    };

/**
 * Returns a discriminated union describing chart support for a metric in explore mode.
 *
 * - Pie charts only work for count metrics (parts sum to a meaningful whole).
 * - Duration charts (DurationSpline/DurationArea) only work for metrics that use
 *   bucket-based breakdowns with granularity=None.
 * - Non-duration charts (Spline/Area/Column/Bar) are incompatible with duration
 *   metrics: they route through the regular chart adapter which lacks bucket
 *   sorting and dataPointTransformerType support (e.g. PercentageOfFirstPoint).
 */
const getChartTypeSupportForMetric = (
  chartType: ChartType,
  metric: TRAQIV2Metric,
): ChartTypeMetricSupport => {
  const unsupported = (reason: TranslationKey): ChartTypeMetricSupport => ({
    isSupported: false,
    unsupportedReason: reason,
  });

  switch (chartType) {
    case ChartType.Pie:
      if (!isCountMetric(metric)) return unsupported(UnsupportedPieChartMetricReason);
      if (!supportsCumulativeGranularity(metric)) return unsupported(GenericChartTypeNotSupported);
      return { isSupported: true };

    case ChartType.DurationSpline:
    case ChartType.DurationArea:
      return hasDurationChartType(metric)
        ? { isSupported: true }
        : unsupported(GenericChartTypeNotSupported);

    case ChartType.Spline:
    case ChartType.Area:
    case ChartType.Column:
      return hasDurationChartType(metric)
        ? unsupported(GenericChartTypeNotSupported)
        : { isSupported: true };

    case ChartType.Bar:
      if (hasDurationChartType(metric)) return unsupported(GenericChartTypeNotSupported);
      if (!supportsCumulativeGranularity(metric)) return unsupported(GenericChartTypeNotSupported);
      return { isSupported: true };

    case ChartType.Map:
    case ChartType.MultipleMetricSpline:
      return { isSupported: true };
    default: {
      const exhaustiveCheck: never = chartType;
      throw new Error(`Unknown chartType support ${exhaustiveCheck}`);
    }
  }
};

export default getChartTypeSupportForMetric;
