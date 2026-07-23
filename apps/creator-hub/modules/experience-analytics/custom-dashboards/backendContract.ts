import type { components } from '@rbx/client-analytics-custom-dashboards-api/openapi-typescript/v1Paths';
import {
  RAQIV2Dimension,
  RAQIV2AggregationType,
  RAQIV2MetricGranularity,
  RAQIV2PercentileType,
  RAQIV2UIMetric,
  RAQIV2UIPseudoDimension,
} from '@rbx/creator-hub-analytics-config';
import { ChartType } from '@modules/charts-generic/charts/types/ChartTypes';
import {
  isCustomEventsAtomicMetricLike,
  type ComputedMetric,
  type ComputedMetricSource,
} from '@modules/experience-analytics-shared/types/ComputedMetric';
import {
  CUSTOM_DASHBOARD_CURRENT_SCHEMA_VERSION,
  CustomDashboardSummaryCardAggregation,
  DashboardPageMode,
  SummaryCardTitleSource,
  DEFAULT_CHART_GRANULARITY,
  type ChartAggregation,
  type ChartOverlays,
  type ChartTileConfig,
  type ChartTileMetric,
  type ChartTileSmoothing,
  type CustomDashboardChartType,
  type CustomDashboardConfig,
  type DashboardComponent,
  type DashboardDateRangeDefault,
  type DashboardLayoutNode,
  type DashboardMetricReference,
  type DashboardMetricVariantSelection,
  type DashboardSurfaceControls,
  type DashboardTimeRangeOptions,
  type SummaryCardAggregation,
  type SummaryCardTileConfig,
  type TileFilter,
  type TimeInterval,
} from './types';
import { resolveDefaultChartAggregation } from './utils/resolveDefaultChartAggregation';
import {
  isCanonicalRAQIV2Dimension,
  isChartAggregation,
  isDateRangeType,
  isDefaultAnnotationType,
  isDefaultBreakdownDimension,
  isMetricKey,
  isRAQIV2AggregationType,
  isRAQIV2PercentileType,
  validateCustomDashboardConfig,
} from './utils/validators';

/**
 * Wire document type from `@rbx/client-analytics-custom-dashboards-api`.
 *
 * The FE authoring DTO keeps TypeScript discriminants (`mode: 'Untabbed'`,
 * `type: 'Flex'`, …). This module is the only place that converts to/from the
 * generated OpenAPI / protobuf-JSON shape (`untabbed` / `flex` / integer enums).
 */
export type BackendCustomDashboardDocument =
  components['schemas']['Roblox.DeveloperAnalytics.CustomDashboards.V1Beta1.CustomDashboardDocument'];

type ApiDashboardPage =
  components['schemas']['Roblox.DeveloperAnalytics.CustomDashboards.V1Beta1.DashboardPage'];
type ApiDashboardLayoutNode =
  components['schemas']['Roblox.DeveloperAnalytics.CustomDashboards.V1Beta1.DashboardLayoutNode'];
type ApiDashboardComponent =
  components['schemas']['Roblox.DeveloperAnalytics.CustomDashboards.V1Beta1.DashboardComponent'];
type ApiSummaryCardTile =
  components['schemas']['Roblox.DeveloperAnalytics.CustomDashboards.V1Beta1.SummaryCardTile'];
type ApiChartTile =
  components['schemas']['Roblox.DeveloperAnalytics.CustomDashboards.V1Beta1.ChartTile'];
type ApiChartTileMetric =
  components['schemas']['Roblox.DeveloperAnalytics.CustomDashboards.V1Beta1.ChartTileMetric'];
type ApiDashboardMetricReference =
  components['schemas']['Roblox.DeveloperAnalytics.CustomDashboards.V1Beta1.DashboardMetricReference'];
type ApiDashboardComputedMetric =
  components['schemas']['Roblox.DeveloperAnalytics.CustomDashboards.V1Beta1.DashboardComputedMetric'];
type ApiTileFilter =
  components['schemas']['Roblox.DeveloperAnalytics.CustomDashboards.V1Beta1.TileFilter'];
type ApiDashboardSurfaceControls =
  components['schemas']['Roblox.DeveloperAnalytics.CustomDashboards.V1Beta1.DashboardSurfaceControls'];
type ApiDashboardTimeRangeOptions =
  components['schemas']['Roblox.DeveloperAnalytics.CustomDashboards.V1Beta1.DashboardTimeRangeOptions'];
type ApiDashboardDateRangeDefault =
  components['schemas']['Roblox.DeveloperAnalytics.CustomDashboards.V1Beta1.DashboardDateRangeDefault'];
type ApiChartOverlays =
  components['schemas']['Roblox.DeveloperAnalytics.CustomDashboards.V1Beta1.ChartOverlays'];
type ApiTimestamp = components['schemas']['Google.Protobuf.WellKnownTypes.Timestamp'];
type ProtoJsonTimestamp = string & ApiTimestamp;
type ApiDashboardAggregation =
  components['schemas']['Roblox.DeveloperAnalytics.CustomDashboards.V1Beta1.DashboardAggregation'];
type ApiDashboardChartType =
  components['schemas']['Roblox.DeveloperAnalytics.CustomDashboards.V1Beta1.DashboardChartType'];
type ApiDashboardGranularity =
  components['schemas']['Roblox.DeveloperAnalytics.CustomDashboards.V1Beta1.DashboardGranularity'];
type ApiDashboardTitleSource =
  components['schemas']['Roblox.DeveloperAnalytics.CustomDashboards.V1Beta1.DashboardTitleSource'];
type ApiDashboardChartSmoothing =
  components['schemas']['Roblox.DeveloperAnalytics.CustomDashboards.V1Beta1.DashboardChartSmoothing'];
type ApiDashboardResourceTypeKey =
  components['schemas']['Roblox.DeveloperAnalytics.CustomDashboards.V1Beta1.DashboardResourceTypeKey'];

/** Universe-scoped surface; matches `DASHBOARD_RESOURCE_TYPE_KEY_UNIVERSE`. */
const PROTO_RESOURCE_TYPE_UNIVERSE = 1 satisfies ApiDashboardResourceTypeKey;

const CHART_TYPE_TO_PROTO: Record<CustomDashboardChartType, ApiDashboardChartType> = {
  [ChartType.Spline]: 1,
  [ChartType.Area]: 2,
  [ChartType.Bar]: 3,
  [ChartType.Column]: 4,
  [ChartType.Pie]: 5,
  [ChartType.Table]: 6,
};

const PROTO_TO_CHART_TYPE: Record<string, CustomDashboardChartType> = {
  DASHBOARD_CHART_TYPE_SPLINE: ChartType.Spline,
  DASHBOARD_CHART_TYPE_AREA: ChartType.Area,
  DASHBOARD_CHART_TYPE_BAR: ChartType.Bar,
  DASHBOARD_CHART_TYPE_COLUMN: ChartType.Column,
  DASHBOARD_CHART_TYPE_PIE: ChartType.Pie,
  DASHBOARD_CHART_TYPE_TABLE: ChartType.Table,
  '1': ChartType.Spline,
  '2': ChartType.Area,
  '3': ChartType.Bar,
  '4': ChartType.Column,
  '5': ChartType.Pie,
  '6': ChartType.Table,
};

