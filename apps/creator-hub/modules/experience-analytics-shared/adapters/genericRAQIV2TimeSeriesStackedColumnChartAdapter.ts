import type { RAQIV2MetricGranularity } from '@rbx/creator-hub-analytics-config';
import type { ChartSummaryItemSpec } from '@modules/charts-generic/charts/ChartSummaryItem';
import type { TNumberContextMetadata } from '@modules/charts-generic/charts/numberFormatters';
import type { TimeSeriesStackedColumnChartSpec } from '@modules/charts-generic/charts/types/TimeSeriesStackedColumnChartTypes';
import type RAQIV2ChartSpec from '../types/RAQIV2ChartSpec';
import type { RAQIV2TranslationDependencies } from '../types/RAQIV2DimensionRenderer';
import type { RAQIV2QueryResponses } from '../utils/combineRAQIV2QueryResponses';
import combineRAQIV2QueryResponses from '../utils/combineRAQIV2QueryResponses';
import { buildChartUnitOptions } from './genericRAQIV2ChartAdapter';
import adaptAllRaqiV2SeriesWithComparisonAndSummary from './genericRAQIV2ChartAdapterWithComparison';
import type { RAQIV2SummarySpec } from './genericRAQIV2ChartSummaryAdapter';

type GenericRAQIV2TimeSeriesStackedColumnChartAdapterProps = {
  responses: RAQIV2QueryResponses;
  spec: RAQIV2ChartSpec;
  translationDependencies: RAQIV2TranslationDependencies;
  granularity: RAQIV2MetricGranularity;
  summarySpec: RAQIV2SummarySpec;
  showComparisonChip?: boolean;
  hideTotalSeriesBecauseAllBreakdownsAreUniformlyPositiveOrNegative?: boolean;
  numberContextMetadata?: TNumberContextMetadata;
};

const genericRAQIV2TimeSeriesStackedColumnChartAdapter = ({
  responses,
  spec,
  translationDependencies,
  granularity,
  summarySpec,
  showComparisonChip = true,
  hideTotalSeriesBecauseAllBreakdownsAreUniformlyPositiveOrNegative,
  numberContextMetadata,
}: GenericRAQIV2TimeSeriesStackedColumnChartAdapterProps): {
  chart: TimeSeriesStackedColumnChartSpec;
  summary: Array<ChartSummaryItemSpec>;
} => {
  const { response, comparisonResponse } = combineRAQIV2QueryResponses(responses);
  const { series, timestamps, summary } = adaptAllRaqiV2SeriesWithComparisonAndSummary(
    {
      response,
      translationDependencies,
      granularity,
      spec,
    },
    summarySpec,
    comparisonResponse,
    { numberContextMetadata, showComparisonChip },
  );

  const chart: TimeSeriesStackedColumnChartSpec = {
    unit: buildChartUnitOptions(spec, translationDependencies),
    timestamps,
    series: series
      .filter(
        ({ isTotalSeries }) =>
          !isTotalSeries || !hideTotalSeriesBecauseAllBreakdownsAreUniformlyPositiveOrNegative,
      )
      .map(({ name, dataPoints, isTotalSeries, breakdownValues }) => ({
        name,
        dataPoints,
        isTotal: isTotalSeries,
        breakdownValues,
      })),
  };

  return {
    chart,
    summary,
  };
};

export default genericRAQIV2TimeSeriesStackedColumnChartAdapter;
