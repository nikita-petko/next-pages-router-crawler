import { useCallback, useMemo } from 'react';
import { numberFormatter } from '@rbx/core';
import type { Locale } from '@rbx/intl';
import type { TranslationKeyToFormattedText } from '@modules/analytics-translations/types';
import buildAxisFormattingSpec from '../buildAxisFormattingSpec';
import formatChartUnit from '../formatChartUnit';
import { ChartUnit } from '../types/ChartTypes';
import type { TimeSeriesChartUnitSpec } from '../types/TimeSeriesTypes';

const useTimeSeriesChartYAxisConfig = ({
  unitSpec,
  showUnitDisplayOnYAxisTitle,
  translationDependencies,
  enableMetricAwareYAxisFormatter = false,
}: {
  unitSpec: TimeSeriesChartUnitSpec;
  showUnitDisplayOnYAxisTitle?: boolean;
  /**
   * When provided alongside a metric `formattingSpec` AND
   * `enableMetricAwareYAxisFormatter` is true, non-percent Y-axis labels are
   * routed through `formatChartUnit` with an axis-tuned spec so they share
   * the same metric-aware formatter as the tooltip / summary (including the
   * small-value scientific-notation fallback added in DSA-5725) while still
   * abbreviating large values and trimming trailing zeros. When omitted, or
   * when the unit has no `formattingSpec` (legacy metrics), or when the
   * feature flag is disabled, non-percent axes fall back to Highcharts'
   * default formatter — preserving the prior behavior.
   */
  translationDependencies?: {
    locale: Locale;
    translate: TranslationKeyToFormattedText;
  };
  /**
   * Kill-switch for the DSA-5725 metric-aware Y-axis formatter. Threaded in
   * from a feature flag at the chart-component layer (charts-generic stays
   * feature-flag-agnostic). Defaults to `false` so unflagged callers keep
   * the legacy Highcharts default formatter.
   */
  enableMetricAwareYAxisFormatter?: boolean;
}) => {
  const percentFormatter = useCallback(({ value }: { value: string | number }) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return `${numberFormatter(num, 'percent')}`;
  }, []);

  const yAxisFormattingSpec = useMemo(
    () => (unitSpec.formattingSpec ? buildAxisFormattingSpec(unitSpec.formattingSpec) : undefined),
    [unitSpec.formattingSpec],
  );

  const chartUnitFormatter = useCallback(
    ({ value }: { value: string | number }) => {
      if (!translationDependencies || !yAxisFormattingSpec) {
        return '';
      }
      const num = typeof value === 'string' ? parseFloat(value) : value;
      if (!Number.isFinite(num)) {
        return '';
      }
      return `${formatChartUnit(num, { ...unitSpec, formattingSpec: yAxisFormattingSpec }, translationDependencies)}`;
    },
    [unitSpec, yAxisFormattingSpec, translationDependencies],
  );

  return useMemo(() => {
    const config = {
      yAxisTitle: showUnitDisplayOnYAxisTitle ? unitSpec.display : undefined,
      decimalPrecision: unitSpec.formattingSpec?.numberFormatOptions.maximumFractionDigits,
    };
    const isPercentUnit =
      unitSpec.formattingSpec?.numberFormatOptions.style === 'percent' ||
      // TODO(DSA-4660): Remove legacy unit fallback after formatter migration.
      unitSpec.unit === ChartUnit.Percentage;
    if (isPercentUnit) {
      return { ...config, yAxisFormatter: percentFormatter };
    }
    // Only override the formatter when the feature flag is on AND we have a
    // metric formatting spec to tune. Otherwise (flag off, legacy metrics, or
    // missing translation deps) fall through to Highcharts' default formatter.
    if (enableMetricAwareYAxisFormatter && translationDependencies && yAxisFormattingSpec) {
      return { ...config, yAxisFormatter: chartUnitFormatter };
    }
    return config;
  }, [
    chartUnitFormatter,
    enableMetricAwareYAxisFormatter,
    percentFormatter,
    showUnitDisplayOnYAxisTitle,
    translationDependencies,
    unitSpec.display,
    unitSpec.formattingSpec?.numberFormatOptions.maximumFractionDigits,
    unitSpec.formattingSpec?.numberFormatOptions.style,
    // TODO(DSA-4660): Remove legacy unit dependency after formatter migration.
    unitSpec.unit,
    yAxisFormattingSpec,
  ]);
};

export default useTimeSeriesChartYAxisConfig;
