import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import {
  RAQIV2AggregationType,
  RAQIV2Dimension,
  RAQIV2PercentileType,
  RAQIV2UIPseudoDimension,
  type RAQIV2DateRangeType,
  type TRAQIV2Dimension,
} from '@rbx/creator-hub-analytics-config';
import type { FormattedText } from '@modules/analytics-translations/types';
import { ChartType } from '@modules/charts-generic/charts/types/ChartTypes';
import type { AnalyticsDateRangeBundle } from '@modules/charts-generic/context/AnalyticsQueryDateRangeBundleContext';
import type {
  ChartResource as RAQIV2ChartResource,
  TQueryFilter,
} from '@modules/clients/analytics/analyticsRAQIShared';
import { isValidArrayEnumValue, isValidEnumValue } from '@modules/miscellaneous/utils/enumUtils';
import type { ChartConfiguratorChartType } from '../../chartConfigurator/ChartConfiguratorChartTypes';
import {
  getChartConfiguratorFilterOnlyDimensions,
  getSharedChartConfiguratorDimensions,
} from '../../chartConfigurator/ChartConfiguratorDimensions';
import type { TChartConfiguratorMetrics } from '../../chartConfigurator/chartConfiguratorMetricsConfig';
import {
  ControlledChartConfiguratorActionType,
  controlledChartConfiguratorReducer,
  createInitialControlledChartConfiguratorState,
  deriveControlledChartConfiguratorMetrics,
  normalizePersistedComputedMetric,
  resolveGranularitySelection,
  selectSupportedChartType,
  type ControlledChartConfiguratorGranularitySelection,
  type ControlledChartConfiguratorInitialState,
} from '../../chartConfigurator/controlledChartConfiguratorState';
import { getMetricForL7Smoothing } from '../../chartConfigurator/l7MetricMapping';
import type {
  ComparisonCustomStartDateValue,
  ComparisonOffsetValue,
} from '../../chartConfigurator/overlayUrlParams';
import {
  SmoothingOptionValue,
  type SmoothingOption,
} from '../../chartConfigurator/smoothingOptions';
import { useActiveMetricForQuery } from '../../chartConfigurator/useActiveMetricForQuery';
import getAnalyticsMetricDisplayConfig, {
  isNumericUIMetric,
} from '../../constants/AnalyticsMetricDisplayConfig';
import { getL7SmoothingDisabledReason } from '../../exploreMode/l7SmoothingEligibility';
import { isComputedMetricAllowedForExploreMode } from '../../exploreMode/resolveExploreModeQueryState';
import useCurrentChartContext from '../../exploreMode/useCurrentChartContext';
import type { BenchmarkOverlayType } from '../../hooks/useAnalyticsBenchmarks';
import useRAQIV2TranslationDependencies from '../../hooks/useRAQIV2TranslationDependencies';
import useStableArray from '../../hooks/useStableArray';
import {
  getFilterValueForDimension,
  type UIFilters,
} from '../../layout/ExperienceAnalyticsPageControlBar/filterUtils';
import type { ComputedMetric } from '../../types/ComputedMetric';
import {
  getUIMetricFromAtomicMetricLike,
  isComputedMetric,
  type MetricLike,
} from '../../types/ComputedMetric';
import type RAQIV2ChartSpec from '../../types/RAQIV2ChartSpec';
import computeRAQIV2SpecOverride from '../../utils/computeRAQIV2SpecOverride';
import extractPseudoDimensionsFromFilters, {
  hasPseudoDimensionValues,
} from '../../utils/extractPseudoDimensionsFromFilters';
import type { TUIGranularity } from '../../utils/seriesGranularities';
import getDimensionRenderer from '../getDimensionRenderer';
import type { OverlayOption } from './ChartConfiguratorOverlaysControl';
import type { ChartConfiguratorEmptyStateReason } from './ChartConfiguratorPreview';
import type {
  ChartConfiguratorSidebarAction,
  ChartConfiguratorSidebarProps,
} from './ChartConfiguratorSidebarModelTypes';
import { assertUnhandledSidebarAction } from './ChartConfiguratorSidebarModelTypes';
import type { ExploreModeTableMetricColumn } from './chartConfiguratorTableColumns';
import { MAX_BREAKDOWNS } from './components/ChartConfiguratorBreakdownControl';
import { buildSeededComputedMetricFromSimple } from './computedMetricUrlOwnership';
import {
  isCustomEventsQueryReady,
  useChartConfiguratorSourceSelection,
} from './useChartConfiguratorSourceSelection';

