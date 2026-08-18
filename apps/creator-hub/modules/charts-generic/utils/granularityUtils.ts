import { RAQIV2DateRangeType, RAQIV2MetricGranularity } from '@rbx/creator-hub-analytics-config';
import type { TExplicitTimeRangeSpec } from '../charts/types/ChartTypes';

const millisInMinute = 60 * 1000;
const millisInHour = 60 * 60 * 1000;
const millisInDay = 24 * millisInHour;

export const millisecondsInInterval = (granularity: RAQIV2MetricGranularity): number => {
  switch (granularity) {
    case RAQIV2MetricGranularity.OneHour:
      return millisInHour;
    case RAQIV2MetricGranularity.HalfHour:
      return millisInMinute * 30;
    case RAQIV2MetricGranularity.OneMinute:
      return millisInMinute;
    case RAQIV2MetricGranularity.OneDay:
      return millisInDay;
    case RAQIV2MetricGranularity.OneWeek:
      return millisInDay * 7;
    case RAQIV2MetricGranularity.OneMonth:
      // NOTE(gperkins@ 20240226): Monthly is variable length; this is a coarse approximation.
      return millisInDay * 30;
    case RAQIV2MetricGranularity.None:
      throw new Error('Ungrouped data points represent variable length intervals.');
    default: {
      const exhaustiveCheck: never = granularity;
      throw new Error(`Unhandled metric granularity ${String(exhaustiveCheck)}`);
    }
  }
};

/**
 * Whether a range type's bounds describe a duration rather than a set of whole
 * days. `Last1Hour` and `Last1Day` resolve to `end - 1 hour` and `end - 1 day`,
 * while `Last3Days` and everything longer resolve to `end - (n - 1) days` and so
 * include both endpoints. See `calculateDatesFromRangeType`.
 *
 * `Custom` is not a duration preset — its end-inclusiveness is decided from the
 * window itself in {@link getComparisonWindowGranularity}.
 *
 * Exhaustive so a new preset cannot silently inherit a one-day offset.
 */
const IS_HALF_OPEN_DATE_RANGE_TYPE: Record<RAQIV2DateRangeType, boolean> = {
  [RAQIV2DateRangeType.Last1Hour]: true,
  [RAQIV2DateRangeType.Last1Day]: true,
  [RAQIV2DateRangeType.Last3Days]: false,
  [RAQIV2DateRangeType.Last7Days]: false,
  [RAQIV2DateRangeType.Last28Days]: false,
  [RAQIV2DateRangeType.Last56Days]: false,
  [RAQIV2DateRangeType.Last90Days]: false,
  [RAQIV2DateRangeType.Custom]: false,
};

const isUtcMidnight = (time: Date): boolean =>
  time.getUTCHours() === 0 &&
  time.getUTCMinutes() === 0 &&
  time.getUTCSeconds() === 0 &&
  time.getUTCMilliseconds() === 0;

/**
 * `Custom` windows from the picker are UTC-midnight day ranges. The same
 * `rangeType` also arrives from raw epoch-ms query params with no midnight
 * normalization, including hour-wide explore-mode zooms. Those must abut like
 * `Last1Hour`, not inherit a one-day gap larger than the window itself.
 */
const isEndInclusiveCustomWindow = (startTime: Date, endTime: Date): boolean => {
  const durationMs = endTime.getTime() - startTime.getTime();
  return durationMs >= millisInDay || (isUtcMidnight(startTime) && isUtcMidnight(endTime));
};

/**
 * The granularity that defines a spec's comparison window.
 *
 * A bucketed query steps its comparison window back by one bucket. `None` has no
 * bucket of its own, so the step comes from the range instead: half-open ranges
 * abut exactly, while day-granular ranges include both endpoints and need a full
 * day of separation to stop the previous period overlapping the current one.
 *
 * Half-open presets (`Last1Hour`, `Last1Day`) always abut. End-inclusiveness is
 * a property of the range, not of the data's grain, so `snapGranularity` is
 * consulted only after that classification — specs that already know the grain
 * behind an end-inclusive cumulative query (item analytics, experimentation)
 * can still declare it there.
 *
 * `Custom` is classified from the window: UTC-midnight bounds or a span of at
 * least a day are treated as end-inclusive; shorter unaligned windows abut.
 *
 * `rangeType` must be the preset the window was derived from. Snapping rewrites
 * start/end but must not collapse the type to `Custom`, or Last1Hour/Last1Day
 * would look end-inclusive on the fetch path.
 *
 * Resolving the grain here also keeps `None` away from
 * {@link millisecondsInInterval}, which has no interval to report for it.
 */
export const getComparisonWindowGranularity = (
  granularity: RAQIV2MetricGranularity,
  timeSpec: Pick<TExplicitTimeRangeSpec, 'startTime' | 'endTime' | 'rangeType' | 'snapGranularity'>,
): RAQIV2MetricGranularity => {
  if (granularity !== RAQIV2MetricGranularity.None) {
    return granularity;
  }
  if (IS_HALF_OPEN_DATE_RANGE_TYPE[timeSpec.rangeType]) {
    return RAQIV2MetricGranularity.None;
  }
  if (
    timeSpec.rangeType === RAQIV2DateRangeType.Custom &&
    !isEndInclusiveCustomWindow(timeSpec.startTime, timeSpec.endTime)
  ) {
    return RAQIV2MetricGranularity.None;
  }
  if (timeSpec.snapGranularity) {
    return timeSpec.snapGranularity;
  }
  return RAQIV2MetricGranularity.OneDay;
};

/**
 * Determines if the comparison window abuts the start of the main window rather
 * than sitting one whole bucket behind it.
 *
 * Sub-daily granularities use a zero offset so consecutive windows share
 * timestamps — 4:30 PM on the 1st against 4:30 PM on the 7th. They appear on
 * half-open presets and on `Custom` hour-scale windows. Day-and-coarser
 * granularities sit one bucket behind because those windows include both
 * endpoints.
 *
 * `None` reaching this point means no grain could be resolved for a cumulative
 * query, which only happens on a half-open range; see
 * {@link getComparisonWindowGranularity}.
 */
export const shouldAlignComparisonSeriesEndWithMainSeriesStart = (
  granularity: RAQIV2MetricGranularity,
): boolean => {
  switch (granularity) {
    case RAQIV2MetricGranularity.OneWeek:
    case RAQIV2MetricGranularity.OneMonth:
    case RAQIV2MetricGranularity.OneDay:
      return false;
    case RAQIV2MetricGranularity.None:
    case RAQIV2MetricGranularity.OneHour:
    case RAQIV2MetricGranularity.HalfHour:
    case RAQIV2MetricGranularity.OneMinute:
      return true;
    default: {
      const exhaustiveCheck: never = granularity;
      throw new Error(`Unhandled metric granularity ${String(exhaustiveCheck)}`);
    }
  }
};
