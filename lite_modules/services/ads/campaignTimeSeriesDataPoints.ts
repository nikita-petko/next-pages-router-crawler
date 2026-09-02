import { QueryResult } from '@rbx/client-analytics-query-gateway/v1';

import {
  MS_PER_DAY,
  ROAS_MIN_SPEND_USD,
  ROAS_VALIDATED_MIN_AGE_DAYS,
} from '@services/ads/analyticsQueryBuilder';
import { CampaignTimeSeriesDataPoints } from '@type/timeSeries';
import { MicroUsdToUsd } from '@utils/currency';

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
 * Aggregate query result values into daily totals keyed by AttributionDateHour
 * so delayed conversions attach to their originating attribution day. Falls
 * back to dataPoint.time when the breakdown is absent.
 */
export const aggregateQueryResultToDailyDataPoints = (
  queryResult: QueryResult,
): CampaignTimeSeriesDataPoints => {
  const totalsByDay = new Map<number, number>();

  (queryResult.values ?? []).forEach((series) => {
    addSeriesToDailyTotals(totalsByDay, series);
  });

  return dailyTotalsToDataPoints(totalsByDay);
};

/**
 * Compose a per-attribution-day ROAS series from separately-aggregated revenue
 * (USD) and spend (micro-USD) totals.
 *
 * Attribution-day age gate: any day younger than `ROAS_VALIDATED_MIN_AGE_DAYS`
 * returns null so `mergeRoasPreferValidated` falls through to the ML
 * `AdsRoasEstimate`. Without this gate, open-window days would emit
 * understated validated ROAS (revenue keeps landing for 30 days after the
 * attribution day) which then suppresses the estimate — the exact bug the
 * scalar table cell avoids via `isValidatedRoasAvailable` at the source-
 * selection layer. Applying the gate per bucket is the chart analogue.
 *
 * Semantics per day (age gate first):
 * - attribution day too young (open window): null.
 * - spend missing: null (no denominator, can't compute).
 * - spend below `ROAS_MIN_SPEND_USD`: null (mirrors the cube-side min-spend
 *   gate on the scalar `AdsUARoas` measure so noisy low-sample buckets stay
 *   off the chart).
 * - spend present, revenue missing: 0 (real "we spent money and got no
 *   attributed conversions" day — only reachable for closed windows).
 * - both present: revenue / spendUsd.
 */
export const computeDailyRoasFromAggregates = (
  revenueUsdByDay: CampaignTimeSeriesDataPoints,
  spendMicroUsdByDay: CampaignTimeSeriesDataPoints,
  now: Date = new Date(),
): CampaignTimeSeriesDataPoints => {
  const spendByDay = new Map(spendMicroUsdByDay);
  const revenueByDay = new Map(revenueUsdByDay);
  const timestamps = new Set<number>([...spendByDay.keys(), ...revenueByDay.keys()]);
  const closedWindowCutoffMs = now.getTime() - ROAS_VALIDATED_MIN_AGE_DAYS * MS_PER_DAY;
  return Array.from(timestamps)
    .sort((a, b) => a - b)
    .map((ts): [number, number | null] => {
      if (ts > closedWindowCutoffMs) {
        return [ts, null];
      }
      const spendMicro = spendByDay.get(ts) ?? null;
      if (spendMicro === null) {
        return [ts, null];
      }
      const spendUsd = MicroUsdToUsd(spendMicro);
      if (spendUsd < ROAS_MIN_SPEND_USD) {
        return [ts, null];
      }
      const revenue = revenueByDay.get(ts) ?? 0;
      return [ts, revenue / spendUsd];
    });
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
