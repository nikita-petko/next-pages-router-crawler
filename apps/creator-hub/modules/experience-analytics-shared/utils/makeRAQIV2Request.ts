import {
  SeriesIntervalMeaning,
  getComparisonTimeRange,
  logAnalyticsError,
} from '@modules/charts-generic';
import {
  RAQIV2APIQueryFilter,
  TRAQIV2UIMetricFanoutDimensionValuesNew,
  RAQIV2QueryFilter,
  RAQIV2QueryResult,
  RAQIV2GetDimensionValuesRequest,
  RAQIV2DimensionValuesResult,
  RAQIV2FilterOperation,
  RAQIV2GetMetricMetadataRequest,
  RAQIV2MetricMetadataResult,
} from '@modules/clients/analytics';
import {
  RAQIV2AggregationType,
  RAQIV2Dimension,
  RAQIV2Metric,
  RAQIV2PercentileType,
  TRAQIV2APIMetric,
  TRAQIV2Dimension,
  TRAQIV2UIMetric,
  RAQIV2UIPseudoDimension,
  RAQIV2DimensionDisplayConfig,
  RAQIV2UIPseudoDimensionType,
  TUIPseudoDimensionMetricFanoutConfig,
  TUIPseudoDimensionTopNBreakdownConfig,
  RAQIV2MetricValueType,
  RAQIV2MetricGranularity,
} from '@rbx/creator-hub-analytics-config';
import { isValidEnumValue } from '@modules/miscellaneous/common/utils';
import { RAQIV2CombinedAPIQueryRequest } from '@modules/clients/analytics/analyticsRAQIShared';
import { isValidArrayEnumValue } from '@modules/miscellaneous/common/utils/enumUtils';
import {
  AnalyticsQueryGatewayClientWrapper,
  AnalyticsQueryGatewayAPIDataPoint,
} from '@modules/clients/analytics/analyticsQueryGateway';
import sliceRAQIV2QueryResultByTimeRange from './sliceRAQIV2QueryResultByTimeRange';
import { RAQIV2QueryResponses } from './combineRAQIV2QueryResponses';
import { snapToLatestEndTime, snapToLatestStartTime } from './snapToLatestTimestep';
import getAPIMetricFromUIMetric from './getAPIMetricFromUIMetric';
import getUIMetric from './getUIMetric';
import getAnalyticsMetricDisplayConfig from '../constants/AnalyticsMetricDisplayConfig';
import {
  TDurationBucketDimension,
  isDurationBucketDimension,
} from '../constants/RAQIV2DurationBucketDimensions';
import {
  ExactRAQIV2UIQueryRequest,
  RAQIV2CombinedUIQueryRequest,
  RAQIV2CombinedUIQueryRequestWithoutMetric,
  RAQIV2UIQueryRequest,
} from '../types/RAQIV2UIQueryRequest';
import { isComputedMetric, type ComputedMetric, type MetricLike } from '../types/ComputedMetric';
import { breakdownDimensionsWithOtherSeries } from '../types/RAQIV2BreakdownDimensionsWithOtherSeries';
import { buildComputedMetricDag } from './computedMetrics/buildComputedMetricDag';
import executeComputedMetricDag from './executeComputedMetricDag';

export const enum FetchComparisonSeriesMode {
  Separate = 'Separate',
  Combined = 'Combined', // Save extra api calls by fetching the entire time series at once
}

export type FetchComparisonOptions = {
  mode: FetchComparisonSeriesMode;
  seriesIntervalMeaning: SeriesIntervalMeaning;
};

type RAQIV2QueryResultWithComparison = {
  result: RAQIV2QueryResult | null;
  comparisonResult?: RAQIV2QueryResult;
};

const catchRequestFail = async <T>(promise: Promise<T>): Promise<T | null> =>
  promise.catch(() => null);

type CombinedAPIClientWrapper = {
  platformGatewayRAQIClient: AnalyticsQueryGatewayClientWrapper;
};
export type { CombinedAPIClientWrapper as RAQIV2CombinedAPIClientWrapper };

const timeSpecToQueryTime = (
  request: RAQIV2CombinedUIQueryRequest,
): RAQIV2CombinedAPIQueryRequest => {
  const { timeSpec, ...snappedRequestBase } = request;
  return {
    ...snappedRequestBase,
    startTime: timeSpec.startTime,
    endTime: timeSpec.endTime,
  };
};

const makeQuery = async (
  clients: CombinedAPIClientWrapper,
  request: RAQIV2CombinedAPIQueryRequest,
): Promise<RAQIV2QueryResult> => {
  return clients.platformGatewayRAQIClient.query(request);
};

export const makeDimensionValuesQuery = async (
  clients: CombinedAPIClientWrapper,
  request: RAQIV2GetDimensionValuesRequest,
): Promise<RAQIV2DimensionValuesResult> => {
  return clients.platformGatewayRAQIClient.getDimensionValues(request);
};

export const fetchMetricMetadata = async (
  clients: CombinedAPIClientWrapper,
  request: RAQIV2GetMetricMetadataRequest,
): Promise<RAQIV2MetricMetadataResult | null> => {
  return catchRequestFail(clients.platformGatewayRAQIClient.getMetricMetadata(request));
};

const getRequestWithMetric = (
  { resource, ...snappedRequestBase }: RAQIV2CombinedUIQueryRequestWithoutMetric,
  metric: TRAQIV2APIMetric,
): RAQIV2CombinedUIQueryRequest => ({
  ...snappedRequestBase,
  resource,
  metric,
});

const fetchSeparateComparisonSeries = async (
  request: RAQIV2CombinedUIQueryRequest,
  clients: CombinedAPIClientWrapper,
  seriesIntervalMeaning: SeriesIntervalMeaning,
): Promise<RAQIV2QueryResultWithComparison> => {
  const { comparisonStartDate, comparisonEndDate } = getComparisonTimeRange(
    request.timeSpec.startTime,
    request.timeSpec.endTime,
    seriesIntervalMeaning,
  );
  const apiRequest = timeSpecToQueryTime(request);

  const comparisonRequest = {
    ...apiRequest,
    startTime: comparisonStartDate,
    endTime: comparisonEndDate,
  };

  const result = await Promise.all([
    makeQuery(clients, apiRequest),
    catchRequestFail(makeQuery(clients, comparisonRequest)),
  ]);
  return {
    result: result[0] ?? null,
    comparisonResult: result[1] ?? undefined,
  };
};