// Stable empty default so the breakdown seeding effect does not treat "no seeded
// breakdown" as a changing dependency on every render.
const EMPTY_BREAKDOWN_DIMENSIONS: readonly string[] = [];

function toCustomEventQueryFilters(filters: UIFilters): readonly TQueryFilter[] {
  // Custom-event controls only write RAQI dimensions (`CustomEventName`) and
  // metric-fanout pseudo-dimensions (`AggregationType`). Keep the conversion at
  // this source-owned boundary instead of weakening UIFilters globally.
  const queryFilters: TQueryFilter[] = [];
  filters.forEach((filter) => {
    if (filter.dimension === RAQIV2Dimension.CustomEventName) {
      queryFilters.push({ dimension: filter.dimension, values: [...filter.values] });
      return;
    }
    if (filter.dimension === RAQIV2UIPseudoDimension.AggregationType) {
      const values = filter.values.filter((value) =>
        isValidEnumValue(RAQIV2AggregationType, value),
      );
      if (values.length > 0) {
        queryFilters.push({ dimension: filter.dimension, values });
      }
      return;
    }
    if (filter.dimension === RAQIV2UIPseudoDimension.PercentileType) {
      const values = filter.values.filter((value) => isValidEnumValue(RAQIV2PercentileType, value));
      if (values.length > 0) {
        queryFilters.push({ dimension: filter.dimension, values });
      }
    }
  });
  return queryFilters;
}

export type { ControlledChartConfiguratorInitialState } from '../../chartConfigurator/controlledChartConfiguratorState';
export {
  ControlledChartConfiguratorActionType,
  ControlledChartConfiguratorInitialMetricMode,
  buildControlledChartConfiguratorInitialState,
} from '../../chartConfigurator/controlledChartConfiguratorState';

/**
 * Inputs for the shared controlled configurator adapter.
 *
 * The pure reducer owns draft state, while this hook binds that state to
 * analytics providers, translations, chart context, and sidebar props. Callers can
 * pass `seedKey` when editing a different persisted entity.
 */
export type UseControlledChartConfiguratorArgs = {
  readonly allowedMetrics: readonly TChartConfiguratorMetrics[];
  readonly resource: RAQIV2ChartResource;
  readonly dateRange: Pick<AnalyticsDateRangeBundle, 'startDate' | 'endDate'>;
  readonly initialState?: ControlledChartConfiguratorInitialState;
  readonly seedKey?: string;
};

/**
 * Minimal render model for chart previews. The hook derives data/spec state,
 * while each product surface owns preview chrome and sizing policy.
 */
export type ControlledChartConfiguratorPreview = {
  readonly chartSpec: RAQIV2ChartSpec | null;
  readonly displayMetric: TChartConfiguratorMetrics | null;
  readonly selectedChartType: ChartConfiguratorChartType;
  readonly computedMetricChartTitleLabel: string | undefined;
  readonly granularitySelection: ControlledChartConfiguratorGranularitySelection;
  readonly overlayOption: OverlayOption;
  readonly benchmarkType: BenchmarkOverlayType | null;
  readonly comparisonOffset: ComparisonOffsetValue;
  readonly comparisonCustomStartDate: ComparisonCustomStartDateValue;
  readonly tableAdditionalColumns: readonly ExploreModeTableMetricColumn[];
  readonly emptyStateReason?: ChartConfiguratorEmptyStateReason;
  readonly fallbackChartTitleLabel: string | undefined;
};

