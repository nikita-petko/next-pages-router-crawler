import {
  RAQIV2Dimension,
  RAQIV2MetricGranularity,
  RAQIV2UIPseudoDimension,
  type TRAQIV2Dimension,
} from '@rbx/creator-hub-analytics-config';
import AnalyticsComponentType from '@modules/analytics-configurations/AnalyticsComponentType';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { ChartType } from '@modules/charts-generic/charts/types/ChartTypes';
import ChartSummaryType from '@modules/charts-generic/enums/ChartSummaryType';
import { RAQIV2ChartResourceType } from '@modules/clients/analytics';
import { AnnotationType } from '@modules/clients/analytics/annotations/annotations';
import buildChartConfiguratorTableConfig, {
  type ExploreModeTableMetricColumnInput,
} from '@modules/experience-analytics-shared/chartConfigurator/buildChartConfiguratorTableConfig';
import { getChartConfiguratorDimensions } from '@modules/experience-analytics-shared/chartConfigurator/ChartConfiguratorDimensions';
import {
  getBaseMetricFromL7,
  getMetricForL7Smoothing,
} from '@modules/experience-analytics-shared/chartConfigurator/l7MetricMapping';
import { collapseComputedMetricToSimple } from '@modules/experience-analytics-shared/components/chartConfigurator/computedMetricUrlOwnership';
import getAnalyticsMetricDisplayConfig, {
  isNumericUIMetric,
  type TRAQIV2NumericUIMetric,
} from '@modules/experience-analytics-shared/constants/AnalyticsMetricDisplayConfig';
import { BenchmarkType } from '@modules/experience-analytics-shared/constants/BenchmarkType';
import type { AnalyticsSummaryCardConfig } from '@modules/experience-analytics-shared/constants/RAQIV2PredefinedSummaryCardConfig';
import type { AnalyticsTableConfig } from '@modules/experience-analytics-shared/constants/RAQIV2PredefinedTableConfig';
import { RAQIV2SummaryCardType } from '@modules/experience-analytics-shared/constants/RAQIV2SummaryCardType';
import type { RAQIV2CompoundSingleMetricSummaryType } from '@modules/experience-analytics-shared/enums/RAQIV2SummaryType';
import {
  getUIMetricFromAtomicMetricLike,
  isComputedMetric,
} from '@modules/experience-analytics-shared/types/ComputedMetric';
import type { MetricLike } from '@modules/experience-analytics-shared/types/ComputedMetric';
import type { ChartConfig } from '@modules/experience-analytics-shared/types/RAQIV2ChartConfig';
import {
  ChartOverlay,
  type ChartOverlays as RenderChartOverlays,
} from '@modules/experience-analytics-shared/types/RAQIV2ChartSpec';
import {
  CreatorAnalyticsPageMode,
  defaultAnalyticsPageSurfaceConfig,
  type AnalyticsPageConfigAnnotationOptions,
  type AnalyticsPageConfigDateOptions,
  type AnalyticsPageConfigDefaultDateRangeSelection,
  type CreatorAnalyticsUntabbedPageConfig,
  type RAQIV2UIComponent,
} from '@modules/experience-analytics-shared/types/RAQIV2PageConfig';
import { RAQIV2SpecialLayoutType } from '@modules/experience-analytics-shared/types/RAQIV2SpecialLayoutConfig';
import { getPageSurfaceMetrics } from '@modules/experience-analytics-shared/utils/getPredefinedComponentMetrics';
import { brandUserSuppliedText } from '@modules/experience-analytics-shared/utils/metricLikeSemantics';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { getChartRows, getDashboardSurface, getSummaryCards } from '../layout/dashboardLayout';
import {
  MAX_SUMMARY_CARDS_PER_DASHBOARD,
  MAX_TILES_PER_ROW,
  type ChartOverlays as TileChartOverlays,
  type ChartTileConfig,
  type CustomDashboardChartRow,
  type CustomDashboardConfig,
  type DashboardDateRangeDefault,
  type DashboardSurfaceControls,
  type DashboardMetricReference,
  type SummaryCardAggregation,
  type SummaryCardTileConfig,
  type TileFilter,
  type TileId,
} from '../types';
import { getCustomDashboardBreakdownDimensions } from '../utils/breakdownDimensions';
import { chartTileToRenderConfig } from '../utils/chartTypeMapping';
import {
  resolveSupportedSummaryCardAggregation,
  SUMMARY_CARD_TIME_SERIES_GRANULARITY,
} from '../utils/summaryCardAggregation';
import { TIME_INTERVAL_TO_GRANULARITY } from './granularityMapping';
import {
  buildMetricVariantFilters,
  buildSpecOverride,
  buildTileBreakdownDimensions,
  buildTileQueryFilters,
  getMetricMappingOptions,
  getPrimaryChartMetric,
  isRAQIV2Dimension,
} from './tileSpecBuilders';