const fetchCombinedComparisonSeries = async (
  request: RAQIV2CombinedUIQueryRequest,
  clients: CombinedAPIClientWrapper,
  seriesIntervalMeaning: SeriesIntervalMeaning,
): Promise<RAQIV2QueryResultWithComparison> => {
  const { comparisonStartDate, comparisonEndDate } = getComparisonTimeRange(
    request.timeSpec.startTime,
    request.timeSpec.endTime,
    seriesIntervalMeaning,
  );

  const combinedRequest = {
    ...timeSpecToQueryTime(request),
    startTime: comparisonStartDate,
    endTime: request.timeSpec.endTime,
  };
  const combinedResult = await makeQuery(clients, combinedRequest);

  if (!combinedResult) {
    return {
      result: null,
    };
  }

  return {
    result: sliceRAQIV2QueryResultByTimeRange(
      combinedResult,
      request.timeSpec.startTime,
      request.timeSpec.endTime,
    ),
    comparisonResult: sliceRAQIV2QueryResultByTimeRange(
      combinedResult,
      comparisonStartDate,
      comparisonEndDate,
    ),
  };
};

const makeRequestByComparisonOption = async (
  request: RAQIV2CombinedUIQueryRequest,
  clients: CombinedAPIClientWrapper,
  comparison?: FetchComparisonOptions,
): Promise<RAQIV2QueryResultWithComparison> => {
  if (comparison === undefined) {
    return {
      result: (await makeQuery(clients, timeSpecToQueryTime(request))) ?? null,
    };
  }

  switch (comparison.mode) {
    case FetchComparisonSeriesMode.Separate:
      return fetchSeparateComparisonSeries(request, clients, comparison.seriesIntervalMeaning);
    case FetchComparisonSeriesMode.Combined:
      return fetchCombinedComparisonSeries(request, clients, comparison.seriesIntervalMeaning);
    default: {
      const exhaustiveCheck: never = comparison.mode;
      throw new Error(`Unhandled comparison fetch mode ${exhaustiveCheck}`);
    }
  }
};

type TopNPseudoBreakdownDimensionInfo = {
  dimension: RAQIV2UIPseudoDimension;
  config: TUIPseudoDimensionTopNBreakdownConfig;
};
type MetricFanoutPseudoDimensionInfo = {
  dimension: RAQIV2UIPseudoDimension;
  config: TUIPseudoDimensionMetricFanoutConfig<string>;
};
type MetricFanoutPseudoFilter = MetricFanoutPseudoDimensionInfo & { values: string[] };

const processBreakdownPseudoDimensions = (
  breakdown?: readonly TRAQIV2Dimension[],
): {
  apiBreakdown: RAQIV2Dimension[];
  topNPseudoBreakdown: TopNPseudoBreakdownDimensionInfo[];
  metricFanoutPseudoBreakdown: MetricFanoutPseudoDimensionInfo[];
  otherSeriesBreakdown: RAQIV2Dimension[];
} => {
  const apiBreakdown: RAQIV2Dimension[] = [];
  const topNPseudoBreakdown: TopNPseudoBreakdownDimensionInfo[] = [];
  const metricFanoutPseudoBreakdown: MetricFanoutPseudoDimensionInfo[] = [];
  const otherSeriesBreakdown: RAQIV2Dimension[] = [];
  breakdown?.forEach((dimension) => {
    if (isValidEnumValue(RAQIV2UIPseudoDimension, dimension)) {
      const { pseudoDimensionConfig: config } = RAQIV2DimensionDisplayConfig[dimension];
      const { type } = config;
      switch (type) {
        case RAQIV2UIPseudoDimensionType.MetricFanout:
          metricFanoutPseudoBreakdown.push({
            dimension,
            config,
          });
          break;
        case RAQIV2UIPseudoDimensionType.TopNBreakdown:
          topNPseudoBreakdown.push({
            dimension,
            config,
          });
          break;
        default: {
          const exhaustiveCheck: never = type;
          throw new Error(`Unhandled pseudo dimension type ${exhaustiveCheck}`);
        }
      }
    }
    if (isValidEnumValue(RAQIV2Dimension, dimension)) {
      apiBreakdown.push(dimension);
      if (isValidArrayEnumValue(breakdownDimensionsWithOtherSeries, dimension)) {
        otherSeriesBreakdown.push(dimension);
      }
    }
  });
  return { apiBreakdown, topNPseudoBreakdown, metricFanoutPseudoBreakdown, otherSeriesBreakdown };
};

const processFilterPseudoDimensions = (
  filters?: readonly RAQIV2QueryFilter[],
  otherSeriesBreakdown?: readonly RAQIV2Dimension[],
): {
  apiFilters: RAQIV2APIQueryFilter[];
  metricFanoutPseudoFilters: MetricFanoutPseudoFilter[];
  otherSeriesFilters: RAQIV2APIQueryFilter[];
  otherSeriesNotContainsFilters: RAQIV2APIQueryFilter[];
} => {
  const apiFilters: RAQIV2APIQueryFilter[] = [];
  const metricFanoutPseudoFilters: MetricFanoutPseudoFilter[] = [];
  const otherSeriesFilters: RAQIV2APIQueryFilter[] = [];
  const otherSeriesNotContainsFilters: RAQIV2APIQueryFilter[] = [];
  filters?.forEach((filter) => {
    const { dimension, values } = filter;
    if (isValidEnumValue(RAQIV2UIPseudoDimension, dimension)) {
      const { pseudoDimensionConfig: config } = RAQIV2DimensionDisplayConfig[dimension];
      const { type } = config;
      switch (type) {
        case RAQIV2UIPseudoDimensionType.MetricFanout:
          metricFanoutPseudoFilters.push({ dimension, config, values });
          break;
        case RAQIV2UIPseudoDimensionType.TopNBreakdown: {
          const apiDimension = config.filterAndBreakdownDimension;
          apiFilters.push({ dimension: apiDimension, values });
          break;
        }
        default: {
          const exhaustiveCheck: never = type;
          throw new Error(`Unhandled pseudo dimension type ${exhaustiveCheck}`);
        }
      }
    }
    if (isValidEnumValue(RAQIV2Dimension, dimension)) {
      const apiQueryFilter = filter as RAQIV2APIQueryFilter;
      // If the dimension is a breakdown dimension that shows the unfiltered series as "Other",
      // and the filter operation is not specified, then we need to show the "Other" series
      if (
        isValidArrayEnumValue(breakdownDimensionsWithOtherSeries, dimension) &&
        otherSeriesBreakdown?.includes(dimension) &&
        !apiQueryFilter.operation
      ) {
        otherSeriesFilters.push(apiQueryFilter);
        // Create the NotContains version for the "other" series query
        otherSeriesNotContainsFilters.push({
          ...apiQueryFilter,
          operation: RAQIV2FilterOperation.NotContains,
        });
      } else {
        apiFilters.push(apiQueryFilter);
      }
    }
  });
  return {
    apiFilters,
    metricFanoutPseudoFilters,
    otherSeriesFilters,
    otherSeriesNotContainsFilters,
  };
};

