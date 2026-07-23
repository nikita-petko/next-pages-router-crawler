import { ChartColor } from '@rbx/analytics-ui';
import {
  RAQIV2MetricDisplayConfig,
  Severity,
  type TRAQIV2Metric,
  type TRAQIV2MetricDisplayConfig,
} from '@rbx/creator-hub-analytics-config';
import type { TranslationKey } from '@modules/analytics-translations/types';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { isValidEnumValue } from '@modules/miscellaneous/utils/enumUtils';
import { isNumericUIMetric } from '../constants/AnalyticsMetricDisplayConfig';
import type { QuotaConfig } from '../types/RAQIV2ChartConfig';

/**
 * Maps the codegen's semantic `Severity` enum onto the frontend's render-time
 * `ChartColor` per the proto contract (see `metric_display_definition.proto::
 * Severity`):
 *
 *   Error   → ChartColor.Red
 *   Warning → ChartColor.Yellow
 *   Info    → undefined (themed `benchmarkLineColor` =
 *             `theme.palette.content.standard`, the gray-ish default the
 *             Quota series already falls back to in `seriesStylesOptions`).
 *
 * `Record<Severity, ...>` enforces exhaustiveness at compile time, and a
 * stray runtime string (e.g. a future codegen severity not yet synced into
 * creator-hub) safely indexes to `undefined` rather than crashing the chart.
 */
const SEVERITY_TO_CHART_COLOR: Record<Severity, ChartColor | undefined> = {
  [Severity.Error]: ChartColor.Red,
  [Severity.Warning]: ChartColor.Yellow,
  [Severity.Info]: undefined,
};

/**
 * The quota label namespace coming out of codegen is the
 * `AnalyticsTranslationNamespace` enum value (e.g. `'CreatorDashboard.Analytics'`).
 * `TranslationNamespace` mirrors those same string values, so we can validate
 * the string and brand it as `TranslationNamespace` for our `translationKey`
 * helper.
 */
const isAnalyticsTranslationNamespace = (value: string): value is TranslationNamespace =>
  isValidEnumValue(TranslationNamespace, value);

const labelToTranslationKey = (label: {
  key: string;
  namespace: string;
}): TranslationKey | undefined => {
  if (!isAnalyticsTranslationNamespace(label.namespace)) {
    return undefined;
  }
  return translationKey(label.key, label.namespace);
};

type CodegenQuotaConfig = NonNullable<TRAQIV2MetricDisplayConfig['quotaConfig']>;

/**
 * Pure normalizer that projects a codegen `quotaConfig` block onto the
 * frontend's discriminated `QuotaConfig` union. Split out from
 * {@link getQuotaConfigForMetric} so tests can exercise the projection
 * (severity/label validation, malformed-config handling) without having to
 * mock `RAQIV2MetricDisplayConfig`.
 *
 * Returns `undefined` when the input is `undefined`, when the variant is
 * `Metric` but the companion isn't a numeric UI metric we can chart, or when
 * the config is malformed (neither `metric` nor `staticValue` set).
 */
export const normalizeCodegenQuotaConfig = (
  codegenQuotaConfig: CodegenQuotaConfig | undefined,
): QuotaConfig | undefined => {
  if (!codegenQuotaConfig) {
    return undefined;
  }
  if (codegenQuotaConfig.metric !== undefined) {
    // The companion-metric quota path can only be served as a spline series via
    // `useAnalyticsQuota`, which keys into `RAQIV2MetricToSupportedDimensions`.
    // That table is typed by `TRAQIV2UIMetric`, so we drop quota configs that
    // resolve to a non-numeric-UI metric rather than risk an unsafe cast.
    if (!isNumericUIMetric(codegenQuotaConfig.metric)) {
      return undefined;
    }
    return { type: 'Metric', metric: codegenQuotaConfig.metric };
  }
  if (codegenQuotaConfig.staticValue !== undefined) {
    const labelKey = codegenQuotaConfig.label
      ? labelToTranslationKey(codegenQuotaConfig.label)
      : undefined;
    const color =
      codegenQuotaConfig.severity === undefined
        ? undefined
        : SEVERITY_TO_CHART_COLOR[codegenQuotaConfig.severity];
    return {
      type: 'Static',
      value: codegenQuotaConfig.staticValue,
      ...(color === undefined ? {} : { color }),
      ...(labelKey === undefined ? {} : { labelKey }),
      ...(codegenQuotaConfig.hideLegend ? { hideLegend: true } : {}),
    };
  }
  return undefined;
};

/**
 * Resolves the metric's `quotaConfig` from codegen and normalizes it into a
 * discriminated union ergonomic for the chart pipeline.
 *
 * @see normalizeCodegenQuotaConfig for the shape semantics and edge cases.
 */
export const getQuotaConfigForMetric = (metric: TRAQIV2Metric): QuotaConfig | undefined =>
  normalizeCodegenQuotaConfig(RAQIV2MetricDisplayConfig[metric]?.quotaConfig);
