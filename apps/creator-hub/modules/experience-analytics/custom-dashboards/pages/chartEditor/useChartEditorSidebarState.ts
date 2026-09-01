import { useCallback, useMemo, useState } from 'react';
import { ChartType } from '@modules/charts-generic/charts/types/ChartTypes';
import type { AnalyticsDateRangeBundle } from '@modules/charts-generic/context/AnalyticsQueryDateRangeBundleContext';
import type { ChartResource as RAQIV2ChartResource } from '@modules/clients/analytics/analyticsRAQIShared';
import type { TChartConfiguratorMetrics } from '@modules/experience-analytics-shared/chartConfigurator/chartConfiguratorMetricsConfig';
import type { OverlayOption } from '@modules/experience-analytics-shared/components/chartConfigurator/ChartConfiguratorOverlaysControl';
import type {
  ChartConfiguratorOverlayControlsProps,
  ChartConfiguratorSidebarAction,
} from '@modules/experience-analytics-shared/components/chartConfigurator/ChartConfiguratorSidebarModelTypes';
import type { ExploreModeTableMetricColumn } from '@modules/experience-analytics-shared/components/chartConfigurator/chartConfiguratorTableColumns';
import {
  buildControlledChartConfiguratorInitialState,
  useControlledChartConfiguratorFromDraft,
} from '@modules/experience-analytics-shared/components/chartConfigurator/useControlledChartConfigurator';
import type { ControlledChartConfiguratorDraft } from '@modules/experience-analytics-shared/components/chartConfigurator/useControlledChartConfiguratorDraft';
import useAvailableBenchmarkTypes from '@modules/experience-analytics-shared/hooks/useAvailableBenchmarkTypes';
import type {
  UIFilterDimension,
  UIFilters,
} from '@modules/experience-analytics-shared/layout/ExperienceAnalyticsPageControlBar/filterUtils';
import { filterBarDimensionToQueryKey } from '@modules/experience-analytics-shared/layout/ExperienceAnalyticsPageControlBar/filterUtils';
import getOverlayAvailability, {
  type OverlayAvailability,
} from '@modules/experience-analytics-shared/utils/getOverlayAvailability';
import type { CustomDashboardTile } from '../../types';
import { tileChartTypeToExploreChartType } from '../../utils/chartTypeMapping';
import {
  chartTileOverlaysToEditorState,
  chartTileSmoothingToEditorState,
  customEventFiltersToMetricVariant,
  mergeMetricVariantIntoFilters,
  resolveInitialEditorMetric,
  resolveSavedChartType,
  selectionsToMetricVariant,
  timeIntervalToGranularity,
} from './chartTileDraft';

type UseChartEditorSidebarStateArgs = {
  readonly draft: ControlledChartConfiguratorDraft;
  readonly resource: RAQIV2ChartResource;
  readonly dateRange: Pick<AnalyticsDateRangeBundle, 'startDate' | 'endDate'>;
  readonly initialTile: CustomDashboardTile | null;
};

function isUIFilterDimension(dimension: string): dimension is UIFilterDimension {
  return dimension in filterBarDimensionToQueryKey;
}

function toUIFilters(tile: CustomDashboardTile | null): UIFilters {
  if (tile?.type !== 'Chart') {
    return [];
  }
  return tile.dataSpec.filters.flatMap((filter) => {
    if (!isUIFilterDimension(filter.dimension)) {
      return [];
    }
    return [
      {
        dimension: filter.dimension,
        values: [...filter.values],
      },
    ];
  });
}

function toTableAdditionalColumns(
  tile: CustomDashboardTile | null,
  allowedMetrics: readonly TChartConfiguratorMetrics[],
): ExploreModeTableMetricColumn[] {
  if (tile?.type !== 'Chart' || tile.chartSpec.chartType !== ChartType.Table) {
    return [];
  }
  return tile.dataSpec.metrics.slice(1).flatMap((metricColumn, index) => {
    const metric = metricColumn.metric.metricKey;
    if (!metric || !allowedMetrics.includes(metric)) {
      return [];
    }
    return [
      {
        type: 'metric' as const,
        key: metricColumn.seriesKey || `tableMetric_${index}_${metric}`,
        metric,
      },
    ];
  });
}