/**
 * Forward synthesizer: turns an authoring-time `CustomDashboardConfig` into a
 * render-time `CreatorAnalyticsUntabbedPageConfig` consumed by
 * `CreatorAnalyticsLayout`. Pure, deterministic, total — never throws; per-tile
 * failures route to `unsupportedItems` (couldn't synthesize). Page chrome is
 * left empty because the editor / preview / view pages own their own headers.
 */

export type SynthesisUnsupportedItem = {
  readonly tileId: TileId;
  readonly kind: 'unknown-metric' | 'unsupported-chart-type' | 'unsupported-query';
  readonly message: string;
};

export type SynthesizeOptions = {
  readonly tileCache?: SynthesisTileCache;
};

export type SynthesizedSummaryEntry = {
  readonly tileId: TileId;
  readonly component: AnalyticsSummaryCardConfig;
};

export type SynthesizedChartEntry = {
  readonly tileId: TileId;
  readonly component: ChartConfig | AnalyticsTableConfig;
};

export type SynthesizeResult = {
  readonly pageConfig: CreatorAnalyticsUntabbedPageConfig;
  readonly unsupportedItems: ReadonlyArray<SynthesisUnsupportedItem>;
  /** Configured summary cards in render order; empty rows are pruned. */
  readonly summaries: ReadonlyArray<SynthesizedSummaryEntry>;
  /** Configured chart tiles preserved in row order; empty rows are pruned. */
  readonly chartRows: ReadonlyArray<ReadonlyArray<SynthesizedChartEntry>>;
};

type SummarySynthesisOutcome =
  | {
      readonly kind: 'rendered';
      readonly component: AnalyticsSummaryCardConfig;
      readonly degradedAggregation: boolean;
    }
  | { readonly kind: 'unsupported'; readonly reason: SynthesisUnsupportedItem };

type CachedTileOutcome<TOutcome> = {
  readonly fingerprint: string;
  readonly outcome: TOutcome;
};

export type SynthesisTileCache = {
  readonly chartTiles: Map<TileId, CachedTileOutcome<ChartSynthesisOutcome>>;
  readonly summaryTiles: Map<TileId, CachedTileOutcome<SummarySynthesisOutcome>>;
};

export function createSynthesisTileCache(): SynthesisTileCache {
  return {
    chartTiles: new Map(),
    summaryTiles: new Map(),
  };
}

/**
 * Drop cached outcomes for tiles that no longer exist in the config. Without
 * this the per-tile synthesis cache grows unbounded across edits as tiles are
 * removed/replaced (Finding #17).
 */
function evictStaleTileCacheEntries(
  config: CustomDashboardConfig,
  cache: SynthesisTileCache,
): void {
  const liveChartTileIds = new Set<TileId>();
  getChartRows(config).forEach((row) => {
    row.tiles.forEach((tile) => liveChartTileIds.add(tile.tileId));
  });
  const liveSummaryTileIds = new Set<TileId>(getSummaryCards(config).map((tile) => tile.tileId));
  cache.chartTiles.forEach((_outcome, tileId) => {
    if (!liveChartTileIds.has(tileId)) {
      cache.chartTiles.delete(tileId);
    }
  });
  cache.summaryTiles.forEach((_outcome, tileId) => {
    if (!liveSummaryTileIds.has(tileId)) {
      cache.summaryTiles.delete(tileId);
    }
  });
}

const tileSynthesisFingerprint = (tile: ChartTileConfig | SummaryCardTileConfig): string =>
  JSON.stringify(tile);

