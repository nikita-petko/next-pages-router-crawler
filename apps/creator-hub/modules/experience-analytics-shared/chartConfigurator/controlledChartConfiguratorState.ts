import {
  RAQIV2DateRangeType,
  RAQIV2MetricGranularity,
  type TRAQIV2Dimension,
} from '@rbx/creator-hub-analytics-config';
import { ChartType } from '@modules/charts-generic/charts/types/ChartTypes';
import type { OverlayOption } from '../components/chartConfigurator/ChartConfiguratorOverlaysControl';
import type { ExploreModeTableMetricColumn } from '../components/chartConfigurator/chartConfiguratorTableColumns';
import { isComputedMetricAllowedForExploreMode } from '../exploreMode/resolveExploreModeQueryState';
import type { BenchmarkOverlayType } from '../hooks/useAnalyticsBenchmarks';
import type { UIFilters } from '../layout/ExperienceAnalyticsPageControlBar/filterUtils';
import type { ComputedMetric, MetricLike } from '../types/ComputedMetric';
import type { TUIGranularity } from '../utils/seriesGranularities';
import type { ChartConfiguratorChartType } from './ChartConfiguratorChartTypes';
import type { TChartConfiguratorMetrics } from './chartConfiguratorMetricsConfig';
import getSharedGranularityOptionsForMetrics from './getSharedGranularityOptionsForMetrics';
import getChartTypeSupportForMetric, {
  UnsupportedL7SmoothingCumulativeGranularityReason,
  type ChartTypeMetricSupport,
} from './isChartTypeSupportedForMetric';
import isDurationChartMetric, { isDurationChartType } from './isDurationChartMetric';
import type { ComparisonCustomStartDateValue, ComparisonOffsetValue } from './overlayUrlParams';
import resolveChartConfiguratorComputedMetricSources, {
  DefaultExploreModeDateRanges,
  getIntersectedExploreModeDateRangesForMetrics,
} from './resolveChartConfiguratorComputedMetricSources';
import { SmoothingOptionValue, type SmoothingOption } from './smoothingOptions';

const UnsupportedSmoothingCumulativeChartSupport: ChartTypeMetricSupport = {
  isSupported: false,
  unsupportedReason: UnsupportedL7SmoothingCumulativeGranularityReason,
};

/**
 * Pure state and derivation helpers for controlled chart configurator surfaces.
 *
 * This module intentionally has no React/provider dependencies. Product hooks
 * can reuse it to keep draft state, chart type availability, and granularity
 * coercion testable without rendering the sidebar or binding to a route.
 */
export const ChartConfiguratorChartTypeOrder: readonly ChartConfiguratorChartType[] = [
  ChartType.Spline,
  ChartType.Area,
  ChartType.DurationSpline,
  ChartType.DurationArea,
  ChartType.Bar,
  ChartType.Column,
  ChartType.Pie,
  ChartType.Table,
];

/** How metric identity is seeded before the reducer normalizes runtime storage. */
export enum ControlledChartConfiguratorInitialMetricMode {
  Empty = 'empty',
  Atomic = 'atomic',
  Computed = 'computed',
}

export type ControlledChartConfiguratorChartSettings = {
  readonly chartType: ChartConfiguratorChartType | null;
  readonly breakdownDimensions?: readonly string[] | null;
  readonly granularity?: TUIGranularity;
  readonly l7Smoothing?: boolean;
  /**
   * Overlay seed for surfaces that support overlays (e.g. the custom dashboard
   * chart editor). Explore Mode drives overlays from URL params on a separate
   * path and leaves these unset; surfaces that do not enable overlay controls
   * simply ignore the seeded values.
   */
  readonly overlayOption?: OverlayOption;
  readonly benchmarkType?: BenchmarkOverlayType | null;
  readonly comparisonOffset?: ComparisonOffsetValue;
  readonly comparisonCustomStartDate?: ComparisonCustomStartDateValue;
  readonly customEventFilters?: UIFilters;
  readonly tableAdditionalColumns?: readonly ExploreModeTableMetricColumn[];
};

