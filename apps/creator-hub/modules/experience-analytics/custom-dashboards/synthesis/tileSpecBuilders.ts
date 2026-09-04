import {
  RAQIV2AggregationType,
  RAQIV2Dimension,
  RAQIV2Metric,
  RAQIV2MetricGranularity,
  RAQIV2PercentileType,
  RAQIV2UIPseudoDimension,
  type TRAQIV2Dimension,
} from '@rbx/creator-hub-analytics-config';
import type { TQueryFilter } from '@modules/clients/analytics/analyticsRAQIShared';
import { toSelectableBreakdownDimensions } from '@modules/experience-analytics-shared/chartConfigurator/ChartConfiguratorDimensions';
import type { SpecOverride } from '@modules/experience-analytics-shared/utils/computeRAQIV2SpecOverride';
import extractPseudoDimensionsFromFilters from '@modules/experience-analytics-shared/utils/extractPseudoDimensionsFromFilters';
import type { ChartTileConfig, DashboardMetricReference, TileFilter } from '../types';
import { isDurationChartType } from '../utils/chartTypeMapping';
import { isPersistableBreakdownDimension } from '../utils/validators';
import { TIME_INTERVAL_TO_GRANULARITY } from './granularityMapping';

/**
 * Pure builders that translate an authoring-time tile into the query filters,
 * breakdown dimensions, and spec overrides the renderer consumes. Extracted
 * from `synthesize.ts` so the forward synthesizer stays focused on assembling
 * the page config from these primitives.
 */

const RAQIV2_DIMENSION_VALUES: readonly string[] = Object.values(RAQIV2Dimension);

export function isRAQIV2Dimension(value: string): value is RAQIV2Dimension {
  return RAQIV2_DIMENSION_VALUES.includes(value);
}

export function getPrimaryChartMetric(
  tile: ChartTileConfig,
): ChartTileConfig['dataSpec']['metrics'][number] | null {
  return tile.dataSpec.metrics[0] ?? null;
}

const PERCENTILE_TYPE_PSEUDO_DIMENSION_KEY: string = RAQIV2UIPseudoDimension.PercentileType;
const AGGREGATION_TYPE_PSEUDO_DIMENSION_KEY: string = RAQIV2UIPseudoDimension.AggregationType;
const RAQIV2_PERCENTILE_TYPE_VALUES: readonly string[] = Object.values(RAQIV2PercentileType);
const RAQIV2_AGGREGATION_TYPE_VALUES: readonly string[] = Object.values(RAQIV2AggregationType);
const DATA_STORE_METRICS: ReadonlySet<string> = new Set([
  RAQIV2Metric.DataStoreConsumedListRequests,
  RAQIV2Metric.DataStoreConsumedReadRequests,
  RAQIV2Metric.DataStoreConsumedRemoveRequests,
  RAQIV2Metric.DataStoreConsumedWriteRequests,
  RAQIV2Metric.DataStoreListRequests,
  RAQIV2Metric.DataStoreListRequestsByEndpoint,
  RAQIV2Metric.DataStoreListRequestsQuota,
  RAQIV2Metric.DataStoreListRequestsQuotaOrdered,
  RAQIV2Metric.DataStoreListRequestsQuotaStandard,
  RAQIV2Metric.DataStoreReadRequests,
  RAQIV2Metric.DataStoreReadRequestsByEndpoint,
  RAQIV2Metric.DataStoreReadRequestsQuotaOrdered,
  RAQIV2Metric.DataStoreReadRequestsQuotaStandard,
  RAQIV2Metric.DataStoreRemoveRequests,
  RAQIV2Metric.DataStoreRemoveRequestsByEndpoint,
  RAQIV2Metric.DataStoreRemoveRequestsQuotaOrdered,
  RAQIV2Metric.DataStoreRemoveRequestsQuotaStandard,
  RAQIV2Metric.DataStoreRequests,
  RAQIV2Metric.DataStoreRequestsByEndpoint,
  RAQIV2Metric.DataStoreRequestsByStatus,
  RAQIV2Metric.DataStoreStorageQuotaBytes,
  RAQIV2Metric.DataStoreStorageUsageBytes,
  RAQIV2Metric.DataStoreWriteRequests,
  RAQIV2Metric.DataStoreWriteRequestsByEndpoint,
  RAQIV2Metric.DataStoreWriteRequestsQuotaOrdered,
  RAQIV2Metric.DataStoreWriteRequestsQuotaStandard,
]);

function isRAQIV2PercentileType(value: string): value is RAQIV2PercentileType {
  return RAQIV2_PERCENTILE_TYPE_VALUES.includes(value);
}

function isRAQIV2AggregationType(value: string): value is RAQIV2AggregationType {
  return RAQIV2_AGGREGATION_TYPE_VALUES.includes(value);
}

export function buildMetricVariantFilters(reference: DashboardMetricReference): TQueryFilter[] {
  const filters: TQueryFilter[] = [];
  reference.variantSelections?.forEach(({ pseudoDimensionKey, variantKey }) => {
    if (
      pseudoDimensionKey === PERCENTILE_TYPE_PSEUDO_DIMENSION_KEY &&
      isRAQIV2PercentileType(variantKey)
    ) {
      filters.push({
        dimension: RAQIV2UIPseudoDimension.PercentileType,
        values: [variantKey],
      });
    }
    if (
      pseudoDimensionKey === AGGREGATION_TYPE_PSEUDO_DIMENSION_KEY &&
      isRAQIV2AggregationType(variantKey)
    ) {
      filters.push({
        dimension: RAQIV2UIPseudoDimension.AggregationType,
        values: [variantKey],
      });
    }
  });
  return filters;
}

