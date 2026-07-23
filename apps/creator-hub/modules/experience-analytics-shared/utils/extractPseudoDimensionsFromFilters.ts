import {
  RAQIV2AggregationType,
  RAQIV2PercentileType,
  RAQIV2UIPseudoDimension,
} from '@rbx/creator-hub-analytics-config';
import type { TRAQIV2UIMetricFanoutDimensionValues } from '@rbx/creator-hub-analytics-config';
import type {
  QueryFilter as RAQIV2APIQueryFilter,
  TQueryFilter as RAQIV2QueryFilter,
} from '@modules/clients/analytics/analyticsRAQIShared';
import { isValidEnumValue } from '@modules/miscellaneous/utils/enumUtils';

export type PseudoDimensionExtractionResult = {
  /**
   * Fanout pseudo-dimension selections found in the filter list.
   * Individual fields are `null` when the corresponding pseudo-dimension
   * was not present (or had an invalid value). Use
   * {@link hasPseudoDimensionValues} for a quick "anything found?" check.
   */
  pseudoDimensionValues: TRAQIV2UIMetricFanoutDimensionValues;
  /**
   * The input filter list with all metric-fanout pseudo-dimension filters
   * removed. Preserves ordering of the remaining filters.
   *
   * Typed as `RAQIV2APIQueryFilter` (the non-UI variant) because the
   * function structurally strips every `UIQueryFilter` branch — what is
   * left is, by construction, the real-filter branch of `RAQIV2QueryFilter`.
   * `CustomEventName` is intentionally preserved here; callers that treat
   * it as source identity strip it separately.
   */
  realFilters: RAQIV2APIQueryFilter[];
};

/**
 * Scans a heterogeneous filter list and separates metric-fanout
 * pseudo-dimension selections (`AggregationType`, `PercentileType`) from
 * real query filters.
 *
 * Pseudo-dimensions look like ordinary query filters in URL state and
 * persisted payloads, but ACE does not recognize them as real dimensions.
 * Call sites that hand filters off to ACE must partition them with this
 * helper so that (a) UI-metric resolution can see the fanout selections,
 * and (b) the fanout filters do not leak into ACE query nodes.
 *
 * Only the first value of each fanout filter is honored. Values that fail
 * enum validation are dropped silently.
 */
const extractPseudoDimensionsFromFilters = (
  filters: readonly RAQIV2QueryFilter[] | undefined,
): PseudoDimensionExtractionResult => {
  const realFilters: RAQIV2APIQueryFilter[] = [];
  let aggregationType: RAQIV2AggregationType | null = null;
  let percentile: RAQIV2PercentileType | null = null;

  filters?.forEach((filter) => {
    if (
      filter.dimension !== RAQIV2UIPseudoDimension.AggregationType &&
      filter.dimension !== RAQIV2UIPseudoDimension.PercentileType
    ) {
      // After ruling out the UIQueryFilter branches above, the discriminated
      // union narrows to the non-UI `QueryFilter` variant (RAQIV2APIQueryFilter).
      // Note: TopN / LatestPlaceVersion / other non-fanout UI pseudo-dimensions
      // cannot reach this point at the type level — `UIQueryFilter` only
      // includes the two MetricFanout literals — so we don't try to filter
      // them out here. Off-spec runtime input would propagate downstream the
      // same way the previous version of this code propagated it.
      realFilters.push(filter);
      return;
    }
    // Honor only the first value. Fanout pseudo-dimensions select a single
    // variant at a call site: the chart toolbar exposes a single-select
    // AggregationType / PercentileType picker, and multi-column tables
    // (e.g. Experience Insights) express "several variants side-by-side"
    // by instantiating one MetricLike per column with its own filter set,
    // not by stuffing multiple values into one filter. Extra values would
    // be ambiguous here — we cannot produce more than one resolved API
    // metric from a single source — so we deliberately drop them.
    const firstValue = filter.values[0];
    if (!firstValue) {
      return;
    }
    if (
      filter.dimension === RAQIV2UIPseudoDimension.AggregationType &&
      isValidEnumValue(RAQIV2AggregationType, firstValue)
    ) {
      aggregationType = firstValue;
    } else if (
      filter.dimension === RAQIV2UIPseudoDimension.PercentileType &&
      isValidEnumValue(RAQIV2PercentileType, firstValue)
    ) {
      percentile = firstValue;
    }
  });

  return {
    pseudoDimensionValues: { aggregationType, percentile },
    realFilters,
  };
};

/**
 * Returns `true` when at least one fanout pseudo-dimension selection is
 * present in `values`.
 */
export const hasPseudoDimensionValues = (values: TRAQIV2UIMetricFanoutDimensionValues): boolean =>
  values.aggregationType !== null || values.percentile !== null;

export default extractPseudoDimensionsFromFilters;
