import type { NonCategoricalSingleColumnSeries } from '@rbx/analytics-ui';
import { SeriesDataTypes } from '@rbx/analytics-ui';
import type { Locale } from '@rbx/intl';
import type { FormattedText } from '@modules/analytics-translations/types';
import type { TExplicitTimeRangeSpec } from '@modules/charts-generic/charts/types/ChartTypes';
import type { TimeComparatorChartSpec } from '@modules/charts-generic/charts/types/TimeComparatorTypes';
import type {
  TimeSeriesInfo,
  Timestamp,
  TimeSeriesDataPoint,
  Value,
} from '@modules/charts-generic/charts/types/TimeSeriesTypes';
import { formatDateRangeForKey } from '@modules/charts-generic/utils/dateUtils';
import type { RAQIV2TimeComparatorChartSpec } from '../types/RAQIV2ChartSpec';
import type { RAQIV2TranslationDependencies } from '../types/RAQIV2DimensionRenderer';
import type { RAQIV2QueryResponses } from '../utils/combineRAQIV2QueryResponses';
import { buildChartUnitOptions } from './genericRAQIV2ChartAdapter';

type DataPoint<X, Y> = [X, Y | null];

export type RAQIV2TimeComparatorQueryResult = {
  label?: string;
  // We need to know the original time range so we can accurately anchor the data, even if no
  // data is returned for the first day
  timeSpec: TExplicitTimeRangeSpec;
} & RAQIV2QueryResponses;

/**
 * Takes a timestamp corresponding to the start of a date range and another timestamp from that date range
 * and returns the 'date number' (ex. 'Day 3') of the second timestamp
 */
const convertTimeStampsToDayNumber = (startTimestamp: number, timestampToNumber: number) => {
  return Math.ceil((timestampToNumber - startTimestamp) / (1000 * 60 * 60 * 24)) + 1;
};

/**
 * Takes an array of sorted data points in the form (date number, value) and fills in any missing days with
 * a data point with a value of zero
 *
 * ex:
 * [(1, 32), (3, 44), (4, 10)]
 * becomes
 * [(1, 32), (2, 0) (3, 44), (4, 10)]
 */
const interpolateZeros = (sourceData: DataPoint<number, Value>[]) => {
  const fullData: DataPoint<number, Value>[] = [];
  let cursor = 0;
  const lastDayWithNonzeroValue = sourceData[sourceData.length - 1][0];
  for (let x = 1; x <= lastDayWithNonzeroValue; x += 1) {
    if (sourceData[cursor][0] === x) {
      fullData.push(sourceData[cursor]);
      cursor += 1;
    } else {
      fullData.push([x, 0 as Value]);
    }
  }
  return fullData;
};

/**
 * Transforms multiple raw RAQIV2 time comparator query results into a time comparator chart spec
 */
const genericRAQIV2TimeComparatorChartAdapter = (
  responses: (RAQIV2TimeComparatorQueryResult | null)[],
  spec: RAQIV2TimeComparatorChartSpec,
  translationDependencies: RAQIV2TranslationDependencies,
): TimeComparatorChartSpec<TimeSeriesInfo> => {
  const unit = buildChartUnitOptions(spec, translationDependencies);
  const allSeries = responses
    .filter((response) => response !== null)
    .map((response) => {
      const responseValues = response?.response?.values ?? [];
      const name = response.label;
      // Since there is no breakdown for time compartitor responses, we expect there to be one response
      // in the array (or 0, if there is no data)
      const dataPoints = responseValues[0]?.dataPoints ?? [];
      const dataPointsWithTimestamps = dataPoints.map(({ time, value }): TimeSeriesDataPoint => {
        return [new Date(time as string).getTime() as Timestamp, value as Value];
      });
      const series = {
        name: name as FormattedText,
        dataPoints: dataPointsWithTimestamps,
        isTotalSeries: true,
        breakdownValues: [],
      };
      // The name of the event is user generated and is used as-is
      series.name = name as FormattedText;
      return {
        timeSpec: response.timeSpec,
        series,
      };
    });
  return {
    timeAnnotatedSeries: allSeries,
    unit,
  };
};

/**
 * Ingests an array of time series data with their corresponding time specs and outputs the data in
 * the format expected by the ColumnChart component
 */
export const formatTimeComparatorDataForColumnChart = (
  series: {
    series: TimeSeriesInfo;
    timeSpec: TExplicitTimeRangeSpec;
  }[],
  locale: Locale,
): {
  series: NonCategoricalSingleColumnSeries<number, number>[];
} => {
  return {
    series: series.map(({ timeSpec, series: timeSeries }) => {
      const dateRangeString = formatDateRangeForKey(locale, timeSpec.startTime, timeSpec.endTime);
      const name = (
        timeSeries.name ? dateRangeString.concat(` (${timeSeries.name})`) : dateRangeString
      ) as FormattedText;

      if (timeSeries.dataPoints.length === 0) {
        return { name, dataPoints: [], type: SeriesDataTypes.Normal };
      }
      const dayOne = timeSpec.startTime.getTime();
      const dataWithoutZeros = timeSeries.dataPoints.map((point) => {
        return [convertTimeStampsToDayNumber(dayOne, point[0]), point[1]] as DataPoint<
          number,
          Value
        >;
      });
      // The analytics backend does not return any data points for days where the metric value is 0. We need to
      // populate these ourselves:
      const fullData = interpolateZeros(dataWithoutZeros);
      return {
        name,
        type: SeriesDataTypes.Normal,
        dataPoints: fullData,
      };
    }),
  };
};

export default genericRAQIV2TimeComparatorChartAdapter;
