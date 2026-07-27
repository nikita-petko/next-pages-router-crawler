import type {
  BreakdownSpec,
  DimensionBreakdownSpec,
  MetricIdentity,
  QueryNodeConfig,
  RankSpec,
} from '@rbx/client-analytics-query-gateway/v1';
import { RankDirection } from '@rbx/client-analytics-query-gateway/v1';
import type { RAQIV2Dimension, RAQIV2Metric } from '@rbx/creator-hub-analytics-config';
import { isPinnedRankTopNConfig, type RankTopNConfig } from './topNPseudoDimensionToAceConfig';

/** `RANK_DIRECTION_INVALID` is a proto placeholder and is never emitted. */
type EmittedRankDirection = Exclude<RankDirection, typeof RankDirection.Invalid>;

type RankOrderByMetric = Omit<MetricIdentity, 'metric'> & { metric: RAQIV2Metric };

/**
 * The wire `RankSpec` with the fields Creator Hub always populates promoted to
 * required, so emitters cannot silently omit them.
 */
type EmittedRankSpec = Omit<RankSpec, 'direction' | 'n' | 'orderByMetric'> & {
  direction: EmittedRankDirection;
  n: number;
  orderByMetric?: RankOrderByMetric;
};

/**
 * `dimension` is deliberately `RAQIV2Dimension` rather than `TRAQIV2Dimension`:
 * pseudo-dimensions (`TopCountries`) must be resolved to their underlying API
 * dimension before a spec is built, and this narrowing is what makes an
 * unresolved one a compile error instead of a bad request.
 */
type RankDimensionBreakdownSpec = Omit<DimensionBreakdownSpec, 'dimension' | 'rank'> & {
  dimension: RAQIV2Dimension;
  rank?: EmittedRankSpec;
};

/**
 * A `BreakdownSpec` restricted to the dimension arm of the wire oneof. Derived
 * from the generated type so any field added upstream shows up here, while the
 * two arms we know about are pinned deliberately.
 */
export type RankBreakdownSpec = Omit<BreakdownSpec, 'dimensionBreakdown' | 'variant'> & {
  dimensionBreakdown: RankDimensionBreakdownSpec;
  /** Rank breakdowns never use the AFC-owned variant arm of the oneof. */
  variant?: never;
};

/**
 * `QueryNodeConfig` with `breakdownSpecs` narrowed to rank specs. The property
 * is replaced rather than intersected so reads see the narrowed element type.
 */
export type RankQueryNodeConfig = Omit<QueryNodeConfig, 'breakdownSpecs'> & {
  breakdownSpecs?: RankBreakdownSpec[];
};

/** Builds an unranked passthrough breakdown spec for a real API dimension. */
export const dimensionToRankBreakdownSpec = (dimension: RAQIV2Dimension): RankBreakdownSpec => ({
  dimensionBreakdown: { dimension },
});

export const topNConfigToRankBreakdownSpec = (topNConfig: RankTopNConfig): RankBreakdownSpec => ({
  dimensionBreakdown: {
    dimension: topNConfig.dimension,
    excludeOtherSeries: topNConfig.excludeOtherSeries,
    rank: {
      direction: RankDirection.Top,
      n: topNConfig.n,
      orderByMetric: topNConfig.orderByMetric ? { metric: topNConfig.orderByMetric } : undefined,
      orderFilters: topNConfig.orderFilters,
      // Omitting `orderTimeRange` lets ACE rank over the query range, which is
      // what an unpinned (`limitTimeRange: 'query'`) display config means.
      orderTimeRange: isPinnedRankTopNConfig(topNConfig)
        ? { trailingDays: { days: topNConfig.orderTimeRangeDays } }
        : undefined,
    },
  },
});
