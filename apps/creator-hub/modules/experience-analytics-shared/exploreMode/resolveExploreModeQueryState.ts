import AnalyticsQueryParams from '@modules/charts-generic/enums/AnalyticsQueryParams';
import { isValidArrayEnumValue } from '@modules/miscellaneous/utils/enumUtils';
import {
  getAllChartConfiguratorMetrics,
  isChartConfiguratorMetric,
  type TChartConfiguratorMetrics,
} from '../chartConfigurator/chartConfiguratorMetricsConfig';
import { getBaseMetricFromL7 } from '../chartConfigurator/l7MetricMapping';
import resolveChartConfiguratorComputedMetricSources from '../chartConfigurator/resolveChartConfiguratorComputedMetricSources';
import type { ComputedMetric } from '../types/ComputedMetric';
import { deserializeComputedMetricFromQueryParam } from '../types/ComputedMetricQueryParam';

type ExploreModeQueryCleanup = Partial<
  Record<
    | AnalyticsQueryParams.Metric
    | AnalyticsQueryParams.ComputedMetric
    | AnalyticsQueryParams.Smoothing,
    string | null
  >
>;

/**
 * URL value used by the explore-mode `smoothing` query param when L7 smoothing
 * is active. Mirrors the `'l7-moving-average'` literal used by the in-app
 * `SmoothingOption` type so the URL value is self-describing.
 */
export const L7_SMOOTHING_QUERY_VALUE = 'l7-moving-average';

export type ExploreModeQueryStateResolution = {
  metric: TChartConfiguratorMetrics | null;
  computedMetric: ComputedMetric | null;
  hasInvalidMetricQueryParam: boolean;
  hasInvalidComputedMetricQueryParam: boolean;
  cleanupQueryParams: ExploreModeQueryCleanup | null;
  l7SmoothingFromUrl: boolean;
};

const hasUnsupportedComputedMetricSourcesForAllowedMetrics = (
  computedMetric: ComputedMetric,
  allowedMetrics: readonly TChartConfiguratorMetrics[],
): boolean =>
  resolveChartConfiguratorComputedMetricSources({
    executionMetric: computedMetric,
    fallbackMetric: null,
    allowedMetrics,
  }).hasUnsupportedSourceMetrics;

const hasUnknownComputedMetricSources = (computedMetric: ComputedMetric): boolean =>
  hasUnsupportedComputedMetricSourcesForAllowedMetrics(
    computedMetric,
    getAllChartConfiguratorMetrics(),
  );

const resolveExploreModeQueryState = ({
  queryMetric,
  queryComputedMetric,
  querySmoothing,
  allowedMetrics,
  featureFlagsFetched,
}: {
  queryMetric: string | string[] | null | undefined;
  queryComputedMetric: string | string[] | null | undefined;
  querySmoothing?: string | string[] | null | undefined;
  allowedMetrics: readonly TChartConfiguratorMetrics[];
  featureFlagsFetched: boolean;
}): ExploreModeQueryStateResolution => {
  const metricQueryParam = typeof queryMetric === 'string' ? queryMetric : null;
  const computedMetricQueryParam =
    typeof queryComputedMetric === 'string' ? queryComputedMetric : null;
  const smoothingQueryParam = typeof querySmoothing === 'string' ? querySmoothing : null;

  const cleanupQueryParams: ExploreModeQueryCleanup = {};
  let metric: TChartConfiguratorMetrics | null = null;
  let computedMetric: ComputedMetric | null = null;
  let hasInvalidMetricQueryParam = false;
  let hasInvalidComputedMetricQueryParam = false;
  let l7SmoothingFromUrl = false;

  // Dedicated `smoothing=l7-moving-average` URL param is the shareable
  // representation for atomic-metric L7 smoothing.
  if (smoothingQueryParam === L7_SMOOTHING_QUERY_VALUE) {
    l7SmoothingFromUrl = true;
  }

  if (metricQueryParam) {
    const isKnownMetric = isChartConfiguratorMetric(metricQueryParam);
    const l7BaseMetric = getBaseMetricFromL7(metricQueryParam);

    if (l7BaseMetric && isValidArrayEnumValue(allowedMetrics, l7BaseMetric)) {
      metric = l7BaseMetric;
      l7SmoothingFromUrl = true;
      cleanupQueryParams[AnalyticsQueryParams.Metric] = l7BaseMetric;
      // Migrate legacy L7-metric URLs (e.g. `metric=L7AverageDailyActiveUsers`)
      // to the new dedicated `smoothing` param so subsequent shares from
      // this view use the canonical representation.
      if (smoothingQueryParam !== L7_SMOOTHING_QUERY_VALUE) {
        cleanupQueryParams[AnalyticsQueryParams.Smoothing] = L7_SMOOTHING_QUERY_VALUE;
      }
    } else if (!isKnownMetric) {
      hasInvalidMetricQueryParam = true;
      cleanupQueryParams[AnalyticsQueryParams.Metric] = null;
    } else if (featureFlagsFetched && !isValidArrayEnumValue(allowedMetrics, metricQueryParam)) {
      hasInvalidMetricQueryParam = true;
      cleanupQueryParams[AnalyticsQueryParams.Metric] = null;
    } else {
      metric = metricQueryParam;
    }
  }

  if (computedMetricQueryParam) {
    const parsedComputedMetric = deserializeComputedMetricFromQueryParam(computedMetricQueryParam);
    if (!parsedComputedMetric) {
      hasInvalidComputedMetricQueryParam = true;
      cleanupQueryParams[AnalyticsQueryParams.ComputedMetric] = null;
    } else if (hasUnknownComputedMetricSources(parsedComputedMetric)) {
      hasInvalidComputedMetricQueryParam = true;
      cleanupQueryParams[AnalyticsQueryParams.ComputedMetric] = null;
    } else if (
      featureFlagsFetched &&
      hasUnsupportedComputedMetricSourcesForAllowedMetrics(parsedComputedMetric, allowedMetrics)
    ) {
      hasInvalidComputedMetricQueryParam = true;
      cleanupQueryParams[AnalyticsQueryParams.ComputedMetric] = null;
    } else {
      computedMetric = parsedComputedMetric;
    }
  }

  if (computedMetric && metricQueryParam) {
    cleanupQueryParams[AnalyticsQueryParams.Metric] = null;
  }

  if (computedMetric || computedMetricQueryParam) {
    hasInvalidMetricQueryParam = false;
  }

  return {
    metric,
    computedMetric,
    hasInvalidMetricQueryParam,
    hasInvalidComputedMetricQueryParam,
    cleanupQueryParams: Object.keys(cleanupQueryParams).length > 0 ? cleanupQueryParams : null,
    l7SmoothingFromUrl,
  };
};

export const isComputedMetricAllowedForExploreMode = ({
  computedMetric,
  allowedMetrics,
}: {
  computedMetric: ComputedMetric;
  allowedMetrics: readonly TChartConfiguratorMetrics[];
}): boolean =>
  !hasUnknownComputedMetricSources(computedMetric) &&
  !hasUnsupportedComputedMetricSourcesForAllowedMetrics(computedMetric, allowedMetrics);

export default resolveExploreModeQueryState;