/**
 * Hydration shape for controlled configurator seeds.
 *
 * - `empty`: no metric selected yet (new tile / cleared state).
 * - `atomic`: simple metric selection; `computedMetric` must not be set.
 * - `computed`: formula mode; `metric` is an optional anchor for source resolution.
 */
export type ControlledChartConfiguratorInitialState =
  | ({
      readonly metricMode: ControlledChartConfiguratorInitialMetricMode.Empty;
      readonly metric: null;
      readonly computedMetric?: null;
    } & ControlledChartConfiguratorChartSettings)
  | ({
      readonly metricMode: ControlledChartConfiguratorInitialMetricMode.Atomic;
      readonly metric: TChartConfiguratorMetrics;
      readonly computedMetric?: null;
    } & ControlledChartConfiguratorChartSettings)
  | ({
      readonly metricMode: ControlledChartConfiguratorInitialMetricMode.Computed;
      readonly computedMetric: ComputedMetric;
      readonly metric: TChartConfiguratorMetrics | null;
    } & ControlledChartConfiguratorChartSettings);

/**
 * Builds a discriminated initial state from flat editor/tile fields.
 * Prefer the union directly when the caller already knows the mode.
 */
export function buildControlledChartConfiguratorInitialState({
  metric,
  computedMetric = null,
  chartType,
  breakdownDimensions,
  granularity,
  l7Smoothing,
  overlayOption,
  benchmarkType,
  comparisonOffset,
  comparisonCustomStartDate,
  customEventFilters,
  tableAdditionalColumns,
}: {
  readonly metric: TChartConfiguratorMetrics | null;
  readonly computedMetric?: ComputedMetric | null;
  readonly chartType: ChartConfiguratorChartType | null;
  readonly breakdownDimensions?: readonly string[] | null;
  readonly granularity?: TUIGranularity;
  readonly l7Smoothing?: boolean;
  readonly overlayOption?: OverlayOption;
  readonly benchmarkType?: BenchmarkOverlayType | null;
  readonly comparisonOffset?: ComparisonOffsetValue;
  readonly comparisonCustomStartDate?: ComparisonCustomStartDateValue;
  readonly customEventFilters?: UIFilters;
  readonly tableAdditionalColumns?: readonly ExploreModeTableMetricColumn[];
}): ControlledChartConfiguratorInitialState {
  const chartSettings: ControlledChartConfiguratorChartSettings = {
    chartType,
    breakdownDimensions,
    granularity,
    l7Smoothing,
    overlayOption,
    benchmarkType,
    comparisonOffset,
    comparisonCustomStartDate,
    customEventFilters,
    tableAdditionalColumns,
  };
  if (computedMetric) {
    return {
      metricMode: ControlledChartConfiguratorInitialMetricMode.Computed,
      computedMetric,
      metric,
      ...chartSettings,
    };
  }
  if (metric) {
    return {
      metricMode: ControlledChartConfiguratorInitialMetricMode.Atomic,
      metric,
      ...chartSettings,
    };
  }
  return {
    metricMode: ControlledChartConfiguratorInitialMetricMode.Empty,
    metric: null,
    ...chartSettings,
  };
}

export type ControlledChartConfiguratorState = {
  readonly metric: TChartConfiguratorMetrics | null;
  readonly computedMetric: ComputedMetric | null;
  readonly chartTypeOverride: ChartConfiguratorChartType | null;
  readonly granularity: TUIGranularity;
  readonly isOperationsToggleOn: boolean;
  readonly operationsDraftMetric: ComputedMetric | null;
  readonly smoothingOption: SmoothingOption;
  readonly overlayOption: OverlayOption;
  readonly benchmarkType: BenchmarkOverlayType | null;
  readonly comparisonOffset: ComparisonOffsetValue;
  readonly comparisonCustomStartDate: ComparisonCustomStartDateValue;
  readonly customEventFilters: UIFilters;
  readonly tableAdditionalColumns: readonly ExploreModeTableMetricColumn[];
};

export type ControlledChartConfiguratorStateSeed = {
  readonly allowedMetrics: readonly TChartConfiguratorMetrics[];
  readonly initialState?: ControlledChartConfiguratorInitialState;
};

