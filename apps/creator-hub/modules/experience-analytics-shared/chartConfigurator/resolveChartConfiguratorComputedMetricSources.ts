import {
  RAQIV2DateRangeType,
  RAQIV2Metric,
  RAQIV2UIMetric,
} from '@rbx/creator-hub-analytics-config';
import { isValidArrayEnumValue } from '@modules/miscellaneous/utils/enumUtils';
import {
  isNumericUIMetric,
  type TRAQIV2NumericUIMetric,
} from '../constants/AnalyticsMetricDisplayConfig';
import getAnalyticsMetricDisplayConfig from '../constants/AnalyticsMetricDisplayConfig';
import {
  getUIMetricFromAtomicMetricLike,
  isComputedMetric,
  type MetricLike,
} from '../types/ComputedMetric';
import getReferencedComputedMetricSources from '../utils/computedMetrics/getReferencedComputedMetricSources';
import {
  getAllChartConfiguratorMetrics,
  type TChartConfiguratorMetrics,
} from './chartConfiguratorMetricsConfig';
import isDurationChartMetric from './isDurationChartMetric';

export type ExploreModeComputedMetricSourcesResolution = {
  displaySourceMetrics: readonly TChartConfiguratorMetrics[];
  hasUnsupportedSourceMetrics: boolean;
};

export const DefaultExploreModeDateRanges = [
  RAQIV2DateRangeType.Last1Day,
  RAQIV2DateRangeType.Last7Days,
  RAQIV2DateRangeType.Last28Days,
  RAQIV2DateRangeType.Last56Days,
  RAQIV2DateRangeType.Last90Days,
  RAQIV2DateRangeType.Custom,
] as const;

const recommendedEventsExploreModeDateRanges = [
  RAQIV2DateRangeType.Last1Day,
  RAQIV2DateRangeType.Last7Days,
  RAQIV2DateRangeType.Last28Days,
  RAQIV2DateRangeType.Last56Days,
  RAQIV2DateRangeType.Last90Days,
  RAQIV2DateRangeType.Last365Days,
  RAQIV2DateRangeType.Custom,
] as const;

const recommendedEventsExploreModeMetrics = [
  RAQIV2Metric.EconomyTransactionAmount,
  RAQIV2Metric.EconomyTransactionAmountSinks,
  RAQIV2Metric.EconomyTransactionCount,
  RAQIV2Metric.EconomyAverageWalletBalance,
  RAQIV2UIMetric.CustomEventsV2,
] as const satisfies readonly TChartConfiguratorMetrics[];

const isRecommendedEventsExploreModeMetric = (
  metric: TChartConfiguratorMetrics,
): metric is (typeof recommendedEventsExploreModeMetrics)[number] =>
  recommendedEventsExploreModeMetrics.some((recommendedMetric) => recommendedMetric === metric);

const getSupportedDateRangesForMetric = (
  metric: TChartConfiguratorMetrics,
): readonly RAQIV2DateRangeType[] => {
  if (isRecommendedEventsExploreModeMetric(metric)) {
    return recommendedEventsExploreModeDateRanges;
  }

  const exploreModeConfig = getAnalyticsMetricDisplayConfig(metric).exploreMode;
  if (exploreModeConfig?.disabled) {
    return [
      ...DefaultExploreModeDateRanges.filter((range) => range !== RAQIV2DateRangeType.Custom),
      RAQIV2DateRangeType.Last365Days,
      RAQIV2DateRangeType.Custom,
    ];
  }
  return exploreModeConfig?.supportedDateRangeTypes ?? DefaultExploreModeDateRanges;
};

export const getIntersectedExploreModeDateRangesForMetrics = (
  metrics: readonly TChartConfiguratorMetrics[],
): readonly RAQIV2DateRangeType[] => {
  const [firstMetric, ...otherMetrics] = metrics;
  if (!firstMetric) {
    return [];
  }
  const firstSupportedRanges = getSupportedDateRangesForMetric(firstMetric);
  return firstSupportedRanges.filter((range) =>
    otherMetrics.every((metric) => getSupportedDateRangesForMetric(metric).includes(range)),
  );
};

const resolveChartConfiguratorComputedMetricSources = ({
  executionMetric,
  fallbackMetric,
  allowedMetrics = getAllChartConfiguratorMetrics(),
}: {
  executionMetric: MetricLike | null;
  fallbackMetric: TChartConfiguratorMetrics | null;
  allowedMetrics?: readonly TChartConfiguratorMetrics[];
}): ExploreModeComputedMetricSourcesResolution => {
  const isAllowedMetric = (metric: TRAQIV2NumericUIMetric): metric is TChartConfiguratorMetrics =>
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
    const uiMetric = getUIMetricFromAtomicMetricLike(executionMetric);
    if (!isNumericUIMetric(uiMetric)) {
      return {
        displaySourceMetrics: [],
        hasUnsupportedSourceMetrics: true,
      };
    }
    return {
      displaySourceMetrics: isAllowedMetric(uiMetric) ? [uiMetric] : [],
      hasUnsupportedSourceMetrics: !isAllowedMetric(uiMetric),
    };
  }

  // DSA-5743: limit to sources actually referenced in the formula.
  // DSA-5755: a source's `metric` may now be a CustomEventsAtomicMetricLike
  // wrapper; reduce each one to its UI metric identifier so the downstream
  // duration / allowed-metric predicates can keep operating on a string.
  const allAtomicSourceMetrics = getReferencedComputedMetricSources(executionMetric).map((source) =>
    getUIMetricFromAtomicMetricLike(source.metric),
  );
  const hasDurationSource = allAtomicSourceMetrics.some(
    (sourceMetric) => isAllowedMetric(sourceMetric) && isDurationChartMetric(sourceMetric),
  );
  const displaySourceMetrics = allAtomicSourceMetrics.filter(
    (sourceMetric): sourceMetric is TChartConfiguratorMetrics =>
      isAllowedMetric(sourceMetric) && !isDurationChartMetric(sourceMetric),
  );

  return {
    displaySourceMetrics,
    hasUnsupportedSourceMetrics:
      hasDurationSource || displaySourceMetrics.length !== allAtomicSourceMetrics.length,
  };
};

export default resolveChartConfiguratorComputedMetricSources;
