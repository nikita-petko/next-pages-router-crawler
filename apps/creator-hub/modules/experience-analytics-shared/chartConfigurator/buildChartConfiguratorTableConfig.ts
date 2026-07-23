import type { TRAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import {
  RAQIV2Dimension,
  RAQIV2MetricGranularity,
  RAQIV2UIMetric,
  RAQIV2UIPseudoDimension,
} from '@rbx/creator-hub-analytics-config';
import AnalyticsComponentType from '@modules/analytics-configurations/AnalyticsComponentType';
import type { FormattedText } from '@modules/analytics-translations/types';
import { ColumnType } from '@modules/charts-generic/tables/types/GenericColumnType';
import type { TQueryFilter as RAQIV2QueryFilter } from '@modules/clients/analytics/analyticsRAQIShared';
import { TIMESTAMP_PSEUDO_DIMENSION } from '../adapters/genericRAQIV2TableAdapter';
import type { TAnalyticsMetricTableColumnConfig } from '../constants/RAQIV2PredefinedTableColumnConfig';
import type { AnalyticsTableConfig } from '../constants/RAQIV2PredefinedTableConfig';
import {
  isComputedMetric,
  isCustomEventsAtomicMetricLike,
  type MetricLike,
} from '../types/ComputedMetric';
import { brandUserSuppliedText } from '../utils/metricLikeSemantics';

/**
 * A single metric column to render in the explore-mode table.
 *
 * The column header label is intentionally NOT specified here: by default
 * the renderer derives it from the {@link MetricLike} via
 * `getMetricTitleKeyFromMetricLike`, which handles atomic metrics
 * (translated metric name), named computed metrics (user-provided name),
 * and unnamed computed metrics (a localized "(Untitled formula)"
 * placeholder — never the raw formula text). The builder layers one
 * exception on top of that: CustomEventsV2 columns get their selected
 * `CustomEventName` value as a `titleOverride` so multiple custom-event
 * columns in the same table don't all render with the same generic
 * "Custom Events" header (see {@link getCustomEventNameTitle}).
 */
export type ExploreModeTableMetricColumnInput = {
  key: string;
  metric: MetricLike;
  /**
   * Per-column filter override. When omitted the column inherits the
   * page-level filter set from the table context (see RAQIV2TableContext).
   */
  filter?: readonly RAQIV2QueryFilter[];
};

export type BuildExploreModeTableConfigArgs = {
  breakdown: readonly TRAQIV2Dimension[];
  /**
   * The metric column derived from the user's primary metric selection. When
   * `null`, no primary column is emitted (the table will still render any
   * additional columns, but this typically means the empty state should be
   * shown by the caller).
   */
  primaryMetric: ExploreModeTableMetricColumnInput | null;
  /**
   * Optional metric columns derived from the operations-mode equation builder
   * sources, surfaced as dedicated columns immediately after the primary one.
   */
  derivedSourceColumns?: readonly ExploreModeTableMetricColumnInput[];
  /**
   * Additional user-added metric columns appended after the primary and
   * derived-source columns.
   */
  additionalMetricColumns?: readonly ExploreModeTableMetricColumnInput[];
  /**
   * The page-level filter that the caller will set on the table context.
   * Used here to compute per-column filter overrides that scope the
   * custom-event sidebar dimensions (`CustomEventName`, `AggregationType`)
   * to CustomEventsV2 columns only — see {@link CUSTOM_EVENT_COLUMN_DIMENSIONS}
   * and the comment on {@link toMetricColumnConfig}.
   *
   * When omitted, columns simply inherit the page-level filter as-is and no
   * scoping is applied — preserves the legacy behavior for callers that
   * don't render custom-event controls.
   */
  pageLevelFilter?: readonly RAQIV2QueryFilter[];
  /**
   * The active time granularity from the chart context. Required because it
   * drives table-level decisions that must stay in sync with the same
   * granularity flowing into the underlying RAQI queries via the table
   * context — passing it independently would invite drift.
   *
   * Currently used to pick `defaultActiveSort`:
   *   - non-`None` → time-bucketed table → default to chronological
   *     (Timestamp asc), matching how time-series charts are read.
   *   - `None` (cumulative) → default to the primary metric column (desc, via
   *     `computeRAQIV2MetricColumnConfigOverride`'s direction), preserving
   *     the pre-sort behavior callers had before breakdown columns became
   *     sortable.
   */
  granularity: RAQIV2MetricGranularity;
};

/**
 * Filter dimensions that are owned exclusively by the CustomEventsV2 metric:
 * - `CustomEventName` is a real query dimension that scopes results to a
 *   specific custom event; sending it on a query for a different metric
 *   would either return no rows (the dimension isn't valid for that metric)
 *   or silently scope the metric to the event payload, which is wrong.
 * - `AggregationType` is a metric-fanout pseudo-dimension that drives UI
 *   metric → API metric resolution for CustomEventsV2 only. Other metrics
 *   either ignore it or use a different fanout dimension entirely (e.g.
 *   `PercentileType`), so leaking it across columns silently changes their
 *   resolved API metric.
 *
 * Kept here (rather than imported from the explore-mode page) so the
 * builder is self-contained and the test file can exercise the scoping
 * rule without dragging the page module into the dep graph.
 */
const CUSTOM_EVENT_COLUMN_DIMENSIONS: readonly TRAQIV2Dimension[] = [
  RAQIV2Dimension.CustomEventName,
  RAQIV2UIPseudoDimension.AggregationType,
];

const isCustomEventsAtomicMetric = (metric: MetricLike): boolean =>
  !isComputedMetric(metric) &&
  (isCustomEventsAtomicMetricLike(metric) || metric === RAQIV2UIMetric.CustomEventsV2);

const stripCustomEventDimensions = (filters: readonly RAQIV2QueryFilter[]): RAQIV2QueryFilter[] =>
  filters.filter((f) => !CUSTOM_EVENT_COLUMN_DIMENSIONS.includes(f.dimension));

const isNonEmpty = (
  filters: readonly RAQIV2QueryFilter[] | undefined,
): filters is readonly RAQIV2QueryFilter[] => filters !== undefined && filters.length > 0;

/**
 * Combine a column's per-column filter with the page-level filter the column
 * inherits from `tableContext`. Returns the filter list the column should
 * actually query against.
 *
 * Merge semantics (per-dimension):
 *   - For any dimension present in `perColumn`, the per-column entry WINS
 *     (e.g. column says `Country=BR`, page says `Country=US` → column queries
 *     against `Country=BR`).
 *   - All other page-level dimensions flow through unchanged (e.g. page-wide
 *     `Platform=Desktop` is always in effect).
 *   - Precedence is enforced by stripping any colliding dimension out of the
 *     `pageLevel` half of the result before concatenation, not by relying on
 *     iteration order downstream — so the resulting list contains at most
 *     one entry per dimension and any consumer (`processFilterPseudoDimensions`,
 *     `filters.find(...)`, etc.) will see the per-column value regardless of
 *     how it iterates. The trailing `...perColumn` placement is purely
 *     cosmetic (keeps page-level entries first in the merged list).
 *
 * Note on which filters typically live where: page-level filters are the
 * sidebar's global scope (Country, Platform, time spec, etc.). The custom-
 * event sidebar dimensions (`CustomEventName`, `AggregationType`) are
 * conceptually per-column for CustomEventsV2 — they're owned by the equation
 * builder's per-source controls and are explicitly excluded from the
 * page-level filter drawer. Legacy single-metric CustomEventsV2 mode is the
 * one exception: there `ChartConfiguratorCustomEventControls` writes them into the
 * page-level filter, but the moment the user enters operations mode (or adds
 * additional columns) those page-level entries get migrated into per-source
 * filters and cleared from the page level to avoid double-apply.
 *
 * This is intentionally NOT the wholesale-replacement that
 * `computeRAQIV2SpecOverride`'s `filter.override` does on its own. Replacing
 * page-level filters silently drops the user's globally-applied filters
 * (Country, Platform, etc.) for any column that adds even a single per-column
 * scope, which is never what the user intends — per-column filters are
 * conceptually a refinement of the page-level filter, not a substitute for
 * it.
 */
const mergePerColumnAndPageLevelFilters = (
  perColumn: readonly RAQIV2QueryFilter[] | undefined,
  pageLevel: readonly RAQIV2QueryFilter[] | undefined,
): RAQIV2QueryFilter[] => {
  if (!isNonEmpty(perColumn)) {
    return pageLevel ? [...pageLevel] : [];
  }
  if (!isNonEmpty(pageLevel)) {
    return [...perColumn];
  }
  const perColumnDims = new Set(perColumn.map((f) => f.dimension));
  const inherited = pageLevel.filter((f) => !perColumnDims.has(f.dimension));
  return [...inherited, ...perColumn];
};

/**
 * Pull the user-selected custom-event name out of a filter list so a
 * CustomEventsV2 column can show it as the column header instead of the
 * generic atomic-metric label ("Custom Events"). Returns `null` when:
 *   - no `CustomEventName` filter is present (column hasn't been scoped yet),
 *   - the filter exists but has no values, or
 *   - more than one value is selected (no single label fits, and we'd
 *     rather fall back to the generic header than silently pick one).
 *
 * The filter list passed in is the column's *effective* filter — its own
 * explicit `filter` when set, otherwise the page-level filter that the
 * column inherits via tableContext. Either way, the resolved value is the
 * same one the column will actually query against.
 */
const getCustomEventNameTitle = (
  metric: MetricLike,
  filters: readonly RAQIV2QueryFilter[] | undefined,
): FormattedText | undefined => {
  if (!isComputedMetric(metric) && isCustomEventsAtomicMetricLike(metric)) {
    return brandUserSuppliedText(metric.customEventName);
  }
  if (!filters) {
    return undefined;
  }
  const entry = filters.find((f) => f.dimension === RAQIV2Dimension.CustomEventName);
  if (!entry || entry.values.length !== 1) {
    return undefined;
  }
  const [value] = entry.values;
  if (typeof value !== 'string' || value.length === 0) {
    return undefined;
  }
  return brandUserSuppliedText(value);
};

// Default number of rows shown per page in the Explore Mode table.
const DEFAULT_TABLE_PAGE_SIZE = 10;

// Page-size options offered to the user in the Explore Mode table.
const TABLE_PAGE_SIZE_OPTIONS: readonly number[] = [10, 25, 50, 100];

const toMetricColumnConfig = (
  input: ExploreModeTableMetricColumnInput,
  pageLevelFilter: readonly RAQIV2QueryFilter[] | undefined,
): TAnalyticsMetricTableColumnConfig => {
  // Resolve the *effective* filter for this column up-front: the per-column
  // `input.filter` merged on top of the page-level filter (per-dimension
  // wins for entries the column specifies; everything else flows through).
  // `effectiveFilter` is what the column will actually query against, and
  // is also what we derive the header from — so the two are guaranteed to
  // agree.
  //
  // Custom-event sidebar dimensions (CustomEventName + AggregationType) are
  // only valid for CustomEventsV2 columns; for any other column we strip
  // them out of the merged result so that a CustomEventsV2 selection
  // (primary or another column) doesn't bleed into unrelated columns.
  // CustomEventsV2 columns keep them as-is.
  const isCustomEventsColumn = isCustomEventsAtomicMetric(input.metric);
  const merged = mergePerColumnAndPageLevelFilters(input.filter, pageLevelFilter);
  const effectiveFilter = isCustomEventsColumn ? merged : stripCustomEventDimensions(merged);

  // Decide whether to materialize an explicit `filter.override` or let the
  // column inherit `tableContext.filter` from `computeRAQIV2SpecOverride`:
  //
  //   - If the column has its own `input.filter`, we MUST materialize an
  //     override. Inheritance would skip the per-column entries entirely.
  //   - For non-custom-events columns, we also materialize whenever the
  //     page-level filter contains custom-event dimensions that need to be
  //     stripped — inheritance can't drop entries.
  //   - Otherwise the override would be byte-identical to inheritance, so we
  //     skip it to avoid an unnecessary identity copy on every column.
  let shouldMaterializeOverride = false;
  if (isNonEmpty(input.filter)) {
    shouldMaterializeOverride = true;
  } else if (!isCustomEventsColumn && pageLevelFilter !== undefined) {
    shouldMaterializeOverride = effectiveFilter.length !== pageLevelFilter.length;
  }

  const overrides = shouldMaterializeOverride
    ? { filter: { override: effectiveFilter } }
    : undefined;

  // For CustomEventsV2 columns, surface the selected event name (e.g.
  // "HOUSING") as the column header. The atomic-metric label ("Custom
  // Events") is the same for every CustomEventsV2 column in the table, so a
  // multi-column comparison (primary + additional CustomEventsV2 columns,
  // each scoped to a different event) would otherwise render with
  // indistinguishable headers.
  //
  // We derive from `effectiveFilter` directly so the header always tracks
  // what the column queries: a per-column CustomEventName wins over the
  // page-level value (because `mergePerColumnAndPageLevelFilters` puts the
  // per-column entry in), but a per-column filter that *doesn't* mention
  // CustomEventName lets the page-level value flow through (because that's
  // exactly what the column also queries against post-merge).
  const titleOverride = isCustomEventsColumn
    ? getCustomEventNameTitle(input.metric, effectiveFilter)
    : undefined;

  return {
    key: input.key,
    metric: input.metric,
    overrides,
    ...(titleOverride !== undefined ? { titleOverride } : {}),
  };
};

/**
 * Build the {@link AnalyticsTableConfig} that explore mode feeds into the
 * shared {@link AnalyticsConfigTable} pipeline. Returns `null` when no metric
 * columns are configured (caller should render an empty state in that case).
 *
 * Notes:
 * - We only set `titleOverride` for CustomEventsV2 columns, where the
 *   header is replaced with the selected `CustomEventName` value (so
 *   multiple custom-event columns are distinguishable). All other columns
 *   derive the header from the metric (atomic label or computed metric
 *   name), so URL-driven sharing produces identical labels regardless of
 *   who built the config.
 * - `breakdown` flows through unchanged. When the table context (constructed
 *   by the caller) sets a non-`None` granularity, the adapter will
 *   automatically inject a synthetic Timestamp column and emit one row per
 *   `(breakdown, timestamp)` tuple.
 */
const buildChartConfiguratorTableConfig = ({
  breakdown,
  primaryMetric,
  derivedSourceColumns,
  additionalMetricColumns,
  pageLevelFilter,
  granularity,
}: BuildExploreModeTableConfigArgs): AnalyticsTableConfig | null => {
  const dataColumns: TAnalyticsMetricTableColumnConfig[] = [];

  if (primaryMetric) {
    dataColumns.push(toMetricColumnConfig(primaryMetric, pageLevelFilter));
  }
  derivedSourceColumns?.forEach((col) => {
    dataColumns.push(toMetricColumnConfig(col, pageLevelFilter));
  });
  additionalMetricColumns?.forEach((col) => {
    dataColumns.push(toMetricColumnConfig(col, pageLevelFilter));
  });

  if (dataColumns.length === 0) {
    return null;
  }

  // Pick an explicit default sort up-front so we don't rely on the implicit
  // `firstColumnWithSort` fallback in `GenericDataTable` — that fallback would
  // shift to the leftmost dimension column once `breakdownColumnsSortable`
  // gives every breakdown a sort handle, silently changing pre-existing
  // behavior for non-time-bucketed tables.
  const isTimeBucketed = granularity !== RAQIV2MetricGranularity.None;
  const defaultActiveSort = isTimeBucketed
    ? TIMESTAMP_PSEUDO_DIMENSION
    : (primaryMetric?.key ?? dataColumns[0].key);

  // `breakdowns` on AnalyticsTableConfig is a mutable `TRAQIV2Dimension[]`,
  // while the caller-provided `breakdown` is `readonly TRAQIV2Dimension[]`.
  // Both alias to the same `RAQIV2Dimension | RAQIV2UIPseudoDimension` union,
  // so the only structural difference is mutability — copying into a typed,
  // mutable intermediate satisfies the table config without a type assertion.
  const breakdowns: TRAQIV2Dimension[] = [...breakdown];

  return {
    type: AnalyticsComponentType.Table,
    tableKey: 'explore-mode-table',
    dataColumns,
    breakdowns,
    // Force consistent plain-text rendering for breakdown dimension columns —
    // the explore mode table avoids per-dimension styling (e.g. bolded
    // TextWithTooltip) so that all rows have the same visual weight.
    breakdownColumnTypeOverride: ColumnType.Text,
    // Explore-mode-only opt-in: let users sort by any breakdown column. The
    // synthetic Timestamp column is sortable independently of this flag; this
    // extends the same affordance to user-selected breakdowns (Country, etc.).
    breakdownColumnsSortable: true,
    // Keep row identity stable regardless of which metric is primary by
    // seeding the table row set from the union of all metric columns.
    mergeMetricBreakdownRows: true,
    tableConfig: { defaultActiveSort },
    pagination: {
      initialPageSize: DEFAULT_TABLE_PAGE_SIZE,
      pageSizeOptions: [...TABLE_PAGE_SIZE_OPTIONS],
    },
  };
};

export default buildChartConfiguratorTableConfig;
