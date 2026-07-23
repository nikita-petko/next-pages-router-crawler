import {
  RAQIV2APIMetric,
  RAQIV2Dimension,
  RAQIV2DimensionDisplayConfig,
  RAQIV2Metric,
  RAQIV2UIPseudoDimension,
  RAQIV2UIPseudoDimensionType,
  type TRAQIV2APIMetric,
  type TUIPseudoDimensionMetricFanoutConfig,
} from '@rbx/creator-hub-analytics-config';
import type { QueryFilter as RAQIV2APIQueryFilter } from '@modules/clients/analytics/analyticsRAQIShared';
import { ChartResourceType as RAQIV2ChartResourceType } from '@modules/clients/analytics/analyticsRAQIShared';
import { getAPIMetricFromUIMetric } from '@modules/experience-analytics-shared/utils/getAPIMetricFromUIMetric';
import { buildFanoutDimensionValues } from '@modules/experience-analytics-shared/utils/makeRAQIV2Request';
import { isValidEnumValue } from '@modules/miscellaneous/utils/enumUtils';
import {
  AnalyticsAlertEvaluationMode,
  AnalyticsAlertInterval,
  type AnalyticsAlertCondition,
  type CreateAnalyticsAlertRequest,
  type ExperienceAlertFilterRowValues,
  type ExperienceAlertFormValues,
  type TAlertConditionMetric,
  type UpdateAnalyticsAlertRequest,
} from '../constants/types';
import {
  computePeriodOffsetMultiplier,
  parseAlertThresholdDisplayValueToRaw,
} from './analyticsAlertFormUtils';

type MetricFanoutPseudoFilterFromForm = {
  dimension: RAQIV2UIPseudoDimension;
  config: TUIPseudoDimensionMetricFanoutConfig<string>;
  values: string[];
};

function collectMetricFanoutPseudoFiltersFromAlertForm(
  filters: readonly ExperienceAlertFilterRowValues[],
): MetricFanoutPseudoFilterFromForm[] {
  const merged: MetricFanoutPseudoFilterFromForm[] = [];
  filters
    .filter((row) => row.dimension !== '' && row.values.length > 0)
    .forEach((row) => {
      if (!isValidEnumValue(RAQIV2UIPseudoDimension, row.dimension)) {
        return;
      }
      const { pseudoDimensionConfig: config } = RAQIV2DimensionDisplayConfig[row.dimension];
      if (config.type !== RAQIV2UIPseudoDimensionType.MetricFanout) {
        return;
      }
      const prior = merged.find((m) => m.dimension === row.dimension);
      if (prior) {
        prior.values.push(...row.values);
      } else {
        merged.push({
          dimension: row.dimension,
          config,
          values: [...row.values],
        });
      }
    });
  return merged;
}

function resolveUiAlertMetricToApiMetricForCreateRequest(
  metric: TAlertConditionMetric,
  filters: ExperienceAlertFormValues['filters'],
): TRAQIV2APIMetric {
  if (isValidEnumValue(RAQIV2Metric, metric) || isValidEnumValue(RAQIV2APIMetric, metric)) {
    return metric;
  }
  const fanoutFilters = collectMetricFanoutPseudoFiltersFromAlertForm(filters);
  if (fanoutFilters.length === 0) {
    return getAPIMetricFromUIMetric(metric, {
      percentile: null,
      aggregationType: null,
    });
  }
  if (fanoutFilters.length > 1) {
    throw new Error('Alert form: only one percentile or aggregation filter dimension is supported');
  }
  const fanout = fanoutFilters[0];
  const filterValue = fanout.values[0];
  if (!filterValue) {
    throw new Error('Alert form: select a value for the percentile or aggregation filter');
  }
  return getAPIMetricFromUIMetric(
    metric,
    buildFanoutDimensionValues(fanout.dimension, filterValue),
  );
}

function mapFormFiltersToQueryFilters(
  filters: readonly ExperienceAlertFilterRowValues[],
): RAQIV2APIQueryFilter[] {
  return filters
    .filter(
      (row): row is RAQIV2APIQueryFilter =>
        row.dimension !== '' &&
        row.values.length > 0 &&
        isValidEnumValue(RAQIV2Dimension, row.dimension),
    )
    .map(
      (row): RAQIV2APIQueryFilter => ({
        dimension: row.dimension,
        values: row.values,
      }),
    );
}

/** Form fields needed to resolve the RAQI breakdown/filter shapes. */
export type AlertFormBreakdownAndFilterInput = Pick<
  ExperienceAlertFormValues,
  'filters' | 'breakdownDimension' | 'breakdownCategories'
>;

export type AlertFormBreakdownAndFilter = {
  /** Single-dimension breakdown (RAQI wraps it in `[{ dimensions }]`). */
  readonly breakdown?: RAQIV2Dimension[];
  readonly filter: RAQIV2APIQueryFilter[];
};

/**
 * Resolves the form's filter rows + breakdown selection into the RAQI
 * breakdown/filter shapes. Shared by the create/update API request and the
 * "View metric" Explore-Mode deep link so both encode the same query. Breakdown
 * categories ride along as a filter on the breakdown dimension (intersecting any
 * existing filter row on that dimension) — see
 * {@link mergeBreakdownCategoriesIntoFilters}.
 */