const TIME_INTERVAL_TO_PROTO: Record<TimeInterval, ApiDashboardGranularity> = {
  Cumulative: 1,
  Minute: 2,
  HalfHour: 3,
  Hour: 4,
  Day: 5,
  Week: 6,
};

const PROTO_TO_TIME_INTERVAL: Record<string, TimeInterval> = {
  DASHBOARD_GRANULARITY_CUMULATIVE: 'Cumulative',
  DASHBOARD_GRANULARITY_MINUTE: 'Minute',
  DASHBOARD_GRANULARITY_HALF_HOUR: 'HalfHour',
  DASHBOARD_GRANULARITY_HOUR: 'Hour',
  DASHBOARD_GRANULARITY_DAY: 'Day',
  DASHBOARD_GRANULARITY_WEEK: 'Week',
  '1': 'Cumulative',
  '2': 'Minute',
  '3': 'HalfHour',
  '4': 'Hour',
  '5': 'Day',
  '6': 'Week',
};

const SURFACE_GRANULARITY_TO_PROTO: Partial<
  Record<RAQIV2MetricGranularity, ApiDashboardGranularity>
> = {
  [RAQIV2MetricGranularity.None]: 1,
  [RAQIV2MetricGranularity.OneMinute]: 2,
  [RAQIV2MetricGranularity.HalfHour]: 3,
  [RAQIV2MetricGranularity.OneHour]: 4,
  [RAQIV2MetricGranularity.OneDay]: 5,
  [RAQIV2MetricGranularity.OneWeek]: 6,
};

const PROTO_TO_SURFACE_GRANULARITY: Partial<Record<string, RAQIV2MetricGranularity>> = {
  DASHBOARD_GRANULARITY_CUMULATIVE: RAQIV2MetricGranularity.None,
  DASHBOARD_GRANULARITY_MINUTE: RAQIV2MetricGranularity.OneMinute,
  DASHBOARD_GRANULARITY_HALF_HOUR: RAQIV2MetricGranularity.HalfHour,
  DASHBOARD_GRANULARITY_HOUR: RAQIV2MetricGranularity.OneHour,
  DASHBOARD_GRANULARITY_DAY: RAQIV2MetricGranularity.OneDay,
  DASHBOARD_GRANULARITY_WEEK: RAQIV2MetricGranularity.OneWeek,
  '1': RAQIV2MetricGranularity.None,
  '2': RAQIV2MetricGranularity.OneMinute,
  '3': RAQIV2MetricGranularity.HalfHour,
  '4': RAQIV2MetricGranularity.OneHour,
  '5': RAQIV2MetricGranularity.OneDay,
  '6': RAQIV2MetricGranularity.OneWeek,
};

const AGGREGATION_TO_PROTO: Record<string, ApiDashboardAggregation> = {
  [RAQIV2AggregationType.Sum]: 1,
  [RAQIV2AggregationType.Count]: 2,
  [RAQIV2AggregationType.Average]: 3,
  [RAQIV2AggregationType.Min]: 4,
  [RAQIV2AggregationType.Max]: 5,
  [RAQIV2AggregationType.CountUser]: 7,
  [RAQIV2AggregationType.AveragePerUser]: 25,
  [RAQIV2PercentileType.AVG]: 10,
  [RAQIV2PercentileType.P10]: 11,
  [RAQIV2PercentileType.P50]: 12,
  [RAQIV2PercentileType.P90]: 13,
  [CustomDashboardSummaryCardAggregation.Total]: 20,
  [CustomDashboardSummaryCardAggregation.AverageOverTimePeriod]: 21,
  [CustomDashboardSummaryCardAggregation.MostRecentDataPoint]: 22,
  [CustomDashboardSummaryCardAggregation.Median]: 23,
  [CustomDashboardSummaryCardAggregation.Cumulative]: 24,
  [CustomDashboardSummaryCardAggregation.AveragePerUniqueUser]: 25,
};

const PROTO_TO_AGGREGATION: Record<string, SummaryCardAggregation> = {
  DASHBOARD_AGGREGATION_SUM: RAQIV2AggregationType.Sum,
  DASHBOARD_AGGREGATION_COUNT: RAQIV2AggregationType.Count,
  DASHBOARD_AGGREGATION_AVERAGE: RAQIV2AggregationType.Average,
  DASHBOARD_AGGREGATION_MIN: RAQIV2AggregationType.Min,
  DASHBOARD_AGGREGATION_MAX: RAQIV2AggregationType.Max,
  DASHBOARD_AGGREGATION_DISTINCT_COUNT: RAQIV2AggregationType.CountUser,
  DASHBOARD_AGGREGATION_UNIQUE_COUNT: RAQIV2AggregationType.CountUser,
  DASHBOARD_AGGREGATION_PERCENTILE_AVG: RAQIV2PercentileType.AVG,
  DASHBOARD_AGGREGATION_PERCENTILE_P10: RAQIV2PercentileType.P10,
  DASHBOARD_AGGREGATION_PERCENTILE_P50: RAQIV2PercentileType.P50,
  DASHBOARD_AGGREGATION_PERCENTILE_P90: RAQIV2PercentileType.P90,
  DASHBOARD_AGGREGATION_TOTAL: CustomDashboardSummaryCardAggregation.Total,
  DASHBOARD_AGGREGATION_AVERAGE_OVER_TIME_PERIOD:
    CustomDashboardSummaryCardAggregation.AverageOverTimePeriod,
  DASHBOARD_AGGREGATION_MOST_RECENT_DATA_POINT:
    CustomDashboardSummaryCardAggregation.MostRecentDataPoint,
  DASHBOARD_AGGREGATION_MEDIAN: CustomDashboardSummaryCardAggregation.Median,
  DASHBOARD_AGGREGATION_CUMULATIVE: CustomDashboardSummaryCardAggregation.Cumulative,
  DASHBOARD_AGGREGATION_AVERAGE_PER_UNIQUE_USER: RAQIV2AggregationType.AveragePerUser,
  '1': RAQIV2AggregationType.Sum,
  '2': RAQIV2AggregationType.Count,
  '3': RAQIV2AggregationType.Average,
  '4': RAQIV2AggregationType.Min,
  '5': RAQIV2AggregationType.Max,
  '6': RAQIV2AggregationType.CountUser,
  '7': RAQIV2AggregationType.CountUser,
  '10': RAQIV2PercentileType.AVG,
  '11': RAQIV2PercentileType.P10,
  '12': RAQIV2PercentileType.P50,
  '13': RAQIV2PercentileType.P90,
  '20': CustomDashboardSummaryCardAggregation.Total,
  '21': CustomDashboardSummaryCardAggregation.AverageOverTimePeriod,
  '22': CustomDashboardSummaryCardAggregation.MostRecentDataPoint,
  '23': CustomDashboardSummaryCardAggregation.Median,
  '24': CustomDashboardSummaryCardAggregation.Cumulative,
  '25': RAQIV2AggregationType.AveragePerUser,
};

