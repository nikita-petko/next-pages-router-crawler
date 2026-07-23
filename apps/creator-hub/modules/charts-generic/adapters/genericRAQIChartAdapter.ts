import type { RAQIV2MetricGranularity } from '@rbx/creator-hub-analytics-config';
import type { Locale } from '@rbx/intl';
import type { FormattedText } from '@modules/analytics-translations/types';
import type { RAQIBreakdownValue, RAQIMetricValue } from '@modules/clients/analytics';
import type { ChartSummaryItemSpec } from '../charts/ChartSummaryItem';
import { SummaryValueType } from '../charts/ChartSummaryItem';
import type {
  SplineChartTimeseriesData,
  SplineChartTimeseriesDataPoint,
} from '../charts/types/TimeSeriesSplineChartTypes';
import type { Timestamp, Value } from '../charts/types/TimeSeriesTypes';
import ChartSummaryType from '../enums/ChartSummaryType';
import priorTimestamp from '../utils/priorTimestamp';

export type SeriesDataPoints = Map<Timestamp, Value | null>;
export type BreakdownSpec<RAQIDimension> = Array<RAQIBreakdownValue<RAQIDimension>>;
export type PointsBySeries<RAQIDimension> = Map<BreakdownSpec<RAQIDimension>, SeriesDataPoints>;
export type SingleSeriesInfo<TSeriesID> = {
  seriesId: TSeriesID;
  legendName: FormattedText;
  data: SplineChartTimeseriesData;
  dataPoints: SeriesDataPoints;
  summaryLabel?: FormattedText;
  sum: number;
};
export type SortedSeriesInfo<TSeriesID> = Array<SingleSeriesInfo<TSeriesID>>;

export const ingestRAQIMetricValues = <RAQIDimension>(
  allSeries: Array<RAQIMetricValue<RAQIDimension>>,
): {
  allTimestamps: Set<Timestamp>;
  pointsBySeries: PointsBySeries<RAQIDimension>;
} => {
  // since we eliminate any empty buckets in a given time series,
  // we first need to build the sorted list of x-axis timestamps.
  const allTimestamps: Set<Timestamp> = new Set();
  const pointsBySeries: Map<BreakdownSpec<RAQIDimension>, SeriesDataPoints> = new Map();
  allSeries.forEach((series) => {
    const breakdownSpec = series?.breakdowns || [];
    const seriesMap: SeriesDataPoints = new Map();
    pointsBySeries.set(breakdownSpec, seriesMap);
    (series?.datapoints ?? []).forEach((point) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- ADHOC-cleanup - pre-existing tech debt surfaced by PR #13823 (proxy-module cleanup)
      const timestamp = point.timestamp?.getTime() as Timestamp;
      if (timestamp) {
        allTimestamps.add(timestamp);
        const { value } = point;
        if (value === null) {
          // if explicitly null, pass it through to the next step
          seriesMap.set(timestamp, value);
        } else {
          // otherwise, if missing, assume zero
          // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- ADHOC-cleanup - pre-existing tech debt surfaced by PR #13823 (proxy-module cleanup)
          seriesMap.set(timestamp, (value ?? 0) as Value);
        }
      }
    });
  });

  return {
    allTimestamps,
    pointsBySeries,
  };
};

export const processTimestamps = (
  allTimestamps: Set<Timestamp>,
  granularity: RAQIV2MetricGranularity,
  endDate: Date,
) => {
  if (!allTimestamps.size) {
    return [];
  }

  const latestFirst = Array.from(allTimestamps.values()).sort((a, b) => b - a);
  const oldestFirst = latestFirst.slice().toReversed();

  const result: Array<Timestamp> = [];
  const end = oldestFirst[0];
  let current = latestFirst[0];
  while (current >= end) {
    if (current <= endDate.getTime()) {
      result.push(current);
    }
    current = priorTimestamp(current, granularity);
  }
  return result.toReversed();
};

export const sortTotalBreakdownFirst = <RAQIDimension>(
  a: BreakdownSpec<RAQIDimension>,
  b: BreakdownSpec<RAQIDimension>,
): number => {
  // INFO(gperkins@ 20220907): BreakdownSpec length == 0 means it's the total, which we want first
  if (!a.length) {
    return -1;
  }
  if (!b.length) {
    return 1;
  }
  return 0;
};

export const totalDatapointsAcrossSeries = <TSeriesID>(
  series: SortedSeriesInfo<TSeriesID>,
): number => {
  let totalSum = 0;

  series.forEach((singleSeriesInfo) => {
    singleSeriesInfo.dataPoints.forEach((value) => {
      if (value !== null) {
        totalSum += value;
      }
    });
  });

  return totalSum;
};

// INFO(cmccarty@20230518) totals are denoted by an empty breakdown
export const getTotalFromPointsSeries = <RAQIDimension>(
  pointsBySeriesInput: PointsBySeries<RAQIDimension>,
): PointsBySeries<RAQIDimension> => {
  const filteredMap: Map<BreakdownSpec<RAQIDimension>, SeriesDataPoints> = new Map();

  pointsBySeriesInput.forEach((value, key) => {
    const breakdownSpec = key;
    if (breakdownSpec.length === 0) {
      filteredMap.set(key, value);
    }
  });

  return filteredMap;
};

