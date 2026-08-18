import { RAQIV2MetricGranularity } from '@rbx/creator-hub-analytics-config';
import type { TExplicitTimeRangeSpec } from '@modules/charts-generic/charts/types/ChartTypes';
import { DEFAULT_COMPARISON_CONFIG, type ComparisonRangePolicy } from '../types/ComparisonConfig';
import getComparisonRange, { type ComparisonRangeSpec } from './getComparisonRange';
import isComparisonRangeAllowed from './isComparisonRangeAllowed';
import { snapToLatestEndTime, snapToLatestStartTime } from './snapToLatestTimestep';

export type ChartLoadComparisonOptions = ComparisonRangeSpec & {
  rangePolicy?: ComparisonRangePolicy;
};

const MillisecondsPerMinute = 60 * 1000;
const MillisecondsPerHalfHour = 30 * MillisecondsPerMinute;
const MillisecondsPerHour = 60 * MillisecondsPerMinute;
const MillisecondsPerDay = 24 * MillisecondsPerHour;
const MillisecondsPerWeek = 7 * MillisecondsPerDay;

const intervalDurations: Record<
  Exclude<RAQIV2MetricGranularity, RAQIV2MetricGranularity.None | RAQIV2MetricGranularity.OneMonth>,
  number
> = {
  [RAQIV2MetricGranularity.OneMinute]: MillisecondsPerMinute,
  [RAQIV2MetricGranularity.HalfHour]: MillisecondsPerHalfHour,
  [RAQIV2MetricGranularity.OneHour]: MillisecondsPerHour,
  [RAQIV2MetricGranularity.OneDay]: MillisecondsPerDay,
  [RAQIV2MetricGranularity.OneWeek]: MillisecondsPerWeek,
};

const countMonths = (startTime: Date, endTime: Date): number =>
  (endTime.getUTCFullYear() - startTime.getUTCFullYear()) * 12 +
  endTime.getUTCMonth() -
  startTime.getUTCMonth() +
  1;

const countDataPoints = (
  timeSpec: TExplicitTimeRangeSpec,
  granularity: RAQIV2MetricGranularity,
): number => {
  if (granularity === RAQIV2MetricGranularity.None) {
    return 1;
  }

  const snapGranularity = timeSpec.snapGranularity ?? granularity;
  const startTime = snapToLatestStartTime(timeSpec.startTime, snapGranularity);
  const endTime = snapToLatestEndTime(timeSpec.endTime, snapGranularity);
  if (endTime.getTime() < startTime.getTime()) {
    return 0;
  }

  if (granularity === RAQIV2MetricGranularity.OneMonth) {
    return countMonths(startTime, endTime);
  }

  const intervalDuration = intervalDurations[granularity];

  return Math.floor((endTime.getTime() - startTime.getTime()) / intervalDuration) + 1;
};

/**
 * Counts requested time buckets, not returned rows or breakdown series. This keeps the event
 * independent of server-side fanout while matching the query windows that are sent to RAQI.
 */
const getExpectedChartDataPoints = ({
  timeSpecs,
  granularity,
  comparison,
}: {
  timeSpecs: readonly TExplicitTimeRangeSpec[];
  granularity: RAQIV2MetricGranularity;
  comparison?: ChartLoadComparisonOptions;
}): number => {
  const primaryPoints = timeSpecs.reduce(
    (total, timeSpec) => total + countDataPoints(timeSpec, granularity),
    0,
  );

  const firstTimeSpec = timeSpecs[0];
  if (
    comparison === undefined ||
    firstTimeSpec === undefined ||
    !isComparisonRangeAllowed(
      firstTimeSpec,
      comparison.rangePolicy ?? DEFAULT_COMPARISON_CONFIG.rangePolicy,
    )
  ) {
    return primaryPoints;
  }

  const comparisonPoints = timeSpecs.reduce((total, timeSpec) => {
    const snapGranularity = timeSpec.snapGranularity ?? granularity;
    const startTime = snapToLatestStartTime(timeSpec.startTime, snapGranularity);
    const endTime = snapToLatestEndTime(timeSpec.endTime, snapGranularity);
    const { comparisonStartDate, comparisonEndDate } = getComparisonRange(
      {
        ...timeSpec,
        startTime,
        endTime,
      },
      comparison.granularity,
      comparison.relativeOffset,
      comparison.customStartDate,
    );
    return (
      total +
      countDataPoints(
        {
          ...timeSpec,
          startTime: comparisonStartDate,
          endTime: comparisonEndDate,
          snapGranularity: granularity,
        },
        granularity,
      )
    );
  }, 0);

  return primaryPoints + comparisonPoints;
};

export default getExpectedChartDataPoints;