const TITLE_SOURCE_TO_PROTO: Record<SummaryCardTitleSource, ApiDashboardTitleSource> = {
  [SummaryCardTitleSource.Auto]: 1,
  [SummaryCardTitleSource.Custom]: 2,
};

const PROTO_TO_TITLE_SOURCE: Record<string, SummaryCardTitleSource> = {
  DASHBOARD_TITLE_SOURCE_AUTO: SummaryCardTitleSource.Auto,
  DASHBOARD_TITLE_SOURCE_CUSTOM: SummaryCardTitleSource.Custom,
  '1': SummaryCardTitleSource.Auto,
  '2': SummaryCardTitleSource.Custom,
};

const SMOOTHING_TO_PROTO: Record<ChartTileSmoothing, ApiDashboardChartSmoothing> = {
  none: 1,
  weekly: 2,
};

const PROTO_TO_SMOOTHING: Record<string, ChartTileSmoothing> = {
  DASHBOARD_CHART_SMOOTHING_NONE: 'none',
  DASHBOARD_CHART_SMOOTHING_WEEKLY: 'weekly',
  '1': 'none',
  '2': 'weekly',
};

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function enumKey(value: unknown): string {
  return String(value);
}

function fail(message: string): never {
  throw new TypeError(message);
}

function mapEnumOrThrow<T extends string | number>(
  value: unknown,
  table: Record<string, T>,
  field: string,
): T {
  const mapped = table[enumKey(value)];
  if (mapped === undefined) {
    fail(`Unsupported ${field} value ${String(value)}.`);
  }
  return mapped;
}

function unmapEnumOrThrow<T extends string>(
  value: unknown,
  table: Record<string, T>,
  field: string,
): T {
  const mapped = table[enumKey(value)];
  if (mapped === undefined) {
    fail(`Unsupported backend ${field} value ${String(value)}.`);
  }
  return mapped;
}

function isProtoJsonTimestamp(value: string): value is ProtoJsonTimestamp {
  return !Number.isNaN(Date.parse(value));
}

function msToProtoTimestamp(ms: number): ProtoJsonTimestamp {
  // ProtoJSON encodes google.protobuf.Timestamp as an RFC3339 string. The
  // generated OpenAPI schema incorrectly models the message's seconds/nanos
  // fields, so narrow the RFC3339 wire representation to the intersection.
  const timestamp = new Date(ms).toISOString();
  if (!isProtoJsonTimestamp(timestamp)) {
    fail('Timestamp is outside the supported RFC3339 range.');
  }
  return timestamp;
}

function protoTimestampToMs(value: unknown, field: string): number {
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    if (!Number.isFinite(parsed)) {
      fail(`${field} is not a valid timestamp.`);
    }
    return parsed;
  }
  if (isObjectRecord(value)) {
    const seconds = Number(value.seconds ?? 0);
    const nanos = Number(value.nanos ?? 0);
    if (!Number.isFinite(seconds) || !Number.isFinite(nanos)) {
      fail(`${field} is not a valid timestamp.`);
    }
    return seconds * 1000 + Math.floor(nanos / 1_000_000);
  }
  return fail(`${field} is not a valid timestamp.`);
}

function toProtoFilters(filters: ReadonlyArray<TileFilter>): ApiTileFilter[] {
  return filters.map((filter) => ({
    dimensionKey: filter.dimension,
    values: [...filter.values],
  }));
}

function fromProtoFilters(raw: unknown, field: string): ReadonlyArray<TileFilter> {
  if (raw === undefined || raw === null) {
    return [];
  }
  if (!Array.isArray(raw)) {
    fail(`${field} must be an array.`);
  }
  return raw.map((entry, index) => {
    if (!isObjectRecord(entry)) {
      fail(`${field}[${index}] must be an object.`);
    }
    const dimensionKey = entry.dimensionKey ?? entry.dimension_key ?? entry.dimension;
    if (typeof dimensionKey !== 'string' || dimensionKey.length === 0) {
      fail(`${field}[${index}].dimensionKey must be a non-empty string.`);
    }
    const { values } = entry;
    if (!Array.isArray(values) || !values.every((value) => typeof value === 'string')) {
      fail(`${field}[${index}].values must be an array of strings.`);
    }
    return { dimension: dimensionKey, values };
  });
}

function validatedStringArray<T extends string>(
  raw: unknown,
  field: string,
  isValid: (value: string) => value is T,
): ReadonlyArray<T> | undefined {
  if (raw === undefined || raw === null) {
    return undefined;
  }
  if (!Array.isArray(raw) || !raw.every((value) => typeof value === 'string')) {
    fail(`${field} must be an array of strings.`);
  }
  return raw.map((value, index) => {
    if (!isValid(value)) {
      return fail(`${field}[${index}] is unsupported.`);
    }
    return value;
  });
}

type ComputedMetricFilter = NonNullable<ComputedMetricSource['filters']>[number];
const CUSTOM_EVENT_DIMENSION: string = RAQIV2Dimension.CustomEventName;

function isComputedMetricFilterDimension(
  value: string,
): value is ComputedMetricFilter['dimension'] {
  if (value === CUSTOM_EVENT_DIMENSION) {
    return false;
  }
  return isCanonicalRAQIV2Dimension(value);
}

function toComputedMetricFilter(filter: TileFilter, field: string): ComputedMetricFilter {
  if (!isComputedMetricFilterDimension(filter.dimension)) {
    return fail(`${field} contains an unsupported dimension.`);
  }
  return { dimension: filter.dimension, values: [...filter.values] };
}

function toProtoVariantSelections(
  selections: ReadonlyArray<DashboardMetricVariantSelection> | undefined,
): NonNullable<ApiDashboardMetricReference['variantSelections']> | undefined {
  if (!selections || selections.length === 0) {
    return undefined;
  }
  return selections.map((selection) => ({
    pseudoDimensionKey: selection.pseudoDimensionKey,
    variantKey: selection.variantKey,
  }));
}

function fromProtoVariantSelections(
  raw: unknown,
): ReadonlyArray<DashboardMetricVariantSelection> | undefined {
  if (!Array.isArray(raw) || raw.length === 0) {
    return undefined;
  }
  return raw.map((entry, index) => {
    if (!isObjectRecord(entry)) {
      fail(`variantSelections[${index}] must be an object.`);
    }
    const pseudoDimensionKey = entry.pseudoDimensionKey ?? entry.pseudo_dimension_key;
    const variantKey = entry.variantKey ?? entry.variant_key;
    if (typeof pseudoDimensionKey !== 'string' || typeof variantKey !== 'string') {
      fail(`variantSelections[${index}] is missing keys.`);
    }
    return { pseudoDimensionKey, variantKey };
  });
}

