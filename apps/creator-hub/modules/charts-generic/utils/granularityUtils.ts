import { RAQIV2MetricGranularity } from '@rbx/creator-hub-analytics-config';

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
 * Determines if comparison series should align with the start of the main series.
 * This ensures time-based comparisons (below daily granularity) have matching timestamps.
 * Example: Comparing 4:30 PM on the 1st with 4:30 PM on the 7th
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