type ApiMetricWithBreakdown = {
  apiMetric: TRAQIV2APIMetric;
  breakdownDimension?: RAQIV2UIPseudoDimension;
  breakdownValue?: string;
};

type ApiMetrics = {
  apiMetrics: ApiMetricWithBreakdown[] | TRAQIV2APIMetric;
  metricForTotalSeries: TRAQIV2APIMetric;
  allAPIMetrics: TRAQIV2APIMetric[];
};

const buildFanoutDimensionValues = (
  dimension: RAQIV2UIPseudoDimension,
  filterValue: string,
): TRAQIV2UIMetricFanoutDimensionValuesNew => {
  return {
    percentileType:
      dimension === RAQIV2UIPseudoDimension.PercentileType
        ? (filterValue as RAQIV2PercentileType)
        : null,
    aggregationType:
      dimension === RAQIV2UIPseudoDimension.AggregationType
        ? (filterValue as RAQIV2AggregationType)
        : null,
  };
};

/**
 * Given a ui metric, ui breakdowns and ui filters,
 * return the api metrics (along with the visual breakdown each represents, if there are multiple)
 * and pick the metric used for fetching total series
 */
const getApiMetrics = (
  givenMetric: TRAQIV2UIMetric,
  metricFanoutPseudoFilters: MetricFanoutPseudoFilter[],
  metricFanoutPseudoBreakdown: MetricFanoutPseudoDimensionInfo[],
): ApiMetrics => {
  if (isValidEnumValue(RAQIV2Metric, givenMetric)) {
    return {
      apiMetrics: givenMetric,
      metricForTotalSeries: givenMetric,
      allAPIMetrics: [givenMetric],
    };
  }

  // Group the metric fanout filters and breakdowns together by pseudo-dimension
  const metricFanoutDimensions: {
    dimension: RAQIV2UIPseudoDimension;
    config: TUIPseudoDimensionMetricFanoutConfig<string>;
    isBreakdown: boolean;
    filters: MetricFanoutPseudoFilter[];
  }[] = [];
  metricFanoutPseudoBreakdown.forEach(({ dimension, config }) => {
    metricFanoutDimensions.push({
      dimension,
      config,
      isBreakdown: true,
      filters: [],
    });
  });
  metricFanoutPseudoFilters.forEach((filter) => {
    // if we can find it in metricFanoutDimensions, add to its filters
    // otherwise create it with isBreakdown: false
    const prior = metricFanoutDimensions.find(({ dimension }) => dimension === filter.dimension);
    if (prior) {
      prior.filters.push(filter);
    } else {
      metricFanoutDimensions.push({
        dimension: filter.dimension,
        config: filter.config,
        isBreakdown: false,
        filters: [filter],
      });
    }
  });

  // if there are multiple fanout dimensions, we can't really handle that
  if (metricFanoutDimensions.length > 1) {
    const dimNames = metricFanoutDimensions.map(({ dimension }) => dimension).join(', ');
    throw new Error(`Cannot handle multiple fanout UIPseudoDimensions ${dimNames}`);
  }

  // If we don't have a percentile filter or dimension, we use the default API metric for that UI metric
  if (!metricFanoutDimensions.length) {
    const defaultForMetric = getAPIMetricFromUIMetric(givenMetric, {
      percentileType: null,
      aggregationType: null,
    });
    return {
      apiMetrics: defaultForMetric,
      metricForTotalSeries: defaultForMetric,
      allAPIMetrics: [defaultForMetric],
    };
  }

  const fanoutDimension = metricFanoutDimensions[0];

  // if there is a filter, then we are just interpreting the givenMetric based on the filter
  // otherwise, if there is a breakdown, then we are fanning out, and will have multiple apiMetrics
  // NOTE(gperkins@ 20240422): Currently getAPIMetricFromUIMetric requires a percentile,
  //  so this code specifically handles the percentile fanout.
  const { config, isBreakdown, filters } = fanoutDimension;
  if (filters.length) {
    const filterValue = filters[0]?.values[0];
    if (!filterValue) {
      throw new Error('Could not find filter value for MetricFanout pseudo dimension');
    }
    const apiMetric = getAPIMetricFromUIMetric(
      givenMetric,
      buildFanoutDimensionValues(fanoutDimension.dimension, filterValue),
    );
    if (isBreakdown) {
      // if the breakdown is on percentile while there is a filter,
      //  we want that percentile to become the legend name of the series
      const allMetrics = new Set<TRAQIV2APIMetric>();
      allMetrics.add(apiMetric);
      return {
        apiMetrics: [
          {
            apiMetric,
            breakdownDimension: fanoutDimension.dimension,
            breakdownValue: filterValue,
          },
        ],
        metricForTotalSeries: apiMetric,
        allAPIMetrics: Array.from(allMetrics),
      };
    }
    return {
      apiMetrics: apiMetric,
      metricForTotalSeries: apiMetric,
      allAPIMetrics: [apiMetric],
    };
  }
  if (isBreakdown) {
    const allMetrics = new Set<TRAQIV2APIMetric>();
    const apiMetricsArray = config.supportedDimensionValues.map((dimensionValue) => ({
      apiMetric: getAPIMetricFromUIMetric(
        givenMetric,
        buildFanoutDimensionValues(fanoutDimension.dimension, dimensionValue),
      ),
      breakdownDimension: fanoutDimension.dimension,
      breakdownValue: dimensionValue,
    }));
    const metricForTotalSeries = getAPIMetricFromUIMetric(
      givenMetric,
      buildFanoutDimensionValues(fanoutDimension.dimension, config.totalSeries),
    );

    allMetrics.add(metricForTotalSeries);
    apiMetricsArray.forEach(({ apiMetric }) => {
      allMetrics.add(apiMetric);
    });

    return {
      apiMetrics: apiMetricsArray,
      metricForTotalSeries,
      allAPIMetrics: Array.from(allMetrics),
    };
  }
  throw new Error('Must have a breakdown or filter for each MetricFanout pseudo dimension');
};

