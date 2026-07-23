import {
  RAQIV2Dimension,
  RAQIV2DimensionDisplayConfig,
  RAQIV2MetricGranularity,
  RAQIV2UIPseudoDimension,
  RAQIV2UIPseudoDimensionType,
} from '@rbx/creator-hub-analytics-config';
import type { TRAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import type { TExplicitTimeRangeSpec } from '@modules/charts-generic/charts/types/ChartTypes';
import { ColumnType } from '@modules/charts-generic/tables/types/GenericColumnType';
import type {
  RAQIV2BreakdownValue,
  RAQIV2ChartResource,
  RAQIV2QueryFilter,
} from '@modules/clients/analytics';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { isValidEnumValue } from '@modules/miscellaneous/utils/enumUtils';
import { getSingleDimensionBreakdownLabel } from '../../../adapters/genericRAQIV2ChartAdapter';
import type {
  RAQIV2TableRowID,
  RAQIV2TableColumnKey,
} from '../../../adapters/genericRAQIV2TableAdapter';
import {
  buildCellValue,
  buildMetricCellValue,
  getColumnBreakdowns,
  getAllRowBreakdowns,
  ingestColumnData,
  sortBreakdownRows,
  mergeMapsWithoutOverwriting,
  TIMESTAMP_PSEUDO_DIMENSION,
} from '../../../adapters/genericRAQIV2TableAdapter';
import type { PaginationResponse } from '../../../hooks/usePaginatedRequest';
import type { RAQIV2TranslationDependencies } from '../../../types/RAQIV2DimensionRenderer';
import type { RAQIV2CombinedAPIClientWrapper } from '../../../utils/makeRAQIV2Request';
import makeRAQIV2Request, { FetchComparisonSeriesMode } from '../../../utils/makeRAQIV2Request';
import { maybeThrowRAQIV2InternalException } from '../../../utils/RAQIV2InternalException';
import getDimensionColumnDisplayConfig from '../../getDimensionColumnDisplayConfig';
import type { PaginatedColumnRequest, RowDataResponse } from './GenericDataTable';
import type { MetricTableColumnSpec, TableColumnSpec } from './types';
import { isRAQIV2TableColumnSpec } from './types';

/**
 * Resolve the set of API dimensions that come from a TopN pseudo-dimension in
 * the given UI breakdown (e.g. `TopCountries` -> `Country`).
 *
 * Used by the table layer to avoid feeding a previous response's TopN-resolved
 * breakdown values back into the next request as filters: doing so would
 * (a) include the synthetic `'Other'` sentinel as a filter value, which is not
 * a real API value, and (b) over-constrain the topN re-discovery to a
 * pre-decided set, defeating the purpose of having the pseudo-dimension at
 * all. The TopN dimension stays in the breakdown so the discovery happens
 * naturally on each follow-up request.
 */
export const getTopNResolvedDimensions = (
  breakdown: readonly TRAQIV2Dimension[] | undefined,
): RAQIV2Dimension[] => {
  const dims: RAQIV2Dimension[] = [];
  breakdown?.forEach((dimension) => {
    if (!isValidEnumValue(RAQIV2UIPseudoDimension, dimension)) {
      return;
    }
    const { pseudoDimensionConfig } = RAQIV2DimensionDisplayConfig[dimension];
    if (pseudoDimensionConfig.type === RAQIV2UIPseudoDimensionType.TopNBreakdown) {
      dims.push(pseudoDimensionConfig.filterAndBreakdownDimension);
    }
  });
  return dims;
};

/**
 * Map a UI column dimension to the dimension that actually appears on
 * {@link RAQIV2BreakdownValue} entries returned by the API.
 *
 * For real {@link RAQIV2Dimension} values this is a no-op. For TopN
 * pseudo-dimensions (e.g. `TopCountries`) the API returns rows keyed by the
 * underlying real dimension (`Country`) — both for the discovered top values
 * and for the synthetic 'Other' bucket appended by `processUngroupedOtherResponse`
 * in `makeRAQIV2Request`. Looking up breakdown values by the pseudo-dimension
 * therefore always misses, which is what previously caused TopCountries (and
 * any other TopN-backed) cells to fall through to the "Total" fallback in
 * {@link breakdownToColumnDataResponse}.
 *
 * For metric-fanout pseudo-dimensions (e.g. `PercentileType`,
 * `AggregationType`) the API does not return a real dimension at all — the
 * "breakdown" is synthesized by `combineResponesFromFanoutBreakdown` in
 * `makeRAQIV2Request`, which appends a `{ dimension: <pseudo-dim>, value: ... }`
 * entry to each row's `breakdownValue`. Lookups must therefore use the
 * pseudo-dimension itself as the key; previously this returned `null` and
 * percentile-broken-down rows in the table fell through to "Total".
 *
 * Returns `null` only for pseudo-dimensions whose response shape is unknown,
 * which callers should treat as "no lookup possible".
 */
export const resolveDimensionForBreakdownValueLookup = (
  dimension: TRAQIV2Dimension,
): TRAQIV2Dimension | null => {
  if (isValidEnumValue(RAQIV2Dimension, dimension)) {
    return dimension;
  }
  if (!isValidEnumValue(RAQIV2UIPseudoDimension, dimension)) {
    return null;
  }
  const { pseudoDimensionConfig } = RAQIV2DimensionDisplayConfig[dimension];
  if (pseudoDimensionConfig.type === RAQIV2UIPseudoDimensionType.TopNBreakdown) {
    return pseudoDimensionConfig.filterAndBreakdownDimension;
  }
  if (pseudoDimensionConfig.type === RAQIV2UIPseudoDimensionType.MetricFanout) {
    return dimension;
  }
  return null;
};

/**
 * Build the per-row filter list a follow-up table-column query needs by
 * combining the caller's explicit `filters` with the row-identifying
 * `breakdownValues` returned from the previous (primary-column) request.
 *
 * Real-dimension filters and breakdown-value entries are merged by
 * dimension (deduped). Metric-fanout pseudo-dimension filters
 * (`AggregationType`, `PercentileType`) are passed through unchanged so
 * that `makeRAQIV2Request` can resolve them via `processFilterPseudoDimensions`
 * — without that pass-through a CustomEventsV2 column always falls back to
 * the default API metric and the AggregationType selection has no effect.
 */
export const expandFiltersToIncludeBreakdownValues = (
  filters: readonly RAQIV2QueryFilter[],
  breakdownValues: RAQIV2BreakdownValue[][],
  /**
   * Dimensions whose values should be skipped when expanding `breakdownValues`
   * into filters. Pass the set returned by {@link getTopNResolvedDimensions}
   * for any breakdown that includes a TopN pseudo-dimension; otherwise the
   * synthetic `'Other'` row would leak into the next request as a filter
   * value and break topN re-discovery.
   *
   * Filters explicitly listed in `filters` are still honored — this only
   * affects the auto-expansion from row breakdown values.
   */
  excludeBreakdownDimensions: readonly RAQIV2Dimension[] = [],
): RAQIV2QueryFilter[] => {
  const excludeBreakdownDimensionSet = new Set<RAQIV2Dimension>(excludeBreakdownDimensions);
  const filtersMap = breakdownValues.reduce<Map<RAQIV2Dimension, RAQIV2QueryFilter>>(
    (acc, breakdownValue) => {
      breakdownValue.forEach((value) => {
        const currentDimension =
          value.dimension && isValidEnumValue(RAQIV2Dimension, value.dimension)
            ? value.dimension
            : undefined;

        if (
          currentDimension &&
          !excludeBreakdownDimensionSet.has(currentDimension) &&
          value.value
        ) {
          const accValues: string[] = acc.get(currentDimension)?.values ?? [];
          if (accValues.length > 0) {
            const merged = accValues.includes(value.value)
              ? accValues
              : [...accValues, value.value];
            const newFilter: RAQIV2QueryFilter = {
              dimension: currentDimension,
              values: merged,
            };
            acc.set(currentDimension, newFilter);
          } else {
            // First time seeing this dimension, create new filter
            const newFilter: RAQIV2QueryFilter = {
              dimension: currentDimension,
              values: [value.value],
            };
            acc.set(currentDimension, newFilter);
          }
        }
      });
      return acc;
    },
    new Map<RAQIV2Dimension, RAQIV2QueryFilter>(),
  );
  // Pseudo-dimension filters (e.g. AggregationType, PercentileType) flow
  // straight through. They are not real query dimensions — `breakdownValues`
  // never carries entries for them, and the merge map above is keyed by
  // RAQIV2Dimension so they can't participate in the breakdown-value
  // expansion anyway. They DO need to reach `makeRAQIV2Request`, though:
  // `processFilterPseudoDimensions` reads them out of `spec.filter` to drive
  // `getApiMetrics` (e.g. CustomEventsV2 + AggregationType=Sum → the Sum API
  // metric variant). Dropping them here means a custom-events table column
  // silently falls back to the default API metric and the AggregationType
  // selection has no effect on the rendered values.
  const pseudoDimensionFilters: RAQIV2QueryFilter[] = [];
  filters.forEach((filter) => {
    if (isValidEnumValue(RAQIV2Dimension, filter.dimension)) {
      const currentFilterValues = filtersMap.get(filter.dimension);
      if (currentFilterValues) {
        // Merge incoming filter values with existing (dedup)
        const merged = Array.from(
          new Set<string>([...currentFilterValues.values, ...filter.values]),
        );
        filtersMap.set(filter.dimension, {
          dimension: filter.dimension,
          values: merged,
        });
      } else {
        filtersMap.set(filter.dimension, filter);
      }
    } else {
      pseudoDimensionFilters.push(filter);
    }
  });

  return [...Array.from(filtersMap.values()), ...pseudoDimensionFilters];
};

/**
 * The primary-fetch breakdown map fans rows out by every dimension the
 * caller asked for. When the table renders multiple metric columns, time
 * buckets or breakdown values that exist for a non-primary metric — but
 * not the primary one — would otherwise drop out, leaving "holes" in the
 * sibling columns. This helper runs the sibling specs in parallel and
 * unions their breakdown maps into the primary's, so the resulting row
 * set is the union across all metrics.
 *
 * Returns the original map untouched when there is nothing meaningful to
 * union (e.g. only one metric spec, or the primary is the only column
 * actually configured). Skipping the extra requests in those cases avoids
 * issuing a second API call per render that wouldn't change the row set.
 *
 * Used from both primary paths:
 *   - {@link makeRAQITableRequest} (metric-column primary)
 *   - {@link makeRAQIV2TableBreakdownColumnRequest} (timestamp / dimension
 *     primary), which previously seeded only from the first metric and
 *     thus reproduced the same class of regression for time-bucketed
 *     tables.
 */
const unionBreakdownMapsAcrossSiblingMetrics = async (
  primaryBreakdownMap: Map<RAQIV2TableRowID, RAQIV2BreakdownValue[]>,
  primaryColumnKey: string | undefined,
  siblingMetricSpecs: readonly MetricTableColumnSpec<string>[],
  client: RAQIV2CombinedAPIClientWrapper,
  isTotalRowIncluded: boolean | undefined,
): Promise<Map<RAQIV2TableRowID, RAQIV2BreakdownValue[]>> => {
  const remainingSpecs = siblingMetricSpecs.filter((spec) => spec.columnKey !== primaryColumnKey);
  if (remainingSpecs.length === 0) {
    return primaryBreakdownMap;
  }
  const mergedBreakdownMap = new Map(primaryBreakdownMap);
  const additionalBreakdownMaps = await Promise.all(
    remainingSpecs.map(async (spec) => {
      const { columnKey: _ignoredColumnKey, ...mergeSpecWithoutColumnKey } = spec;
      const specResponse = await makeRAQIV2Request(mergeSpecWithoutColumnKey, client, {
        fetchTotalSeries: isTotalRowIncluded,
        fetchComparison: undefined,
      });
      return getColumnBreakdowns(specResponse, spec.granularity);
    }),
  );
  additionalBreakdownMaps.forEach((breakdownMap) => {
    breakdownMap.forEach((mergedBreakdownValues, hash) => {
      if (!mergedBreakdownMap.has(hash)) {
        mergedBreakdownMap.set(hash, mergedBreakdownValues);
      }
    });
  });
  return mergedBreakdownMap;
};

/**
 * The row-union pass is only meaningful when the table can fan out into
 * more than one row — otherwise every sibling request is guaranteed to
 * produce the same single (totals) row that the primary already has, and
 * we'd be paying an extra API call per render for no change. A row fanout
 * happens whenever any of:
 *   - the spec carries at least one breakdown dimension, or
 *   - the spec has a non-`None` granularity (so the adapter fans rows out
 *     by timestamp via {@link TIMESTAMP_PSEUDO_DIMENSION}).
 *
 * Skipping the union for non-fanned-out tables keeps the legacy behavior
 * for simple single-row metric tables untouched.
 */
const specCanFanOutRows = (spec: { breakdown?: readonly unknown[]; granularity?: unknown }) =>
  (spec.breakdown?.length ?? 0) > 0 ||
  (spec.granularity !== undefined && spec.granularity !== RAQIV2MetricGranularity.None);

export const makeRAQITableRequest = async <TColumnKey extends string>(
  dataSpec: MetricTableColumnSpec<string>,
  request: PaginatedColumnRequest<RAQIV2BreakdownValue[], RAQIV2TableRowID, TColumnKey>,
  client: RAQIV2CombinedAPIClientWrapper,
  translationDependencies: RAQIV2TranslationDependencies,
  isTotalRowIncluded?: boolean,
  requiredBreakdownRows?: RAQIV2BreakdownValue[][],
  mergeBreakdownRowsFromMetricSpecs?: readonly MetricTableColumnSpec<string>[],
  enableComparisonRangePolicy?: boolean,
) => {
  const { columnKey: _columnKey, ...specWithoutColumnKey } = dataSpec;
  const { rows } = request;
  maybeThrowRAQIV2InternalException(specWithoutColumnKey.resource, 'TableDataFetch');

  const breakdownValues: RAQIV2BreakdownValue[][] =
    rows.length > 0 ? rows.map((row) => row.data) : []; // Empty for primary column

  // NOTE(yukihe@20250813): can handle pagination and sort in the future when CAaaS API supports it
  const raqiRequestSpec = {
    ...specWithoutColumnKey,
    filter: expandFiltersToIncludeBreakdownValues(
      specWithoutColumnKey.filter ?? [],
      breakdownValues,
      // Don't replay TopN pseudo-dimension values as filters on the follow-up
      // request: the TopN pseudo-dimension stays in `breakdown` and will be
      // re-resolved by `makeRAQIV2Request`. See `getTopNResolvedDimensions`.
      getTopNResolvedDimensions(specWithoutColumnKey.breakdown),
    ),
  };

  const raqiResponse = await makeRAQIV2Request(raqiRequestSpec, client, {
    enableComparisonRangePolicy,
    fetchTotalSeries: isTotalRowIncluded,
    fetchComparison: dataSpec.isComparisonDataShown
      ? {
          mode: FetchComparisonSeriesMode.Separate,
          granularity: RAQIV2MetricGranularity.None,
        }
      : undefined,
  });

  const columnBreakdowns = getColumnBreakdowns(raqiResponse, dataSpec.granularity);
  let effectiveRequiredBreakdownRows = requiredBreakdownRows;
  if (
    rows.length === 0 &&
    specCanFanOutRows(dataSpec) &&
    mergeBreakdownRowsFromMetricSpecs &&
    mergeBreakdownRowsFromMetricSpecs.length > 1
  ) {
    const mergedBreakdownMap = await unionBreakdownMapsAcrossSiblingMetrics(
      columnBreakdowns,
      dataSpec.columnKey,
      mergeBreakdownRowsFromMetricSpecs,
      client,
      isTotalRowIncluded,
    );
    effectiveRequiredBreakdownRows = Array.from(
      getAllRowBreakdowns(mergedBreakdownMap, requiredBreakdownRows).values(),
    );
  }
  const rowBreakdownFromRequest = rows.reduce((acc, row) => {
    return acc.set(row.id, row.data);
  }, new Map<RAQIV2TableRowID, RAQIV2BreakdownValue[]>());
  const rowBreakdownsFromResponse = getAllRowBreakdowns(
    columnBreakdowns,
    effectiveRequiredBreakdownRows,
  );
  const allRowBreakdowns = mergeMapsWithoutOverwriting(
    rowBreakdownFromRequest,
    rowBreakdownsFromResponse,
  );
  const specs: Map<RAQIV2TableColumnKey, TableColumnSpec<RAQIV2TableColumnKey>> = new Map([
    [dataSpec.columnKey, dataSpec],
  ]);
  const rowOrder = sortBreakdownRows(specs, allRowBreakdowns);
  const ingestedColumn = ingestColumnData(raqiResponse, dataSpec);

  // Convert to row-based format - filter out rows with null cell values
  const rowBasedData: RowDataResponse<RAQIV2BreakdownValue[], RAQIV2TableRowID>[] = [];

  rowOrder.forEach((hash) => {
    if (!ingestedColumn) {
      return;
    }

    const cellValue = buildMetricCellValue(hash, ingestedColumn, dataSpec, translationDependencies);

    rowBasedData.push({
      rowId: hash,
      data: cellValue,
      rowData: allRowBreakdowns.get(hash) ?? [],
    });
  });

  return {
    values: rowBasedData,
    total: rowBasedData.length,
    nextPaginationToken: '',
  };
};

/**
 * Pick a per-cell `Intl.DateTimeFormatOptions` for the synthetic Timestamp
 * column based on the bucket size. The chart x-axis tooltip path (see
 * `formatTimestampForChartTooltip`) makes the same coarse split:
 *   - sub-day buckets (minute/half-hour/hour) need wall-clock time, so we
 *     show date + time;
 *   - day/week/month buckets only carry meaningful information at day
 *     granularity, so we drop the time of day to avoid implying precision
 *     the data doesn't have.
 *
 * Returning `undefined` (e.g. for `None`) lets `formatCellContent` fall back
 * to its built-in `formatMediumDateTime`. We never expect to render a
 * Timestamp cell at `None` granularity in practice — the synthetic Timestamp
 * column is only injected when the table is time-bucketed — but we handle it
 * defensively so a bad caller can't crash the renderer.
 */
export const getTimestampCellFormatForGranularity = (
  granularity: RAQIV2MetricGranularity | undefined,
): Intl.DateTimeFormatOptions | undefined => {
  switch (granularity) {
    case RAQIV2MetricGranularity.OneMinute:
    case RAQIV2MetricGranularity.HalfHour:
    case RAQIV2MetricGranularity.OneHour:
      return { dateStyle: 'short', timeStyle: 'short' };
    case RAQIV2MetricGranularity.OneDay:
    case RAQIV2MetricGranularity.OneWeek:
    case RAQIV2MetricGranularity.OneMonth:
      return { dateStyle: 'medium' };
    case RAQIV2MetricGranularity.None:
    case undefined:
      return undefined;
    default: {
      // Don't crash the renderer if a new granularity ships before this
      // switch is updated — fall back to the renderer's default formatter.
      return undefined;
    }
  }
};

export const breakdownToColumnDataResponse = (
  hash: RAQIV2TableRowID,
  breakdownTuple: RAQIV2BreakdownValue[],
  dimension: TRAQIV2Dimension | typeof TIMESTAMP_PSEUDO_DIMENSION,
  translationDependencies: RAQIV2TranslationDependencies,
  columnTypeOverride?: ColumnType,
  /**
   * Bucket size driving the Timestamp cell's date/time formatting. Only read
   * when `dimension === TIMESTAMP_PSEUDO_DIMENSION`; ignored otherwise.
   */
  timestampGranularity?: RAQIV2MetricGranularity,
) => {
  // The synthetic timestamp pseudo-dimension is rendered directly as a
  // Timestamp cell — it has no entry in RAQIV2DimensionDisplayConfig and no
  // localized label, so short-circuit before the normal lookup path. The
  // caller-supplied `columnTypeOverride` (used to homogenize *real* breakdown
  // columns to plain Text in some surfaces) is intentionally ignored here:
  // demoting the timestamp to Text would lose the date/time formatting that
  // makes time-bucketed rows readable.
  if (dimension === TIMESTAMP_PSEUDO_DIMENSION) {
    const currentBreakdownValue = breakdownTuple.find((v) => v.dimension === dimension);
    // Raw API timestamp string: `ColumnType.Timestamp` cells accept plain
    // `string` and the renderer parses/formats it (see `TimestampCellType`).
    const timestampLabel = currentBreakdownValue?.value ?? '';
    // Build the cell directly (rather than via `buildCellValue`) so we can
    // attach the granularity-derived `format`. `buildCellValue` is shared
    // with non-table renderers and intentionally has no Timestamp-specific
    // surface area.
    return {
      rowId: hash,
      data: {
        type: ColumnType.Timestamp as const,
        value: timestampLabel,
        format: getTimestampCellFormatForGranularity(timestampGranularity),
      },
      rowData: breakdownTuple,
    };
  }
  const dimensionColumnConfig = getDimensionColumnDisplayConfig(dimension);
  // Resolve the column's UI dimension to the dimension that breakdown
  // values are actually keyed by in the response. For TopN pseudo-dims
  // (e.g. `TopCountries` -> `Country`) this is the underlying real API
  // dimension; for metric-fanout pseudo-dims (e.g. `PercentileType`) it
  // is the pseudo-dim itself, since `combineResponesFromFanoutBreakdown`
  // injects the pseudo-dim into the response. Without this step, `find`
  // would never match for pseudo-dim columns and every cell would fall
  // through to the "Total" label below — see regression tests in
  // `tableUtils.test.ts` for both failure modes.
  const lookupDimension = resolveDimensionForBreakdownValueLookup(dimension);
  const currentBreakdownValue =
    lookupDimension !== null
      ? breakdownTuple.find((v) => v.dimension === lookupDimension)
      : undefined;
  const translatedBreakdownLabel = currentBreakdownValue
    ? getSingleDimensionBreakdownLabel(currentBreakdownValue, translationDependencies)
    : {
        name: translationDependencies.translate(
          translationKey('Label.Total', TranslationNamespace.Analytics),
        ),
      };
  return {
    rowId: hash,
    data: buildCellValue(
      columnTypeOverride ?? dimensionColumnConfig.columnType,
      translatedBreakdownLabel,
      currentBreakdownValue,
    ),
    rowData: breakdownTuple,
  };
};

export const makeRAQIV2TableBreakdownColumnRequest = async <TColumnKey extends string>(
  resource: RAQIV2ChartResource,
  timeSpec: TExplicitTimeRangeSpec,
  dataColumnSpecs: TableColumnSpec<TColumnKey>[],
  dimension: TRAQIV2Dimension | typeof TIMESTAMP_PSEUDO_DIMENSION,
  allBreakdowns: TRAQIV2Dimension[],
  client: RAQIV2CombinedAPIClientWrapper,
  translationDependencies: RAQIV2TranslationDependencies,
  requiredBreakdownRows?: RAQIV2BreakdownValue[][],
  columnTypeOverride?: ColumnType,
  /**
   * Same union semantics as `makeRAQITableRequest`'s
   * `mergeBreakdownRowsFromMetricSpecs`: when set, the row set seeded by
   * the first metric is unioned with the breakdown maps from every
   * sibling metric spec so that time buckets / breakdown values that
   * only exist on a non-primary metric still produce rows. Without this,
   * a multi-metric time-bucketed table whose primary fetch goes through
   * this function (e.g. sorted by Timestamp) drops time buckets that
   * exist on a sibling metric but not the first one.
   */
  mergeBreakdownRowsFromMetricSpecs?: readonly MetricTableColumnSpec<string>[],
): Promise<PaginationResponse<RowDataResponse<RAQIV2BreakdownValue[], RAQIV2TableRowID>>> => {
  const firstMetric = dataColumnSpecs.find(isRAQIV2TableColumnSpec);
  if (!firstMetric) {
    throw new Error('No metric columns available to seed breakdown rows.');
  }
  const raqiResponse = await makeRAQIV2Request(
    {
      resource,
      timeSpec,
      metric: firstMetric.metric,
      granularity: firstMetric.granularity,
      breakdown: allBreakdowns,
      filter: firstMetric.filter,
      limit: undefined,
    },
    client,
    { fetchComparison: undefined },
  );
  const columnBreakdowns = getColumnBreakdowns(raqiResponse, firstMetric.granularity);
  // Union with sibling metric breakdown maps when the table is fanned out
  // (breakdown column(s) and/or non-`None` granularity). See
  // `unionBreakdownMapsAcrossSiblingMetrics` for the rationale.
  const mergedBreakdownMap =
    mergeBreakdownRowsFromMetricSpecs &&
    mergeBreakdownRowsFromMetricSpecs.length > 1 &&
    specCanFanOutRows(firstMetric)
      ? await unionBreakdownMapsAcrossSiblingMetrics(
          columnBreakdowns,
          firstMetric.columnKey,
          mergeBreakdownRowsFromMetricSpecs,
          client,
          undefined,
        )
      : columnBreakdowns;
  const allRowBreakdowns = getAllRowBreakdowns(mergedBreakdownMap, requiredBreakdownRows);
  const specs: Map<string, TableColumnSpec<string>> = new Map([
    [firstMetric.columnKey, firstMetric],
  ]);
  const rowOrder = sortBreakdownRows(specs, allRowBreakdowns);
  const allValues = rowOrder.map((hash) => {
    const breakdownTuple = allRowBreakdowns.get(hash) ?? [];
    return breakdownToColumnDataResponse(
      hash,
      breakdownTuple,
      dimension,
      translationDependencies,
      columnTypeOverride,
      // The seeding metric's granularity is what fanned the rows out into time
      // buckets in the first place (see `getColumnBreakdowns` above), so it's
      // also what should drive the Timestamp cell formatting. For non-timestamp
      // dimensions the parameter is ignored.
      firstMetric.granularity,
    );
  });

  return { values: allValues, total: allValues.length, nextPaginationToken: '' };
};
