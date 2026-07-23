import {
  RAQIV2AggregationType,
  RAQIV2DateRangeType,
  RAQIV2Dimension,
  RAQIV2MetricGranularity,
  RAQIV2PercentileType,
  RAQIV2UIPseudoDimension,
} from '@rbx/creator-hub-analytics-config';
import type { TRAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import { ChartType } from '@modules/charts-generic/charts/types/ChartTypes';
import { AnnotationType } from '@modules/clients/analytics/annotations/annotations';
import { MAX_TABLE_METRIC_COLUMNS } from '@modules/experience-analytics-shared/components/chartConfigurator/chartConfiguratorTableColumns';
import { isNumericUIMetric } from '@modules/experience-analytics-shared/constants/AnalyticsMetricDisplayConfig';
import type { ComputedMetric } from '@modules/experience-analytics-shared/types/ComputedMetric';
import {
  deserializeComputedMetricFromQueryParam,
  serializeComputedMetricToQueryParam,
} from '@modules/experience-analytics-shared/types/ComputedMetricQueryParam';
import { CustomDashboardValidationError } from '../errors';
import {
  CUSTOM_DASHBOARD_CHART_TYPES,
  CUSTOM_DASHBOARD_CURRENT_SCHEMA_VERSION,
  CustomDashboardSummaryCardAggregation,
  MAX_CHART_TILES_PER_DASHBOARD,
  MAX_DASHBOARD_DESCRIPTION_LENGTH,
  MAX_DASHBOARD_NAME_LENGTH,
  MAX_SUMMARY_CARDS_PER_DASHBOARD,
  MAX_TILE_TITLE_LENGTH,
  type ChartAggregation,
  type ChartTileConfig,
  type ChartTileSmoothing,
  type CustomDashboardConfig,
  type CustomDashboardChartType,
  type CustomDashboardDocument,
  type CustomDashboardMetricKey,
  type CustomDashboardStatus,
  DashboardPageMode,
  type DashboardDateRangeDefault,
  type DashboardLayoutNode,
  type DashboardMetricReference,
  type DashboardMetricVariantSelection,
  type SummaryCardAggregation,
  SummaryCardTitleSource,
  type SummaryCardTitleSource as SummaryCardTitleSourceValue,
  type SummaryCardTileConfig,
  type TileFilter,
  type TimeInterval,
} from '../types';
import { isSummaryCardLayoutNode } from './dashboardLayoutNodes';
import { resolveSupportedSummaryCardAggregation } from './summaryCardAggregation';
import {
  asBoolean,
  asIsoTimestamp,
  asNonEmptyString,
  asNumber,
  asOptionalIsoTimestamp,
  asOptionalNonEmptyString,
  asRecord,
  asString,
  isRecord,
  optional,
  trimmed,
  validateOptionalBoolean,
  validatePreviousPeriodOverlay,
} from './validatorPrimitives';

// `isRecord` is part of this module's public surface (reverse adapters import
// it from here); keep re-exporting it after the move to the primitives module.
export { isRecord };

/**
 * Allowlists are typed as `ReadonlySet<T>`. Type-predicate helpers below wrap
 * `.has()` so callers get a real type narrowing (`value is T`) instead of
 * having to cast the return of a plain string check. This pushes the single
 * unavoidable boundary cast into one tested place per allowlist instead of
 * scattering `as` at every validator callsite.
 *
 * Exported so reverse adapters and the synthesiser can reuse the same
 * authoritative lists when classifying upstream data — there should be one
 * source of truth for "what's a known aggregation" and it lives here.
 */
export const SUMMARY_CARD_AGGREGATIONS: ReadonlySet<SummaryCardAggregation> = new Set([
  CustomDashboardSummaryCardAggregation.AverageOverTimePeriod,
  CustomDashboardSummaryCardAggregation.MostRecentDataPoint,
  CustomDashboardSummaryCardAggregation.Total,
  RAQIV2AggregationType.Average,
  RAQIV2AggregationType.AveragePerUser,
  RAQIV2AggregationType.Count,
  RAQIV2AggregationType.CountUser,
  RAQIV2AggregationType.Max,
  RAQIV2AggregationType.Min,
  RAQIV2AggregationType.Sum,
  CustomDashboardSummaryCardAggregation.Median,
  CustomDashboardSummaryCardAggregation.Cumulative,
  RAQIV2PercentileType.AVG,
  RAQIV2PercentileType.P10,
  RAQIV2PercentileType.P50,
  RAQIV2PercentileType.P90,
]);

export const CHART_AGGREGATIONS: ReadonlySet<ChartAggregation> = new Set([
  RAQIV2AggregationType.Average,
  RAQIV2AggregationType.AveragePerUser,
  RAQIV2AggregationType.Count,
  RAQIV2AggregationType.CountUser,
  RAQIV2AggregationType.Max,
  RAQIV2AggregationType.Min,
  RAQIV2AggregationType.Sum,
  RAQIV2PercentileType.AVG,
  RAQIV2PercentileType.P10,
  RAQIV2PercentileType.P50,
  RAQIV2PercentileType.P90,
]);

/** Authoring DTO literals; mapped to `RAQIV2MetricGranularity` in `granularityMapping`. */
export const KNOWN_TIME_INTERVALS: ReadonlySet<TimeInterval> = new Set([
  'Cumulative',
  'Day',
  'Week',
  'Hour',
  'HalfHour',
  'Minute',
]);

/** Persisted chart types on tiles; same vocabulary as render `ChartType` (subset). */
export const KNOWN_CHART_TYPES: ReadonlySet<CustomDashboardChartType> = new Set(
  CUSTOM_DASHBOARD_CHART_TYPES,
);

export const KNOWN_DASHBOARD_STATUSES: ReadonlySet<CustomDashboardStatus> = new Set([
  'draft',
  'published',
]);

const CUSTOM_PERCENTILE_PATTERN = /^Percentile\d+$/;
const DATE_RANGE_TYPES: ReadonlySet<string> = new Set(Object.values(RAQIV2DateRangeType));
const RAQIV2_DIMENSION_VALUES: readonly string[] = Object.values(RAQIV2Dimension);
const RAQIV2_PSEUDO_DIMENSION_VALUES: readonly string[] = Object.values(RAQIV2UIPseudoDimension);
const RAQIV2_GRANULARITY_VALUES: readonly string[] = Object.values(RAQIV2MetricGranularity);
const ANNOTATION_TYPE_VALUES: readonly string[] = Object.values(AnnotationType);
const PERCENTILE_TYPE_PSEUDO_DIMENSION_KEY: string = RAQIV2UIPseudoDimension.PercentileType;
const AGGREGATION_TYPE_PSEUDO_DIMENSION_KEY: string = RAQIV2UIPseudoDimension.AggregationType;
const RAQIV2_AGGREGATION_TYPES: ReadonlySet<RAQIV2AggregationType> = new Set(
  Object.values(RAQIV2AggregationType),
);
const RAQIV2_PERCENTILE_TYPES: ReadonlySet<RAQIV2PercentileType> = new Set(
  Object.values(RAQIV2PercentileType),
);

function setHas<T extends string>(set: ReadonlySet<T>, value: string): value is T {
  for (const item of set) {
    if (item === value) {
      return true;
    }
  }
  return false;
}

export function isDefaultBreakdownDimension(value: string): value is TRAQIV2Dimension {
  return RAQIV2_DIMENSION_VALUES.includes(value) || RAQIV2_PSEUDO_DIMENSION_VALUES.includes(value);
}

/**
 * Canonical RAQI dimensions only (no UI pseudo-dimensions). Persisted
 * dashboard-level filter/breakdown allowlists and tile-level breakdowns must be
 * real query dimensions because they are wired straight into the rendered page
 * config's filter/breakdown controls and chart spec overrides.
 */
export function isCanonicalRAQIV2Dimension(value: string): value is TRAQIV2Dimension {
  return RAQIV2_DIMENSION_VALUES.includes(value);
}

function isDefaultGranularity(value: string): value is RAQIV2MetricGranularity {
  return RAQIV2_GRANULARITY_VALUES.includes(value);
}

export function isDefaultAnnotationType(value: string): value is AnnotationType {
  return ANNOTATION_TYPE_VALUES.includes(value);
}

export function isSummaryCardAggregation(value: string): value is SummaryCardAggregation {
  return setHas(SUMMARY_CARD_AGGREGATIONS, value) || CUSTOM_PERCENTILE_PATTERN.test(value);
}

export function isChartAggregation(value: string): value is ChartAggregation {
  return setHas(CHART_AGGREGATIONS, value) || CUSTOM_PERCENTILE_PATTERN.test(value);
}

export function isTimeInterval(value: string): value is TimeInterval {
  return setHas(KNOWN_TIME_INTERVALS, value);
}

export function isDateRangeType(value: unknown): value is RAQIV2DateRangeType {
  if (typeof value !== 'string') {
    return false;
  }
  return DATE_RANGE_TYPES.has(value);
}

export function isRAQIV2AggregationType(value: unknown): value is RAQIV2AggregationType {
  return typeof value === 'string' && setHas(RAQIV2_AGGREGATION_TYPES, value);
}

export function isRAQIV2PercentileType(value: unknown): value is RAQIV2PercentileType {
  return typeof value === 'string' && setHas(RAQIV2_PERCENTILE_TYPES, value);
}

export function isChartType(value: string): value is CustomDashboardChartType {
  return setHas(KNOWN_CHART_TYPES, value);
}

export function isSmoothing(value: unknown): value is ChartTileSmoothing {
  return value === 'none' || value === 'weekly';
}

export function isDashboardStatus(value: unknown): value is CustomDashboardStatus {
  return typeof value === 'string' && setHas(KNOWN_DASHBOARD_STATUSES, value);
}

export function isMetricKey(value: string): value is CustomDashboardMetricKey {
  return isNumericUIMetric(value);
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

function validateSummaryCardAggregation(value: unknown, field: string): SummaryCardAggregation {
  const str = asString(value, field);
  if (!isSummaryCardAggregation(str)) {
    throw new CustomDashboardValidationError(
      field,
      `${field} "${str}" is not a known summary-card aggregation.`,
    );
  }
  return str;
}

function validateSummaryCardTitleSource(
  value: unknown,
  field: string,
): SummaryCardTitleSourceValue {
  const str = asString(value, field);
  if (str !== SummaryCardTitleSource.Auto && str !== SummaryCardTitleSource.Custom) {
    throw new CustomDashboardValidationError(field, `${field} must be "Auto" or "Custom".`);
  }
  return str;
}

function validateChartAggregation(value: unknown, field: string): ChartAggregation {
  const str = asString(value, field);
  if (!isChartAggregation(str)) {
    throw new CustomDashboardValidationError(
      field,
      `${field} "${str}" is not a known chart aggregation.`,
    );
  }
  return str;
}

function validateTimeInterval(value: unknown, field: string): TimeInterval {
  const str = asString(value, field);
  if (!isTimeInterval(str)) {
    throw new CustomDashboardValidationError(
      field,
      `${field} "${str}" is not a known time interval.`,
    );
  }
  return str;
}

function validateSmoothing(value: unknown, field: string): ChartTileSmoothing {
  if (!isSmoothing(value)) {
    throw new CustomDashboardValidationError(field, `${field} must be "none" or "weekly".`);
  }
  return value;
}

const validateOptionalChartAggregation = optional(validateChartAggregation);
const validateOptionalSmoothing = optional(validateSmoothing);
const validateOptionalSummaryCardTitleSource = optional(validateSummaryCardTitleSource);

function validateMetricKey(value: unknown, field: string): CustomDashboardMetricKey {
  const str = asString(value, field);
  if (!isMetricKey(str)) {
    throw new CustomDashboardValidationError(
      field,
      `${field} "${str}" is not a known RAQI metric.`,
    );
  }
  return str;
}

function validateMetricVariantSelection(
  value: unknown,
  field: string,
): DashboardMetricVariantSelection {
  const record = asRecord(value, field);
  const pseudoDimensionKey = asNonEmptyString(
    record.pseudoDimensionKey,
    `${field}.pseudoDimensionKey`,
  );
  if (
    pseudoDimensionKey !== PERCENTILE_TYPE_PSEUDO_DIMENSION_KEY &&
    pseudoDimensionKey !== AGGREGATION_TYPE_PSEUDO_DIMENSION_KEY
  ) {
    throw new CustomDashboardValidationError(
      `${field}.pseudoDimensionKey`,
      `${field}.pseudoDimensionKey must be a supported pseudo-dimension key.`,
    );
  }
  const variantKey = asNonEmptyString(record.variantKey, `${field}.variantKey`);
  if (
    pseudoDimensionKey === PERCENTILE_TYPE_PSEUDO_DIMENSION_KEY &&
    !isRAQIV2PercentileType(variantKey)
  ) {
    throw new CustomDashboardValidationError(
      `${field}.variantKey`,
      `${field}.variantKey must be a known RAQI percentile for PercentileType.`,
    );
  }
  if (
    pseudoDimensionKey === AGGREGATION_TYPE_PSEUDO_DIMENSION_KEY &&
    !isRAQIV2AggregationType(variantKey)
  ) {
    throw new CustomDashboardValidationError(
      `${field}.variantKey`,
      `${field}.variantKey must be a known RAQI aggregation for AggregationType.`,
    );
  }
  return { pseudoDimensionKey, variantKey };
}

function validateMetricVariantSelections(
  value: unknown,
  field: string,
): ReadonlyArray<DashboardMetricVariantSelection> | undefined {
  const selections = validateOptionalArray(value, field, validateMetricVariantSelection);
  return selections.length > 0 ? selections : undefined;
}

function hasDisallowedPersistedTextCodepoint(value: string): boolean {
  for (const char of value) {
    const codepoint = char.codePointAt(0);
    if (codepoint === undefined) {
      continue;
    }
    const isUnsupportedControl =
      (codepoint <= 31 && codepoint !== 9 && codepoint !== 10 && codepoint !== 13) ||
      codepoint === 127;
    const isBidiControl =
      (codepoint >= 8234 && codepoint <= 8238) || (codepoint >= 8294 && codepoint <= 8297);
    if (isUnsupportedControl || isBidiControl) {
      return true;
    }
  }
  return false;
}

function validatePlainText(value: string, field: string): string {
  if (value.includes('<') || value.includes('>')) {
    throw new CustomDashboardValidationError(
      field,
      `${field} contains unsupported markup characters.`,
    );
  }
  if (hasDisallowedPersistedTextCodepoint(value)) {
    throw new CustomDashboardValidationError(
      field,
      `${field} contains unsupported control characters.`,
    );
  }
  return value;
}

/**
 * Validate a user-provided dashboard name, returning the trimmed value. The
 * service should call this on every create/update before persisting; UI code
 * may call it pre-submit to surface inline errors. Throws
 * `CustomDashboardValidationError('name', ...)` when empty or longer than
 * `MAX_DASHBOARD_NAME_LENGTH`.
 */
export function validateDashboardName(raw: string): string {
  const name = validatePlainText(trimmed(raw), 'name');
  if (name.length === 0) {
    throw new CustomDashboardValidationError('name', 'Dashboard name is required.');
  }
  if (name.length > MAX_DASHBOARD_NAME_LENGTH) {
    throw new CustomDashboardValidationError(
      'name',
      `Dashboard name cannot exceed ${MAX_DASHBOARD_NAME_LENGTH} characters.`,
    );
  }
  return name;
}

/**
 * Validate an optional dashboard description. Returns `undefined` when the
 * input is absent or trims to empty (so the caller stores no field rather
 * than a sentinel empty string). Throws
 * `CustomDashboardValidationError('description', ...)` when over the length
 * cap.
 */
export function validateDashboardDescription(raw: string | undefined): string | undefined {
  if (raw === undefined) {
    return undefined;
  }
  const description = validatePlainText(trimmed(raw), 'description');
  if (description.length > MAX_DASHBOARD_DESCRIPTION_LENGTH) {
    throw new CustomDashboardValidationError(
      'description',
      `Description cannot exceed ${MAX_DASHBOARD_DESCRIPTION_LENGTH} characters.`,
    );
  }
  return description.length === 0 ? undefined : description;
}

function validateTileFilters(filters: unknown, field: string): ReadonlyArray<TileFilter> {
  if (filters === undefined || filters === null) {
    return [];
  }
  if (!Array.isArray(filters)) {
    throw new CustomDashboardValidationError(field, `${field} must be an array.`);
  }
  return filters.map((filter, idx) => {
    const record = asRecord(filter, `${field}[${idx}]`);
    const dimension = validatePlainText(
      asNonEmptyString(record.dimension, `${field}[${idx}].dimension`),
      `${field}[${idx}].dimension`,
    );
    const { values } = record;
    // `every` with a type predicate narrows the array element type; this lets
    // us return `values` directly typed as `string[]` without any cast.
    if (!Array.isArray(values) || values.length === 0 || !values.every(isNonEmptyString)) {
      throw new CustomDashboardValidationError(
        `${field}[${idx}].values`,
        `${field}[${idx}].values must be a non-empty array of non-empty strings.`,
      );
    }
    return {
      dimension,
      values: values.map((value, valueIdx) =>
        validatePlainText(value, `${field}[${idx}].values[${valueIdx}]`),
      ),
    };
  });
}

function validateRequiredTileFilters(filters: unknown, field: string): ReadonlyArray<TileFilter> {
  if (filters === undefined || filters === null) {
    throw new CustomDashboardValidationError(field, `${field} must be an array.`);
  }
  return validateTileFilters(filters, field);
}

function isComputedMetricCandidate(value: unknown): value is ComputedMetric {
  if (!isRecord(value)) {
    return false;
  }
  const { sources, formula, name, l7Smoothing } = value;
  if (
    !Array.isArray(sources) ||
    sources.length === 0 ||
    typeof formula !== 'string' ||
    formula.trim().length === 0
  ) {
    return false;
  }
  if (name !== undefined && typeof name !== 'string') {
    return false;
  }
  if (l7Smoothing !== undefined && typeof l7Smoothing !== 'boolean') {
    return false;
  }
  return sources.every(
    (source) =>
      isRecord(source) &&
      typeof source.key === 'string' &&
      source.key.length > 0 &&
      source.metric !== undefined,
  );
}

function validateComputedMetric(value: unknown, field: string): ComputedMetric {
  if (!isComputedMetricCandidate(value)) {
    throw new CustomDashboardValidationError(field, `${field} must be a computed metric object.`);
  }
  const encoded = serializeComputedMetricToQueryParam(value);
  const normalized = deserializeComputedMetricFromQueryParam(encoded);
  if (!encoded || !normalized) {
    throw new CustomDashboardValidationError(field, `${field} is not a supported computed metric.`);
  }
  return normalized;
}

function validateTileTitle(title: unknown, field: string): string | undefined {
  if (title === undefined || title === null) {
    return undefined;
  }
  const str = asString(title, field);
  const trimmedStr = validatePlainText(trimmed(str), field);
  if (trimmedStr.length > MAX_TILE_TITLE_LENGTH) {
    throw new CustomDashboardValidationError(
      field,
      `Tile title cannot exceed ${MAX_TILE_TITLE_LENGTH} characters.`,
    );
  }
  return trimmedStr.length === 0 ? undefined : trimmedStr;
}

function validateDefaultDateRange(
  value: unknown,
  field: string,
): DashboardDateRangeDefault | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  const record = asRecord(value, field);
  if (record.type === 'Relative') {
    if (!isDateRangeType(record.rangeType) || record.rangeType === RAQIV2DateRangeType.Custom) {
      throw new CustomDashboardValidationError(
        `${field}.rangeType`,
        `${field}.rangeType must be a preset date range.`,
      );
    }
    return { type: 'Relative', rangeType: record.rangeType };
  }
  if (record.type === 'Custom') {
    const startTimeMs = asNumber(record.startTimeMs, `${field}.startTimeMs`);
    const endTimeMs = asNumber(record.endTimeMs, `${field}.endTimeMs`);
    if (startTimeMs > endTimeMs) {
      throw new CustomDashboardValidationError(
        field,
        `${field} custom startTimeMs must be before endTimeMs.`,
      );
    }
    return { type: 'Custom', startTimeMs, endTimeMs };
  }
  throw new CustomDashboardValidationError(
    `${field}.type`,
    `${field}.type must be "Relative" or "Custom".`,
  );
}

function validateDefaultFilters(
  filters: unknown,
  field: string,
): ReadonlyArray<TileFilter> | undefined {
  const validated = validateTileFilters(filters, field);
  return validated.length > 0 ? validated : undefined;
}

function validateDefaultBreakdown(
  value: unknown,
  field: string,
): ReadonlyArray<TRAQIV2Dimension> | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (!Array.isArray(value)) {
    throw new CustomDashboardValidationError(field, `${field} must be an array.`);
  }
  const breakdown = value.map((item, idx) => {
    const dimension = asNonEmptyString(item, `${field}[${idx}]`);
    if (!isDefaultBreakdownDimension(dimension)) {
      throw new CustomDashboardValidationError(
        `${field}[${idx}]`,
        `${field}[${idx}] must be a known RAQI dimension.`,
      );
    }
    return dimension;
  });
  return breakdown.length > 0 ? breakdown : undefined;
}

