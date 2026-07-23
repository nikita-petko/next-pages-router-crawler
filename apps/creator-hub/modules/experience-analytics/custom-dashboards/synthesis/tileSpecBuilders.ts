import {
  RAQIV2AggregationType,
  RAQIV2Dimension,
  RAQIV2PercentileType,
  RAQIV2UIPseudoDimension,
  type TRAQIV2Dimension,
} from '@rbx/creator-hub-analytics-config';
import type { TQueryFilter } from '@modules/clients/analytics/analyticsRAQIShared';
import type { SpecOverride } from '@modules/experience-analytics-shared/utils/computeRAQIV2SpecOverride';
import extractPseudoDimensionsFromFilters from '@modules/experience-analytics-shared/utils/extractPseudoDimensionsFromFilters';
import type { ChartTileConfig, DashboardMetricReference, TileFilter } from '../types';
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
  return buildTileQueryFilters(filters).filter(
    (filter) =>
      filter.dimension !== RAQIV2Dimension.CustomEventName &&
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
  const seen = new Set<TRAQIV2Dimension>();
  const dimensions: TRAQIV2Dimension[] = [];
  breakdownDimensions.forEach((dimension) => {
    if (isRAQIV2Dimension(dimension) && !seen.has(dimension)) {
      seen.add(dimension);
      dimensions.push(dimension);
    }
  });
  return dimensions;
}

export function buildSpecOverride(tile: ChartTileConfig): SpecOverride {
  const override: { -readonly [K in keyof SpecOverride]: SpecOverride[K] } = {};
  const primaryMetric = getPrimaryChartMetric(tile);
  const metricVariantFilters = primaryMetric ? buildMetricVariantFilters(primaryMetric.metric) : [];
  const tileFilters = buildRenderableTileFilters(tile.dataSpec.filters);
  const filters = [...tileFilters, ...metricVariantFilters];
  if (filters.length > 0) {
    override.filter = { intersect: filters };
  }
  const breakdownDimensions = buildTileBreakdownDimensions(tile.dataSpec.breakdownDimensions);
  if (breakdownDimensions.length > 0) {
    override.breakdown = { override: breakdownDimensions };
  }
  const granularity = TIME_INTERVAL_TO_GRANULARITY[tile.dataSpec.granularity];
  if (granularity !== undefined) {
    override.granularity = { override: granularity };
  }
  return override;
}
