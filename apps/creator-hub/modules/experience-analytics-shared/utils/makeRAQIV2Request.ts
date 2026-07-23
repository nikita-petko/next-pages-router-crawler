import {
  NodeType as AceNodeType,
  ResourceType as AceResourceType,
  VariantKind,
} from '@rbx/client-analytics-query-gateway/v1';
import type {
  TRAQIV2APIMetric,
  TRAQIV2Dimension,
  TRAQIV2UIMetric,
  TRAQIV2UIMetricFanoutDimensionValues,
  TUIPseudoDimensionMetricFanoutConfig,
  TUIPseudoDimensionTopNBreakdownConfig,
} from '@rbx/creator-hub-analytics-config';
import {
  RAQIV2AggregationType,
  RAQIV2DateRangeType,
  RAQIV2Dimension,
  RAQIV2DimensionDisplayConfig,
  RAQIV2Metric,
  RAQIV2MetricGranularity,
  RAQIV2MetricValueType,
  RAQIV2PercentileType,
  RAQIV2UIPseudoDimension,
  RAQIV2UIPseudoDimensionType,
} from '@rbx/creator-hub-analytics-config';
import logAnalyticsError from '@modules/charts-generic/utils/logAnalyticsError';
import type {
  AnalyticsQueryGatewayExecuteDagRequest,
  AnalyticsQueryGatewayAPIQueryResult as RAQIV2QueryResult,
  AnalyticsQueryGatewayGetDimensionValuesRequest as RAQIV2GetDimensionValuesRequest,
  AnalyticsQueryGatewayAPIDimensionValuesResult as RAQIV2DimensionValuesResult,
  AnalyticsQueryGatewayGetMetricMetadataRequest as RAQIV2GetMetricMetadataRequest,
  AnalyticsQueryGatewayAPIMetricMetadataResult as RAQIV2MetricMetadataResult,
} from '@modules/clients/analytics/analyticsQueryGateway';
import { AnalyticsQueryGatewayAPIFilterOperation as RAQIV2FilterOperation } from '@modules/clients/analytics/analyticsQueryGateway';
import type {
  AnalyticsQueryGatewayClientWrapper,
  AnalyticsQueryGatewayAPIDataPoint,
} from '@modules/clients/analytics/analyticsQueryGateway';
import type {
  QueryFilter as RAQIV2APIQueryFilter,
  TQueryFilter as RAQIV2QueryFilter,
} from '@modules/clients/analytics/analyticsRAQIShared';
import {
  mapChartResourceTypeToTargetResourceType,
  type RAQIV2CombinedAPIQueryRequest,
} from '@modules/clients/analytics/analyticsRAQIShared';
import { isValidEnumValue, isValidArrayEnumValue } from '@modules/miscellaneous/utils/enumUtils';
import getAnalyticsMetricDisplayConfig from '../constants/AnalyticsMetricDisplayConfig';
import type { TComparisonOffset } from '../constants/comparisonOffset';
import type { TDurationBucketDimension } from '../constants/RAQIV2DurationBucketDimensions';
import { isDurationBucketDimension } from '../constants/RAQIV2DurationBucketDimensions';
import { DEFAULT_COMPARISON_CONFIG, type ComparisonRangePolicy } from '../types/ComparisonConfig';
import {
  getUIMetricFromAtomicMetricLike,
  isComputedMetric,
  isCustomEventsAtomicMetricLike,
  type AtomicMetricLike,
  type ComputedMetric,
  type MetricLike,
} from '../types/ComputedMetric';
import { breakdownDimensionsWithOtherSeries } from '../types/RAQIV2BreakdownDimensionsWithOtherSeries';
import type {
  ExactRAQIV2UIQueryRequest,
  RAQIV2CombinedUIQueryRequest,
  RAQIV2CombinedUIQueryRequestWithoutMetric,
  RAQIV2UIQueryRequest,
} from '../types/RAQIV2UIQueryRequest';
import type { RAQIV2QueryResponses } from './combineRAQIV2QueryResponses';
import {
  buildComputedMetricDag,
  MAIN_OUTPUT_NODE_ID,
} from './computedMetrics/buildComputedMetricDag';
import { PRESET_DATE_RANGE_DURATION_MS } from './dateRangeUtils';
import { getAPIMetricFromUIMetric } from './getAPIMetricFromUIMetric';
import getComparisonRange from './getComparisonRange';
import { getUIMetric } from './getUIMetric';
import isComparisonRangeAllowed from './isComparisonRangeAllowed';
import makeACERequest from './makeACERequest';
import sliceRAQIV2QueryResultByTimeRange from './sliceRAQIV2QueryResultByTimeRange';
import { snapToLatestEndTime, snapToLatestStartTime } from './snapToLatestTimestep';
import VariantFanoutDagExecutionError from './VariantFanoutDagExecutionError';

export const enum FetchComparisonSeriesMode {
  Separate = 'Separate',
  Combined = 'Combined', // Save extra api calls by fetching the entire time series at once
}