/**
 * Validate a persisted dashboard-level allowable-dimension list (filter or
 * breakdown controls). Mirrors `validateDefaultBreakdown` but restricts entries
 * to canonical RAQI dimensions, since these lists drive the rendered page
 * config's controls and never carry UI pseudo-dimensions.
 */
function validateCanonicalDimensionList(
  value: unknown,
  field: string,
): ReadonlyArray<TRAQIV2Dimension> | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (!Array.isArray(value)) {
    throw new CustomDashboardValidationError(field, `${field} must be an array.`);
  }
  const dimensions = value.map((item, idx) => {
    const dimension = asNonEmptyString(item, `${field}[${idx}]`);
    if (!isCanonicalRAQIV2Dimension(dimension)) {
      throw new CustomDashboardValidationError(
        `${field}[${idx}]`,
        `${field}[${idx}] must be a canonical RAQI dimension.`,
      );
    }
    return dimension;
  });
  return dimensions.length > 0 ? dimensions : undefined;
}

function validateDefaultGranularity(
  value: unknown,
  field: string,
): RAQIV2MetricGranularity | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  const granularity = asNonEmptyString(value, field);
  if (!isDefaultGranularity(granularity)) {
    throw new CustomDashboardValidationError(field, `${field} must be a known granularity.`);
  }
  return granularity;
}

