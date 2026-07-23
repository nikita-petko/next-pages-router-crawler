import { RAQIV2DateRangeType, RAQIV2MetricGranularity } from '@rbx/creator-hub-analytics-config';
import { snapToLatestStartTime } from '@modules/experience-analytics-shared/utils/snapToLatestTimestep';
import { DEFAULT_AGGREGATION_DURATION_MS } from './constants';

const DAY_MS = 24 * 60 * 60 * 1000;
const COMPLETE_DAY_DATA_LAG_MS = 2 * DAY_MS;

export default function getManagedPricingAnalyticsTimeSpec(
  aggregationDurationMs = DEFAULT_AGGREGATION_DURATION_MS,
  now = new Date(),
) {
  const endTime = snapToLatestStartTime(
    new Date(now.getTime() - COMPLETE_DAY_DATA_LAG_MS),
    RAQIV2MetricGranularity.OneDay,
  );
  const startTime = snapToLatestStartTime(
    new Date(endTime.getTime() - aggregationDurationMs),
    RAQIV2MetricGranularity.OneDay,
  );

  return {
    rangeType: RAQIV2DateRangeType.Custom,
    startTime,
    endTime,
  };
}