function pseudoDimensionValuesToVariantSelections(
  values: ComputedMetricSource['pseudoDimensionValues'],
): ReadonlyArray<DashboardMetricVariantSelection> | undefined {
  if (!values) {
    return undefined;
  }
  const selections: DashboardMetricVariantSelection[] = [];
  if (values.aggregationType) {
    selections.push({
      pseudoDimensionKey: RAQIV2UIPseudoDimension.AggregationType,
      variantKey: values.aggregationType,
    });
  }
  if (values.percentile) {
    selections.push({
      pseudoDimensionKey: RAQIV2UIPseudoDimension.PercentileType,
      variantKey: values.percentile,
    });
  }
  return selections.length > 0 ? selections : undefined;
}

function variantSelectionsToPseudoDimensionValues(
  selections: ReadonlyArray<DashboardMetricVariantSelection> | undefined,
): ComputedMetricSource['pseudoDimensionValues'] | undefined {
  if (!selections || selections.length === 0) {
    return undefined;
  }
  let aggregationType: RAQIV2AggregationType | null = null;
  let percentile: RAQIV2PercentileType | null = null;
  const aggregationPseudoKey: string = RAQIV2UIPseudoDimension.AggregationType;
  const percentilePseudoKey: string = RAQIV2UIPseudoDimension.PercentileType;
  for (const selection of selections) {
    if (selection.pseudoDimensionKey === aggregationPseudoKey) {
      if (!isRAQIV2AggregationType(selection.variantKey)) {
        fail(`Unsupported aggregation variant ${selection.variantKey}.`);
      }
      aggregationType = selection.variantKey;
    }
    if (selection.pseudoDimensionKey === percentilePseudoKey) {
      if (!isRAQIV2PercentileType(selection.variantKey)) {
        fail(`Unsupported percentile variant ${selection.variantKey}.`);
      }
      percentile = selection.variantKey;
    }
  }
  if (aggregationType === null && percentile === null) {
    return undefined;
  }
  return { aggregationType, percentile };
}

type ApiComputedMetricSource = NonNullable<
  NonNullable<ApiDashboardComputedMetric['sources']>[number]
>;

function toProtoComputedMetric(metric: ComputedMetric): ApiDashboardComputedMetric {
  const sources = metric.sources.map((source): ApiComputedMetricSource => {
    const atomic = source.metric;
    const variantSelections = toProtoVariantSelections(
      pseudoDimensionValuesToVariantSelections(source.pseudoDimensionValues),
    );
    const filters = source.filters ? toProtoFilters(source.filters) : undefined;
    if (isCustomEventsAtomicMetricLike(atomic)) {
      return {
        sourceKey: source.key,
        metric: {
          customEventMetric: {
            metricKey: atomic.metric,
            customEventName: atomic.customEventName,
            ...(atomic.aggregationType
              ? {
                  aggregation: mapEnumOrThrow(
                    atomic.aggregationType,
                    AGGREGATION_TO_PROTO,
                    'aggregation',
                  ),
                }
              : {}),
          },
        },
        ...(filters ? { filters } : {}),
        ...(variantSelections ? { variantSelections } : {}),
      };
    }
    return {
      sourceKey: source.key,
      metric: { metricKey: atomic },
      ...(filters ? { filters } : {}),
      ...(variantSelections ? { variantSelections } : {}),
    };
  });
  return {
    sources,
    formula: metric.formula,
    ...(metric.name !== undefined ? { displayName: metric.name } : {}),
    ...(metric.l7Smoothing !== undefined ? { l7Smoothing: metric.l7Smoothing } : {}),
  };
}

function fromProtoComputedMetric(raw: unknown, field: string): ComputedMetric {
  if (!isObjectRecord(raw)) {
    fail(`${field} must be an object.`);
  }
  const { sources, formula, displayName, l7Smoothing } = raw;
  if (!Array.isArray(sources) || sources.length === 0 || typeof formula !== 'string') {
    fail(`${field} is not a valid computed metric.`);
  }
  const mappedSources = sources.map((source, index): ComputedMetricSource => {
    if (!isObjectRecord(source)) {
      fail(`${field}.sources[${index}] must be an object.`);
    }
    const sourceKey = source.sourceKey ?? source.source_key ?? source.key;
    if (typeof sourceKey !== 'string' || sourceKey.length === 0) {
      fail(`${field}.sources[${index}].sourceKey must be set.`);
    }
    const metricRaw = source.metric;
    if (!isObjectRecord(metricRaw)) {
      fail(`${field}.sources[${index}].metric must be an object.`);
    }
    const customEvent = metricRaw.customEventMetric ?? metricRaw.custom_event_metric;
    let metric: ComputedMetricSource['metric'];
    if (isObjectRecord(customEvent)) {
      const customEventName = customEvent.customEventName ?? customEvent.custom_event_name;
      if (typeof customEventName !== 'string') {
        fail(`${field}.sources[${index}].metric.customEventMetric is invalid.`);
      }
      metric = {
        metric: RAQIV2UIMetric.CustomEventsV2,
        customEventName,
        ...(customEvent.aggregation !== undefined
          ? {
              aggregationType: (() => {
                const value = unmapEnumOrThrow(
                  customEvent.aggregation,
                  PROTO_TO_AGGREGATION,
                  'aggregation',
                );
                if (!isRAQIV2AggregationType(value)) {
                  return fail(`Unsupported custom-event aggregation ${value}.`);
                }
                return value;
              })(),
            }
          : {}),
      };
    } else {
      const metricKey = metricRaw.metricKey ?? metricRaw.metric_key;
      if (typeof metricKey !== 'string') {
        fail(`${field}.sources[${index}].metric.metricKey must be set.`);
      }
      if (!isMetricKey(metricKey)) {
        fail(`${field}.sources[${index}].metric.metricKey is unsupported.`);
      }
      metric = metricKey;
    }
    const filters =
      source.filters === undefined
        ? undefined
        : fromProtoFilters(source.filters, `${field}.sources[${index}].filters`);
    const computedFilters = filters?.map((filter) =>
      toComputedMetricFilter(filter, `${field}.sources[${index}].filters`),
    );
    const mappedSource: ComputedMetricSource = {
      key: sourceKey,
      metric,
      ...(computedFilters !== undefined ? { filters: computedFilters } : {}),
      pseudoDimensionValues: variantSelectionsToPseudoDimensionValues(
        fromProtoVariantSelections(source.variantSelections ?? source.variant_selections),
      ),
    };
    return mappedSource;
  });
  const [first, ...rest] = mappedSources;
  if (!first) {
    fail(`${field}.sources must be non-empty.`);
  }
  return {
    sources: [first, ...rest],
    formula,
    ...(typeof displayName === 'string' ? { name: displayName } : {}),
    ...(typeof l7Smoothing === 'boolean' ? { l7Smoothing } : {}),
  };
}