function validateDefaultAnnotationTypes(
  value: unknown,
  field: string,
): ReadonlyArray<AnnotationType> | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (!Array.isArray(value)) {
    throw new CustomDashboardValidationError(field, `${field} must be an array.`);
  }
  const annotationTypes = value.map((item, idx) => {
    const annotationType = asNonEmptyString(item, `${field}[${idx}]`);
    if (!isDefaultAnnotationType(annotationType)) {
      throw new CustomDashboardValidationError(
        `${field}[${idx}]`,
        `${field}[${idx}] must be a known annotation type.`,
      );
    }
    return annotationType;
  });
  return annotationTypes.length > 0 ? annotationTypes : undefined;
}

function validateMetricReference(value: unknown, field: string): DashboardMetricReference {
  const record = asRecord(value, field);
  const variantSelections = validateMetricVariantSelections(
    record.variantSelections,
    `${field}.variantSelections`,
  );
  if (
    record.metricKey !== undefined &&
    record.metricKey !== null &&
    record.computedMetric !== undefined &&
    record.computedMetric !== null
  ) {
    throw new CustomDashboardValidationError(
      field,
      `${field} must not include both metricKey and computedMetric.`,
    );
  }
  if (record.computedMetric !== undefined && record.computedMetric !== null) {
    return {
      computedMetric: validateComputedMetric(record.computedMetric, `${field}.computedMetric`),
      variantSelections,
    };
  }
  return {
    metricKey: validateMetricKey(record.metricKey, `${field}.metricKey`),
    variantSelections,
  };
}

