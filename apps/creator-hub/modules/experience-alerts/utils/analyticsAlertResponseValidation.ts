import {
  RAQIV2AggregationType,
  RAQIV2APIMetric,
  RAQIV2Dimension,
  RAQIV2Metric,
  RAQIV2MetricDisplayConfig,
  RAQIV2MetricToSupportedGranularities,
  RAQIV2PercentileType,
  RAQIV2UIMetric,
  RAQIV2UIMetricToAPIConfig,
  RAQIV2UIPseudoDimension,
  type RAQIV2MetricGranularity,
  type TRAQIV2Dimension,
  type TRAQIV2UIMetricToAPIConfig,
} from '@rbx/creator-hub-analytics-config';
import type {
  QueryFilter,
  TQueryFilter,
  UIQueryFilter,
} from '@modules/clients/analytics/analyticsRAQIShared';
import { isNumericUIMetric } from '@modules/experience-analytics-shared/constants/AnalyticsMetricDisplayConfig';
import { getUIMetric } from '@modules/experience-analytics-shared/utils/getUIMetric';
import { isValidEnumValue } from '@modules/miscellaneous/utils/enumUtils';
import {
  AnalyticsAlertResourceType,
  AnalyticsAlertSeverity,
  type AnalyticsAlertCondition,
  type AnalyticsAlertDetail,
  type AnalyticsAlertIncidentDetail,
  type AnalyticsAlertInterval,
  type RawAnalyticsAlertDetail,
  type RawAnalyticsAlertIncidentDetail,
  type TAlertConditionMetric,
} from '../constants/types';
import {
  getAlertBreakdownDimensionsForMetric,
  getAlertFilterDimensionsForMetric,
  metricGranularityFromAnalyticsInterval,
  resolveCanonicalAlertMetric,
} from './analyticsAlertFormUtils';

const parseUniverseIdFromResourceId = (resourceId: string): number => {
  const id = Number(resourceId);
  if (!Number.isFinite(id) || id <= 0) {
    throw new Error(`Analytics alert resourceId is not a valid universe id: ${resourceId}`);
  }
  return id;
};

type PercentileFanoutConfig = Extract<
  TRAQIV2UIMetricToAPIConfig,
  { dimension: RAQIV2UIPseudoDimension.PercentileType }
>;

type AggregationFanoutConfig = Extract<
  TRAQIV2UIMetricToAPIConfig,
  { dimension: RAQIV2UIPseudoDimension.AggregationType }
>;

const findPercentileFanoutFilter = (
  config: PercentileFanoutConfig,
  apiMetric: string,
): UIQueryFilter | undefined => {
  for (const [key, candidate] of Object.entries(config.byPercentileType)) {
    // oxlint-disable-next-line typescript-eslint/no-unsafe-enum-comparison -- comparing string-valued enum against an opaque API string
    if (candidate === apiMetric && isValidEnumValue(RAQIV2PercentileType, key)) {
      return { dimension: RAQIV2UIPseudoDimension.PercentileType, values: [key] };
    }
  }
  return undefined;
};

const findAggregationFanoutFilter = (
  config: AggregationFanoutConfig,
  apiMetric: string,
): UIQueryFilter | undefined => {
  for (const [key, candidate] of Object.entries(config.byAggregationType)) {
    // oxlint-disable-next-line typescript-eslint/no-unsafe-enum-comparison -- comparing string-valued enum against an opaque API string
    if (candidate === apiMetric && isValidEnumValue(RAQIV2AggregationType, key)) {
      return { dimension: RAQIV2UIPseudoDimension.AggregationType, values: [key] };
    }
  }
  return undefined;
};

/**
 * Reverse of `resolveUiAlertMetricToApiMetricForCreateRequest` in `analyticsAlertFormToApiRequest`:
 * resolves an API metric back to its alert-eligible UI metric, and reconstructs the
 * MetricFanout pseudo filter (e.g. `PercentileType=[P90]`, `AggregationType=[Sum]`) that the
 * UI form needs in order to round-trip the same alert configuration.
 */
