import type {
  RAQIV2MetricGranularity,
  TRAQIV2Dimension,
  TRAQIV2UIMetric,
} from '@rbx/creator-hub-analytics-config';
import getGranularityOptionsForMetric, {
  GranularityOrdering,
} from '../chartConfigurator/getGranularityOptionsForMetric';
import type { GranularityConstraintRule } from '../types/RAQIV2PageConfig';
import type { TUIGranularity } from './seriesGranularities';

export type PageGranularityOption =
  | { granularity: RAQIV2MetricGranularity; isAllowed: true; isPartial: false }
  | { granularity: RAQIV2MetricGranularity; isAllowed: true; isPartial: true }
  | { granularity: RAQIV2MetricGranularity; isAllowed: false };

/**
 * Compute the union of allowed granularities across all metrics on a page,
 * annotating each with whether it is universally supported (`isPartial: false`)
 * or only supported by a subset of the page's charts (`isPartial: true`).
 *
 * When `configOptions` is provided (from `granularity.options` in the page
 * config), the result is intersected with those options to maintain backward
 * compatibility with pages that explicitly constrain granularity choices.
 *
 * `configConstraints` (from `granularity.constraints`) are forwarded to
 * `getGranularityOptionsForMetric`, which applies them with per-granularity
 * replacement semantics (a constrained granularity bypasses the date-range
 * matrix and is governed entirely by its rule list). Each metric therefore
 * returns its fully-resolved allowed set, and this function only needs to union
 * those sets and annotate partiality.
 */
const getPageGranularityOptions = ({
  metrics,
  startDate,
  endDate,
  breakdown,
  configOptions,
  configConstraints,
}: {
  metrics: readonly TRAQIV2UIMetric[];
  startDate: Date;
  endDate: Date;
  breakdown?: readonly TRAQIV2Dimension[];
  configOptions?: readonly TUIGranularity[];
  configConstraints?: Partial<Record<TUIGranularity, GranularityConstraintRule[]>>;
}): PageGranularityOption[] => {
  // Each metric's allowed granularities for the current range, already accounting
  // for any page-level `configConstraints`.
  const perMetricSupportedGranularities: ReadonlySet<RAQIV2MetricGranularity>[] = metrics.map(
    (metric) =>
      new Set(
        getGranularityOptionsForMetric({ metric, startDate, endDate, breakdown, configConstraints })
          .filter(({ isAllowed }) => isAllowed)
          .map(({ granularity }) => granularity),
      ),
  );

  // Union across metrics, then drop anything outside `configOptions`.
  const unionedGranularities = new Set(
    perMetricSupportedGranularities.flatMap((granularities) => [...granularities]),
  );

  return [...unionedGranularities]
    .filter((granularity) => !configOptions || configOptions.includes(granularity))
    .sort((a, b) => GranularityOrdering.indexOf(a) - GranularityOrdering.indexOf(b))
    .map((granularity): PageGranularityOption => {
      const supportedByAll = perMetricSupportedGranularities.every((granularities) =>
        granularities.has(granularity),
      );
      if (supportedByAll) {
        return { granularity, isAllowed: true as const, isPartial: false as const };
      }
      return { granularity, isAllowed: true as const, isPartial: true as const };
    });
};

export default getPageGranularityOptions;
