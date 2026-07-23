import { AnalyticsQueryParams } from '@modules/charts-generic';
import { isValidArrayEnumValue } from '@modules/miscellaneous/common/utils/enumUtils';
import type { TRAQIV2NumericUIMetric } from '../constants/AnalyticsMetricDisplayConfig';
import type { ComputedMetric } from '../types/ComputedMetric';
import { deserializeComputedMetricFromQueryParam } from '../types/ComputedMetricQueryParam';
import {
  getAllExploreModeMetrics,
  isExploreModeMetric,
  type TExploreModeMetrics,
} from './exploreModeMetricsConfig';
import resolveExploreModeComputedMetricSources from './resolveExploreModeComputedMetricSources';
import { getBaseMetricFromL7 } from './l7MetricMapping';

type ExploreModeQueryCleanup = Partial<
  Record<AnalyticsQueryParams.Metric | AnalyticsQueryParams.ComputedMetric, string | null>
>;

export type ExploreModeQueryStateResolution = {
  metric: TExploreModeMetrics | null;
  computedMetric: ComputedMetric<TRAQIV2NumericUIMetric> | null;
  hasInvalidMetricQueryParam: boolean;
  hasInvalidComputedMetricQueryParam: boolean;
  cleanupQueryParams: ExploreModeQueryCleanup | null;
  l7SmoothingFromUrl: boolean;
};

const hasUnsupportedComputedMetricSourcesForAllowedMetrics = (
  computedMetric: ComputedMetric<TRAQIV2NumericUIMetric>,
  allowedMetrics: readonly TExploreModeMetrics[],
): boolean =>
  resolveExploreModeComputedMetricSources({
    executionMetric: computedMetric,
    fallbackMetric: null,
    allowedMetrics,
  }).hasUnsupportedSourceMetrics;

const hasUnknownComputedMetricSources = (
  computedMetric: ComputedMetric<TRAQIV2NumericUIMetric>,
): boolean =>
  hasUnsupportedComputedMetricSourcesForAllowedMetrics(computedMetric, getAllExploreModeMetrics());

const resolveExploreModeQueryState = ({
  queryMetric,
  queryComputedMetric,
  allowedMetrics,
  enableComputedMetrics,
  enableL7Smoothing = false,
  featureFlagsFetched,
}: {
  queryMetric: string | string[] | null | undefined;
  queryComputedMetric: string | string[] | null | undefined;
  allowedMetrics: readonly TExploreModeMetrics[];
  enableComputedMetrics: boolean;
  enableL7Smoothing?: boolean;
  featureFlagsFetched: boolean;
}): ExploreModeQueryStateResolution => {
  const metricQueryParam = typeof queryMetric === 'string' ? queryMetric : null;
  const computedMetricQueryParam =
    typeof queryComputedMetric === 'string' ? queryComputedMetric : null;

  const cleanupQueryParams: ExploreModeQueryCleanup = {};
  let metric: TExploreModeMetrics | null = null;
  let computedMetric: ComputedMetric<TRAQIV2NumericUIMetric> | null = null;
  let hasInvalidMetricQueryParam = false;
  let hasInvalidComputedMetricQueryParam = false;
  let l7SmoothingFromUrl = false;

  if (metricQueryParam) {
    const isKnownMetric = isExploreModeMetric(metricQueryParam);
    const l7BaseMetric = enableL7Smoothing ? getBaseMetricFromL7(metricQueryParam) : null;

    if (l7BaseMetric && isValidArrayEnumValue(allowedMetrics, l7BaseMetric)) {
      metric = l7BaseMetric;
      l7SmoothingFromUrl = true;
      cleanupQueryParams[AnalyticsQueryParams.Metric] = l7BaseMetric;
    } else if (!isKnownMetric) {
      hasInvalidMetricQueryParam = true;
      cleanupQueryParams[AnalyticsQueryParams.Metric] = null;
    } else if (
      enableComputedMetrics &&
      featureFlagsFetched &&
      !isValidArrayEnumValue(allowedMetrics, metricQueryParam)
    ) {
      hasInvalidMetricQueryParam = true;
      cleanupQueryParams[AnalyticsQueryParams.Metric] = null;
    } else {
      metric = metricQueryParam;
    }
  }

  if (computedMetricQueryParam) {
    if (!enableComputedMetrics) {
      if (featureFlagsFetched) {
        hasInvalidComputedMetricQueryParam = true;
        cleanupQueryParams[AnalyticsQueryParams.ComputedMetric] = null;
      }
    } else {
      const parsedComputedMetric =
        deserializeComputedMetricFromQueryParam(computedMetricQueryParam);
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
  }

  if (computedMetric && metricQueryParam) {
    cleanupQueryParams[AnalyticsQueryParams.Metric] = null;
  }

  if (enableComputedMetrics && (computedMetric || computedMetricQueryParam)) {
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
  computedMetric: ComputedMetric<TRAQIV2NumericUIMetric>;
  allowedMetrics: readonly TExploreModeMetrics[];
}): boolean =>
  !hasUnknownComputedMetricSources(computedMetric) &&
  !hasUnsupportedComputedMetricSourcesForAllowedMetrics(computedMetric, allowedMetrics);

export default resolveExploreModeQueryState;
