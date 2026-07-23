import {
  RAQIV2MetricGranularity,
  TRAQIV2Dimension,
  TRAQIV2UIMetric,
} from '@rbx/creator-hub-analytics-config';
import getGranularityOptionsForMetric, {
  GranularityOrdering,
} from '../exploreMode/getGranularityOptionsForMetric';
import { TUIGranularity } from './seriesGranularities';

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
 */
const getPageGranularityOptions = ({
  metrics,
  startDate,
  endDate,
  breakdown,
  configOptions,
}: {
  metrics: readonly TRAQIV2UIMetric[];
  startDate: Date;
  endDate: Date;
  breakdown?: readonly TRAQIV2Dimension[];
  configOptions?: readonly TUIGranularity[];
}): PageGranularityOption[] => {
  if (!metrics.length) {
    return [];
  }

  const perMetricAllowed: RAQIV2MetricGranularity[][] = metrics.map((metric) =>
    getGranularityOptionsForMetric({ metric, startDate, endDate, breakdown })
      .filter(({ isAllowed }) => isAllowed)
      .map((opt) => opt.granularity),
  );

  const allGranularities = new Set(perMetricAllowed.flat());

  const options: PageGranularityOption[] = [...allGranularities]
    .filter((g) => !configOptions || configOptions.includes(g))
    .sort((a, b) => GranularityOrdering.indexOf(a) - GranularityOrdering.indexOf(b))
    .map((granularity) => {
      const supportedByAll = perMetricAllowed.every((set) => set.includes(granularity));
      if (supportedByAll) {
        return { granularity, isAllowed: true as const, isPartial: false as const };
      }
      return { granularity, isAllowed: true as const, isPartial: true as const };
    });

  return options;
};

export default getPageGranularityOptions;
