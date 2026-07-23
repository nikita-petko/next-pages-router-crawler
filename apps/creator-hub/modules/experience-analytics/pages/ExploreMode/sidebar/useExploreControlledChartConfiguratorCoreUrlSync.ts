import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { RAQIV2MetricGranularity } from '@rbx/creator-hub-analytics-config';
import AnalyticsQueryParams from '@modules/charts-generic/enums/AnalyticsQueryParams';
import type { ChartConfiguratorChartType } from '@modules/experience-analytics-shared/chartConfigurator/ChartConfiguratorChartTypes';
import type { TChartConfiguratorMetrics } from '@modules/experience-analytics-shared/chartConfigurator/chartConfiguratorMetricsConfig';
import {
  ControlledChartConfiguratorActionType,
  controlledChartConfiguratorReducer,
  createInitialControlledChartConfiguratorState,
} from '@modules/experience-analytics-shared/chartConfigurator/controlledChartConfiguratorState';
import type {
  ComparisonCustomStartDateValue,
  ComparisonOffsetValue,
} from '@modules/experience-analytics-shared/chartConfigurator/overlayUrlParams';
import {
  SmoothingOptionValue,
  type SmoothingOption,
} from '@modules/experience-analytics-shared/chartConfigurator/smoothingOptions';
import type { OverlayOption } from '@modules/experience-analytics-shared/components/chartConfigurator/ChartConfiguratorOverlaysControl';
import type { ExploreModeTableMetricColumn } from '@modules/experience-analytics-shared/components/chartConfigurator/chartConfiguratorTableColumns';
import type { AnnotationOptions } from '@modules/experience-analytics-shared/constants/annotationConfig';
import {
  getL7SmoothingDisabledReason,
  isL7SmoothingDisabled,
} from '@modules/experience-analytics-shared/exploreMode/l7SmoothingEligibility';
import { isComputedMetricAllowedForExploreMode } from '@modules/experience-analytics-shared/exploreMode/resolveExploreModeQueryState';
import type { BenchmarkOverlayType } from '@modules/experience-analytics-shared/hooks/useAnalyticsBenchmarks';
import type { ComputedMetric } from '@modules/experience-analytics-shared/types/ComputedMetric';
import type { TUIGranularity } from '@modules/experience-analytics-shared/utils/seriesGranularities';
import { useQueryParams } from '@modules/miscellaneous/hooks';
import {
  ExploreCustomEventAggregationTypeQueryKey,
  ExploreL7SmoothingQueryKey,
  ExploreCustomEventNameQueryKey,
  buildExploreControlledSourceStateFromUrlInput,
  buildExploreControlledOverlayStateFromUrlInput,
  buildExploreControlledSeedFromUrlInput,
  type ExploreControlledOverlayState,
  deserializeExploreAnnotationParams,
  deserializeExploreTableAdditionalColumnsParams,
  serializeExploreBenchmarkTypeParams,
  serializeExploreChartTypeGranularityParams,
  serializeExploreAnnotationParams,
  serializeExploreComparisonCustomStartDateParams,
  serializeExploreComparisonOffsetParams,
  serializeExploreCustomEventsSourceParams,
  serializeExploreMetricParams,
  serializeExploreOverlayParams,
  serializeExploreTableAdditionalColumnsParams,
} from './exploreControlledChartConfiguratorState';

const withL7Smoothing = (
  computedMetric: ComputedMetric | null,
  smoothingOption: SmoothingOption,
): ComputedMetric | null => {
  if (!computedMetric) {
    return null;
  }
  return {
    ...computedMetric,
    l7Smoothing: smoothingOption === SmoothingOptionValue.L7MovingAverage,
  };
};

const exploreControlledCoreQueryKeys = [
  AnalyticsQueryParams.Metric,
  AnalyticsQueryParams.ComputedMetric,
  AnalyticsQueryParams.ChartType,
  AnalyticsQueryParams.Granularity,
  AnalyticsQueryParams.Breakdown,
  AnalyticsQueryParams.Overlays,
  AnalyticsQueryParams.OverlayBenchmarkType,
  AnalyticsQueryParams.OverlayComparisonOffset,
  AnalyticsQueryParams.OverlayComparisonCustomStartTime,
  AnalyticsQueryParams.TableMetric,
  AnalyticsQueryParams.TableMetricFilters,
  AnalyticsQueryParams.Annotation,
  AnalyticsQueryParams.FilterAnnotation,
  ExploreCustomEventNameQueryKey,
  ExploreCustomEventAggregationTypeQueryKey,
  ExploreL7SmoothingQueryKey,
] as const;
const ComputedMetricUrlSyncDebounceMs = 500;

