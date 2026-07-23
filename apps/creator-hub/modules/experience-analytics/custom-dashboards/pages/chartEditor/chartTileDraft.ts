import {
  RAQIV2AggregationType,
  RAQIV2Metric,
  RAQIV2PercentileType,
  RAQIV2UIPseudoDimension,
} from '@rbx/creator-hub-analytics-config';
import type { TRAQIV2UIMetricFanoutDimensionValues } from '@rbx/creator-hub-analytics-config';
import { ChartType } from '@modules/charts-generic/charts/types/ChartTypes';
import type { ChartConfiguratorChartType } from '@modules/experience-analytics-shared/chartConfigurator/ChartConfiguratorChartTypes';
import type { TChartConfiguratorMetrics } from '@modules/experience-analytics-shared/chartConfigurator/chartConfiguratorMetricsConfig';
import {
  chartConfiguratorDefaultMetric,
  isChartConfiguratorMetric,
} from '@modules/experience-analytics-shared/chartConfigurator/chartConfiguratorMetricsConfig';
import type {
  ComparisonCustomStartDateValue,
  ComparisonOffsetValue,
} from '@modules/experience-analytics-shared/chartConfigurator/overlayUrlParams';
import type { OverlayOption } from '@modules/experience-analytics-shared/components/chartConfigurator/ChartConfiguratorOverlaysControl';
import type { SmoothingOption } from '@modules/experience-analytics-shared/components/chartConfigurator/ChartConfiguratorSmoothingControl';
import type { ExploreModeTableMetricColumn } from '@modules/experience-analytics-shared/components/chartConfigurator/chartConfiguratorTableColumns';
import { BenchmarkType } from '@modules/experience-analytics-shared/constants/BenchmarkType';
import type { BenchmarkOverlayType } from '@modules/experience-analytics-shared/hooks/useAnalyticsBenchmarks';
import {
  getFilterValueForDimension,
  updateFilterSingleValue,
  type UIFilters,
} from '@modules/experience-analytics-shared/layout/ExperienceAnalyticsPageControlBar/filterUtils';
import type { ComputedMetric } from '@modules/experience-analytics-shared/types/ComputedMetric';
import type { TUIGranularity } from '@modules/experience-analytics-shared/utils/seriesGranularities';
import { isValidEnumValue } from '@modules/miscellaneous/utils/enumUtils';
import { getChartRows } from '../../layout/dashboardLayout';
import { flattenRows } from '../../layout/rowLayout';
import {
  GRANULARITY_TO_TIME_INTERVAL,
  TIME_INTERVAL_TO_GRANULARITY,
} from '../../synthesis/granularityMapping';
import {
  DEFAULT_CHART_GRANULARITY,
  type ChartTileConfig,
  type ChartOverlays,
  type ChartTileSmoothing,
  type CustomDashboardSummaryCardAggregation,
  type CustomDashboardConfig,
  type CustomDashboardTile,
  type DashboardMetricReference,
  type DashboardMetricVariantSelection,
  type SummaryCardAggregation,
  type SummaryCardTitleSource,
  type SummaryCardTileConfig,
  type TimeInterval,
} from '../../types';
import { CustomDashboardSummaryCardAggregation as SummaryAggregation } from '../../types';
import { exploreChartTypeToTileChartType } from '../../utils/chartTypeMapping';
import { createTileId } from '../../utils/createTileId';
import { resolveDefaultChartAggregation } from '../../utils/resolveDefaultChartAggregation';
import { isSummaryCardAggregationSupported } from '../../utils/summaryCardAggregation';

export const NEW_CHART_TILE_ROUTE_ID = 'new' as const;

export const SUPPORTED_SUMMARY_CARD_EDITOR_AGGREGATIONS: readonly CustomDashboardSummaryCardAggregation[] =
  [
    SummaryAggregation.AverageOverTimePeriod,
    SummaryAggregation.Cumulative,
    SummaryAggregation.MostRecentDataPoint,
  ];

