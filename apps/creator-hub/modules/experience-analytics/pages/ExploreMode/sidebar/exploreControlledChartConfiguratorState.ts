import {
  RAQIV2Dimension,
  RAQIV2MetricGranularity,
  RAQIV2UIMetric,
  RAQIV2UIPseudoDimension,
  type TRAQIV2Dimension,
} from '@rbx/creator-hub-analytics-config';
import AnalyticsQueryParams from '@modules/charts-generic/enums/AnalyticsQueryParams';
import { AnnotationType, type RAQIV2QueryFilter } from '@modules/clients/analytics';
import type { ChartConfiguratorChartType } from '@modules/experience-analytics-shared/chartConfigurator/ChartConfiguratorChartTypes';
import {
  type TChartConfiguratorMetrics,
  isChartConfiguratorMetric,
} from '@modules/experience-analytics-shared/chartConfigurator/chartConfiguratorMetricsConfig';
import {
  buildControlledChartConfiguratorInitialState,
  type ControlledChartConfiguratorInitialState,
} from '@modules/experience-analytics-shared/chartConfigurator/controlledChartConfiguratorState';
import {
  deserializeBenchmarkType,
  deserializeComparisonCustomStartDate,
  deserializeComparisonOffset,
  deserializeOverlayParam,
  serializeBenchmarkType,
  serializeComparisonCustomStartDate,
  serializeComparisonOffset,
  serializeOverlayParam,
  type ComparisonCustomStartDateValue,
  type ComparisonOffsetValue,
} from '@modules/experience-analytics-shared/chartConfigurator/overlayUrlParams';
import {
  SmoothingOptionValue,
  type SmoothingOption,
} from '@modules/experience-analytics-shared/chartConfigurator/smoothingOptions';
import type { OverlayOption } from '@modules/experience-analytics-shared/components/chartConfigurator/ChartConfiguratorOverlaysControl';
import {
  MAX_TABLE_METRIC_COLUMNS,
  type ExploreModeTableMetricColumn,
} from '@modules/experience-analytics-shared/components/chartConfigurator/chartConfiguratorTableColumns';
import {
  getAnnotationOptionsFromAnnotationTypes,
  getAnnotationTypesFromAnnotationOptions,
  type AnnotationOptions,
} from '@modules/experience-analytics-shared/constants/annotationConfig';
import {
  QueryParamGranularity,
  uiGranularityToQueryGranularity,
} from '@modules/experience-analytics-shared/context/AnalyticsCurrentGranularityProvider';
import resolveExploreModeQueryState, {
  L7_SMOOTHING_QUERY_VALUE,
} from '@modules/experience-analytics-shared/exploreMode/resolveExploreModeQueryState';
import type { BenchmarkOverlayType } from '@modules/experience-analytics-shared/hooks/useAnalyticsBenchmarks';
import type { ComputedMetric } from '@modules/experience-analytics-shared/types/ComputedMetric';
import { serializeComputedMetricToQueryParam } from '@modules/experience-analytics-shared/types/ComputedMetricQueryParam';
import type { OverlayType } from '@modules/experience-analytics-shared/types/RAQIV2ChartSpec';
import type { TUIGranularity } from '@modules/experience-analytics-shared/utils/seriesGranularities';
import { isValidArrayEnumValue, isValidEnumValue } from '@modules/miscellaneous/utils/enumUtils';

type QueryParamValue = string | string[] | null | undefined;
export const ExploreCustomEventNameQueryKey = `filter_${RAQIV2Dimension.CustomEventName}` as const;
export const ExploreCustomEventAggregationTypeQueryKey =
  `filter_${RAQIV2UIPseudoDimension.AggregationType}` as const;
export const ExploreL7SmoothingQueryKey = AnalyticsQueryParams.Smoothing;

type ExploreControlledCoreUrlParamKey =
  | AnalyticsQueryParams.Metric
  | AnalyticsQueryParams.ComputedMetric
  | AnalyticsQueryParams.ChartType
  | AnalyticsQueryParams.Granularity
  | AnalyticsQueryParams.Breakdown
  | AnalyticsQueryParams.Overlays
  | AnalyticsQueryParams.OverlayBenchmarkType
  | AnalyticsQueryParams.OverlayComparisonOffset
  | AnalyticsQueryParams.OverlayComparisonCustomStartTime
  | AnalyticsQueryParams.TableMetric
  | AnalyticsQueryParams.TableMetricFilters
  | AnalyticsQueryParams.Annotation
  | AnalyticsQueryParams.FilterAnnotation
  | typeof ExploreCustomEventNameQueryKey
  | typeof ExploreCustomEventAggregationTypeQueryKey
  | typeof ExploreL7SmoothingQueryKey;