export type FetchComparisonOptions = {
  mode: FetchComparisonSeriesMode;
  granularity: RAQIV2MetricGranularity;
  /**
   * Applies to all consumers of the comparison response, including summary
   * chips and in-chart series. Defaults to `shortRangeOnly`.
   */
  rangePolicy?: ComparisonRangePolicy;
  relativeOffset?: TComparisonOffset;
  customStartDate?: Date;
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

const buildSnappedTimeSpec = (
  givenTimeSpec: ExactRAQIV2UIQueryRequest<RAQIV2UIQueryRequest>['timeSpec'],
  snapGranularity: RAQIV2MetricGranularity,
  latestAvailableTime?: Date,
): ExactRAQIV2UIQueryRequest<RAQIV2UIQueryRequest>['timeSpec'] => {
  let startTime = givenTimeSpec.startTime;
  let endTime = givenTimeSpec.endTime;

  const presetDuration = PRESET_DATE_RANGE_DURATION_MS[givenTimeSpec.rangeType];
  if (
    latestAvailableTime &&
    givenTimeSpec.rangeType !== RAQIV2DateRangeType.Custom &&
    presetDuration !== undefined &&
    latestAvailableTime.getTime() < endTime.getTime()
  ) {
    endTime = latestAvailableTime;
    startTime = new Date(endTime.getTime() - presetDuration);
  }

  return {
    ...givenTimeSpec,
    rangeType: RAQIV2DateRangeType.Custom,
    startTime: snapToLatestStartTime(startTime, snapGranularity),
    endTime: snapToLatestEndTime(endTime, snapGranularity),
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
  granularity: RAQIV2MetricGranularity,
  relativeOffset?: TComparisonOffset,
  customStartDate?: Date,
): Promise<RAQIV2QueryResultWithComparison> => {
  const { comparisonStartDate, comparisonEndDate } = getComparisonRange(
    request.timeSpec.startTime,
    request.timeSpec.endTime,
    granularity,
    relativeOffset,
    customStartDate,
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
  granularity: RAQIV2MetricGranularity,
  relativeOffset?: TComparisonOffset,
  customStartDate?: Date,
): Promise<RAQIV2QueryResultWithComparison> => {
  const { comparisonStartDate, comparisonEndDate } = getComparisonRange(
    request.timeSpec.startTime,
    request.timeSpec.endTime,
    granularity,
    relativeOffset,
    customStartDate,
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
      return fetchSeparateComparisonSeries(
        request,
        clients,
        comparison.granularity,
        comparison.relativeOffset,
        comparison.customStartDate,
      );
    case FetchComparisonSeriesMode.Combined:
      // None-granularity (cumulative) responses stamp a single aggregate point
      // that can land slightly outside the primary window. Combined mode slices
      // that window client-side and can drop the only point → 0 summaries.
      // Fall back to Separate so the primary query is returned unsliced.
      if (comparison.granularity === RAQIV2MetricGranularity.None) {
        return fetchSeparateComparisonSeries(
          request,
          clients,
          comparison.granularity,
          comparison.relativeOffset,
          comparison.customStartDate,
        );
      }
      return fetchCombinedComparisonSeries(
        request,
        clients,
        comparison.granularity,
        comparison.relativeOffset,
        comparison.customStartDate,
      );
    default: {
      const exhaustiveCheck: never = comparison.mode;
      throw new Error(`Unhandled comparison fetch mode ${String(exhaustiveCheck)}`);
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

const averagePercentileValue: string = RAQIV2PercentileType.AVG;

const toScreamingSnakeCase = (value: string): string =>
  value
    .replaceAll(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replaceAll(/[^A-Za-z0-9]+/g, '_')
    .toUpperCase()
    .replaceAll(/^_+|_+$/g, '');

const getStableVariantKey = (dimension: RAQIV2UIPseudoDimension, value: string): string => {
  const normalized = toScreamingSnakeCase(value);
  if (normalized === averagePercentileValue || normalized === 'AVERAGE') {
    return 'AVERAGE';
  }

  if (dimension === RAQIV2UIPseudoDimension.PercentileType) {
    const percentileMatch = /^P?(\d+)$/.exec(normalized);
    if (percentileMatch) {
      return `P${percentileMatch[1]}`;
    }
    return normalized;
  }

  return normalized;
};

const getVariantKind = (dimension: RAQIV2UIPseudoDimension): VariantKind | null => {
  if (dimension === RAQIV2UIPseudoDimension.PercentileType) {
    return VariantKind.Percentile;
  }
  if (dimension === RAQIV2UIPseudoDimension.AggregationType) {
    return VariantKind.Aggregation;
  }
  return null;
};

type VariantDisplayMap = Map<RAQIV2UIPseudoDimension, Map<string, string>>;

// Build the inbound `stableKey -> catalog display value` map by inverting the
// SAME `supportedDimensionValues` catalog used to construct the outbound
// request keys (`getStableVariantKey`). Deriving both directions from one
// source means a new catalog value (e.g. an added percentile) can never drift
// between the keys we send to ACE and the labels we render, and removes the
// separate hand-maintained key tables that previously had to be kept in sync.
const buildVariantDisplayMap = (
  metricFanoutPseudoBreakdown: MetricFanoutPseudoDimensionInfo[],
): VariantDisplayMap => {
  const displayMap: VariantDisplayMap = new Map();
  for (const { dimension, config } of metricFanoutPseudoBreakdown) {
    const keyToDisplay = displayMap.get(dimension) ?? new Map<string, string>();
    for (const value of config.supportedDimensionValues) {
      keyToDisplay.set(getStableVariantKey(dimension, value), value);
    }
    displayMap.set(dimension, keyToDisplay);
  }
  return displayMap;
};

// ACE tags each variant series with a stable `variantKey` and mirrors it into
// `value` (see ACE's `BuildVariantBreakdownValue`). We remap `value` to the
// catalog display value the rest of the FE/translation layer expects — keyed
// by the stable key via `variantDisplayMap` — and drop `variantKey` so
// normalized rows match the legacy fanout shape (`dimension` + `value` only).
// Unknown keys soft-fail: logged once per (dimension, key) and rendered as the
// raw key for debuggability rather than throwing.
const normalizeVariantBreakdownValues = (
  responses: RAQIV2QueryResponses,
  variantDisplayMap: VariantDisplayMap,
): RAQIV2QueryResponses => {
  const loggedUnknownKeys = new Set<string>();
  const normalizeResult = (
    result: RAQIV2QueryResult | null | undefined,
  ): RAQIV2QueryResult | null | undefined => {
    if (!result?.values) {
      return result;
    }
    return {
      ...result,
      values: result.values.map((metricValue) => ({
        ...metricValue,
        breakdownValue: metricValue.breakdownValue?.map((breakdownValue) => {
          const dimension = breakdownValue.dimension;
          const variantKey =
            'variantKey' in breakdownValue && typeof breakdownValue.variantKey === 'string'
              ? breakdownValue.variantKey
              : undefined;
          if (
            !variantKey ||
            dimension === undefined ||
            !isValidEnumValue(RAQIV2UIPseudoDimension, dimension)
          ) {
            return breakdownValue;
          }

          const displayValue = variantDisplayMap.get(dimension)?.get(variantKey);
          if (displayValue === undefined) {
            const dedupeKey = `${dimension}:${variantKey}`;
            if (!loggedUnknownKeys.has(dedupeKey)) {
              loggedUnknownKeys.add(dedupeKey);
              logAnalyticsError(
                `Unknown ACE metric variant key '${variantKey}' for dimension '${dimension}'`,
              );
            }
          }

          const normalizedBreakdownValue = {
            ...breakdownValue,
            value: displayValue ?? variantKey,
          };
          delete (normalizedBreakdownValue as { variantKey?: string }).variantKey;
          return normalizedBreakdownValue;
        }),
      })),
    };
  };

  const normalizedResponses: RAQIV2QueryResponses = {
    response: normalizeResult(responses.response) ?? null,
  };
  if (responses.comparisonResponse !== undefined) {
    normalizedResponses.comparisonResponse =
      normalizeResult(responses.comparisonResponse) ?? undefined;
  }
  if (responses.totalSeriesResponse !== undefined) {
    normalizedResponses.totalSeriesResponse =
      normalizeResult(responses.totalSeriesResponse) ?? undefined;
  }
  if (responses.totalSeriesComparisonResponse !== undefined) {
    normalizedResponses.totalSeriesComparisonResponse =
      normalizeResult(responses.totalSeriesComparisonResponse) ?? undefined;
  }
  return normalizedResponses;
};

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
          throw new Error(`Unhandled pseudo dimension type ${String(exhaustiveCheck)}`);
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
          throw new Error(`Unhandled pseudo dimension type ${String(exhaustiveCheck)}`);
        }
      }
    }
    if (isValidEnumValue(RAQIV2Dimension, dimension)) {
      const apiQueryFilter: RAQIV2APIQueryFilter = { ...filter, dimension };
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
  fanoutBreakdownDimension?: RAQIV2UIPseudoDimension;
  fanoutBreakdownValue?: string;
};

type ApiMetrics = {
  apiMetrics: ApiMetricWithBreakdown[] | TRAQIV2APIMetric;
  metricForTotalSeries: TRAQIV2APIMetric;
  allAPIMetrics: TRAQIV2APIMetric[];
};

export const buildFanoutDimensionValues = (
  dimension: RAQIV2UIPseudoDimension,
  filterValue: string,
): TRAQIV2UIMetricFanoutDimensionValues => {
  return {
    percentile:
      dimension === RAQIV2UIPseudoDimension.PercentileType &&
      isValidEnumValue(RAQIV2PercentileType, filterValue)
        ? filterValue
        : null,
    aggregationType:
      dimension === RAQIV2UIPseudoDimension.AggregationType &&
      isValidEnumValue(RAQIV2AggregationType, filterValue)
        ? filterValue
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
      percentile: null,
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
            fanoutBreakdownDimension: fanoutDimension.dimension,
            fanoutBreakdownValue: filterValue,
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
      fanoutBreakdownDimension: fanoutDimension.dimension,
      fanoutBreakdownValue: dimensionValue,
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
      const { fanoutBreakdownDimension, fanoutBreakdownValue } = apiMetricsWithBreakdown[index];

      // Inject the fanout pseudo-dimension (e.g. PercentileType) alongside any
      // existing API breakdowns (e.g. SessionTimeBucket for duration charts).
      // Creates a new array to avoid aliased-reference mutation when
      // sliceRAQIV2QueryResultByTimeRange shares breakdownValue across result/comparisonResult.
      // Guard: fanout fields are optional on ApiMetricWithBreakdown because the total-series
      // entry (metricForTotalSeries) is built without them.
      let injectedResponse = response;
      if (fanoutBreakdownDimension && fanoutBreakdownValue) {
        const fanoutBreakdown = {
          dimension: fanoutBreakdownDimension,
          value: fanoutBreakdownValue,
        };
        const appendFanoutBreakdown = <T extends RAQIV2QueryResult | null | undefined>(
          result: T,
        ): T =>
          result?.values
            ? {
                ...result,
                values: result.values.map((v) => ({
                  ...v,
                  breakdownValue: [...(v.breakdownValue ?? []), fanoutBreakdown],
                })),
              }
            : result;
        injectedResponse = {
          ...response,
          result: appendFanoutBreakdown(response.result),
          comparisonResult: appendFanoutBreakdown(response.comparisonResult),
        };
      }

      return {
        result: {
          values: [
            ...(combinedResponse?.result?.values ?? []),
            ...(injectedResponse?.result?.values ?? []),
          ],
        },
        comparisonResult:
          combinedResponse.comparisonResult || injectedResponse.comparisonResult
            ? {
                values: [
                  ...(combinedResponse?.comparisonResult?.values ?? []),
                  ...(injectedResponse?.comparisonResult?.values ?? []),
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
      values: [...(mainResponse?.result?.values ?? []), ...(otherResponse?.result?.values ?? [])],
    },
    comparisonResult:
      mainResponse.comparisonResult || otherResponse.comparisonResult
        ? {
            values: [
              ...(mainResponse?.comparisonResult?.values ?? []),
              ...(otherResponse?.comparisonResult?.values ?? []),
            ],
          }
        : undefined,
  };
};

export type MakeRAQIV2RequestOptions = {
  fetchTotalSeries?: boolean;
  fetchComparison?: FetchComparisonOptions;
  /**
   * When true, comparison data may be fetched even if the request has breakdown dimensions.
   * Set by the chart when comparison data has a consumer on a breakdown chart:
   * the in-chart comparison overlay, a metric-driven quota line, or a summary
   * period-over-period chip (see `summaryRendersComparisonChip`). Without this,
   * `stripFetchComparisonForBreakdown` drops the comparison fetch for breakdown charts.
   */
  allowComparisonWithBreakdown?: boolean;
  fillMissingDatapoints?: boolean;
  /**
   * DSA-5784: when true (and the request qualifies), metric variant fanout is
   * delegated to ACE/AFC via a single DAG request instead of the legacy
   * client-side N-query fanout. Resolved centrally by
   * `useRAQIV2RequestFlags` from the `isAceMetricVariantFanoutEnabled` flag.
   */
  enableAceVariantFanout?: boolean;
  /**
   * When true, comparison requests honor their configured range policy.
   * Resolved centrally by `useRAQIV2RequestFlags` from the
   * `isComparisonRangePolicyEnabled` flag.
   */
  enableComparisonRangePolicy?: boolean;
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
      throw new Error(`Unsupported value type: ${String(exhaustiveCheck)}`);
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
  const endTimestamp = endTime.getTime();

  for (let current = startTime.getTime(); current <= endTimestamp; current += timeSpan) {
    timestamps.push(new Date(current));
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
      .filter((time): time is Date => time !== null) ?? [];

  if (latestAvailableTimes.length > 0) {
    const latestAvailableOnAnySeries = new Date(
      Math.max(...latestAvailableTimes.map((t) => t.getTime())),
    );
    return latestAvailableOnAnySeries;
  }
  return undefined;
};

const determineFillEndTime = (
  metricMetadata: RAQIV2MetricMetadataResult | null,
  requestedEndTime: Date,
  mainResponse: RAQIV2QueryResultWithComparison,
  totalResponse: RAQIV2QueryResultWithComparison | undefined | null,
): Date | null => {
  const latestAvailableOnAnySeries = determineLatestAvailableTime(metricMetadata);
  if (latestAvailableOnAnySeries) {
    return new Date(Math.min(requestedEndTime.getTime(), latestAvailableOnAnySeries.getTime()));
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
          .filter((time): time is number => time !== null) ?? [],
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
        throw new Error('All metrics must have the same value type to fill missing data points');
      }

      const newDataPoints = missingTimestamps.map((timestamp) =>
        createDefaultDataPoint(timestamp, valueType),
      );

      // Combine existing and new data points, then sort by time
      const allDataPoints = [...(metricValue.dataPoints ?? []), ...newDataPoints].sort((a, b) => {
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
  fetchComparison:
    | {
        granularity: RAQIV2MetricGranularity;
        relativeOffset?: TComparisonOffset;
        customStartDate?: Date;
      }
    | undefined,
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
    const { comparisonStartDate, comparisonEndDate } = getComparisonRange(
      startTime,
      endTime,
      fetchComparison.granularity,
      fetchComparison.relativeOffset,
      fetchComparison.customStartDate,
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
    comparisonResponse:
      fillMissingDataPoints(
        mainResponse.comparisonResult ?? null,
        comparisonFillStartTime,
        comparisonFillEndTime,
        granularity,
        allAPIMetrics,
      ) ?? undefined,
    totalSeriesResponse:
      fillMissingDataPoints(
        totalResponse?.result ?? null,
        startTime,
        fillEndTime,
        granularity,
        allAPIMetrics,
      ) ?? undefined,
    totalSeriesComparisonResponse:
      fillMissingDataPoints(
        totalResponse?.comparisonResult ?? null,
        comparisonFillStartTime,
        comparisonFillEndTime,
        granularity,
        allAPIMetrics,
      ) ?? undefined,
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
  // snappedRequestBase.breakdown carries any real API breakdowns (e.g. duration
  // bucket dimensions) so they are included in each per-fanout-value request.
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
  // Append an 'Other' breakdown entry for every dimension being filtered with
  // NotContains to each series in the response. When the request had no
  // additional breakdowns the response contains a single un-broken-down series
  // and we end up with one row representing 'Other'. When there ARE additional
  // breakdowns (e.g. Platform, OS) the response contains one series per
  // unique combination of those breakdowns and each one gets its own 'Other'
  // entry appended for the topN/otherSeries dimensions.
  const otherBreakdownEntries = otherTopNApiFilters.map(({ dimension }) => ({
    dimension,
    value: 'Other',
  }));
  const values = otherResponse.values ?? [];
  if (values.length === 0) {
    return null;
  }
  const otherSeries = values.map((value) => ({
    ...value,
    breakdownValue: [...(value.breakdownValue ?? []), ...otherBreakdownEntries],
  }));
  return { values: otherSeries };
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
  apiBreakdown: RAQIV2Dimension[],
): Promise<{
  mainResponse: RAQIV2QueryResultWithComparison;
  totalResponse: RAQIV2QueryResultWithComparison | undefined | null;
}> => {
  const mainFilters = [...(snappedRequestBase?.filter ?? []), ...topNApiFilters];
  const otherFilters = [...(snappedRequestBase?.filter ?? []), ...otherTopNApiFilters];

  // Only fetch "other" if there are any dimensions that want it (showOther === true)
  const shouldFetchOther = otherTopNApiFilters.length > 0;

  // The "other" request must drop the dimensions being filtered with
  // NotContains from the breakdown (otherwise there would be nothing left to
  // call "Other"), but it MUST keep any other breakdown dimensions so that
  // the resulting "Other" rows are produced per-(remaining-breakdown) rather
  // than collapsed into a single grand-total row.
  const otherFilteredDimensions = new Set(otherTopNApiFilters.map(({ dimension }) => dimension));
  const otherRequestBreakdown = apiBreakdown.filter((d) => !otherFilteredDimensions.has(d));

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
            {
              ...snappedRequestBase,
              breakdown: otherRequestBreakdown.length ? otherRequestBreakdown : undefined,
              filter: otherFilters,
            },
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
      apiBreakdown,
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
  return filter;
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
      const orderFilters: RAQIV2APIQueryFilter[] = [...(baseRequest.filter ?? [])];
      orderConfig.filters?.forEach(({ dimension, values, operation }) => {
        if (isValidEnumValue(RAQIV2Dimension, dimension)) {
          orderFilters.push({ dimension, values, operation });
        }
      });

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

// Shared comparison orchestration for ACE DAG requests. Both computed-metric
// and metric-variant fanout paths execute a `(timeSpec) => RAQIV2QueryResponses`
// over the primary window and, when a comparison is requested, either fetch a
// separate comparison window or slice a single combined window. Total-series
// fields are sliced/forwarded too; they are simply absent (undefined) for the
// variant fanout path, which has no Total branch.
const executeAceDagComparison = async (
  executeForTimeSpec: (
    timeSpec: ExactRAQIV2UIQueryRequest<RAQIV2UIQueryRequest>['timeSpec'],
  ) => Promise<RAQIV2QueryResponses>,
  baseTimeSpec: ExactRAQIV2UIQueryRequest<RAQIV2UIQueryRequest>['timeSpec'],
  comparison: FetchComparisonOptions | undefined,
): Promise<RAQIV2QueryResponses> => {
  if (comparison === undefined) {
    return executeForTimeSpec(baseTimeSpec);
  }

  const { comparisonStartDate, comparisonEndDate } = getComparisonRange(
    baseTimeSpec.startTime,
    baseTimeSpec.endTime,
    comparison.granularity,
    comparison.relativeOffset,
    comparison.customStartDate,
  );

  switch (comparison.mode) {
    case FetchComparisonSeriesMode.Separate: {
      const comparisonTimeSpec = {
        ...baseTimeSpec,
        startTime: comparisonStartDate,
        endTime: comparisonEndDate,
      };
      const [primary, comparisonResult] = await Promise.all([
        executeForTimeSpec(baseTimeSpec),
        catchRequestFail(executeForTimeSpec(comparisonTimeSpec)),
      ]);
      return {
        ...primary,
        comparisonResponse: comparisonResult?.response ?? undefined,
        totalSeriesComparisonResponse: comparisonResult?.totalSeriesResponse,
      };
    }
    case FetchComparisonSeriesMode.Combined: {
      // Mirror makeRequestByComparisonOption: Combined + None can drop the only
      // cumulative aggregate point during primary-window slicing.
      if (comparison.granularity === RAQIV2MetricGranularity.None) {
        const comparisonTimeSpec = {
          ...baseTimeSpec,
          startTime: comparisonStartDate,
          endTime: comparisonEndDate,
        };
        const [primary, comparisonResult] = await Promise.all([
          executeForTimeSpec(baseTimeSpec),
          catchRequestFail(executeForTimeSpec(comparisonTimeSpec)),
        ]);
        return {
          ...primary,
          comparisonResponse: comparisonResult?.response ?? undefined,
          totalSeriesComparisonResponse: comparisonResult?.totalSeriesResponse,
        };
      }
      const combined = await executeForTimeSpec({
        ...baseTimeSpec,
        startTime: comparisonStartDate,
        endTime: baseTimeSpec.endTime,
      });
      return {
        response: combined.response
          ? sliceRAQIV2QueryResultByTimeRange(
              combined.response,
              baseTimeSpec.startTime,
              baseTimeSpec.endTime,
            )
          : null,
        comparisonResponse: combined.response
          ? sliceRAQIV2QueryResultByTimeRange(
              combined.response,
              comparisonStartDate,
              comparisonEndDate,
            )
          : undefined,
        totalSeriesResponse: combined.totalSeriesResponse
          ? sliceRAQIV2QueryResultByTimeRange(
              combined.totalSeriesResponse,
              baseTimeSpec.startTime,
              baseTimeSpec.endTime,
            )
          : undefined,
        totalSeriesComparisonResponse: combined.totalSeriesResponse
          ? sliceRAQIV2QueryResultByTimeRange(
              combined.totalSeriesResponse,
              comparisonStartDate,
              comparisonEndDate,
            )
          : undefined,
      };
    }
    default: {
      const exhaustiveCheck: never = comparison.mode;
      throw new Error(`Unhandled comparison fetch mode ${String(exhaustiveCheck)}`);
    }
  }
};

const makeComputedMetricRequest = async ({
  queryRequest,
  snappedTimeSpec,
  metric,
  clients,
  fetchTotalSeries,
  comparison,
}: {
  queryRequest: RAQIV2UIQueryRequest;
  snappedTimeSpec: ExactRAQIV2UIQueryRequest<RAQIV2UIQueryRequest>['timeSpec'];
  metric: ComputedMetric;
  clients: CombinedAPIClientWrapper;
  fetchTotalSeries: boolean | undefined;
  comparison?: FetchComparisonOptions;
}): Promise<RAQIV2QueryResponses> => {
  const executeForTimeSpec = async (
    timeSpec: ExactRAQIV2UIQueryRequest<RAQIV2UIQueryRequest>['timeSpec'],
  ) => {
    let dagRequest: ReturnType<typeof buildComputedMetricDag>;
    try {
      const computedQueryRequest: RAQIV2UIQueryRequest = {
        ...queryRequest,
        timeSpec,
        metric,
      };
      dagRequest = buildComputedMetricDag(
        computedQueryRequest,
        // Mirror the standard RAQI flow's `buildTotalRequestIfNecessary` opt-in:
        // only emit the parallel no-breakdown "Total" branch when the caller
        // has explicitly asked for a total series. Surfaces that opt out
        // (Explore Mode table, item summary cards, player-feedback chart, …)
        // would otherwise get an unwanted Total row/series via
        // `RAQIV2QueryResponses.totalSeriesResponse`.
        {
          includeTotalBranch: Boolean(fetchTotalSeries),
        },
      );
    } catch (error) {
      logAnalyticsError(
        `Failed to build computed metric DAG: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
    return makeACERequest(clients, dagRequest);
  };

  return executeAceDagComparison(executeForTimeSpec, snappedTimeSpec, comparison);
};

const buildStandardMetricVariantFanoutDag = (
  request: RAQIV2CombinedUIQueryRequestWithoutMetric,
  metric: TRAQIV2UIMetric,
  apiBreakdown: RAQIV2Dimension[],
  apiFilters: RAQIV2APIQueryFilter[],
  metricFanoutPseudoBreakdown: MetricFanoutPseudoDimensionInfo[],
): AnalyticsQueryGatewayExecuteDagRequest => {
  const variantBreakdown = metricFanoutPseudoBreakdown[0];
  const variantKind = variantBreakdown ? getVariantKind(variantBreakdown.dimension) : null;
  if (!variantBreakdown || variantKind == null) {
    throw new Error('Expected a supported metric fanout pseudo-dimension for ACE variant fanout');
  }

  const breakdownSpecs = [
    ...apiBreakdown.map((dimension) => ({
      dimensionBreakdown: {
        dimension,
      },
    })),
    {
      variant: {
        kind: variantKind,
        keys: variantBreakdown.config.supportedDimensionValues.map((value) =>
          getStableVariantKey(variantBreakdown.dimension, value),
        ),
      },
    },
  ];

  const dagRequest = {
    graph: {
      id: `variant_fanout_${metric}`,
      name: 'Metric Variant Fanout DAG',
      nodes: [
        {
          id: 'query_main',
          type: AceNodeType.Query,
          queryConfig: {
            metric,
            filters: apiFilters.length ? apiFilters : undefined,
            breakdownSpecs,
          },
        },
        {
          id: MAIN_OUTPUT_NODE_ID,
          type: AceNodeType.Output,
          outputConfig: {
            input: 'query_main',
            alias: 'main',
          },
        },
      ],
    },
    context: {
      resourceType: mapChartResourceTypeToTargetResourceType(
        request.resource.type,
        AceResourceType,
      ),
      resourceId: request.resource.id.toString(),
      granularity: request.granularity,
      startTime: request.timeSpec.startTime.toISOString(),
      endTime: request.timeSpec.endTime.toISOString(),
    },
  };
  return dagRequest;
};

const makeStandardMetricVariantFanoutRequest = async ({
  snappedRequestBase,
  metric,
  apiBreakdown,
  apiFilters,
  metricFanoutPseudoBreakdown,
  clients,
  comparison,
}: {
  snappedRequestBase: RAQIV2CombinedUIQueryRequestWithoutMetric;
  metric: TRAQIV2UIMetric;
  apiBreakdown: RAQIV2Dimension[];
  apiFilters: RAQIV2APIQueryFilter[];
  metricFanoutPseudoBreakdown: MetricFanoutPseudoDimensionInfo[];
  clients: CombinedAPIClientWrapper;
  comparison?: FetchComparisonOptions;
}): Promise<RAQIV2QueryResponses> => {
  const executeForTimeSpec = (
    timeSpec: ExactRAQIV2UIQueryRequest<RAQIV2UIQueryRequest>['timeSpec'],
  ) =>
    makeACERequest(
      clients,
      buildStandardMetricVariantFanoutDag(
        { ...snappedRequestBase, timeSpec },
        metric,
        apiBreakdown,
        apiFilters,
        metricFanoutPseudoBreakdown,
      ),
      // Tag failures as variant fanout (not computed metric) for accurate
      // operator/Sentry routing; still handled gracefully via the shared
      // `isAceDagExecutionError` path.
      (details) => new VariantFanoutDagExecutionError(details),
    );

  const variantDisplayMap = buildVariantDisplayMap(metricFanoutPseudoBreakdown);
  const responses = await executeAceDagComparison(
    executeForTimeSpec,
    snappedRequestBase.timeSpec,
    comparison,
  );
  return normalizeVariantBreakdownValues(responses, variantDisplayMap);
};

type RequestMetricSelection =
  | {
      kind: 'standard';
      metric: AtomicMetricLike<TRAQIV2UIMetric>;
    }
  | {
      kind: 'computed';
      metric: ComputedMetric;
    };

const resolveRequestMetricSelection = (
  metric: MetricLike<TRAQIV2UIMetric>,
): RequestMetricSelection => {
  if (isComputedMetric(metric)) {
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

const resolveAtomicMetricFilters = (
  metric: AtomicMetricLike<TRAQIV2UIMetric>,
  filters: readonly RAQIV2QueryFilter[] | undefined,
): readonly RAQIV2QueryFilter[] | undefined => {
  if (!isCustomEventsAtomicMetricLike(metric)) {
    return filters;
  }
  const withoutAtomicOwnedFilters = filters?.filter(
    (filter) =>
      filter.dimension !== RAQIV2Dimension.CustomEventName &&
      filter.dimension !== RAQIV2UIPseudoDimension.AggregationType,
  );
  return [
    { dimension: RAQIV2Dimension.CustomEventName, values: [metric.customEventName] },
    {
      dimension: RAQIV2UIPseudoDimension.AggregationType,
      values: [metric.aggregationType ?? RAQIV2AggregationType.Sum],
    },
    ...(withoutAtomicOwnedFilters ?? []),
  ];
};

const makeRAQIV2Request = async (
  queryRequest: RAQIV2UIQueryRequest,
  clients: CombinedAPIClientWrapper,
  options: MakeRAQIV2RequestOptions = {},
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
  const requestedFetchComparison = options.fetchComparison;
  const comparisonRangePolicy =
    requestedFetchComparison?.rangePolicy ?? DEFAULT_COMPARISON_CONFIG.rangePolicy;
  const fetchComparison =
    requestedFetchComparison &&
    (options.enableComparisonRangePolicy !== true ||
      isComparisonRangeAllowed(givenTimeSpec, comparisonRangePolicy))
      ? requestedFetchComparison
      : undefined;
  const resolvedOptions =
    fetchComparison === requestedFetchComparison
      ? options
      : {
          ...options,
          fetchComparison,
        };
  const { fillMissingDatapoints: fillMissingDatapointsForMetric } = resolvedOptions;
  const defaultSnapGranularity = givenTimeSpec.snapGranularity ?? granularity;
  let snappedTimeSpec = buildSnappedTimeSpec(givenTimeSpec, defaultSnapGranularity);
  const metricSelection = resolveRequestMetricSelection(givenMetric);

  if (metricSelection.kind === 'computed') {
    return makeComputedMetricRequest({
      queryRequest,
      snappedTimeSpec,
      metric: metricSelection.metric,
      clients,
      fetchTotalSeries: resolvedOptions.fetchTotalSeries,
      comparison: fetchComparison,
    });
  }
  const { metric } = metricSelection;
  const uiMetric = getUIMetricFromAtomicMetricLike(metric);
  const queryFilters = resolveAtomicMetricFilters(metric, givenFilters);

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
  } = processFilterPseudoDimensions(queryFilters, otherSeriesBreakdown);
  const { apiMetrics, metricForTotalSeries, allAPIMetrics } = getApiMetrics(
    uiMetric,
    metricFanoutPseudoFilters,
    metricFanoutPseudoBreakdown,
  );
  const isDurationBucketCumulativeRequest =
    granularity === RAQIV2MetricGranularity.None &&
    apiBreakdownBase.some(isDurationBucketDimension);

  // Handle metadata call in parallel if data filling is enabled
  const shouldFillMissingDatapoints =
    fillMissingDatapointsForMetric && isSupportedGranularityForFillMissingDatapoints(granularity);
  const shouldFetchMetricMetadata = shouldFillMissingDatapoints
    ? true
    : isDurationBucketCumulativeRequest;
  const metricMetadataPromise = shouldFetchMetricMetadata
    ? fetchMetricMetadata(clients, { metrics: allAPIMetrics })
    : Promise.resolve(null);
  if (isDurationBucketCumulativeRequest) {
    const metricMetadata = await metricMetadataPromise;
    snappedTimeSpec = buildSnappedTimeSpec(
      givenTimeSpec,
      RAQIV2MetricGranularity.OneDay,
      determineLatestAvailableTime(metricMetadata),
    );
  }

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

  // Scope of the initial ACE variant fanout rollout (DSA-5784): standard
  // metrics with a metric-fanout pseudo *breakdown* (e.g. percentile) and no
  // competing concerns. Intentionally excluded for now, each falling back to
  // the legacy client-side fanout:
  //   - metric-fanout pseudo *filters* (e.g. a single selected percentile, and
  //     custom-events aggregation-as-identity which always injects one) —
  //     routing these through ACE needs AFC/ACE filter-side resolution and is
  //     tracked as a separate follow-up.
  //   - Total series and NotContains other-series, which the single fanout DAG
  //     does not yet model.
  //   - "Other" topN buckets and a query-level `limit`: ACE query nodes have no
  //     `limit` field (series limiting goes through topN/rank inside
  //     `breakdownSpecs`), so a request carrying an explicit limit stays on the
  //     legacy path that honors it rather than silently returning more series.
  //     topN/rank (and limit) support lands with DSA-5783 (creator-hub#14115,
  //     feature/dsa-5783-move-standard-topn-rank-queries-to-ace-afc).
  const canUseAceVariantFanout =
    resolvedOptions.enableAceVariantFanout === true &&
    Array.isArray(apiMetrics) &&
    metricFanoutPseudoBreakdown.length > 0 &&
    metricFanoutPseudoFilters.length === 0 &&
    !resolvedOptions.fetchTotalSeries &&
    otherTopNApiFilters.length === 0 &&
    otherSeriesNotContainsFilters.length === 0 &&
    limit == null;

  if (canUseAceVariantFanout) {
    const aceFilters = apiFilters.concat(topNApiFilters, otherSeriesFilters);
    const [aceResponse, metricMetadata] = await Promise.all([
      makeStandardMetricVariantFanoutRequest({
        snappedRequestBase,
        metric: uiMetric,
        apiBreakdown,
        apiFilters: aceFilters,
        metricFanoutPseudoBreakdown,
        clients,
        comparison: fetchComparison,
      }),
      metricMetadataPromise,
    ]);

    if (shouldFillMissingDatapoints) {
      return fillMissingDataPointsForResponse(
        snappedRequestBase,
        metricMetadata,
        {
          result: aceResponse.response,
          comparisonResult: aceResponse.comparisonResponse,
        },
        undefined,
        fetchComparison,
        granularity,
        allAPIMetrics,
      );
    }

    return aceResponse;
  }

  // we need to have the main request contain the additional filters
  // but not any total request
  const [{ mainResponse, totalResponse }, metricMetadata] = await Promise.all([
    makeMainAndTotalAndOtherRequests(
      snappedRequestBase,
      { apiMetrics, metricForTotalSeries, allAPIMetrics },
      apiBreakdown,
      metricFanoutPseudoBreakdown,
      clients,
      resolvedOptions,
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
