import { ChartType } from '@modules/charts-generic';
import { RAQIV2MetricGranularity } from '@rbx/creator-hub-analytics-config';
import type { OverlayType } from '../types/RAQIV2ChartSpec';
import type RAQIV2ChartSpec from '../types/RAQIV2ChartSpec';
import { allowBenchmarks } from '../hooks/useAnalyticsBenchmarks';
import type { ExploreModeChartType } from '../exploreMode/ExploreModeChartTypes';

export type OverlayDisabledReason =
  | 'chartType'
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

const OVERLAY_SUPPORTED_CHART_TYPES: ReadonlySet<ExploreModeChartType> = new Set([
  ChartType.Spline,
  ChartType.DurationSpline,
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
    isTrendLineEnabled: boolean;
    hasBreakdown: boolean;
    chartType?: ExploreModeChartType;
  },
): OverlayAvailability => {
  const chartTypeDisabled =
    options.chartType !== undefined && !OVERLAY_SUPPORTED_CHART_TYPES.has(options.chartType);

  const isBenchmarkEligible = !options.isComputedMetric && spec !== null;

  const benchmarkContextAllowed = spec !== null && allowBenchmarks(spec);

  const benchmarkDisabled = chartTypeDisabled || (isBenchmarkEligible && !benchmarkContextAllowed);
  const benchmarkReason: OverlayDisabledReason | undefined = (() => {
    if (chartTypeDisabled) return 'chartType';
    if (!isBenchmarkEligible || benchmarkContextAllowed) return undefined;
    if (options.hasBreakdown) return 'breakdown';
    if (spec?.granularity !== RAQIV2MetricGranularity.OneDay) return 'granularity';
    return 'benchmarkContext';
  })();

  const comparisonDisabled = chartTypeDisabled || options.hasBreakdown;
  const comparisonReason: OverlayDisabledReason | undefined = (() => {
    if (chartTypeDisabled) return 'chartType';
    if (options.hasBreakdown) return 'breakdown';
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
    'trend-line': {
      applicable: options.isTrendLineEnabled,
      disabled: chartTypeDisabled,
      reason: chartTypeDisabled ? 'chartType' : undefined,
    },
  };
};

export default getOverlayAvailability;