/**
 * Given multiple responses and their breakdowns, combine them into one response
 * @param responses multiple responses from RAQI by fetching multiple related metrics
 * @param apiMetricsWithBreakdown
 * @returns combined response
 */
const combineResponesFromFanoutBreakdown = (
  responses: RAQIV2QueryResultWithComparison[],
  apiMetricsWithBreakdown: ApiMetricWithBreakdown[],
): RAQIV2QueryResultWithComparison => {
  return responses.reduce(
    (combinedResponse: RAQIV2QueryResultWithComparison, response, index) => {
      const { breakdownDimension, breakdownValue } = apiMetricsWithBreakdown[index];

      // inject breakdown and its value to result
      if (breakdownDimension && breakdownValue) {
        response.result?.values?.forEach((value) => {
          if (!value.breakdownValue?.length) {
            value.breakdownValue?.push({
              dimension: breakdownDimension,
              value: breakdownValue,
            });
          }
        });
        response.comparisonResult?.values?.forEach((value) => {
          if (!value.breakdownValue?.length) {
            value.breakdownValue?.push({
              dimension: breakdownDimension,
              value: breakdownValue,
            });
          }
        });
      }

      return {
        result: {
          values: [
            ...(combinedResponse?.result?.values || []),
            ...(response?.result?.values || []),
          ],
        },
        comparisonResult:
          combinedResponse.comparisonResult || response.comparisonResult
            ? {
                values: [
                  ...(combinedResponse?.comparisonResult?.values || []),
                  ...(response?.comparisonResult?.values || []),
                ],
              }
            : undefined,
      };
    },
    {
      result: null,
    },
  );
};

const combineResponseFromTopNBreakdown = (
  mainResponse: RAQIV2QueryResultWithComparison,
  otherResponse: RAQIV2QueryResultWithComparison,
): RAQIV2QueryResultWithComparison => {
  return {
    result: {
      values: [...(mainResponse?.result?.values || []), ...(otherResponse?.result?.values || [])],
    },
    comparisonResult:
      mainResponse.comparisonResult || otherResponse.comparisonResult
        ? {
            values: [
              ...(mainResponse?.comparisonResult?.values || []),
              ...(otherResponse?.comparisonResult?.values || []),
            ],
          }
        : undefined,
  };
};

export type MakeRAQIV2RequestOptions = {
  fetchTotalSeries?: boolean;
  fetchComparison?: FetchComparisonOptions;
  fillMissingDatapoints?: boolean;
  allowComputedMetrics?: boolean;
};

type ResolvedMakeRAQIV2RequestOptions = Omit<MakeRAQIV2RequestOptions, 'allowComputedMetrics'> & {
  allowComputedMetrics: boolean;
};

export const SupportedGranularitiesForFillMissingDatapoints = [
  RAQIV2MetricGranularity.OneMinute,
  RAQIV2MetricGranularity.OneHour,
  RAQIV2MetricGranularity.HalfHour,
  RAQIV2MetricGranularity.OneDay,
  RAQIV2MetricGranularity.OneWeek,
] as const;
type TSupportedGranularitiesForFillMissingDatapoints =
  (typeof SupportedGranularitiesForFillMissingDatapoints)[number];

const isSupportedGranularityForFillMissingDatapoints = (
  granularity: RAQIV2MetricGranularity,
): granularity is TSupportedGranularitiesForFillMissingDatapoints => {
  return isValidArrayEnumValue(SupportedGranularitiesForFillMissingDatapoints, granularity);
};

const granularityToMilliseconds: Record<TSupportedGranularitiesForFillMissingDatapoints, number> = {
  [RAQIV2MetricGranularity.OneMinute]: 1000 * 60,
  [RAQIV2MetricGranularity.OneHour]: 1000 * 60 * 60,
  [RAQIV2MetricGranularity.HalfHour]: 1000 * 60 * 30,
  [RAQIV2MetricGranularity.OneDay]: 1000 * 60 * 60 * 24,
  [RAQIV2MetricGranularity.OneWeek]: 1000 * 60 * 60 * 24 * 7,
};

const getValueType = (metric: TRAQIV2APIMetric): RAQIV2MetricValueType => {
  return getAnalyticsMetricDisplayConfig(getUIMetric(metric)).valueType;
};

const createDefaultDataPoint = (
  time: Date,
  valueType: RAQIV2MetricValueType,
): AnalyticsQueryGatewayAPIDataPoint => {
  switch (valueType) {
    case RAQIV2MetricValueType.Numeric:
      return {
        time: time.toISOString(),
        value: 0,
      };
    case RAQIV2MetricValueType.String:
    case RAQIV2MetricValueType.StringArray:
      return {
        time: time.toISOString(),
        stringValues: [],
      };
    default: {
      const exhaustiveCheck: never = valueType;
      throw new Error(`Unsupported value type: ${exhaustiveCheck}`);
    }
  }
};

const generateTimestamps = (
  startTime: Date,
  endTime: Date,
  granularity: TSupportedGranularitiesForFillMissingDatapoints,
): Date[] => {
  const timeSpan = granularityToMilliseconds[granularity];
  const timestamps: Date[] = [];
  const current = new Date(startTime);

  while (current <= endTime) {
    timestamps.push(new Date(current));
    current.setTime(current.getTime() + timeSpan);
  }

  return timestamps;
};

const findLatestTimestampInResponse = (
  mainResponse: RAQIV2QueryResultWithComparison,
  totalResponse: RAQIV2QueryResultWithComparison | undefined | null,
): Date | null => {
  let latestTimestamp: Date | null = null;

  // Collect timestamps from all response types
  const responses = [
    mainResponse.result,
    mainResponse.comparisonResult,
    totalResponse?.result,
    totalResponse?.comparisonResult,
  ].filter((response): response is RAQIV2QueryResult => response != null);

  responses.forEach((response) => {
    response.values?.forEach((metricValue) => {
      metricValue.dataPoints?.forEach((dataPoint) => {
        if (dataPoint.time) {
          const currentTimestamp = new Date(dataPoint.time);
          if (latestTimestamp === null || currentTimestamp > latestTimestamp) {
            latestTimestamp = currentTimestamp;
          }
        }
      });
    });
  });

  return latestTimestamp;
};