export type UseControlledChartConfiguratorResult = {
  readonly sidebarProps: ChartConfiguratorSidebarProps;
  readonly metric: TChartConfiguratorMetrics | null;
  readonly computedMetric: ComputedMetric | null;
  readonly selectedChartType: ChartConfiguratorChartType;
  readonly breakdownDimensions: readonly TRAQIV2Dimension[];
  /**
   * First seeded/selected breakdown dimension, or `undefined` when none. Editor
   * surfaces persist a single breakdown dimension per tile, so this is the
   * convenience projection of `breakdownDimensions[0]`.
   */
  readonly breakdownDimension: TRAQIV2Dimension | undefined;
  readonly granularity: TUIGranularity;
  readonly effectiveGranularity: TUIGranularity;
  readonly granularitySelection: ControlledChartConfiguratorGranularitySelection;
  readonly dateRangeOptions: readonly RAQIV2DateRangeType[];
  /** Smoothing selection (seeded + user-edited) for persistence by callers. */
  readonly smoothingOption: SmoothingOption;
  /** Smoothing selection after chart-type/granularity eligibility coercion. */
  readonly persistedSmoothingOption: SmoothingOption;
  /**
   * Overlay/benchmark selection. The shared hook tracks these as draft state so
   * editor surfaces can hydrate and persist them; surfaces that do not enable
   * overlay controls leave them at their seeded defaults (`'none'` / `null`).
   */
  readonly overlayOption: OverlayOption;
  readonly benchmarkType: BenchmarkOverlayType | null;
  readonly comparisonOffset: ComparisonOffsetValue;
  readonly comparisonCustomStartDate: ComparisonCustomStartDateValue;
  readonly customEventFilters: UIFilters;
  readonly tableAdditionalColumns: readonly ExploreModeTableMetricColumn[];
  readonly chartPreview: ControlledChartConfiguratorPreview;
};

/**
 * Resolves seeded breakdown dimensions against the dimensions available for the
 * active metric: drops unknown/unsupported values, removes duplicates while
 * preserving order, and clamps to the same `MAX_BREAKDOWNS` cap the breakdown
 * control enforces in the UI.
 */
function resolveBreakdownDimensions(
  requestedDimensions: readonly string[] | null | undefined,
  dimensions: readonly TRAQIV2Dimension[],
): TRAQIV2Dimension[] {
  if (!requestedDimensions?.length) {
    return [];
  }
  const seen = new Set<string>();
  const resolved: TRAQIV2Dimension[] = [];
  for (const requested of requestedDimensions) {
    if (seen.has(requested) || !isValidArrayEnumValue(dimensions, requested)) {
      continue;
    }
    seen.add(requested);
    resolved.push(requested);
    if (resolved.length === MAX_BREAKDOWNS) {
      break;
    }
  }
  return resolved;
}

/**
 * React adapter for add/edit-style configurator surfaces (custom dashboard chart
 * editor today). Explore Mode uses the same reducer through its URL-sync
 * adapter, while this hook owns non-URL editor state for saved chart flows.
 *
 * This hook translates reducer state into `ChartConfiguratorSidebar` props and a
 * preview chart spec. It does not save dashboards, mutate routes, or decide
 * product-level chart type policy; those decisions belong to the caller.
 */
