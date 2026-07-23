// NOTE(shumingxu, 01/19/2024): Generic adapter for RAQI V2 charts as a temporary solution before configurable charts.
// This is a more simplified version of genericRAQIChartAdapter that trims a lot of chart-specific logic.
import {
  EntireRangeInterval,
  NumberContext,
  priorTimestamp,
  SeriesIntervalMeaning,
  SplineChartTimeseriesDataPoint,
  TimeSeriesChartUnitSpec,
  TimeSeriesDataPoint,
  TimeSeriesInfo,
  Timestamp,
  Value,
} from '@modules/charts-generic';

import { FormattedText, translationKey } from '@modules/analytics-translations';

import { TranslationNamespace } from '@modules/miscellaneous/localization';
import {
  RAQIV2BreakdownValue,
  RAQIV2MetricValue,
  RAQIV2QueryResult,
  RAQIV2ReservedDimensionValues,
  AnalyticsDataStatus,
} from '@modules/clients/analytics';
import { RAQIV2Dimension, RAQIV2MetricValueType } from '@rbx/creator-hub-analytics-config';
import { isValidEnumValue } from '@modules/miscellaneous/common/utils';
import RAQIV2ChartSpec from '../types/RAQIV2ChartSpec';
import {
  RAQIV2NonNullableBreakdownValue,
  RAQIV2TranslationDependencies,
} from '../types/RAQIV2DimensionRenderer';
import sortRAQIV2SeriesByBreakdowns from './sortRAQIV2SeriesByBreakdowns';
import tryGetRAQIV2MultiBreakdownValueName from '../constants/RAQIV2MultiDimensionRenderers';
import RAQIV2ReservedDimensionValuesTranslationKeys from '../constants/RAQIV2ReservedDimensionValuesTranslationKeys';
import getDimensionRenderer from '../components/getDimensionRenderer';
import NumbericDataPointTransformerConfig from '../constants/NumericDataPointTransformerConfig';
import { snapToLatestEndTime, snapToLatestStartTime } from '../utils/snapToLatestTimestep';
import getAnalyticsMetricDisplayConfig from '../constants/AnalyticsMetricDisplayConfig';
import { generateAnalyticsNumberFormattingSpec } from '../utils/analyticsNumberFormattingSpec';
import { isComputedMetric } from '../types/ComputedMetric';
import { getDisplayUnitFromMetricLike } from '../utils/metricLikeSemantics';

// Extended TimeSeriesInfo with zones support using DataStatus
export type TimeSeriesInfoWithDataStatusZones = TimeSeriesInfo & {
  zones?: Array<{ start: Timestamp; end: Timestamp; status: AnalyticsDataStatus }>;
};

const isTotalSeries = (breakdownValues: RAQIV2BreakdownValue[]): boolean => {
  return breakdownValues.length === 0;
};

const BreakdownSeparator = ', ';

export type BreakdownLabel = { name: FormattedText; tooltip?: FormattedText };

const getBreakdownLabelFallbackForUnrecognizedDimension = (
  breakdownValue: Omit<RAQIV2BreakdownValue, 'dimension'>,
  deps: RAQIV2TranslationDependencies,
): BreakdownLabel => {
  const { displayValue, value } = breakdownValue;
  if (displayValue) {
    return { name: displayValue as FormattedText };
  }
  const { translate } = deps;
  if (!value) {
    return {
      name: translate(
        RAQIV2ReservedDimensionValuesTranslationKeys[RAQIV2ReservedDimensionValues.Unknown],
      ),
    };
  }
  return { name: value as FormattedText };
};

const getBreakdownLabelForKnownDimension = (
  dimension: RAQIV2Dimension,
  breakdownValue: Omit<RAQIV2BreakdownValue, 'dimension'>,
  deps: RAQIV2TranslationDependencies,
): BreakdownLabel => {
  const { value } = breakdownValue;
  if (!value) {
    const { translate } = deps;
    return {
      name: translate(
        RAQIV2ReservedDimensionValuesTranslationKeys[RAQIV2ReservedDimensionValues.Unknown],
      ),
    };
  }

  if (isValidEnumValue(RAQIV2ReservedDimensionValues, value)) {
    const { translate } = deps;
    return {
      name: translate(RAQIV2ReservedDimensionValuesTranslationKeys[value]),
    };
  }

  const { getBreakdownValueName, getBreakdownValueTooltip } = getDimensionRenderer(dimension);
  const nonNullableBreakdownValue = { ...breakdownValue, value };
  return {
    name: getBreakdownValueName(nonNullableBreakdownValue, deps),
    tooltip: getBreakdownValueTooltip(nonNullableBreakdownValue, deps),
  };
};