export const determineLatestAvailableTime = (
  metricMetadata: RAQIV2MetricMetadataResult | null,
): Date | undefined => {
  if (!metricMetadata) {
    return undefined;
  }

  const latestAvailableTimes =
    metricMetadata.metadata
      ?.map((m) => (m.latestAvailableTime ? new Date(m.latestAvailableTime) : null))
      .filter((time): time is Date => time !== null) || [];

  if (latestAvailableTimes.length > 0) {
    const latestAvailableOnAllSeries = new Date(
      Math.min(...latestAvailableTimes.map((t) => t.getTime())),
    );
    return latestAvailableOnAllSeries;
  }
  return undefined;
};

const determineFillEndTime = (
  metricMetadata: RAQIV2MetricMetadataResult | null,
  requestedEndTime: Date,
  mainResponse: RAQIV2QueryResultWithComparison,
  totalResponse: RAQIV2QueryResultWithComparison | undefined | null,
): Date | null => {
  const latestAvailableOnAllSeries = determineLatestAvailableTime(metricMetadata);
  if (latestAvailableOnAllSeries) {
    return new Date(Math.min(requestedEndTime.getTime(), latestAvailableOnAllSeries.getTime()));
  }

  // Fallback: use the latest timestamp from actual response data if metadata unavailable/failed
  const latestResponseTimestamp = findLatestTimestampInResponse(mainResponse, totalResponse);
  if (latestResponseTimestamp) {
    return new Date(Math.min(requestedEndTime.getTime(), latestResponseTimestamp.getTime()));
  }

  return null;
};

const fillMissingDataPoints = (
  result: RAQIV2QueryResult | null,
  startTime: Date,
  endTime: Date,
  granularity: RAQIV2MetricGranularity,
  metrics: TRAQIV2APIMetric[],
): RAQIV2QueryResult | null => {
  if (!result?.values || !isSupportedGranularityForFillMissingDatapoints(granularity)) {
    return result;
  }

  const allRequiredTimestamps = generateTimestamps(startTime, endTime, granularity);

  try {
    const updatedValues = result.values.map((metricValue) => {
      const existingTimestamps = new Set(
        metricValue.dataPoints
          ?.map((dp) => (dp.time ? new Date(dp.time).getTime() : null))
          .filter((time): time is number => time !== null) || [],
      );

      const missingTimestamps = allRequiredTimestamps.filter(
        (timestamp) => !existingTimestamps.has(timestamp.getTime()),
      );

      if (missingTimestamps.length === 0) {
        return metricValue;
      }

      const valueType = getValueType(metrics[0]);
      if (!metrics.every((m) => getValueType(m) === valueType)) {
        logAnalyticsError('All metrics must have the same value type to fill missing data points');
        throw new Error();
      }

      const newDataPoints = missingTimestamps.map((timestamp) =>
        createDefaultDataPoint(timestamp, valueType),
      );

      // Combine existing and new data points, then sort by time
      const allDataPoints = [...(metricValue.dataPoints || []), ...newDataPoints].sort((a, b) => {
        const timeA = a.time ? new Date(a.time).getTime() : 0;
        const timeB = b.time ? new Date(b.time).getTime() : 0;
        return timeA - timeB;
      });

      return {
        ...metricValue,
        dataPoints: allDataPoints,
      };
    });

    return {
      ...result,
      values: updatedValues,
    };
  } catch {
    return result;
  }
};

const fillMissingDataPointsForResponse = (
  snappedRequestBase: RAQIV2CombinedUIQueryRequestWithoutMetric,
  metricMetadata: RAQIV2MetricMetadataResult | null,
  mainResponse: RAQIV2QueryResultWithComparison,
  totalResponse: RAQIV2QueryResultWithComparison | undefined | null,
  fetchComparison: { seriesIntervalMeaning: SeriesIntervalMeaning } | undefined,
  granularity: RAQIV2MetricGranularity,
  allAPIMetrics: TRAQIV2APIMetric[],
): RAQIV2QueryResponses => {
  const {
    timeSpec: { startTime, endTime },
  } = snappedRequestBase;
  const fillEndTime = determineFillEndTime(metricMetadata, endTime, mainResponse, totalResponse);

  if (!fillEndTime) {
    return {
      response: mainResponse.result,
      comparisonResponse: mainResponse.comparisonResult,
      totalSeriesResponse: totalResponse?.result ?? undefined,
      totalSeriesComparisonResponse: totalResponse?.comparisonResult,
    };
  }

  let comparisonFillStartTime = startTime;
  let comparisonFillEndTime = fillEndTime;

  if (fetchComparison) {
    const { comparisonStartDate, comparisonEndDate } = getComparisonTimeRange(
      startTime,
      endTime,
      fetchComparison.seriesIntervalMeaning,
    );
    comparisonFillStartTime = comparisonStartDate;
    comparisonFillEndTime = new Date(Math.min(fillEndTime.getTime(), comparisonEndDate.getTime()));
  }

  return {
    response: fillMissingDataPoints(
      mainResponse.result,
      startTime,
      fillEndTime,
      granularity,
      allAPIMetrics,
    ),
    comparisonResponse: fillMissingDataPoints(
      mainResponse.comparisonResult ?? null,
      comparisonFillStartTime,
      comparisonFillEndTime,
      granularity,
      allAPIMetrics,
    ) as RAQIV2QueryResult | undefined,
    totalSeriesResponse: fillMissingDataPoints(
      totalResponse?.result ?? null,
      startTime,
      fillEndTime,
      granularity,
      allAPIMetrics,
    ) as RAQIV2QueryResult | undefined,
    totalSeriesComparisonResponse: fillMissingDataPoints(
      totalResponse?.comparisonResult ?? null,
      comparisonFillStartTime,
      comparisonFillEndTime,
      granularity,
      allAPIMetrics,
    ) as RAQIV2QueryResult | undefined,
  };
};

const makeMainAndTotalRequestsForMetricFanout = async (
  snappedRequestBase: RAQIV2CombinedUIQueryRequestWithoutMetric,
  apiMetrics: ApiMetricWithBreakdown[],
  clients: CombinedAPIClientWrapper,
  options: MakeRAQIV2RequestOptions,
  totalRequest: Promise<RAQIV2QueryResultWithComparison | null> | undefined,
): Promise<{
  mainResponse: RAQIV2QueryResultWithComparison;
  totalResponse: RAQIV2QueryResultWithComparison | undefined | null;
}> => {
  // No apiBreakdown possible for metric fanout breakdowns
  const [totalResponse, ...mainResponses] = await Promise.all([
    totalRequest,
    ...apiMetrics.map(({ apiMetric }) =>
      makeRequestByComparisonOption(
        getRequestWithMetric(snappedRequestBase, apiMetric),
        clients,
        options.fetchComparison,
      ),
    ),
  ]);
  const mainResponse = combineResponesFromFanoutBreakdown(mainResponses, apiMetrics);
  return { mainResponse, totalResponse };
};

