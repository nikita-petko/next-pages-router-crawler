import { Timestamp } from '../charts/types/TimeSeriesTypes';
import {
  SeriesIntervalAlignment,
  SeriesIntervalMeaning,
  millisecondsInInterval,
} from '../enums/SeriesIntervalMeaning';

// NOTE(gperkins@ 20230131): exported to be able to generate matching test data more easily
const priorTimestamp = (
  cur: Timestamp,
  seriesIntervalMeaning: SeriesIntervalMeaning,
): Timestamp => {
  const { alignment } = seriesIntervalMeaning;
  switch (alignment) {
    case SeriesIntervalAlignment.UTC_Month_FirstDay: {
      // NOTE(shumingxu, 2025-04-01): This is a special case for the monthly alignment.
      // some months may have 28, 29, 30, or 31 days.
      const curDay = new Date(cur);
      curDay.setUTCMonth(curDay.getUTCMonth() - 1);
      return curDay.getTime() as Timestamp;
    }
    case SeriesIntervalAlignment.UTC_Week:
    case SeriesIntervalAlignment.UTC_Day:
    case SeriesIntervalAlignment.UTC_Hour:
    case SeriesIntervalAlignment.UTC_Minute:
    case SeriesIntervalAlignment.CST_Day:
    case SeriesIntervalAlignment.EndTime: {
      const result = cur - millisecondsInInterval(seriesIntervalMeaning);
      return result as Timestamp;
    }
    default: {
      const exhaustiveCheck: never = alignment;
      throw new Error(`Unhandled alignment: ${exhaustiveCheck}`);
    }
  }
};
export default priorTimestamp;
