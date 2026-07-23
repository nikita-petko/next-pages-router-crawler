import type { TRAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import {
  getUIMetricFromAtomicMetricLike,
  type ComputedMetric,
  type ComputedMetricSource,
} from '../types/ComputedMetric';
import getReferencedComputedMetricSources from '../utils/computedMetrics/getReferencedComputedMetricSources';
import {
  isChartConfiguratorMetric,
  type TChartConfiguratorMetrics,
} from './chartConfiguratorMetricsConfig';
import getSharedGranularityOptionsForMetrics from './getSharedGranularityOptionsForMetrics';
import { getIntersectedExploreModeDateRangesForMetrics } from './resolveChartConfiguratorComputedMetricSources';

export enum ComputedMetricSemanticErrorType {
  UnsupportedSource = 'unsupported_source',
  NoSharedDateRanges = 'no_shared_date_ranges',
  NoSharedGranularities = 'no_shared_granularities',
}

export type ComputedMetricSemanticError = {
  type: ComputedMetricSemanticErrorType;
};

export type ComputedMetricSemanticsResult = {
  isValid: boolean;
  errors: readonly ComputedMetricSemanticError[];
};

export type ComputedMetricSemanticsChartContext = {
  startDate: Date;
  endDate: Date;
  breakdown?: readonly TRAQIV2Dimension[];
};

const ValidResult: ComputedMetricSemanticsResult = {
  isValid: true,
  errors: [],
};

const dedupeSourceMetrics = (sources: readonly ComputedMetricSource[]): string[] => {
  const seen = new Set<string>();
  sources.forEach((source) => {
    // DSA-5755: source.metric may be a CustomEventsAtomicMetricLike wrapper;
    // reduce to its UI metric identifier so the dedupe key is comparable.
    seen.add(getUIMetricFromAtomicMetricLike(source.metric));
  });
  return Array.from(seen);
};

const validateComputedMetricSemantics = (
  computedMetric: ComputedMetric,
  allowedMetrics: readonly TChartConfiguratorMetrics[],
  chartContext?: ComputedMetricSemanticsChartContext,
): ComputedMetricSemanticsResult => {
  const errors: ComputedMetricSemanticError[] = [];

  const referencedSources = getReferencedComputedMetricSources(computedMetric);
  const sourceMetricStrings = dedupeSourceMetrics(referencedSources);
  const allowedSet = new Set<string>(allowedMetrics);

  const hasUnsupported = sourceMetricStrings.some(
    (metric) => !isChartConfiguratorMetric(metric) || !allowedSet.has(metric),
  );

  if (hasUnsupported) {
    errors.push({ type: ComputedMetricSemanticErrorType.UnsupportedSource });
  }

  const exploreModeSourceMetrics = sourceMetricStrings.filter(
    (metric): metric is TChartConfiguratorMetrics =>
      isChartConfiguratorMetric(metric) && allowedSet.has(metric),
  );

  if (exploreModeSourceMetrics.length >= 2) {
    const sharedDateRanges =
      getIntersectedExploreModeDateRangesForMetrics(exploreModeSourceMetrics);
    if (sharedDateRanges.length === 0) {
      errors.push({ type: ComputedMetricSemanticErrorType.NoSharedDateRanges });
    }

    if (chartContext) {
      const sharedGranularities = getSharedGranularityOptionsForMetrics({
        metrics: exploreModeSourceMetrics,
        startDate: chartContext.startDate,
        endDate: chartContext.endDate,
        breakdown: chartContext.breakdown,
      });
      if (sharedGranularities.length === 0) {
        errors.push({ type: ComputedMetricSemanticErrorType.NoSharedGranularities });
      }
    }
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  return ValidResult;
};

export default validateComputedMetricSemantics;