export type ExploreControlledCoreUrlInput = {
  readonly queryMetric: QueryParamValue;
  readonly queryComputedMetric: QueryParamValue;
  readonly queryChartType: QueryParamValue;
  readonly queryGranularity: QueryParamValue;
  readonly queryBreakdown: QueryParamValue;
  readonly queryL7Smoothing?: QueryParamValue;
  readonly allowedMetrics: readonly TChartConfiguratorMetrics[];
  readonly availableChartTypes: readonly ChartConfiguratorChartType[];
  readonly defaultGranularity?: TUIGranularity;
  readonly featureFlagsFetched?: boolean;
};

export type ExploreControlledPageStateInput = {
  readonly metric: TChartConfiguratorMetrics | null;
  readonly computedMetric: ComputedMetric | null;
  readonly chartType: ChartConfiguratorChartType | null;
  readonly granularity: TUIGranularity;
  readonly breakdown: readonly TRAQIV2Dimension[];
  readonly l7Smoothing?: boolean;
};

export type ExploreControlledConfiguratorSeed = {
  readonly initialState: ControlledChartConfiguratorInitialState;
  readonly seedKey: string;
  readonly isOperationsToggleOn: boolean;
  readonly cleanupQueryParams: ExploreModeQueryCleanup | null;
};

type ExploreModeQueryCleanup = Partial<
  Record<
    | AnalyticsQueryParams.Metric
    | AnalyticsQueryParams.ComputedMetric
    | AnalyticsQueryParams.Smoothing,
    string | null
  >
>;

export type ExploreControlledOverlayUrlInput = {
  readonly queryOverlays: QueryParamValue;
  readonly queryBenchmarkType: QueryParamValue;
  readonly queryComparisonOffset: QueryParamValue;
  readonly queryComparisonCustomStartTime: QueryParamValue;
};

export type ExploreControlledOverlayState = {
  readonly overlayOption: OverlayOption;
  readonly benchmarkType: BenchmarkOverlayType | null;
  readonly comparisonOffset: ComparisonOffsetValue;
  readonly comparisonCustomStartDate: ComparisonCustomStartDateValue;
};

export type ExploreControlledTableAdditionalColumnsUrlInput = {
  readonly queryTableMetric: QueryParamValue;
  readonly queryTableMetricFilters: QueryParamValue;
  readonly availableMetrics: readonly TChartConfiguratorMetrics[];
};

export type ExploreControlledAnnotationsUrlInput = {
  readonly queryAnnotation: QueryParamValue;
  readonly queryFilterAnnotation: QueryParamValue;
};

export type ExploreControlledSourceUrlInput = {
  readonly queryMetric: QueryParamValue;
  readonly queryCustomEventName: QueryParamValue;
};

export type ExploreControlledSourceUrlState = {
  readonly isCustomEventsMode: boolean;
};

export type ExploreControlledCoreUrlParams = Partial<
  Record<ExploreControlledCoreUrlParamKey, string | string[] | number | boolean | null | undefined>
>;

const queryGranularityToUiGranularity: Record<QueryParamGranularity, TUIGranularity> = {
  [QueryParamGranularity.Monthly]: RAQIV2MetricGranularity.OneMonth,
  [QueryParamGranularity.Weekly]: RAQIV2MetricGranularity.OneWeek,
  [QueryParamGranularity.Daily]: RAQIV2MetricGranularity.OneDay,
  [QueryParamGranularity.Hourly]: RAQIV2MetricGranularity.OneHour,
  [QueryParamGranularity.ThirtyMinutely]: RAQIV2MetricGranularity.HalfHour,
  [QueryParamGranularity.Minutely]: RAQIV2MetricGranularity.OneMinute,
  [QueryParamGranularity.Cumulative]: RAQIV2MetricGranularity.None,
};

const isSupportedBreakdownDimension = (value: string): value is TRAQIV2Dimension =>
  isValidEnumValue(RAQIV2Dimension, value) || isValidEnumValue(RAQIV2UIPseudoDimension, value);

