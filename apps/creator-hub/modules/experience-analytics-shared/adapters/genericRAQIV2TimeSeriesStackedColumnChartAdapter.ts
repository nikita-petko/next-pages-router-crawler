import {
  TimeSeriesStackedColumnChartSpec,
  ChartSummaryItemSpec,
  SeriesIntervalMeaning,
  TNumberContextMetadata,
} from '@modules/charts-generic';
import { buildChartUnitOptions } from './genericRAQIV2ChartAdapter';
import { RAQIV2SummarySpec } from './genericRAQIV2ChartSummaryAdapter';
import RAQIV2ChartSpec from '../types/RAQIV2ChartSpec';
import adaptAllRaqiV2SeriesWithComparisonAndSummary from './genericRAQIV2ChartAdapterWithComparison';
import combineRAQIV2QueryResponses, {
  RAQIV2QueryResponses,
} from '../utils/combineRAQIV2QueryResponses';
import { RAQIV2TranslationDependencies } from '../types/RAQIV2DimensionRenderer';

type GenericRAQIV2TimeSeriesStackedColumnChartAdapterProps = {
  responses: RAQIV2QueryResponses;
  spec: RAQIV2ChartSpec;
  translationDependencies: RAQIV2TranslationDependencies;
  seriesIntervalMeaning: SeriesIntervalMeaning;
  summarySpec: RAQIV2SummarySpec;
  hideTotalSeriesBecauseAllBreakdownsAreUniformlyPositiveOrNegative?: boolean;
  numberContextMetadata?: TNumberContextMetadata;
};

const genericRAQIV2TimeSeriesStackedColumnChartAdapter = ({
  responses,
  spec,
  translationDependencies,
  seriesIntervalMeaning,
  summarySpec,
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
      seriesIntervalMeaning,
      spec,
    },
    summarySpec,
    comparisonResponse,
    numberContextMetadata,
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
