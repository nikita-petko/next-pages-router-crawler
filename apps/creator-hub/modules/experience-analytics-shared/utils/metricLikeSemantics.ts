import {
  RAQIV2BenchmarkVariantId,
  RAQIV2Metric,
  type TRAQIV2UIMetric,
} from '@rbx/creator-hub-analytics-config';
import type { FormattedText, TranslationKey } from '@modules/analytics-translations/types';
import {
  brandUntranslatableText,
  translationKey,
} from '@modules/analytics-translations/wrapperFunctions';
import ChartSummaryType from '@modules/charts-generic/enums/ChartSummaryType';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { isValidEnumValue } from '@modules/miscellaneous/utils/enumUtils';
import {
  getBenchmarkVariantByDatasetKey,
  getPrecomputedL7MetricFromBase,
  isPrecomputedL7Metric,
  isPureL7SmoothingComputedMetric,
  type PrecomputedL7Metric,
} from '../chartConfigurator/l7MetricMapping';
import getAnalyticsMetricDisplayConfig from '../constants/AnalyticsMetricDisplayConfig';
import {
  getUIMetricFromAtomicMetricLike,
  isComputedMetric,
  isCustomEventsAtomicMetricLike,
  type MetricLike,
} from '../types/ComputedMetric';
import type { RAQIV2TranslationDependencies } from '../types/RAQIV2DimensionRenderer';

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const isRAQIV2Metric = <TMetric extends TRAQIV2UIMetric>(
  metric: TMetric,
): metric is Extract<TMetric, RAQIV2Metric> => isValidEnumValue(RAQIV2Metric, metric);

/**
 * Brand user-authored text as {@link FormattedText} for direct UI rendering.
 *
 * `FormattedText` is a phantom-branded `string` with no runtime
 * representation — the only way to construct one without going through
 * `translate(...)` is a structural cast. Keep that cast scoped to values that
 * are already display text by construction: computed metric names/formulas and
 * custom event names entered by the creator.
 *
 * Do not use this for system-owned identifiers like metric enum values. Those
 * must go through their display config and `translate(...)`.
 */
export const brandUserSuppliedText = (value: string): FormattedText =>
  brandUntranslatableText(value);

/**
 * Returns a translated/user-authored display label for any metric-like value.
 */
export const getMetricLabelFromMetricLike = (
  metricLike: MetricLike<TRAQIV2UIMetric>,
  translationDependencies?: RAQIV2TranslationDependencies,
): FormattedText => {
  if (!isComputedMetric(metricLike)) {
    if (isCustomEventsAtomicMetricLike(metricLike)) {
      return brandUserSuppliedText(metricLike.customEventName);
    }
    const { localizedName } = getAnalyticsMetricDisplayConfig(
      getUIMetricFromAtomicMetricLike(metricLike),
    );
    return translationDependencies
      ? translationDependencies.translate(localizedName)
      : brandUserSuppliedText(localizedName.key);
  }
  if (isPureL7SmoothingComputedMetric(metricLike)) {
    return getMetricLabelFromMetricLike(metricLike.sources[0].metric, translationDependencies);
  }
  return brandUserSuppliedText(
    isNonEmptyString(metricLike.name) ? metricLike.name : metricLike.formula,
  );
};

export const getExportLabelFromMetricLike = getMetricLabelFromMetricLike;

/**
 * The TranslationKey used everywhere in explore mode for an unnamed
 * computed metric (formula card placeholder, chart title fallback, table
 * column header). Centralized here so call sites that need the same key
 * (e.g. {@link getMetricTitleKeyFromMetricLike}) can reference one source
 * of truth instead of redeclaring the namespace + key tuple.
 */
export const UNTITLED_FORMULA_TRANSLATION_KEY: TranslationKey = translationKey(
  'Label.ExploreMode.UntitledFormula',
  TranslationNamespace.Analytics,
);

/**
 * Returns the value to put in `TableColumnConfig.titleKey` for a metric.
 *
 * Differs from {@link getMetricLabelFromMetricLike} in how unnamed computed
 * metrics are handled: the table column header MUST NOT show the raw
 * formula text (e.g. `"A / B"`), because column headers are persistent
 * UI surfaces that the user expects to read like names. Instead, when the
 * computed metric has no `name` we hand back the localized
 * "(Untitled formula)" TranslationKey so the renderer translates it at
 * draw time — matching the chart title fallback and the formula card
 * placeholder.
 *
 * Atomic metrics return their localized display key so the table renderer can
 * translate it. Named computed metrics return the creator-provided name.
 */
export const getMetricTitleKeyFromMetricLike = (
  metricLike: MetricLike<TRAQIV2UIMetric>,
): FormattedText | TranslationKey => {
  if (!isComputedMetric(metricLike)) {
    if (isCustomEventsAtomicMetricLike(metricLike)) {
      return brandUserSuppliedText(metricLike.customEventName);
    }
    return getAnalyticsMetricDisplayConfig(getUIMetricFromAtomicMetricLike(metricLike))
      .localizedName;
  }
  if (isNonEmptyString(metricLike.name)) {
    return brandUserSuppliedText(metricLike.name);
  }
  return UNTITLED_FORMULA_TRANSLATION_KEY;
};