type SetQueryParamsOptions = Parameters<ReturnType<typeof useQueryParams>[1]>[1];
type TableAdditionalColumnsUpdate =
  | readonly ExploreModeTableMetricColumn[]
  | ((
      previousColumns: readonly ExploreModeTableMetricColumn[],
    ) => readonly ExploreModeTableMetricColumn[]);

const getTableAdditionalColumnsDraftKey = (
  columns: readonly ExploreModeTableMetricColumn[],
): string =>
  JSON.stringify(
    columns.map(({ type, key, metric, filters }) => ({
      type,
      key,
      metric,
      filters: filters ?? null,
    })),
  );

const getTableAdditionalColumnsPersistenceKey = (
  columns: readonly ExploreModeTableMetricColumn[],
): string => JSON.stringify(serializeExploreTableAdditionalColumnsParams(columns));

const applyExploreOverlayStatePatch = (
  current: ExploreControlledOverlayState,
  patch: Partial<ExploreControlledOverlayState>,
): ExploreControlledOverlayState => ({
  ...current,
  ...patch,
});

export type UseExploreControlledChartConfiguratorCoreUrlSyncArgs = {
  readonly allowedMetrics: readonly TChartConfiguratorMetrics[];
  readonly availableChartTypes: readonly ChartConfiguratorChartType[];
  readonly defaultGranularity?: TUIGranularity;
  readonly featureFlagsFetched?: boolean;
};