const SUPPORTED_SUMMARY_CARD_EDITOR_AGGREGATION_SET: ReadonlySet<string> = new Set(
  SUPPORTED_SUMMARY_CARD_EDITOR_AGGREGATIONS,
);
const PERCENTILE_TYPE_PSEUDO_DIMENSION_KEY: string = RAQIV2UIPseudoDimension.PercentileType;
const AGGREGATION_TYPE_PSEUDO_DIMENSION_KEY: string = RAQIV2UIPseudoDimension.AggregationType;

export function isNewChartTileRoute(tileIdParam: string | undefined): boolean {
  return tileIdParam === NEW_CHART_TILE_ROUTE_ID;
}

export function metricVariantToSelections(
  metricVariant: TRAQIV2UIMetricFanoutDimensionValues | undefined,
): ReadonlyArray<DashboardMetricVariantSelection> | undefined {
  const selections: DashboardMetricVariantSelection[] = [];
  if (metricVariant?.percentile) {
    selections.push({
      pseudoDimensionKey: RAQIV2UIPseudoDimension.PercentileType,
      variantKey: metricVariant.percentile,
    });
  }
  if (metricVariant?.aggregationType) {
    selections.push({
      pseudoDimensionKey: RAQIV2UIPseudoDimension.AggregationType,
      variantKey: metricVariant.aggregationType,
    });
  }
  return selections.length > 0 ? selections : undefined;
}

export function selectionsToMetricVariant(
  selections: ReadonlyArray<DashboardMetricVariantSelection> | undefined,
): TRAQIV2UIMetricFanoutDimensionValues | undefined {
  const percentile = selections?.find(
    (selection) => selection.pseudoDimensionKey === PERCENTILE_TYPE_PSEUDO_DIMENSION_KEY,
  )?.variantKey;
  const aggregationType = selections?.find(
    (selection) => selection.pseudoDimensionKey === AGGREGATION_TYPE_PSEUDO_DIMENSION_KEY,
  )?.variantKey;
  if (!percentile && !aggregationType) {
    return undefined;
  }
  const validatedPercentile =
    percentile && isValidEnumValue(RAQIV2PercentileType, percentile) ? percentile : null;
  const validatedAggregationType =
    aggregationType && isValidEnumValue(RAQIV2AggregationType, aggregationType)
      ? aggregationType
      : null;
  if (!validatedPercentile && !validatedAggregationType) {
    return undefined;
  }
  return {
    percentile: validatedPercentile,
    aggregationType: validatedAggregationType,
  };
}

/**
 * Reads the live metric-variant (percentile / aggregation) selection out of the
 * chart configurator's working filters. The configurator stores variant choices
 * as `PercentileType` / `AggregationType` pseudo-dimension filters, so this is
 * the source of truth for the *current* selection at save time — deriving the
 * variant from the originally-hydrated tile instead would persist a stale value
 * after the user changes the variant.
 */
export function customEventFiltersToMetricVariant(
  filters: UIFilters,
): TRAQIV2UIMetricFanoutDimensionValues | undefined {
  const percentileValue = getFilterValueForDimension(
    filters,
    RAQIV2UIPseudoDimension.PercentileType,
    null,
  );
  const aggregationValue = getFilterValueForDimension(
    filters,
    RAQIV2UIPseudoDimension.AggregationType,
    null,
  );
  const percentile =
    percentileValue && isValidEnumValue(RAQIV2PercentileType, percentileValue)
      ? percentileValue
      : null;
  const aggregationType =
    aggregationValue && isValidEnumValue(RAQIV2AggregationType, aggregationValue)
      ? aggregationValue
      : null;
  if (!percentile && !aggregationType) {
    return undefined;
  }
  return { percentile, aggregationType };
}