function validateChartTileMetric(
  value: unknown,
  field: string,
): ChartTileConfig['dataSpec']['metrics'][number] {
  const record = asRecord(value, field);
  return {
    metric: validateMetricReference(record.metric, `${field}.metric`),
    seriesKey: validatePlainText(
      asNonEmptyString(record.seriesKey, `${field}.seriesKey`),
      `${field}.seriesKey`,
    ),
    displayName:
      record.displayName !== undefined && record.displayName !== null
        ? validatePlainText(
            trimmed(asString(record.displayName, `${field}.displayName`)),
            `${field}.displayName`,
          )
        : undefined,
    aggregation: validateOptionalChartAggregation(record.aggregation, `${field}.aggregation`),
  };
}

function validateSummaryCard(tile: Record<string, unknown>, field: string): SummaryCardTileConfig {
  const overlaysRecord = isRecord(tile.overlays) ? tile.overlays : undefined;
  const metric = validateMetricReference(tile.metric, `${field}.metric`);
  const aggregation = validateSummaryCardAggregation(tile.aggregation, `${field}.aggregation`);
  const supportedAggregation = metric.metricKey
    ? resolveSupportedSummaryCardAggregation(metric.metricKey, aggregation)
    : aggregation;
  if (!supportedAggregation) {
    throw new CustomDashboardValidationError(
      `${field}.aggregation`,
      `${field}.aggregation is not supported by the selected metric.`,
    );
  }
  return {
    type: 'SummaryCard',
    tileId: asNonEmptyString(tile.tileId, `${field}.tileId`),
    title: validateTileTitle(tile.title, `${field}.title`),
    titleSource: validateOptionalSummaryCardTitleSource(tile.titleSource, `${field}.titleSource`),
    metric,
    aggregation: supportedAggregation,
    overlays: overlaysRecord
      ? {
          periodOverPeriod: validateOptionalBoolean(
            overlaysRecord.periodOverPeriod,
            `${field}.overlays.periodOverPeriod`,
          ),
        }
      : undefined,
    filters: validateRequiredTileFilters(tile.filters, `${field}.filters`),
  };
}