export default function useExploreControlledChartConfiguratorCoreUrlSync({
  allowedMetrics,
  availableChartTypes,
  defaultGranularity = RAQIV2MetricGranularity.OneDay,
  featureFlagsFetched = true,
}: UseExploreControlledChartConfiguratorCoreUrlSyncArgs) {
  const [queryParams, setQueryParams] = useQueryParams(exploreControlledCoreQueryKeys);
  const seed = useMemo(
    () =>
      buildExploreControlledSeedFromUrlInput({
        queryMetric: queryParams[AnalyticsQueryParams.Metric],
        queryComputedMetric: queryParams[AnalyticsQueryParams.ComputedMetric],
        queryChartType: queryParams[AnalyticsQueryParams.ChartType],
        queryGranularity: queryParams[AnalyticsQueryParams.Granularity],
        queryBreakdown: queryParams[AnalyticsQueryParams.Breakdown],
        queryL7Smoothing: queryParams[ExploreL7SmoothingQueryKey],
        allowedMetrics,
        availableChartTypes,
        defaultGranularity,
        featureFlagsFetched,
      }),
    [allowedMetrics, availableChartTypes, defaultGranularity, featureFlagsFetched, queryParams],
  );
  const overlayState = useMemo(
    () =>
      buildExploreControlledOverlayStateFromUrlInput({
        queryOverlays: queryParams[AnalyticsQueryParams.Overlays],
        queryBenchmarkType: queryParams[AnalyticsQueryParams.OverlayBenchmarkType],
        queryComparisonOffset: queryParams[AnalyticsQueryParams.OverlayComparisonOffset],
        queryComparisonCustomStartTime:
          queryParams[AnalyticsQueryParams.OverlayComparisonCustomStartTime],
      }),
    [queryParams],
  );
  const overlayStateRef = useRef(overlayState);
  useEffect(() => {
    overlayStateRef.current = overlayState;
  }, [overlayState]);
  const queryTableMetric = queryParams[AnalyticsQueryParams.TableMetric];
  const queryTableMetricFilters = queryParams[AnalyticsQueryParams.TableMetricFilters];
  const tableAdditionalColumnsUrlKey = useMemo(
    () =>
      JSON.stringify({
        allowedMetrics: [...allowedMetrics],
        queryTableMetric,
        queryTableMetricFilters,
      }),
    [allowedMetrics, queryTableMetric, queryTableMetricFilters],
  );
  const persistedTableAdditionalColumns = useMemo(
    () =>
      deserializeExploreTableAdditionalColumnsParams({
        queryTableMetric,
        queryTableMetricFilters,
        availableMetrics: allowedMetrics,
      }),
    [allowedMetrics, queryTableMetric, queryTableMetricFilters],
  );
  const [draftTableAdditionalColumns, setDraftTableAdditionalColumns] = useState(
    persistedTableAdditionalColumns,
  );
  const draftTableAdditionalColumnsRef = useRef(persistedTableAdditionalColumns);
  const tableAdditionalColumnsPersistenceKeyRef = useRef(
    getTableAdditionalColumnsPersistenceKey(persistedTableAdditionalColumns),
  );
  const previousTableAdditionalColumnsUrlKeyRef = useRef(tableAdditionalColumnsUrlKey);
  const annotationOptions = useMemo(
    () =>
      deserializeExploreAnnotationParams({
        queryAnnotation: queryParams[AnalyticsQueryParams.Annotation],
        queryFilterAnnotation: queryParams[AnalyticsQueryParams.FilterAnnotation],
      }),
    [queryParams],
  );
  const sourceUrlState = useMemo(
    () =>
      buildExploreControlledSourceStateFromUrlInput({
        queryMetric: queryParams[AnalyticsQueryParams.Metric],
        queryCustomEventName: queryParams[ExploreCustomEventNameQueryKey],
      }),
    [queryParams],
  );
  const stateSeed = useMemo(
    () => ({ allowedMetrics, initialState: seed.initialState }),
    [allowedMetrics, seed.initialState],
  );
  const reseedKey = useMemo(
    () => JSON.stringify({ seedKey: seed.seedKey, allowedMetrics: [...allowedMetrics] }),
    [allowedMetrics, seed.seedKey],
  );
  const [state, dispatch] = useReducer(
    controlledChartConfiguratorReducer,
    stateSeed,
    createInitialControlledChartConfiguratorState,
  );
  const previousReseedKeyRef = useRef(reseedKey);
  const pendingComputedMetricUrlSyncRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearPendingComputedMetricUrlSync = useCallback(() => {
    if (pendingComputedMetricUrlSyncRef.current) {
      clearTimeout(pendingComputedMetricUrlSyncRef.current);
      pendingComputedMetricUrlSyncRef.current = null;
    }
  }, []);

  useEffect(
    () => () => {
      clearPendingComputedMetricUrlSync();
    },
    [clearPendingComputedMetricUrlSync],
  );

  const setMetricQueryParams = useCallback(
    (
      nextMetric: TChartConfiguratorMetrics | null,
      nextComputedMetric: ComputedMetric | null,
      nextSmoothingOption: SmoothingOption = state.smoothingOption,
      options?: SetQueryParamsOptions,
    ) => {
      const params = serializeExploreMetricParams({
        metric: nextMetric,
        computedMetric: nextComputedMetric,
        smoothingOption: nextSmoothingOption,
      });
      if (options) {
        setQueryParams(params, options);
        return;
      }
      setQueryParams(params);
    },
    [setQueryParams, state.smoothingOption],
  );

  const setComputedMetricQueryParams = useCallback(
    (nextMetric: TChartConfiguratorMetrics | null, nextComputedMetric: ComputedMetric | null) => {
      clearPendingComputedMetricUrlSync();
      const params = serializeExploreMetricParams({
        metric: nextMetric,
        computedMetric: nextComputedMetric,
        smoothingOption: state.smoothingOption,
      });
      if (!nextComputedMetric) {
        setQueryParams(params, { skipHistory: true });
        return;
      }
      pendingComputedMetricUrlSyncRef.current = setTimeout(() => {
        pendingComputedMetricUrlSyncRef.current = null;
        setQueryParams(params, { skipHistory: true });
      }, ComputedMetricUrlSyncDebounceMs);
    },
    [clearPendingComputedMetricUrlSync, setQueryParams, state.smoothingOption],
  );

  useEffect(() => {
    if (seed.cleanupQueryParams) {
      setQueryParams(seed.cleanupQueryParams, { skipHistory: true });
    }
  }, [seed.cleanupQueryParams, setQueryParams]);

  useEffect(() => {
    if (previousTableAdditionalColumnsUrlKeyRef.current === tableAdditionalColumnsUrlKey) {
      return;
    }
    previousTableAdditionalColumnsUrlKeyRef.current = tableAdditionalColumnsUrlKey;
    const nextColumns = [...persistedTableAdditionalColumns];
    draftTableAdditionalColumnsRef.current = nextColumns;
    tableAdditionalColumnsPersistenceKeyRef.current =
      getTableAdditionalColumnsPersistenceKey(nextColumns);
    setDraftTableAdditionalColumns(nextColumns);
  }, [persistedTableAdditionalColumns, tableAdditionalColumnsUrlKey]);

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

  const setMetric = useCallback(
    (nextMetric: TChartConfiguratorMetrics | null) => {
      const metric = nextMetric && allowedMetrics.includes(nextMetric) ? nextMetric : null;
      clearPendingComputedMetricUrlSync();
      dispatch({ type: ControlledChartConfiguratorActionType.SetMetric, metric });
      setMetricQueryParams(metric, null);
    },
    [allowedMetrics, clearPendingComputedMetricUrlSync, setMetricQueryParams],
  );

  // URL sync rule: write committed user selections immediately, but keep
  // in-progress editor drafts local until they become serializable committed
  // state. This mirrors table metric columns: empty columns and incomplete
  // formulas are valid drafts, not instructions to clear URL state.
  const setComputedMetric = useCallback(
    (nextComputedMetric: ComputedMetric | null) => {
      const nextComputedMetricWithSmoothing = withL7Smoothing(
        nextComputedMetric,
        state.smoothingOption,
      );
      const computedMetric =
        nextComputedMetricWithSmoothing &&
        isComputedMetricAllowedForExploreMode({
          computedMetric: nextComputedMetricWithSmoothing,
          allowedMetrics,
        })
          ? nextComputedMetricWithSmoothing
          : null;
      if (computedMetric === null && state.isOperationsToggleOn) {
        // The equation builder emits `null` for in-progress invalid drafts
        // (for example `A+`). Keep the last committed formula in reducer/URL
        // state until the user either produces a valid formula or explicitly
        // exits operations mode.
        return;
      }
      dispatch({
        type: ControlledChartConfiguratorActionType.SetComputedMetric,
        computedMetric,
      });
      setComputedMetricQueryParams(state.metric, computedMetric);
    },
    [
      allowedMetrics,
      setComputedMetricQueryParams,
      state.isOperationsToggleOn,
      state.metric,
      state.smoothingOption,
    ],
  );

  const setChartType = useCallback(
    (chartType: ChartConfiguratorChartType | null, options?: SetQueryParamsOptions) => {
      dispatch({ type: ControlledChartConfiguratorActionType.SetChartType, chartType });
      const params = { [AnalyticsQueryParams.ChartType]: chartType };
      if (options) {
        setQueryParams(params, options);
        return;
      }
      setQueryParams(params);
    },
    [setQueryParams],
  );

  const setGranularity = useCallback(
    (granularity: TUIGranularity) => {
      dispatch({ type: ControlledChartConfiguratorActionType.SetGranularity, granularity });
      setQueryParams(
        serializeExploreChartTypeGranularityParams({
          chartType: state.chartTypeOverride,
          granularity,
        }),
      );
    },
    [setQueryParams, state.chartTypeOverride],
  );

  const setChartTypeWithGranularity = useCallback(
    (chartType: ChartConfiguratorChartType | null, granularity: TUIGranularity) => {
      if (chartType) {
        dispatch({
          type: ControlledChartConfiguratorActionType.SetChartTypeWithGranularity,
          chartType,
          granularity,
        });
      } else {
        dispatch({ type: ControlledChartConfiguratorActionType.SetGranularity, granularity });
      }
      setQueryParams(serializeExploreChartTypeGranularityParams({ chartType, granularity }));
    },
    [setQueryParams],
  );

  const setOperationsToggle = useCallback(
    (enabled: boolean, seededComputedMetric: ComputedMetric | null) => {
      const seededComputedMetricWithSmoothing = withL7Smoothing(
        seededComputedMetric,
        state.smoothingOption,
      );
      const computedMetric =
        enabled &&
        seededComputedMetricWithSmoothing &&
        isComputedMetricAllowedForExploreMode({
          computedMetric: seededComputedMetricWithSmoothing,
          allowedMetrics,
        })
          ? seededComputedMetricWithSmoothing
          : null;
      dispatch({
        type: ControlledChartConfiguratorActionType.SetOperationsToggle,
        enabled,
        seededComputedMetric: computedMetric,
      });
      setComputedMetricQueryParams(state.metric, computedMetric);
    },
    [allowedMetrics, setComputedMetricQueryParams, state.metric, state.smoothingOption],
  );

  const setSmoothingOption = useCallback(
    (smoothingOption: SmoothingOption) => {
      dispatch({
        type: ControlledChartConfiguratorActionType.SetSmoothingOption,
        smoothingOption,
      });
      clearPendingComputedMetricUrlSync();
      if (!state.computedMetric) {
        setMetricQueryParams(state.metric, null, smoothingOption, { skipHistory: true });
        return;
      }
      const computedMetric = withL7Smoothing(state.computedMetric, smoothingOption);
      setQueryParams(serializeExploreMetricParams({ metric: state.metric, computedMetric }), {
        skipHistory: true,
      });
    },
    [
      clearPendingComputedMetricUrlSync,
      setMetricQueryParams,
      setQueryParams,
      state.computedMetric,
      state.metric,
    ],
  );

  const setOverlayOption = useCallback(
    (overlayOption: OverlayOption) => {
      const nextOverlayState = applyExploreOverlayStatePatch(overlayStateRef.current, {
        overlayOption,
      });
      overlayStateRef.current = nextOverlayState;
      setQueryParams(serializeExploreOverlayParams(nextOverlayState));
    },
    [setQueryParams],
  );

  const setBenchmarkOverlayType = useCallback(
    (benchmarkType: BenchmarkOverlayType | null) => {
      const nextOverlayState = applyExploreOverlayStatePatch(overlayStateRef.current, {
        benchmarkType,
      });
      overlayStateRef.current = nextOverlayState;
      setQueryParams(serializeExploreBenchmarkTypeParams(benchmarkType));
    },
    [setQueryParams],
  );

  const setComparisonOffset = useCallback(
    (comparisonOffset: ComparisonOffsetValue) => {
      const nextOverlayState = applyExploreOverlayStatePatch(overlayStateRef.current, {
        comparisonOffset,
        comparisonCustomStartDate: undefined,
      });
      overlayStateRef.current = nextOverlayState;
      setQueryParams(serializeExploreComparisonOffsetParams(comparisonOffset));
    },
    [setQueryParams],
  );

  const setComparisonCustomStartDate = useCallback(
    (
      comparisonCustomStartDate: ComparisonCustomStartDateValue,
      options?: SetQueryParamsOptions,
    ) => {
      const nextOverlayState = applyExploreOverlayStatePatch(overlayStateRef.current, {
        comparisonCustomStartDate,
        comparisonOffset: undefined,
      });
      overlayStateRef.current = nextOverlayState;
      const params = serializeExploreComparisonCustomStartDateParams(comparisonCustomStartDate);
      if (options) {
        setQueryParams(params, options);
        return;
      }
      setQueryParams(params);
    },
    [setQueryParams],
  );

  const setTableAdditionalColumns = useCallback(
    (update: TableAdditionalColumnsUpdate) => {
      const previousColumns = draftTableAdditionalColumnsRef.current;
      const columns = typeof update === 'function' ? update(previousColumns) : update;
      if (columns === previousColumns) {
        return;
      }
      if (
        getTableAdditionalColumnsDraftKey(columns) ===
        getTableAdditionalColumnsDraftKey(previousColumns)
      ) {
        return;
      }
      const nextColumns = [...columns];
      draftTableAdditionalColumnsRef.current = nextColumns;
      setDraftTableAdditionalColumns(nextColumns);

      const nextSerializedColumns = serializeExploreTableAdditionalColumnsParams(nextColumns);
      const nextPersistenceKey = JSON.stringify(nextSerializedColumns);
      if (nextPersistenceKey === tableAdditionalColumnsPersistenceKeyRef.current) {
        return;
      }
      tableAdditionalColumnsPersistenceKeyRef.current = nextPersistenceKey;
      setQueryParams(nextSerializedColumns, { skipHistory: true });
    },
    [setQueryParams],
  );

  const setAnnotationOptions = useCallback(
    (annotations: readonly AnnotationOptions[]) => {
      setQueryParams(serializeExploreAnnotationParams(annotations));
    },
    [setQueryParams],
  );

  const setCustomEventsSourceEnabled = useCallback(
    (enabled: boolean) => {
      setQueryParams(
        serializeExploreCustomEventsSourceParams({
          enabled,
          currentMetric: state.metric,
        }),
      );
    },
    [setQueryParams, state.metric],
  );

  const l7SmoothingDisabledReason = state.chartTypeOverride
    ? getL7SmoothingDisabledReason({
        selectedChartType: state.chartTypeOverride,
        granularity: state.granularity,
      })
    : null;
  const isL7SmoothingDisabledFlag =
    state.chartTypeOverride !== null &&
    isL7SmoothingDisabled({
      selectedChartType: state.chartTypeOverride,
      granularity: state.granularity,
    });
  const isL7SmoothingEnabled =
    !isL7SmoothingDisabledFlag && state.smoothingOption === SmoothingOptionValue.L7MovingAverage;

  return {
    state,
    seedKey: seed.seedKey,
    smoothingOption: state.smoothingOption,
    setSmoothingOption,
    l7SmoothingDisabledReason,
    isL7SmoothingEnabled,
    overlayState,
    tableAdditionalColumns: draftTableAdditionalColumns,
    annotationOptions,
    sourceUrlState,
    setMetric,
    setComputedMetric,
    setChartType,
    setGranularity,
    setChartTypeWithGranularity,
    setOperationsToggle,
    setOverlayOption,
    setBenchmarkOverlayType,
    setComparisonOffset,
    setComparisonCustomStartDate,
    setTableAdditionalColumns,
    setAnnotationOptions,
    setCustomEventsSourceEnabled,
  };
}