export function buildChartEditorSidebarInitialState({
  initialTile,
  allowedMetrics,
}: {
  readonly initialTile: CustomDashboardTile | null;
  readonly allowedMetrics: readonly TChartConfiguratorMetrics[];
}) {
  const initialMetric = initialTile?.type === 'Chart' ? initialTile.dataSpec.metrics[0] : null;
  const overlayState =
    initialTile?.type === 'Chart'
      ? chartTileOverlaysToEditorState(initialTile.chartSpec.overlays)
      : chartTileOverlaysToEditorState(undefined);
  const smoothingOption =
    initialTile?.type === 'Chart'
      ? chartTileSmoothingToEditorState(initialTile.chartSpec.smoothing)
      : chartTileSmoothingToEditorState(undefined);
  const chartType = (() => {
    if (initialTile?.type !== 'Chart') {
      return null;
    }
    // Seed the persisted type, including Area. Catalog memory/CPU metrics
    // offer Area as a selectable type; unchanged legacy Area tiles retain it
    // on save through `resolveSavedChartType`.
    return tileChartTypeToExploreChartType(initialTile.chartSpec.chartType);
  })();
  const breakdownDimensions =
    initialTile?.type === 'Chart' ? (initialTile.dataSpec.breakdownDimensions ?? null) : null;
  // Seed any persisted metric-variant selection into the working filters so it
  // survives the round-trip even when it was only stored on `variantSelections`.
  const persistedVariant =
    initialTile?.type === 'Chart' && !initialMetric?.metric.computedMetric
      ? selectionsToMetricVariant(initialMetric?.metric.variantSelections)
      : undefined;

  return buildControlledChartConfiguratorInitialState({
    metric: resolveInitialEditorMetric(initialTile, allowedMetrics),
    computedMetric: initialMetric?.metric.computedMetric ?? null,
    chartType,
    breakdownDimensions,
    granularity:
      initialTile?.type === 'Chart'
        ? timeIntervalToGranularity(initialTile.dataSpec.granularity)
        : undefined,
    l7Smoothing: smoothingOption === 'l7-moving-average',
    overlayOption: overlayState.overlayOption,
    benchmarkType: overlayState.benchmarkType,
    comparisonOffset: overlayState.comparisonOffset,
    comparisonCustomStartDate: overlayState.comparisonCustomStartDate,
    customEventFilters: mergeMetricVariantIntoFilters(toUIFilters(initialTile), persistedVariant),
    tableAdditionalColumns: toTableAdditionalColumns(initialTile, allowedMetrics),
  });
}