export const getSingleDimensionBreakdownLabel = (
  breakdownValue: RAQIV2BreakdownValue,
  deps: RAQIV2TranslationDependencies,
): BreakdownLabel => {
  const { displayValue, value, dimension } = breakdownValue;
  if (!dimension || !isValidEnumValue(RAQIV2Dimension, dimension)) {
    return getBreakdownLabelFallbackForUnrecognizedDimension({ value, displayValue }, deps);
  }
  return getBreakdownLabelForKnownDimension(dimension, breakdownValue, deps);
};

export const getBreakdownName = (
  breakdownValues: RAQIV2BreakdownValue[],
  deps: RAQIV2TranslationDependencies,
): FormattedText => {
  const { translate } = deps;
  if (isTotalSeries(breakdownValues)) {
    // Empty array => totals
    return translate(translationKey('Label.Total', TranslationNamespace.Analytics));
  }

  const multiDimensionRendererValue = tryGetRAQIV2MultiBreakdownValueName(breakdownValues, deps);
  if (multiDimensionRendererValue) {
    return multiDimensionRendererValue;
  }

  const renderedBreakdownValues = breakdownValues.map(
    (breakdownValue) => getSingleDimensionBreakdownLabel(breakdownValue, deps).name,
  );

  return renderedBreakdownValues.join(BreakdownSeparator) as FormattedText;
};

export const getBreakdownImageUrl = (
  breakdownValues: RAQIV2BreakdownValue[],
  deps: RAQIV2TranslationDependencies,
): string | undefined => {
  const breakdownValueWithImageAvailable = breakdownValues.filter(
    (breakdownValue): breakdownValue is RAQIV2NonNullableBreakdownValue => {
      const { value, dimension } = breakdownValue;
      return dimension === RAQIV2Dimension.ThumbnailAsset && !!value;
    },
  );
  if (breakdownValueWithImageAvailable.length === 0) {
    return undefined;
  }
  // NOTE: we don't support multiple breakdown images
  const breakdownValue = breakdownValueWithImageAvailable[0];
  const { getBreakdownValueImageUrl } = getDimensionRenderer(RAQIV2Dimension.ThumbnailAsset);

  if (!getBreakdownValueImageUrl) {
    return undefined;
  }
  return getBreakdownValueImageUrl(breakdownValue, deps);
};

// Collects all unique timestamps from the series data points that fall within the specified date range.
// This ensures we only work with timestamps that are actually present in the data,
// avoiding interpolation issues when dealing with different granularities.
// See discussion: https://github.rbx.com/Roblox/creator-hub/pull/9412#discussion_r1484265
const collectAllTimestamps = (
  allSeries: Array<RAQIV2MetricValue>,
  startTime: Date,
  endTime: Date,
  ignoreTimeConstraints: boolean = false,
): Set<Timestamp> => {
  const allTimestamps = new Set<Timestamp>();
  allSeries.forEach((series) => {
    const { dataPoints } = series;
    if (dataPoints !== undefined) {
      dataPoints.forEach(({ time }) => {
        if (
          time !== undefined &&
          (ignoreTimeConstraints ||
            (new Date(time).getTime() >= startTime.getTime() &&
              new Date(time).getTime() <= endTime.getTime()))
        ) {
          allTimestamps.add(new Date(time).getTime() as Timestamp);
        }
      });
    }
  });
  return allTimestamps;
};

type TimeSeriesDataPointWithStatus = TimeSeriesDataPoint & [unknown, unknown, AnalyticsDataStatus];

// Adapted from processTimestamps in genericRAQIChartAdapter
const interpolateTimestampsFromGranularity = (
  allTimestamps: Set<Timestamp>,
  seriesIntervalMeaning: SeriesIntervalMeaning,
  endTime: Date,
): Array<Timestamp> => {
  if (!allTimestamps.size) {
    return [];
  }

  const timestampsOldestFirst = Array.from(allTimestamps.values()).sort();

  const result: Array<Timestamp> = [];
  const end = timestampsOldestFirst[0];
  let current = Math.min(
    timestampsOldestFirst[timestampsOldestFirst.length - 1],
    endTime.getTime(),
  ) as Timestamp;
  while (current >= end) {
    result.push(current);
    current = priorTimestamp(current, seriesIntervalMeaning);
  }
  return result.reverse();
};

/**
 * Normalizes the data status to a consistent value.
 * Valid, Invalid, undefined, and null are all treated as Valid (the default).
 */