export function buildTileQueryFilters(filters: ReadonlyArray<TileFilter>): TQueryFilter[] {
  const queryFilters: TQueryFilter[] = [];
  filters.forEach((filter) => {
    if (isRAQIV2Dimension(filter.dimension)) {
      queryFilters.push({ dimension: filter.dimension, values: [...filter.values] });
      return;
    }
    if (filter.dimension === AGGREGATION_TYPE_PSEUDO_DIMENSION_KEY) {
      const values = filter.values.filter(isRAQIV2AggregationType);
      if (values.length > 0) {
        queryFilters.push({ dimension: RAQIV2UIPseudoDimension.AggregationType, values });
      }
      return;
    }
    if (filter.dimension === PERCENTILE_TYPE_PSEUDO_DIMENSION_KEY) {
      const values = filter.values.filter(isRAQIV2PercentileType);
      if (values.length > 0) {
        queryFilters.push({ dimension: RAQIV2UIPseudoDimension.PercentileType, values });
      }
    }
  });
  return queryFilters;
}

export function isMetricSpecificTileFilter(
  metric: string,
  filter: Pick<TileFilter, 'dimension'>,
): boolean {
  return DATA_STORE_METRICS.has(metric) && isMetricScopedDimension(filter.dimension);
}

export function isMetricScopedDimension(dimension: string): boolean {
  // The generated and app dimension enums share values but come from separate declarations.
  // oxlint-disable-next-line typescript/no-unsafe-enum-comparison
  return dimension === RAQIV2Dimension.DataStoreTypeV2;
}

export function buildEffectiveTileFilters(
  tile: ChartTileConfig,
  inheritedFilters: ReadonlyArray<TileFilter> = [],
): TQueryFilter[] {
  const primaryMetric = getPrimaryChartMetric(tile);
  const primaryMetricKey = primaryMetric?.metric.metricKey;
  const inheritedMetricFilters = primaryMetricKey
    ? inheritedFilters.filter((filter) =>
        isMetricSpecificTileFilter(primaryMetricKey, {
          dimension: filter.dimension,
        }),
      )
    : [];
  const tileFilters = buildRenderableTileFilters(tile.dataSpec.filters);
  const tileFilterDimensions = new Set(tileFilters.map((filter) => filter.dimension));
  return [
    ...buildRenderableTileFilters(inheritedMetricFilters).filter(
      (filter) => !tileFilterDimensions.has(filter.dimension),
    ),
    ...tileFilters,
  ];
}

function getCustomEventNameFilter(filters: readonly TQueryFilter[]): string | undefined {
  const value = filters.find((filter) => filter.dimension === RAQIV2Dimension.CustomEventName)
    ?.values[0];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

export function getMetricMappingOptions(filters: readonly TQueryFilter[]) {
  const { pseudoDimensionValues } = extractPseudoDimensionsFromFilters(filters);
  const customEventName = getCustomEventNameFilter(filters);
  return {
    ...(customEventName ? { customEventName } : {}),
    ...(pseudoDimensionValues.aggregationType !== null || pseudoDimensionValues.percentile !== null
      ? { pseudoDimensionValues }
      : {}),
  };
}

function buildRenderableTileFilters(filters: ReadonlyArray<TileFilter>): TQueryFilter[] {
  // Keep CustomEventName (and any other real dimensions) from the tile; variant
  // pseudo-dimensions live on `variantSelections` and must not be double-applied.
  // Mirrors the summary-card filter path; the table path carries the event
  // identity per-column, so it does not use this builder.
  return buildTileQueryFilters(filters).filter(
    (filter) =>
      filter.dimension !== RAQIV2UIPseudoDimension.AggregationType &&
      filter.dimension !== RAQIV2UIPseudoDimension.PercentileType,
  );
}

export function buildTileBreakdownDimensions(
  breakdownDimensions: ReadonlyArray<string> | undefined,
): TRAQIV2Dimension[] {
  if (!breakdownDimensions || breakdownDimensions.length === 0) {
    return [];
  }
  const dimensions: TRAQIV2Dimension[] = [];
  breakdownDimensions.forEach((dimension) => {
    if (isPersistableBreakdownDimension(dimension)) {
      dimensions.push(dimension);
    }
  });
  return toSelectableBreakdownDimensions(dimensions);
}

export function buildSpecOverride(
  tile: ChartTileConfig,
  inheritedFilters: ReadonlyArray<TileFilter> = [],
): SpecOverride {
  const override: { -readonly [K in keyof SpecOverride]: SpecOverride[K] } = {};
  const primaryMetric = getPrimaryChartMetric(tile);
  const metricVariantFilters = primaryMetric ? buildMetricVariantFilters(primaryMetric.metric) : [];
  const tileFilters = buildEffectiveTileFilters(tile, inheritedFilters);
  const filters = [...tileFilters, ...metricVariantFilters];
  if (filters.length > 0) {
    override.filter = { intersect: filters };
  }
  const breakdownDimensions = buildTileBreakdownDimensions(tile.dataSpec.breakdownDimensions);
  if (breakdownDimensions.length > 0) {
    override.breakdown = { override: breakdownDimensions };
  }
  const granularity = isDurationChartType(tile.chartSpec.chartType)
    ? RAQIV2MetricGranularity.None
    : TIME_INTERVAL_TO_GRANULARITY[tile.dataSpec.granularity];
  if (granularity !== undefined) {
    override.granularity = { override: granularity };
  }
  return override;
}
