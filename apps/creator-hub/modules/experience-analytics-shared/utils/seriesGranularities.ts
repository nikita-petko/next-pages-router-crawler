import { RAQIV2MetricGranularity } from '@rbx/creator-hub-analytics-config';

export enum LegacyPageGranularity {
  Daily = 'Daily',
  Hourly = 'Hourly',
  Minutely = 'Minutely',
  ThirtyMinutely = 'ThirtyMinutely',
}

export const UIIntervalGranularities = [
  RAQIV2MetricGranularity.OneMonth,
  RAQIV2MetricGranularity.OneWeek,
  RAQIV2MetricGranularity.OneDay,
  RAQIV2MetricGranularity.OneHour,
  RAQIV2MetricGranularity.HalfHour,
  RAQIV2MetricGranularity.OneMinute,
] as const;
export type TUIIntervalGranularity = (typeof UIIntervalGranularities)[number];
export const UIGranularities = [...UIIntervalGranularities, RAQIV2MetricGranularity.None] as const;
export type TUIGranularity = RAQIV2MetricGranularity;

const granularityToMillisForDataPointEstimate: Record<
  Exclude<TUIGranularity, RAQIV2MetricGranularity.None>,
  number
> = {
  // NOTE(shumingxu, 2025-04-02): This is used to estimate the number of points in the series.
  // Note that monthly intervals are not necessarily 30 days.
  [RAQIV2MetricGranularity.OneMonth]: 30 * 24 * 60 * 60 * 1000,
  [RAQIV2MetricGranularity.OneWeek]: 7 * 24 * 60 * 60 * 1000,
  [RAQIV2MetricGranularity.OneDay]: 24 * 60 * 60 * 1000,
  [RAQIV2MetricGranularity.OneHour]: 60 * 60 * 1000,
  [RAQIV2MetricGranularity.HalfHour]: 30 * 60 * 1000,
  [RAQIV2MetricGranularity.OneMinute]: 60 * 1000,
};

const minVisiblePoints = 1;
// 1500 lets a full Last-1-Day range render at minutely granularity (1,440 points)
// instead of snapping up to half-hour, and also covers pages that opt a finer
// granularity into a longer range via `granularity.constraints` (e.g. messaging
// service: 24h at 1-minute granularity = 1440 points per series). As a side
// effect it slightly widens the granularity allow-list on medium ranges (e.g.
// half-hour is permitted up to ~31 days instead of ~21).
const maxVisiblePoints = 1500;

const getDurationMillis = ({ startDate, endDate }: { startDate: Date; endDate: Date }): number => {
  return Math.abs(endDate.getTime() - startDate.getTime());
};

const isAllowedGranularityByDataPointCount = (
  duration: number,
  granularity: TUIGranularity,
): boolean => {
  if (granularity === RAQIV2MetricGranularity.None) {
    return false;
  }
  const numPoints = duration / granularityToMillisForDataPointEstimate[granularity];
  return numPoints <= maxVisiblePoints && numPoints >= minVisiblePoints;
};

const isAllowedGranularityByDuration = (duration: number, granularity: TUIGranularity): boolean => {
  // We do not allow any granularity under weekly for queries that span more than 1 year
  if (duration > 365 * 24 * 60 * 60 * 1000) {
    return (
      granularity === RAQIV2MetricGranularity.OneWeek ||
      granularity === RAQIV2MetricGranularity.OneMonth
    );
  }
  return true;
};

const isAllowedGranularity = (duration: number, granularity: TUIGranularity): boolean => {
  return (
    isAllowedGranularityByDataPointCount(duration, granularity) &&
    isAllowedGranularityByDuration(duration, granularity)
  );
};

const granularitiesByDurationAscending = UIIntervalGranularities.map((granularity) => ({
  granularity,
  duration: granularityToMillisForDataPointEstimate[granularity],
})).sort((a, b) => a.duration - b.duration);