export default function useControlledChartConfigurator({
  allowedMetrics,
  resource,
  dateRange,
  initialState,
  seedKey = 'default',
}: UseControlledChartConfiguratorArgs): UseControlledChartConfiguratorResult {
  const { translate } = useRAQIV2TranslationDependencies();
  const stableAllowedMetrics = useStableArray(allowedMetrics);
  const stateSeed = useMemo(
    () => ({ allowedMetrics: stableAllowedMetrics, initialState }),
    [stableAllowedMetrics, initialState],
  );
  const [state, dispatch] = useReducer(
    controlledChartConfiguratorReducer,
    stateSeed,
    createInitialControlledChartConfiguratorState,
  );

  // Reset draft state only when the seed boundary actually changes (a new
  // seedKey or allowed-metric set), not when a caller rebuilds an equivalent
  // `initialState` object. Depending on `stateSeed` identity here would wipe
  // in-progress edits whenever a parent re-created the seed with equal content.
  const reseedKey = useMemo(
    () => JSON.stringify({ seedKey, allowedMetrics: [...stableAllowedMetrics] }),
    [seedKey, stableAllowedMetrics],
  );
  const previousReseedKeyRef = useRef(reseedKey);
  useEffect(() => {
    if (previousReseedKeyRef.current === reseedKey) {
      return;
    }
    previousReseedKeyRef.current = reseedKey;
    dispatch({
      type: ControlledChartConfiguratorActionType.ResetFromSeed,
      seed: stateSeed,
    });
  }, [reseedKey, stateSeed]);

  const {
    metric,
    computedMetric,
    chartTypeOverride,
    granularity,
    isOperationsToggleOn,
    operationsDraftMetric,
    smoothingOption,
    overlayOption,
    benchmarkType,
    comparisonOffset,
    comparisonCustomStartDate,
    customEventFilters,
    tableAdditionalColumns,
  } = state;

  const setMetric = useCallback(
    (nextMetric: TChartConfiguratorMetrics | null) => {
      dispatch({
        type: ControlledChartConfiguratorActionType.SetMetric,
        metric: nextMetric && stableAllowedMetrics.includes(nextMetric) ? nextMetric : null,
      });
    },
    [stableAllowedMetrics],
  );

  const setComputedMetric = useCallback(
    (nextComputedMetric: ComputedMetric | null) => {
      if (nextComputedMetric === null) {
        dispatch({
          type: ControlledChartConfiguratorActionType.SetComputedMetric,
          computedMetric: null,
        });
        return;
      }
      const isAllowed = isComputedMetricAllowedForExploreMode({
        computedMetric: nextComputedMetric,
        allowedMetrics: stableAllowedMetrics,
      });
      dispatch({
        type: ControlledChartConfiguratorActionType.SetComputedMetric,
        computedMetric: isAllowed ? nextComputedMetric : null,
      });
    },
    [stableAllowedMetrics],
  );

  const executionMetric = useMemo<MetricLike | null>(() => {
    if (computedMetric) {
      return computedMetric;
    }
    return metric;
  }, [computedMetric, metric]);

  const metricDerivation = useMemo(
    () =>
      deriveControlledChartConfiguratorMetrics({
        executionMetric,
        fallbackMetric: metric,
        allowedMetrics: stableAllowedMetrics,
      }),
    [executionMetric, metric, stableAllowedMetrics],
  );
  const displaySourceMetrics = useStableArray(metricDerivation.displaySourceMetrics);

  const displayMetric = useMemo((): TChartConfiguratorMetrics | null => {
    if (!displaySourceMetrics.length) {
      return null;
    }
    if (metric && displaySourceMetrics.some((sourceMetric) => sourceMetric === metric)) {
      return metric;
    }
    return displaySourceMetrics[0];
  }, [displaySourceMetrics, metric]);

  const {
    activeMetricForQuery,
    isActiveMetricComputed,
    effectiveComputedMetric,
    computedMetricChartTitleLabel,
  } = useActiveMetricForQuery({
    executionMetric,
    computedMetric,
    operationsDraftMetric,
    isOperationsToggleOn,
  });

  const dimensions = useMemo(
    () => getSharedChartConfiguratorDimensions(displaySourceMetrics),
    [displaySourceMetrics],
  );

  // Breakdown is intentionally hook-local state rather than part of
  // `controlledChartConfiguratorReducer`. That reducer is shared with Explore
  // Mode, which sources breakdown from the URL (`AnalyticsQueryParams.Breakdown`)
  // and never stores it in reducer state; pushing breakdown into the reducer
  // would add a field that surface ignores. Breakdown also has to be resolved
  // against the derived, metric-dependent `dimensions` (see the seeding effect
  // below) that the pure reducer has no access to, so the hook owns that
  // resolution while the reducer stays URL/derivation-agnostic.
  const [breakdown, setBreakdownState] = useState<readonly TRAQIV2Dimension[]>([]);
  const setBreakdown = useCallback(
    (nextBreakdown: TRAQIV2Dimension[]) => {
      setBreakdownState(resolveBreakdownDimensions(nextBreakdown, dimensions));
    },
    [dimensions],
  );

  // `useStableArray` keeps the dependency referentially stable while the seeded
  // contents are unchanged, so rebuilding an equivalent `initialState` does not
  // re-seed and wipe in-progress breakdown edits (mirrors the seedKey guard).
  const stableInitialBreakdownDimensions = useStableArray(
    initialState?.breakdownDimensions ?? EMPTY_BREAKDOWN_DIMENSIONS,
  );
  useEffect(() => {
    setBreakdown(resolveBreakdownDimensions(stableInitialBreakdownDimensions, dimensions));
  }, [dimensions, stableInitialBreakdownDimensions, seedKey, setBreakdown]);

  const chartContextFromProvider = useCurrentChartContext({
    resource,
    dimensions,
    metric: displayMetric,
    constraintMetrics: displaySourceMetrics,
  });

  const requestedChartContext = useMemo(
    () => ({
      ...chartContextFromProvider,
      breakdown,
      granularity,
    }),
    [breakdown, chartContextFromProvider, granularity],
  );

  const granularitySelection = useMemo(
    () =>
      resolveGranularitySelection({
        metrics: displaySourceMetrics,
        requestedGranularity: granularity,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        breakdown: requestedChartContext.breakdown,
      }),
    [
      dateRange.endDate,
      dateRange.startDate,
      displaySourceMetrics,
      granularity,
      requestedChartContext.breakdown,
    ],
  );

  const effectiveChartContext = useMemo(
    () => ({
      ...requestedChartContext,
      granularity: granularitySelection.effectiveGranularity,
    }),
    [granularitySelection.effectiveGranularity, requestedChartContext],
  );

  // The sidebar control always shows the coerced (effective) granularity so the
  // dropdown matches the rendered chart. The requested value stays in
  // URL/reducer state (and is recoverable on round-trip); computed charts
  // additionally surface a notice (shouldShowUnsupportedGranularityWarning)
  // explaining that the requested interval isn't shared by the source metrics.
  const sidebarChartContext = effectiveChartContext;

  const { selectedChartType, availableChartTypes, supportedChartTypes, chartTypeSupport } = useMemo(
    () =>
      selectSupportedChartType({
        chartTypeOverride,
        displayMetric,
        defaultChartType: initialState?.chartType ?? ChartType.Spline,
        isL7SmoothingEnabled: smoothingOption === SmoothingOptionValue.L7MovingAverage,
        granularity: granularitySelection.effectiveGranularity,
      }),
    [
      chartTypeOverride,
      displayMetric,
      granularitySelection.effectiveGranularity,
      initialState?.chartType,
      smoothingOption,
    ],
  );
  const l7SmoothingDisabledReason = useMemo(
    () =>
      getL7SmoothingDisabledReason({
        selectedChartType,
        granularity: granularitySelection.effectiveGranularity,
      }),
    [granularitySelection.effectiveGranularity, selectedChartType],
  );
  const isL7SmoothingDisabled = l7SmoothingDisabledReason !== null;
  const persistedSmoothingOption = isL7SmoothingDisabled
    ? SmoothingOptionValue.None
    : smoothingOption;

  const availableMetrics = useMemo(() => [...stableAllowedMetrics], [stableAllowedMetrics]);
  const onCustomEventFiltersChange = useCallback((filters: UIFilters) => {
    dispatch({
      type: ControlledChartConfiguratorActionType.SetCustomEventFilters,
      filters,
    });
  }, []);
  const sourceSelection = useChartConfiguratorSourceSelection({
    metric,
    setMetric,
    availableMetrics,
    translate,
    filters: customEventFilters,
    onFiltersChange: onCustomEventFiltersChange,
  });
  const { handleSourceChange } = sourceSelection;

  const setChartTypeWithGranularity = useCallback(
    (type: ChartConfiguratorChartType | null, nextGranularity: TUIGranularity) => {
      if (type) {
        dispatch({
          type: ControlledChartConfiguratorActionType.SetChartTypeWithGranularity,
          chartType: type,
          granularity: nextGranularity,
        });
        return;
      }
      dispatch({
        type: ControlledChartConfiguratorActionType.SetGranularity,
        granularity: nextGranularity,
      });
    },
    [],
  );

  const onChartTypeChange = useCallback((chartType: ChartConfiguratorChartType) => {
    dispatch({ type: ControlledChartConfiguratorActionType.SetChartType, chartType });
  }, []);

  const resolvedMetricForQuery = useMemo(() => {
    if (!activeMetricForQuery) {
      return null;
    }
    if (isComputedMetric(activeMetricForQuery)) {
      const { l7Smoothing: _l7Smoothing, ...withoutL7Smoothing } = activeMetricForQuery;
      return !isL7SmoothingDisabled && smoothingOption === SmoothingOptionValue.L7MovingAverage
        ? { ...withoutL7Smoothing, l7Smoothing: true }
        : withoutL7Smoothing;
    }
    const activeUIMetric = getUIMetricFromAtomicMetricLike(activeMetricForQuery);
    if (!isNumericUIMetric(activeUIMetric)) {
      return null;
    }
    const selectedCustomEventName = getFilterValueForDimension(
      customEventFilters,
      RAQIV2Dimension.CustomEventName,
      null,
    );
    const customEventQueryFilters = toCustomEventQueryFilters(customEventFilters);
    const { pseudoDimensionValues } = extractPseudoDimensionsFromFilters(customEventQueryFilters);
    return getMetricForL7Smoothing(
      activeUIMetric,
      !isL7SmoothingDisabled && smoothingOption === SmoothingOptionValue.L7MovingAverage,
      {
        ...(selectedCustomEventName ? { customEventName: selectedCustomEventName } : {}),
        ...(hasPseudoDimensionValues(pseudoDimensionValues) ? { pseudoDimensionValues } : {}),
      },
    );
  }, [activeMetricForQuery, customEventFilters, isL7SmoothingDisabled, smoothingOption]);

  const isCustomEventsPreviewReady = isCustomEventsQueryReady(
    sourceSelection.isCustomEventsMode,
    metric,
    customEventFilters,
  );
  const selectedCustomEventNameForTitle =
    sourceSelection.isCustomEventsMode && displayMetric
      ? (getFilterValueForDimension(
          customEventFilters,
          RAQIV2Dimension.CustomEventName,
          null,
        )?.trim() ?? undefined)
      : undefined;

  const chartSpec = useMemo((): RAQIV2ChartSpec | null => {
    if (!resolvedMetricForQuery || !displayMetric || !isCustomEventsPreviewReady) {
      return null;
    }
    const exploreModeSpecOverride =
      !isActiveMetricComputed && displayMetric
        ? getAnalyticsMetricDisplayConfig(displayMetric).exploreModeSpecOverride
        : undefined;
    const spec = {
      ...(exploreModeSpecOverride
        ? computeRAQIV2SpecOverride(effectiveChartContext, exploreModeSpecOverride)
        : effectiveChartContext),
      metric: resolvedMetricForQuery,
    };
    const filterOnlyDimensions = getChartConfiguratorFilterOnlyDimensions(selectedChartType);
    if (spec.breakdown?.length && filterOnlyDimensions.length) {
      spec.breakdown = spec.breakdown.filter((dim) => !filterOnlyDimensions.includes(dim));
    }
    return spec;
  }, [
    displayMetric,
    effectiveChartContext,
    isCustomEventsPreviewReady,
    isActiveMetricComputed,
    resolvedMetricForQuery,
    selectedChartType,
  ]);

  const dateRangeOptions = metricDerivation.dateRangeOptions;

  const getBreakdownLabel = useCallback(
    (dimension: TRAQIV2Dimension): FormattedText => translate(getDimensionRenderer(dimension).name),
    [translate],
  );

  const setComputedMetricForSidebar = useCallback(
    (nextComputedMetric: ComputedMetric | null) => {
      if (nextComputedMetric === null) {
        dispatch({
          type: ControlledChartConfiguratorActionType.SetOperationsDraft,
          operationsDraftMetric: null,
        });
        setComputedMetric(null);
        return;
      }
      const isAllowed = isComputedMetricAllowedForExploreMode({
        computedMetric: nextComputedMetric,
        allowedMetrics: stableAllowedMetrics,
      });
      if (!isAllowed) {
        dispatch({
          type: ControlledChartConfiguratorActionType.SetOperationsDraft,
          operationsDraftMetric: null,
        });
        setComputedMetric(null);
        return;
      }
      dispatch({
        type: ControlledChartConfiguratorActionType.SetOperationsDraft,
        operationsDraftMetric: nextComputedMetric,
      });
      setComputedMetric(nextComputedMetric);
    },
    [setComputedMetric, stableAllowedMetrics],
  );

  const handleOperationsToggleChange = useCallback(
    (enabled: boolean) => {
      if (enabled === isOperationsToggleOn) {
        return;
      }
      dispatch({
        type: ControlledChartConfiguratorActionType.SetOperationsToggle,
        enabled,
        seededComputedMetric: metric
          ? buildSeededComputedMetricFromSimple(
              metric,
              customEventFilters,
              toCustomEventQueryFilters(customEventFilters),
            )
          : null,
      });
    },
    [customEventFilters, isOperationsToggleOn, metric],
  );

  const onGranularityChange = useCallback((nextGranularity: TUIGranularity) => {
    dispatch({
      type: ControlledChartConfiguratorActionType.SetGranularity,
      granularity: nextGranularity,
    });
  }, []);

  const onSmoothingChange = useCallback((nextSmoothingOption: SmoothingOption) => {
    dispatch({
      type: ControlledChartConfiguratorActionType.SetSmoothingOption,
      smoothingOption: nextSmoothingOption,
    });
  }, []);

  const dispatchSidebarAction = useCallback(
    (action: ChartConfiguratorSidebarAction) => {
      switch (action.type) {
        case 'select-metric':
          setMetric(action.metric);
          return;
        case 'set-computed-metric':
          setComputedMetricForSidebar(action.computedMetric);
          return;
        case 'toggle-operations':
          handleOperationsToggleChange(action.isOn);
          return;
        case 'select-chart-type':
          onChartTypeChange(action.chartType);
          return;
        case 'select-chart-type-with-granularity':
          setChartTypeWithGranularity(action.chartType, action.granularity);
          return;
        case 'select-granularity':
          onGranularityChange(action.granularity);
          return;
        case 'set-breakdown':
          setBreakdown(action.breakdown);
          return;
        case 'set-smoothing-option':
          onSmoothingChange(action.smoothingOption);
          return;
        case 'set-source-filter':
          handleSourceChange(action.sourceFilter);
          return;
        case 'set-custom-event-filters':
          onCustomEventFiltersChange(action.filters);
          return;
        case 'set-table-additional-columns':
          dispatch({
            type: ControlledChartConfiguratorActionType.SetTableAdditionalColumns,
            tableAdditionalColumns: action.tableAdditionalColumns,
          });
          return;
        case 'set-overlay-option':
          dispatch({
            type: ControlledChartConfiguratorActionType.SetOverlayOption,
            overlayOption: action.overlayOption,
          });
          return;
        case 'set-benchmark-type':
          dispatch({
            type: ControlledChartConfiguratorActionType.SetBenchmarkType,
            benchmarkType: action.benchmarkType,
          });
          return;
        case 'set-comparison-offset':
          dispatch({
            type: ControlledChartConfiguratorActionType.SetComparisonOffset,
            comparisonOffset: action.comparisonOffset,
          });
          return;
        case 'set-comparison-custom-start-date':
          dispatch({
            type: ControlledChartConfiguratorActionType.SetComparisonCustomStartDate,
            comparisonCustomStartDate: action.comparisonCustomStartDate,
          });
          return;
        default:
          assertUnhandledSidebarAction(action);
      }
    },
    [
      handleOperationsToggleChange,
      onChartTypeChange,
      onCustomEventFiltersChange,
      onGranularityChange,
      onSmoothingChange,
      setBreakdown,
      setChartTypeWithGranularity,
      setComputedMetricForSidebar,
      setMetric,
      handleSourceChange,
    ],
  );

  const isTableMode = selectedChartType === ChartType.Table;

  const sidebarProps = useMemo<ChartConfiguratorSidebarProps>(
    () => ({
      variant: 'inline',
      dispatch: dispatchSidebarAction,
      metricControls: isOperationsToggleOn
        ? {
            mode: 'operations',
            metric,
            computedMetric: effectiveComputedMetric,
            availableMetrics,
            constraintMetrics: displaySourceMetrics,
            sourceFilterResource: resource,
          }
        : sourceSelection.isCustomEventsMode
          ? {
              mode: 'custom-events',
              metric,
              computedMetric: effectiveComputedMetric,
              availableMetrics,
              constraintMetrics: displaySourceMetrics,
              sourceFilter: sourceSelection.sourceFilter,
              customEventResource: resource,
              sourceFilterResource: resource,
              filters: customEventFilters,
            }
          : {
              mode: 'metric',
              metric,
              computedMetric: effectiveComputedMetric,
              availableMetrics,
              constraintMetrics: displaySourceMetrics,
              sourceFilter: sourceSelection.sourceFilter,
              filteredMetrics: sourceSelection.filteredMetrics,
              sourceFilterResource: resource,
            },
      chartControls: {
        chartType: selectedChartType,
        availableChartTypes,
        supportedChartTypes,
        chartTypeSupport,
      },
      granularityControls: {
        chartContext: sidebarChartContext,
        granularitySelection,
      },
      breakdownControls: {
        breakdownDimensions: dimensions,
        breakdown,
        getBreakdownLabel,
      },
      smoothingControls: {
        smoothingOption,
        isL7SmoothingDisabled,
        l7SmoothingDisabledReason,
      },
      overlayControls: { isEnabled: false },
      tableControls: isTableMode
        ? {
            mode: 'table',
            tableAdditionalColumns: [...tableAdditionalColumns],
            tablePrimaryColumnCount: 1,
          }
        : { mode: 'chart' },
    }),
    [
      availableChartTypes,
      availableMetrics,
      breakdown,
      chartTypeSupport,
      customEventFilters,
      dimensions,
      displaySourceMetrics,
      dispatchSidebarAction,
      effectiveComputedMetric,
      getBreakdownLabel,
      granularitySelection,
      isL7SmoothingDisabled,
      isOperationsToggleOn,
      isTableMode,
      l7SmoothingDisabledReason,
      metric,
      resource,
      selectedChartType,
      sidebarChartContext,
      smoothingOption,
      sourceSelection.filteredMetrics,
      sourceSelection.isCustomEventsMode,
      sourceSelection.sourceFilter,
      supportedChartTypes,
      tableAdditionalColumns,
    ],
  );

  return {
    sidebarProps,
    metric,
    computedMetric: normalizePersistedComputedMetric(
      effectiveComputedMetric,
      isOperationsToggleOn,
      persistedSmoothingOption,
    ),
    selectedChartType,
    breakdownDimensions: breakdown,
    breakdownDimension: breakdown[0],
    granularity,
    effectiveGranularity: granularitySelection.effectiveGranularity,
    granularitySelection,
    dateRangeOptions,
    smoothingOption,
    persistedSmoothingOption,
    overlayOption,
    benchmarkType,
    comparisonOffset,
    comparisonCustomStartDate,
    customEventFilters,
    tableAdditionalColumns,
    chartPreview: {
      chartSpec,
      displayMetric,
      selectedChartType,
      computedMetricChartTitleLabel,
      granularitySelection,
      overlayOption,
      benchmarkType,
      comparisonOffset,
      comparisonCustomStartDate,
      tableAdditionalColumns,
      emptyStateReason: !displayMetric
        ? 'missing-metric'
        : sourceSelection.isCustomEventsMode && !isCustomEventsPreviewReady
          ? 'missing-custom-event'
          : undefined,
      fallbackChartTitleLabel: selectedCustomEventNameForTitle,
    },
  };
}