export type ControlledChartConfiguratorMetricDerivation = {
  readonly displaySourceMetrics: readonly TChartConfiguratorMetrics[];
  readonly displayMetric: TChartConfiguratorMetrics | null;
  readonly hasUnsupportedSourceMetrics: boolean;
  readonly hasSharedDateRanges: boolean;
  readonly dateRangeOptions: readonly RAQIV2DateRangeType[];
};

export type GranularityFallbackReason =
  | 'unsupported-requested-granularity'
  | 'no-supported-granularity';

export type ControlledChartConfiguratorGranularitySelection = {
  readonly requestedGranularity: TUIGranularity;
  readonly effectiveGranularity: TUIGranularity;
  readonly isRequestedGranularitySupported: boolean;
  readonly fallbackReason: GranularityFallbackReason | null;
  readonly allowedGranularities: readonly TUIGranularity[];
};

export enum ControlledChartConfiguratorActionType {
  ResetFromSeed = 'RESET_FROM_SEED',
  SetMetric = 'SET_METRIC',
  SetComputedMetric = 'SET_COMPUTED_METRIC',
  SetChartType = 'SET_CHART_TYPE',
  SetChartTypeWithGranularity = 'SET_CHART_TYPE_WITH_GRANULARITY',
  SetGranularity = 'SET_GRANULARITY',
  SetOperationsToggle = 'SET_OPERATIONS_TOGGLE',
  SetOperationsDraft = 'SET_OPERATIONS_DRAFT',
  SetSmoothingOption = 'SET_SMOOTHING_OPTION',
  SetOverlayOption = 'SET_OVERLAY_OPTION',
  SetBenchmarkType = 'SET_BENCHMARK_TYPE',
  SetComparisonOffset = 'SET_COMPARISON_OFFSET',
  SetComparisonCustomStartDate = 'SET_COMPARISON_CUSTOM_START_DATE',
  SetCustomEventFilters = 'SET_CUSTOM_EVENT_FILTERS',
  SetTableAdditionalColumns = 'SET_TABLE_ADDITIONAL_COLUMNS',
  CoerceGranularity = 'COERCE_GRANULARITY',
}

/**
 * Reducer actions describe user edits and controlled re-seeding separately.
 * Re-seeding is for "now editing a different entity"; normal sidebar edits
 * should keep working against the existing draft state.
 */
export type ControlledChartConfiguratorAction =
  | {
      readonly type: ControlledChartConfiguratorActionType.ResetFromSeed;
      readonly seed: ControlledChartConfiguratorStateSeed;
    }
  | {
      readonly type: ControlledChartConfiguratorActionType.SetMetric;
      readonly metric: TChartConfiguratorMetrics | null;
    }
  | {
      readonly type: ControlledChartConfiguratorActionType.SetComputedMetric;
      readonly computedMetric: ComputedMetric | null;
    }
  | {
      readonly type: ControlledChartConfiguratorActionType.SetChartType;
      readonly chartType: ChartConfiguratorChartType | null;
    }
  | {
      readonly type: ControlledChartConfiguratorActionType.SetChartTypeWithGranularity;
      readonly chartType: ChartConfiguratorChartType;
      readonly granularity: TUIGranularity;
    }
  | {
      readonly type: ControlledChartConfiguratorActionType.SetGranularity;
      readonly granularity: TUIGranularity;
    }
  | {
      readonly type: ControlledChartConfiguratorActionType.SetOperationsToggle;
      readonly enabled: boolean;
      readonly seededComputedMetric: ComputedMetric | null;
    }
  | {
      readonly type: ControlledChartConfiguratorActionType.SetOperationsDraft;
      readonly operationsDraftMetric: ComputedMetric | null;
    }
  | {
      readonly type: ControlledChartConfiguratorActionType.SetSmoothingOption;
      readonly smoothingOption: SmoothingOption;
    }
  | {
      readonly type: ControlledChartConfiguratorActionType.SetOverlayOption;
      readonly overlayOption: OverlayOption;
    }
  | {
      readonly type: ControlledChartConfiguratorActionType.SetBenchmarkType;
      readonly benchmarkType: BenchmarkOverlayType | null;
    }
  | {
      readonly type: ControlledChartConfiguratorActionType.SetComparisonOffset;
      readonly comparisonOffset: ComparisonOffsetValue;
    }
  | {
      readonly type: ControlledChartConfiguratorActionType.SetComparisonCustomStartDate;
      readonly comparisonCustomStartDate: ComparisonCustomStartDateValue;
    }
  | {
      readonly type: ControlledChartConfiguratorActionType.SetCustomEventFilters;
      readonly filters: UIFilters;
    }
  | {
      readonly type: ControlledChartConfiguratorActionType.SetTableAdditionalColumns;
      readonly tableAdditionalColumns: readonly ExploreModeTableMetricColumn[];
    }
  | {
      readonly type: ControlledChartConfiguratorActionType.CoerceGranularity;
      readonly granularity: TUIGranularity;
    };

