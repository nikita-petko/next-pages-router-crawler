import type { Locale } from '@rbx/intl';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import type { TRangeBenchmarkSpec } from '@modules/charts-generic/charts/types/RangeBenchmarkSpec';
import type { SeriesMetadata } from '@modules/charts-generic/charts/types/SeriesMetadata';
import type { TimeSeriesSplineChartSpec } from '@modules/charts-generic/charts/types/TimeSeriesSplineChartTypes';
import type { QueryBenchmarkResult } from '@modules/clients/analytics/analyticsBenchmark';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import type RAQIV2ChartSpec from '../types/RAQIV2ChartSpec';
import type { RAQIV2TranslationDependencies } from '../types/RAQIV2DimensionRenderer';
import updateHighchartsDataWithBenchmark from './analyticsBenchmarkAdapter';

const genericAnalyticsBenchmarksAdapter = (
  spec: RAQIV2ChartSpec,
  chartWithoutBenchmarks: TimeSeriesSplineChartSpec,
  data: QueryBenchmarkResult | null,
  locale: Locale,
  translationDeps: RAQIV2TranslationDependencies,
): {
  chart: TimeSeriesSplineChartSpec;
  rangeBenchmarkSpec?: TRangeBenchmarkSpec;
  benchmarkSeriesMetadata?: Map<string, SeriesMetadata>;
} => {
  const { translate } = translationDeps;
  const { chart, rangeBenchmark, benchmarkSeriesMetadata } =
    !data || chartWithoutBenchmarks.series.length === 0
      ? { chart: chartWithoutBenchmarks, rangeBenchmark: null }
      : updateHighchartsDataWithBenchmark(
          spec,
          chartWithoutBenchmarks,
          data,
          locale,
          translationDeps,
        );

  const rangeBenchmarkSpec: TRangeBenchmarkSpec | undefined = !rangeBenchmark
    ? undefined
    : {
        name: translate(
          translationKey('Label.BenchmarkV3RangeLegend', TranslationNamespace.Analytics),
        ),
        range: rangeBenchmark,
        formatter: ({ bottom, top }) =>
          translate(
            translationKey(
              'Message.BenchmarkV3RangeTooltipCustomPercentile',
              TranslationNamespace.Analytics,
            ),
            {
              top,
              bottom,
              // Defaults - see analyticsBenchmarkAdapter.ts
              bottomPercentile: spec.benchmarkPercentiles?.[0]?.toString() ?? '50',
              topPercentile: spec.benchmarkPercentiles?.[1]?.toString() ?? '90',
            },
          ),
      };

  return {
    chart,
    rangeBenchmarkSpec,
    benchmarkSeriesMetadata,
  };
};

export default genericAnalyticsBenchmarksAdapter;