/**
 * Leftover overlay dataset key for insights and titles.
 *
 * Pure L7 smoothing ComputedMetrics map to the leftover `L7Average*` name so
 * insights scorecards can keep keying that dataset. Atomic leftover identities
 * (old URLs / ingest) pass through unchanged. Arbitrary formulas and L7-on
 * metrics with no leftover dataset return null.
 *
 * Benchmark API requests use {@link getBenchmarkRequestIdentityFromMetricLike}
 * instead. Do not POST this leftover name as `metric`.
 */
export const getRAQIV2BenchmarkMetricFromMetricLike = <TMetric extends TRAQIV2UIMetric>(
  metricLike: MetricLike<TMetric>,
): RAQIV2Metric | PrecomputedL7Metric | null => {
  if (isComputedMetric(metricLike)) {
    if (!isPureL7SmoothingComputedMetric(metricLike)) {
      return null;
    }
    const sourceMetric = getUIMetricFromAtomicMetricLike(metricLike.sources[0].metric);
    return getPrecomputedL7MetricFromBase(sourceMetric);
  }

  const uiMetric = getUIMetricFromAtomicMetricLike(metricLike);
  if (!isRAQIV2Metric(uiMetric)) {
    return null;
  }
  return uiMetric;
};

/**
 * Benchmark API request identity. `metric` is the CAaaS base metric.
 * `benchmarkVariantId` is set when the overlay table is a leftover L7
 * dataset for that variant. Do not POST leftover `L7Average*` names as
 * `metric`.
 *
 * Pure L7 smoothing of a leftover base becomes `{ base, l7_average }`.
 * Leftover atomic `L7Average*` names (old URLs) become the same pair.
 * Other atomic RAQIV2 metrics send `metric` with no variant. Formulas and
 * L7-on metrics with no leftover dataset return null.
 */
export type AnalyticsBenchmarkRequestIdentity = {
  metric: RAQIV2Metric;
  benchmarkVariantId?: RAQIV2BenchmarkVariantId;
};

export const getBenchmarkRequestIdentityFromMetricLike = <TMetric extends TRAQIV2UIMetric>(
  metricLike: MetricLike<TMetric>,
): AnalyticsBenchmarkRequestIdentity | null => {
  if (isComputedMetric(metricLike)) {
    if (!isPureL7SmoothingComputedMetric(metricLike)) {
      return null;
    }
    const sourceMetric = getUIMetricFromAtomicMetricLike(metricLike.sources[0].metric);
    if (!isValidEnumValue(RAQIV2Metric, sourceMetric)) {
      return null;
    }
    if (getPrecomputedL7MetricFromBase(sourceMetric) == null) {
      return null;
    }
    return {
      metric: sourceMetric,
      benchmarkVariantId: RAQIV2BenchmarkVariantId.L7Average,
    };
  }

  const uiMetric = getUIMetricFromAtomicMetricLike(metricLike);
  if (isPrecomputedL7Metric(uiMetric)) {
    const mapping = getBenchmarkVariantByDatasetKey(uiMetric);
    if (mapping == null) {
      return null;
    }
    return {
      metric: mapping.metric,
      benchmarkVariantId: mapping.variantId,
    };
  }
  if (!isRAQIV2Metric(uiMetric)) {
    return null;
  }
  return { metric: uiMetric };
};

export const getDisplayUnitFromMetricLike = (
  metricLike: MetricLike,
  translationDependencies: RAQIV2TranslationDependencies,
): FormattedText => {
  if (isComputedMetric(metricLike)) {
    if (isPureL7SmoothingComputedMetric(metricLike)) {
      return getDisplayUnitFromMetricLike(metricLike.sources[0].metric, translationDependencies);
    }
    return brandUntranslatableText('');
  }
  const { localizedName } = getAnalyticsMetricDisplayConfig(
    getUIMetricFromAtomicMetricLike(metricLike),
  );
  return translationDependencies.translate(localizedName);
};

export const getIsPositiveGoodFromMetricLike = (metric: MetricLike<TRAQIV2UIMetric>): boolean => {
  if (isComputedMetric(metric)) {
    if (isPureL7SmoothingComputedMetric(metric)) {
      return getIsPositiveGoodFromMetricLike(metric.sources[0].metric);
    }
    // TODO(gperkins@20260302): derive from equation and source metrics DSA-5477
    return true;
  }
  return getAnalyticsMetricDisplayConfig(getUIMetricFromAtomicMetricLike(metric)).isPositiveGood;
};

/**
 * Returns true when the metric's primary aggregation is Average (percentage/rate
 * metrics like retention, CVR). Returns false for Total/summable metrics (DAU,
 * revenue) and for computed metrics (where the aggregation semantics are ambiguous).
 */
export const getIsAverageAggregationMetric = (metric: MetricLike<TRAQIV2UIMetric>): boolean => {
  if (isComputedMetric(metric)) {
    if (isPureL7SmoothingComputedMetric(metric)) {
      return getIsAverageAggregationMetric(metric.sources[0].metric);
    }
    return false;
  }
  const { defaultTotalSummaryTypes } = getAnalyticsMetricDisplayConfig(
    getUIMetricFromAtomicMetricLike(metric),
  );
  return defaultTotalSummaryTypes?.[0]?.type === ChartSummaryType.Average;
};