/**
 * Seeds a persisted metric variant into the configurator's initial working
 * filters so the variant survives the editor → save round-trip even when the
 * value was only stored on the persisted `variantSelections` (and not already
 * present as a pseudo-dimension filter). Existing filter selections win.
 */
export function mergeMetricVariantIntoFilters(
  filters: UIFilters,
  variant: TRAQIV2UIMetricFanoutDimensionValues | undefined,
): UIFilters {
  let next = filters;
  if (
    variant?.percentile &&
    getFilterValueForDimension(next, RAQIV2UIPseudoDimension.PercentileType, null) === null
  ) {
    next = updateFilterSingleValue(
      next,
      RAQIV2UIPseudoDimension.PercentileType,
      variant.percentile,
    );
  }
  if (
    variant?.aggregationType &&
    getFilterValueForDimension(next, RAQIV2UIPseudoDimension.AggregationType, null) === null
  ) {
    next = updateFilterSingleValue(
      next,
      RAQIV2UIPseudoDimension.AggregationType,
      variant.aggregationType,
    );
  }
  return next;
}

/**
 * Resolves the chart type to persist for a tile. Area is hydrated read-only by
 * the editor — the configurator never lets the user select Area — so an opened
 * Area tile keeps its type on save unless the user explicitly picks a different
 * chart type. Every other case persists the configurator's live selection.
 */
export function resolveSavedChartType({
  persistedChartType,
  selectedChartType,
  hasUserSelectedChartType,
}: {
  readonly persistedChartType: ChartConfiguratorChartType | null;
  readonly selectedChartType: ChartConfiguratorChartType;
  readonly hasUserSelectedChartType: boolean;
}): ChartConfiguratorChartType {
  if (persistedChartType === ChartType.Area && !hasUserSelectedChartType) {
    return ChartType.Area;
  }
  return selectedChartType;
}

function getMetricReferenceFromTile(tile: CustomDashboardTile): DashboardMetricReference {
  return tile.type === 'Chart'
    ? (tile.dataSpec.metrics[0]?.metric ?? { metricKey: RAQIV2Metric.DailyActiveUsers })
    : tile.metric;
}

export function findChartTileInConfig(
  config: CustomDashboardConfig,
  tileId: string,
): ChartTileConfig | null {
  return flattenRows(getChartRows(config)).find((tile) => tile.tileId === tileId) ?? null;
}

export function createDefaultChartTileDraft(tileId: string): ChartTileConfig {
  const defaultMetric: DashboardMetricReference = {
    metricKey: RAQIV2Metric.DailyActiveUsers,
  };
  return {
    tileId,
    type: 'Chart',
    dataSpec: {
      metrics: [
        {
          metric: defaultMetric,
          seriesKey: RAQIV2Metric.DailyActiveUsers,
        },
      ],
      aggregation: resolveDefaultChartAggregation(defaultMetric),
      granularity: DEFAULT_CHART_GRANULARITY,
      filters: [],
    },
    chartSpec: {
      chartType: ChartType.Spline,
    },
  };
}

export function timeIntervalToGranularity(timeInterval: TimeInterval): TUIGranularity | undefined {
  return TIME_INTERVAL_TO_GRANULARITY[timeInterval];
}

export function granularityToTimeInterval(granularity: TUIGranularity): TimeInterval | undefined {
  return GRANULARITY_TO_TIME_INTERVAL[granularity];
}

