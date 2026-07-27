import type { TopNConfig, QueryFilter } from '@rbx/client-analytics-query-gateway/v1';
import type {
  RAQIV2Dimension,
  RAQIV2Metric,
  TUIPseudoDimensionTopNBreakdownConfig,
} from '@rbx/creator-hub-analytics-config';

/**
 * A `TopNConfig` narrowed to what a resolved Creator Hub TopN display config can
 * actually produce: the dimension and order metric are real API values (never
 * pseudo-dimensions), and the fields the display config always supplies are
 * required rather than inheriting the wire type's optionality.
 *
 * `orderTimeRangeDays` stays optional because it doubles as the discriminator
 * for `limitTimeRange`: `undefined` means "rank over the full query range".
 */
export type RankTopNConfig = Omit<
  TopNConfig,
  'dimension' | 'orderByMetric' | 'n' | 'excludeOtherSeries'
> & {
  dimension: RAQIV2Dimension;
  n: number;
  excludeOtherSeries: boolean;
  orderByMetric?: RAQIV2Metric;
};

/** A {@link RankTopNConfig} whose rank ordering window is pinned to N days. */
export type PinnedRankTopNConfig = RankTopNConfig & { orderTimeRangeDays: number };

/**
 * Narrows configs whose rank ordering window is pinned to an explicit day count
 * rather than deferring to the query range.
 */
export const isPinnedRankTopNConfig = (config: RankTopNConfig): config is PinnedRankTopNConfig =>
  config.orderTimeRangeDays !== undefined && config.orderTimeRangeDays > 0;

export const topNPseudoDimensionToAceConfig = (
  config: TUIPseudoDimensionTopNBreakdownConfig,
): RankTopNConfig => ({
  n: config.n,
  dimension: config.filterAndBreakdownDimension,
  orderByMetric: config.orderConfig?.metric,
  orderFilters: config.orderConfig?.filters?.map(
    (filter): QueryFilter => ({
      dimension: filter.dimension,
      values: [...filter.values],
      operation: filter.operation,
    }),
  ),
  orderTimeRangeDays:
    config.limitTimeRange === 'query' ? undefined : config.limitTimeRange.previousDays,
  excludeOtherSeries: !config.showOther,
});