function toProtoMetricReference(metric: DashboardMetricReference): ApiDashboardMetricReference {
  const variantSelections = toProtoVariantSelections(metric.variantSelections);
  if (metric.computedMetric) {
    return {
      computedMetric: toProtoComputedMetric(metric.computedMetric),
      ...(variantSelections ? { variantSelections } : {}),
    };
  }
  return {
    metricKey: metric.metricKey,
    ...(variantSelections ? { variantSelections } : {}),
  };
}

function fromProtoMetricReference(raw: unknown, field: string): DashboardMetricReference {
  if (!isObjectRecord(raw)) {
    fail(`${field} must be an object.`);
  }
  const variantSelections = fromProtoVariantSelections(
    raw.variantSelections ?? raw.variant_selections,
  );
  const computedMetricRaw = raw.computedMetric ?? raw.computed_metric;
  if (computedMetricRaw !== undefined) {
    return {
      computedMetric: fromProtoComputedMetric(computedMetricRaw, `${field}.computedMetric`),
      variantSelections,
    };
  }
  const metricKey = raw.metricKey ?? raw.metric_key;
  if (typeof metricKey !== 'string' || metricKey.length === 0) {
    fail(`${field}.metricKey must be set.`);
  }
  return {
    metricKey: isMetricKey(metricKey)
      ? metricKey
      : fail(`${field}.metricKey is not a supported numeric metric.`),
    variantSelections,
  };
}

function toProtoDateRangeDefault(
  selection: DashboardDateRangeDefault,
): ApiDashboardDateRangeDefault {
  if (selection.type === 'Relative') {
    return { relativeRangeKey: selection.rangeType };
  }
  return {
    customRange: {
      startTime: msToProtoTimestamp(selection.startTimeMs),
      endTime: msToProtoTimestamp(selection.endTimeMs),
    },
  };
}

function fromProtoDateRangeDefault(
  raw: unknown,
  field: string,
): DashboardDateRangeDefault | undefined {
  if (raw === undefined || raw === null) {
    return undefined;
  }
  if (!isObjectRecord(raw)) {
    fail(`${field} must be an object.`);
  }
  const relativeRangeKey = raw.relativeRangeKey ?? raw.relative_range_key;
  if (typeof relativeRangeKey === 'string') {
    if (!isDateRangeType(relativeRangeKey)) {
      fail(`${field}.relativeRangeKey is unsupported.`);
    }
    return {
      type: 'Relative',
      rangeType: relativeRangeKey,
    };
  }
  const customRange = raw.customRange ?? raw.custom_range;
  if (!isObjectRecord(customRange)) {
    return undefined;
  }
  return {
    type: 'Custom',
    startTimeMs: protoTimestampToMs(
      customRange.startTime ?? customRange.start_time,
      `${field}.customRange.startTime`,
    ),
    endTimeMs: protoTimestampToMs(
      customRange.endTime ?? customRange.end_time,
      `${field}.customRange.endTime`,
    ),
  };
}

function toProtoTimeRangeOptions(options: DashboardTimeRangeOptions): ApiDashboardTimeRangeOptions {
  if (options.type === 'None') {
    return { none: {} };
  }
  if (options.defaultSelection) {
    return {
      dateRange: {
        defaultSelection: toProtoDateRangeDefault(options.defaultSelection),
      },
    };
  }
  return { dateRange: {} };
}

function fromProtoTimeRangeOptions(
  raw: unknown,
  field: string,
): DashboardTimeRangeOptions | undefined {
  if (raw === undefined || raw === null) {
    return undefined;
  }
  if (!isObjectRecord(raw)) {
    fail(`${field} must be an object.`);
  }
  if (raw.none !== undefined) {
    return { type: 'None' };
  }
  const dateRange = raw.dateRange ?? raw.date_range;
  if (dateRange === undefined) {
    return undefined;
  }
  if (!isObjectRecord(dateRange)) {
    fail(`${field}.dateRange must be an object.`);
  }
  return {
    type: 'DateRange',
    defaultSelection: fromProtoDateRangeDefault(
      dateRange.defaultSelection ?? dateRange.default_selection,
      `${field}.dateRange.defaultSelection`,
    ),
  };
}

function toProtoControls(controls: DashboardSurfaceControls): ApiDashboardSurfaceControls {
  const granularity = controls.defaultGranularity
    ? SURFACE_GRANULARITY_TO_PROTO[controls.defaultGranularity]
    : undefined;
  return {
    ...(controls.timeRangeOptions
      ? { timeRangeOptions: toProtoTimeRangeOptions(controls.timeRangeOptions) }
      : {}),
    ...(controls.filterDimensions ? { filterDimensionKeys: [...controls.filterDimensions] } : {}),
    ...(controls.defaultFilters ? { defaultFilters: toProtoFilters(controls.defaultFilters) } : {}),
    ...(controls.breakdownDimensions
      ? { breakdownDimensionKeys: [...controls.breakdownDimensions] }
      : {}),
    ...(controls.defaultBreakdown
      ? { defaultBreakdownDimensionKeys: [...controls.defaultBreakdown] }
      : {}),
    ...(granularity !== undefined ? { granularity: { fixed: { granularity } } } : {}),
    ...(controls.annotationOptions
      ? {
          annotationOptions: {
            defaultAnnotationTypeKeys: [...controls.annotationOptions.defaultAnnotationTypes],
            showAnnotationsControl: controls.annotationOptions.showAnnotationsControl,
          },
        }
      : {}),
  };
}

