import { RAQIV2MetricGranularity } from '@rbx/creator-hub-analytics-config';

export type SeriesIntervalMeaning = RAQIV2MetricGranularity;

export const DailyTimeSeriesAlignedToUTCMidnight = RAQIV2MetricGranularity.OneDay;
export const HourlyTimeSeriesAlignedToUTCHour = RAQIV2MetricGranularity.OneHour;
export const MonthlyTimeSeriesAlignedToUTCMonth = RAQIV2MetricGranularity.OneMonth;
export const WeeklyTimeSeriesAlignedToUTCWeek = RAQIV2MetricGranularity.OneWeek;

export {
  millisecondsInInterval,
  shouldAlignComparisonSeriesEndWithMainSeriesStart,
} from '../utils/granularityUtils';
