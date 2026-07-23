import {
  SeriesMetadata,
  TimeSeriesSplineChartSpec,
  TRangeBenchmarkSpec,
} from '@modules/charts-generic';
import { translationKey } from '@modules/analytics-translations';
import { Locale } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { QueryBenchmarkResult } from '@modules/clients/analytics/analyticsBenchmark';
import updateHighchartsDataWithBenchmark from './analyticsBenchmarkAdapter';
import { RAQIV2TranslationDependencies } from '../types/RAQIV2DimensionRenderer';
import RAQIV2ChartSpec from '../types/RAQIV2ChartSpec';

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
