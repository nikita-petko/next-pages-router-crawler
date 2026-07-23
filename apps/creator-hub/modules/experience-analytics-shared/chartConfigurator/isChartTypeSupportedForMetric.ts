import {
  RAQIV2MetricDisplayConfig,
  RAQIV2MetricDisplayType,
  RAQIV2MetricGranularity,
  RAQIV2MetricToSupportedDimensions,
  RAQIV2MetricToSupportedGranularities,
  type TRAQIV2Metric,
} from '@rbx/creator-hub-analytics-config';
import type { TranslationKey } from '@modules/analytics-translations/types';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { ChartType } from '@modules/charts-generic/charts/types/ChartTypes';
import logAnalyticsError from '@modules/charts-generic/utils/logAnalyticsError';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import getAnalyticsMetricDisplayConfig from '../constants/AnalyticsMetricDisplayConfig';

const DURATION_CHART_TYPES: ReadonlySet<ChartType> = new Set([
  ChartType.DurationSpline,
  ChartType.DurationArea,
]);

const NonCountMetricDisplayType: string = RAQIV2MetricDisplayType.NonCount;

const isCountMetric = (metric: TRAQIV2Metric): boolean => {
  const config = RAQIV2MetricDisplayConfig[metric];
  if (!config) {
    return true;
  }
  return String(config.metricDisplayType) !== NonCountMetricDisplayType;
};

const supportsCumulativeGranularity = (metric: TRAQIV2Metric): boolean => {
  const granularities = RAQIV2MetricToSupportedGranularities[metric];
  return granularities?.includes(RAQIV2MetricGranularity.None) ?? false;
};

const hasDurationChartType = (metric: TRAQIV2Metric): boolean => {
  const { exploreModeChartType } = getAnalyticsMetricDisplayConfig(metric);
  return exploreModeChartType !== undefined && DURATION_CHART_TYPES.has(exploreModeChartType);
};

/**
 * The Table chart type only makes sense for metrics that can be sliced along
 * at least one breakdown dimension — without breakdowns there is nothing to
 * tabulate beyond a single aggregate row, which the chart views already
 * surface more clearly.
 *
 * Every metric is expected to have an entry in
 * `RAQIV2MetricToSupportedDimensions`; a missing or empty entry is treated
 * as "unsupported" rather than crashing, and is reported via
 * `logAnalyticsError` so the gap shows up in monitoring.
 */
const hasAnyBreakdownDimension = (metric: TRAQIV2Metric): boolean => {
  const dimensions = RAQIV2MetricToSupportedDimensions[metric];
  if (!dimensions) {
    logAnalyticsError(
      `Metric ${metric} is missing from RAQIV2MetricToSupportedDimensions; treating as having no breakdown support.`,
    );
    return false;
  }
  return dimensions.length > 0;
};

const UnsupportedPieChartMetricReason = translationKey(
  'Description.ChartType.PieChartRequiresCount',
  TranslationNamespace.Analytics,
);

const GenericChartTypeNotSupported = translationKey(
  'Description.ChartType.GenericNotSupported',
  TranslationNamespace.Analytics,
);

export const UnsupportedL7SmoothingCumulativeGranularityReason = translationKey(
  'Label.ExploreMode.Smoothing.L7CumulativeDisabled',
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

const unsupported = (reason: TranslationKey): ChartTypeMetricSupport => ({
  isSupported: false,
  unsupportedReason: reason,
});

/**
 * Returns a discriminated union describing chart support for a metric in explore mode.
 *
 * - Pie charts only work for count metrics (parts sum to a meaningful whole).
 * - Duration charts (DurationSpline/DurationArea) only
 *   work for metrics that use bucket-based breakdowns with granularity=None.
 * - Non-duration charts (Spline/Area/Column/Bar) are incompatible with duration
 *   metrics: they route through the regular chart adapter which lacks bucket
 *   sorting and dataPointTransformerType support (e.g. PercentageOfFirstPoint).
 */
const getChartTypeSupportForMetric = (
  chartType: ChartType,
  metric: TRAQIV2Metric,
): ChartTypeMetricSupport => {
  switch (chartType) {
    case ChartType.Pie:
      if (!isCountMetric(metric)) {
        return unsupported(UnsupportedPieChartMetricReason);
      }
      if (!supportsCumulativeGranularity(metric)) {
        return unsupported(GenericChartTypeNotSupported);
      }
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
      if (hasDurationChartType(metric)) {
        return unsupported(GenericChartTypeNotSupported);
      }
      if (!supportsCumulativeGranularity(metric)) {
        return unsupported(GenericChartTypeNotSupported);
      }
      return { isSupported: true };

    case ChartType.Map:
    case ChartType.MultipleMetricSpline:
      return { isSupported: true };

    case ChartType.Table:
      return hasAnyBreakdownDimension(metric)
        ? { isSupported: true }
        : unsupported(GenericChartTypeNotSupported);
    default:
      throw new Error('Unknown chartType support');
  }
};

export default getChartTypeSupportForMetric;