function sanitizeMetric(
  metric: TChartConfiguratorMetrics | null | undefined,
  allowedMetrics: readonly TChartConfiguratorMetrics[],
): TChartConfiguratorMetrics | null {
  return metric && allowedMetrics.includes(metric) ? metric : null;
}

function sanitizeComputedMetric(
  computedMetric: ComputedMetric | null | undefined,
  allowedMetrics: readonly TChartConfiguratorMetrics[],
): ComputedMetric | null {
  if (!computedMetric) {
    return null;
  }
  return isComputedMetricAllowedForExploreMode({
    computedMetric,
    allowedMetrics,
  })
    ? computedMetric
    : null;
}

export function createInitialControlledChartConfiguratorState({
  allowedMetrics,
  initialState,
}: ControlledChartConfiguratorStateSeed): ControlledChartConfiguratorState {
  const chartTypeOverride = initialState?.chartType ?? null;
  const granularity = initialState?.granularity ?? RAQIV2MetricGranularity.OneDay;
  const smoothingOption =
    initialState?.computedMetric?.l7Smoothing || initialState?.l7Smoothing
      ? SmoothingOptionValue.L7MovingAverage
      : SmoothingOptionValue.None;
  const overlayOption: OverlayOption = initialState?.overlayOption ?? 'none';
  const benchmarkType = initialState?.benchmarkType ?? null;
  const comparisonOffset = initialState?.comparisonOffset;
  const comparisonCustomStartDate = initialState?.comparisonCustomStartDate;
  const customEventFilters = initialState?.customEventFilters
    ? [...initialState.customEventFilters]
    : [];
  const tableAdditionalColumns = initialState?.tableAdditionalColumns
    ? [...initialState.tableAdditionalColumns]
    : [];

  if (!initialState) {
    return {
      metric: null,
      computedMetric: null,
      chartTypeOverride,
      granularity,
      isOperationsToggleOn: false,
      operationsDraftMetric: null,
      smoothingOption,
      overlayOption,
      benchmarkType,
      comparisonOffset,
      comparisonCustomStartDate,
      customEventFilters,
      tableAdditionalColumns,
    };
  }

  switch (initialState.metricMode) {
    case ControlledChartConfiguratorInitialMetricMode.Computed: {
      const sanitizedComputedMetric = sanitizeComputedMetric(
        initialState.computedMetric,
        allowedMetrics,
      );
      return {
        metric: sanitizeMetric(initialState.metric, allowedMetrics),
        computedMetric: sanitizedComputedMetric,
        chartTypeOverride,
        granularity,
        isOperationsToggleOn: sanitizedComputedMetric !== null,
        operationsDraftMetric: null,
        smoothingOption,
        overlayOption,
        benchmarkType,
        comparisonOffset,
        comparisonCustomStartDate,
        customEventFilters,
        tableAdditionalColumns,
      };
    }
    case ControlledChartConfiguratorInitialMetricMode.Atomic:
      return {
        metric: sanitizeMetric(initialState.metric, allowedMetrics),
        computedMetric: null,
        chartTypeOverride,
        granularity,
        isOperationsToggleOn: false,
        operationsDraftMetric: null,
        smoothingOption,
        overlayOption,
        benchmarkType,
        comparisonOffset,
        comparisonCustomStartDate,
        customEventFilters,
        tableAdditionalColumns,
      };
    case ControlledChartConfiguratorInitialMetricMode.Empty:
    default:
      return {
        metric: null,
        computedMetric: null,
        chartTypeOverride,
        granularity,
        isOperationsToggleOn: false,
        operationsDraftMetric: null,
        smoothingOption,
        overlayOption,
        benchmarkType,
        comparisonOffset,
        comparisonCustomStartDate,
        customEventFilters,
        tableAdditionalColumns,
      };
  }
}

