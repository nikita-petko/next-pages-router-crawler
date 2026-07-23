import { RAQIV2MetricGranularity } from '@rbx/creator-hub-analytics-config';
import { ChartType } from '@modules/charts-generic/charts/types/ChartTypes';
import type { ChartConfiguratorChartType } from '../chartConfigurator/ChartConfiguratorChartTypes';
import { isComparisonCompatibleDurationBucketDimension } from '../constants/RAQIV2DurationBucketDimensions';
import { allowBenchmarks } from '../hooks/useAnalyticsBenchmarks';
import type { OverlayType } from '../types/RAQIV2ChartSpec';
import type RAQIV2ChartSpec from '../types/RAQIV2ChartSpec';
import {
  COMPARISON_SUPPORTED_CHART_TYPES,
  DURATION_CHART_TYPES,
} from './isComparisonOverlayMeaningful';

export type OverlayDisabledReason =
  | 'chartType'
  | 'durationMetric'
  | 'breakdown'
  | 'granularity'
  | 'benchmarkContext'
  | 'noBenchmarkData';

type OverlayStatus = {
  applicable: boolean;
  disabled?: boolean;
  reason?: OverlayDisabledReason;
};

export type OverlayAvailability = Record<OverlayType, OverlayStatus>;

const OVERLAY_SUPPORTED_CHART_TYPES: ReadonlySet<ChartConfiguratorChartType> = new Set([
  ChartType.Spline,
]);

/**
 * Determines which overlay types are available and/or temporarily disabled
 * for a given chart spec and context.
 *
 * Separates two concerns:
 * - **Applicability**: Can this overlay type ever work here? (drives visibility)
 * - **Disabled**: Applicable but temporarily blocked? (drives grayed-out state)
 *
 * This separation becomes critical for multi-select UI where users need to
 * understand *why* an option is unavailable.
 */
const getOverlayAvailability = (
  spec: RAQIV2ChartSpec | null,
  options: {
    isComputedMetric: boolean;
    hasBreakdown: boolean;
    chartType?: ChartConfiguratorChartType;
    /**
     * True when the active metric has a quota companion metric available
     * (e.g. DataStoreStorageUsageBytes ↔ DataStoreStorageQuotaBytes). Drives
     * whether the Quota overlay radio is shown.
     */
    hasQuota: boolean;
  },
): OverlayAvailability => {
  const isDurationChartType =
    options.chartType !== undefined && DURATION_CHART_TYPES.has(options.chartType);
  const chartTypeDisabled =
    options.chartType !== undefined && !OVERLAY_SUPPORTED_CHART_TYPES.has(options.chartType);
  const chartTypeReason: OverlayDisabledReason = isDurationChartType
    ? 'durationMetric'
    : 'chartType';

  const isBenchmarkEligible = !options.isComputedMetric && spec !== null;

  const benchmarkContextAllowed = spec !== null && allowBenchmarks(spec);

  const benchmarkDisabled = chartTypeDisabled || (isBenchmarkEligible && !benchmarkContextAllowed);
  const benchmarkReason: OverlayDisabledReason | undefined = (() => {
    if (chartTypeDisabled) {
      return chartTypeReason;
    }
    if (!isBenchmarkEligible || benchmarkContextAllowed) {
      return undefined;
    }
    if (options.hasBreakdown) {
      return 'breakdown';
    }
    if (spec?.granularity !== RAQIV2MetricGranularity.OneDay) {
      return 'granularity';
    }
    return 'benchmarkContext';
  })();

  const comparisonChartTypeDisabled =
    options.chartType !== undefined && !COMPARISON_SUPPORTED_CHART_TYPES.has(options.chartType);
  const hasOnlyComparisonCompatibleDurationBucketBreakdowns =
    !!spec?.breakdown?.length &&
    spec.breakdown.every(isComparisonCompatibleDurationBucketDimension);
  const hasComparisonIncompatibleBreakdown =
    options.hasBreakdown &&
    !(isDurationChartType && hasOnlyComparisonCompatibleDurationBucketBreakdowns);
  const comparisonDisabled = comparisonChartTypeDisabled || hasComparisonIncompatibleBreakdown;
  const comparisonReason: OverlayDisabledReason | undefined = (() => {
    if (comparisonChartTypeDisabled) {
      return chartTypeReason;
    }
    if (hasComparisonIncompatibleBreakdown) {
      return 'breakdown';
    }
    return undefined;
  })();

  // Quota mirrors the comparison overlay's breakdown behavior: a quota
  // companion is a single series that doesn't combine cleanly with breakdown
  // splits, and `useAnalyticsQuota` silently skips fetching when a breakdown
  // is active. Surface that as a disabled state so the radio explains why.
  const quotaDisabled = chartTypeDisabled || options.hasBreakdown;
  const quotaReason: OverlayDisabledReason | undefined = (() => {
    if (chartTypeDisabled) {
      return chartTypeReason;
    }
    if (options.hasBreakdown) {
      return 'breakdown';
    }
    return undefined;
  })();

  return {
    benchmark: {
      applicable: isBenchmarkEligible,
      disabled: benchmarkDisabled,
      reason: benchmarkDisabled ? benchmarkReason : undefined,
    },
    comparison: {
      applicable: true,
      disabled: comparisonDisabled,
      reason: comparisonDisabled ? comparisonReason : undefined,
    },
    quota: {
      applicable: options.hasQuota,
      disabled: quotaDisabled,
      reason: quotaDisabled ? quotaReason : undefined,
    },
  };
};

export default getOverlayAvailability;