export function resolveAlertFormBreakdownAndFilter(
  values: AlertFormBreakdownAndFilterInput,
): AlertFormBreakdownAndFilter {
  const filter = mapFormFiltersToQueryFilters(values.filters);
  const breakdown =
    !!values.breakdownDimension && isValidEnumValue(RAQIV2Dimension, values.breakdownDimension)
      ? [values.breakdownDimension]
      : undefined;
  const combinedFilter = mergeBreakdownCategoriesIntoFilters(
    filter,
    breakdown?.[0],
    values.breakdownCategories,
  );
  return { breakdown, filter: combinedFilter };
}

/**
 * When the user selected the same dimension for both a filter row and the breakdown, the
 * server should receive a single filter on that dimension whose values are the intersection
 * of the filter row values and the chosen breakdown categories. An empty intersection is
 * passed through as `values: []` rather than throwing — the request still represents what
 * the user configured and the server is responsible for handling the no-match case.
 */
function mergeBreakdownCategoriesIntoFilters(
  filters: RAQIV2APIQueryFilter[],
  breakdownDimension: RAQIV2Dimension | undefined,
  breakdownCategories: readonly string[],
): RAQIV2APIQueryFilter[] {
  if (!breakdownDimension || breakdownCategories.length === 0) {
    return filters;
  }
  const breakdownCategorySet = new Set(breakdownCategories);
  let mergedExisting = false;
  const next = filters.map((row) => {
    if (row.dimension !== breakdownDimension) {
      return row;
    }
    mergedExisting = true;
    const intersection = row.values.filter((v) => breakdownCategorySet.has(v));
    return { dimension: row.dimension, values: intersection };
  });
  if (!mergedExisting) {
    next.push({ dimension: breakdownDimension, values: [...breakdownCategories] });
  }
  return next;
}

function buildCondition(
  values: ExperienceAlertFormValues,
  metric: TAlertConditionMetric,
  interval: AnalyticsAlertInterval,
): AnalyticsAlertCondition {
  // For Absolute mode the user types the threshold in the *display* shape
  // that matches a RAQI spline-chart data-point tooltip (e.g. "5" for a 5%
  // percentage metric, "2.5" GB for memory bytes), and the parser is the
  // inverse of that formatter (yielding e.g. 0.05 for Percentage01).
  // For PeriodOverPeriod the threshold is always a relative percent change
  // regardless of metric, so the parser divides by 100 unconditionally
  // (e.g. user types "5" -> raw 0.05 in the request payload).
  const threshold = parseAlertThresholdDisplayValueToRaw({
    metric,
    evaluationMode: values.evaluationMode,
    displayValue: values.value,
  });
  if (threshold === null) {
    throw new TypeError('Alert form: enter a numeric threshold');
  }
  const condition: AnalyticsAlertCondition = {
    operator: values.operation,
    threshold,
    evaluationMode: values.evaluationMode,
  };
  // `periodOffsetMultiplier` only applies to period-over-period alerts; the
  // backend rejects it on Absolute alerts, so we omit it there. The form's
  // semantic `comparisonPeriod` is converted to the interval-scaled multiplier
  // only here, at request-build time.
  if (values.evaluationMode === AnalyticsAlertEvaluationMode.PeriodOverPeriod) {
    condition.periodOffsetMultiplier = computePeriodOffsetMultiplier(
      interval,
      values.comparisonPeriod,
    );
  }
  return condition;
}

export function buildCreateAnalyticsAlertRequest(
  universeId: number,
  values: ExperienceAlertFormValues,
): CreateAnalyticsAlertRequest {
  const { metric, consecutiveOccurrences, interval, severity, filters, webhookConfigurationIds } =
    values;

  if (metric == null) {
    throw new Error('Alert form: select a metric');
  }
  if (
    consecutiveOccurrences === '' ||
    !Number.isFinite(consecutiveOccurrences) ||
    !Number.isInteger(consecutiveOccurrences) ||
    consecutiveOccurrences < 1
  ) {
    throw new Error('Alert form: enter consecutive occurrences');
  }
  if (interval === '' || !isValidEnumValue(AnalyticsAlertInterval, interval)) {
    throw new Error('Alert form: choose a time granularity');
  }
  const apiMetric = resolveUiAlertMetricToApiMetricForCreateRequest(metric, filters);
  const { breakdown: breakdownDimensions, filter: combinedFilter } =
    resolveAlertFormBreakdownAndFilter(values);

  const webhookReceiverConfig =
    webhookConfigurationIds.length > 0
      ? {
          receivers: webhookConfigurationIds.map((id) => ({ webhookConfigurationId: id })),
        }
      : undefined;

  return {
    resourceType: RAQIV2ChartResourceType.Universe,
    resourceId: String(universeId),
    alertsCreateAlertConfigRequest: {
      name: values.name.trim(),
      description: values.description.trim() || undefined,
      metric: apiMetric,
      condition: buildCondition(values, metric, interval),
      severity,
      interval,
      consecutiveOccurrences,
      breakdown: breakdownDimensions ? [{ dimensions: breakdownDimensions }] : undefined,
      filter: combinedFilter.length > 0 ? combinedFilter : undefined,
      webhookReceiverConfig,
    },
  };
}

export function buildUpdateAnalyticsAlertRequest(
  universeId: number,
  alertId: string,
  values: ExperienceAlertFormValues,
): UpdateAnalyticsAlertRequest {
  const { alertsCreateAlertConfigRequest, ...rest } = buildCreateAnalyticsAlertRequest(
    universeId,
    values,
  );
  return { ...rest, alertId, alertsUpdateAlertConfigRequest: alertsCreateAlertConfigRequest };
}
