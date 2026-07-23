import { RAQIV2MetricGranularity } from '@rbx/creator-hub-analytics-config';

type TSeriesIntervalLength = RAQIV2MetricGranularity;

export enum SeriesIntervalAlignment {
  // The data points are aligned based on the start of each minute/hour/day/etc. in UTC
  UTC_Day = 'UTC_Day',
  UTC_Hour = 'UTC_Hour',
  UTC_Minute = 'UTC_Minute',

  // NOTE(gperkins@ 20240226): !!! This is very non-standard and should be avoided. !!!
  // The data points are aligned based on the start of each day (midnight) in CST
  CST_Day = 'CST_Day',

  // The data points are aligned to the end time of the request (to the second),
  // so in general they will be offset from the start of minute/hour/day/etc. in UTC
  EndTime = 'EndTime',

  // The data points are aligned to each week in UTC. For Druid these are always Monday midnight.
  UTC_Week = 'UTC_Week',

  // The data points are aligned to the start of each month in UTC.
  UTC_Month_FirstDay = 'UTC_Month_FirstDay',
}

/**
 * Examples (half-hourly granularity, assuming the end time of the request is 11:32):
 * An end time aligned retrospective half-hourly data point at 9:32 means:
 *  "aggregate of data from 9:02 to 9:32"
 * An end time aligned non-retrospective half-hourly data point at 9:32 would mean:
 *  "aggregate of data from 9:32 to 10:02"
 * A UTC_Hour aligned non-retrospective half-hourly data point could only be at at 9:30, and means:
 *  "aggregate of data from 9:30 to 10:00"
 *  ** (this is the general and most desirable case)
 * A UTC_Hour aligned retrospective half-hourly data point could only be at at 9:30, but would mean:
 *  "aggregate of data from 9:00 to 9:30"
 *
 * Examples (minutely granularity, assuming the end time of the request is 12:33:45):
 * An end time aligned retrospective minutely data point at 12:31:45 means:
 *  "aggregate of data from 12:30:45 to 12:31:45"
 * An end time aligned non-retrospective minutely data point at 12:31:45 would mean:
 *  "aggregate of data from 12:31:45 to 12:32:45"
 * A UTC_Minute aligned non-retrospective minutely data point could only be at at 12:31:00, and would mean:
 *  "aggregate of data from 12:31:00 to 12:32:00"
 * A UTC_Minute aligned retrospective minutely data point could only be at at 12:31:00, but would mean:
 *  "aggregate of data from 12:30:00 to 12:31:00"
 */
export type SeriesIntervalMeaning = {
  length: TSeriesIntervalLength;
  alignment: SeriesIntervalAlignment;
  isRetrospective?: boolean;
};

// Generally our time series are aligned to midnight or the start of each hour.
export const DailyTimeSeriesAlignedToUTCMidnight: SeriesIntervalMeaning = {
  length: RAQIV2MetricGranularity.OneDay,
  alignment: SeriesIntervalAlignment.UTC_Day,
};
export const HourlyTimeSeriesAlignedToTheHour: SeriesIntervalMeaning = {
  length: RAQIV2MetricGranularity.OneHour,
  alignment: SeriesIntervalAlignment.UTC_Hour,
};
export const ThirtyMinutelyTimeSeriesAlignedToTheHour: SeriesIntervalMeaning = {
  length: RAQIV2MetricGranularity.HalfHour,
  alignment: SeriesIntervalAlignment.UTC_Hour,
};
export const OneMinutelyTimeSeriesAlignedToTheMinute: SeriesIntervalMeaning = {
  length: RAQIV2MetricGranularity.OneMinute,
  alignment: SeriesIntervalAlignment.UTC_Minute,
};
export const WeeklyTimeSeriesAlignedToUTCMidnight: SeriesIntervalMeaning = {
  length: RAQIV2MetricGranularity.OneWeek,
  alignment: SeriesIntervalAlignment.UTC_Week,
};
export const MonthlyTimeSeriesAlignedToUTCFirstDayMidnight: SeriesIntervalMeaning = {
  length: RAQIV2MetricGranularity.OneMonth,
  alignment: SeriesIntervalAlignment.UTC_Month_FirstDay,
};

export const EntireRangeInterval: SeriesIntervalMeaning = {
  length: RAQIV2MetricGranularity.None,
  // This shouldn't matter, but it's closest to the EndTime alignment
  alignment: SeriesIntervalAlignment.EndTime,
};

type TVariableLengthGranularity = typeof RAQIV2MetricGranularity.None;
export const isVariableIntervalLength = (
  length: TSeriesIntervalLength,
): length is TVariableLengthGranularity => {
  switch (length) {
    case RAQIV2MetricGranularity.OneMonth:
      // NOTE(shumingxu, 2025-04-01): Ok but this isn't used anywhere??
      return true;
    case RAQIV2MetricGranularity.OneHour:
    case RAQIV2MetricGranularity.HalfHour:
    case RAQIV2MetricGranularity.OneMinute:
    case RAQIV2MetricGranularity.OneDay:
    case RAQIV2MetricGranularity.OneWeek:
      // Generally. Let's ignore leap seconds.
      return false;

    case RAQIV2MetricGranularity.None:
      return true;

    default: {
      const exhaustiveCheck: never = length;
      throw new Error(`Unhandled metric granularity ${exhaustiveCheck}`);
    }
  }
};

const millisInMinute = 60 * 1000;
const millisInHour = 60 * 60 * 1000;
const millisInDay = 24 * millisInHour;
export const millisecondsInInterval = (seriesIntervalMeaning: SeriesIntervalMeaning): number => {
  const { length } = seriesIntervalMeaning;
  switch (length) {
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
      return millisInDay * 30;
    case RAQIV2MetricGranularity.None:
      // NOTE(gperkins@ 20240226): Monthly would also have this problem if we added it.
      throw new Error('Ungrouped data points represent variable length intervals.');
    default: {
      const exhaustiveCheck: never = length;
      throw new Error(`Unhandled metric granularity ${exhaustiveCheck}`);
    }
  }
};

/**
 * Determines if comparison series should align with the start of the main series.
 * This ensures time-based comparisons (below daily granularity) have matching timestamps.
 * Example: Comparing 4:30 PM on the 1st with 4:30 PM on the 7th
 */
export const shouldAlignComparisonSeriesEndWithMainSeriesStart = (
  seriesIntervalMeaning: SeriesIntervalMeaning,
): boolean => {
  switch (seriesIntervalMeaning.length) {
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
      const exhaustiveCheck: never = seriesIntervalMeaning.length;
      throw new Error(`Unhandled metric granularity ${exhaustiveCheck}`);
    }
  }
};