export const summarizeSeriesDataPoints = (
  series: SeriesDataPoints | undefined,
  config: Array<{
    unit: Omit<ChartSummaryItemSpec, 'value'>;
    type: 'total' | 'average';
  }>,
): Array<ChartSummaryItemSpec> => {
  if (!series) {
    return [];
  }

  return config.map(({ unit, type }) => {
    const total = Array.from(series.values()).reduce((sum, cur) => sum + (cur ?? 0), 0);
    const countNonNull = Array.from(series.values()).reduce(
      (count, cur) => count + (cur === null ? 0 : 1),
      0,
    );
    switch (type) {
      case 'total':
        return {
          ...unit,
          value: total,
          summaryValueType: SummaryValueType.Numeric,
          summaryType: ChartSummaryType.Total,
        };
      case 'average':
        return {
          ...unit,
          value: total / countNonNull,
          summaryValueType: SummaryValueType.Numeric,
          summaryType: ChartSummaryType.Average,
        };
      default: {
        const exhaustiveCheck: never = type;
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions -- ADHOC-cleanup - pre-existing tech debt surfaced by PR #13823 (proxy-module cleanup)
        throw new Error(`Unsupported summary type ${exhaustiveCheck}`);
      }
    }
  });
};

// Decides how to handle a timestamp with no value.
export enum InfillBehavior {
  Null, // Fill value with null
  Zero, // Fill value with zero
  ZeroIfNotNull, // Fill value with zero if value is not null
}

export const buildSingleSeriesInfo = <TSeriesID>({
  seriesId,
  legendName,
  summaryLabel,
  dataPoints,
  sortedTimestamps,
  infillBehavior,
}: {
  seriesId: TSeriesID;
  legendName: FormattedText;
  summaryLabel?: FormattedText;
  dataPoints: SeriesDataPoints;
  sortedTimestamps: Array<Timestamp>;
  granularity: RAQIV2MetricGranularity;
  locale: Locale;
  infillBehavior: InfillBehavior;
}): SingleSeriesInfo<TSeriesID> => {
  let sum = 0;
  // factor this out and use this in adapters
  // so that we can divide the sum by the number of datapoints that was used to sum it
  const formattedData: Array<SplineChartTimeseriesDataPoint> = sortedTimestamps.map((timestamp) => {
    const given = dataPoints.get(timestamp);
    let value = null;
    switch (infillBehavior) {
      case InfillBehavior.Null:
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- ADHOC-cleanup - pre-existing tech debt surfaced by PR #13823 (proxy-module cleanup)
        value = (given ?? null) as Value;
        break;
      case InfillBehavior.Zero:
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- ADHOC-cleanup - pre-existing tech debt surfaced by PR #13823 (proxy-module cleanup)
        value = (given ?? 0) as Value;
        break;
      case InfillBehavior.ZeroIfNotNull:
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- ADHOC-cleanup - pre-existing tech debt surfaced by PR #13823 (proxy-module cleanup)
        value = (given === null ? null : (given ?? 0)) as Value;
        break;
      default: {
        const exhaustiveCheck: never = infillBehavior;
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions -- ADHOC-cleanup - pre-existing tech debt surfaced by PR #13823 (proxy-module cleanup)
        throw new Error(`Unhandled InfillBehavior type ${exhaustiveCheck}`);
      }
    }
    sum += value ?? 0;
    return [timestamp, value];
  });
  return {
    seriesId,
    legendName,
    summaryLabel,
    data: formattedData,
    dataPoints,
    sum,
  };
};

export function buildSeriesInfo<TSeriesID>({
  pointsBySeries,
  sortedTimestamps,
  granularity,
  locale,
  translateNameFn,
  summaryLabelFn,
  sortFn,
  legendNames,
  infillBehavior,
}: {
  pointsBySeries: Map<TSeriesID, SeriesDataPoints>;
  sortedTimestamps: Array<Timestamp>;
  granularity: RAQIV2MetricGranularity;
  locale: Locale;
  translateNameFn: (seriesId: TSeriesID) => FormattedText;
  summaryLabelFn: (seriesId: TSeriesID) => FormattedText;
  sortFn?: (a: TSeriesID, b: TSeriesID) => number;
  legendNames?: string[];
  infillBehavior: InfillBehavior;
}): SortedSeriesInfo<TSeriesID> {
  const entries = Array.from(pointsBySeries.entries());
  return (sortFn ? entries.sort(([a], [b]) => sortFn(a, b)) : entries)
    .map(([seriesId, dataPoints], index): SingleSeriesInfo<TSeriesID> => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- ADHOC-cleanup - pre-existing tech debt surfaced by PR #13823 (proxy-module cleanup)
      const legendName = (
        legendNames ? legendNames[index] : translateNameFn(seriesId)
      ) as FormattedText;
      const summaryLabel = summaryLabelFn(seriesId);
      return buildSingleSeriesInfo({
        seriesId,
        legendName,
        summaryLabel,
        dataPoints,
        sortedTimestamps,
        granularity,
        locale,
        infillBehavior,
      });
    })
    .filter(({ sum }) => sum !== 0);
}

export default {
  processTimestamps,
  ingestRAQIMetricValues,
  sortTotalBreakdownFirst,
  buildSeriesInfo,
  totalDatapointsAcrossSeries,
  getTotalFromPointsSeries,
};