export function deriveControlledChartConfiguratorMetrics({
  executionMetric,
  fallbackMetric,
  allowedMetrics,
}: {
  readonly executionMetric: MetricLike | null;
  readonly fallbackMetric: TChartConfiguratorMetrics | null;
  readonly allowedMetrics: readonly TChartConfiguratorMetrics[];
}): ControlledChartConfiguratorMetricDerivation {
  const { displaySourceMetrics, hasUnsupportedSourceMetrics } =
    resolveChartConfiguratorComputedMetricSources({
      executionMetric,
      fallbackMetric,
      allowedMetrics,
    });
  const displayMetric =
    fallbackMetric && displaySourceMetrics.includes(fallbackMetric)
      ? fallbackMetric
      : (displaySourceMetrics[0] ?? null);
  const intersectedDateRanges = getIntersectedExploreModeDateRangesForMetrics(displaySourceMetrics);
  const hasSharedDateRanges = displaySourceMetrics.length === 0 || intersectedDateRanges.length > 0;
  const dateRangeOptions =
    displaySourceMetrics.length === 0
      ? [...DefaultExploreModeDateRanges]
      : hasSharedDateRanges
        ? [...intersectedDateRanges]
        : [RAQIV2DateRangeType.Last28Days];

  return {
    displaySourceMetrics,
    displayMetric,
    hasUnsupportedSourceMetrics,
    hasSharedDateRanges,
    dateRangeOptions,
  };
}

/**
 * Owns only draft state transitions. Derived outputs such as selected chart type
 * and sanitized granularity stay in separate helpers so callers can recompute
 * them from provider/date-range context without storing duplicate state.
 */