const resolveApiAlertMetricToUiAlertMetric = (
  apiMetric: string,
): { uiMetric: TAlertConditionMetric; pseudoFilter?: UIQueryFilter } => {
  if (
    !isValidEnumValue(RAQIV2APIMetric, apiMetric) &&
    !isValidEnumValue(RAQIV2Metric, apiMetric) &&
    !isValidEnumValue(RAQIV2UIMetric, apiMetric)
  ) {
    throw new Error(`Analytics alert metric is not a known RAQIV2 metric: ${apiMetric}`);
  }
  const resolvedUiMetric = getUIMetric(apiMetric);

  if (
    !isNumericUIMetric(resolvedUiMetric) ||
    !RAQIV2MetricDisplayConfig[resolvedUiMetric]?.isEligibleForAlerting
  ) {
    throw new Error(`Analytics alert metric is not eligible for alerting: ${apiMetric}`);
  }

  // `getUIMetric` resolves a shared API metric to the first matching UI metric,
  // which for server memory usage is the by-age variant we no longer surface in
  // the alert form. Remap it to the canonical alert metric so the loaded value
  // matches a selectable dropdown option (the canonical metric shares the same
  // API-metric fanout, so the percentile pseudo filter below is unaffected).
  const uiMetric = resolveCanonicalAlertMetric(resolvedUiMetric);

  // Non-fanout direct metric (a `RAQIV2Metric`) — no pseudo filter to reconstruct.
  if (!isValidEnumValue(RAQIV2UIMetric, uiMetric)) {
    return { uiMetric };
  }

  const config = RAQIV2UIMetricToAPIConfig[uiMetric];
  const pseudoFilter =
    config.dimension === RAQIV2UIPseudoDimension.PercentileType
      ? findPercentileFanoutFilter(config, apiMetric)
      : findAggregationFanoutFilter(config, apiMetric);

  return { uiMetric, pseudoFilter };
};

/**
 * Loose row shapes accepted by the dimension-mapping helpers. Both the raw SDK
 * alert-detail and the (already RAQIV2Dimension-validated) incident-detail
 * shapes structurally satisfy these — `TRAQIV2Dimension` extends `string`.
 */
type RawFilterRow = { dimension: string; values: readonly string[] };
type RawBreakdownRow = { dimensions: readonly string[] };

const mapRawApiDimensionFilters = (
  rawFilters: ReadonlyArray<RawFilterRow> | null | undefined,
  allowedFilterDimensions: readonly TRAQIV2Dimension[],
): readonly QueryFilter[] => {
  if (!rawFilters?.length) {
    return [];
  }
  return rawFilters
    .filter(
      (row): row is RawFilterRow & { dimension: RAQIV2Dimension } =>
        isValidEnumValue(RAQIV2Dimension, row.dimension) &&
        allowedFilterDimensions.includes(row.dimension),
    )
    .map((row) => ({
      dimension: row.dimension,
      values: [...row.values],
    }));
};

const mapRawBreakdown = (
  rawBreakdown: ReadonlyArray<RawBreakdownRow> | null | undefined,
  allowedBreakdownDimensions: readonly TRAQIV2Dimension[],
): readonly TRAQIV2Dimension[] => {
  if (!rawBreakdown?.length) {
    return [];
  }
  return rawBreakdown.flatMap((entry) =>
    entry.dimensions.filter(
      (dim): dim is RAQIV2Dimension =>
        isValidEnumValue(RAQIV2Dimension, dim) && allowedBreakdownDimensions.includes(dim),
    ),
  );
};

const assertGranularitySupportedByMetric = (
  granularity: RAQIV2MetricGranularity,
  uiMetric: TAlertConditionMetric,
): void => {
  const supportedGranularities = RAQIV2MetricToSupportedGranularities[uiMetric] ?? [];
  if (!supportedGranularities.includes(granularity)) {
    throw new Error(
      `Analytics alert granularity "${granularity}" is not supported by metric "${uiMetric}"`,
    );
  }
};

const filterPseudoFilterIfAllowed = (
  pseudoFilter: UIQueryFilter | undefined,
  allowedFilterDimensions: readonly TRAQIV2Dimension[],
): UIQueryFilter | undefined => {
  if (!pseudoFilter) {
    return undefined;
  }
  return allowedFilterDimensions.includes(pseudoFilter.dimension) ? pseudoFilter : undefined;
};

/**
 * Common alert-config-shaped input accepted by {@link refineRawAlertConfigFields}.
 * Both `RawAnalyticsAlertDetail` (top-level fields are the alert-config fields)
 * and `RawAnalyticsAlertIncidentDetail` (where the same fields were lifted from
 * the SDK's nested `alertConfig` block — see analytics-alerts PR #54) satisfy
 * this shape structurally.
 */
type RawAlertConfigFields = {
  metric: string;
  severity: string;
  description?: string | null;
  interval: AnalyticsAlertInterval;
  filter?: ReadonlyArray<RawFilterRow> | null;
  breakdown?: ReadonlyArray<RawBreakdownRow> | null;
  condition: AnalyticsAlertCondition;
};

/**
 * Refined / UI-facing version of {@link RawAlertConfigFields} produced by
 * {@link refineRawAlertConfigFields}. Same fields that `AnalyticsAlertDetail`
 * has already exposed historically; we keep them in one place so the alert
 * detail and incident detail stay byte-identical on these dimensions.
 */