function fromProtoControls(raw: unknown, field: string): DashboardSurfaceControls {
  if (raw === undefined || raw === null) {
    return {};
  }
  if (!isObjectRecord(raw)) {
    fail(`${field} must be an object.`);
  }
  const fixedGranularity = isObjectRecord(raw.granularity)
    ? (raw.granularity.fixed ?? raw.granularity)
    : undefined;
  const granularityValue = isObjectRecord(fixedGranularity)
    ? fixedGranularity.granularity
    : undefined;
  const defaultGranularity =
    granularityValue === undefined
      ? undefined
      : PROTO_TO_SURFACE_GRANULARITY[enumKey(granularityValue)];

  const annotationOptionsRaw = raw.annotationOptions ?? raw.annotation_options;
  const annotationOptions = isObjectRecord(annotationOptionsRaw)
    ? (() => {
        const defaultAnnotationTypes =
          validatedStringArray(
            annotationOptionsRaw.defaultAnnotationTypeKeys ??
              annotationOptionsRaw.default_annotation_type_keys,
            `${field}.annotationOptions.defaultAnnotationTypeKeys`,
            isDefaultAnnotationType,
          ) ?? [];
        return {
          // Proto only persists defaults; restore the FE allowlist from those.
          supportedAnnotationTypes: defaultAnnotationTypes,
          defaultAnnotationTypes,
          showAnnotationsControl:
            typeof annotationOptionsRaw.showAnnotationsControl === 'boolean'
              ? annotationOptionsRaw.showAnnotationsControl
              : typeof annotationOptionsRaw.show_annotations_control === 'boolean'
                ? annotationOptionsRaw.show_annotations_control
                : true,
        };
      })()
    : undefined;

  const defaultFiltersRaw = raw.defaultFilters ?? raw.default_filters;
  const defaultFilters =
    defaultFiltersRaw === undefined
      ? undefined
      : fromProtoFilters(defaultFiltersRaw, `${field}.defaultFilters`);
  const filterDimensions = validatedStringArray(
    raw.filterDimensionKeys ?? raw.filter_dimension_keys,
    `${field}.filterDimensionKeys`,
    isCanonicalRAQIV2Dimension,
  );
  const breakdownDimensions = validatedStringArray(
    raw.breakdownDimensionKeys ?? raw.breakdown_dimension_keys,
    `${field}.breakdownDimensionKeys`,
    isCanonicalRAQIV2Dimension,
  );
  const defaultBreakdown = validatedStringArray(
    raw.defaultBreakdownDimensionKeys ?? raw.default_breakdown_dimension_keys,
    `${field}.defaultBreakdownDimensionKeys`,
    isDefaultBreakdownDimension,
  );

  return {
    timeRangeOptions: fromProtoTimeRangeOptions(
      raw.timeRangeOptions ?? raw.time_range_options,
      `${field}.timeRangeOptions`,
    ),
    filterDimensions,
    defaultFilters,
    breakdownDimensions,
    defaultBreakdown,
    defaultGranularity,
    annotationOptions,
  };
}

function toProtoChartOverlays(overlays: ChartOverlays | undefined): ApiChartOverlays | undefined {
  if (!overlays) {
    return undefined;
  }
  const result: ApiChartOverlays = {};
  if (overlays.genreBenchmark !== undefined) {
    result.genreBenchmark = overlays.genreBenchmark;
  }
  if (overlays.similarExperienceBenchmark !== undefined) {
    result.similarExperienceBenchmark = overlays.similarExperienceBenchmark;
  }
  if (overlays.topExperienceBenchmark !== undefined) {
    result.topExperienceBenchmark = overlays.topExperienceBenchmark;
  }
  if (overlays.previousPeriod !== undefined) {
    if (typeof overlays.previousPeriod !== 'boolean') {
      // TODO(DSA-5989): persist configured previous-period offsets once the
      // analytics custom dashboards backend contract supports them.
      fail('Backend v1 cannot persist configured previous-period comparison offsets.');
    }
    result.previousPeriod = overlays.previousPeriod;
  }
  if (overlays.quota !== undefined) {
    result.quota = overlays.quota;
  }
  return Object.keys(result).length > 0 ? result : undefined;
}

function fromProtoChartOverlays(raw: unknown): ChartOverlays | undefined {
  if (!isObjectRecord(raw)) {
    return undefined;
  }
  const overlays: ChartOverlays = {
    ...(typeof raw.genreBenchmark === 'boolean' || typeof raw.genre_benchmark === 'boolean'
      ? { genreBenchmark: Boolean(raw.genreBenchmark ?? raw.genre_benchmark) }
      : {}),
    ...(typeof raw.similarExperienceBenchmark === 'boolean' ||
    typeof raw.similar_experience_benchmark === 'boolean'
      ? {
          similarExperienceBenchmark: Boolean(
            raw.similarExperienceBenchmark ?? raw.similar_experience_benchmark,
          ),
        }
      : {}),
    ...(typeof raw.topExperienceBenchmark === 'boolean' ||
    typeof raw.top_experience_benchmark === 'boolean'
      ? {
          topExperienceBenchmark: Boolean(
            raw.topExperienceBenchmark ?? raw.top_experience_benchmark,
          ),
        }
      : {}),
    ...(typeof raw.previousPeriod === 'boolean' || typeof raw.previous_period === 'boolean'
      ? { previousPeriod: Boolean(raw.previousPeriod ?? raw.previous_period) }
      : {}),
    ...(typeof raw.quota === 'boolean' ? { quota: raw.quota } : {}),
  };
  return Object.keys(overlays).length > 0 ? overlays : undefined;
}

function toProtoChartTileMetric(metric: ChartTileMetric): ApiChartTileMetric {
  return {
    metric: toProtoMetricReference(metric.metric),
    seriesKey: metric.seriesKey,
    ...(metric.aggregation
      ? {
          aggregation: mapEnumOrThrow(metric.aggregation, AGGREGATION_TO_PROTO, 'aggregation'),
        }
      : {}),
  };
}

function fromProtoChartTileMetric(raw: unknown, field: string): ChartTileMetric {
  if (!isObjectRecord(raw)) {
    fail(`${field} must be an object.`);
  }
  const seriesKey = raw.seriesKey ?? raw.series_key;
  if (typeof seriesKey !== 'string' || seriesKey.length === 0) {
    fail(`${field}.seriesKey must be set.`);
  }
  return {
    metric: fromProtoMetricReference(raw.metric, `${field}.metric`),
    seriesKey,
    ...(raw.aggregation !== undefined
      ? {
          aggregation: (() => {
            const value = unmapEnumOrThrow(raw.aggregation, PROTO_TO_AGGREGATION, 'aggregation');
            return isChartAggregation(value)
              ? value
              : fail(`Unsupported chart aggregation ${value}.`);
          })(),
        }
      : {}),
  };
}

function toProtoSummaryCard(tile: SummaryCardTileConfig): ApiSummaryCardTile {
  return {
    tileId: tile.tileId,
    ...(tile.title !== undefined ? { title: tile.title } : {}),
    metric: toProtoMetricReference(tile.metric),
    aggregation: mapEnumOrThrow(tile.aggregation, AGGREGATION_TO_PROTO, 'aggregation'),
    filters: toProtoFilters(tile.filters),
    titleSource: mapEnumOrThrow(
      tile.titleSource ?? SummaryCardTitleSource.Auto,
      TITLE_SOURCE_TO_PROTO,
      'titleSource',
    ),
  };
}

function fromProtoSummaryCard(raw: unknown, field: string): SummaryCardTileConfig {
  if (!isObjectRecord(raw)) {
    fail(`${field} must be an object.`);
  }
  const tileId = raw.tileId ?? raw.tile_id;
  if (typeof tileId !== 'string' || tileId.length === 0) {
    fail(`${field}.tileId must be set.`);
  }
  const titleSourceRaw = raw.titleSource ?? raw.title_source;
  return {
    type: 'SummaryCard',
    tileId,
    ...(typeof raw.title === 'string' ? { title: raw.title } : {}),
    metric: fromProtoMetricReference(raw.metric, `${field}.metric`),
    aggregation: unmapEnumOrThrow(raw.aggregation, PROTO_TO_AGGREGATION, 'aggregation'),
    filters: fromProtoFilters(raw.filters, `${field}.filters`),
    ...(titleSourceRaw !== undefined
      ? { titleSource: unmapEnumOrThrow(titleSourceRaw, PROTO_TO_TITLE_SOURCE, 'titleSource') }
      : {}),
  };
}