export function controlledChartConfiguratorReducer(
  state: ControlledChartConfiguratorState,
  action: ControlledChartConfiguratorAction,
): ControlledChartConfiguratorState {
  switch (action.type) {
    case ControlledChartConfiguratorActionType.ResetFromSeed:
      return createInitialControlledChartConfiguratorState(action.seed);
    case ControlledChartConfiguratorActionType.SetMetric:
      return {
        ...state,
        metric: action.metric,
        computedMetric: null,
        isOperationsToggleOn: false,
        operationsDraftMetric: null,
      };
    case ControlledChartConfiguratorActionType.SetComputedMetric:
      return {
        ...state,
        computedMetric: action.computedMetric,
        ...(action.computedMetric
          ? { isOperationsToggleOn: true, operationsDraftMetric: null }
          : {}),
      };
    case ControlledChartConfiguratorActionType.SetChartType:
      return { ...state, chartTypeOverride: action.chartType };
    case ControlledChartConfiguratorActionType.SetChartTypeWithGranularity:
      return {
        ...state,
        chartTypeOverride: action.chartType,
        granularity: action.granularity,
      };
    case ControlledChartConfiguratorActionType.SetGranularity:
      return { ...state, granularity: action.granularity };
    case ControlledChartConfiguratorActionType.SetOperationsToggle:
      if (action.enabled) {
        return {
          ...state,
          isOperationsToggleOn: true,
          ...(state.computedMetric === null && action.seededComputedMetric
            ? {
                computedMetric: action.seededComputedMetric,
                operationsDraftMetric: action.seededComputedMetric,
              }
            : {}),
        };
      }
      return {
        ...state,
        isOperationsToggleOn: false,
        computedMetric: null,
        operationsDraftMetric: null,
      };
    case ControlledChartConfiguratorActionType.SetOperationsDraft:
      return { ...state, operationsDraftMetric: action.operationsDraftMetric };
    case ControlledChartConfiguratorActionType.SetSmoothingOption:
      return { ...state, smoothingOption: action.smoothingOption };
    case ControlledChartConfiguratorActionType.SetOverlayOption:
      return {
        ...state,
        overlayOption: action.overlayOption,
        // Drop the benchmark selection when the overlay is no longer benchmarks
        // so persisted/derived state cannot keep a stale benchmark type.
        benchmarkType: action.overlayOption === 'benchmarks' ? state.benchmarkType : null,
      };
    case ControlledChartConfiguratorActionType.SetBenchmarkType:
      return { ...state, benchmarkType: action.benchmarkType };
    case ControlledChartConfiguratorActionType.SetComparisonOffset:
      return { ...state, comparisonOffset: action.comparisonOffset };
    case ControlledChartConfiguratorActionType.SetComparisonCustomStartDate:
      return { ...state, comparisonCustomStartDate: action.comparisonCustomStartDate };
    case ControlledChartConfiguratorActionType.SetCustomEventFilters:
      return { ...state, customEventFilters: action.filters };
    case ControlledChartConfiguratorActionType.SetTableAdditionalColumns:
      return { ...state, tableAdditionalColumns: [...action.tableAdditionalColumns] };
    case ControlledChartConfiguratorActionType.CoerceGranularity:
      return state.granularity === action.granularity
        ? state
        : { ...state, granularity: action.granularity };
    default:
      return state;
  }
}

/**
 * Re-validates granularity against the active metric/date/breakdown context.
 * Call this whenever those inputs change; one-shot initial sanitation is not
 * enough for editable configurator surfaces.
 */
export function coerceGranularityForMetric({
  displayMetric,
  currentGranularity,
  startDate,
  endDate,
  breakdown,
}: {
  readonly displayMetric: TChartConfiguratorMetrics | null;
  readonly currentGranularity: TUIGranularity;
  readonly startDate: Date | undefined;
  readonly endDate: Date | undefined;
  readonly breakdown: readonly TRAQIV2Dimension[] | undefined;
}): TUIGranularity | null {
  const selection = resolveGranularitySelection({
    metrics: displayMetric ? [displayMetric] : [],
    requestedGranularity: currentGranularity,
    startDate,
    endDate,
    breakdown,
  });
  return selection.isRequestedGranularitySupported
    ? currentGranularity
    : selection.effectiveGranularity;
}

/**
 * Splits persisted/user-requested granularity from the granularity a chart can
 * safely render for the current metric/date/breakdown context.
 */
export function resolveGranularitySelection({
  metrics,
  requestedGranularity,
  startDate,
  endDate,
  breakdown,
}: {
  // The metric(s) that constrain granularity. A single atomic metric passes one
  // entry; computed/operations charts pass every source metric so the allowed set
  // is the intersection their formula can actually be evaluated at.
  readonly metrics: readonly TChartConfiguratorMetrics[];
  readonly requestedGranularity: TUIGranularity;
  readonly startDate: Date | undefined;
  readonly endDate: Date | undefined;
  readonly breakdown: readonly TRAQIV2Dimension[] | undefined;
}): ControlledChartConfiguratorGranularitySelection {
  if (metrics.length === 0 || !startDate || !endDate) {
    return {
      requestedGranularity,
      effectiveGranularity: requestedGranularity,
      isRequestedGranularitySupported: true,
      fallbackReason: null,
      allowedGranularities: [],
    };
  }
  const allowedGranularities = getSharedGranularityOptionsForMetrics({
    metrics,
    startDate,
    endDate,
    breakdown,
  });
  if (allowedGranularities.length === 0) {
    return {
      requestedGranularity,
      effectiveGranularity: requestedGranularity,
      isRequestedGranularitySupported: false,
      fallbackReason: 'no-supported-granularity',
      allowedGranularities,
    };
  }
  if (allowedGranularities.includes(requestedGranularity)) {
    return {
      requestedGranularity,
      effectiveGranularity: requestedGranularity,
      isRequestedGranularitySupported: true,
      fallbackReason: null,
      allowedGranularities,
    };
  }
  const effectiveGranularity = allowedGranularities.includes(RAQIV2MetricGranularity.OneDay)
    ? RAQIV2MetricGranularity.OneDay
    : allowedGranularities[0];
  return {
    requestedGranularity,
    effectiveGranularity,
    isRequestedGranularitySupported: false,
    fallbackReason: 'unsupported-requested-granularity',
    allowedGranularities,
  };
}

