import type { TopNConfig, QueryFilter } from '@rbx/client-analytics-query-gateway/v1';
import type { TUIPseudoDimensionTopNBreakdownConfig } from '@rbx/creator-hub-analytics-config';

export const topNPseudoDimensionToAceConfig = (
  config: TUIPseudoDimensionTopNBreakdownConfig,
): TopNConfig => ({
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