function toProtoChartTile(tile: ChartTileConfig): ApiChartTile {
  const overlays = toProtoChartOverlays(tile.chartSpec.overlays);
  // Backend treats omitted enum fields as Invalid and rejects the document.
  // TODO(DSA-5986): stop inventing chart aggregation once BE makes it optional.
  const primaryMetric = tile.dataSpec.metrics[0]?.metric;
  const aggregation =
    tile.dataSpec.aggregation ??
    (primaryMetric !== undefined
      ? resolveDefaultChartAggregation(primaryMetric)
      : RAQIV2AggregationType.Average);
  return {
    tileId: tile.tileId,
    ...(tile.title !== undefined ? { title: tile.title } : {}),
    dataSpec: {
      metrics: tile.dataSpec.metrics.map(toProtoChartTileMetric),
      aggregation: mapEnumOrThrow(aggregation, AGGREGATION_TO_PROTO, 'aggregation'),
      ...(tile.dataSpec.breakdownDimensions
        ? { breakdownDimensionKeys: [...tile.dataSpec.breakdownDimensions] }
        : {}),
      granularity: mapEnumOrThrow(tile.dataSpec.granularity, TIME_INTERVAL_TO_PROTO, 'granularity'),
      filters: toProtoFilters(tile.dataSpec.filters),
    },
    chartSpec: {
      chartType: mapEnumOrThrow(tile.chartSpec.chartType, CHART_TYPE_TO_PROTO, 'chartType'),
      ...(overlays ? { overlays } : {}),
      ...(tile.chartSpec.smoothing
        ? {
            smoothing: mapEnumOrThrow(tile.chartSpec.smoothing, SMOOTHING_TO_PROTO, 'smoothing'),
          }
        : {}),
    },
  };
}

function fromProtoChartTile(raw: unknown, field: string): ChartTileConfig {
  if (!isObjectRecord(raw)) {
    fail(`${field} must be an object.`);
  }
  const tileId = raw.tileId ?? raw.tile_id;
  if (typeof tileId !== 'string' || tileId.length === 0) {
    fail(`${field}.tileId must be set.`);
  }
  const dataSpec = raw.dataSpec ?? raw.data_spec;
  const chartSpec = raw.chartSpec ?? raw.chart_spec;
  if (!isObjectRecord(dataSpec) || !isObjectRecord(chartSpec)) {
    fail(`${field} must include dataSpec and chartSpec.`);
  }
  if (!Array.isArray(dataSpec.metrics)) {
    fail(`${field}.dataSpec.metrics must be an array.`);
  }
  const chartType = unmapEnumOrThrow(
    chartSpec.chartType ?? chartSpec.chart_type,
    PROTO_TO_CHART_TYPE,
    'chartType',
  );
  const granularityRaw = dataSpec.granularity;
  const smoothingRaw = chartSpec.smoothing;
  let aggregation: ChartAggregation | undefined;
  if (dataSpec.aggregation !== undefined) {
    const value = unmapEnumOrThrow(dataSpec.aggregation, PROTO_TO_AGGREGATION, 'aggregation');
    if (!isChartAggregation(value)) {
      fail(`Unsupported chart aggregation ${value}.`);
    }
    aggregation = value;
  }
  const breakdownDimensionKeys =
    dataSpec.breakdownDimensionKeys ?? dataSpec.breakdown_dimension_keys;
  let breakdownDimensions: ReadonlyArray<string> | undefined;
  if (Array.isArray(breakdownDimensionKeys)) {
    if (!breakdownDimensionKeys.every((value) => typeof value === 'string')) {
      fail(`${field}.dataSpec.breakdownDimensionKeys must contain strings.`);
    }
    breakdownDimensions = breakdownDimensionKeys;
  }
  const granularity =
    granularityRaw !== undefined
      ? unmapEnumOrThrow(granularityRaw, PROTO_TO_TIME_INTERVAL, 'granularity')
      : DEFAULT_CHART_GRANULARITY;
  return {
    type: 'Chart',
    tileId,
    ...(typeof raw.title === 'string' ? { title: raw.title } : {}),
    dataSpec: {
      metrics: dataSpec.metrics.map((metric, index) =>
        fromProtoChartTileMetric(metric, `${field}.dataSpec.metrics[${index}]`),
      ),
      ...(aggregation !== undefined ? { aggregation } : {}),
      ...(breakdownDimensions !== undefined ? { breakdownDimensions } : {}),
      granularity,
      filters: fromProtoFilters(dataSpec.filters, `${field}.dataSpec.filters`),
    },
    chartSpec: {
      chartType,
      overlays: fromProtoChartOverlays(chartSpec.overlays),
      ...(smoothingRaw !== undefined
        ? { smoothing: unmapEnumOrThrow(smoothingRaw, PROTO_TO_SMOOTHING, 'smoothing') }
        : {}),
    },
  };
}

function toProtoComponent(component: DashboardComponent): ApiDashboardComponent {
  if (component.type === 'SummaryCard') {
    return { summaryCard: toProtoSummaryCard(component.summaryCard) };
  }
  return { chart: toProtoChartTile(component.chart) };
}

function fromProtoComponent(
  raw: unknown,
  field: string,
): {
  readonly type: 'Component';
  readonly component:
    | { readonly type: 'SummaryCard'; readonly summaryCard: SummaryCardTileConfig }
    | { readonly type: 'Chart'; readonly chart: ChartTileConfig };
} {
  if (!isObjectRecord(raw)) {
    fail(`${field} must be an object.`);
  }
  const summaryCard = raw.summaryCard ?? raw.summary_card;
  if (summaryCard !== undefined) {
    return {
      type: 'Component',
      component: {
        type: 'SummaryCard',
        summaryCard: fromProtoSummaryCard(summaryCard, `${field}.summaryCard`),
      },
    };
  }
  const chart = raw.chart;
  if (chart !== undefined) {
    return {
      type: 'Component',
      component: {
        type: 'Chart',
        chart: fromProtoChartTile(chart, `${field}.chart`),
      },
    };
  }
  return fail(`${field} must set chart or summaryCard.`);
}

function toProtoLayoutNode(node: DashboardLayoutNode): ApiDashboardLayoutNode {
  switch (node.type) {
    case 'Component':
      return { component: toProtoComponent(node.component) };
    case 'Stack':
      return { stack: { children: node.children.map(toProtoLayoutNode) } };
    case 'Flex':
      return { flex: { children: node.children.map(toProtoLayoutNode) } };
    case 'Grid':
      return {
        grid: {
          columnCount: node.columnCount,
          children: node.children.map(toProtoLayoutNode),
        },
      };
    default: {
      const exhaustiveCheck: never = node;
      return fail(`Unsupported layout node ${JSON.stringify(exhaustiveCheck)}.`);
    }
  }
}