/**
 * Whether a chart type can faithfully render at the given granularity.
 *
 * `Bar` and `Pie` collapse the whole range into a single aggregate value, so
 * they only make sense at cumulative (`None`) granularity. Rendering them
 * against a bucketed time series silently plots just the first bucket instead of
 * the sum. Used to drop a stale chart-type override once granularity is coerced
 * to an incompatible value (e.g. adding a computed-metric source that can't be
 * cumulative), so the rendered chart and the sidebar control stay consistent
 * with the effective granularity. Other chart types keep their own derivation.
 */
export function isChartTypeCompatibleWithGranularity(
  chartType: ChartConfiguratorChartType,
  granularity: TUIGranularity,
): boolean {
  if (chartType === ChartType.Bar || chartType === ChartType.Pie) {
    return granularity === RAQIV2MetricGranularity.None;
  }
  return true;
}

/**
 * Chart types offered by the controlled configurator (custom dashboard editor).
 * Explore Mode keeps separate availability rules in ExploreModeSidebarPage.
 * Area is not supported here yet; hydrated Area tiles coerce to Spline via
 * selectSupportedChartType and the chart editor seed mapping.
 */
function isControlledConfiguratorChartTypeAvailable(
  chartType: ChartConfiguratorChartType,
  isDurationMetric: boolean,
): boolean {
  if (chartType === ChartType.Table) {
    return true;
  }
  if (isDurationChartType(chartType)) {
    return isDurationMetric;
  }
  if (chartType === ChartType.Area) {
    return false;
  }
  if (
    chartType === ChartType.Spline ||
    chartType === ChartType.Column ||
    chartType === ChartType.Bar ||
    chartType === ChartType.Pie
  ) {
    return !isDurationMetric;
  }
  return true;
}

export function deriveChartTypeAvailability({
  displayMetric,
  isChartTypeAvailable,
  isL7SmoothingEnabled = false,
}: {
  readonly displayMetric: TChartConfiguratorMetrics | null;
  readonly isChartTypeAvailable: (chartType: ChartConfiguratorChartType) => boolean;
  readonly isL7SmoothingEnabled?: boolean;
}): {
  readonly availableChartTypes: readonly ChartConfiguratorChartType[];
  readonly supportedChartTypes: readonly ChartConfiguratorChartType[];
  readonly chartTypeSupport: Record<ChartConfiguratorChartType, ChartTypeMetricSupport>;
} {
  const supported: ChartTypeMetricSupport = { isSupported: true };
  const getSupport = (chartType: ChartConfiguratorChartType): ChartTypeMetricSupport => {
    if (isL7SmoothingEnabled && (chartType === ChartType.Bar || chartType === ChartType.Pie)) {
      return UnsupportedSmoothingCumulativeChartSupport;
    }
    return !displayMetric ? supported : getChartTypeSupportForMetric(chartType, displayMetric);
  };
  const chartTypeSupport: Record<ChartConfiguratorChartType, ChartTypeMetricSupport> = {
    [ChartType.Spline]: getSupport(ChartType.Spline),
    [ChartType.Area]: getSupport(ChartType.Area),
    [ChartType.DurationSpline]: getSupport(ChartType.DurationSpline),
    [ChartType.DurationArea]: getSupport(ChartType.DurationArea),
    [ChartType.Bar]: getSupport(ChartType.Bar),
    [ChartType.Column]: getSupport(ChartType.Column),
    [ChartType.Pie]: getSupport(ChartType.Pie),
    [ChartType.Table]: getSupport(ChartType.Table),
  };
  const availableChartTypes = ChartConfiguratorChartTypeOrder.filter(isChartTypeAvailable);
  const supportedChartTypes = availableChartTypes.filter(
    (chartType) => chartTypeSupport[chartType].isSupported,
  );
  return { availableChartTypes, supportedChartTypes, chartTypeSupport };
}

