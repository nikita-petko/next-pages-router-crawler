import {
  DailyTimeSeriesAlignedToUTCMidnight,
  EntireRangeInterval,
  HourlyTimeSeriesAlignedToTheHour,
  MonthlyTimeSeriesAlignedToUTCFirstDayMidnight,
  OneMinutelyTimeSeriesAlignedToTheMinute,
  SeriesIntervalMeaning,
  ThirtyMinutelyTimeSeriesAlignedToTheHour,
  WeeklyTimeSeriesAlignedToUTCMidnight,
} from '@modules/charts-generic';
import { RAQIV2MetricGranularity } from '@rbx/creator-hub-analytics-config';

const RAQIV2MetricGranularityToSeriesIntervalMeaning = (
  metricGranularity: RAQIV2MetricGranularity,
): SeriesIntervalMeaning => {
  switch (metricGranularity) {
    case RAQIV2MetricGranularity.OneMinute:
      return OneMinutelyTimeSeriesAlignedToTheMinute;
    case RAQIV2MetricGranularity.HalfHour:
      return ThirtyMinutelyTimeSeriesAlignedToTheHour;
    case RAQIV2MetricGranularity.OneHour:
      return HourlyTimeSeriesAlignedToTheHour;
    case RAQIV2MetricGranularity.OneDay:
      return DailyTimeSeriesAlignedToUTCMidnight;
    case RAQIV2MetricGranularity.OneWeek:
      return WeeklyTimeSeriesAlignedToUTCMidnight;
    case RAQIV2MetricGranularity.OneMonth:
      return MonthlyTimeSeriesAlignedToUTCFirstDayMidnight;
    case RAQIV2MetricGranularity.None:
      return EntireRangeInterval;
    default: {
      const exhaustiveCheck: never = metricGranularity;
      throw new Error(`Unhandled metric granularity ${exhaustiveCheck}`);
    }
  }
};

export default RAQIV2MetricGranularityToSeriesIntervalMeaning;