function fromProtoLayoutNode(raw: unknown, field: string): DashboardLayoutNode {
  if (!isObjectRecord(raw)) {
    fail(`${field} must be an object.`);
  }

  // Legacy FE discriminant shape (local tests / older fixtures).
  if (typeof raw.type === 'string') {
    if (raw.type === 'Component') {
      return fromProtoComponent(raw.component, `${field}.component`);
    }
    if (raw.type === 'Stack' || raw.type === 'Flex') {
      if (!Array.isArray(raw.children)) {
        fail(`${field}.children must be an array.`);
      }
      return {
        type: raw.type,
        children: raw.children.map((child, index) =>
          fromProtoLayoutNode(child, `${field}.children[${index}]`),
        ),
      };
    }
    if (raw.type === 'Grid') {
      if (!Array.isArray(raw.children)) {
        fail(`${field}.children must be an array.`);
      }
      const columnCount = raw.columnCount ?? raw.column_count;
      if (columnCount !== 1 && columnCount !== 2) {
        fail(`${field}.columnCount must be 1 or 2.`);
      }
      return {
        type: 'Grid',
        columnCount,
        children: raw.children.map((child, index) =>
          fromProtoLayoutNode(child, `${field}.children[${index}]`),
        ),
      };
    }
  }

  if (raw.component !== undefined) {
    return fromProtoComponent(raw.component, `${field}.component`);
  }
  if (raw.stack !== undefined) {
    if (!isObjectRecord(raw.stack) || !Array.isArray(raw.stack.children)) {
      fail(`${field}.stack.children must be an array.`);
    }
    return {
      type: 'Stack',
      children: raw.stack.children.map((child, index) =>
        fromProtoLayoutNode(child, `${field}.stack.children[${index}]`),
      ),
    };
  }
  if (raw.flex !== undefined) {
    if (!isObjectRecord(raw.flex) || !Array.isArray(raw.flex.children)) {
      fail(`${field}.flex.children must be an array.`);
    }
    return {
      type: 'Flex',
      children: raw.flex.children.map((child, index) =>
        fromProtoLayoutNode(child, `${field}.flex.children[${index}]`),
      ),
    };
  }
  if (raw.grid !== undefined) {
    if (!isObjectRecord(raw.grid) || !Array.isArray(raw.grid.children)) {
      fail(`${field}.grid.children must be an array.`);
    }
    const columnCount = raw.grid.columnCount ?? raw.grid.column_count;
    if (columnCount !== 1 && columnCount !== 2) {
      fail(`${field}.grid.columnCount must be 1 or 2.`);
    }
    return {
      type: 'Grid',
      columnCount,
      children: raw.grid.children.map((child, index) =>
        fromProtoLayoutNode(child, `${field}.grid.children[${index}]`),
      ),
    };
  }
  return fail(`${field} must set component, stack, flex, or grid.`);
}

function toProtoPage(page: CustomDashboardConfig['page']): ApiDashboardPage {
  if (page.mode !== DashboardPageMode.Untabbed) {
    fail('Only untabbed dashboard pages can be serialized to the backend.');
  }
  return {
    untabbed: {
      surface: {
        resourceTypeKeys: [PROTO_RESOURCE_TYPE_UNIVERSE],
        controls: toProtoControls(page.surface.controls),
        bodyNodes: page.surface.bodyNodes.map(toProtoLayoutNode),
      },
    },
  };
}

function fromProtoPage(raw: unknown, field: string): CustomDashboardConfig['page'] {
  if (!isObjectRecord(raw)) {
    fail(`${field} must be an object.`);
  }

  // Legacy FE discriminant shape.
  if (raw.mode === DashboardPageMode.Untabbed) {
    const surface = raw.surface;
    if (!isObjectRecord(surface)) {
      fail(`${field}.surface must be an object.`);
    }
    const bodyNodes = surface.bodyNodes ?? surface.body_nodes;
    if (!Array.isArray(bodyNodes)) {
      fail(`${field}.surface.bodyNodes must be an array.`);
    }
    return {
      mode: DashboardPageMode.Untabbed,
      surface: {
        controls: fromProtoControls(surface.controls, `${field}.surface.controls`),
        bodyNodes: bodyNodes.map((node, index) =>
          fromProtoLayoutNode(node, `${field}.surface.bodyNodes[${index}]`),
        ),
      },
    };
  }

  const untabbed = raw.untabbed;
  if (!isObjectRecord(untabbed)) {
    fail(`${field}.untabbed must be an object.`);
  }
  const surface = untabbed.surface;
  if (!isObjectRecord(surface)) {
    fail(`${field}.untabbed.surface must be an object.`);
  }
  const bodyNodes = surface.bodyNodes ?? surface.body_nodes;
  if (!Array.isArray(bodyNodes)) {
    fail(`${field}.untabbed.surface.bodyNodes must be an array.`);
  }
  return {
    mode: DashboardPageMode.Untabbed,
    surface: {
      controls: fromProtoControls(surface.controls, `${field}.untabbed.surface.controls`),
      bodyNodes: bodyNodes.map((node, index) =>
        fromProtoLayoutNode(node, `${field}.untabbed.surface.bodyNodes[${index}]`),
      ),
    },
  };
}

export function customDashboardConfigToBackendDocument(
  config: CustomDashboardConfig,
): BackendCustomDashboardDocument {
  const validated = validateCustomDashboardConfig(config);
  return {
    schemaVersion: CUSTOM_DASHBOARD_CURRENT_SCHEMA_VERSION,
    config: {
      page: toProtoPage(validated.page),
    },
  };
}

export function backendDocumentToCustomDashboardConfig(document: unknown): CustomDashboardConfig {
  if (!isObjectRecord(document)) {
    fail('Backend custom dashboard document is missing config.');
  }
  const schemaVersion = document.schemaVersion ?? document.schema_version;
  if (schemaVersion !== CUSTOM_DASHBOARD_CURRENT_SCHEMA_VERSION) {
    fail(`Unsupported backend custom dashboard schema version ${String(schemaVersion)}.`);
  }
  if (!isObjectRecord(document.config)) {
    fail('Backend custom dashboard document is missing config.');
  }
  if (!isObjectRecord(document.config.page)) {
    fail('config.page must be an object.');
  }
  // Read path: skip tile caps so previously saved over-cap dashboards remain
  // loadable. Writes go through `customDashboardConfigToBackendDocument`, which
  // keeps the default write-time enforcement.
  return validateCustomDashboardConfig(
    {
      page: fromProtoPage(document.config.page, 'config.page'),
    },
    { enforceTileCaps: false },
  );
}