/**
 * Derives chart type availability and the effective selection for controlled surfaces.
 * Metric compatibility stays centralized here; product-specific rules live in callers
 * (for example, Explore Mode) or in explicit editor coercion (Area → Spline).
 */
export function selectSupportedChartType({
  chartTypeOverride,
  displayMetric,
  defaultChartType = ChartType.Spline,
  isL7SmoothingEnabled = false,
  granularity,
}: {
  readonly chartTypeOverride: ChartConfiguratorChartType | null;
  readonly displayMetric: TChartConfiguratorMetrics | null;
  readonly defaultChartType?: ChartConfiguratorChartType;
  readonly isL7SmoothingEnabled?: boolean;
  // When provided, a chart-type override that is incompatible with the effective
  // granularity (e.g. a cumulative Bar after granularity coerces to daily) is
  // ignored so it does not render against a mismatched series.
  readonly granularity?: TUIGranularity;
}): {
  readonly selectedChartType: ChartConfiguratorChartType;
  readonly availableChartTypes: readonly ChartConfiguratorChartType[];
  readonly supportedChartTypes: readonly ChartConfiguratorChartType[];
  readonly chartTypeSupport: Record<ChartConfiguratorChartType, ChartTypeMetricSupport>;
} {
  const isDurationMetric = displayMetric ? isDurationChartMetric(displayMetric) : false;
  const { availableChartTypes, supportedChartTypes, chartTypeSupport } =
    deriveChartTypeAvailability({
      displayMetric,
      isChartTypeAvailable: (chartType) =>
        isControlledConfiguratorChartTypeAvailable(chartType, isDurationMetric),
      isL7SmoothingEnabled,
    });
  const resolvedChartType =
    chartTypeOverride && supportedChartTypes.includes(chartTypeOverride)
      ? chartTypeOverride
      : supportedChartTypes.includes(defaultChartType)
        ? defaultChartType
        : (supportedChartTypes[0] ?? ChartType.Spline);
  // Coerce away from a cumulative chart type (Bar/Pie) when the effective
  // granularity is time-bucketed — both the override and the seeded default can
  // be cumulative after granularity is coerced for a new metric/formula.
  const selectedChartType =
    granularity === undefined ||
    isChartTypeCompatibleWithGranularity(resolvedChartType, granularity)
      ? resolvedChartType
      : (supportedChartTypes.find((chartType) =>
          isChartTypeCompatibleWithGranularity(chartType, granularity),
        ) ?? ChartType.Spline);
  return {
    selectedChartType,
    availableChartTypes,
    supportedChartTypes,
    chartTypeSupport,
  };
}

/**
 * Returns the computed metric payload that should be persisted by consumers.
 * Controlled configurator drafts clear stale L7 smoothing unless the shared
 * hook is actively enabling smoothing for the saved value.
 */
export function normalizePersistedComputedMetric(
  effectiveComputedMetric: ComputedMetric | null,
  isOperationsToggleOn: boolean,
  smoothingOption: SmoothingOption = SmoothingOptionValue.None,
): ComputedMetric | null {
  if (!isOperationsToggleOn || !effectiveComputedMetric) {
    return null;
  }
  const { l7Smoothing: _l7Smoothing, ...withoutL7Smoothing } = effectiveComputedMetric;
  return smoothingOption === SmoothingOptionValue.L7MovingAverage
    ? { ...withoutL7Smoothing, l7Smoothing: true }
    : withoutL7Smoothing;
}

export function isL7SmoothingDisabledForChartType(
  selectedChartType: ChartConfiguratorChartType,
): boolean {
  return isDurationChartType(selectedChartType);
}