const normalizeDataStatus = (
  status: AnalyticsDataStatus | undefined | null,
): AnalyticsDataStatus =>
  status === AnalyticsDataStatus.Valid ||
  status === AnalyticsDataStatus.Invalid ||
  status === undefined ||
  status === null
    ? AnalyticsDataStatus.Valid
    : status;

// Transform data series into highcharts series format while pad / interpolate data series to have the same timestamps with nulls or 0s
const buildHighchartsSeriesWithInterpolation = (
  series: RAQIV2MetricValue,
  sortedTimestamps: Array<Timestamp>,
  padMissingWithZero: boolean,
): {
  dataPoints: Array<SplineChartTimeseriesDataPoint>;
  zones: Array<{ start: Timestamp; end: Timestamp; status: AnalyticsDataStatus }>;
} => {
  const dataPointsMap = new Map(
    series.dataPoints
      ?.filter(({ time }) => time !== undefined)
      .map(({ time, value, status }) => [new Date(time as string).getTime(), { value, status }]) ??
      [],
  );

  // Build data points with status included from the API response
  const formattedData = sortedTimestamps.map((timestamp): TimeSeriesDataPointWithStatus => {
    const given = dataPointsMap.get(timestamp);
    // Only pad undefined to 0 when fillMissingDatapoints is true, other values including nulls get returned directly
    let value: number | null | undefined;
    if (given === undefined) {
      value = padMissingWithZero ? 0 : null;
    } else {
      value = given.value;
    }
    const status = normalizeDataStatus(given?.status);
    return [timestamp as Timestamp, value as Value | null, status];
  });

  // Create zones based on status changes (for chart styling)
  const zones: Array<{ start: Timestamp; end: Timestamp; status: AnalyticsDataStatus }> = [];
  formattedData.forEach((dataPoint, idx) => {
    const timestamp = dataPoint[0];
    const status = dataPoint[2];
    if (idx === 0) {
      zones.push({
        start: timestamp,
        end: timestamp,
        status,
      });
      return;
    }
    const currentZone = zones[zones.length - 1];
    if (status === currentZone.status) {
      // zone continues, update end time
      currentZone.end = timestamp;
    } else {
      zones.push({
        start: timestamp,
        end: timestamp,
        status,
      });
    }
  });
  const effectiveZones = zones.filter((zone) => zone.status !== AnalyticsDataStatus.Valid);
  return { dataPoints: formattedData, zones: effectiveZones };
};

const buildSeriesInfo = (
  series: RAQIV2MetricValue,
  sortedTimestamps: Array<Timestamp>,
  translationDependencies: RAQIV2TranslationDependencies,
  padMissingWithZero: boolean,
): TimeSeriesInfoWithDataStatusZones => {
  const name = getBreakdownName(series.breakdownValue ?? [], translationDependencies);
  const { dataPoints, zones } = buildHighchartsSeriesWithInterpolation(
    series,
    sortedTimestamps,
    padMissingWithZero,
  );

  return {
    name,
    dataPoints,
    isTotalSeries: isTotalSeries(series.breakdownValue ?? []),
    breakdownValues: series.breakdownValue ?? [],
    imageUrl: getBreakdownImageUrl(series.breakdownValue ?? [], translationDependencies),
    zones,
  };
};

export type GenericRaqiV2ChartAdapterSpec = {
  response: RAQIV2QueryResult | null;
  spec: RAQIV2ChartSpec;
  translationDependencies: RAQIV2TranslationDependencies;
  seriesIntervalMeaning: SeriesIntervalMeaning;
};