const overlayDiscriminantToOption: Record<OverlayType, OverlayOption> = {
  benchmark: 'benchmarks',
  comparison: 'period-over-period',
  quota: 'quota',
};

const overlayOptionToDiscriminant: Partial<Record<OverlayOption, OverlayType>> = {
  benchmarks: 'benchmark',
  'period-over-period': 'comparison',
  quota: 'quota',
};

const getFirstQueryString = (value: QueryParamValue): string | null => {
  if (typeof value === 'string') {
    return value;
  }
  if (Array.isArray(value) && typeof value[0] === 'string') {
    return value[0];
  }
  return null;
};

const getQueryArray = (value: QueryParamValue): string[] =>
  Array.isArray(value) ? value : typeof value === 'string' ? [value] : [];

const getMaxAdditionalMetricCount = (): number => Math.max(0, MAX_TABLE_METRIC_COLUMNS - 1);

const isSerializedQueryFilterEntry = (entry: unknown): entry is RAQIV2QueryFilter => {
  if (typeof entry !== 'object' || entry === null) {
    return false;
  }
  const candidate: { dimension?: unknown; values?: unknown } = entry;
  return (
    typeof candidate.dimension === 'string' &&
    Array.isArray(candidate.values) &&
    candidate.values.every((value: unknown) => typeof value === 'string')
  );
};

const isSerializedQueryFilterArray = (value: unknown): value is RAQIV2QueryFilter[] =>
  Array.isArray(value) && value.every((entry: unknown) => isSerializedQueryFilterEntry(entry));

export const serializeExploreTableMetricFilters = (
  filters: readonly RAQIV2QueryFilter[] | undefined,
): string => {
  if (!filters?.length) {
    return '';
  }
  return encodeURIComponent(JSON.stringify(filters));
};

