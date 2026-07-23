import { RAQIV2MetricGranularity } from '@rbx/creator-hub-analytics-config';

const millisInMinute = 60 * 1000;
const millisInHour = 60 * 60 * 1000;
const millisInDay = 24 * millisInHour;
const getTimeSpan = (granularity: RAQIV2MetricGranularity): number | null => {
  // return time in miliseconds based on granularity
  switch (granularity) {
    case RAQIV2MetricGranularity.None:
      return null;
    case RAQIV2MetricGranularity.OneMinute:
      return millisInMinute;
    case RAQIV2MetricGranularity.HalfHour:
      return millisInMinute * 30;
    case RAQIV2MetricGranularity.OneHour:
      return millisInHour;
    case RAQIV2MetricGranularity.OneDay:
      return millisInDay;
    case RAQIV2MetricGranularity.OneWeek:
      return millisInDay * 7;
    case RAQIV2MetricGranularity.OneMonth:
      return null;
    default: {
      const exhaustiveCheck: never = granularity;
      throw new Error(`Unhandled granularity: ${exhaustiveCheck}`);
    }
  }
};

const snapToLatest = (
  timestamp: Date,
  granularity: RAQIV2MetricGranularity,
  options: {
    snapToNext: boolean;
  },
) => {
  const timespan = getTimeSpan(granularity);
  if (!timespan) return timestamp;
  const timestampMillis = timestamp.getTime();
  const remainder = timestampMillis % timespan;
  const snappedTimestamp = new Date(timestampMillis - remainder);
  if (options.snapToNext) {
    // if we're snapping to the next time step, we need to add the time span to the snapped timestamp
    snappedTimestamp.setTime(snappedTimestamp.getTime() + timespan);
  }
  return snappedTimestamp;
};

// Note that this assumes UTC midnight data points for daily and longer granularities
const snapToLatestTimestep = (timestamp: Date, granularity: RAQIV2MetricGranularity) => {
  switch (granularity) {
    case RAQIV2MetricGranularity.OneMonth: {
      // align to first day of the month
      const curDay = new Date(timestamp);
      curDay.setUTCDate(1);
      curDay.setUTCHours(0, 0, 0, 0);
      return curDay;
    }
    case RAQIV2MetricGranularity.OneWeek: {
      // align to most recent past monday that has already passed.
      const curDay = new Date(timestamp);
      const dayOfWeek = curDay.getUTCDay(); // 0 for Sunday, 1 for Monday, 2 for Tuesday, etc.
      const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // if it's sunday, we need to go back 6 days, otherwise we go back the day of the week minus 1
      curDay.setUTCDate(curDay.getUTCDate() - diff);
      curDay.setUTCHours(0, 0, 0, 0);
      return curDay;
    }
    case RAQIV2MetricGranularity.None:
    case RAQIV2MetricGranularity.OneMinute:
    case RAQIV2MetricGranularity.HalfHour:
    case RAQIV2MetricGranularity.OneHour:
    case RAQIV2MetricGranularity.OneDay: {
      return snapToLatest(timestamp, granularity, { snapToNext: false });
    }
    default: {
      const exhaustiveCheck: never = granularity;
      throw new Error(`Unhandled granularity: ${exhaustiveCheck}`);
    }
  }
};

// Note that this assumes UTC midnight data points for daily and longer granularities
export const snapToLatestEndTime = (
  timestamp: Date,
  granularity: RAQIV2MetricGranularity,
  options: {
    snapToNext: boolean;
  } = {
    snapToNext: false,
  },
) => {
  switch (granularity) {
    case RAQIV2MetricGranularity.OneMonth: {
      // Get the year and month from the input date
      const year = timestamp.getFullYear();
      const month = timestamp.getMonth(); // 0-indexed (0 for January, 11 for December)

      // Create a new Date object for the 0th day of the *next* month.
      // The Date constructor interprets day 0 as the last day of the *previous* month.
      // So, (month + 1) with day 0 gives the last day of the current 'month'.
      const lastDayOfCurrentMonth = new Date(year, month + 1, 0);
      return lastDayOfCurrentMonth;
    }
    case RAQIV2MetricGranularity.OneWeek: {
      // align to the upcoming Sunday
      const curDay = new Date(timestamp);
      const dayOfWeek = curDay.getUTCDay(); // 0 for Sunday, 1 for Monday, 2 for Tuesday, etc.
      const diff = dayOfWeek === 0 ? 0 : 7 - dayOfWeek; // if it's sunday, do nothing, otherwise we go foward to 7 minus day of the week
      curDay.setUTCDate(curDay.getUTCDate() + diff);
      curDay.setUTCHours(0, 0, 0, 0);
      return curDay;
    }
    case RAQIV2MetricGranularity.None:
    case RAQIV2MetricGranularity.OneMinute:
    case RAQIV2MetricGranularity.HalfHour:
    case RAQIV2MetricGranularity.OneHour:
    case RAQIV2MetricGranularity.OneDay: {
      return snapToLatest(timestamp, granularity, options);
    }
    default: {
      const exhaustiveCheck: never = granularity;
      throw new Error(`Unhandled granularity: ${exhaustiveCheck}`);
    }
  }
};

export const snapToLatestStartTime = snapToLatestTimestep;

/**
 * @deprecated -- use snapToLatestEndTime or snapToLatestStartTime according to your use case
 */
export default snapToLatestTimestep;