export const ingestAllRaqiV2Series = ({
  response,
  spec,
  translationDependencies,
  seriesIntervalMeaning,
}: GenericRaqiV2ChartAdapterSpec): {
  series: TimeSeriesInfoWithDataStatusZones[];
  timestamps: Array<Timestamp>;
} => {
  const responseValues = response?.values ?? [];
  const intervalLength = spec.timeSpec.snapGranularity ?? seriesIntervalMeaning.length;
  const snappedStart = snapToLatestStartTime(spec.timeSpec.startTime, intervalLength);
  const snappedEnd = snapToLatestEndTime(spec.timeSpec.endTime, intervalLength);

  const shouldInterpolateTimestamps = seriesIntervalMeaning !== EntireRangeInterval;
  const allTimestamps = collectAllTimestamps(
    responseValues,
    snappedStart,
    snappedEnd,
    !shouldInterpolateTimestamps,
  );
  const interpolatedTimestamps = shouldInterpolateTimestamps
    ? interpolateTimestampsFromGranularity(
        allTimestamps,
        seriesIntervalMeaning,
        spec.timeSpec.endTime,
      )
    : Array.from(allTimestamps);

  const metricDisplayConfig = isComputedMetric(spec.metric)
    ? null
    : getAnalyticsMetricDisplayConfig(spec.metric);
  const padMissingTimeSeriesValuesWithZero = metricDisplayConfig?.fillMissingDatapoints !== false;

  const allSeries = responseValues.map((series) =>
    buildSeriesInfo(
      series,
      interpolatedTimestamps,
      translationDependencies,
      padMissingTimeSeriesValuesWithZero,
    ),
  );
  const sortedSeries = sortRAQIV2SeriesByBreakdowns(allSeries, spec);
  const config = metricDisplayConfig;
  if (
    config &&
    config.valueType === RAQIV2MetricValueType.Numeric &&
    config.dataPointTransformerType
  ) {
    const transformer = NumbericDataPointTransformerConfig[config.dataPointTransformerType];

    // transform data points in place
    sortedSeries.forEach((singleSeries) => {
      singleSeries.dataPoints.forEach(([, dataPointValue], index) => {
        if (dataPointValue !== null) {
          singleSeries.dataPoints.splice(index, 1, transformer(index, singleSeries.dataPoints));
        }
      });
    });
  }

  return { series: sortedSeries, timestamps: interpolatedTimestamps };
};

export const ingestRaqiV2ComparisonSeries = ({
  rawComparisonSeries,
  translationDependencies,
  originalTimestamps,
}: {
  rawComparisonSeries: TimeSeriesInfoWithDataStatusZones[];
  translationDependencies: RAQIV2TranslationDependencies;
  originalTimestamps: Timestamp[];
}): TimeSeriesInfoWithDataStatusZones[] => {
  const { translate } = translationDependencies;

  const result: TimeSeriesInfoWithDataStatusZones[] = [];
  rawComparisonSeries.forEach(({ dataPoints: comparisonData, ...series }) => {
    let truncatedComparisonData = comparisonData;
    if (comparisonData.length < originalTimestamps.length) {
      // NOTE(gperkins@20260330): This happens when the universe or metric is new.
      return;
    }

    if (comparisonData.length > originalTimestamps.length) {
      truncatedComparisonData = comparisonData.slice(
        comparisonData.length - originalTimestamps.length,
      );
    }

    const resultData: SplineChartTimeseriesDataPoint[] = [];
    for (let idx = 0; idx < originalTimestamps.length; idx += 1) {
      // if there is a prior index in the originalTimestamps, compute the interval length
      const intervalLength = idx > 0 ? originalTimestamps[idx] - originalTimestamps[idx - 1] : null;
      const comparisonDataPoint = truncatedComparisonData[idx];
      const [comparisonTimestamp, comparisonValue, comparisonStatus] = comparisonDataPoint;
      // if there is a prior index in the data, compute the comparison interval length
      const comparisonIntervalLength =
        idx > 0 ? comparisonTimestamp - truncatedComparisonData[idx - 1][0] : null;
      // if the interval lengths are not the same, the comparison series is not valid
      if (intervalLength !== comparisonIntervalLength) {
        // eslint-disable-next-line no-console -- don't want to throw out the whole chart if wrong
        console.error(
          'Comparison series does not have the same interval lengths as original series',
        );
        return;
      }
      // Preserve the status from the comparison data if present
      const newDataPoint: SplineChartTimeseriesDataPoint = [
        originalTimestamps[idx],
        comparisonValue,
        comparisonStatus,
      ];
      resultData.push(newDataPoint);
    }
    result.push({
      ...series,
      name: translate(translationKey('Label.Comparison', TranslationNamespace.Analytics), {
        series: series.name,
      }),
      dataPoints: resultData,
      isComparisonSeries: true,
    });
  });
  return result;
};

export const buildChartUnitOptions = (
  chartSpec: Pick<RAQIV2ChartSpec, 'metric' | 'filter'>,
  translationDependencies: RAQIV2TranslationDependencies,
): TimeSeriesChartUnitSpec => {
  return {
    display: getDisplayUnitFromMetricLike(chartSpec.metric, translationDependencies),
    formattingSpec: generateAnalyticsNumberFormattingSpec({
      metric: chartSpec.metric,
      context: NumberContext.DataPoint,
      numberContextMetadata: { chartSpec },
    }),
  };
};

export const getFirstDataPointValue = (
  dataPoints: SplineChartTimeseriesDataPoint[],
): Value | null => {
  if (dataPoints.length === 0) {
    return null;
  }
  return dataPoints[0][1];
};