// `''` is treated as a no-op by the renderer. Reused for fields the renderer
// requires structurally but the editor's chrome owns.
const EMPTY_TRANSLATION_KEY = translationKey('', TranslationNamespace.Analytics);
const CUSTOM_DASHBOARD_SURFACE_ANNOTATION_OPTIONS: AnalyticsPageConfigAnnotationOptions = {
  supportedAnnotationTypes: [
    AnnotationType.PlaceIcon,
    AnnotationType.PlaceThumbnail,
    AnnotationType.PlaceVideo,
    AnnotationType.PlaceVersion,
    AnnotationType.Benchmark,
    AnnotationType.LiveEvent,
    AnnotationType.CustomMatchmaking,
    AnnotationType.RetentionCorhortDisclaimer,
    AnnotationType.ConfigVersion,
    AnnotationType.Announcement,
  ],
  defaultAnnotationTypes: [],
  showAnnotationsControl: true,
};

function tryResolveMetric(metricKey: string): TRAQIV2NumericUIMetric | null {
  return isNumericUIMetric(metricKey) ? metricKey : null;
}

function mapSummaryAggregation(aggregation: SummaryCardAggregation): {
  readonly summaryType: RAQIV2CompoundSingleMetricSummaryType;
  readonly granularity: RAQIV2MetricGranularity;
  readonly degraded: boolean;
} {
  if (aggregation === 'Cumulative') {
    return {
      summaryType: { type: ChartSummaryType.Total },
      granularity: RAQIV2MetricGranularity.None,
      degraded: false,
    };
  }
  if (aggregation === 'Total') {
    return {
      summaryType: { type: ChartSummaryType.Total },
      granularity: SUMMARY_CARD_TIME_SERIES_GRANULARITY,
      degraded: false,
    };
  }
  if (aggregation === 'AverageOverTimePeriod') {
    return {
      summaryType: { type: ChartSummaryType.Average },
      granularity: SUMMARY_CARD_TIME_SERIES_GRANULARITY,
      degraded: false,
    };
  }
  if (aggregation === 'MostRecentDataPoint') {
    return {
      summaryType: { type: ChartSummaryType.LastValue },
      granularity: SUMMARY_CARD_TIME_SERIES_GRANULARITY,
      degraded: false,
    };
  }
  // Median, Count*, Max, Min, Percentile*, AveragePerUniqueUser, and legacy RAQI
  // aggregation literals round-trip through the DTO, but the renderer's
  // summary path can't honor them.
  return {
    summaryType: { type: ChartSummaryType.Total },
    granularity: SUMMARY_CARD_TIME_SERIES_GRANULARITY,
    degraded: true,
  };
}

function getPrimaryMetricKey(reference: DashboardMetricReference): TRAQIV2NumericUIMetric | null {
  if (reference.metricKey) {
    return reference.metricKey;
  }
  const firstMetric = reference.computedMetric.sources[0]?.metric;
  if (!firstMetric) {
    return null;
  }
  const metricKey = getUIMetricFromAtomicMetricLike(firstMetric);
  return isNumericUIMetric(metricKey) ? metricKey : null;
}