function normalizeOptionalTitle(title: string): string | undefined {
  const trimmed = title.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export type ChartTileEditorOverlayState = {
  readonly overlayOption: OverlayOption;
  readonly benchmarkType: BenchmarkOverlayType | null;
  readonly comparisonOffset: ComparisonOffsetValue;
  readonly comparisonCustomStartDate: ComparisonCustomStartDateValue;
};

export function chartTileOverlaysToEditorState(
  overlays: ChartTileConfig['chartSpec']['overlays'] | undefined,
): ChartTileEditorOverlayState {
  const previousPeriod = overlays?.previousPeriod;
  if (previousPeriod) {
    return {
      overlayOption: 'period-over-period',
      benchmarkType: null,
      comparisonOffset:
        typeof previousPeriod === 'object' ? previousPeriod.relativeOffset : undefined,
      comparisonCustomStartDate:
        typeof previousPeriod === 'object' && previousPeriod.customStartTimeMs !== undefined
          ? new Date(previousPeriod.customStartTimeMs)
          : undefined,
    };
  }
  if (overlays?.genreBenchmark) {
    return {
      overlayOption: 'benchmarks',
      benchmarkType: BenchmarkType.Genre,
      comparisonOffset: undefined,
      comparisonCustomStartDate: undefined,
    };
  }
  if (overlays?.similarExperienceBenchmark) {
    return {
      overlayOption: 'benchmarks',
      benchmarkType: BenchmarkType.Similarity,
      comparisonOffset: undefined,
      comparisonCustomStartDate: undefined,
    };
  }
  if (overlays?.topExperienceBenchmark) {
    return {
      overlayOption: 'benchmarks',
      benchmarkType: null,
      comparisonOffset: undefined,
      comparisonCustomStartDate: undefined,
    };
  }
  if (overlays?.quota) {
    return {
      overlayOption: 'quota',
      benchmarkType: null,
      comparisonOffset: undefined,
      comparisonCustomStartDate: undefined,
    };
  }
  return {
    overlayOption: 'none',
    benchmarkType: null,
    comparisonOffset: undefined,
    comparisonCustomStartDate: undefined,
  };
}

export function editorOverlayStateToChartTileOverlays(
  overlayOption: OverlayOption,
  benchmarkType: BenchmarkOverlayType | null,
  comparisonOffset?: ComparisonOffsetValue,
  comparisonCustomStartDate?: ComparisonCustomStartDateValue,
): ChartOverlays | undefined {
  if (overlayOption === 'period-over-period') {
    if (comparisonOffset || comparisonCustomStartDate) {
      return {
        previousPeriod: {
          relativeOffset: comparisonOffset,
          customStartTimeMs: comparisonCustomStartDate?.getTime(),
        },
      };
    }
    return { previousPeriod: true };
  }
  if (overlayOption === 'benchmarks') {
    if (benchmarkType === BenchmarkType.Genre) {
      return { genreBenchmark: true };
    }
    if (benchmarkType === BenchmarkType.Similarity) {
      return { similarExperienceBenchmark: true };
    }
    return { topExperienceBenchmark: true };
  }
  if (overlayOption === 'quota') {
    return { quota: true };
  }
  return undefined;
}

export function chartTileSmoothingToEditorState(
  smoothing: ChartTileSmoothing | undefined,
): SmoothingOption {
  return smoothing === 'weekly' ? 'l7-moving-average' : 'none';
}

export function editorSmoothingToChartTileSmoothing(
  smoothingOption: SmoothingOption,
): ChartTileSmoothing | undefined {
  return smoothingOption === 'l7-moving-average' ? 'weekly' : undefined;
}

export function isSupportedSummaryCardEditorAggregation(
  aggregation: SummaryCardAggregation,
): aggregation is CustomDashboardSummaryCardAggregation {
  return SUPPORTED_SUMMARY_CARD_EDITOR_AGGREGATION_SET.has(aggregation);
}

export function normalizeSummaryCardEditorAggregation(
  aggregation: SummaryCardAggregation | undefined,
): CustomDashboardSummaryCardAggregation {
  return aggregation && isSupportedSummaryCardEditorAggregation(aggregation)
    ? aggregation
    : SummaryAggregation.AverageOverTimePeriod;
}

export type BuildChartTileFromEditorArgs = {
  readonly tileId: string;
  readonly metric: TChartConfiguratorMetrics;
  readonly metricVariant?: TRAQIV2UIMetricFanoutDimensionValues;
  readonly computedMetric?: ComputedMetric | null;
  readonly chartType: ChartConfiguratorChartType;
  readonly breakdownDimension?: string;
  readonly granularity: TUIGranularity;
  readonly title?: string;
  readonly overlayOption?: OverlayOption;
  readonly benchmarkType?: BenchmarkOverlayType | null;
  readonly comparisonOffset?: ComparisonOffsetValue;
  readonly comparisonCustomStartDate?: ComparisonCustomStartDateValue;
  readonly smoothingOption?: SmoothingOption;
  readonly filters?: UIFilters;
  readonly tableAdditionalColumns?: readonly ExploreModeTableMetricColumn[];
  readonly existing?: ChartTileConfig;
};

export type BuildSummaryCardTileFromEditorArgs = {
  readonly tileId: string;
  readonly metric: TChartConfiguratorMetrics;
  readonly metricVariant?: TRAQIV2UIMetricFanoutDimensionValues;
  readonly aggregation: SummaryCardTileConfig['aggregation'];
  readonly title?: string;
  readonly titleSource?: SummaryCardTitleSource;
  /** Working filters from the summary-card editor (e.g. CustomEventName). */
  readonly filters?: UIFilters;
  readonly existing?: SummaryCardTileConfig;
};

export function buildChartTileFromEditor({
  tileId,
  metric,
  metricVariant,
  computedMetric,
  chartType,
  breakdownDimension,
  granularity,
  title,
  overlayOption,
  benchmarkType,
  comparisonOffset,
  comparisonCustomStartDate,
  smoothingOption,
  filters,
  tableAdditionalColumns,
  existing,
}: BuildChartTileFromEditorArgs): ChartTileConfig | null {
  const persistedChartType = exploreChartTypeToTileChartType(chartType);
  if (!persistedChartType) {
    return null;
  }
  const timeInterval = granularityToTimeInterval(granularity);
  const nextOverlays =
    overlayOption === undefined
      ? existing?.chartSpec.overlays
      : editorOverlayStateToChartTileOverlays(
          overlayOption,
          benchmarkType ?? null,
          comparisonOffset,
          comparisonCustomStartDate,
        );
  const nextSmoothing =
    smoothingOption === undefined
      ? existing?.chartSpec.smoothing
      : editorSmoothingToChartTileSmoothing(smoothingOption);
  const persistedFilters =
    filters === undefined
      ? (existing?.dataSpec.filters ?? [])
      : filters
          // Metric-variant selections persist canonically on `variantSelections`
          // (built below). Drop the pseudo-dimension filters so the variant has a
          // single source of truth and does not double-persist into `dataSpec.filters`.
          .filter(
            (filter) =>
              filter.dimension !== RAQIV2UIPseudoDimension.AggregationType &&
              filter.dimension !== RAQIV2UIPseudoDimension.PercentileType,
          )
          .map((filter) => ({
            dimension: filter.dimension,
            values: [...filter.values],
          }));
  const primaryMetricReference: DashboardMetricReference = computedMetric
    ? { computedMetric, variantSelections: metricVariantToSelections(metricVariant) }
    : { metricKey: metric, variantSelections: metricVariantToSelections(metricVariant) };
  const primaryMetric: ChartTileConfig['dataSpec']['metrics'][number] = {
    metric: primaryMetricReference,
    seriesKey: metric,
  };
  const persistedTableAdditionalMetrics =
    chartType === ChartType.Table
      ? (tableAdditionalColumns ?? []).flatMap((column) => {
          if (column.metric === null) {
            return [];
          }
          return [
            {
              metric: { metricKey: column.metric },
              seriesKey: column.key,
            },
          ];
        })
      : [];
  return {
    ...existing,
    tileId,
    type: 'Chart',
    ...(title === undefined ? {} : { title: normalizeOptionalTitle(title) }),
    dataSpec: {
      ...(existing?.dataSpec ?? { metrics: [] }),
      metrics: [primaryMetric, ...persistedTableAdditionalMetrics],
      aggregation:
        existing?.dataSpec.aggregation ?? resolveDefaultChartAggregation(primaryMetricReference),
      ...(breakdownDimension
        ? { breakdownDimensions: [breakdownDimension] }
        : { breakdownDimensions: undefined }),
      granularity: timeInterval ?? existing?.dataSpec.granularity ?? DEFAULT_CHART_GRANULARITY,
      filters: persistedFilters,
    },
    chartSpec: {
      ...existing?.chartSpec,
      chartType: persistedChartType,
      ...(nextOverlays ? { overlays: nextOverlays } : { overlays: undefined }),
      ...(nextSmoothing ? { smoothing: nextSmoothing } : { smoothing: undefined }),
    },
  };
}

export function buildSummaryCardTileFromEditor({
  tileId,
  metric,
  metricVariant,
  aggregation,
  title,
  titleSource,
  filters,
  existing,
}: BuildSummaryCardTileFromEditorArgs): SummaryCardTileConfig | null {
  const normalizedAggregation = normalizeSummaryCardEditorAggregation(aggregation);
  if (!isSummaryCardAggregationSupported(metric, normalizedAggregation)) {
    return null;
  }
  const persistedFilters =
    filters === undefined
      ? (existing?.filters ?? [])
      : filters
          // Metric-variant selections persist canonically on `variantSelections`
          // (built below). Drop the pseudo-dimension filters so the variant has a
          // single source of truth and does not double-persist into `filters`.
          .filter(
            (filter) =>
              filter.dimension !== RAQIV2UIPseudoDimension.AggregationType &&
              filter.dimension !== RAQIV2UIPseudoDimension.PercentileType,
          )
          .map((filter) => ({
            dimension: filter.dimension,
            values: [...filter.values],
          }));
  return {
    ...existing,
    tileId,
    type: 'SummaryCard',
    ...(title === undefined ? {} : { title: normalizeOptionalTitle(title) }),
    titleSource: titleSource ?? existing?.titleSource,
    metric: { metricKey: metric, variantSelections: metricVariantToSelections(metricVariant) },
    aggregation: normalizedAggregation,
    filters: persistedFilters,
  };
}

function chartTileEditorComparisonPayload(tile: ChartTileConfig): ChartTileConfig {
  return {
    tileId: tile.tileId,
    type: tile.type,
    title: tile.title,
    dataSpec: tile.dataSpec,
    chartSpec: tile.chartSpec,
  };
}

export function hasChartTileEditorChanges({
  isNewTile,
  existingTile,
  draftTile,
}: {
  readonly isNewTile: boolean;
  readonly existingTile: ChartTileConfig | null;
  readonly draftTile: ChartTileConfig | null;
}): boolean {
  if (!draftTile) {
    return false;
  }
  if (isNewTile) {
    return true;
  }
  if (!existingTile) {
    return false;
  }
  return (
    JSON.stringify(chartTileEditorComparisonPayload(existingTile)) !==
    JSON.stringify(chartTileEditorComparisonPayload(draftTile))
  );
}

export function resolveInitialEditorMetric(
  tile: CustomDashboardTile | null,
  allowedMetrics: readonly TChartConfiguratorMetrics[],
): TChartConfiguratorMetrics | null {
  if (!tile) {
    return null;
  }
  const reference = getMetricReferenceFromTile(tile);
  const fromTile = reference.metricKey;
  if (fromTile && isChartConfiguratorMetric(fromTile) && allowedMetrics.includes(fromTile)) {
    return fromTile;
  }
  if (allowedMetrics.includes(chartConfiguratorDefaultMetric)) {
    return chartConfiguratorDefaultMetric;
  }
  return allowedMetrics[0] ?? null;
}

export function mintChartTileIdForSave(isNewTile: boolean, existingTileId?: string): string {
  return isNewTile ? createTileId() : (existingTileId ?? createTileId());
}