export type RefinedAlertConfigFields = {
  metric: TAlertConditionMetric;
  description: string;
  severity: AnalyticsAlertSeverity;
  granularity: RAQIV2MetricGranularity;
  filter: readonly TQueryFilter[];
  breakdown: readonly TRAQIV2Dimension[];
  condition: AnalyticsAlertCondition;
};

/**
 * Convert the raw alert-config-shaped fields (severity wire string, interval,
 * API-metric string, raw filter/breakdown rows) into the refined UI shape
 * (`AnalyticsAlertSeverity`, `RAQIV2MetricGranularity`, `TAlertConditionMetric`
 * with reconstructed pseudo filter, `TRAQIV2Dimension`-restricted filter and
 * breakdown). Throws when severity / interval / metric are unknown or the
 * metric isn't alert-eligible — callers in `AnalyticsAlertClientProvider`
 * already wrap every parse in `try/catch` and drop the row on failure.
 */
export const refineRawAlertConfigFields = (raw: RawAlertConfigFields): RefinedAlertConfigFields => {
  if (!isValidEnumValue(AnalyticsAlertSeverity, raw.severity)) {
    throw new Error(`Invalid analytics alert severity: ${raw.severity}`);
  }
  const granularity: RAQIV2MetricGranularity | undefined = metricGranularityFromAnalyticsInterval(
    raw.interval,
  );
  if (!granularity) {
    throw new Error(`Unsupported analytics alert interval: ${raw.interval}`);
  }

  const { uiMetric, pseudoFilter } = resolveApiAlertMetricToUiAlertMetric(raw.metric);
  assertGranularitySupportedByMetric(granularity, uiMetric);
  const allowedFilterDimensions = getAlertFilterDimensionsForMetric(uiMetric);
  const allowedBreakdownDimensions = getAlertBreakdownDimensionsForMetric(uiMetric);
  const allowedPseudoFilter = filterPseudoFilterIfAllowed(pseudoFilter, allowedFilterDimensions);
  const apiDimensionFilters = mapRawApiDimensionFilters(raw.filter, allowedFilterDimensions);
  const combinedFilter: readonly TQueryFilter[] = allowedPseudoFilter
    ? [allowedPseudoFilter, ...apiDimensionFilters]
    : apiDimensionFilters;

  return {
    metric: uiMetric,
    description: raw.description ?? '',
    severity: raw.severity,
    granularity,
    filter: combinedFilter,
    breakdown: mapRawBreakdown(raw.breakdown, allowedBreakdownDimensions),
    condition: raw.condition,
  };
};

const parseWebhookConfigurationIds = (
  webhookReceiverConfig: RawAnalyticsAlertDetail['webhookReceiverConfig'],
): readonly string[] =>
  webhookReceiverConfig?.receivers
    ?.map((r) => r.webhookConfigurationId)
    .filter((id): id is string => typeof id === 'string' && id.length > 0) ?? [];

export const rawAnalyticsAlertToDetail = (raw: RawAnalyticsAlertDetail): AnalyticsAlertDetail => {
  if (raw.resourceType !== AnalyticsAlertResourceType.Universe) {
    throw new Error(`Unsupported analytics alert resourceType: ${String(raw.resourceType)}`);
  }
  const refined = refineRawAlertConfigFields({
    metric: raw.metric,
    severity: raw.severity,
    description: raw.description,
    interval: raw.interval,
    filter: raw.filter,
    breakdown: raw.breakdown,
    condition: raw.condition,
  });
  return {
    alertId: raw.alertId,
    universeId: parseUniverseIdFromResourceId(raw.resourceId),
    name: raw.name,
    consecutiveOccurrences: raw.consecutiveOccurrences,
    configState: raw.configState,
    firingStatus: raw.firingStatus,
    lastFiredAt: raw.lastFiredAt ?? undefined,
    createdAt: raw.createdAt,
    lastModifiedAt: raw.lastModifiedAt,
    lastModifiedBy: raw.lastModifiedBy ?? undefined,
    webhookConfigurationIds: parseWebhookConfigurationIds(raw.webhookReceiverConfig),
    ...refined,
  };
};

export const rawAnalyticsAlertIncidentToDetail = (
  raw: RawAnalyticsAlertIncidentDetail,
): AnalyticsAlertIncidentDetail => {
  const refined = refineRawAlertConfigFields({
    metric: raw.metric,
    severity: raw.severity,
    description: raw.description,
    interval: raw.interval,
    filter: raw.filter,
    breakdown: raw.breakdown,
    condition: raw.condition,
  });
  // Drop the raw alert-config-shape fields and overlay the refined ones so
  // `AnalyticsAlertIncidentDetail` exposes the UI-facing types only.
  const {
    metric: _metric,
    severity: _severity,
    description: _description,
    interval: _interval,
    filter: _filter,
    breakdown: _breakdown,
    condition: _condition,
    ...incidentOnly
  } = raw;
  return { ...incidentOnly, ...refined };
};
