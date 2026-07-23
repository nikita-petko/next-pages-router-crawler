import { SeriesDataTypes } from '@rbx/analytics-ui';
import type { TRAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import type { FormattedText } from '@modules/analytics-translations/types';
import getTypeLegendDescription from '@modules/charts-generic/charts/TimeSeriesRangeAnnotationLegend';
import type {
  SplineChartTimeSeriesNamedData,
  TimeSeriesSplineChartSpec,
} from '@modules/charts-generic/charts/types/TimeSeriesSplineChartTypes';
import type {
  TimeSeriesDataPoint,
  Value,
} from '@modules/charts-generic/charts/types/TimeSeriesTypes';
import type { QuotaConfig } from '../types/RAQIV2ChartConfig';
import type { RAQIV2TranslationDependencies } from '../types/RAQIV2DimensionRenderer';

export type StaticQuotaConfig = Extract<QuotaConfig, { type: 'Static' }>;

// `Value` and `FormattedText` are nominal-branded types with no runtime
// distinction from `number` / `string`. A single `as` per branding site keeps
// the rest of the module brand-cast-free.
// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- branding a plain number into the Value nominal type
const brandValue = (value: number): Value => value as Value;
// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- branding a plain string into the FormattedText nominal type
const toFormattedText = (value: string): FormattedText => value as FormattedText;

const getQuotaLegendName = (
  translationDependencies: RAQIV2TranslationDependencies,
): FormattedText => {
  const description = getTypeLegendDescription(
    SeriesDataTypes.Quota,
    translationDependencies.translate,
  );
  return description ?? toFormattedText('');
};

/**
 * Synthesizes a flat horizontal quota series at `config.value` for each main
 * chart timestamp. Returns an empty list when the main chart has no
 * timestamps so the caller can short-circuit cleanly.
 */
export const synthesizeStaticQuotaSeries = (
  mainChart: TimeSeriesSplineChartSpec,
  config: StaticQuotaConfig,
  translationDependencies: RAQIV2TranslationDependencies,
): SplineChartTimeSeriesNamedData[] => {
  if (mainChart.timestamps.length === 0) {
    return [];
  }
  const brandedValue = brandValue(config.value);
  const dataPoints = mainChart.timestamps.map(
    (timestamp): TimeSeriesDataPoint => [timestamp, brandedValue],
  );
  const name = config.labelKey
    ? translationDependencies.translate(config.labelKey)
    : getQuotaLegendName(translationDependencies);
  return [
    {
      name,
      dataPoints,
      type: SeriesDataTypes.Quota,
      zones: [],
      ...(config.color === undefined ? {} : { color: config.color }),
      ...(config.hideLegend ? { showInLegend: false } : {}),
    },
  ];
};

/**
 * Pure projection that overlays a static-quota series onto an existing
 * spline chart. Extracted from {@link useAnalyticsQuota}'s static branch so
 * the (synchronous) decision logic — when to suppress the quota line, how to
 * strip the previous-period comparison series, etc. — can be tested without
 * standing up the full hook with its client/translation/cache providers.
 *
 * The quota line is suppressed (returning the chart untouched and an empty
 * summary) when:
 * - the main chart has no rendered series — nothing to anchor the line to,
 *   and the chart will already be empty-state, or
 * - any breakdown is active — fanout charts can't carry a single shared
 *   reference line without misleading the reader, mirroring the existing
 *   metric-quota suppression behavior.
 *
 * When applied, the comparison (previous-period) series is dropped and the
 * synthesized static series is appended in its place.
 */
export const applyStaticQuotaToChart = ({
  mainChart,
  breakdown,
  config,
  translationDependencies,
}: {
  mainChart: TimeSeriesSplineChartSpec;
  breakdown: readonly TRAQIV2Dimension[] | undefined;
  config: StaticQuotaConfig;
  translationDependencies: RAQIV2TranslationDependencies;
}): {
  chartWithQuota: TimeSeriesSplineChartSpec;
  quotaSummary: never[];
} => {
  if (mainChart.series.length === 0 || (breakdown && breakdown.length > 0)) {
    return { chartWithQuota: mainChart, quotaSummary: [] };
  }
  const staticSeries = synthesizeStaticQuotaSeries(mainChart, config, translationDependencies);
  const mainSeriesWithoutComparison = mainChart.series.filter(
    (s) => s.type !== SeriesDataTypes.Comparison,
  );
  return {
    chartWithQuota: {
      ...mainChart,
      series: [...mainSeriesWithoutComparison, ...staticSeries],
    },
    quotaSummary: [],
  };
};