const processUngroupedOtherResponse = (
  otherResponse: RAQIV2QueryResult | undefined | null,
  otherTopNApiFilters: RAQIV2APIQueryFilter[],
): RAQIV2QueryResult | null => {
  if (!otherResponse) {
    return null;
  }
  // We want to find the "total" series from the otherResponse
  //  (which should be the only series since we passed no breakdown to the API)
  // and then add an 'Other' breakdown value for all the dimensions in otherTopNApiFilters
  const totalSeries = otherResponse.values?.find((value) => !value.breakdownValue?.length);
  if (!totalSeries) {
    return null;
  }
  const otherBreakdownValue = otherTopNApiFilters.map(({ dimension }) => ({
    dimension,
    value: 'Other',
  }));
  const otherSeries = {
    ...totalSeries,
    breakdownValue: otherBreakdownValue,
  };
  return { values: [otherSeries] };
};

const processUngroupedOtherResultWithComparison = (
  otherResponse: RAQIV2QueryResultWithComparison | null,
  otherTopNApiFilters: RAQIV2APIQueryFilter[],
): RAQIV2QueryResultWithComparison => {
  if (!otherResponse) {
    return { result: null };
  }
  const otherResult = processUngroupedOtherResponse(otherResponse.result, otherTopNApiFilters);
  const otherComparisonResult = processUngroupedOtherResponse(
    otherResponse.comparisonResult,
    otherTopNApiFilters,
  );
  return {
    result: otherResult,
    comparisonResult: otherComparisonResult ?? undefined,
  };
};

const makeMainRequestAndOtherRequest = async (
  snappedRequestBase: RAQIV2CombinedUIQueryRequestWithoutMetric,
  apiMetric: TRAQIV2APIMetric,
  clients: CombinedAPIClientWrapper,
  options: MakeRAQIV2RequestOptions,
  totalRequest: Promise<RAQIV2QueryResultWithComparison | null> | undefined,
  topNApiFilters: RAQIV2APIQueryFilter[],
  otherTopNApiFilters: RAQIV2APIQueryFilter[],
): Promise<{
  mainResponse: RAQIV2QueryResultWithComparison;
  totalResponse: RAQIV2QueryResultWithComparison | undefined | null;
}> => {
  // No apiBreakdown possible for topN breakdowns
  //  (this would only matter if we supported multiple breakdowns)
  const mainFilters = [...(snappedRequestBase?.filter ?? []), ...topNApiFilters];
  const otherFilters = [...(snappedRequestBase?.filter ?? []), ...otherTopNApiFilters];

  // Only fetch "other" if there are any dimensions that want it (showOther === true)
  const shouldFetchOther = otherTopNApiFilters.length > 0;

  const [totalResponse, mainResponsePrimary, otherResponseUngrouped] = await Promise.all([
    totalRequest,
    makeRequestByComparisonOption(
      getRequestWithMetric({ ...snappedRequestBase, filter: mainFilters }, apiMetric),
      clients,
      options.fetchComparison,
    ),
    shouldFetchOther
      ? makeRequestByComparisonOption(
          getRequestWithMetric(
            { ...snappedRequestBase, breakdown: undefined, filter: otherFilters },
            apiMetric,
          ),
          clients,
        )
      : Promise.resolve({ result: null }),
  ]);

  const otherResponse = shouldFetchOther
    ? processUngroupedOtherResultWithComparison(otherResponseUngrouped, otherTopNApiFilters)
    : { result: null };

  const mainResponse = combineResponseFromTopNBreakdown(mainResponsePrimary, otherResponse);
  return { mainResponse, totalResponse };
};

const maybeRemoveBreakdownValueForTotalSeries = (result: RAQIV2QueryResult) => {
  return {
    values: result.values?.map((value) => {
      // Total series for a duration request relies on duration bucket dimension breakdown values to construct data points.
      // We should remove the breakdown value if it's not a duration request.
      // But if it's a duration request, meaning its respone values contain duration bucket dimension breakdown values, we should keep them.
      const breakdownValue =
        value.breakdownValue?.filter(
          ({ dimension }) =>
            dimension &&
            isValidEnumValue(RAQIV2Dimension, dimension) &&
            isDurationBucketDimension(dimension),
        ) ?? [];

      return {
        ...value,
        breakdownValue,
      };
    }),
  };
};

const buildTotalRequestIfNecessary = (
  snappedRequestBase: RAQIV2CombinedUIQueryRequestWithoutMetric,
  metricForTotalSeries: TRAQIV2APIMetric,
  clients: CombinedAPIClientWrapper,
  options: MakeRAQIV2RequestOptions,
  apiBreakdown: RAQIV2Dimension[],
  metricFanoutPseudoBreakdown: MetricFanoutPseudoDimensionInfo[],
): Promise<RAQIV2QueryResultWithComparison | null> | undefined => {
  // A request for metric used in duration chart requires one of its breakdowns to be a duration bucket dimension.
  // That duration bucket dimension values are used as intervals on the chart's x-axis as opposed to timestamp in a time series chart.
  // If the request is for metric with a duration context, i.e. contains a duration bucket dimension in its breakdown, we should filter them out
  // when checking if we should fetch total series.
  const durationBreakdowns: TDurationBucketDimension[] = [];
  const nonDurationBreakdowns: RAQIV2Dimension[] = [];
  apiBreakdown.forEach((dimension) => {
    if (isDurationBucketDimension(dimension)) {
      durationBreakdowns.push(dimension);
    } else {
      nonDurationBreakdowns.push(dimension);
    }
  });

  const shouldFetchTotal =
    options.fetchTotalSeries &&
    (nonDurationBreakdowns.length || metricFanoutPseudoBreakdown.length);

  return shouldFetchTotal
    ? catchRequestFail(
        makeRequestByComparisonOption(
          getRequestWithMetric(
            {
              ...snappedRequestBase,
              breakdown: durationBreakdowns.length ? durationBreakdowns : undefined,
            },
            metricForTotalSeries,
          ),
          clients,
          options.fetchComparison,
        ),
      )
    : undefined;
};