export default function useChartEditorSidebarState({
  draft,
  resource,
  dateRange,
  initialTile,
}: UseChartEditorSidebarStateArgs) {
  const seedKey = draft.seedKey;

  const configurator = useControlledChartConfiguratorFromDraft({
    draft,
    resource,
    dateRange,
  });

  // Track chart-type and metric edits separately so an unchanged legacy Area
  // tile round-trips, while changing its metric cannot retain a stale Area type.
  const [hasUserSelectedChartType, setHasUserSelectedChartType] = useState(false);
  const [hasUserSelectedMetric, setHasUserSelectedMetric] = useState(false);
  const [trackedSeedKey, setTrackedSeedKey] = useState(seedKey);
  if (seedKey !== trackedSeedKey) {
    setTrackedSeedKey(seedKey);
    setHasUserSelectedChartType(false);
    setHasUserSelectedMetric(false);
  }
  const dispatchWithChartTypeTracking = useCallback(
    (action: ChartConfiguratorSidebarAction) => {
      if (
        action.type === 'select-chart-type' ||
        action.type === 'select-chart-type-with-granularity'
      ) {
        setHasUserSelectedChartType(true);
      }
      if (action.type === 'select-metric') {
        setHasUserSelectedMetric(true);
      }
      configurator.sidebarProps.dispatch(action);
    },
    [configurator.sidebarProps],
  );
  const selectedChartType = resolveSavedChartType({
    persistedChartType:
      initialTile?.type === 'Chart'
        ? tileChartTypeToExploreChartType(initialTile.chartSpec.chartType)
        : null,
    selectedChartType: configurator.selectedChartType,
    hasUserSelectedChartType,
    hasUserSelectedMetric,
  });

  // The metric variant (percentile / aggregation) is tracked live in the
  // configurator's working filters as pseudo-dimensions, so deriving it here
  // reflects the user's *current* selection at save time rather than a stale
  // snapshot of the originally-hydrated tile. The variant already flows into the
  // preview spec through the configurator, so no manual filter injection is
  // needed.
  const metricVariant = configurator.computedMetric
    ? undefined
    : customEventFiltersToMetricVariant(configurator.customEventFilters);
  const chartPreview = configurator.chartPreview;
  // Overlay availability mirrors Explore Mode, but the custom dashboard editor
  // does not expose the quota overlay, so quota is always treated as
  // unavailable here.
  const overlayAvailability = useMemo(
    () =>
      getOverlayAvailability(chartPreview.chartSpec, {
        isComputedMetric: configurator.computedMetric !== null,
        hasBreakdown: configurator.breakdownDimensions.length > 0,
        chartType: configurator.selectedChartType,
        hasQuota: false,
      }),
    [
      chartPreview.chartSpec,
      configurator.computedMetric,
      configurator.breakdownDimensions.length,
      configurator.selectedChartType,
    ],
  );

  // Availability is supplemental data for the benchmark control, not a
  // prerequisite for opening the chart editor. Query it lazily when the user
  // selects benchmarks (or when an existing benchmark tile is hydrated) so a
  // failing benchmark service cannot break the basic add-chart flow.
  const isBenchmarkSelected = configurator.overlayOption === 'benchmarks';
  const benchmarkSpec =
    isBenchmarkSelected && overlayAvailability.benchmark.applicable ? chartPreview.chartSpec : null;
  const {
    availableBenchmarkTypes,
    isLoading: isBenchmarksLoading,
    hasAnyBenchmarkData,
  } = useAvailableBenchmarkTypes(benchmarkSpec);

  const effectiveOverlayAvailability = useMemo(() => {
    if (
      isBenchmarkSelected &&
      overlayAvailability.benchmark.applicable &&
      !overlayAvailability.benchmark.disabled &&
      !isBenchmarksLoading &&
      !hasAnyBenchmarkData
    ) {
      return {
        ...overlayAvailability,
        benchmark: {
          applicable: true,
          disabled: true,
          reason: 'noBenchmarkData',
        } satisfies OverlayAvailability['benchmark'],
      };
    }
    return overlayAvailability;
  }, [hasAnyBenchmarkData, isBenchmarkSelected, isBenchmarksLoading, overlayAvailability]);

  // Coerce a selected overlay back to `none` when it is no longer applicable or
  // is disabled for the current metric/chart-type/breakdown context, matching
  // Explore Mode's behavior.
  const effectiveOverlayOption: OverlayOption = useMemo(() => {
    const selected = configurator.overlayOption;
    if (selected === 'none') {
      return 'none';
    }
    // Don't coerce a hydrated benchmark overlay back to `none` while benchmark
    // availability is still resolving — otherwise the option flickers
    // none -> benchmarks once data loads and briefly marks the tile dirty.
    if (selected === 'benchmarks' && isBenchmarksLoading) {
      return selected;
    }
    const status =
      selected === 'benchmarks'
        ? effectiveOverlayAvailability.benchmark
        : selected === 'period-over-period'
          ? effectiveOverlayAvailability.comparison
          : effectiveOverlayAvailability.quota;
    if (!status.applicable || status.disabled) {
      return 'none';
    }
    return selected;
  }, [configurator.overlayOption, effectiveOverlayAvailability, isBenchmarksLoading]);

  const overlayControls = useMemo<ChartConfiguratorOverlayControlsProps>(
    () => ({
      isEnabled: true,
      overlayOption: effectiveOverlayOption,
      benchmarkType: configurator.benchmarkType,
      availableBenchmarkTypes,
      comparisonOffset: configurator.comparisonOffset,
      comparisonCustomStartDate: configurator.comparisonCustomStartDate,
      overlayAvailability: effectiveOverlayAvailability,
    }),
    [
      availableBenchmarkTypes,
      configurator.benchmarkType,
      configurator.comparisonCustomStartDate,
      configurator.comparisonOffset,
      effectiveOverlayAvailability,
      effectiveOverlayOption,
    ],
  );

  const sidebarProps = useMemo(
    () => ({
      ...configurator.sidebarProps,
      dispatch: dispatchWithChartTypeTracking,
      overlayControls,
    }),
    [configurator.sidebarProps, dispatchWithChartTypeTracking, overlayControls],
  );

  return {
    ...configurator,
    selectedChartType,
    chartPreview: {
      ...chartPreview,
      overlayOption: effectiveOverlayOption,
      benchmarkType: configurator.benchmarkType,
      comparisonOffset: configurator.comparisonOffset,
      comparisonCustomStartDate: configurator.comparisonCustomStartDate,
    },
    metricVariant,
    sidebarProps,
    overlayOption: effectiveOverlayOption,
  };
}
