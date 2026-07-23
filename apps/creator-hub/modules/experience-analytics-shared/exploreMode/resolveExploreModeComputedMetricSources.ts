import { DateRangeType } from '@modules/charts-generic';
import { isValidArrayEnumValue } from '@modules/miscellaneous/common/utils/enumUtils';
import type { TRAQIV2NumericUIMetric } from '../constants/AnalyticsMetricDisplayConfig';
import getAnalyticsMetricDisplayConfig from '../constants/AnalyticsMetricDisplayConfig';
import {
  getAtomicMetricsFromMetricLike,
  isComputedMetric,
  type MetricLike,
} from '../types/ComputedMetric';
import { getAllExploreModeMetrics, type TExploreModeMetrics } from './exploreModeMetricsConfig';
import isDurationChartMetric from './isDurationChartMetric';

export type ExploreModeComputedMetricSourcesResolution = {
  displaySourceMetrics: readonly TExploreModeMetrics[];
  hasUnsupportedSourceMetrics: boolean;
};

export const DefaultExploreModeDateRanges = [
  DateRangeType.Last7Days,
  DateRangeType.Last28Days,
  DateRangeType.Last56Days,
  DateRangeType.Last90Days,
  DateRangeType.Custom,
] as const;

const getSupportedDateRangesForMetric = (metric: TExploreModeMetrics): readonly DateRangeType[] => {
  const exploreModeConfig = getAnalyticsMetricDisplayConfig(metric).exploreMode;
  if (exploreModeConfig?.disabled) {
    return [
      ...DefaultExploreModeDateRanges.filter((range) => range !== DateRangeType.Custom),
      DateRangeType.Last365Days,
      DateRangeType.Custom,
    ];
  }
  return exploreModeConfig?.supportedDateRangeTypes ?? DefaultExploreModeDateRanges;
};

export const getIntersectedExploreModeDateRangesForMetrics = (
  metrics: readonly TExploreModeMetrics[],
): readonly DateRangeType[] => {
  const [firstMetric, ...otherMetrics] = metrics;
  if (!firstMetric) {
    return [];
  }
  const firstSupportedRanges = getSupportedDateRangesForMetric(firstMetric);
  return firstSupportedRanges.filter((range) =>
    otherMetrics.every((metric) => getSupportedDateRangesForMetric(metric).includes(range)),
  );
};

const resolveExploreModeComputedMetricSources = ({
  executionMetric,
  fallbackMetric,
  allowedMetrics = getAllExploreModeMetrics(),
}: {
  executionMetric: MetricLike<TRAQIV2NumericUIMetric> | null;
  fallbackMetric: TExploreModeMetrics | null;
  allowedMetrics?: readonly TExploreModeMetrics[];
}): ExploreModeComputedMetricSourcesResolution => {
  const isAllowedMetric = (metric: TRAQIV2NumericUIMetric): metric is TExploreModeMetrics =>
    isValidArrayEnumValue(allowedMetrics, metric);

  if (!executionMetric) {
    return {
      displaySourceMetrics:
        fallbackMetric && isValidArrayEnumValue(allowedMetrics, fallbackMetric)
          ? [fallbackMetric]
          : [],
      hasUnsupportedSourceMetrics: false,
    };
  }

  if (!isComputedMetric(executionMetric)) {
    return {
      displaySourceMetrics: isAllowedMetric(executionMetric) ? [executionMetric] : [],
      hasUnsupportedSourceMetrics: !isAllowedMetric(executionMetric),
    };
  }

  const allAtomicSourceMetrics = getAtomicMetricsFromMetricLike(executionMetric);
  const hasDurationSource = allAtomicSourceMetrics.some(
    (sourceMetric) => isAllowedMetric(sourceMetric) && isDurationChartMetric(sourceMetric),
  );
  const displaySourceMetrics = allAtomicSourceMetrics.filter(
    (sourceMetric): sourceMetric is TExploreModeMetrics =>
      isAllowedMetric(sourceMetric) && !isDurationChartMetric(sourceMetric),
  );

  return {
    displaySourceMetrics,
    hasUnsupportedSourceMetrics:
      hasDurationSource || displaySourceMetrics.length !== allAtomicSourceMetrics.length,
  };
};

export default resolveExploreModeComputedMetricSources;
