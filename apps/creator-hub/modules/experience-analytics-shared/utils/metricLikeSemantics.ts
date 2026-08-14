import { RAQIV2Metric, type TRAQIV2UIMetric } from '@rbx/creator-hub-analytics-config';
import type { FormattedText, TranslationKey } from '@modules/analytics-translations/types';
import {
  brandUntranslatableText,
  translationKey,
} from '@modules/analytics-translations/wrapperFunctions';
import ChartSummaryType from '@modules/charts-generic/enums/ChartSummaryType';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { isValidEnumValue } from '@modules/miscellaneous/utils/enumUtils';
import {
  getPrecomputedL7MetricFromBase,
  isPureL7SmoothingComputedMetric,
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
 * Canonical RAQI metric identity for the analytics-benchmark API.
 *
 * Atomic leftover `L7Average*` identities pass through unchanged (predefined
 * L7 charts keep that name as UI identity). Pure L7 smoothing ComputedMetrics
 * — Explore Mode's ACE rewrite of those same ten — map back to the leftover
 * name so the overlay still hits the L7 benchmark dataset. Arbitrary formulas
 * and L7-on metrics with no leftover dataset return null.
 */
export const getRAQIV2BenchmarkMetricFromMetricLike = <TMetric extends TRAQIV2UIMetric>(
  metricLike: MetricLike<TMetric>,
): RAQIV2Metric | null => {
  if (isComputedMetric(metricLike)) {
    if (!isPureL7SmoothingComputedMetric(metricLike)) {
      return null;
    }
    const sourceMetric = getUIMetricFromAtomicMetricLike(metricLike.sources[0].metric);
    const precomputedL7 = getPrecomputedL7MetricFromBase(sourceMetric);
    return precomputedL7 && isRAQIV2Metric(precomputedL7) ? precomputedL7 : null;
  }

  const uiMetric = getUIMetricFromAtomicMetricLike(metricLike);
  if (!isRAQIV2Metric(uiMetric)) {
    return null;
  }
  return uiMetric;
};

export const getDisplayUnitFromMetricLike = (
  metricLike: MetricLike,
  { translate }: RAQIV2TranslationDependencies,
): FormattedText => {
  if (isComputedMetric(metricLike)) {
    return brandUntranslatableText('');
  }
  const { localizedName } = getAnalyticsMetricDisplayConfig(
    getUIMetricFromAtomicMetricLike(metricLike),
  );
  return translate(localizedName);
};

export const getIsPositiveGoodFromMetricLike = (metric: MetricLike<TRAQIV2UIMetric>): boolean => {
  if (isComputedMetric(metric)) {
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
    return false;
  }
  const { defaultTotalSummaryTypes } = getAnalyticsMetricDisplayConfig(
    getUIMetricFromAtomicMetricLike(metric),
  );
  return defaultTotalSummaryTypes?.[0]?.type === ChartSummaryType.Average;
};