function getCustomEventNameFromFilters(filters: readonly TileFilter[]): string | undefined {
  const customEventNameDimension: string = RAQIV2Dimension.CustomEventName;
  const entry = filters.find((filter) => filter.dimension === customEventNameDimension);
  const [value] = entry?.values ?? [];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function getCustomEventNameFromMetricReference(
  reference: DashboardMetricReference,
  filters: readonly TileFilter[],
): string | undefined {
  const computedMetric = reference.computedMetric;
  if (computedMetric) {
    return collapseComputedMetricToSimple(computedMetric)?.customEventName;
  }
  return getCustomEventNameFromFilters(filters);
}

function buildDefaultDateRangeSelection(
  defaultDateRange: DashboardDateRangeDefault | undefined,
): AnalyticsPageConfigDefaultDateRangeSelection | undefined {
  if (!defaultDateRange) {
    return undefined;
  }
  if (defaultDateRange.type === 'Relative') {
    return {
      type: 'Preset',
      rangeType: defaultDateRange.rangeType,
    };
  }
  return {
    type: 'Custom',
    startTime: new Date(defaultDateRange.startTimeMs),
    endTime: new Date(defaultDateRange.endTimeMs),
  };
}

function buildTimeRangeOptions(
  defaultDateRange: DashboardDateRangeDefault | undefined,
): AnalyticsPageConfigDateOptions {
  const baseTimeRangeOptions = defaultAnalyticsPageSurfaceConfig.timeRangeOptions;
  if (defaultDateRange?.type !== 'Relative' || baseTimeRangeOptions.type !== 'dateRange') {
    return baseTimeRangeOptions;
  }
  return {
    ...baseTimeRangeOptions,
    defaultRange: defaultDateRange.rangeType,
  };
}

function buildDefaultFilters(
  filters: DashboardSurfaceControls['defaultFilters'],
  sharedDimensions: ReadonlyArray<TRAQIV2Dimension>,
): CreatorAnalyticsUntabbedPageConfig['defaultFilters'] {
  if (!filters || filters.length === 0) {
    return undefined;
  }
  const sharedDimensionSet = new Set(sharedDimensions);
  const validFilters = filters
    .filter(
      (filter): filter is TileFilter & { readonly dimension: RAQIV2Dimension } =>
        isRAQIV2Dimension(filter.dimension) && sharedDimensionSet.has(filter.dimension),
    )
    .map((filter) => ({
      dimension: filter.dimension,
      values: [...filter.values],
      isInitialValueOnly: true,
    }));
  return validFilters.length > 0 ? validFilters : undefined;
}

/**
 * Append persisted dashboard-level dimensions that aren't already covered by the
 * metric-derived set, so a saved dashboard reproduces the filter/breakdown
 * controls it was configured with even when a metric's configurator dimensions
 * change. Metric-derived order is preserved; persisted extras are appended.
 */
function unionPersistedDimensions(
  base: readonly TRAQIV2Dimension[],
  persisted: ReadonlyArray<TRAQIV2Dimension> | undefined,
): readonly TRAQIV2Dimension[] {
  if (!persisted || persisted.length === 0) {
    return base;
  }
  const seen = new Set<TRAQIV2Dimension>(base);
  const union = [...base];
  persisted.forEach((dimension) => {
    if (!seen.has(dimension)) {
      seen.add(dimension);
      union.push(dimension);
    }
  });
  return union;
}

function getUnionChartConfiguratorDimensions(
  metrics: readonly TRAQIV2NumericUIMetric[],
): readonly TRAQIV2Dimension[] {
  const dimensionsByMetric: Partial<Record<string, readonly TRAQIV2Dimension[]>> =
    getChartConfiguratorDimensions();
  const seen = new Set<TRAQIV2Dimension>();
  const union: TRAQIV2Dimension[] = [];
  metrics.forEach((metric) => {
    dimensionsByMetric[metric]?.forEach((dimension) => {
      if (seen.has(dimension)) {
        return;
      }
      seen.add(dimension);
      union.push(dimension);
    });
  });
  return union;
}

function buildDefaultBreakdown(
  breakdown: DashboardSurfaceControls['defaultBreakdown'],
  sharedChartDimensions: ReadonlyArray<TRAQIV2Dimension>,
): ReadonlyArray<TRAQIV2Dimension> | undefined {
  if (!breakdown || breakdown.length === 0) {
    return undefined;
  }
  const sharedChartDimensionSet = new Set(sharedChartDimensions);
  const validBreakdown = breakdown.filter((dimension) => sharedChartDimensionSet.has(dimension));
  return validBreakdown.length > 0 ? validBreakdown : undefined;
}

function buildSurfaceAnnotationOptions(
  controls: DashboardSurfaceControls,
): AnalyticsPageConfigAnnotationOptions {
  const annotationOptions = controls.annotationOptions;
  return {
    ...CUSTOM_DASHBOARD_SURFACE_ANNOTATION_OPTIONS,
    supportedAnnotationTypes: annotationOptions?.supportedAnnotationTypes
      ? [...annotationOptions.supportedAnnotationTypes]
      : CUSTOM_DASHBOARD_SURFACE_ANNOTATION_OPTIONS.supportedAnnotationTypes,
    showAnnotationsControl: annotationOptions?.showAnnotationsControl ?? true,
    defaultAnnotationTypes: annotationOptions?.defaultAnnotationTypes
      ? [...annotationOptions.defaultAnnotationTypes]
      : CUSTOM_DASHBOARD_SURFACE_ANNOTATION_OPTIONS.defaultAnnotationTypes,
  };
}

function buildRenderOverlays(overlays: TileChartOverlays | undefined): RenderChartOverlays {
  const renderOverlays: Array<RenderChartOverlays[number]> = [];
  if (!overlays) {
    return renderOverlays;
  }
  if (overlays.previousPeriod) {
    const previousPeriod = overlays.previousPeriod;
    renderOverlays.push(
      typeof previousPeriod === 'object'
        ? ChartOverlay.comparison({
            relativeOffset: previousPeriod.relativeOffset,
            customStartDate:
              previousPeriod.customStartTimeMs !== undefined
                ? new Date(previousPeriod.customStartTimeMs)
                : undefined,
          })
        : ChartOverlay.comparison(),
    );
  }
  if (overlays.genreBenchmark) {
    renderOverlays.push(ChartOverlay.benchmark(BenchmarkType.Genre));
  } else if (overlays.similarExperienceBenchmark) {
    renderOverlays.push(ChartOverlay.benchmark(BenchmarkType.Similarity));
  } else if (overlays.topExperienceBenchmark) {
    renderOverlays.push(ChartOverlay.benchmark());
  }
  if (overlays.quota) {
    renderOverlays.push(ChartOverlay.quota());
  }
  return renderOverlays;
}

type ChartSynthesisOutcome =
  | { readonly kind: 'rendered'; readonly component: ChartConfig | AnalyticsTableConfig }
  | { readonly kind: 'unsupported'; readonly reason: SynthesisUnsupportedItem };

function resolveTablePrimaryMetric(
  tile: ChartTileConfig,
  metric: TRAQIV2NumericUIMetric,
): MetricLike {
  const primaryMetric = getPrimaryChartMetric(tile);
  const computedMetric = primaryMetric?.metric.computedMetric;
  const shouldApplySmoothing = tile.chartSpec.smoothing === 'weekly';
  const mappingOptions = getMetricMappingOptions(buildTileQueryFilters(tile.dataSpec.filters));
  if (computedMetric) {
    if (shouldApplySmoothing) {
      return {
        ...computedMetric,
        l7Smoothing: true,
      };
    }
    const { l7Smoothing: _l7Smoothing, ...withoutL7Smoothing } = computedMetric;
    return withoutL7Smoothing;
  }
  return getMetricForL7Smoothing(metric, shouldApplySmoothing, mappingOptions);
}

function buildTableMetricColumnInput(
  tile: ChartTileConfig,
  metricColumn: ChartTileConfig['dataSpec']['metrics'][number],
  index: number,
): ExploreModeTableMetricColumnInput | null {
  const primaryMetricKey = getPrimaryMetricKey(metricColumn.metric);
  const metric = primaryMetricKey ? tryResolveMetric(primaryMetricKey) : null;
  if (!metric) {
    return null;
  }
  return {
    key: metricColumn.seriesKey || `${tile.tileId}-${index}`,
    metric:
      metricColumn.metric.computedMetric ??
      getMetricForL7Smoothing(
        metric,
        tile.chartSpec.smoothing === 'weekly',
        getMetricMappingOptions([
          ...buildTileQueryFilters(tile.dataSpec.filters),
          ...buildMetricVariantFilters(metricColumn.metric),
        ]),
      ),
    filter: buildMetricVariantFilters(metricColumn.metric),
  };
}

function synthesizeTableTile(tile: ChartTileConfig): ChartSynthesisOutcome {
  const primaryMetric = getPrimaryChartMetric(tile);
  const primaryMetricKey = primaryMetric ? getPrimaryMetricKey(primaryMetric.metric) : null;
  const metric = primaryMetricKey ? tryResolveMetric(primaryMetricKey) : null;
  if (!metric) {
    return {
      kind: 'unsupported',
      reason: {
        tileId: tile.tileId,
        kind: 'unknown-metric',
        message: `Metric ${primaryMetricKey ?? 'unknown'} is not registered.`,
      },
    };
  }
  const granularity =
    tile.dataSpec.granularity !== undefined
      ? (TIME_INTERVAL_TO_GRANULARITY[tile.dataSpec.granularity] ?? RAQIV2MetricGranularity.OneDay)
      : RAQIV2MetricGranularity.OneDay;
  const tableConfig = buildChartConfiguratorTableConfig({
    breakdown: buildTileBreakdownDimensions(tile.dataSpec.breakdownDimensions),
    primaryMetric: {
      key: tile.tileId,
      metric: resolveTablePrimaryMetric(tile, metric),
      filter: buildMetricVariantFilters(primaryMetric?.metric ?? { metricKey: metric }),
    },
    additionalMetricColumns: tile.dataSpec.metrics
      .slice(1)
      .map((metricColumn, index) => buildTableMetricColumnInput(tile, metricColumn, index + 1))
      .filter((column): column is ExploreModeTableMetricColumnInput => column !== null),
    pageLevelFilter: buildTileQueryFilters(tile.dataSpec.filters),
    granularity,
  });
  if (!tableConfig) {
    return {
      kind: 'unsupported',
      reason: {
        tileId: tile.tileId,
        kind: 'unsupported-chart-type',
        message: `Chart type ${tile.chartSpec.chartType} is not yet supported by the renderer.`,
      },
    };
  }
  return {
    kind: 'rendered',
    component: {
      ...tableConfig,
      tableKey: `custom-dashboard-${tile.tileId}`,
    },
  };
}

function synthesizeChartTile(tile: ChartTileConfig): ChartSynthesisOutcome {
  if (tile.chartSpec.chartType === ChartType.Table) {
    return synthesizeTableTile(tile);
  }
  const primaryMetric = getPrimaryChartMetric(tile);
  const primaryMetricKey = primaryMetric ? getPrimaryMetricKey(primaryMetric.metric) : null;
  const metric = primaryMetricKey ? tryResolveMetric(primaryMetricKey) : null;
  if (!metric) {
    return {
      kind: 'unsupported',
      reason: {
        tileId: tile.tileId,
        kind: 'unknown-metric',
        message: `Metric ${primaryMetricKey ?? 'unknown'} is not registered.`,
      },
    };
  }
  const chartTypeConfig = chartTileToRenderConfig(tile);
  if (!chartTypeConfig) {
    return {
      kind: 'unsupported',
      reason: {
        tileId: tile.tileId,
        kind: 'unsupported-chart-type',
        message: `Chart type ${tile.chartSpec.chartType} is not yet supported by the renderer.`,
      },
    };
  }
  const overrides = buildSpecOverride(tile);
  const titleMetric = getBaseMetricFromL7(metric) ?? metric;
  const { localizedName } = getAnalyticsMetricDisplayConfig(titleMetric);
  const customTitle = tile.title?.trim();
  const computedMetric = primaryMetric?.metric.computedMetric;
  const computedMetricName = computedMetric?.name?.trim();
  const customEventName = primaryMetric
    ? getCustomEventNameFromMetricReference(primaryMetric.metric, tile.dataSpec.filters)
    : undefined;
  const shouldApplySmoothing = tile.chartSpec.smoothing === 'weekly';
  const metricMappingOptions = getMetricMappingOptions([
    ...buildTileQueryFilters(tile.dataSpec.filters),
    ...(primaryMetric ? buildMetricVariantFilters(primaryMetric.metric) : []),
  ]);
  const smoothedMetric = getMetricForL7Smoothing(
    metric,
    shouldApplySmoothing,
    metricMappingOptions,
  );
  const renderedMetric =
    !computedMetric && !isComputedMetric(smoothedMetric) && typeof smoothedMetric === 'string'
      ? smoothedMetric
      : metric;
  const renderedComputedMetric = computedMetric
    ? {
        ...computedMetric,
        ...(shouldApplySmoothing ? { l7Smoothing: true } : {}),
      }
    : isComputedMetric(smoothedMetric)
      ? smoothedMetric
      : undefined;
  const component: ChartConfig = {
    type: AnalyticsComponentType.Chart,
    chartKey: tile.tileId,
    titleKey: localizedName,
    ...(customTitle
      ? { titleLabel: customTitle }
      : computedMetricName
        ? { titleLabel: computedMetricName }
        : customEventName
          ? { titleLabel: customEventName }
          : {}),
    metric: renderedMetric,
    ...(renderedComputedMetric ? { computedMetric: renderedComputedMetric } : {}),
    overrides,
    overlays: buildRenderOverlays(tile.chartSpec.overlays),
    ...chartTypeConfig,
  };
  return { kind: 'rendered', component };
}

function synthesizeSummaryTile(tile: SummaryCardTileConfig):
  | {
      readonly kind: 'rendered';
      readonly component: AnalyticsSummaryCardConfig;
      readonly degradedAggregation: boolean;
    }
  | { readonly kind: 'unsupported'; readonly reason: SynthesisUnsupportedItem } {
  const metricKey = getPrimaryMetricKey(tile.metric);
  const metric = metricKey ? tryResolveMetric(metricKey) : null;
  if (!metric) {
    return {
      kind: 'unsupported',
      reason: {
        tileId: tile.tileId,
        kind: 'unknown-metric',
        message: `Metric ${metricKey ?? 'unknown'} is not registered.`,
      },
    };
  }
  const resolvedAggregation = resolveSupportedSummaryCardAggregation(metric, tile.aggregation);
  if (!resolvedAggregation) {
    return {
      kind: 'unsupported',
      reason: {
        tileId: tile.tileId,
        kind: 'unsupported-query',
        message: `Metric ${metric} does not support a summary-card granularity.`,
      },
    };
  }
  const {
    summaryType,
    granularity,
    degraded: degradedByRenderer,
  } = mapSummaryAggregation(resolvedAggregation);
  const degraded = degradedByRenderer || resolvedAggregation !== tile.aggregation;
  const metricVariantFilters = buildMetricVariantFilters(tile.metric);
  // Keep CustomEventName (and any other real dimensions) from the tile; variant
  // pseudo-dimensions live on `variantSelections` and must not be double-applied.
  const tileFilters = buildTileQueryFilters(tile.filters).filter(
    (filter) =>
      filter.dimension !== RAQIV2UIPseudoDimension.AggregationType &&
      filter.dimension !== RAQIV2UIPseudoDimension.PercentileType,
  );
  const filters = [...tileFilters, ...metricVariantFilters];
  const title = tile.title?.trim();
  const component: AnalyticsSummaryCardConfig = {
    type: AnalyticsComponentType.SummaryCard,
    cardType: RAQIV2SummaryCardType.Metric,
    metric,
    summaryType,
    ...(title ? { labelText: brandUserSuppliedText(title) } : {}),
    overrides: {
      breakdown: { override: [] },
      granularity: { override: granularity },
      ...(filters.length > 0 ? { filter: { intersect: filters } } : {}),
    },
    // Comparison chips are supported for Cumulative via Separate None fetches
    // (see getFetchComparison). Combined slicing is never used for None.
    showComparisonChip: true,
  };
  return { kind: 'rendered', component, degradedAggregation: degraded };
}

/**
 * Memoize a per-tile synthesis outcome keyed by tileId, re-running only when the
 * tile's content fingerprint changes. Shared by the chart and summary paths so
 * both caches use one lookup/store/fingerprint flow.
 */
function synthesizeWithCache<TTile extends ChartTileConfig | SummaryCardTileConfig, TOutcome>(
  tile: TTile,
  cache: Map<TileId, CachedTileOutcome<TOutcome>> | undefined,
  synthesizeTile: (tile: TTile) => TOutcome,
): TOutcome {
  if (!cache) {
    return synthesizeTile(tile);
  }
  const fingerprint = tileSynthesisFingerprint(tile);
  const cached = cache.get(tile.tileId);
  if (cached?.fingerprint === fingerprint) {
    return cached.outcome;
  }
  const outcome = synthesizeTile(tile);
  cache.set(tile.tileId, { fingerprint, outcome });
  return outcome;
}

function synthesizeChartRow(
  row: CustomDashboardChartRow,
  ctx: SynthesisContext,
): RAQIV2UIComponent | null {
  const components: Array<ChartConfig | AnalyticsTableConfig> = [];
  const rowEntries: SynthesizedChartEntry[] = [];
  const tiles = row.tiles;
  const columnCount = row.columnCount;
  tiles.forEach((tile) => {
    const outcome = synthesizeWithCache(tile, ctx.tileCache?.chartTiles, synthesizeChartTile);
    if (outcome.kind === 'unsupported') {
      ctx.unsupported.push(outcome.reason);
      return;
    }
    components.push(outcome.component);
    rowEntries.push({ tileId: tile.tileId, component: outcome.component });
  });
  if (components.length === 0) {
    return null;
  }
  ctx.chartRows.push(rowEntries);
  if (columnCount === MAX_TILES_PER_ROW) {
    return {
      type: RAQIV2SpecialLayoutType.TwoPerRowLayout,
      items: components,
    };
  }
  if (components.length > 1) {
    return {
      type: RAQIV2SpecialLayoutType.RowLayout,
      items: components,
    };
  }
  return {
    type: RAQIV2SpecialLayoutType.FullWidthLayout,
    items: components,
  };
}

function synthesizeSummaryRow(
  summaries: ReadonlyArray<SummaryCardTileConfig>,
  ctx: SynthesisContext,
): RAQIV2UIComponent | null {
  const components: AnalyticsSummaryCardConfig[] = [];
  summaries.slice(0, MAX_SUMMARY_CARDS_PER_DASHBOARD).forEach((tile) => {
    const outcome = synthesizeWithCache(tile, ctx.tileCache?.summaryTiles, synthesizeSummaryTile);
    if (outcome.kind === 'unsupported') {
      ctx.unsupported.push(outcome.reason);
      return;
    }
    components.push(outcome.component);
    ctx.summaries.push({ tileId: tile.tileId, component: outcome.component });
  });
  if (components.length === 0) {
    return null;
  }
  return {
    type: RAQIV2SpecialLayoutType.RowLayout,
    items: components,
  };
}

type SynthesisContext = {
  readonly unsupported: SynthesisUnsupportedItem[];
  readonly summaries: SynthesizedSummaryEntry[];
  readonly chartRows: SynthesizedChartEntry[][];
  readonly tileCache?: SynthesisTileCache;
};

function makeContext(tileCache: SynthesisTileCache | undefined): SynthesisContext {
  const unsupported: SynthesisUnsupportedItem[] = [];
  const summaries: SynthesizedSummaryEntry[] = [];
  const chartRows: SynthesizedChartEntry[][] = [];
  return {
    unsupported,
    summaries,
    chartRows,
    tileCache,
  };
}

export function synthesize(
  config: CustomDashboardConfig,
  options?: SynthesizeOptions,
): SynthesizeResult {
  const ctx = makeContext(options?.tileCache);
  const body: RAQIV2UIComponent[] = [];
  const surface = getDashboardSurface(config);
  const controls = surface.controls;

  const summaryRow = synthesizeSummaryRow(getSummaryCards(config), ctx);
  if (summaryRow) {
    body.push(summaryRow);
  }

  getChartRows(config).forEach((row) => {
    const rendered = synthesizeChartRow(row, ctx);
    if (rendered) {
      body.push(rendered);
    }
  });

  const surfaceMetrics = getPageSurfaceMetrics(body).filter(isNumericUIMetric);
  const chartSurfaceMetrics = getPageSurfaceMetrics(
    ctx.chartRows.flatMap((row) => row.map((entry) => entry.component)),
  ).filter(isNumericUIMetric);
  const filterDimensions = unionPersistedDimensions(
    getUnionChartConfiguratorDimensions(surfaceMetrics),
    controls.filterDimensions,
  );
  const chartBreakdownDimensions = getCustomDashboardBreakdownDimensions(
    unionPersistedDimensions(
      getUnionChartConfiguratorDimensions(chartSurfaceMetrics),
      controls.breakdownDimensions,
    ),
  );

  const defaultFilters = buildDefaultFilters(controls.defaultFilters, filterDimensions);
  const defaultBreakdown = buildDefaultBreakdown(
    controls.defaultBreakdown,
    chartBreakdownDimensions,
  );
  const defaultDateRange =
    controls.timeRangeOptions?.type === 'DateRange'
      ? controls.timeRangeOptions.defaultSelection
      : undefined;

  const pageConfig: CreatorAnalyticsUntabbedPageConfig = {
    mode: CreatorAnalyticsPageMode.Untabbed,
    title: EMPTY_TRANSLATION_KEY,
    description: { standard: EMPTY_TRANSLATION_KEY },
    docLinks: [],
    resourceTypes: [RAQIV2ChartResourceType.Universe],
    timeRangeOptions: buildTimeRangeOptions(defaultDateRange),
    defaultDateRangeSelection: buildDefaultDateRangeSelection(defaultDateRange),
    surfaceAnnotationOptions: buildSurfaceAnnotationOptions(controls),
    filterDimensions,
    defaultFilters,
    breakdownDimensions: chartBreakdownDimensions,
    defaultBreakdown,
    defaultGranularity: controls.defaultGranularity,
    body,
  };

  if (ctx.tileCache) {
    evictStaleTileCacheEntries(config, ctx.tileCache);
  }

  return {
    pageConfig,
    unsupportedItems: ctx.unsupported,
    summaries: ctx.summaries,
    chartRows: ctx.chartRows,
  };
}
