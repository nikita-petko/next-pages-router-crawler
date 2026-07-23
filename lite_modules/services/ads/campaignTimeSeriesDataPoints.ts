import { QueryResult } from '@rbx/client-analytics-query-gateway/v1';

import { CampaignTimeSeriesDataPoints } from '@type/timeSeries';

/**
 * With AttributionDateHour breakdown, RAQI returns one values[] row per attribution-hour
 * bucket. Each row carries dataPoints for days that bucket has activity. Flattening all
 * rows leaves duplicate timestamps; truncating each timestamp to its UTC day and summing
 * yields one total per day for the chart, even if RAQI ever returns sub-daily buckets.
 */
export const aggregateQueryResultToDailyDataPoints = (
  queryResult: QueryResult,
): CampaignTimeSeriesDataPoints => {
  const totalsByDay = new Map<number, number>();

  (queryResult.values ?? [])
    .flatMap((series) => series.dataPoints ?? [])
    .forEach((dataPoint) => {
      if (!dataPoint.time) {
        return;
      }

      const dayTimestamp = Date.parse(dataPoint.time.slice(0, 10));
      if (Number.isNaN(dayTimestamp)) {
        return;
      }

      const { value } = dataPoint;
      if (value === null || value === undefined) {
        return;
      }

      totalsByDay.set(dayTimestamp, (totalsByDay.get(dayTimestamp) ?? 0) + value);
    });

  return Array.from(totalsByDay.entries())
    .sort(([dayA], [dayB]) => dayA - dayB)
    .map(([timestamp, total]) => [timestamp, total]);
};