export const deserializeExploreTableMetricFilters = (
  serialized: string,
): RAQIV2QueryFilter[] | undefined => {
  if (!serialized) {
    return undefined;
  }
  try {
    const parsed: unknown = JSON.parse(decodeURIComponent(serialized));
    return isSerializedQueryFilterArray(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
};

const toTableMetricColumns = (
  columns: readonly { metric: TChartConfiguratorMetrics; filters?: readonly RAQIV2QueryFilter[] }[],
): ExploreModeTableMetricColumn[] =>
  columns.map(({ metric: tableMetric, filters }, index) => ({
    type: 'metric',
    key: `tableMetric_${index}_${tableMetric}`,
    metric: tableMetric,
    filters,
  }));

export const toExploreTableMetricColumnsWithMetric = (
  columns: readonly ExploreModeTableMetricColumn[],
): ExploreModeTableMetricColumn[] =>
  columns.filter((column): column is ExploreModeTableMetricColumn => column.metric !== null);

export function deserializeExploreChartTypeParam(
  queryChartType: QueryParamValue,
  availableChartTypes: readonly ChartConfiguratorChartType[],
): ChartConfiguratorChartType | null {
  const chartType = getFirstQueryString(queryChartType);
  return chartType && isValidArrayEnumValue(availableChartTypes, chartType) ? chartType : null;
}

export function deserializeExploreGranularityParam(
  queryGranularity: QueryParamValue,
  defaultGranularity: TUIGranularity = RAQIV2MetricGranularity.OneDay,
): TUIGranularity {
  const granularity = getFirstQueryString(queryGranularity);
  if (granularity && isValidEnumValue(QueryParamGranularity, granularity)) {
    return queryGranularityToUiGranularity[granularity];
  }
  return defaultGranularity;
}

export function deserializeExploreBreakdownParam(
  queryBreakdown: QueryParamValue,
): readonly TRAQIV2Dimension[] {
  const values =
    typeof queryBreakdown === 'string'
      ? [queryBreakdown]
      : Array.isArray(queryBreakdown)
        ? queryBreakdown
        : [];
  return values.filter(isSupportedBreakdownDimension);
}

export function deserializeExploreL7SmoothingParam(queryL7Smoothing: QueryParamValue): boolean {
  const smoothingValue = getFirstQueryString(queryL7Smoothing);
  return smoothingValue === L7_SMOOTHING_QUERY_VALUE;
}

export function deserializeExploreOverlayOptionParam(
  queryOverlays: QueryParamValue,
): OverlayOption {
  const deserialized = deserializeOverlayParam(queryOverlays);
  if (deserialized === undefined || deserialized === 'none') {
    return 'none';
  }
  return overlayDiscriminantToOption[deserialized] ?? 'none';
}

export function buildExploreControlledOverlayStateFromUrlInput({
  queryOverlays,
  queryBenchmarkType,
  queryComparisonOffset,
  queryComparisonCustomStartTime,
}: ExploreControlledOverlayUrlInput): ExploreControlledOverlayState {
  return {
    overlayOption: deserializeExploreOverlayOptionParam(queryOverlays),
    benchmarkType: deserializeBenchmarkType(queryBenchmarkType),
    comparisonOffset: deserializeComparisonOffset(queryComparisonOffset),
    comparisonCustomStartDate: deserializeComparisonCustomStartDate(queryComparisonCustomStartTime),
  };
}

export function buildExploreControlledSeedFromPageState({
  metric,
  computedMetric,
  chartType,
  granularity,
  breakdown,
  l7Smoothing = computedMetric?.l7Smoothing ?? false,
}: ExploreControlledPageStateInput): ExploreControlledConfiguratorSeed {
  const initialState = buildControlledChartConfiguratorInitialState({
    metric,
    computedMetric,
    chartType,
    granularity,
    breakdownDimensions: breakdown,
    l7Smoothing,
  });
  return {
    initialState,
    seedKey: buildExploreControlledReseedKey({
      metric,
      computedMetric,
      chartType,
      granularity,
      breakdown,
      l7Smoothing,
    }),
    isOperationsToggleOn: computedMetric !== null,
    cleanupQueryParams: null,
  };
}

export function buildExploreControlledSeedFromUrlInput({
  queryMetric,
  queryComputedMetric,
  queryChartType,
  queryGranularity,
  queryBreakdown,
  queryL7Smoothing = null,
  allowedMetrics,
  availableChartTypes,
  defaultGranularity = RAQIV2MetricGranularity.OneDay,
  featureFlagsFetched = true,
}: ExploreControlledCoreUrlInput): ExploreControlledConfiguratorSeed {
  const { metric, computedMetric, cleanupQueryParams, l7SmoothingFromUrl } =
    resolveExploreModeQueryState({
      queryMetric,
      queryComputedMetric,
      querySmoothing: queryL7Smoothing,
      allowedMetrics,
      featureFlagsFetched,
    });
  const computedMetricOwnsSmoothing = computedMetric !== null;
  const topLevelSmoothingFromUrl =
    l7SmoothingFromUrl || deserializeExploreL7SmoothingParam(queryL7Smoothing);
  const resolvedCleanupQueryParams =
    computedMetricOwnsSmoothing && getFirstQueryString(queryL7Smoothing) !== null
      ? { ...cleanupQueryParams, [ExploreL7SmoothingQueryKey]: null }
      : cleanupQueryParams;
  const seed = buildExploreControlledSeedFromPageState({
    metric,
    computedMetric,
    chartType: deserializeExploreChartTypeParam(queryChartType, availableChartTypes),
    granularity: deserializeExploreGranularityParam(queryGranularity, defaultGranularity),
    breakdown: deserializeExploreBreakdownParam(queryBreakdown),
    l7Smoothing:
      computedMetric?.l7Smoothing ?? (!computedMetricOwnsSmoothing && topLevelSmoothingFromUrl),
  });
  return { ...seed, cleanupQueryParams: resolvedCleanupQueryParams };
}

export function serializeExploreChartTypeGranularityParams({
  chartType,
  granularity,
}: {
  readonly chartType: ChartConfiguratorChartType | null;
  readonly granularity: TUIGranularity;
}): Pick<
  ExploreControlledCoreUrlParams,
  AnalyticsQueryParams.ChartType | AnalyticsQueryParams.Granularity
> {
  return {
    [AnalyticsQueryParams.ChartType]: chartType,
    [AnalyticsQueryParams.Granularity]: uiGranularityToQueryGranularity[granularity],
  };
}

export function serializeExploreOverlayParams({
  overlayOption,
  benchmarkType,
  comparisonOffset,
  comparisonCustomStartDate,
}: ExploreControlledOverlayState): Pick<
  ExploreControlledCoreUrlParams,
  | AnalyticsQueryParams.Overlays
  | AnalyticsQueryParams.OverlayBenchmarkType
  | AnalyticsQueryParams.OverlayComparisonOffset
  | AnalyticsQueryParams.OverlayComparisonCustomStartTime
> {
  return {
    [AnalyticsQueryParams.Overlays]: serializeOverlayParam(
      overlayOptionToDiscriminant[overlayOption],
    ),
    [AnalyticsQueryParams.OverlayBenchmarkType]:
      overlayOption === 'benchmarks' ? serializeBenchmarkType(benchmarkType) : null,
    [AnalyticsQueryParams.OverlayComparisonOffset]:
      overlayOption === 'period-over-period' ? serializeComparisonOffset(comparisonOffset) : null,
    [AnalyticsQueryParams.OverlayComparisonCustomStartTime]:
      overlayOption === 'period-over-period'
        ? serializeComparisonCustomStartDate(comparisonCustomStartDate)
        : null,
  };
}

export function deserializeExploreTableAdditionalColumnsParams({
  queryTableMetric,
  queryTableMetricFilters,
  availableMetrics,
}: ExploreControlledTableAdditionalColumnsUrlInput): ExploreModeTableMetricColumn[] {
  const rawMetricValues = getQueryArray(queryTableMetric);
  const validatedMetrics = rawMetricValues
    .filter((value): value is TChartConfiguratorMetrics =>
      isValidArrayEnumValue(availableMetrics, value),
    )
    .slice(0, getMaxAdditionalMetricCount());
  const rawFilterValues = getQueryArray(queryTableMetricFilters);
  return toTableMetricColumns(
    validatedMetrics.map((metric, index) => ({
      metric,
      filters: deserializeExploreTableMetricFilters(rawFilterValues[index] ?? ''),
    })),
  );
}

export function serializeExploreTableAdditionalColumnsParams(
  tableAdditionalColumns: readonly ExploreModeTableMetricColumn[],
): Pick<
  ExploreControlledCoreUrlParams,
  AnalyticsQueryParams.TableMetric | AnalyticsQueryParams.TableMetricFilters
> {
  const nextColumns = toExploreTableMetricColumnsWithMetric(tableAdditionalColumns).slice(
    0,
    getMaxAdditionalMetricCount(),
  );
  const nextTableMetricParams = nextColumns
    .flatMap((column) => (column.metric ? [column.metric] : []))
    .slice(0, getMaxAdditionalMetricCount());
  const nextSerializedFilters = nextColumns.map((column) =>
    serializeExploreTableMetricFilters(column.filters),
  );
  const hasAnyFilterPayload = nextSerializedFilters.some((value) => value !== '');
  return {
    [AnalyticsQueryParams.TableMetric]:
      nextTableMetricParams.length > 0 ? nextTableMetricParams : null,
    [AnalyticsQueryParams.TableMetricFilters]: hasAnyFilterPayload ? nextSerializedFilters : null,
  };
}

export function deserializeExploreAnnotationParams({
  queryAnnotation,
  queryFilterAnnotation,
}: ExploreControlledAnnotationsUrlInput): AnnotationOptions[] {
  const parseAnnotationTypes = (value: QueryParamValue): Array<AnnotationType | 'None'> =>
    getQueryArray(value).filter(
      (entry): entry is AnnotationType | 'None' =>
        entry === 'None' || isValidEnumValue(AnnotationType, entry),
    );
  const annotationTypes = parseAnnotationTypes(queryAnnotation);
  const legacyAnnotationTypes = parseAnnotationTypes(queryFilterAnnotation);
  return getAnnotationOptionsFromAnnotationTypes(
    annotationTypes.length > 0 ? annotationTypes : legacyAnnotationTypes,
  );
}

export function serializeExploreAnnotationParams(
  annotationOptions: readonly AnnotationOptions[],
): Pick<ExploreControlledCoreUrlParams, AnalyticsQueryParams.Annotation> {
  return {
    [AnalyticsQueryParams.Annotation]: getAnnotationTypesFromAnnotationOptions([
      ...annotationOptions,
    ]),
  };
}

export function buildExploreControlledSourceStateFromUrlInput({
  queryMetric,
  queryCustomEventName,
}: ExploreControlledSourceUrlInput): ExploreControlledSourceUrlState {
  return {
    isCustomEventsMode:
      getFirstQueryString(queryMetric) === RAQIV2UIMetric.CustomEventsV2 ||
      getFirstQueryString(queryCustomEventName) !== null,
  };
}

export function serializeExploreCustomEventsSourceParams({
  enabled,
  currentMetric,
}: {
  readonly enabled: boolean;
  readonly currentMetric: TChartConfiguratorMetrics | null;
}): ExploreControlledCoreUrlParams {
  if (enabled) {
    return {
      [AnalyticsQueryParams.Metric]: RAQIV2UIMetric.CustomEventsV2,
    };
  }
  return {
    [AnalyticsQueryParams.Metric]:
      currentMetric === RAQIV2UIMetric.CustomEventsV2 ? null : currentMetric,
    [ExploreCustomEventNameQueryKey]: null,
    [ExploreCustomEventAggregationTypeQueryKey]: null,
  };
}

export function serializeExploreBenchmarkTypeParams(
  benchmarkType: BenchmarkOverlayType | null,
): Pick<ExploreControlledCoreUrlParams, AnalyticsQueryParams.OverlayBenchmarkType> {
  return {
    [AnalyticsQueryParams.OverlayBenchmarkType]: serializeBenchmarkType(benchmarkType),
  };
}

export function serializeExploreComparisonOffsetParams(
  comparisonOffset: ComparisonOffsetValue,
): Pick<
  ExploreControlledCoreUrlParams,
  | AnalyticsQueryParams.OverlayComparisonOffset
  | AnalyticsQueryParams.OverlayComparisonCustomStartTime
> {
  return {
    [AnalyticsQueryParams.OverlayComparisonOffset]: serializeComparisonOffset(comparisonOffset),
    [AnalyticsQueryParams.OverlayComparisonCustomStartTime]: null,
  };
}

export function serializeExploreComparisonCustomStartDateParams(
  comparisonCustomStartDate: ComparisonCustomStartDateValue,
): Pick<
  ExploreControlledCoreUrlParams,
  | AnalyticsQueryParams.OverlayComparisonOffset
  | AnalyticsQueryParams.OverlayComparisonCustomStartTime
> {
  return {
    [AnalyticsQueryParams.OverlayComparisonOffset]: null,
    [AnalyticsQueryParams.OverlayComparisonCustomStartTime]:
      serializeComparisonCustomStartDate(comparisonCustomStartDate),
  };
}

export function buildExploreControlledReseedKey({
  metric,
  computedMetric,
  chartType,
  granularity,
  l7Smoothing = computedMetric?.l7Smoothing ?? false,
}: ExploreControlledPageStateInput): string {
  return JSON.stringify({
    metric: computedMetric ? null : metric,
    computedMetric: computedMetric ? serializeComputedMetricToQueryParam(computedMetric) : null,
    chartType,
    granularity: uiGranularityToQueryGranularity[granularity],
    l7Smoothing,
  });
}

export function serializeExploreMetricParams({
  metric,
  computedMetric,
  smoothingOption = SmoothingOptionValue.None,
}: {
  readonly metric: TChartConfiguratorMetrics | null;
  readonly computedMetric: ComputedMetric | null;
  readonly smoothingOption?: SmoothingOption;
}): Pick<
  ExploreControlledCoreUrlParams,
  | AnalyticsQueryParams.Metric
  | AnalyticsQueryParams.ComputedMetric
  | typeof ExploreL7SmoothingQueryKey
> {
  const serializedComputedMetric = computedMetric
    ? serializeComputedMetricToQueryParam(computedMetric)
    : null;
  return {
    [AnalyticsQueryParams.Metric]: computedMetric ? null : metric,
    [AnalyticsQueryParams.ComputedMetric]: serializedComputedMetric,
    [ExploreL7SmoothingQueryKey]:
      !computedMetric && metric && smoothingOption === SmoothingOptionValue.L7MovingAverage
        ? L7_SMOOTHING_QUERY_VALUE
        : null,
  };
}

export function deserializeExploreMetricParam(
  queryMetric: QueryParamValue,
  allowedMetrics: readonly TChartConfiguratorMetrics[],
): TChartConfiguratorMetrics | null {
  const metric = getFirstQueryString(queryMetric);
  if (!metric || !isChartConfiguratorMetric(metric)) {
    return null;
  }
  return allowedMetrics.includes(metric) ? metric : null;
}
