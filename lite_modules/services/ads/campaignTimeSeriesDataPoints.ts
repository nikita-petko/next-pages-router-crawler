import { QueryResult } from '@rbx/client-analytics-query-gateway/v1';

import { CampaignTimeSeriesDataPoints } from '@type/timeSeries';

const DIMENSION_ATTRIBUTION_DATE_HOUR = 'AttributionDateHour';

const addDataPointsToDailyTotals = (
  totalsByDay: Map<number, number>,
  dataPoints: NonNullable<NonNullable<QueryResult['values']>[number]['dataPoints']>,
): void => {
  dataPoints.forEach((dataPoint) => {
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
};

const getAttributionDayTimestamp = (
  series: NonNullable<QueryResult['values']>[number],
): number | undefined => {
  const rawAttributionTime = series.breakdownValue?.find(
    ({ dimension }) => dimension === DIMENSION_ATTRIBUTION_DATE_HOUR,
  )?.value;
  if (!rawAttributionTime) {
    return undefined;
  }
  const numericTimestamp = Number(rawAttributionTime);
  const attributionTimestamp = Number.isFinite(numericTimestamp)
    ? numericTimestamp
    : Date.parse(rawAttributionTime);
  if (!Number.isFinite(attributionTimestamp)) {
    return undefined;
  }
  return Date.parse(new Date(attributionTimestamp).toISOString().slice(0, 10));
};

const addSeriesToDailyTotals = (
  totalsByDay: Map<number, number>,
  series: NonNullable<QueryResult['values']>[number],
): void => {
  const attributionDayTimestamp = getAttributionDayTimestamp(series);
  if (attributionDayTimestamp === undefined) {
    addDataPointsToDailyTotals(totalsByDay, series.dataPoints ?? []);
    return;
  }
  const values = (series.dataPoints ?? [])
    .map(({ value }) => value)
    .filter((value): value is number => value !== null && value !== undefined);
  if (!values.length) {
    return;
  }
  const total = values.reduce((sum, value) => sum + value, 0);
  totalsByDay.set(attributionDayTimestamp, (totalsByDay.get(attributionDayTimestamp) ?? 0) + total);
};

const dailyTotalsToDataPoints = (totalsByDay: Map<number, number>): CampaignTimeSeriesDataPoints =>
  Array.from(totalsByDay.entries())
    .sort(([dayA], [dayB]) => dayA - dayB)
    .map(([timestamp, total]) => [timestamp, total]);

/**
 * With AttributionDateHour breakdown, RAQI returns one values[] row per attribution-hour
 * bucket. Each row can carry conversion-day data points up to 30 days after the
 * attribution hour. Sum those values into the originating attribution day so
 * delayed conversions do not move chart points outside the selected range.
 */
export const aggregateQueryResultToDailyDataPoints = (
  queryResult: QueryResult,
): CampaignTimeSeriesDataPoints => {
  const totalsByDay = new Map<number, number>();

  (queryResult.values ?? []).forEach((series) => addSeriesToDailyTotals(totalsByDay, series));

  return dailyTotalsToDataPoints(totalsByDay);
};

/**
 * Converts a non-additive daily metric response without combining values.
 * Direct ratios such as ROAS must never be summed or averaged. Null values are
 * retained so the chart can distinguish an unavailable bucket from a real 0.
 */
export const queryResultToDailyDirectDataPoints = (
  queryResult: QueryResult,
): CampaignTimeSeriesDataPoints => {
  const valuesByDay = new Map<number, number | null>();
  (queryResult.values ?? []).forEach((series) => {
    (series.dataPoints ?? []).forEach((dataPoint) => {
      if (!dataPoint.time) {
        return;
      }
      const dayTimestamp = Date.parse(dataPoint.time.slice(0, 10));
      if (Number.isNaN(dayTimestamp)) {
        return;
      }
      if (valuesByDay.has(dayTimestamp)) {
        throw new Error(
          `analytics-query-gateway: duplicate direct metric value for ${dataPoint.time.slice(0, 10)}`,
        );
      }
      valuesByDay.set(dayTimestamp, dataPoint.value ?? null);
    });
  });

  return Array.from(valuesByDay.entries()).sort(([dayA], [dayB]) => dayA - dayB);
};
