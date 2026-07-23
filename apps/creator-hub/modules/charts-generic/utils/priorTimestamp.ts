import { RAQIV2MetricGranularity } from '@rbx/creator-hub-analytics-config';
import type { Timestamp } from '../charts/types/TimeSeriesTypes';
import { millisecondsInInterval } from './granularityUtils';

// NOTE(gperkins@ 20230131): exported to be able to generate matching test data more easily
const priorTimestamp = (cur: Timestamp, granularity: RAQIV2MetricGranularity): Timestamp => {
  switch (granularity) {
    case RAQIV2MetricGranularity.OneMonth: {
      // NOTE(shumingxu, 2025-04-01): This is a special case for the monthly alignment.
      // some months may have 28, 29, 30, or 31 days.
      const curDay = new Date(cur);
      curDay.setUTCMonth(curDay.getUTCMonth() - 1);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- ADHOC-cleanup - pre-existing tech debt surfaced by PR #13823 (proxy-module cleanup)
      return curDay.getTime() as Timestamp;
    }
    case RAQIV2MetricGranularity.OneWeek:
    case RAQIV2MetricGranularity.OneDay:
    case RAQIV2MetricGranularity.OneHour:
    case RAQIV2MetricGranularity.HalfHour:
    case RAQIV2MetricGranularity.OneMinute:
    case RAQIV2MetricGranularity.None: {
      const result = cur - millisecondsInInterval(granularity);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- ADHOC-cleanup - pre-existing tech debt surfaced by PR #13823 (proxy-module cleanup)
      return result as Timestamp;
    }
    default: {
      const exhaustiveCheck: never = granularity;
      throw new Error(`Unhandled metric granularity: ${String(exhaustiveCheck)}`);
    }
  }
};
export default priorTimestamp;