const makeMainAndTotalAndOtherRequests = async (
  snappedRequestBase: RAQIV2CombinedUIQueryRequestWithoutMetric,
  { apiMetrics, metricForTotalSeries }: ApiMetrics,
  apiBreakdown: RAQIV2Dimension[],
  metricFanoutPseudoBreakdown: MetricFanoutPseudoDimensionInfo[],
  clients: CombinedAPIClientWrapper,
  options: MakeRAQIV2RequestOptions,
  topNApiFilters: RAQIV2APIQueryFilter[],
  otherTopNApiFilters: RAQIV2APIQueryFilter[],
): Promise<{
  mainResponse: RAQIV2QueryResultWithComparison;
  totalResponse: RAQIV2QueryResultWithComparison | undefined | null;
}> => {
  const totalRequest = buildTotalRequestIfNecessary(
    snappedRequestBase,
    metricForTotalSeries,
    clients,
    options,
    apiBreakdown,
    metricFanoutPseudoBreakdown,
  );

  if (Array.isArray(apiMetrics)) {
    return makeMainAndTotalRequestsForMetricFanout(
      snappedRequestBase,
      apiMetrics,
      clients,
      options,
      totalRequest,
    );
  }
  if (topNApiFilters.length || otherTopNApiFilters.length) {
    return makeMainRequestAndOtherRequest(
      snappedRequestBase,
      apiMetrics,
      clients,
      options,
      totalRequest,
      topNApiFilters,
      otherTopNApiFilters,
    );
  }

  // Standard flow -- use the apiBreakdown from the given request
  const [mainResponse, totalResponse] = await Promise.all([
    makeRequestByComparisonOption(
      getRequestWithMetric(
        {
          ...snappedRequestBase,
          breakdown: apiBreakdown,
        },
        apiMetrics,
      ),
      clients,
      options.fetchComparison,
    ),
    totalRequest,
  ]);

  // Note: when breakdown by FanoutMetric is first selected, breakdownValue is cached in the response.
  // need to clear the breakdownValue when the same request is sent as a total series request.
  if (totalResponse) {
    const { comparisonResult, result } = totalResponse;
    return {
      mainResponse,
      totalResponse: {
        comparisonResult: comparisonResult
          ? maybeRemoveBreakdownValueForTotalSeries(comparisonResult)
          : comparisonResult,
        result: result ? maybeRemoveBreakdownValueForTotalSeries(result) : result,
      },
    };
  }

  return { mainResponse, totalResponse };
};

const getTopNRequestTimeRange = (
  limitTimeRange: TUIPseudoDimensionTopNBreakdownConfig['limitTimeRange'],
  {
    timeSpec: { startTime: givenStartTime, endTime: givenEndTime },
  }: Pick<RAQIV2CombinedUIQueryRequestWithoutMetric, 'timeSpec'>,
): { startTime: Date; endTime: Date } => {
  if (limitTimeRange === 'query') {
    return { startTime: new Date(givenStartTime), endTime: new Date(givenEndTime) };
  }
  const startTime = new Date(givenStartTime);
  startTime.setDate(startTime.getDate() - limitTimeRange.previousDays);
  return { startTime, endTime: new Date(givenEndTime) };
};

const sortAsNum = (a: string, b: string) => {
  const numA = Number(a);
  const numB = Number(b);
  const isNumA = !Number.isNaN(numA) && Number.isFinite(numA) && a.trim() !== '';
  const isNumB = !Number.isNaN(numB) && Number.isFinite(numB) && b.trim() !== '';
  if (isNumA && isNumB) {
    return numB - numA;
  }
  return a.localeCompare(b);
};

const getBreakdownValueFilterForDimension = (
  result: RAQIV2QueryResult,
  dimension: RAQIV2Dimension,
): RAQIV2APIQueryFilter => {
  const filter: RAQIV2QueryFilter = { dimension, values: [] };
  result.values?.forEach(({ breakdownValue }) => {
    const value = breakdownValue?.find(({ dimension: d }) => d === dimension)?.value;
    if (value) {
      filter.values.push(value);
    }
  });
  return filter as RAQIV2APIQueryFilter;
};

const processTopNBreakdowns = async (
  topNPseudoBreakdown: TopNPseudoBreakdownDimensionInfo[],
  clients: CombinedAPIClientWrapper,
  baseRequest: RAQIV2CombinedUIQueryRequest,
): Promise<{
  breakdown: RAQIV2Dimension[];
  mainFilters: RAQIV2APIQueryFilter[];
  otherFilters: RAQIV2APIQueryFilter[];
}> => {
  const requests = topNPseudoBreakdown.map(
    async ({ config: { filterAndBreakdownDimension, orderConfig, limitTimeRange, n } }) => {
      const { startTime, endTime } = getTopNRequestTimeRange(limitTimeRange, baseRequest);

      // Use orderConfig if available, otherwise fall back to label-based ordering
      if (!orderConfig?.metric) {
        // No order metric specified - use label-based ordering (alphabetical)
        const res = await makeQuery(
          clients,
          timeSpecToQueryTime({
            ...baseRequest,
            breakdown: [filterAndBreakdownDimension],
          }),
        );
        const resultFilters = getBreakdownValueFilterForDimension(res, filterAndBreakdownDimension);
        return {
          ...resultFilters,
          values: resultFilters.values.sort(sortAsNum).slice(0, n),
        };
      }

      // Build filters: combine base filters with optional filters from orderConfig
      const orderFilters = [
        ...(baseRequest.filter ?? []),
        ...((orderConfig.filters ?? []) as RAQIV2APIQueryFilter[]),
      ];

      // Query the API to get top N values based on the ordering metric
      const orderRequest = {
        ...baseRequest,
        breakdown: [filterAndBreakdownDimension],
        metric: orderConfig.metric,
        granularity: RAQIV2MetricGranularity.None,
        limit: n,
        filter: orderFilters.length > 0 ? orderFilters : undefined,
        startTime,
        endTime,
      };

      const orderResult = await makeQuery(
        clients,
        timeSpecToQueryTime(getRequestWithMetric(orderRequest, orderConfig.metric)),
      );

      // Extract top N dimension values from the result, preserving ranking order
      return getBreakdownValueFilterForDimension(orderResult, filterAndBreakdownDimension);
    },
  );
  const mainFilters = await Promise.all(requests);

  // Only create "other" filters for dimensions that have showOther === true
  const otherFilters: RAQIV2APIQueryFilter[] = [];
  mainFilters.forEach((filter, index) => {
    const shouldShowOther = topNPseudoBreakdown[index].config.showOther;
    if (shouldShowOther && filter.values.length > 0) {
      otherFilters.push({ ...filter, operation: RAQIV2FilterOperation.NotContains });
    }
  });

  const breakdown = topNPseudoBreakdown.map(
    ({ config: { filterAndBreakdownDimension } }) => filterAndBreakdownDimension,
  );
  return { breakdown, mainFilters, otherFilters };
};

