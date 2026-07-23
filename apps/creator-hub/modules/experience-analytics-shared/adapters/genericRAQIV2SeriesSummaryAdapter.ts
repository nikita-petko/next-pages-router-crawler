import { getComparisonTimeRange, TNumberContextMetadata } from '@modules/charts-generic';
import { RAQIV2MetricGranularity } from '@rbx/creator-hub-analytics-config';
import { ingestAllRaqiV2Series } from './genericRAQIV2ChartAdapter';
import {
  getDefaultSummarySpec,
  RAQIV2SummarySpec,
  summarizeSeriesInfo,
} from './genericRAQIV2ChartSummaryAdapter';
import RAQIV2ChartSpec from '../types/RAQIV2ChartSpec';
import combineRAQIV2QueryResponses, {
  RAQIV2QueryResponses,
} from '../utils/combineRAQIV2QueryResponses';
import { RAQIV2TranslationDependencies } from '../types/RAQIV2DimensionRenderer';
import RAQIV2MetricGranularityToSeriesIntervalMeaning from '../constants/RAQIV2MetricGranularityToSeriesIntervalMeaning';

type GenericRAQIV2TimeSeriesGenericChartAdapterProps = {
  responses: RAQIV2QueryResponses;
  spec: RAQIV2ChartSpec;
  translationDependencies: RAQIV2TranslationDependencies;
  summarySpec?: RAQIV2SummarySpec;
  numberContextMetadata?: TNumberContextMetadata;
};

const genericRAQIV2SeriesSummaryAdapter = ({
  responses,
  spec,
  summarySpec,
  translationDependencies,
  numberContextMetadata,
}: GenericRAQIV2TimeSeriesGenericChartAdapterProps) => {
  const { response, comparisonResponse } = combineRAQIV2QueryResponses(responses);
  const seriesIntervalMeaning = RAQIV2MetricGranularityToSeriesIntervalMeaning(spec.granularity);

  const comparisonDates =
    seriesIntervalMeaning.length === RAQIV2MetricGranularity.None
      ? null
      : getComparisonTimeRange(
          spec.timeSpec.startTime,
          spec.timeSpec.endTime,
          seriesIntervalMeaning,
        );

  const { series } = ingestAllRaqiV2Series({
    response,
    translationDependencies,
    seriesIntervalMeaning,
    spec,
  });

  const comparisonSeries = comparisonResponse
    ? ingestAllRaqiV2Series({
        response: comparisonResponse,
        translationDependencies,
        seriesIntervalMeaning,
        spec: {
          ...spec,
          timeSpec: {
            ...spec.timeSpec,
            startTime: comparisonDates?.comparisonStartDate ?? spec.timeSpec.startTime,
            endTime: comparisonDates?.comparisonEndDate ?? spec.timeSpec.endTime,
          },
        },
      })
    : null;

  return summarizeSeriesInfo(
    series,
    spec,
    summarySpec ?? getDefaultSummarySpec(spec),
    translationDependencies,
    comparisonSeries && comparisonDates
      ? {
          series: comparisonSeries.series,
          startTime: comparisonDates.comparisonStartDate,
          endTime: comparisonDates.comparisonEndDate,
        }
      : null,
    numberContextMetadata,
  );
};

export default genericRAQIV2SeriesSummaryAdapter;