function validateChartTile(tile: Record<string, unknown>, field: string): ChartTileConfig {
  const dataSpecRecord = asRecord(tile.dataSpec, `${field}.dataSpec`);
  const chartSpecRecord = asRecord(tile.chartSpec, `${field}.chartSpec`);
  const chartType = asString(chartSpecRecord.chartType, `${field}.chartSpec.chartType`);
  if (!isChartType(chartType)) {
    throw new CustomDashboardValidationError(
      `${field}.chartSpec.chartType`,
      `${field}.chartSpec.chartType "${chartType}" is not supported.`,
    );
  }
  const overlaysRecord = isRecord(chartSpecRecord.overlays) ? chartSpecRecord.overlays : undefined;
  const overlays = overlaysRecord
    ? {
        genreBenchmark: validateOptionalBoolean(
          overlaysRecord.genreBenchmark,
          `${field}.chartSpec.overlays.genreBenchmark`,
        ),
        similarExperienceBenchmark: validateOptionalBoolean(
          overlaysRecord.similarExperienceBenchmark,
          `${field}.chartSpec.overlays.similarExperienceBenchmark`,
        ),
        topExperienceBenchmark: validateOptionalBoolean(
          overlaysRecord.topExperienceBenchmark,
          `${field}.chartSpec.overlays.topExperienceBenchmark`,
        ),
        previousPeriod: validatePreviousPeriodOverlay(
          overlaysRecord.previousPeriod,
          `${field}.chartSpec.overlays.previousPeriod`,
        ),
        quota: validateOptionalBoolean(overlaysRecord.quota, `${field}.chartSpec.overlays.quota`),
        trendLine: validateOptionalBoolean(
          overlaysRecord.trendLine,
          `${field}.chartSpec.overlays.trendLine`,
        ),
      }
    : undefined;

  const metrics = validateOptionalArray(
    dataSpecRecord.metrics,
    `${field}.dataSpec.metrics`,
    validateChartTileMetric,
  );
  const isTable = chartType === ChartType.Table;
  if (!isTable && metrics.length !== 1) {
    throw new CustomDashboardValidationError(
      `${field}.dataSpec.metrics`,
      `${field}.dataSpec.metrics must contain exactly one metric.`,
    );
  }
  if (isTable && (metrics.length < 1 || metrics.length > MAX_TABLE_METRIC_COLUMNS)) {
    throw new CustomDashboardValidationError(
      `${field}.dataSpec.metrics`,
      `${field}.dataSpec.metrics must contain between 1 and ${MAX_TABLE_METRIC_COLUMNS} metrics for table charts.`,
    );
  }
  const rawBreakdownDimensions = dataSpecRecord.breakdownDimensions;
  const breakdownDimensions =
    rawBreakdownDimensions === undefined || rawBreakdownDimensions === null
      ? undefined
      : validateOptionalArray(
          rawBreakdownDimensions,
          `${field}.dataSpec.breakdownDimensions`,
          (item, itemField) => {
            const dimension = asOptionalNonEmptyString(item, itemField) ?? '';
            if (dimension.length > 0 && !isCanonicalRAQIV2Dimension(dimension)) {
              throw new CustomDashboardValidationError(
                itemField,
                `${itemField} must be a canonical RAQI dimension.`,
              );
            }
            return dimension;
          },
        ).filter((dimension) => dimension.length > 0);

  return {
    type: 'Chart',
    tileId: asNonEmptyString(tile.tileId, `${field}.tileId`),
    title: validateTileTitle(tile.title, `${field}.title`),
    dataSpec: {
      metrics,
      aggregation: validateOptionalChartAggregation(
        dataSpecRecord.aggregation,
        `${field}.dataSpec.aggregation`,
      ),
      breakdownDimensions,
      granularity: validateTimeInterval(
        dataSpecRecord.granularity,
        `${field}.dataSpec.granularity`,
      ),
      filters: validateRequiredTileFilters(dataSpecRecord.filters, `${field}.dataSpec.filters`),
    },
    chartSpec: {
      chartType,
      overlays,
      smoothing: validateOptionalSmoothing(
        chartSpecRecord.smoothing,
        `${field}.chartSpec.smoothing`,
      ),
    },
  };
}