const makeComputedMetricRequest = async ({
  queryRequest,
  snappedTimeSpec,
  metric,
  clients,
}: {
  queryRequest: RAQIV2UIQueryRequest;
  snappedTimeSpec: ExactRAQIV2UIQueryRequest<RAQIV2UIQueryRequest>['timeSpec'];
  metric: Parameters<typeof buildComputedMetricDag>[0]['metric'];
  clients: CombinedAPIClientWrapper;
}): Promise<RAQIV2QueryResponses> => {
  let dagRequest: ReturnType<typeof buildComputedMetricDag>;
  try {
    dagRequest = buildComputedMetricDag({
      ...queryRequest,
      timeSpec: snappedTimeSpec,
      metric,
    });
  } catch (error) {
    logAnalyticsError(
      `Failed to build computed metric DAG: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
    throw error;
  }
  const response = await executeComputedMetricDag(clients, dagRequest);
  return {
    response,
  };
};

type RequestMetricSelection =
  | {
      kind: 'standard';
      metric: TRAQIV2UIMetric;
    }
  | {
      kind: 'computed';
      metric: ComputedMetric;
    };

const resolveRequestMetricSelection = (
  metric: MetricLike<TRAQIV2UIMetric>,
  { allowComputedMetrics }: { allowComputedMetrics: boolean },
): RequestMetricSelection => {
  if (isComputedMetric(metric)) {
    if (!allowComputedMetrics) {
      throw new Error('Computed metrics are disabled for this request');
    }
    return {
      kind: 'computed',
      metric,
    };
  }
  return {
    kind: 'standard',
    metric,
  };
};

const makeRAQIV2Request = async (
  queryRequest: RAQIV2UIQueryRequest,
  clients: CombinedAPIClientWrapper,
  options: ResolvedMakeRAQIV2RequestOptions,
): Promise<RAQIV2QueryResponses> => {
  const {
    metric: givenMetric,
    breakdown: givenBreakdown,
    filter: givenFilters,
    timeSpec: givenTimeSpec,
    resource,
    granularity,
    limit,
  }: ExactRAQIV2UIQueryRequest<RAQIV2UIQueryRequest> = queryRequest;
  const { fetchComparison, fillMissingDatapoints: fillMissingDatapointsForMetric } = options;
  const snappedTimeSpec = {
    ...givenTimeSpec,
    startTime: snapToLatestStartTime(
      givenTimeSpec.startTime,
      givenTimeSpec.snapGranularity ?? granularity,
    ),
    endTime: snapToLatestEndTime(
      givenTimeSpec.endTime,
      givenTimeSpec.snapGranularity ?? granularity,
    ),
  };
  const metricSelection = resolveRequestMetricSelection(givenMetric, {
    allowComputedMetrics: options.allowComputedMetrics,
  });

  if (metricSelection.kind === 'computed') {
    return makeComputedMetricRequest({
      queryRequest,
      snappedTimeSpec,
      metric: metricSelection.metric,
      clients,
    });
  }
  const { metric } = metricSelection;

  // Handle pseudo-metrics and pseudo-dimensions
  const {
    apiBreakdown: apiBreakdownBase,
    topNPseudoBreakdown,
    metricFanoutPseudoBreakdown,
    otherSeriesBreakdown,
  } = processBreakdownPseudoDimensions(givenBreakdown);
  const {
    apiFilters,
    metricFanoutPseudoFilters,
    otherSeriesFilters,
    otherSeriesNotContainsFilters,
  } = processFilterPseudoDimensions(givenFilters, otherSeriesBreakdown);
  const { apiMetrics, metricForTotalSeries, allAPIMetrics } = getApiMetrics(
    metric,
    metricFanoutPseudoFilters,
    metricFanoutPseudoBreakdown,
  );

  // Handle metadata call in parallel if data filling is enabled
  const shouldFillMissingDatapoints =
    fillMissingDatapointsForMetric && isSupportedGranularityForFillMissingDatapoints(granularity);
  const metricMetadataPromise = shouldFillMissingDatapoints
    ? fetchMetricMetadata(clients, { metrics: allAPIMetrics })
    : Promise.resolve(null);

  const snappedRequestBase: RAQIV2CombinedUIQueryRequestWithoutMetric = {
    resource,
    limit,
    granularity, // start and end time will be overridden
    filter: apiFilters.length ? apiFilters : undefined,
    timeSpec: snappedTimeSpec,
  };
  const {
    breakdown: topNApiBreakdowns,
    mainFilters: topNApiFilters,
    otherFilters: otherTopNApiFilters,
  } = await processTopNBreakdowns(topNPseudoBreakdown, clients, {
    ...snappedRequestBase,
    metric: metricForTotalSeries,
  });

  // Do not make the request if there are no values.
  if (topNApiFilters.some((filter) => filter.values.length === 0)) {
    return {
      response: { values: [] },
    };
  }

  const apiBreakdown = [...apiBreakdownBase, ...topNApiBreakdowns];
  snappedRequestBase.breakdown = apiBreakdown || undefined;

  // we need to have the main request contain the additional filters
  // but not any total request
  const [{ mainResponse, totalResponse }, metricMetadata] = await Promise.all([
    makeMainAndTotalAndOtherRequests(
      snappedRequestBase,
      { apiMetrics, metricForTotalSeries, allAPIMetrics },
      apiBreakdown,
      metricFanoutPseudoBreakdown,
      clients,
      options,
      topNApiFilters.concat(otherSeriesFilters),
      otherTopNApiFilters.concat(otherSeriesNotContainsFilters),
    ),
    metricMetadataPromise,
  ]);

  // Apply data filling if enabled (with transparent fallback on metadata failure)
  if (shouldFillMissingDatapoints) {
    return fillMissingDataPointsForResponse(
      snappedRequestBase,
      metricMetadata,
      mainResponse,
      totalResponse,
      fetchComparison,
      granularity,
      allAPIMetrics,
    );
  }

  return {
    response: mainResponse.result,
    comparisonResponse: mainResponse.comparisonResult,
    totalSeriesResponse: totalResponse?.result ?? undefined,
    totalSeriesComparisonResponse: totalResponse?.comparisonResult,
  };
};

export default makeRAQIV2Request;
