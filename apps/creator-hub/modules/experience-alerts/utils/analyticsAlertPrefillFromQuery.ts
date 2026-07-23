import {
  RAQIV2Metric,
  RAQIV2UIMetric,
  type TRAQIV2Dimension,
} from '@rbx/creator-hub-analytics-config';
import AnalyticsQueryParams from '@modules/charts-generic/enums/AnalyticsQueryParams';
import {
  isNumericUIMetric,
  type TRAQIV2NumericUIMetric,
} from '@modules/experience-analytics-shared/constants/AnalyticsMetricDisplayConfig';
import {
  parseBreakdown,
  parseGranularity,
} from '@modules/experience-analytics-shared/context/rawQueryParams/queryParamParsers';
import { queryParamsToUIFilters } from '@modules/experience-analytics-shared/layout/ExperienceAnalyticsPageControlBar/filterUtils';
import type { ExperienceAlertFilterRowValues, ExperienceAlertFormValues } from '../constants/types';
import {
  analyticsIntervalFromMetricGranularity,
  getAlertBreakdownDimensionsForMetric,
  getAlertFilterDimensionsForMetric,
  getAlertEligibleMetrics,
  resolveCanonicalAlertMetric,
} from './analyticsAlertFormUtils';

type QueryValue = string | string[] | undefined;
export type AnalyticsAlertPrefillQuery = Readonly<Record<string, QueryValue>>;

const FILTER_QUERY_PREFIX = 'filter_';

const firstString = (value: QueryValue): string | undefined =>
  Array.isArray(value) ? value[0] : value;

const ALL_NUMERIC_UI_METRICS: TRAQIV2NumericUIMetric[] = [
  ...Object.values(RAQIV2Metric),
  ...Object.values(RAQIV2UIMetric),
].filter((metric): metric is TRAQIV2NumericUIMetric => isNumericUIMetric(metric));

/**
 * Validates the `metric` query param and resolves it to its canonical alert
 * metric, returning `undefined` unless the canonical metric is alert-eligible.
 * This mirrors the encoder (which emits the canonical metric) while staying
 * robust to hand-crafted URLs carrying a hidden/aliased metric.
 */
const resolveMetricParam = (raw: QueryValue): TRAQIV2NumericUIMetric | undefined => {
  const value = firstString(raw);
  if (!value) {
    return undefined;
  }
  const matched = ALL_NUMERIC_UI_METRICS.find((metric) => (metric as string) === value);
  if (!matched) {
    return undefined;
  }
  const canonical = resolveCanonicalAlertMetric(matched);
  return getAlertEligibleMetrics().includes(canonical) ? canonical : undefined;
};

const collectFilterSubset = (query: AnalyticsAlertPrefillQuery): Record<string, QueryValue> => {
  const subset: Record<string, QueryValue> = {};
  Object.keys(query).forEach((key) => {
    if (key.startsWith(FILTER_QUERY_PREFIX)) {
      subset[key] = query[key];
    }
  });
  return subset;
};

/**
 * Decodes a chart -> create-alert deep link (see
 * `getSharedChartContextQueryParams`) into the subset of `ExperienceAlertFormValues`
 * that the create form can prefill: `metric`, `interval`, `breakdownDimension`,
 * `breakdownCategories`, and `filters`.
 *
 * Returns `undefined` when the URL carries no alert-eligible `metric` so the
 * create page falls back to a blank form (and does not enable pristine submit).
 *
 * Filter/breakdown splitting mirrors `analyticsAlertDetailToFormValues`:
 * values on the resolved breakdown dimension become `breakdownCategories`,
 * everything else becomes filter rows. Both sides are constrained to the
 * metric's alert-eligible dimensions so an invalid deep link can never seed a
 * dimension the form would reject.
 */
const analyticsAlertPrefillFromQuery = (
  query: AnalyticsAlertPrefillQuery,
): Partial<ExperienceAlertFormValues> | undefined => {
  const metric = resolveMetricParam(query[AnalyticsQueryParams.Metric]);
  if (!metric) {
    return undefined;
  }

  const prefill: Partial<ExperienceAlertFormValues> = { metric };

  const granularity = parseGranularity(firstString(query[AnalyticsQueryParams.Granularity]));
  const interval = granularity ? analyticsIntervalFromMetricGranularity(granularity) : undefined;
  if (interval) {
    prefill.interval = interval;
  }

  const breakdownDimensions = getAlertBreakdownDimensionsForMetric(metric);
  const filterDimensions = getAlertFilterDimensionsForMetric(metric);

  const parsedBreakdown = parseBreakdown(query[AnalyticsQueryParams.Breakdown]);
  const breakdownDimension: TRAQIV2Dimension | null =
    parsedBreakdown?.find((dimension) => breakdownDimensions.includes(dimension)) ?? null;

  const uiFilters = queryParamsToUIFilters(collectFilterSubset(query));
  const valuesForDimension = (dimension: TRAQIV2Dimension): readonly string[] | undefined =>
    uiFilters.find((filter) => filter.dimension === dimension)?.values;

  if (breakdownDimension) {
    prefill.breakdownDimension = breakdownDimension;
    const categories = valuesForDimension(breakdownDimension);
    if (categories?.length) {
      prefill.breakdownCategories = [...categories];
    }
  }

  const filters: ExperienceAlertFilterRowValues[] = filterDimensions
    .filter((dimension) => dimension !== breakdownDimension)
    .flatMap((dimension) => {
      const values = valuesForDimension(dimension);
      return values?.length ? [{ dimension, values: [...values] }] : [];
    });
  if (filters.length) {
    prefill.filters = filters;
  }

  return prefill;
};

export default analyticsAlertPrefillFromQuery;