function validateChartTileEntry(tile: unknown, field: string): ChartTileConfig {
  const record = asRecord(tile, field);
  if (record.type !== 'Chart') {
    throw new CustomDashboardValidationError(`${field}.type`, `${field}.type must be "Chart".`);
  }
  return validateChartTile(record, field);
}

function validateSummaryCardEntry(tile: unknown, field: string): SummaryCardTileConfig {
  const record = asRecord(tile, field);
  if (record.type !== 'SummaryCard') {
    throw new CustomDashboardValidationError(
      `${field}.type`,
      `${field}.type must be "SummaryCard".`,
    );
  }
  return validateSummaryCard(record, field);
}

/**
 * Validate an optional array field on a config: absent / null → empty array,
 * present-but-not-an-array → typed validation error, otherwise map each entry
 * through `validateItem` with an indexed field path. Centralises the
 * "absent vs malformed" distinction so we don't silently coerce real
 * corruption to `[]` in any one branch.
 */
function validateOptionalArray<T>(
  raw: unknown,
  field: string,
  validateItem: (item: unknown, itemField: string) => T,
): ReadonlyArray<T> {
  if (raw === undefined || raw === null) {
    return [];
  }
  if (!Array.isArray(raw)) {
    throw new CustomDashboardValidationError(field, `${field} must be an array.`);
  }
  return raw.map((item, idx) => validateItem(item, `${field}[${idx}]`));
}

function validateAnnotationOptions(
  raw: unknown,
  field: string,
): CustomDashboardConfig['page']['surface']['controls']['annotationOptions'] {
  if (raw === undefined || raw === null) {
    return undefined;
  }
  const record = asRecord(raw, field);
  return {
    supportedAnnotationTypes:
      validateDefaultAnnotationTypes(
        record.supportedAnnotationTypes,
        `${field}.supportedAnnotationTypes`,
      ) ?? [],
    defaultAnnotationTypes:
      validateDefaultAnnotationTypes(
        record.defaultAnnotationTypes,
        `${field}.defaultAnnotationTypes`,
      ) ?? [],
    showAnnotationsControl:
      record.showAnnotationsControl === undefined || record.showAnnotationsControl === null
        ? true
        : asBoolean(record.showAnnotationsControl, `${field}.showAnnotationsControl`),
  };
}