// Duration/point-count-based granularity filter. Kept as a private helper so
// metric-agnostic callers in this module (e.g. getClosestAllowedGranularity)
// can reuse it without tripping the deprecation lint on the public alias below.
const computeAllowedGranularities = ({
  startDate,
  endDate,
  granularities: givenGranularities,
}: {
  startDate: Date;
  endDate: Date;
  granularities: readonly TUIGranularity[];
}): TUIGranularity[] => {
  if (!givenGranularities.length) {
    return [];
  }

  const includesNone = givenGranularities.includes(RAQIV2MetricGranularity.None);
  const nonDurationGranularities = includesNone ? [RAQIV2MetricGranularity.None] : [];

  const duration = getDurationMillis({ startDate, endDate });
  const allowedGranularities = givenGranularities.filter((x) => isAllowedGranularity(duration, x));
  if (allowedGranularities.length) {
    return [...allowedGranularities, ...nonDurationGranularities];
  }

  const givenGranularitiesByDurationDescending = granularitiesByDurationAscending
    .filter(({ granularity }) => givenGranularities.includes(granularity))
    .sort((a, b) => b.duration - a.duration);

  const closestGranularity = givenGranularitiesByDurationDescending.length
    ? givenGranularitiesByDurationDescending[0].granularity
    : null;
  return closestGranularity
    ? [closestGranularity, ...nonDurationGranularities]
    : [...nonDurationGranularities];
};

/** @deprecated Use getPageGranularityOptions or getGranularityOptionsForMetric instead (DSA-5051). */
export const getAllowedGranularities = computeAllowedGranularities;

export const getClosestAllowedGranularity = ({
  startDate,
  endDate,
  granularity: givenGranularity,
  supportedGranularities,
}: {
  startDate: Date;
  endDate: Date;
  granularity: TUIGranularity;
  supportedGranularities?: readonly RAQIV2MetricGranularity[];
}): TUIGranularity => {
  if (
    // RAQIV2MetricGranularity.None is valid if it is in the supportedGranularities
    // or always valid if there are no specific supportedGranularities provided
    givenGranularity === RAQIV2MetricGranularity.None &&
    (!supportedGranularities || supportedGranularities?.includes(givenGranularity))
  ) {
    return givenGranularity;
  }

  const allowedGranularities = computeAllowedGranularities({
    startDate,
    endDate,
    granularities: UIIntervalGranularities.filter(
      (x) => supportedGranularities?.includes(x) ?? true,
    ),
  });

  // if there are no allowed granularities, return given
  if (!allowedGranularities.length) {
    return givenGranularity;
  }

  // if the given granularity is allowed, we return it
  if (allowedGranularities.includes(givenGranularity)) {
    return givenGranularity;
  }

  // if the given granularity is not allowed, we find its index in the list of all granularities
  const givenIdx = granularitiesByDurationAscending.findIndex(
    ({ granularity }) => granularity === givenGranularity,
  );
  // we look through the allowedGranularities and find the one whose index is closest to the givenIdx
  const closestIdx = allowedGranularities.reduce((acc, granularity) => {
    const idx = granularitiesByDurationAscending.findIndex(
      ({ granularity: allowedGranularity }) => allowedGranularity === granularity,
    );
    return Math.abs(idx - givenIdx) < Math.abs(acc - givenIdx) ? idx : acc;
  }, Infinity);
  return granularitiesByDurationAscending[closestIdx].granularity;
};

export const getSeriesDefaultGranularity = (startDate: Date, endDate: Date): TUIGranularity => {
  const duration = getDurationMillis({ startDate, endDate });
  const oneHour = 60 * 60 * 1000;
  if (duration <= oneHour) {
    return RAQIV2MetricGranularity.OneMinute;
  }
  const oneDay = 24 * 60 * 60 * 1000;
  if (duration <= 2 * oneDay) {
    return RAQIV2MetricGranularity.HalfHour;
  }
  if (duration >= 365 * oneDay) {
    return RAQIV2MetricGranularity.OneWeek;
  }
  return RAQIV2MetricGranularity.OneDay;
};
