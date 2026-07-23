// NOTE(shumingxu, 11/16/2023): Copied over from experienceAnalyticsSummaryAdapters.
// Going to slowly consolidate our generic RAQI adapters
import { RAQIResponse, RAQIMetricValue } from '@modules/clients/analytics';
import { ingestRAQIMetricValues, type SeriesDataPoints } from './genericRAQIChartAdapter';
import type {
  SplineChartTimeseriesDataPoint,
  Timestamp,
  Value,
} from '../charts/types/TimeSeriesSplineChartTypes';
import { getComparisonChipSpec } from '../utils/comparisonChipUtils';

const convertSeriesDataPointsToSplineChartTimeseriesDataPoints = (
  dataPoints: SeriesDataPoints,
  timestamps: Array<Timestamp>,
): Array<SplineChartTimeseriesDataPoint> => {
  return timestamps.map((timestamp) => {
    const given = dataPoints.get(timestamp);
    const value = given === null ? null : ((given ?? 0) as Value);
    return [timestamp, value] as SplineChartTimeseriesDataPoint;
  });
};

const getValidSortedSplineChartTimeseriesDatapoints = (
  dataPoints: Array<SplineChartTimeseriesDataPoint>,
): Array<SplineChartTimeseriesDataPoint> => {
  // sort timestamps from latest -> earliest
  const latestFirst = Array.from(dataPoints.values()).sort((a, b) => b[0] - a[0]);

  // find most recent timestamp that has valid data
  const latestValidTimestamp = latestFirst.findIndex((dataPoint) => {
    const value = dataPoint[1];
    return value !== null && value !== 0;
  });

  // if there is no valid data
  if (latestValidTimestamp === -1) return [];

  // return only valid timestamps that have corresponding data
  return latestFirst.slice(latestValidTimestamp);
};

const getTimeSeriesSummary = (
  totalDatapoints: SeriesDataPoints | undefined,
  allTimestamps: Set<Timestamp>,
): null | {
  sum: number;
  count: number;
} => {
  if (!totalDatapoints) return null;
  const dataPoints = convertSeriesDataPointsToSplineChartTimeseriesDataPoints(
    totalDatapoints,
    Array.from(allTimestamps.values()),
  );
  const validDataPoints = getValidSortedSplineChartTimeseriesDatapoints(dataPoints);
  if (validDataPoints.length === 0) return null;

  const sum = validDataPoints.reduce((acc, dataPoint) => {
    const given = dataPoint[1];
    return acc + (given ?? 0);
  }, 0);

  return {
    sum,
    count: validDataPoints.length,
  };
};

const getTimeSeriesSum = (
  totalDatapoints: SeriesDataPoints | undefined,
  allTimestamps: Set<Timestamp>,
): null | number => {
  const summary = getTimeSeriesSummary(totalDatapoints, allTimestamps);
  return summary?.sum ?? null;
};

export const getTimeSeriesAverageValue = (
  totalDatapoints: SeriesDataPoints | undefined,
  allTimestamps: Set<Timestamp>,
): null | number => {
  const summary = getTimeSeriesSummary(totalDatapoints, allTimestamps);
  if (summary === null) return null;
  return summary.sum / summary.count;
};

export const getRAQIAPIAverageTotalValue = <RAQIDimension>(
  validatedResponse: RAQIResponse<RAQIDimension> | null,
): null | number => {
  if (!validatedResponse) return null;
  const allSeries: Array<RAQIMetricValue<RAQIDimension>> = validatedResponse.values;
  const { allTimestamps, pointsBySeries } = ingestRAQIMetricValues(allSeries);

  // find the series who's breakdown array is empty
  const totalDatapoints = Array.from(pointsBySeries.entries()).find(
    ([key]) => key.length === 0,
  )?.[1];
  return getTimeSeriesAverageValue(totalDatapoints, allTimestamps);
};

export const getRAQIAPISumTotalValue = <RAQIDimension>(
  validatedResponse: RAQIResponse<RAQIDimension> | null,
): null | number => {
  if (!validatedResponse) return null;
  const allSeries: Array<RAQIMetricValue<RAQIDimension>> = validatedResponse.values;
  const { allTimestamps, pointsBySeries } = ingestRAQIMetricValues(allSeries);

  // find the series who's breakdown array is empty
  const totalDatapoints = Array.from(pointsBySeries.entries()).find(
    ([key]) => key.length === 0,
  )?.[1];
  return getTimeSeriesSum(totalDatapoints, allTimestamps);
};

export const getRAQISumTotalValueWithComparison = <RAQIDimension>(
  validatedData: RAQIResponse<RAQIDimension> | null,
  validatedPreviousData: RAQIResponse<RAQIDimension> | null,
  isPositiveGood: boolean,
) => {
  const dataTotal = getRAQIAPISumTotalValue(validatedData);
  const previousTotal = getRAQIAPISumTotalValue(validatedPreviousData);
  const comparisonChipSpec = getComparisonChipSpec({
    isPositiveGood,
    current: dataTotal,
    previous: previousTotal,
  });
  return {
    value: dataTotal,
    comparisonChipSpec,
  };
};