function validateTimeRangeOptions(
  raw: unknown,
  field: string,
): CustomDashboardConfig['page']['surface']['controls']['timeRangeOptions'] {
  if (raw === undefined || raw === null) {
    return undefined;
  }
  const record = asRecord(raw, field);
  if (record.type === 'None') {
    return { type: 'None' };
  }
  if (record.type !== 'DateRange') {
    throw new CustomDashboardValidationError(
      `${field}.type`,
      `${field}.type must be "None" or "DateRange".`,
    );
  }
  return {
    type: 'DateRange',
    defaultSelection: validateDefaultDateRange(
      record.defaultSelection,
      `${field}.defaultSelection`,
    ),
  };
}

function validateSurfaceControls(
  raw: unknown,
  field: string,
): CustomDashboardConfig['page']['surface']['controls'] {
  if (raw === undefined || raw === null) {
    return {};
  }
  const record = asRecord(raw, field);
  return {
    timeRangeOptions: validateTimeRangeOptions(
      record.timeRangeOptions,
      `${field}.timeRangeOptions`,
    ),
    filterDimensions: validateCanonicalDimensionList(
      record.filterDimensions,
      `${field}.filterDimensions`,
    ),
    defaultFilters: validateDefaultFilters(record.defaultFilters, `${field}.defaultFilters`),
    breakdownDimensions: validateCanonicalDimensionList(
      record.breakdownDimensions,
      `${field}.breakdownDimensions`,
    ),
    defaultBreakdown: validateDefaultBreakdown(
      record.defaultBreakdown,
      `${field}.defaultBreakdown`,
    ),
    defaultGranularity: validateDefaultGranularity(
      record.defaultGranularity,
      `${field}.defaultGranularity`,
    ),
    annotationOptions: validateAnnotationOptions(
      record.annotationOptions,
      `${field}.annotationOptions`,
    ),
  };
}

function validateDashboardLayoutNode(raw: unknown, field: string): DashboardLayoutNode {
  const record = asRecord(raw, field);
  if (record.type === 'Component') {
    const component = asRecord(record.component, `${field}.component`);
    if (component.type === 'Chart') {
      return {
        type: 'Component',
        component: {
          type: 'Chart',
          chart: validateChartTileEntry(component.chart, `${field}.component.chart`),
        },
      };
    }
    if (component.type === 'SummaryCard') {
      return {
        type: 'Component',
        component: {
          type: 'SummaryCard',
          summaryCard: validateSummaryCardEntry(
            component.summaryCard,
            `${field}.component.summaryCard`,
          ),
        },
      };
    }
    throw new CustomDashboardValidationError(
      `${field}.component.type`,
      `${field}.component.type must be "Chart" or "SummaryCard".`,
    );
  }
  if (record.type === 'Grid') {
    const columnCount = record.columnCount;
    if (columnCount !== 1 && columnCount !== 2) {
      throw new CustomDashboardValidationError(
        `${field}.columnCount`,
        `${field}.columnCount must be 1 or 2.`,
      );
    }
    const children = validateOptionalArray(
      record.children,
      `${field}.children`,
      validateDashboardLayoutNode,
    );
    if (
      children.length === 0 ||
      (children.length > columnCount && !children.every(isSummaryCardLayoutNode))
    ) {
      throw new CustomDashboardValidationError(
        `${field}.children`,
        `${field}.children must contain between 1 and ${columnCount} child node(s).`,
      );
    }
    return {
      type: 'Grid',
      columnCount,
      children,
    };
  }
  if (record.type === 'Flex' || record.type === 'Stack') {
    return {
      type: record.type,
      children: validateOptionalArray(
        record.children,
        `${field}.children`,
        validateDashboardLayoutNode,
      ),
    };
  }
  throw new CustomDashboardValidationError(
    `${field}.type`,
    `${field}.type must be "Component", "Grid", "Flex", or "Stack".`,
  );
}

function collectTileIds(
  node: DashboardLayoutNode,
  visit: (tileId: string, tileType: 'Chart' | 'SummaryCard', field: string) => void,
  field: string,
): void {
  if (node.type === 'Component') {
    const tileId =
      node.component.type === 'Chart'
        ? node.component.chart.tileId
        : node.component.summaryCard.tileId;
    visit(
      tileId,
      node.component.type,
      `${field}.component.${node.component.type === 'Chart' ? 'chart' : 'summaryCard'}.tileId`,
    );
    return;
  }
  node.children.forEach((child, idx) => collectTileIds(child, visit, `${field}.children[${idx}]`));
}

export type ValidateCustomDashboardConfigOptions = {
  /**
   * When true (default), reject configs that exceed summary/chart tile caps.
   * Read paths should pass `false` so previously saved over-cap dashboards
   * remain loadable; write/save paths keep the default so new caps still bind.
   */
  readonly enforceTileCaps?: boolean;
};

/**
 * Validate a `CustomDashboardConfig` payload. Throws
 * `CustomDashboardValidationError` on any structural violation. The returned
 * object is a fresh, fully-narrowed clone — callers can persist it directly.
 */
export function validateCustomDashboardConfig(
  raw: unknown,
  options: ValidateCustomDashboardConfigOptions = {},
): CustomDashboardConfig {
  const { enforceTileCaps = true } = options;
  const record = asRecord(raw, 'config');
  const page = asRecord(record.page, 'config.page');
  if (page.mode !== DashboardPageMode.Untabbed) {
    throw new CustomDashboardValidationError(
      'config.page.mode',
      'config.page.mode must be "Untabbed" in v1.',
    );
  }
  const surface = asRecord(page.surface, 'config.page.surface');
  const bodyNodes = validateOptionalArray(
    surface.bodyNodes,
    'config.page.surface.bodyNodes',
    validateDashboardLayoutNode,
  );

  // Tile IDs must be unique across the entire dashboard so React keys, DnD
  // identity, and "edit tile by id" all stay coherent.
  const seen = new Set<string>();
  let summaryCount = 0;
  let chartCount = 0;
  const checkId = (id: string, tileType: 'Chart' | 'SummaryCard', field: string): void => {
    if (seen.has(id)) {
      throw new CustomDashboardValidationError(field, `Duplicate tileId "${id}".`);
    }
    seen.add(id);
    if (tileType === 'Chart') {
      chartCount += 1;
    } else {
      summaryCount += 1;
    }
  };
  bodyNodes.forEach((node, idx) =>
    collectTileIds(node, checkId, `config.page.surface.bodyNodes[${idx}]`),
  );
  if (enforceTileCaps) {
    if (summaryCount > MAX_SUMMARY_CARDS_PER_DASHBOARD) {
      throw new CustomDashboardValidationError(
        'config.page.surface.bodyNodes',
        `A dashboard may have at most ${MAX_SUMMARY_CARDS_PER_DASHBOARD} summary cards.`,
      );
    }
    if (chartCount > MAX_CHART_TILES_PER_DASHBOARD) {
      throw new CustomDashboardValidationError(
        'config.page.surface.bodyNodes',
        `A dashboard may have at most ${MAX_CHART_TILES_PER_DASHBOARD} chart tiles.`,
      );
    }
  }

  return {
    page: {
      mode: DashboardPageMode.Untabbed,
      surface: {
        controls: validateSurfaceControls(surface.controls, 'config.page.surface.controls'),
        bodyNodes,
      },
    },
  };
}

/**
 * Validate a document that has already been migrated to
 * `CUSTOM_DASHBOARD_CURRENT_SCHEMA_VERSION`. Throws if the input is at any
 * other version — this guarantees migrations weren't skipped. Callers reading
 * raw disk JSON must run `applyMigrations` first.
 *
 * `config` is required at this layer: silently coercing a missing field to
 * `EMPTY_DASHBOARD_CONFIG` here would hide real corruption. Service layer is
 * responsible for substituting the default at create time before validation
 * runs.
 */
export function validateCustomDashboardDocument(raw: unknown): CustomDashboardDocument {
  const record = asRecord(raw, 'document');

  if (record.schemaVersion !== CUSTOM_DASHBOARD_CURRENT_SCHEMA_VERSION) {
    throw new CustomDashboardValidationError(
      'schemaVersion',
      `schemaVersion must equal ${CUSTOM_DASHBOARD_CURRENT_SCHEMA_VERSION} (got ${String(
        record.schemaVersion,
      )}). Run applyMigrations first.`,
    );
  }

  const { status } = record;
  if (!isDashboardStatus(status)) {
    throw new CustomDashboardValidationError('status', 'status must be "draft" or "published".');
  }

  let description: string | undefined;
  if (record.description !== undefined && record.description !== null) {
    description = validateDashboardDescription(asString(record.description, 'description'));
  }

  const isPinned = asBoolean(record.isPinned, 'isPinned');
  // Force `pinnedAt` and `isPinned` consistent: if not pinned, drop the
  // timestamp regardless of what disk says.
  const pinnedAt = isPinned ? asOptionalIsoTimestamp(record.pinnedAt, 'pinnedAt') : undefined;

  if (record.config === undefined || record.config === null) {
    throw new CustomDashboardValidationError(
      'config',
      'config is required. Service-layer create() must substitute EMPTY_DASHBOARD_CONFIG before validation.',
    );
  }

  return {
    id: asNonEmptyString(record.id, 'id'),
    schemaVersion: CUSTOM_DASHBOARD_CURRENT_SCHEMA_VERSION,
    universeId: asNumber(record.universeId, 'universeId'),
    name: validateDashboardName(asString(record.name, 'name')),
    description,
    status,
    isPinned,
    pinnedAt,
    createdAt: asIsoTimestamp(record.createdAt, 'createdAt'),
    updatedAt: asIsoTimestamp(record.updatedAt, 'updatedAt'),
    publishedAt: asOptionalIsoTimestamp(record.publishedAt, 'publishedAt'),
    createdByUserId: asNumber(record.createdByUserId, 'createdByUserId'),
    createdByUsername: asNonEmptyString(record.createdByUsername, 'createdByUsername'),
    updatedByUserId: optional(asNumber)(record.updatedByUserId, 'updatedByUserId'),
    updatedByUsername: optional(asNonEmptyString)(record.updatedByUsername, 'updatedByUsername'),
    // Read path: accept previously saved over-cap layouts so lowering caps
    // does not quarantine existing dashboards. Write paths call
    // `validateCustomDashboardConfig` directly and keep enforcing caps.
    config: validateCustomDashboardConfig(record.config, { enforceTileCaps: false }),
  };
}
